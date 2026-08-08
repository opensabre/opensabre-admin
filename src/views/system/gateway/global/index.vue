<template>
  <div class="app-container gateway-tabs-page">
    <el-card shadow="never" class="gateway-tabs-page__tabs">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="全局过滤器" name="filters" />
        <el-tab-pane label="跨域规则" name="cors" />
      </el-tabs>
    </el-card>

    <GatewayRoute v-if="activeTab === 'filters'" section="policies" />
    <GatewayPlanned v-else title="跨域规则" />
  </div>
</template>

<script setup lang="ts">
import GatewayPlanned from "@/views/system/gateway/planned/index.vue";
import GatewayRoute from "@/views/system/gateway-route/index.vue";

defineOptions({ name: "GatewayGlobalRules" });

type GlobalTab = "filters" | "cors";

const route = useRoute();
const activeTab = ref<GlobalTab>(route.path.endsWith("/cors") ? "cors" : "filters");

watch(
  () => route.path,
  (path) => {
    activeTab.value = path.endsWith("/cors") ? "cors" : "filters";
  }
);
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
