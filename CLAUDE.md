# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**opensabre-admin** (originally vue3-element-admin) is a Vue 3 + Vite + TypeScript + Element-Plus based backend management template, serving as the Vue 3 version of vue-element-admin. It's an enterprise-grade admin dashboard system with comprehensive features including user management, role management, menu management, and system configuration.

## Key Technologies

- **Vue 3** (v3.5.26) with Composition API
- **Vite** (v7.3.0) for build and dev server
- **TypeScript** (v5.9.3) for type safety
- **Element Plus** (v2.13.0) UI component library
- **Pinia** (v3.0.4) for state management
- **Vue Router 4** (v4.6.4) for routing
- **Vue I18n** (v11.2.7) for internationalization
- **UnoCSS** (v66.5.10) for utility-first CSS

## Development Commands

### Core Development
```bash
# Install dependencies (uses pnpm exclusively)
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Type checking
pnpm run type-check

# Preview production build
pnpm run preview
```

### Code Quality
```bash
# Run all linters (ESLint, Prettier, Stylelint)
pnpm run lint

# ESLint only
pnpm run lint:eslint

# Prettier only
pnpm run lint:prettier

# Stylelint only
pnpm run lint:stylelint

# Run lint-staged (for pre-commit)
pnpm run lint:lint-staged
```

### Testing
```bash
# Run tests
pnpm run test

# Run tests with UI
pnpm run test:ui

# Run tests in CI mode
pnpm run test:run

# Run tests with coverage
pnpm run test:coverage
```

### Git Workflow
```bash
# Interactive commit with commitizen
pnpm run commit
```

## Architecture Overview

### Directory Structure
```
src/
├── api/                    # API service modules (auth-api.ts, system/, etc.)
├── assets/                 # Static assets
├── components/            # Reusable components (CURD/, Dict/, ECharts/, etc.)
├── composables/          # Vue composables
├── constants/            # Application constants
├── directive/            # Custom Vue directives (permission)
├── enums/               # TypeScript enums (api/, settings/, system/)
├── lang/                # Internationalization files
├── layouts/             # Layout components (Left, Top, Mix modes)
├── plugins/             # Plugin configurations
│   ├── icons.ts         # Icon setup
│   ├── permission.ts    # Route permission guards
│   ├── websocket.ts     # WebSocket setup
│   └── vxeTable.ts     # VXE Table setup
├── router/              # Vue Router configuration
│   └── guards/          # Route guards (permission.ts)
├── store/               # Pinia state management
│   └── modules/         # Store modules (app, permission, settings, tags-view, user, dict, tenant)
├── styles/              # Global styles
├── types/               # TypeScript definitions
├── utils/               # Utility functions
└── views/               # Page components (dashboard/, system/, demo/, etc.)
```

### Key Architectural Patterns

#### State Management (Pinia)
- Modular store architecture with 7 main modules: app, user, permission, settings, tags-view, dict, tenant
- Uses `useStorage` for persistent state (localStorage/sessionStorage)
- External store access via `use*StoreHook()` pattern (e.g., `useUserStoreHook()`)
- Central logout handling with `resetAllState()` that clears routes, caches, and WebSocket connections

#### Routing and Permission System
- Static routes (`constantRoutes`) for login, error pages, dashboard, redirect
- Dynamic route loading based on user permissions from `MenuAPI.getRoutes()`
- Route meta fields for permissions (`hasPerm`), caching (`keepAlive`), breadcrumbs
- Route guards in `/src/router/guards/permission.ts` handle:
  - Login state verification
  - Dynamic route generation on first navigation
  - 404 detection
  - Multi-tenant context initialization (when enabled)
- Support for multiple layout modes: Left, Top, Mix

#### API Integration Pattern
- Centralized HTTP client in `/src/utils/request.ts`
- 50s timeout with axios
- Request interceptor adds Bearer token (skipped when `Authorization: "no-auth"`)
- Response interceptor:
  - Returns `data` or `{ data, page }` for paginated responses
  - Handles binary responses (blob/arraybuffer) directly
  - Automatic token refresh with request queueing
  - Error messages via ElMessage
  - Special handling for `CHOOSE_TENANT` business code
- API modules organized by domain in `/src/api/`

#### Component Architecture
- Layout components support multiple modes (Left, Top, Mix)
- Composition API with `<script setup>` syntax
- Component auto-import via `unplugin-vue-components` from `src/components` and `src/**/components`
- Auto-import disabled by default (`dts: false`) - re-enable temporarily when adding new components, then disable again

### Entry Points
1. **`/src/main.ts`** - Application bootstrap
2. **`/src/App.vue`** - Root component with ConfigProvider and Watermark
3. **`/src/settings.ts`** - Centralized app config and user preference defaults

### Boot Sequence (main.ts order)
1. Setup directives (v-hasPerm for permissions)
2. Setup router
3. Setup store (Pinia)
4. Setup i18n
5. Register Element Plus icons globally
6. Setup VXE Table and CodeMirror plugins
7. Setup permission guards
8. Setup WebSocket
9. Mount app

## Environment Configuration

### Development Environment (.env.development)
- `VITE_APP_PORT=3000` - Dev server port
- `VITE_APP_BASE_API=/dev-api` - API proxy prefix
- `VITE_APP_API_URL=https://api.youlai.tech/v2` - Backend API (change to `http://localhost:8000` for local backend)
- `VITE_APP_WS_ENDPOINT` - WebSocket endpoint (empty = disabled)
- `VITE_MOCK_DEV_SERVER=false` - Toggle local mock APIs
- `VITE_APP_TENANT_ENABLED=false` - Multi-tenant support
- `VITE_ENABLE_AI_ASSISTANT=true` - AI assistant feature

### Production Environment (.env.production)
- `VITE_APP_BASE_API=/prod-api` - Production API prefix
- `VITE_APP_WS_ENDPOINT=wss://api.youlai.tech/ws` - Production WebSocket (optional)
- Feature flags should match backend configuration

## Important Notes

### Auto-Import Configuration
- Component type declarations are auto-generated, but generation is disabled by default (`dts: false` in vite.config.ts)
- If adding new components that need type declarations, temporarily enable `dts: "src/types/components.d.ts"`, run dev to generate, then set back to `false`
- Same applies to API auto-imports (`dts: "src/types/auto-imports.d.ts"`)

### Mock Data Support
- Mock data located in `/mock/` directory
- Toggle via `VITE_MOCK_DEV_SERVER` environment variable in `.env.development`
- Default is online API, set to `true` for local mock

### Backend Integration
- Compatible with Java backend [youlai-boot](https://gitee.com/youlaiorg/youlai-boot)
- Compatible with Node backend [youlai-nest](https://gitee.com/youlaiorg/youlai-nest)
- Update `VITE_APP_API_URL` in `.env.development` for local backend

#### OpenSabre API Response Specification

**所有 OpenSabre 框架接口统一返回以下结构：**

```json
{
  "code": "000000",
  "mesg": "处理成功",
  "time": "2026-02-04T23:31:05.569Z",
  "data": 数据值或对象
}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | string | 响应码，成功固定为 `"000000"`（6个0） |
| `mesg` | string | 响应消息（注意字段名为 `mesg`，不是 `msg`） |
| `time` | string | 响应时间，ISO 8601 格式 |
| `data` | T | 实际业务数据 |
| `page` | PageMeta \| null | 分页信息，仅列表接口存在（可选） |

**TypeScript 类型定义**（`src/types/api/common.ts`）：

```typescript
export interface ApiResponse<T = any> {
  code: string;
  data: T;
  msg?: string;  // 兼容旧接口
  mesg?: string;  // OpenSabre 标准字段
  time?: string;
  page?: PageMeta | null;
}
```

### Node.js Compatibility
- Requires Node.js `^20.19.0 || >=22.12.0`
- For macOS 11 (Big Sur) users: pnpm override forces esbuild 0.24.2 (instead of 0.27.2) for compatibility

### Git Hooks
- Husky + lint-staged for pre-commit checks
- Commitlint for commit message validation
- Commitizen with cz-git for interactive commit prompts

## Permission System

### Route Permissions
- Dynamic routes loaded based on user roles/permissions
- Route meta field `roles` can specify required roles
- Super admin bypass with `*:*:*` permissions

### Directive Permissions
- `v-hasPerm="['user:query']"` - Hide/show elements based on permission
- Defined in `/src/directives/index.ts`

## Testing

- Uses Vitest with Happy-DOM testing environment
- Configuration in `vitest.config.ts`
- Global test APIs enabled
- Coverage provider: v8
- Test timeout: 10000ms
