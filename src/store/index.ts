import type { App } from "vue";
import { store } from "./instance";

// 全局注册 store
export function setupStore(app: App<Element>) {
  app.use(store);
}

export * from "./modules/app";
export * from "./modules/permission";
export * from "./modules/settings";
export * from "./modules/tags-view";
export * from "./modules/user";
export * from "./modules/dict";
export * from "./modules/tenant";
export * from "./modules/product";
export { store };
