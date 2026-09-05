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
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openMonitoringDetail(row)">监控详情</el-button>
            <el-button link type="primary" @click="viewApis(row.name)">查看 API</el-button>
            <el-button
              link
              type="success"
              :loading="syncingService === row.name"
              @click="syncApis(row.name)"
            >
              同步
            </el-button>
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

    <el-dialog
      v-model="monitoringDialog.visible"
      :title="`${monitoringDialog.service?.name || ''} 监控详情`"
      width="min(1200px, 92vw)"
      destroy-on-close
      append-to-body
    >
      <el-descriptions v-if="monitoringDialog.service" :column="3" border class="mb-4">
        <el-descriptions-item label="服务名称">
          {{ monitoringDialog.service.name }}
        </el-descriptions-item>
        <el-descriptions-item label="实例数">
          {{ monitoringDialog.service.instanceCount }}
        </el-descriptions-item>
        <el-descriptions-item label="健康实例">
          {{ monitoringDialog.service.healthyInstanceCount }} /
          {{ monitoringDialog.service.instanceCount }}
        </el-descriptions-item>
      </el-descriptions>
      <template v-if="monitoringDialog.service">
        <el-empty
          v-if="!monitoringDialog.service.instances.length"
          description="当前服务没有可用实例"
        />
        <el-tabs v-else v-model="monitoringDialog.activeInstance" class="monitoring-instance-tabs">
          <el-tab-pane
            v-for="instance in monitoringDialog.service.instances"
            :key="instanceKey(instance)"
            :name="instanceKey(instance)"
          >
            <template #label>
              <span class="instance-tab-label">
                <span
                  class="instance-health-dot"
                  :class="instance.healthy ? 'is-healthy' : 'is-unhealthy'"
                />
                {{ instanceKey(instance) }}
              </span>
            </template>

            <div class="monitoring-node-header">
              <div class="monitoring-node-status">
                <el-tag :type="instance.healthy ? 'success' : 'danger'">
                  {{ instance.healthy ? "实例健康" : "实例异常" }}
                </el-tag>
                <el-tag :type="instance.enabled ? 'primary' : 'info'">
                  {{ instance.enabled ? "已启用" : "已停用" }}
                </el-tag>
                <el-tag :type="actuatorOf(instance)?.snapshot ? 'success' : 'warning'">
                  指标{{ actuatorStatus(instance) }}
                </el-tag>
              </div>
            </div>

            <section class="monitoring-section">
              <div class="monitoring-section-title">基础信息</div>
              <el-descriptions :column="4" border>
                <el-descriptions-item label="IP 地址">
                  {{ instance.ip }}
                </el-descriptions-item>
                <el-descriptions-item label="端口">
                  {{ instance.port }}
                </el-descriptions-item>
                <el-descriptions-item label="所属集群">
                  {{ instance.cluster || "-" }}
                </el-descriptions-item>
                <el-descriptions-item label="权重">
                  {{ instance.weight }}
                </el-descriptions-item>
              </el-descriptions>
            </section>

            <section class="monitoring-section">
              <div class="monitoring-section-title">流量表现</div>
              <el-descriptions :column="3" border>
                <el-descriptions-item label="请求/秒">
                  {{ formatNumber(metricOf(instance)?.requestRate) }}
                </el-descriptions-item>
                <el-descriptions-item label="5xx/秒">
                  {{ formatNumber(metricOf(instance)?.errorRate) }}
                </el-descriptions-item>
                <el-descriptions-item label="P95 延迟">
                  {{ formatLatency(metricOf(instance)?.p95Latency) }}
                </el-descriptions-item>
              </el-descriptions>
            </section>

            <section class="monitoring-section">
              <div class="monitoring-section-title">资源运行</div>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="CPU 使用率">
                  {{ formatPercent(metricOf(instance)?.cpuUsage) }}
                </el-descriptions-item>
                <el-descriptions-item label="堆内存">
                  {{ formatHeap(metricOf(instance)?.heapUsed, metricOf(instance)?.heapMax) }}
                </el-descriptions-item>
                <el-descriptions-item label="运行时长">
                  {{ formatUptime(actuatorOf(instance)?.snapshot?.uptimeSeconds) }}
                </el-descriptions-item>
                <el-descriptions-item label="活动线程">
                  {{ actuatorOf(instance)?.snapshot?.liveThreads ?? "无数据" }}
                </el-descriptions-item>
              </el-descriptions>
            </section>

            <section class="monitoring-section">
              <div class="monitoring-section-title">注册元数据</div>
              <div v-if="metadataEntries(instance.metadata).length" class="metadata-grid">
                <div
                  v-for="item in metadataEntries(instance.metadata)"
                  :key="item.key"
                  class="metadata-item"
                >
                  <div class="metadata-key">{{ item.key }}</div>
                  <div class="metadata-value">{{ item.value }}</div>
                </div>
              </div>
              <el-empty v-else description="暂无注册元数据" :image-size="64" />
            </section>
          </el-tab-pane>
        </el-tabs>
      </template>
      <template #footer>
        <el-button @click="monitoringDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
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
const monitoringDialog = reactive<{
  visible: boolean;
  service?: GatewayServiceSummary;
  activeInstance: string;
}>({ visible: false, activeInstance: "" });

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
  const values = service.instances
    .map((item) => metricOf(item)?.[field])
    .filter((value) => value != null);
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

function metadataEntries(metadata: Record<string, string>) {
  return Object.entries(metadata || {}).map(([key, value]) => ({ key, value }));
}

function instanceKey(instance: GatewayServiceInstance) {
  return `${instance.ip}:${instance.port}`;
}

function openMonitoringDetail(service: GatewayServiceSummary) {
  monitoringDialog.service = service;
  monitoringDialog.activeInstance = service.instances[0] ? instanceKey(service.instances[0]) : "";
  monitoringDialog.visible = true;
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

<style scoped>
.monitoring-instance-tabs {
  min-height: 420px;
}

.instance-tab-label,
.monitoring-node-status {
  display: flex;
  gap: 8px;
  align-items: center;
}

.instance-health-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.instance-health-dot.is-healthy {
  background: var(--el-color-success);
}

.instance-health-dot.is-unhealthy {
  background: var(--el-color-danger);
}

.monitoring-node-header {
  display: flex;
  justify-content: flex-end;
  padding: 4px 0 16px;
}

.monitoring-section + .monitoring-section {
  margin-top: 18px;
}

.monitoring-section-title {
  padding-left: 9px;
  margin-bottom: 10px;
  font-weight: 600;
  line-height: 1;
  border-left: 3px solid var(--el-color-primary);
}

.metadata-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.metadata-item {
  min-width: 0;
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}

.metadata-key {
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.metadata-value {
  color: var(--el-text-color-primary);
  overflow-wrap: anywhere;
}

@media (width <= 992px) {
  .metadata-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 768px) {
  .monitoring-node-header {
    justify-content: flex-start;
  }

  .monitoring-node-status {
    flex-wrap: wrap;
  }

  .metadata-grid {
    grid-template-columns: 1fr;
  }
}
</style>
