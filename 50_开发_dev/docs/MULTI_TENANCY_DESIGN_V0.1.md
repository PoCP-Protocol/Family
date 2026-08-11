# Family 多租户移植设计 V0.1(RLS-first)

status: PROPOSAL_NOT_AUTHORIZED
author: Claude(借鉴 Bole.ai 多租户范式)
as_of: 2026-08-11
depends_on: 本文档是治理输入,**不含代码/schema 变更**。落地须走 `CONTRACT_CHANGE_REQUEST` + AI-00 批准,且不得早于相应 Sprint 授权。

---

## 0. 一句话

把 Bole.ai 已验证的"共享库 + 行级 `tenant_id` 隔离 + 统一 Principal 三入口"范式,**用 NestJS/TS 重写**移到 Family;并针对 Bole 的命门(隔离靠手写 filter)做**核心升级 —— 用 PostgreSQL Row-Level Security(RLS)把隔离从"开发纪律"变成"数据库机制"**。

---

## 1. 目的与范围

### 目的
让一套 Family 部署同时服务多个**机构(Tenant)**(榜样教育加盟商 / 学校 / 区域运营商),机构间数据物理不可见,共享同一套代码与库。

### 范围内(本设计覆盖)
- `tenants` 根表 + 每业务表 `tenant_id`。
- PostgreSQL RLS 隔离机制。
- NestJS 请求级租户上下文(AsyncLocalStorage)+ Guard。
- 认证从裸 `x-actor-id` 升级到可解析主体的分阶段路径。

### 范围外(本设计明确不做 / 后置)
- Family Total Score / Ranking(硬规则永久禁止,与本设计无关)。
- 租户内 RBAC 细粒度权限矩阵(Bole 有 Role/UserRole/module grant;Family 可后置为独立 Task)。
- 订阅套餐 / 计费门(Bole 有 `require(action, module)`;后置)。
- 数字人 / Model Gateway / Agent Runtime 等 M3 未授权能力。

---

## 2. 现状与差距(只读实测 2026-08-11)

| 维度 | Family 现状 | Bole.ai 现成 |
|---|---|---|
| 后端栈 | NestJS + PostgreSQL 15,**裸 SQL**(`family.service.ts` `insert...returning`),OpenAPI-first,模块化单体 | Python/FastAPI/SQLAlchemy |
| 认证 | 仅 `x-actor-id` 请求头,**无校验、无 Guard、无 JWT**(`family.controller.ts:38`) | `Principal`:JWT人 / `X-Bole-Api-Key`机 / `X-Bole-Admin-Key`台 |
| 租户 | **无任何租户/机构概念**;19 张表全从 `families` 起,根上无 tenant | `Tenant` 表 + 每表 `tenant_id` + 复合索引 |
| 隔离强制 | 不适用 | **手写 `.filter(tenant_id=)`**(⚠️漏一处即串租户) |
| RBAC | 无 | Role/UserRole/RoleModuleGrant |

**结论**:栈不同 → 借设计不搬代码;Family 用裸 SQL → 天然适合 RLS,应就此补强 Bole 的隔离命门。

---

## 3. 核心设计决策

| # | 决策 | 理由 |
|---|---|---|
| D1 | **共享库 + 行级 `tenant_id`**(非分库) | 与 Bole 一致;运维简单;跨租户平台级统计可行 |
| D2 | **RLS 为第一隔离层,应用层过滤为第二层**(纵深防御) | 升级 Bole 命门:即使某条 SQL 忘了带 `tenant_id`,DB 也拦住 |
| D3 | `tenant_id uuid NOT NULL` 铺到**每张业务表**(含子表);基础设施表按表定策略 | 无 NULL 逃逸;RLS 才能全覆盖 |
| D4 | 请求级租户上下文用 **NestJS AsyncLocalStorage(ALS)**,不靠层层传参 | 裸 SQL 也能在连接上 `SET LOCAL app.current_tenant` |
| D5 | 认证**分阶段**:先保留 `x-actor-id` 但加 `x-tenant-id`(或从 principal 解析),后续再上 JWT/ApiKey | 不一次性推翻现有薄认证,降低对冻结契约冲击 |
| D6 | `tenant_id` 一旦写入**不可变**(no UPDATE across tenant) | 防越权搬数据;RLS `WITH CHECK` 强制 |
| D7 | **Branch(校区/门店/班级)= 租户内二级组织**;`branch_id` **只挂锚点表 `families`**,子表经 `family_id` 派生;**tenant=RLS 硬隔离,branch=应用层软范围**(非合规边界) | 对齐 Bole:branch 是运营可见范围不是安全墙;只挂锚点避免反规范化漂移;family 整户归属一个 branch |

---

## 4. 数据模型

### 4.1 `tenants` 根表(草案 DDL,待评审)

```sql
CREATE TYPE tenant_status AS ENUM ('ACTIVE','SUSPENDED','ARCHIVED');

CREATE TABLE IF NOT EXISTS tenants (
  tenant_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          varchar(64) NOT NULL UNIQUE,          -- 登录/子域用
  display_name  varchar(200) NOT NULL,
  status        tenant_status NOT NULL DEFAULT 'ACTIVE',
  api_key_hash  char(64) NULL UNIQUE,                 -- SHA-256,机器主体用;人类走 JWT 时可空
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
```

> 对齐 Bole `Tenant`(slug / api_key_hash / is_active),但 `is_active` 升级为 `status` 三态,命名对齐 Family 既有 `family_status` 风格。

### 4.1b `branches` 租户内二级组织(草案 DDL,Q3 RESOLVED=本期做)

```sql
CREATE TYPE branch_status AS ENUM ('ACTIVE','INACTIVE','ARCHIVED');

CREATE TABLE IF NOT EXISTS branches (
  branch_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(tenant_id),
  code           varchar(64) NOT NULL,               -- 租户内唯一,业务编码
  name           varchar(120) NOT NULL DEFAULT '',
  contact_person varchar(80)  NOT NULL DEFAULT '',
  contact_phone  varchar(32)  NOT NULL DEFAULT '',
  address        varchar(200) NOT NULL DEFAULT '',
  status         branch_status NOT NULL DEFAULT 'ACTIVE',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ux_branches_tenant_code UNIQUE (tenant_id, code)
);
```

> 对齐 Bole `Branch`(tenant_id + code 租户内唯一 + contact + is_active),`is_active`→`status` 三态,PK 用 uuid `branch_id`。`branches` 自身也是受 RLS 管的业务表(带 `tenant_id`)。

### 4.2 `tenant_id` 铺设清单(19 张表逐表裁定)

| 表 | 处理 | 说明 |
|---|---|---|
| `families` | +`tenant_id NOT NULL` **和** +`branch_id uuid NULL REFERENCES branches` | 租户树根 + **branch 锚点**(整户归属一个校区/门店);其余业务表可经它推导,但仍**显式带 `tenant_id`** 以支持 RLS 与索引。`branch_id` 可空(存量/未分配家庭),分配后可迁店(单行 UPDATE) |
| `persons` | +`tenant_id` | |
| `family_relationships` | +`tenant_id` | |
| `life_stage_assignments` | +`tenant_id` | |
| `consents` | +`tenant_id` | PIPL 合规主体,必须隔离 |
| `growth_profiles` | +`tenant_id` | |
| `growth_profile_dimensions` | +`tenant_id`(从父 `growth_profiles` 回填) | 子表无 `family_id`;仍加列以便 RLS 直接生效,不靠 JOIN |
| `growth_priorities` | +`tenant_id` | |
| `interventions`(varchar PK,证据分级干预模板目录) | **不加 `tenant_id`(全局共享)** | Q1 RESOLVED(2026-08-11):经查该表主键为编码非 uuid、无 `family_id`、字段全为循证知识属性(`evidence_grade`/`mechanism`/`contraindications`/`action_templates`);家庭级应用落在另表 `intervention_episodes`(带 `family_id`)。裁定:目录中央策展、循证分级,**全租户只读、写入仅平台管理员**(RLS 见 §5.4)。前向兼容:未来若需租户私有干预,再加**可空 `tenant_id`**(`NULL`=全局),读策略改"本租户 OR NULL",无需重构 |
| `growth_journeys` | +`tenant_id` | |
| `growth_actions` | +`tenant_id` | 注意其 legacy dual-write 仍在审计中,改造须同步 |
| `growth_events` | +`tenant_id` | |
| `perspectives` | +`tenant_id` | `Perspective != Fact` 硬规则不受影响 |
| `evidence_records` | +`tenant_id` | |
| `milestones` | +`tenant_id` | |
| `outcomes` | +`tenant_id` | |
| `audit_logs`(`family_id` 可空) | +`tenant_id NOT NULL` | 审计必须归租户;平台管理员跨租户查审计走 BYPASSRLS 角色 |
| `outbox_events`(无 `family_id`,有 `aggregate_id`) | +`tenant_id NOT NULL` | 事件外发也要带租户;消费侧据此路由 |
| `idempotency_keys` | +`tenant_id`,并入唯一键 `(tenant_id, key)` | 防跨租户幂等键碰撞 |

### 4.3 索引
每张表补 `(tenant_id, <原高频查询列>)` 复合索引(对齐 Bole `ix_*_tenant_*` 做法);原 `family_id` 单列索引在多租户下多数可由 `(tenant_id, family_id)` 覆盖。

---

## 5. RLS 隔离机制(核心升级,Bole 没有)

### 5.1 会话变量
每个请求在事务开始处执行:
```sql
SET LOCAL app.current_tenant = '<tenant_uuid>';
```
（`SET LOCAL` 随事务结束自动清除,连接归池不残留。）

### 5.2 每张受管表启用 RLS + 策略(模板)
```sql
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE families FORCE ROW LEVEL SECURITY;   -- 连表 owner 也受约束

CREATE POLICY tenant_isolation ON families
  USING      (tenant_id = current_setting('app.current_tenant')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::uuid);
```
- `USING` 管可见性(SELECT/UPDATE/DELETE 只见本租户行)。
- `WITH CHECK` 管写入(INSERT/UPDATE 不得写入他租户 `tenant_id`)→ 落实 D6 不可变。

### 5.3 平台管理员通道
平台级跨租户操作(列表 / 统计 / 导入导出)用**独立 DB 角色**带 `BYPASSRLS`,或专用 `SET app.current_tenant = 'ALL'` + 策略放行;严格限于 admin 平面,普通应用连接永不用该角色。

### 5.4 全局模板表
`interventions` 判为全局(Q1),其 RLS 策略为"本租户 OR tenant_id IS NULL(全局模板)只读",写入仍限本租户。

---

## 5b. Branch 租户内数据范围(软隔离,对齐 Bole)

### 5b.1 两层隔离的分工(重要)
| 维度 | 边界性质 | 强制层 | 机制 |
|---|---|---|---|
| **Tenant** | 硬隔离 / 合规边界 | 数据库 | RLS `SET LOCAL app.current_tenant`(§5) |
| **Branch** | 软范围 / 运营可见性 | 应用层 | principal.branch_scope 过滤(本节) |

> Branch **不是**安全墙,是"店长只看本店家庭"这类运营可见范围。因此不进 RLS(RLS 是租户合规边界),放应用层灵活控制。这与 Bole `services/scope.py` 完全一致。

### 5b.2 过滤规则(移植 Bole `apply_branch_scope`)
- `access_all_branches = true`(机器/服务主体、租户管理员)→ **不按 branch 过滤**(仍受 tenant RLS 约束)。
- 否则按 `principal.branch_scope`(允许的 `branch_id` 列表)过滤:family-anchored 查询 `WHERE families.branch_id = ANY(:scope)`;子表经 `family_id` JOIN `families` 再过滤。
- `branch_scope` 为空 → **返回空集**(与 Bole 语义一致,fail-closed)。

### 5b.3 用户→branch_scope 的来源(⚠️ 受现状约束)
Family 现无 users/RBAC(仅 `x-actor-id`),`branch_scope` 无处可取。分阶段:
- **P1(本期)**:家庭创建时可带 `branch_code` 归属;branch 过滤机制与 `branches` CRUD 落地;`branch_scope` 暂由 header `x-branch-scope`(逗号分隔 `branch_id`)提供,缺省=`access_all_branches`(等于不启用 branch 限制,不破坏现有流程)。
- **P2/P3**:随 RBAC 引入 `user_branches`(对齐 Bole `UserBranch`),`branch_scope` 从用户角色解析,header 兜底废弃。

### 5b.4 历史归属
family 迁店 = `families.branch_id` 单行 UPDATE。历史事件按"家庭当前 branch"归属(运营可见性够用);若将来需事件级 branch 快照,再评估,不在本期。

---

## 6. NestJS 运行时改造

### 6.1 租户上下文(ALS)
新增 `TenantContextService`(封装 `AsyncLocalStorage<{ tenantId, actorId, correlationId, branchScope, accessAllBranches }>`)。请求进入时装载,后续 service/repository 无需层层传参即可取当前租户与 branch 范围。

### 6.2 TenantGuard
- 解析租户来源(阶段一:`x-tenant-id` header;阶段二:JWT `tenant_id` claim / `x-api-key` 反查 `api_key_hash`)。
- 校验 `tenants.status = ACTIVE`。
- 写入 ALS。
- 缺失 → 401/403。

### 6.3 连接上的 `SET LOCAL`
在数据访问层(现为裸 `pg` 查询)包一层:每次取连接/开事务后,先 `SET LOCAL app.current_tenant = $tenant`。**这是让 RLS 生效的唯一挂钩点**,集中在一处,不散落到各 service。

### 6.4 与现有 Named Action / Audit / Outbox 对齐
- `tenant_id` 自然流入 `audit_logs` / `outbox_events`(第 4.2 已加列)。
- Named Action meta(现含 `actor`/`correlation_id`/`source`)扩展 `tenant_id`。

---

## 7. 认证升级路径(分阶段,降冲击)

| 阶段 | 主体来源 | 说明 |
|---|---|---|
| P0(现状) | `x-actor-id` | 无租户 |
| P1(本设计最小落地) | `x-tenant-id` + `x-actor-id`(+ 可选 `x-branch-scope`) | 加租户维度 + branch 过滤机制;认证仍薄;先让隔离机制跑起来 |
| P2 | JWT(`sub`+`tenant_id` claim)/ `x-api-key` 反查 | 对齐 Bole Principal;人类登录 + 机器主体 |
| P3 | 平台 Admin Key + 租户生命周期 API + 租户内 RBAC + `user_branches` | 对齐 Bole 全量(含 branch_scope 从角色解析);独立 Sprint |

---

## 8. 迁移顺序(migrations,续 `0010` 之后)

1. `0011_tenants_and_branches` — 建 `tenants` + `branches` + 种子默认租户 `slug=default` / `display_name=默认机构(迁移占位)` / `status=ACTIVE`(Q2 RESOLVED,承接改造前存量行)。
2. `0012_add_tenant_id_columns` — 各表加 `tenant_id`(先 NULL),存量行回填默认租户 id,再改 `NOT NULL`;`families` 另加 `branch_id uuid NULL REFERENCES branches`(可空,存量家庭暂不分配)。
   - **数据归属(Q2)**:生产环境默认租户起始为空或仅承接真实试点营期,dev/test 数据不迁入生产;开发环境存量 dev 数据统一挂 `default`。真实机构进入后新建租户,占位租户可停用/改名。
3. `0013_tenant_indexes` — 复合索引(含 `families(tenant_id, branch_id)`)。
4. `0014_enable_rls` — ENABLE/FORCE RLS + 策略(含 `branches`;branch 过滤不进 RLS,见 §5b.1)。
5. `0015_idempotency_outbox_scope` — 幂等键/outbox 唯一键并入 `tenant_id`。

> 每步可回滚;`0014` 上线前须有"漏挂 `SET LOCAL` 即查不到数据"的负向测试兜底。

---

## 9. 影响评估

### 9.1 对 Contract Freeze
- 加列/加表 = 触碰冻结基线 `M2_WAVE2_CF_V1` → **必须走 `CONTRACT_CHANGE_REQUEST` + AI-00 批准**。
- OpenAPI(`specs/api/openapi-family-platform-v0.2.yaml`)需加租户头/错误码 → 契约版本升级。

### 9.2 对现有 API / 测试
- 所有集成/E2E 测试当前用裸 `x-actor-id`(如 `account_id:'architect-1'`),需补 `x-tenant-id` 或默认租户中间件,否则 RLS 生效后全部查空 → **改造面主要在测试夹具**,业务逻辑几乎不动(隔离下沉到 DB/连接层)。
- `growth_actions` legacy dual-write 与 `growth_journeys.subject_person_id` 的既有约束需在改造中保持,不借机偷加列。

### 9.3 对 Family 硬规则(全部兼容,无冲突)
- 不做 Total Score / Ranking:本设计不涉及。
- Domain Spec 优先 / Named Action / Human Gate / Event+Audit:`tenant_id` 只是横切维度,增强而非绕过这些机制。
- `Perspective != Fact` 等语义规则不受影响。

---

## 10. 风险与开放问题

| ID | 问题 | 需谁裁定 |
|---|---|---|
| ~~Q1~~ | **RESOLVED(2026-08-11)**:`interventions`=全局循证模板目录,不加 `tenant_id`,全租户只读/仅管理员写;隔离落在 `intervention_episodes`。前向兼容预留可空 `tenant_id`。详见 §4.2 | 已裁定 |
| ~~Q2~~ | **RESOLVED(2026-08-11)**:默认租户 `slug=default` / `display_name=默认机构(迁移占位)` / ACTIVE;生产不迁 dev/test 数据,真实机构后续新建。详见 §8 | 已裁定 |
| ~~Q3~~ | **RESOLVED(2026-08-11)**:需要,**本期做**。`branches` 表 + `families.branch_id` 锚点 + 应用层 branch_scope 过滤(非 RLS)。详见 §4.1b/§5b。用户→scope 来源受现无 RBAC 约束,P1 用 header 兜底 | 已裁定=本期做 |
| Q3b(新) | family 迁店后历史事件是否需 branch 快照?本期按"当前 branch"归属 | 产品(后置) |
| Q4 | 平台管理员跨租户能力(列表/统计/导入导出)本期做到哪一步 | 你 |
| R1 | RLS 漏挂 `SET LOCAL` → 查不到数据(fail-closed,安全但会暴露 bug);需负向测试 + 连接层集中挂钩 | 工程 |
| R2 | `current_setting` 类型转换/连接池串用风险 → 强制 `SET LOCAL`(事务级)而非 `SET` | 工程 |

---

## 11. 建议的实施 backlog(待授权,不在本设计内开工)

- `T-MT-000` 影响评估复核 + Q1–Q4 裁定(纯文档)
- `T-MT-001` `tenants` 表 + 默认租户迁移(`0011`)
- `T-MT-001b` `branches` 表 + CRUD + family 创建时 `branch_code` 归属(`0011`)
- `T-MT-002` 全表 `tenant_id` + `families.branch_id` + 回填 + 索引(`0012`/`0013`)
- `T-MT-003` RLS 启用 + 策略 + 负向测试(`0014`)
- `T-MT-004` NestJS TenantContext(ALS,含 branchScope)+ 连接层 `SET LOCAL`
- `T-MT-005` TenantGuard(P1:`x-tenant-id`)+ branch_scope 过滤(`apply_branch_scope` 等价)+ 测试夹具改造
- `T-MT-006` OpenAPI 契约升级 + CCR 关闭
- (后置)`T-MT-100+` P2 认证 / RBAC / 租户生命周期 API / Branch

---

## 附:与 Bole.ai 的对照锚点
Bole 实现见 `D:\Bole.AI\apps\api`:`bole_platform/database.py:35`(Tenant)、`bole_platform/auth/deps.py`(Principal 三入口)、`bole_platform/main.py:197+`(租户生命周期 API)、`docs/POSTGRES-MULTITENANT.md`(设计文档)。本设计**取其范式、补其 RLS 短板**。
