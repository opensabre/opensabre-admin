# 字典管理页面

页面位于 `src/views/system/dict/`，API 位于 `src/api/system/dict.ts`，通过 `/sysadmin/v1/dicts` 管理字典类型和字典项。

功能包括分页查询、新增、修改、删除、启用项 options，以及 `DictSelect`、`DictTag` 和 Pinia 字典缓存。前端将服务端标签类型 `N/P/S/W/I/D` 与 Element Plus 的默认、primary、success、warning、info、danger 样式双向转换。

当前管理页使用 Sysadmin CRUD/options API。Framework 0.7 的字典快照注册与完整项读取是另一组治理协议；后端未补齐协议前，不应在页面文档中宣称应用声明可自动同步。
