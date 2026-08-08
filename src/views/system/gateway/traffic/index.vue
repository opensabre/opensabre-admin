<template>
  <div class="app-container gateway-tabs-page">
    <el-card shadow="never" class="gateway-tabs-page__tabs">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="限流规则" name="rate-limits" />
        <el-tab-pane label="熔断规则" name="circuit-breakers" />
        <el-tab-pane label="降级策略" name="fallbacks" />
      </el-tabs>
    </el-card>

    <GatewayPlanned :title="activeTitle" />
  </div>
</template>

<script setup lang="ts">
import GatewayPlanned from "@/views/system/gateway/planned/index.vue";

defineOptions({ name: "GatewayTraffic" });

type TrafficTab = "rate-limits" | "circuit-breakers" | "fallbacks";

const route = useRoute();
const activeTab = ref<TrafficTab>(resolveTab());
const tabTitles: Record<TrafficTab, string> = {
  "rate-limits": "限流规则",
  "circuit-breakers": "熔断规则",
  fallbacks: "降级策略",
};
const activeTitle = computed(() => tabTitles[activeTab.value]);

watch(
  () => route.path,
  () => {
    activeTab.value = resolveTab();
  }
);

function resolveTab(): TrafficTab {
  if (route.path.endsWith("/circuit-breakers")) return "circuit-breakers";
  if (route.path.endsWith("/fallbacks")) return "fallbacks";
  return "rate-limits";
}
</script>

<style scoped>
.gateway-tabs-page__tabs {
  margin-bottom: 16px;
}

.gateway-tabs-page__tabs :deep(.el-card__body) {
  padding-bottom: 0;
}

.gateway-tabs-page :deep(.app-container) {
  padding: 0;
}
</style>
