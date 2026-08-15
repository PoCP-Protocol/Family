# TENANCY-001 — 所有权与多租户架构契约 V1(ARCHITECTURE CONTRACT ONLY)

```text
DOC_KIND       = ARCHITECTURE_CONTRACT
STATUS         = DRAFT(待总架构师 change-review;AUTO_MERGE=NO)
BASIS          = 裁决 M3-W2R-104-VALIDATION-CORRECTION-001 Task F(AUTHORIZED_NOW)
BASE           = origin/master @ 3fe24c9092a33065743e9e4b737890ae86846fd7
SCOPE          = 仅冻结所有权/租户不变量的架构契约
DB_CHANGE      = 0    (无迁移、无 schema、无 CHECK)
RUNTIME_CHANGE = 0    (无代码、无服务、无 flag)
DESCRIBED_WITH = Object + Attribute + Relation + State + NamedAction(RB-003 词汇,仅作描述)
NON_GOAL       = 不建 Generic Object Engine / EAV / 图数据库(ATTRIBUTE_TREE_STANDARD_V1 §7 红线)
```

> 本文件**只冻结契约**。它不引入任何数据库对象、运行时代码或特性开关。所有 schema/runtime 落地均为后续独立 gate,须单独授权。

---

## 0. 为什么需要这份契约(问题陈述)

平台正从"单一家庭内部 dogfood"走向"组织(机构/学校/顾问)为家庭提供服务、社区内容发布、账号与支付"。若不先冻结**谁拥有数据、谁只是被授权访问**,极易滑向危险的隐式假设:
- 把"付费方"当"数据所有者";
- 把"组织成员身份"当"家庭内权限";
- 把"账号"等同"人";
- 把家庭数据默认对组织/社区可见。

本契约在写任何多租户 schema 之前,把上述边界**显式冻结为不变量**。

## 1. 顶层原则(INVARIANTS — 不可协商)

```text
INV-1  FAMILY_OWNS_DATA         家庭是其成长域数据的唯一所有者(owner)。
INV-2  ORG_NOT_OWNER           组织(Organization)永不成为家庭数据的 owner;组织只能持有被显式授予的 AccessGrant。
INV-3  ACCOUNT_NOT_PERSON      Account(登录凭证主体)≠ Person(家庭中的真人)。一个 Account 可绑定 0..N 个 Person 身份。
INV-4  PERSON_NOT_TENANT       Person 不是租户边界。数据不以 Person 为 owner 根,而以 Family 为 owner 根。
INV-5  COMMUNITY_NOT_TENANT    Community 不是租户,不拥有家庭数据;它只是"经显式边界发布后的内容"的呈现域。
INV-6  PAYMENT_NOT_OWNERSHIP   Payment/订阅关系不转移数据所有权,也不隐含访问权;付费方≠owner≠被授权方。
INV-7  ORG_ROLE_NOT_FAMILY_ROLE 组织内角色(如机构管理员)与家庭内角色(如监护人)是两套正交角色系统,互不自动映射。
INV-8  EXPLICIT_BOUNDARY_ONLY  跨边界的可见性(家庭→组织、家庭→社区)只能经显式 NamedAction 授予,绝无隐式/默认打开。
INV-9  FAIL_CLOSED             任何未被显式授予的跨边界访问 = 拒绝。缺省即最小可见。
INV-10 NO_GENERIC_ENGINE      本契约的落地必须是"每类对象的显式 schema + 显式关系表",禁止 EAV/通用属性引擎/图数据库承载所有权。
```

## 2. 对象(Objects — 描述用途,非运行时)

以 RB-003 `FAMILY_OBJECT_UNIVERSE_V1` 词汇描述本契约涉及的对象。**新增对象仅为契约描述,不在本 PR 落 schema。**

| Object | 是否 owner 根 | 关键定义 | 与既有 canonical 关系 |
|---|---|---|---|
| **Family** | ✅ 唯一 owner 根 | 成长域数据的所有权根。 | 既有 `families`。 |
| **Person** | ❌ | 家庭中的真人(child/guardian/...)。身份,非所有权根,非租户。 | 既有 `persons`(含 `account_id`)。 |
| **Account** | ❌ | 登录凭证主体(会话/OTP 绑定)。可映射多个 Person。 | 既有 IAM `persons.account_id` 复用点。 |
| **Organization** | ❌(独立 owner 根,但**非家庭数据 owner**) | 机构/学校/顾问实体。拥有自身组织数据,绝不拥有家庭数据。 | **新对象**(契约描述,未落 schema)。 |
| **Community** | ❌ | 内容呈现域。仅承载"经显式发布的内容对象",不承载家庭 canonical。 | **新对象**(契约描述)。 |

关系对象(join,契约描述):

| Relation Object | 语义 | owner 侧 | 不变量锚 |
|---|---|---|---|
| **FamilyMembership** | Person 属于 Family 的成员关系 + 家庭内角色。 | Family | INV-1/INV-7 |
| **OrganizationMembership** | Person/Account 属于 Organization + 组织内角色。 | Organization | INV-2/INV-7 |
| **FamilyServiceEngagement** | Family 与 Organization 之间的"服务关系"(机构为家庭提供服务)。**存在服务关系 ≠ 数据可见**。 | Family(被服务方持有终止权) | INV-2/INV-6/INV-8 |
| **AccessGrant** | 家庭显式授予某 Organization/Person 对**特定数据范围、特定用途、可撤销、可过期**的访问。 | Family(授予方) | INV-8/INV-9 |
| **Payment** | 付费/订阅事实。 | 付费方 | INV-6(不授予任何数据权) |

## 3. 属性要点(Attribute — 仅标注 owner/truth_type/mutability 立场)

沿用 `ATTRIBUTE_TREE_STANDARD_V1` 的 `owner / truth_type / mutability`。本契约冻结的是**归属**,非字段清单:
- Family 成长域属性:`owner=Family`,`mutability=named_action_only`。组织/社区侧**永不**成为其 owner。
- AccessGrant 的 `scope / purpose / expires_at / revoked_at`:`owner=Family`;组织侧只读。
- OrganizationMembership 的组织角色:`owner=Organization`;**不得**投影为家庭内权限(INV-7)。

## 4. 关系图约束(Relation Graph — 边的方向与可见性)

```text
Account  --binds-->      Person         (N..N;binds ≠ owns)
Person   --member_of-->  Family         (FamilyMembership;家庭角色仅在此边有效)
Person   --member_of-->  Organization   (OrganizationMembership;组织角色仅在此边有效)
Family   --engages-->    Organization   (FamilyServiceEngagement;engages ≠ grants access)
Family   --grants-->     Organization/Person (AccessGrant;唯一的跨边界可见性来源)
Family   --publishes-->  Community       (仅"发布内容对象",经显式 NamedAction;canonical 不过界)
Payer    --pays_for-->   Family/Org      (Payment;pays_for ≠ owns ≠ can_access)
```

**禁止的边(反例,契约明令不存在)**:`Organization --owns--> Family数据`、`Payment --grants--> 访问`、`OrganizationMembership --implies--> 家庭权限`、`Community --reads--> 家庭 canonical`。

## 5. 状态与命名动作(State + NamedAction — 授权唯一入口)

跨边界可见性的每一次变化都必须经**显式 NamedAction**(唯一 canonical 写口;AI 不得直写):

| NamedAction | 主体 | 效果 | 状态迁移 | 不变量 |
|---|---|---|---|---|
| `EstablishServiceEngagement` | Family 监护人 | 建立 FamilyServiceEngagement | `NONE → ACTIVE` | INV-2:不改数据 owner |
| `GrantAccess` | Family 监护人 | 创建 AccessGrant(scope+purpose+expiry) | `→ GRANTED` | INV-8:显式、最小、可撤 |
| `RevokeAccess` | Family 监护人 | 撤销 AccessGrant | `GRANTED → REVOKED` | INV-9:撤销即失访问 |
| `TerminateEngagement` | Family 监护人 | 终止服务关系 | `ACTIVE → TERMINATED` | 连带失活相关 Grant |
| `PublishToCommunity` | Family 成员(授权) | 将**内容对象**发布到 Community | `PRIVATE → PUBLISHED` | INV-5:仅内容对象,canonical 不过界 |
| `UnpublishFromCommunity` | 发布者/监护人 | 撤回发布 | `PUBLISHED → PRIVATE` | 可逆 |

> 组织"读取家庭数据"在运行时必须解析为:存在**未过期、未撤销、purpose 匹配**的 AccessGrant;否则 FAIL CLOSED(INV-9)。本契约冻结此判定语义,不落实现。

## 6. §7 边界重申(禁止通用引擎)

本契约用 Object/Attribute/Relation/State/NamedAction **描述**边界,但落地形态被 `ATTRIBUTE_TREE_STANDARD_V1 §7` 约束:
- 每类关系对象(FamilyMembership / OrganizationMembership / FamilyServiceEngagement / AccessGrant)在未来落地时**各自一张显式表 + 显式外键 + 显式 CHECK**;
- **禁止**用单一 EAV 表 / 属性图 / 通用对象引擎承载所有权与授权(会把 INV-1..INV-10 变成运行时可绕过的软约定);
- 所有权与授权是**硬 schema 不变量**,不是可配置的通用属性。

## 7. 对既有 canonical 的影响

```text
本 PR 影响 = 0 行 schema / 0 行 runtime。
既有 families/persons/consents/growth_* 表:不改。
IAM(persons.account_id / 会话):不改;本契约仅将其命名为 Account↔Person 映射并冻结 ACCOUNT_NOT_PERSON。
```

## 8. 后续(均需独立授权,不在本 PR)

```text
TENANCY-002  AccessGrant/Engagement schema 迁移(FAIL CLOSED 判定实现)   [未授权]
TENANCY-003  Organization/OrganizationMembership schema                  [未授权]
TENANCY-004  Community 发布内容对象 schema + PublishToCommunity 落地      [未授权]
边界:不合 master;无 flag;无 pilot。本契约 PASS 前不得启动上述任何一项 schema/runtime 落地。
```

## 9. 审阅请求

请总架构师就以下裁定:
1. INV-1..INV-10 是否为正确、完整的所有权/租户不变量集合?
2. 关系对象划分(Membership × 2 / Engagement / AccessGrant / Payment 分离)是否正确?
3. NamedAction 清单(第 5 节)是否为跨边界可见性的**唯一**授权入口?
4. §7 边界(每关系一显式表、禁通用引擎)是否作为 TENANCY-002+ 落地的硬约束?

`AUTO_MERGE=NO`。批准即冻结为 TENANCY 基线契约,后续 schema 各自过 gate。
