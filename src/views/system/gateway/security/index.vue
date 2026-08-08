<template>
  <div class="app-container gateway-security">
    <el-card shadow="never" class="gateway-security__tabs">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="认证配置" name="authentication" />
        <el-tab-pane label="黑白名单" name="access-lists" />
      </el-tabs>
    </el-card>

    <GatewayRoute v-if="activeTab === 'authentication'" section="authentication" />

    <el-card v-else shadow="never">
      <el-empty description="黑白名单功能规划中">
        <template #image>
          <el-icon :size="72" color="var(--el-color-primary)"><List /></el-icon>
        </template>
        <el-alert
          title="入口已合并到安全管理；规则模型和发布能力将在 base-gateway-admin 后续迭代中实现。"
          type="info"
          :closable="false"
          show-icon
        />
      </el-empty>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { List } from "@element-plus/icons-vue";
import type { TabsPaneContext } from "element-plus";
import GatewayRoute from "@/views/system/gateway-route/index.vue";

defineOptions({ name: "GatewaySecurity" });

type SecurityTab = "authentication" | "access-lists";

const route = useRoute();
const router = useRouter();
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

function handleTabChange(tab: TabsPaneContext["paneName"]) {
  const selected = tab === "access-lists" ? "access-lists" : "authentication";
  router.replace({ path: "/gateway/security", query: { tab: selected } });
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
