/// <reference types="vite/client" />

/**
 * Vite 环境变量类型定义
 */
interface ImportMetaEnv {
  readonly VITE_APP_PORT: number;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_BASE_API: string;
  /** 网关路由控制面地址；迁移完成后设置为 /gateway-admin/routes。 */
  readonly VITE_GATEWAY_ROUTE_API_BASE?: string;
  readonly VITE_APP_API_URL: string;
  readonly VITE_APP_TITLE?: string;
  readonly VITE_APP_TENANT_ENABLED?: string;
  readonly VITE_ENABLE_AI_ASSISTANT?: string;
  readonly VITE_MOCK_DEV_SERVER: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_INFO__: {
  pkg: {
    name: string;
    version: string;
    engines: {
      node: string;
    };
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  buildTimestamp: number;
};
