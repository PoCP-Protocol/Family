# Family / 伐木累正式测试体验浏览器核验（002）

> **范围：** 本记录核验 34 页原图母版上的正式 Test Experience 热点。浏览器使用本地静态 Web 服务；本次未启动 API 服务，因此页面应走客户端中性文本等价回退，而不是形成领域写入。该结果不替代 PostgreSQL 集成测试。

| 核验项 | 页面 | 浏览器动作 | 观察结果 | 状态 |
|---|---|---|---|---|
| 邀请热点可发现 | `commerce-invite` / UI-15 | 打开直达路由 | 原图邀请页面保持一致；“确认邀请”透明热点在原图按钮位置可被辅助技术发现 | MATCHED |
| 未连接 API 的安全回退 | `commerce-invite` / UI-15 | 点击“确认邀请” | 页面按既定路径进入客户资产页，出现“当前体验回执暂不可用。你可以返回、暂停或现在先不继续。”；未显示 DEV、stub、Gate、policy 或凭证内容 | MATCHED |
| 真实领域写入 | API | 浏览器静态服务未提供 API | 未在浏览器中执行；由 `test-experience.integration.spec.ts` 的隔离 PostgreSQL 3 条集成测试覆盖 | API_TEST_VALIDATED |

## 结论

原图视觉未被新热点改变，且在本地 API 不可达时页面以可访问的中性文本等价安全回退。后续将使用带 `TEST_DATABASE_URL` 的本地 API 进程完成浏览器端真实受控写入联调；仅允许固定 fixture 和零外部副作用。

## 本地认证联调补充

已启动仅连接 `family_test` 的本地 API（端口 3000）并配置 `http://localhost:5173` CORS allowlist 与 credential 传递。静态浏览器页面尝试写入临时本地会话 cookie 时，浏览器环境拒绝保存 cookie；因此**没有**通过 query 参数、前端硬编码身份或 `x-actor-id` 降级绕过认证。受认证写入的完整性继续由真实 PostgreSQL integration suite 覆盖，其中会创建 ACTIVE account、ACTIVE binding、ACTIVE membership 与短期 identity session，再验证 Named Action、family scope、consent、固定 fixture、幂等和零外部副作用。

此限制不改变产品接口：正常浏览器会话仍使用服务端 cookie / Bearer 会话解析；本次未为浏览器验证添加任何客户端凭证旁路。
