# 内部认证管理页面

页面：`src/views/sysadmin/internal-token-keys/index.vue`；API：`src/api/sysadmin/internal-token-key.ts`。

入口“安全认证 / 内部认证”展示 active/previous key ID、配置版本和时间元数据，支持轮换 active 密钥和在保护期后退役 previous 密钥。页面与 API 永不接收或展示密钥内容。

| 操作 | API | 按钮权限 |
| --- | --- | --- |
| 查询状态 | `GET /sysadmin/security/internal-token/keys` | 菜单访问权限 |
| 轮换 | `POST /sysadmin/security/internal-token/keys/rotate` | `sysadmin:internal-token-key:rotate` |
| 退役 previous | `POST /sysadmin/security/internal-token/keys/retire-previous` | `sysadmin:internal-token-key:retire` |

写操作提交 `expectedConfigVersion` 做乐观锁校验。版本冲突时刷新状态，不要盲目重试。轮换与退役必须由后端生成/处理密钥并记录审计。
