import { store } from "@/store";

/** 管理后台高频选择数据缓存；变更成功和登出时必须主动失效。 */
const TTL = 5 * 60 * 1000;
const entries = new Map<string, { value: unknown; expiresAt: number; pending?: Promise<unknown> }>();

export const useManagementTreeStore = defineStore("managementTree", () => {
  async function load<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const entry = entries.get(key);
    if (entry && entry.expiresAt > Date.now()) return entry.value as T;
    if (entry?.pending) return entry.pending as Promise<T>;
    const pending = loader().then((value) => {
      entries.set(key, { value, expiresAt: Date.now() + TTL });
      return value;
    }).finally(() => { const current = entries.get(key); if (current?.pending) entries.delete(key); });
    entries.set(key, { value: undefined, expiresAt: 0, pending });
    return pending;
  }
  function invalidate(prefix?: string) { [...entries.keys()].filter((key) => !prefix || key.startsWith(prefix)).forEach((key) => entries.delete(key)); }
  return { load, invalidate };
});
export const useManagementTreeStoreHook = () => useManagementTreeStore(store);
