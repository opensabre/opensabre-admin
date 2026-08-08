<template>
  <div class="app-container gateway-security">
    <el-card shadow="never" class="gateway-security__tabs">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="认证配置" name="authentication" />
        <el-tab-pane label="黑白名单" name="access-lists" />
      </el-tabs>
    </el-card>

    <GatewayRoute v-if="activeTab === 'authentication'" section="authentication" />

    <AccessListPanel v-else />
  </div>
</template>

<script setup lang="ts">
import GatewayRoute from "@/views/system/gateway-route/index.vue";
import AccessListPanel from "@/views/system/gateway/security/AccessListPanel.vue";

defineOptions({ name: "GatewaySecurity" });

type SecurityTab = "authentication" | "access-lists";

const route = useRoute();
const activeTab = ref<SecurityTab>(resolveTab());

watch(
  () => route.fullPath,
  () => {
    activeTab.value = resolveTab();
  }
);

function resolveTab(): SecurityTab {
  if (route.path.endsWith("/access-lists") || route.query.tab === "access-lists") {
    return "access-lists";
  }
  return "authentication";
}
</script>

<style scoped>
.gateway-security__tabs {
  margin-bottom: 16px;
}

.gateway-security__tabs :deep(.el-card__body) {
  padding-bottom: 0;
}

.gateway-security :deep(.app-container) {
  padding: 0;
}
</style>
