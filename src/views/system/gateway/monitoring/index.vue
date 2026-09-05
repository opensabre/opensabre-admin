<template>
  <div class="app-container">
    <el-card shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <div class="font-medium">网关运行状态</div>
            <div class="mt-1 text-xs text-gray-500">
              实例来自 Nacos，配置加载和路由探测来自最近一次发布确认。
            </div>
          </div>
          <el-button :loading="loading" @click="load">刷新</el-button>
        </div>
      </template>
      <el-alert
        v-if="releaseDetail?.release.status === 'PARTIALLY_APPLIED'"
        title="最近一次发布仅部分实例生效，请进入发布中心重新确认或处理异常实例。"
        type="warning"
        :closable="false"
        class="mb-4"
        show-icon
      />
      <el-alert
        v-if="loadWarnings.length"
        :title="loadWarnings.join('；')"
        type="warning"
        :closable="false"
        class="mb-4"
        show-icon
      />
      <el-descriptions :column="3" border class="mb-5">
        <el-descriptions-item label="网关实例">{{ gatewayInstances.length }}</el-descriptions-item>
        <el-descriptions-item label="健康实例">
          {{ gatewayInstances.filter((item) => item.healthy).length }}
        </el-descriptions-item>
        <el-descriptions-item label="最近发布">
          {{ releaseDetail?.release.targetVersion || "-" }}
        </el-descriptions-item>
      </el-descriptions>
      <el-table v-loading="loading" :data="gatewayInstances" border :row-key="instanceKey">
        <el-table-column label="实例" min-width="180">
          <template #default="{ row }">{{ row.ip }}:{{ row.port }}</template>
        </el-table-column>
        <el-table-column prop="cluster" label="集群" min-width="120" />
        <el-table-column label="健康" width="90">
          <template #default="{ row }">
            <el-tag :type="row.healthy ? 'success' : 'danger'">
              {{ row.healthy ? "健康" : "异常" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="配置加载" width="120">
          <template #default="{ row }">{{ instanceRevision(row)?.status || "未确认" }}</template>
        </el-table-column>
        <el-table-column label="路由探测" width="120">
          <template #default="{ row }">{{ routeProbe(row)?.status || "未探测" }}</template>
        </el-table-column>
        <el-table-column label="加载版本" min-width="180">
          <template #default="{ row }">{{ instanceRevision(row)?.loadedVersion || "-" }}</template>
        </el-table-column>
        <el-table-column label="异常" min-width="220">
          <template #default="{ row }">
            {{ instanceRevision(row)?.errorMessage || routeProbe(row)?.errorMessage || "-" }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-card shadow="never" class="mt-4">
      <template #header>
        <div>
          <div class="font-medium">实例运行参数</div>
          <div class="mt-1 text-xs text-gray-500">
            来自各实例当前进程的只读快照；默认值表示未被环境变量、Nacos 或启动参数覆盖。
          </div>
        </div>
      </template>
      <el-alert
        v-if="runtimeSnapshots.some((item) => !item.snapshot)"
        title="部分网关实例运行参数不可用，请检查实例管理端点配置。"
        type="warning"
        :closable="false"
        class="mb-4"
        show-icon
      />
      <el-table
        v-loading="loading"
        :data="runtimeSnapshots"
        border
        row-key="instanceId"
        empty-text="暂无运行参数"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div v-if="row.snapshot" class="runtime-detail">
              <el-descriptions :column="3" border>
                <el-descriptions-item label="Java">
                  {{ row.snapshot.jvm.javaVersion }}
                </el-descriptions-item>
                <el-descriptions-item label="JVM 厂商">
                  {{ row.snapshot.jvm.vendor }}
                </el-descriptions-item>
                <el-descriptions-item label="运行时长">
                  {{ formatUptime(row.snapshot.uptimeSeconds) }}
                </el-descriptions-item>
                <el-descriptions-item label="可用 CPU">
                  {{ row.snapshot.availableProcessors }}
                </el-descriptions-item>
                <el-descriptions-item label="Netty Worker">
                  {{ row.snapshot.netty.workerThreads }}（{{
                    sourceLabel(row, "reactor.netty.ioWorkerCount")
                  }}）
                </el-descriptions-item>
                <el-descriptions-item label="Netty Selector">
                  {{
                    row.snapshot.netty.selectorThreads < 0
                      ? "共享 Worker"
                      : row.snapshot.netty.selectorThreads
                  }}
                </el-descriptions-item>
                <el-descriptions-item label="连接池类型">
                  {{ row.snapshot.httpClient.poolType }}
                </el-descriptions-item>
                <el-descriptions-item label="最大连接数">
                  {{ row.snapshot.httpClient.maxConnections }}（{{
                    sourceLabel(row, "spring.cloud.gateway.httpclient.pool.max-connections")
                  }}）
                </el-descriptions-item>
                <el-descriptions-item label="获取连接超时">
                  {{ formatMillis(row.snapshot.httpClient.acquireTimeoutMillis) }}
                </el-descriptions-item>
                <el-descriptions-item label="连接超时">
                  {{ formatMillis(row.snapshot.httpClient.connectTimeoutMillis) }}
                </el-descriptions-item>
                <el-descriptions-item label="响应超时">
                  {{ formatMillis(row.snapshot.httpClient.responseTimeoutMillis) }}
                </el-descriptions-item>
                <el-descriptions-item label="最大空闲时间">
                  {{ formatMillis(row.snapshot.httpClient.maxIdleTimeMillis) }}
                </el-descriptions-item>
                <el-descriptions-item label="连接最大寿命">
                  {{ formatMillis(row.snapshot.httpClient.maxLifeTimeMillis) }}
                </el-descriptions-item>
                <el-descriptions-item label="活动线程">
                  {{ row.snapshot.jvm.liveThreads }} / 峰值 {{ row.snapshot.jvm.peakThreads }}
                </el-descriptions-item>
                <el-descriptions-item label="非堆内存">
                  {{ formatBytes(row.snapshot.jvm.nonHeapUsedBytes) }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="instanceId" label="实例" min-width="170" />
        <el-table-column label="版本" width="110">
          <template #default="{ row }">{{ row.snapshot?.applicationVersion || "-" }}</template>
        </el-table-column>
        <el-table-column label="路由" width="80">
          <template #default="{ row }">{{ row.snapshot?.routeCount ?? "-" }}</template>
        </el-table-column>
        <el-table-column label="堆内存" min-width="170">
          <template #default="{ row }">
            {{
              row.snapshot
                ? `${formatBytes(row.snapshot.jvm.heapUsedBytes)} / ${formatBytes(row.snapshot.jvm.heapMaxBytes)}`
                : "-"
            }}
          </template>
        </el-table-column>
        <el-table-column label="Worker" width="90">
          <template #default="{ row }">{{ row.snapshot?.netty.workerThreads ?? "-" }}</template>
        </el-table-column>
        <el-table-column label="连接上限" width="100">
          <template #default="{ row }">
            {{ row.snapshot?.httpClient.maxConnections ?? "-" }}
          </template>
        </el-table-column>
        <el-table-column label="异常" min-width="180">
          <template #default="{ row }">{{ row.errorMessage || "-" }}</template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-card shadow="never" class="mt-4">
      <template #header>
        <div>
          <div class="font-medium">路由指标</div>
          <div class="mt-1 text-xs text-gray-500">
            Prometheus 最近 5 分钟即时值；无流量的路由不会出现在列表中。
          </div>
        </div>
      </template>
      <el-alert
        v-if="!routeMetrics.length"
        title="暂无路由流量指标。若网关已有流量，请检查 Prometheus 数据源配置。"
        type="info"
        :closable="false"
        class="mb-4"
        show-icon
      />
      <el-table
        v-loading="loading"
        :data="routeMetrics"
        border
        row-key="routeId"
        empty-text="暂无路由指标"
      >
        <el-table-column prop="routeId" label="Route ID" min-width="220" />
        <el-table-column label="请求/秒" width="140">
          <template #default="{ row }">{{ formatNumber(row.requestRate) }}</template>
        </el-table-column>
        <el-table-column label="5xx/秒" width="140">
          <template #default="{ row }">{{ formatNumber(row.errorRate) }}</template>
        </el-table-column>
        <el-table-column label="P95 延迟" width="150">
          <template #default="{ row }">{{ formatLatency(row.p95Latency) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import GatewayServiceAPI from "@/api/gateway-admin/gateway-service";
import GatewayApiRouteAPI from "@/api/gateway-admin/gateway-api-route";
import type { GatewayServiceInstance } from "@/types/api/gateway-service";
import type {
  GatewayInstanceRevision,
  GatewayInstanceRuntime,
  GatewayReleaseDetail,
  GatewayRouteMetricsSnapshot,
  GatewayRouteProbe,
} from "@/types/api/gateway-api-route";
import { selectGatewayInstances } from "./service-selection";

defineOptions({ name: "GatewayMonitoring" });
const loading = ref(false);
const gatewayInstances = ref<GatewayServiceInstance[]>([]);
const releaseDetail = ref<GatewayReleaseDetail>();
const metrics = ref<GatewayRouteMetricsSnapshot>();
const runtimeSnapshots = ref<GatewayInstanceRuntime[]>([]);
const loadWarnings = ref<string[]>([]);
const routeMetrics = computed(() => {
  const merged = new Map<
    string,
    { routeId: string; requestRate?: number; errorRate?: number; p95Latency?: number }
  >();
  for (const [field, raw] of [
    ["requestRate", metrics.value?.requestRate],
    ["errorRate", metrics.value?.errorRate],
    ["p95Latency", metrics.value?.p95Latency],
  ] as const) {
    for (const item of prometheusVector(raw)) {
      const routeId = item.metric.routeId || item.metric.route_id || "unknown";
      const row = merged.get(routeId) || { routeId };
      row[field] = Number(item.value?.[1] || 0);
      merged.set(routeId, row);
    }
  }
  return [...merged.values()].sort((a, b) => (b.requestRate || 0) - (a.requestRate || 0));
});

function instanceKey(instance: GatewayServiceInstance) {
  return `${instance.ip}:${instance.port}`;
}
function matches(instanceId: string, instance: GatewayServiceInstance) {
  return instanceId === instanceKey(instance) || instanceId.endsWith(instanceKey(instance));
}
function instanceRevision(instance: GatewayServiceInstance): GatewayInstanceRevision | undefined {
  return releaseDetail.value?.instances.find((item) => matches(item.instanceId, instance));
}
function routeProbe(instance: GatewayServiceInstance): GatewayRouteProbe | undefined {
  return releaseDetail.value?.routeProbes.find((item) => matches(item.instanceId, instance));
}

async function load() {
  loading.value = true;
  loadWarnings.value = [];
  try {
    const [catalogResult, releasesResult, metricResult, runtimeResult] = await Promise.allSettled([
      GatewayServiceAPI.list({ page: 1, pageSize: 500 }),
      GatewayApiRouteAPI.listReleases(),
      GatewayApiRouteAPI.getRouteMetrics(),
      GatewayApiRouteAPI.getRuntimeSnapshots(),
    ]);

    if (catalogResult.status === "fulfilled") {
      gatewayInstances.value = selectGatewayInstances(catalogResult.value.services || []);
    } else {
      gatewayInstances.value = [];
      loadWarnings.value.push("网关实例目录加载失败");
    }

    if (releasesResult.status === "fulfilled") {
      const latestRelease = releasesResult.value[0];
      if (latestRelease) {
        try {
          releaseDetail.value = await GatewayApiRouteAPI.getRelease(latestRelease.id);
        } catch {
          releaseDetail.value = undefined;
          loadWarnings.value.push("最近发布详情加载失败");
        }
      } else {
        releaseDetail.value = undefined;
      }
    } else {
      releaseDetail.value = undefined;
      loadWarnings.value.push("发布记录加载失败");
    }

    if (metricResult.status === "fulfilled") {
      metrics.value = metricResult.value;
    } else {
      metrics.value = undefined;
      loadWarnings.value.push("路由指标加载失败");
    }

    if (runtimeResult.status === "fulfilled") {
      runtimeSnapshots.value = runtimeResult.value;
    } else {
      runtimeSnapshots.value = [];
      loadWarnings.value.push("实例运行参数加载失败");
    }
  } finally {
    loading.value = false;
  }
}
function prometheusVector(
  raw?: string
): Array<{ metric: Record<string, string>; value?: [number, string] }> {
  if (!raw) return [];
  try {
    return JSON.parse(raw)?.data?.result || [];
  } catch {
    return [];
  }
}
function formatNumber(value?: number) {
  return value == null ? "-" : value.toFixed(3);
}
function formatLatency(value?: number) {
  return value == null ? "-" : `${(value * 1000).toFixed(0)} ms`;
}
function formatBytes(value?: number) {
  if (value == null || value < 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let amount = value;
  let unit = 0;
  while (amount >= 1024 && unit < units.length - 1) {
    amount /= 1024;
    unit++;
  }
  return `${amount.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}
function formatMillis(value?: number) {
  return value == null ? "未设置" : `${value} ms`;
}
function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return days ? `${days} 天 ${hours} 小时` : `${hours} 小时`;
}
function sourceLabel(row: GatewayInstanceRuntime, key: string) {
  return (
    (
      { DEFAULT: "默认", CONFIGURED: "配置", SYSTEM_PROPERTY: "启动参数" } as Record<string, string>
    )[row.snapshot?.sources?.[key] || ""] || "未知"
  );
}
onMounted(load);
</script>

<style scoped>
.runtime-detail {
  padding: 12px 40px;
}
</style>
