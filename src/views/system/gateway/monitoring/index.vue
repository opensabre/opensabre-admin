<template>
  <div class="app-container">
    <el-card shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <div><div class="font-medium">网关运行状态</div><div class="mt-1 text-xs text-gray-500">实例来自 Nacos，配置加载和路由探测来自最近一次发布确认。</div></div>
          <el-button :loading="loading" @click="load">刷新</el-button>
        </div>
      </template>
      <el-alert v-if="releaseDetail?.release.status === 'PARTIALLY_APPLIED'" title="最近一次发布仅部分实例生效，请进入发布中心重新确认或处理异常实例。" type="warning" :closable="false" class="mb-4" show-icon />
      <el-descriptions :column="3" border class="mb-5">
        <el-descriptions-item label="网关实例">{{ gatewayInstances.length }}</el-descriptions-item>
        <el-descriptions-item label="健康实例">{{ gatewayInstances.filter((item) => item.healthy).length }}</el-descriptions-item>
        <el-descriptions-item label="最近发布">{{ releaseDetail?.release.targetVersion || "-" }}</el-descriptions-item>
      </el-descriptions>
      <el-table v-loading="loading" :data="gatewayInstances" border :row-key="instanceKey">
        <el-table-column label="实例" min-width="180"><template #default="{ row }">{{ row.ip }}:{{ row.port }}</template></el-table-column>
        <el-table-column prop="cluster" label="集群" min-width="120" />
        <el-table-column label="健康" width="90"><template #default="{ row }"><el-tag :type="row.healthy ? 'success' : 'danger'">{{ row.healthy ? "健康" : "异常" }}</el-tag></template></el-table-column>
        <el-table-column label="配置加载" width="120"><template #default="{ row }">{{ instanceRevision(row)?.status || "未确认" }}</template></el-table-column>
        <el-table-column label="路由探测" width="120"><template #default="{ row }">{{ routeProbe(row)?.status || "未探测" }}</template></el-table-column>
        <el-table-column label="加载版本" min-width="180"><template #default="{ row }">{{ instanceRevision(row)?.loadedVersion || "-" }}</template></el-table-column>
        <el-table-column label="异常" min-width="220"><template #default="{ row }">{{ instanceRevision(row)?.errorMessage || routeProbe(row)?.errorMessage || "-" }}</template></el-table-column>
      </el-table>
    </el-card>
    <el-card shadow="never" class="mt-4">
      <template #header><div><div class="font-medium">路由指标</div><div class="mt-1 text-xs text-gray-500">Prometheus 最近 5 分钟即时值；无流量的路由不会出现在列表中。</div></div></template>
      <el-table v-loading="loading" :data="routeMetrics" border row-key="routeId" empty-text="暂无路由指标">
        <el-table-column prop="routeId" label="Route ID" min-width="220" />
        <el-table-column label="请求/秒" width="140"><template #default="{ row }">{{ formatNumber(row.requestRate) }}</template></el-table-column>
        <el-table-column label="5xx/秒" width="140"><template #default="{ row }">{{ formatNumber(row.errorRate) }}</template></el-table-column>
        <el-table-column label="P95 延迟" width="150"><template #default="{ row }">{{ formatLatency(row.p95Latency) }}</template></el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import GatewayServiceAPI from "@/api/gateway-admin/gateway-service";
import GatewayApiRouteAPI from "@/api/gateway-admin/gateway-api-route";
import type { GatewayServiceInstance } from "@/types/api/gateway-service";
import type { GatewayInstanceRevision, GatewayReleaseDetail, GatewayRouteMetricsSnapshot, GatewayRouteProbe } from "@/types/api/gateway-api-route";

defineOptions({ name: "GatewayMonitoring" });
const loading = ref(false);
const gatewayInstances = ref<GatewayServiceInstance[]>([]);
const releaseDetail = ref<GatewayReleaseDetail>();
const metrics = ref<GatewayRouteMetricsSnapshot>();
const routeMetrics = computed(() => {
  const merged = new Map<string, { routeId: string; requestRate?: number; errorRate?: number; p95Latency?: number }>();
  for (const [field, raw] of [["requestRate", metrics.value?.requestRate], ["errorRate", metrics.value?.errorRate], ["p95Latency", metrics.value?.p95Latency]] as const) {
    for (const item of prometheusVector(raw)) {
      const routeId = item.metric.routeId || item.metric.route_id || "unknown";
      const row = merged.get(routeId) || { routeId };
      row[field] = Number(item.value?.[1] || 0);
      merged.set(routeId, row);
    }
  }
  return [...merged.values()].sort((a, b) => (b.requestRate || 0) - (a.requestRate || 0));
});

function instanceKey(instance: GatewayServiceInstance) { return `${instance.ip}:${instance.port}`; }
function matches(instanceId: string, instance: GatewayServiceInstance) { return instanceId === instanceKey(instance) || instanceId.endsWith(instanceKey(instance)); }
function instanceRevision(instance: GatewayServiceInstance): GatewayInstanceRevision | undefined { return releaseDetail.value?.instances.find((item) => matches(item.instanceId, instance)); }
function routeProbe(instance: GatewayServiceInstance): GatewayRouteProbe | undefined { return releaseDetail.value?.routeProbes.find((item) => matches(item.instanceId, instance)); }

async function load() {
  loading.value = true;
  try {
    const [catalog, releases, routeMetricSnapshot] = await Promise.all([GatewayServiceAPI.list({ page: 1, pageSize: 500 }), GatewayApiRouteAPI.listReleases(), GatewayApiRouteAPI.getRouteMetrics().catch(() => undefined)]);
    gatewayInstances.value = (catalog.services || []).filter((service) => /gateway/i.test(service.name)).flatMap((service) => service.instances || []);
    releaseDetail.value = releases[0] ? await GatewayApiRouteAPI.getRelease(releases[0].id) : undefined;
    metrics.value = routeMetricSnapshot;
  } finally { loading.value = false; }
}
function prometheusVector(raw?: string): Array<{ metric: Record<string, string>; value?: [number, string] }> { if (!raw) return []; try { return JSON.parse(raw)?.data?.result || []; } catch { return []; } }
function formatNumber(value?: number) { return value == null ? "-" : value.toFixed(3); }
function formatLatency(value?: number) { return value == null ? "-" : `${(value * 1000).toFixed(0)} ms`; }
onMounted(load);
</script>
