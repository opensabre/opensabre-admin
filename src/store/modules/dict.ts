import { store } from "@/store/instance";
import DictAPI from "@/api/system/dict";
import type { DictItemOption } from "@/types/api";
import { STORAGE_KEYS } from "@/constants";

export const useDictStore = defineStore("dict", () => {
  const CACHE_TTL = 5 * 60 * 1000;
  type CacheEntry = { items: DictItemOption[]; loadedAt: number };

  // 字典数据缓存
  const dictCache = useStorage<Record<string, CacheEntry | DictItemOption[]>>(
    STORAGE_KEYS.DICT_CACHE,
    {}
  );

  // 请求队列（防止重复请求）
  const requestQueue: Record<string, Promise<void>> = {};

  /**
   * 缓存字典数据
   * @param dictCode 字典编码
   * @param data 字典项列表
   */
  const cacheDictItems = (dictCode: string, data: DictItemOption[]) => {
    dictCache.value[dictCode] = { items: data, loadedAt: Date.now() };
  };

  const getEntry = (dictCode: string): CacheEntry | undefined => {
    const cached = dictCache.value[dictCode];
    if (!cached) return undefined;
    // 兼容升级前持久化的数组格式，并使其立即刷新。
    return Array.isArray(cached) ? { items: cached, loadedAt: 0 } : cached;
  };

  const isFresh = (dictCode: string) => {
    const entry = getEntry(dictCode);
    return !!entry && Date.now() - entry.loadedAt < CACHE_TTL;
  };

  /**
   * 加载字典数据（如果缓存中没有则请求）
   * @param dictCode 字典编码
   */
  const loadDictItems = async (dictCode: string) => {
    await loadDicts([dictCode]);
  };

  /**
   * 一次加载多个字典，已缓存或正在请求的编码不会重复请求。
   */
  const loadDicts = async (dictCodes: string[]) => {
    const codes = [...new Set(dictCodes.map((code) => code.trim()).filter(Boolean))];
    const waiting = codes.filter((code) => requestQueue[code]).map((code) => requestQueue[code]);
    if (waiting.length) await Promise.all(waiting);

    const missing = codes.filter((code) => !isFresh(code) && !requestQueue[code]);
    if (!missing.length) return;

    const request = DictAPI.getDictItemsBatch(missing)
      .then((groups) => missing.forEach((code) => cacheDictItems(code, groups[code] ?? [])))
      .finally(() => missing.forEach((code) => Reflect.deleteProperty(requestQueue, code)));
    missing.forEach((code) => (requestQueue[code] = request));
    await request;
  };

  /**
   * 获取字典项列表
   * @param dictCode 字典编码
   * @returns 字典项列表
   */
  const getDictItems = (dictCode: string): DictItemOption[] => {
    return getEntry(dictCode)?.items ?? [];
  };

  /**
   * 移除指定字典项
   * @param dictCode 字典编码
   */
  const removeDictItem = (dictCode: string) => {
    if (dictCache.value[dictCode]) {
      Reflect.deleteProperty(dictCache.value, dictCode);
    }
  };

  /**
   * 清空字典缓存
   */
  const clearDictCache = () => {
    dictCache.value = {};
  };

  return {
    loadDictItems,
    loadDicts,
    getDictItems,
    removeDictItem,
    clearDictCache,
  };
});

export function useDictStoreHook() {
  return useDictStore(store);
}
