# Design

## Source of truth
- Status: Active
- Last refreshed: 2026-07-26
- Primary product surfaces: OpenSabre 管理后台
- Evidence reviewed: `src/views/sysadmin/notification/index.vue`、计次场景与使用统计页面、OAuth2 客户端与授权记录页面、动态菜单适配器

## Brand
- Personality: 稳定、清晰、面向系统管理员
- Trust signals: 统一的筛选、表格、状态与反馈组件
- Avoid: 为单个功能引入新的视觉体系或交互模式

## Product goals
- Goals: 相关管理能力集中呈现，减少菜单数量；安全认证能力保持清晰层级
- Non-goals: 重做现有数据表格、统计图表或权限模型
- Success signals: 计次管理和客户端管理分别通过页内 Tab 聚合相关能力；内部 Token 管理位于安全认证下

## Personas and jobs
- Primary personas: 平台管理员、运维人员
- User jobs: 配置计次场景；查看计次使用统计；维护 OAuth2 客户端与服务端授权；轮换内部 Token 密钥
- Key contexts of use: 桌面端管理后台

## Information architecture
- Primary navigation: 系统管理 → 计次管理；安全认证 → 客户端管理 / 内部 Token 管理
- Core routes/screens: `/sysadmin/usage-management`、`/auth/client`、`/auth/internal-token-keys`
- Content hierarchy: 计次管理包含场景管理/使用统计 Tab；客户端管理包含客户端/Token Tab；内部 Token 管理保持独立二级菜单

## Design principles
- Principle 1: 复用通知管理的页内 Tab 模式
- Principle 2: 保留原页面的筛选、表格、图表和权限控制
- Tradeoffs: 旧页面组件继续保留，组合页面负责统一入口

## Visual language
- Color: 沿用 Element Plus 与项目主题
- Typography: 沿用全局字体与字号
- Spacing/layout rhythm: 沿用 `app-container` 和既有卡片间距
- Shape/radius/elevation: 沿用现有卡片与表格
- Motion: 仅使用组件默认切换效果
- Imagery/iconography: 菜单沿用计次相关图标

## Components
- Existing components to reuse: `ElTabs`、计次场景页、使用统计页、OAuth2 客户端页、OAuth2 授权记录页、内部 Token 密钥页
- New/changed components: 计次管理组合页、客户端管理组合页
- Variants and states: 场景管理/使用统计；客户端/Token
- Token/component ownership: 继续由现有管理端主题和组件维护

## Accessibility
- Target standard: 保持 Element Plus 现有语义和键盘行为
- Keyboard/focus behavior: Tab 可通过键盘聚焦与切换
- Contrast/readability: 沿用主题对比度
- Screen-reader semantics: 使用原生 `ElTabs` 语义
- Reduced motion and sensory considerations: 不增加自定义动画

## Responsive behavior
- Supported breakpoints/devices: 沿用现有管理后台断点
- Layout adaptations: 子页面保持原响应式布局
- Touch/hover differences: 沿用 Element Plus 默认行为

## Interaction states
- Loading: 各 Tab 保留原有加载状态
- Empty: 各子页面保留原有空状态
- Error: 沿用全局 API 错误反馈
- Success: 沿用原有操作成功反馈
- Disabled: 沿用权限指令和表单状态
- Offline/slow network, if applicable: 显示原有加载状态

## Content voice
- Tone: 简洁、明确
- Terminology: 菜单“计次管理”“客户端管理”“内部 Token 管理”；Tab“场景管理”“使用统计”“客户端”“Token”
- Microcopy rules: 保留既有字段名称和操作文案

## Implementation constraints
- Framework/styling system: Vue 3、Element Plus、项目现有样式
- Design-token constraints: 不新增设计 Token
- Performance constraints: Tab 延迟挂载，避免首次进入并发加载两组数据
- Compatibility constraints: 保留旧页面组件供已有代码引用
- Test/screenshot expectations: TypeScript 检查与生产构建通过

## Open questions
- 无
