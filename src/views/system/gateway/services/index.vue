<template>
  <div class="app-container">
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <div class="font-medium">服务目录</div>
            <div class="mt-1 text-xs text-gray-400">
              服务状态来自 Nacos；即时资源指标来自 Actuator，流量指标预留 Prometheus 数据源
            </div>
          </div>
          <el-button type="primary" :loading="loading" @click="loadServices">刷新</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="services" row-key="name">
        <el-table-column type="expand">
          <template #default="scope">
            <el-table :data="scope.row.instances" size="small" class="mx-4 mb-3 w-auto">
              <el-table-column label="实例地址" min-width="180">
                <template #default="instance">
                  {{ instance.row.ip }}:{{ instance.row.port }}
                </template>
              </el-table-column>
              <el-table-column prop="cluster" label="集群" min-width="120" />
              <el-table-column label="健康" width="90">
                <template #default="instance">
                  <el-tag :type="instance.row.healthy ? 'success' : 'danger'">
                    {{ instance.row.healthy ? "健康" : "异常" }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="启用" width="80">
                <template #default="instance">{{ instance.row.enabled ? "是" : "否" }}</template>
              </el-table-column>
              <el-table-column prop="weight" label="权重" width="80" />
              <el-table-column label="请求/秒" width="110">
                <template #default="instance">
                  {{ formatNumber(metricOf(instance.row)?.requestRate) }}
                </template>
              </el-table-column>
              <el-table-column label="5xx/秒" width="100">
                <template #default="instance">
                  {{ formatNumber(metricOf(instance.row)?.errorRate) }}
                </template>
              </el-table-column>
              <el-table-column label="P95" width="100">
                <template #default="instance">
                  {{ formatLatency(metricOf(instance.row)?.p95Latency) }}
                </template>
              </el-table-column>
              <el-table-column label="CPU" width="90">
                <template #default="instance">
                  {{ formatPercent(metricOf(instance.row)?.cpuUsage) }}
                </template>
              </el-table-column>
              <el-table-column label="堆内存" width="160">
                <template #default="instance">
                  {{ formatHeap(metricOf(instance.row)?.heapUsed, metricOf(instance.row)?.heapMax) }}
                </template>
              </el-table-column>
              <el-table-column label="运行时长" width="110">
                <template #default="instance">
                  {{ formatUptime(actuatorOf(instance.row)?.snapshot?.uptimeSeconds) }}
                </template>
              </el-table-column>
              <el-table-column label="线程" width="80">
                <template #default="instance">
                  {{ actuatorOf(instance.row)?.snapshot?.liveThreads ?? "无数据" }}
                </template>
              </el-table-column>
              <el-table-column label="指标状态" min-width="150" show-overflow-tooltip>
                <template #default="instance">
                  {{ actuatorStatus(instance.row) }}
                </template>
              </el-table-column>
              <el-table-column label="元数据" min-width="220" show-overflow-tooltip>
                <template #default="instance">{{ metadataText(instance.row.metadata) }}</template>
              </el-table-column>
            </el-table>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="服务名称" min-width="220" />
        <el-table-column prop="instanceCount" label="实例数" width="100" />
        <el-table-column label="请求/秒" width="110">
          <template #default="scope">{{ formatNumber(serviceRequestRate(scope.row)) }}</template>
        </el-table-column>
        <el-table-column label="5xx/秒" width="100">
          <template #default="scope">{{ formatNumber(serviceErrorRate(scope.row)) }}</template>
        </el-table-column>
        <el-table-column label="健康实例" width="140">
          <template #default="scope">
            <el-tag
              :type="
                scope.row.healthyInstanceCount === scope.row.instanceCount ? 'success' : 'warning'
              "
            >
              {{ scope.row.healthyInstanceCount }} / {{ scope.row.instanceCount }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="API 操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewApis(row.name)">查看 API</el-button>
            <el-button link type="success" :loading="syncingService === row.name" @click="syncApis(row.name)">同步</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="query.page"
        v-model:limit="query.pageSize"
        @pagination="loadServices"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import GatewayServiceAPI from "@/api/gateway-admin/gateway-service";
import GatewayApiRouteAPI from "@/api/gateway-admin/gateway-api-route";
import type {
  ApplicationInstanceActuator,
  GatewayServiceInstance,
  GatewayServiceSummary,
} from "@/types/api/gateway-service";
import {
  applicationMetricsByInstance,
  actuatorMetricsByInstance,
  instanceActuator,
  instanceMetrics,
  type ApplicationInstanceMetrics,
} from "./application-metrics";

defineOptions({ name: "GatewayServices" });

const loading = ref(false);
const total = ref(0);
const services = ref<GatewayServiceSummary[]>([]);
const metrics = ref(new Map<string, ApplicationInstanceMetrics>());
const actuatorMetrics = ref(new Map<string, ApplicationInstanceActuator>());
const query = reactive({ page: 1, pageSize: 20 });
const router = useRouter();
const syncingService = ref("");

async function loadServices() {
  loading.value = true;
  try {
    const result = await GatewayServiceAPI.list(query);
    services.value = result.services || [];
    total.value = result.total || 0;
    loading.value = false;
    const [metricSnapshot, actuatorSnapshots] = await Promise.all([
      GatewayServiceAPI.getApplicationMetrics().catch(() => undefined),
      GatewayServiceAPI.getActuatorMetrics(query).catch(() => []),
    ]);
    metrics.value = applicationMetricsByInstance(metricSnapshot);
    actuatorMetrics.value = actuatorMetricsByInstance(actuatorSnapshots);
  } finally {
    loading.value = false;
  }
}

function metricOf(instance: GatewayServiceInstance) {
  const prometheus = instanceMetrics(metrics.value, instance);
  const actuator = actuatorOf(instance)?.snapshot;
  return {
    ...prometheus,
    cpuUsage: actuator?.processCpuUsage ?? prometheus?.cpuUsage,
    heapUsed: actuator?.heapUsedBytes ?? prometheus?.heapUsed,
    heapMax: actuator?.heapMaxBytes ?? prometheus?.heapMax,
  };
}

function actuatorOf(instance: GatewayServiceInstance) {
  return instanceActuator(actuatorMetrics.value, instance);
}

function actuatorStatus(instance: GatewayServiceInstance) {
  const result = actuatorOf(instance);
  return result?.errorMessage || (result?.snapshot ? "正常" : "无数据");
}

function serviceRequestRate(service: GatewayServiceSummary) {
  return sumMetric(service, "requestRate");
}

function serviceErrorRate(service: GatewayServiceSummary) {
  return sumMetric(service, "errorRate");
}

function sumMetric(service: GatewayServiceSummary, field: "requestRate" | "errorRate") {
  const values = service.instances.map((item) => metricOf(item)?.[field]).filter((value) => value != null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) : undefined;
}

function formatNumber(value?: number) {
  return value == null ? "无数据" : value.toFixed(2);
}

function formatLatency(value?: number) {
  return value == null ? "无数据" : `${(value * 1000).toFixed(0)} ms`;
}

function formatPercent(value?: number) {
  return value == null ? "无数据" : `${(value * 100).toFixed(1)}%`;
}

function formatHeap(used?: number, max?: number) {
  if (used == null || max == null || max <= 0) return "无数据";
  return `${formatBytes(used)} / ${formatBytes(max)}`;
}

function formatBytes(value: number) {
  return `${(value / 1024 / 1024).toFixed(0)} MB`;
}

function formatUptime(seconds?: number) {
  if (seconds == null) return "无数据";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return days ? `${days} 天 ${hours} 小时` : `${hours} 小时`;
}

function metadataText(metadata: Record<string, string>) {
  return (
    Object.entries(metadata || {})
      .map(([key, value]) => `${key}=${value}`)
      .join(", ") || "-"
  );
}

async function viewApis(serviceId: string) {
  await router.push({ path: "/gateway/api-routes", query: { serviceId } });
}

async function syncApis(serviceId: string) {
  syncingService.value = serviceId;
  try {
    const result = await GatewayApiRouteAPI.syncApis(serviceId);
    const type = result.missing > 0 ? "warning" : "success";
    ElMessage({
      type,
      message: `同步完成：发现 ${result.discovered}，新增 ${result.created}，更新 ${result.updated}，消失 ${result.missing}`,
      duration: 6000,
    });
  } finally {
    syncingService.value = "";
  }
}

onMounted(loadServices);
</script>
