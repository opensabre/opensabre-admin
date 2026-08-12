<template>
  <div class="app-container">
    <el-row :gutter="16">
      <el-col v-for="item in summaries" :key="item.label" :xs="12" :sm="6">
        <el-card v-loading="loading" shadow="never">
          <div class="text-sm text-gray-500">{{ item.label }}</div>
          <div class="mt-2 text-3xl font-semibold">{{ item.value }}</div>
          <div class="mt-2 text-xs text-gray-400">{{ item.hint }}</div>
        </el-card>
      </el-col>
    </el-row>
    <el-card shadow="never" class="mt-4">
      <template #header>
        <div class="flex justify-between">
          <span class="font-medium">最近发布</span>
          <el-button :loading="loading" @click="load">刷新</el-button>
        </div>
      </template>
      <el-table :data="releases.slice(0, 8)" row-key="id">
        <el-table-column prop="targetVersion" label="配置版本" min-width="190" />
        <el-table-column label="状态" width="150">
          <template #default="{ row }">
            <DictTag v-model="row.status" code="gateway_release_status" />
          </template>
        </el-table-column>
        <el-table-column label="开始时间" min-width="180">
          <template #default="{ row }">{{ formatTime(row.startedTime) }}</template>
        </el-table-column>
        <el-table-column prop="failureReason" label="异常" min-width="260" show-overflow-tooltip />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import GatewayServiceAPI from "@/api/gateway-admin/gateway-service";
import GatewayApiRouteAPI from "@/api/gateway-admin/gateway-api-route";
import type { GatewayRelease } from "@/types/api/gateway-api-route";
import { formatDateTime } from "@/utils/format";

defineOptions({ name: "GatewayDashboard" });
const loading = ref(false);
const serviceCount = ref(0);
const healthyInstances = ref(0);
const apiCount = ref(0);
const runtimeRouteCount = ref(0);
const releases = ref<GatewayRelease[]>([]);
const summaries = computed(() => [
  { label: "注册服务", value: serviceCount.value, hint: "Nacos 服务目录" },
  { label: "健康实例", value: healthyInstances.value, hint: "全部可路由服务" },
  { label: "API 资产", value: apiCount.value, hint: "OpenAPI 已发现" },
  { label: "运行时路由", value: runtimeRouteCount.value, hint: "当前 Nacos 配置" },
]);
async function load() {
  loading.value = true;
  try {
    const [services, apis, config, history] = await Promise.all([
      GatewayServiceAPI.list({ page: 1, pageSize: 500 }),
      GatewayApiRouteAPI.listApis({ page: 1, pageSize: 1 }),
      GatewayApiRouteAPI.getCurrentConfig(),
      GatewayApiRouteAPI.listReleases(),
    ]);
    serviceCount.value = services.total;
    healthyInstances.value = (services.services || []).reduce(
      (sum, item) => sum + item.healthyInstanceCount,
      0
    );
    apiCount.value = apis.total;
    runtimeRouteCount.value = config.routes?.length || 0;
    releases.value = history;
  } finally {
    loading.value = false;
  }
}
function formatTime(value?: string) {
  return value ? formatDateTime(value) : "-";
}
onMounted(load);
</script>
