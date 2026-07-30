# 架构与边界

`opensabre-admin` 是基于 Vue 3、TypeScript、Vite 和 Element Plus 的管理端。实际业务页面主要位于 `src/views/`，服务调用位于 `src/api/`，路由、状态与权限实现以 `src/router/`、`src/store/` 及相关组件为准。

管理端只负责界面和交互；菜单/按钮可见性由组织服务返回的授权菜单树决定，接口访问授权由后端/网关校验。不得仅凭前端隐藏按钮实现安全控制。
