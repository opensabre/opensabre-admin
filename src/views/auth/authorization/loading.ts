import type { Ref } from "vue";

/**
 * Coordinates a shared loading state across overlapping authorization requests.
 */
export function createLoadingRunner(loading: Ref<boolean>) {
  let pendingCount = 0;

  return async function runWithLoading<T>(operation: () => Promise<T>): Promise<T> {
    pendingCount += 1;
    loading.value = true;
    try {
      return await operation();
    } finally {
      pendingCount -= 1;
      loading.value = pendingCount > 0;
    }
  };
}
