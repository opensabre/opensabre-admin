# 错误码目录页面

页面：`src/views/sysadmin/error-catalog/index.vue`；API：`src/api/sysadmin/error-catalog.ts`。

入口位于“研发管理 / 错误码目录”，提供只读分页检索，可按关键词、应用和废弃状态筛选，并展示错误码范围与定义归属。请求路径为 `GET /sysadmin/error-catalog`。

该页面不修改运行时错误码，也不提供新增/编辑操作。条目由业务应用的 `ErrorCatalogProvider` 启动注册；缺少条目时应先检查应用和 Sysadmin 注册日志。
