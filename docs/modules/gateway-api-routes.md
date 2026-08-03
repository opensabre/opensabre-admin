# API 路由管理

页面：`src/views/system/gateway/api-routes/index.vue`。

该页面把网关管理拆成三类对象：API 资产、API 发布声明和应用级路由。API 资产来自服务 OpenAPI 发现，发现不等于对外发布；应用级通配路由单独展示并标记风险等级。

后端接口：

- `GET /gateway-admin/apis`
- `GET /gateway-admin/api-publications`
- `GET /gateway-admin/application-routes`

菜单由 `base-organization` 迁移 `V20260803_01__add_gateway_api_route_menu.sql` 初始化，入口为“网关 / API 路由管理”。
