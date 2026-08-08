# 字典管理与前端组件

页面位于 `src/views/system/dict/`，API 位于 `src/api/system/dict.ts`，通过
`/sysadmin/v1/dicts` 管理字典类型和字典项。业务页面使用 `DictSelect` 和 `DictTag` 消费启用字典项，
不应在页面内重复维护值与标签映射。

## 数据来源

字典数据集中保存在 `base-sysadmin`，来源包括：

- 管理员通过字典管理页面维护的公共字典。
- 后端应用通过 Framework `DictionaryProvider`，或使用 `DictionaryEnum` +
  `@OpenSabreDictionary` 声明并在启动时注册的代码字典。

前端不参与后端快照注册，只通过统一查询接口读取最终结果。应用注册字典的归属、冲突校验和历史项
停用语义见 Sysadmin 与 Framework 的字典模块文档。

管理页面设计上把字典区分为“后台维护”和“应用枚举”。应用枚举由代码快照负责完整对账，页面根据
接口返回的 `sourceType=ENUM` 禁用其类型和字典项的新增、编辑、删除入口；调整值、标签、排序或颜色
都应修改所属应用代码并重新部署注册。当前 Sysadmin 持久化字段是 `sourceApplication`，接口还需稳定
映射出 `sourceType`，不能只依赖前端类型声明判断来源。

## 页面组件工作流程

```text
页面声明 code + v-model
          │
          ▼
 DictSelect / DictTag
          │
          ▼
 Pinia 是否已有 dictCode 缓存？
      │是                 │否
      ▼                   ▼
 直接使用       GET /sysadmin/v1/dicts/items/options?codes={code}
      │                   │
      └─────────缓存后────┘
                  │
                  ▼
          渲染选项或翻译标签
```

### DictSelect

`DictSelect` 支持 `select`、`radio` 和 `checkbox` 三种渲染方式：

```vue
<DictSelect v-model="formData.event" code="usage_event" />
```

组件挂载后按需加载 `code` 对应的启用项，把字典 `label` 作为展示文本、`value` 作为表单值。
组件兼容字符串、数字和数组；回显时以字符串形式比较值，再使用服务端选项中的原始类型更新选择值。

### DictTag

`DictTag` 用于表格和详情页的值翻译：

```vue
<DictTag v-model="scope.row.event" code="usage_event" />
```

组件按需读取字典，并把业务值翻译为 `label`。字典项配置标签样式时渲染 `el-tag`；没有标签样式时
渲染普通文本，避免所有类型字段被强制显示为高对比色标签。
当字典尚未加载到目标值时，可以通过 `fallback` 提供兜底文本；未提供时回显原始值，避免表格出现
空白。状态、类型、风险等级等后端枚举应优先使用 `DictTag`，不要在页面内编写重复的映射函数。

### 批量加载

字典 Store 统一调用 `GET /sysadmin/v1/dicts/items/options?codes=...` 获取启用项；单个字典也通过
`codes={code}` 调用该批量接口。单页同时使用多个字典时，`useDicts` 会把多个 code 合并为一次请求。
通用组件仍按 `dictCode` 独立缓存，业务页面不应自行建立第二套长期缓存。

## 缓存与并发请求

Pinia 字典 Store 使用 `useStorage` 按 `dictCode` 缓存字典项，因此刷新页面后仍可复用浏览器存储：

1. 已缓存且未超过 5 分钟 TTL 的字典不重复请求。
2. 同一字典首次加载时，`requestQueue` 合并并发请求。
3. 请求失败会清理队列，使下一次调用可以重试。
4. 退出登录或 Session 重置时清空全部字典缓存。
5. `removeDictItem(dictCode)` 可以只使一个字典失效。

缓存内容只来自 `/items/options`，因此只包含启用项；历史停用值的完整回显能力属于后端
`DictionaryService.labelOf`，前端 options 组件不保证显示已停用值。

## 标签样式转换

服务端标签类型与 Element Plus 样式按下表转换：

| 服务端 | 前端 |
| --- | --- |
| `N` | 默认/普通文本 |
| `P` | `primary` |
| `S` | `success` |
| `W` | `warning` |
| `I` | `info` |
| `D` | `danger` |

管理页面保存时执行反向转换，查询时转换为 Element Plus 类型。

## 实时同步边界

前端目前保留了订阅 `/topic/dict` 的 WebSocket 同步骨架，收到包含 `dictCode` 的事件时会删除对应
Pinia 缓存。但端到端实时同步尚未完成：后端还没有把所有字典变更可靠广播给前端，且已经挂载的
组件不会仅因缓存被删除而自动重新加载。因此当前可靠语义是“按需加载、浏览器缓存、退出时清理”；
不能在功能说明中宣称修改字典后所有已打开页面会立即刷新。
