import { computed, onActivated, onDeactivated, ref, watch, type Ref } from "vue";
import { useIntervalFn } from "@vueuse/core";
import type { MonitoringRange } from "@/types/api/gateway-api-route";

export const rangeOptions: MonitoringRange[] = ["15m", "30m", "1h", "2h", "6h", "24h", "7d", "30d"];
export const refreshOptions = [
  { label: "关闭", value: 0 },
  { label: "10秒", value: 10_000 },
  { label: "30秒", value: 30_000 },
  { label: "1分钟", value: 60_000 },
];

// VueUse handles timer disposal; this wrapper also guards async requests and cached pages.
export function useMonitoringRefresh(load: () => Promise<void>, enabled: Ref<boolean> = ref(true)) {
  const refreshInterval = ref(30_000);
  const refreshing = ref(false);
  const active = ref(true);

  async function refresh() {
    if (refreshing.value) return;
    refreshing.value = true;
    try {
      await load();
    } finally {
      refreshing.value = false;
    }
  }

  const { pause, resume } = useIntervalFn(
    () => void refresh().catch(() => undefined),
    computed(() => refreshInterval.value || 30_000),
    { immediate: false }
  );
  watch(
    [enabled, active, refreshInterval],
    () => {
      pause();
      if (enabled.value && active.value && refreshInterval.value > 0) resume();
    },
    { immediate: true, flush: "sync" }
  );
  onActivated(() => (active.value = true));
  onDeactivated(() => (active.value = false));

  return { refreshInterval, refreshing, refresh };
}
