import type { DictItemOption } from "@/types/api";
import { useDictStore } from "@/store";
import type { MaybeRefOrGetter } from "vue";

/**
 * 响应式读取单个字典，供业务组件和页面复用。
 */
export function useDict(dictCode: MaybeRefOrGetter<string>) {
  const dictStore = useDictStore();
  const code = computed(() => toValue(dictCode));
  const options = computed(() => dictStore.getDictItems(code.value));
  const loading = ref(false);

  const refresh = async () => {
    dictStore.removeDictItem(code.value);
    loading.value = true;
    try {
      await dictStore.loadDictItems(code.value);
    } finally {
      loading.value = false;
    }
  };

  const labelOf = (value: unknown) =>
    options.value.find((item) => String(item.value) === String(value))?.label;

  watch(
    code,
    async (value) => {
      if (!value) return;
      loading.value = true;
      try {
        await dictStore.loadDictItems(value);
      } finally {
        loading.value = false;
      }
    },
    { immediate: true }
  );

  return { options, loading: readonly(loading), labelOf, refresh };
}

/**
 * 批量预加载页面所需字典。
 */
export function useDicts(dictCodes: MaybeRefOrGetter<string[]>) {
  const dictStore = useDictStore();
  const loading = ref(false);
  const load = async () => {
    loading.value = true;
    try {
      await dictStore.loadDicts(toValue(dictCodes));
    } finally {
      loading.value = false;
    }
  };
  watch(() => toValue(dictCodes), load, { immediate: true, deep: true });
  return { loading: readonly(loading), refresh: load };
}

export type { DictItemOption };
