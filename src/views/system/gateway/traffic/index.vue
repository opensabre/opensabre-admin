<template>
  <div class="app-container gateway-tabs-page">
    <el-card shadow="never" class="gateway-tabs-page__tabs">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="限流默认值" name="rate-limits" />
        <el-tab-pane label="熔断与降级默认值" name="circuit-breakers" />
        <el-tab-pane label="超时默认值" name="fallbacks" />
      </el-tabs>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <div class="font-medium">全局{{ currentDefinition.title }}</div>
            <div class="mt-1 text-xs text-gray-500">
              这里只维护全局默认值；应用与 API 的继承或自定义配置请到对应路由详情维护。
            </div>
          </div>
          <div class="flex gap-2">
            <el-button :loading="saving" @click="savePolicy">保存</el-button>
            <el-button type="primary" @click="goReleaseCenter">查看并发布全部变更</el-button>
          </div>
        </div>
      </template>

      <el-alert
        title="全局值是管理模型中的默认策略。发布时会计算继承结果并写入各条路由，因此可随 Nacos 路由刷新动态生效，无需重启 Gateway。"
        type="info"
        :closable="false"
        class="mb-5"
      />
      <GovernancePolicySettings
        ref="settingsRef"
        scope-type="GLOBAL"
        :policy-types="[currentDefinition.policyType]"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import type { TabsPaneContext } from "element-plus";
import GovernancePolicySettings from "@/views/system/gateway/components/GovernancePolicySettings.vue";
import type { GatewayGovernancePolicyType } from "@/types/api/gateway-api-route";

defineOptions({ name: "GatewayTraffic" });

type TrafficTab = "rate-limits" | "circuit-breakers" | "fallbacks";
type SettingsExpose = { load: () => Promise<void>; save: () => Promise<void> };

const router = useRouter();
const activeTab = ref<TrafficTab>("rate-limits");
const settingsRef = ref<SettingsExpose>();
const saving = ref(false);
const definitions: Record<
  TrafficTab,
  { title: string; policyType: GatewayGovernancePolicyType; path: string }
> = {
  "rate-limits": {
    title: "限流默认值",
    policyType: "RATE_LIMIT",
    path: "/gateway/traffic/rate-limits",
  },
  "circuit-breakers": {
    title: "熔断与降级默认值",
    policyType: "CIRCUIT_BREAKER",
    path: "/gateway/traffic/circuit-breakers",
  },
  fallbacks: { title: "超时默认值", policyType: "TIMEOUT", path: "/gateway/traffic/fallbacks" },
};
const currentDefinition = computed(() => definitions[activeTab.value]);

async function handleTabChange(name: TabsPaneContext["paneName"]) {
  activeTab.value = name as TrafficTab;
}

async function savePolicy() {
  saving.value = true;
  try {
    await settingsRef.value?.save();
    ElMessage.success("全局默认策略已保存，发布后生效");
  } catch (error) {
    ElMessage.warning(error instanceof Error ? error.message : "策略保存失败");
  } finally {
    saving.value = false;
  }
}

async function goReleaseCenter() { await router.push("/gateway/releases"); }
</script>

<style scoped>
.gateway-tabs-page__tabs {
  margin-bottom: 16px;
}
.gateway-tabs-page__tabs :deep(.el-card__body) {
  padding-bottom: 0;
}
</style>
