# API 路由管理

页面：`src/views/system/gateway/api-routes/index.vue`。

该页面把网关管理拆成三类对象：API 资产、API 发布声明和应用级路由。API 资产来自服务 OpenAPI 发现，发现不等于对外发布；应用级通配路由单独展示并标记风险等级。

应用级路由沿用显式路由的定义方式，可配置优先级、多条 Path/Method/Host/Header 等断言，
以及 StripPrefix、RewritePath、Retry、CircuitBreaker 等过滤器。保存操作只生成控制面草稿，
仍需通过统一发布流程写入网关运行配置。

后端接口：

- `GET /gateway-admin/apis`
- `GET /gateway-admin/api-publications`
- `GET /gateway-admin/application-routes`

菜单由 `base-organization` 初始化并维护，入口为“网关 / 路由管理”。

页面内的保存操作仅形成草稿。正式生效统一进入“网关 / 发布中心”，预检并发布当前全部
待生效变更，避免把全量原子发布误解为单条路由的局部发布。

当前运行配置中的非托管路由以只读记录展示，可执行“纳管”生成应用路由草稿。纳管不会
立即修改 Nacos；正式发布时由控制面以一次 CAS 原子替换旧 Route ID 和新托管 Route。
