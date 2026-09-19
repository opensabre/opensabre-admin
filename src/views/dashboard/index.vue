<template>
  <div class="dashboard-container">
    <section class="welcome-card">
      <div class="welcome-card__main">
        <el-avatar :size="56" :src="userStore.userInfo.avatar" />
        <div>
          <h1>{{ greetings }}</h1>
          <p>这里汇总了今天的系统运行情况和需要关注的事项。</p>
        </div>
      </div>
      <div class="welcome-card__actions">
        <el-button
          v-for="action in quickActions"
          :key="action.path"
          text
          @click="goTo(action.path)"
        >
          <el-icon><component :is="action.icon" /></el-icon>
          {{ action.label }}
        </el-button>
      </div>
    </section>

    <el-row :gutter="16" class="metric-grid">
      <el-col v-for="metric in metrics" :key="metric.label" :xs="24" :sm="12" :lg="6">
        <el-card shadow="never" class="metric-card" @click="metric.path && goTo(metric.path)">
          <div class="metric-card__header">
            <span>{{ metric.label }}</span>
            <el-tag v-if="metric.tag" :type="metric.tag.type" size="small">
              {{ metric.tag.text }}
            </el-tag>
          </div>
          <div class="metric-card__content">
            <strong>{{ metric.value }}</strong>
            <el-icon :class="metric.iconClass"><component :is="metric.icon" /></el-icon>
          </div>
          <p :class="metric.hintClass">{{ metric.hint }}</p>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="dashboard-row">
      <el-col v-if="canAccessMonitoring" :xs="24" :lg="16">
        <el-card shadow="never" class="trend-card">
          <template #header>
            <div class="card-header">
              <span>访问趋势</span>
              <el-radio-group v-model="visitTrendDateRange" size="small">
                <el-radio-button :value="7">近 7 天</el-radio-button>
                <el-radio-button :value="30">近 30 天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <ECharts :options="visitTrendChartOptions" height="340px" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8" class="dashboard-row__aside">
        <el-card shadow="never" class="side-card">
          <template #header>
            <div class="card-header">
              <span>我的待办</span>
              <el-button text type="primary" @click="goTo('/my-notice')">查看全部</el-button>
            </div>
          </template>
          <el-skeleton :loading="noticeLoading" :rows="4" animated>
            <el-empty
              v-if="!noticeLoading && notices.length === 0"
              description="暂无待处理通知"
              :image-size="80"
            />
            <div v-else class="notice-list">
              <button
                v-for="notice in notices"
                :key="notice.id"
                class="notice-item"
                @click="goTo('/my-notice')"
              >
                <el-tag :type="notice.isRead === 1 ? 'info' : 'danger'" size="small">
                  {{ notice.isRead === 1 ? "已读" : "未读" }}
                </el-tag>
                <span>{{ notice.title }}</span>
                <time>{{ formatDate(notice.publishTime) }}</time>
              </button>
            </div>
          </el-skeleton>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="dashboard-row">
      <el-col :xs="24" :lg="16">
        <el-card shadow="never" class="audit-card">
          <template #header>
            <div class="card-header">
              <span>最近操作</span>
              <el-button text type="primary" @click="goTo('/sysadmin/audit-log')">
                查看审计日志
              </el-button>
            </div>
          </template>
          <el-skeleton :loading="auditLoading" :rows="5" animated>
            <el-empty
              v-if="!auditLoading && auditLogs.length === 0"
              description="暂无操作记录"
              :image-size="80"
            />
            <el-table v-else :data="auditLogs" size="small" :show-header="false">
              <el-table-column min-width="110">
                <template #default="{ row }">
                  <el-tag size="small" effect="plain">{{ row.operationType || "操作" }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="description" min-width="280" show-overflow-tooltip />
              <el-table-column prop="operatorUsername" width="130" />
              <el-table-column prop="operationTime" width="170" />
            </el-table>
          </el-skeleton>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="canAccessMonitoring ? 8 : 24" class="dashboard-row__aside">
        <el-card shadow="never" class="side-card status-card">
          <template #header><span>系统状态</span></template>
          <div class="status-line">
            <span>在线用户服务</span>
            <el-tag :type="onlineServiceStatus ? 'success' : 'danger'" effect="plain">
              {{ onlineServiceStatus ? "连接正常" : "连接中断" }}
            </el-tag>
          </div>
          <div class="status-line">
            <span>当前在线用户</span>
            <strong>{{ displayOnlineUserCount }}</strong>
          </div>
          <div class="status-line">
            <span>Prometheus 采集</span>
            <el-tag
              :type="
                monitoringAvailable === true
                  ? 'success'
                  : monitoringAvailable === false
                    ? 'danger'
                    : 'info'
              "
              effect="plain"
            >
              {{
                monitoringAvailable === true
                  ? "正常"
                  : monitoringAvailable === false
                    ? "不可用"
                    : "检查中"
              }}
            </el-tag>
          </div>
          <div class="status-line">
            <span>网关实例</span>
            <strong>
              {{
                gatewayInstances.length ? `${healthyGatewayCount}/${gatewayInstances.length}` : "--"
              }}
            </strong>
          </div>
          <div class="status-line">
            <span>最近更新时间</span>
            <span>{{ formattedTime }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { dayjs } from "element-plus";
import { computed, onMounted, ref, watch } from "vue";
import { Bell, Document, User, UserFilled } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import AuditLogAPI from "@/api/sysadmin/audit-log";
import NoticeAPI from "@/api/system/notice";
import GatewayApiRouteAPI from "@/api/gateway-admin/gateway-api-route";
import OnlineUserAPI from "@/api/auth/online-user";
import { useOnlineCount } from "@/composables";
import { useUserStore } from "@/store/modules/user";
import { hasPerm } from "@/utils/auth";
import type { AuditLogItem, GatewayInstanceRuntime, NoticeItem } from "@/types/api";
import { aggregateDashboardTrend } from "./presentation";

defineOptions({ name: "Dashboard", inheritAttrs: false });

const router = useRouter();
const userStore = useUserStore();
const { onlineUserCount, lastUpdateTime, isConnected } = useOnlineCount();
const visitTrendDateRange = ref(7);
const visitTrendChartOptions = ref();
const noticeLoading = ref(true);
const auditLoading = ref(true);
const notices = ref<NoticeItem[]>([]);
const auditLogs = ref<AuditLogItem[]>([]);
const onlineUserTotal = ref<number | null>(null);
const onlineUserAvailable = ref(false);
const monitoringAvailable = ref<boolean | null>(null);
const gatewayInstances = ref<GatewayInstanceRuntime[]>([]);
const dashboardUpdatedAt = ref(0);

const greetings = computed(() => {
  const hour = new Date().getHours();
  const prefix = hour < 12 ? "上午好" : hour < 18 ? "下午好" : "晚上好";
  return `${prefix}，${userStore.userInfo.nickname || userStore.userInfo.username}！`;
});
const formattedTime = computed(() => {
  const timestamp = lastUpdateTime.value || dashboardUpdatedAt.value;
  return timestamp ? dayjs(timestamp).format("HH:mm:ss") : "--";
});
const displayOnlineUserCount = computed(() =>
  isConnected.value && lastUpdateTime.value
    ? onlineUserCount.value
    : (onlineUserTotal.value ?? "--")
);
const healthyGatewayCount = computed(
  () => gatewayInstances.value.filter((item) => item.healthy).length
);
const onlineServiceStatus = computed(() => onlineUserAvailable.value || isConnected.value);
const unreadNoticeCount = computed(
  () => notices.value.filter((notice) => notice.isRead !== 1).length
);
const canAccessAudit = computed(() => hasRoutePath("/sysadmin/audit-log"));
const canAccessMonitoring = computed(() => hasRoutePath("/gateway/monitoring"));
const quickActions = computed(() =>
  [
    { label: "用户管理", path: "/system/user", icon: User, permission: "sys:user:create" },
    { label: "发布通知", path: "/system/notice", icon: Bell, permission: "sys:notice:create" },
    { label: "审计日志", path: "/sysadmin/audit-log", icon: Document },
  ].filter(
    (action) => hasRoutePath(action.path) && (!action.permission || hasPerm(action.permission))
  )
);
const metrics = computed(() => [
  {
    label: "在线用户",
    value: displayOnlineUserCount.value,
    hint: onlineServiceStatus.value ? `最近更新于 ${formattedTime.value}` : "在线用户数据不可用",
    hintClass: onlineServiceStatus.value ? "is-success" : "is-danger",
    tag: { text: "实时", type: "danger" as const },
    icon: UserFilled,
    iconClass: "is-primary",
    path: hasRoutePath("/auth/online-user") ? "/auth/online-user" : undefined,
  },
  {
    label: "当前请求",
    value: currentTps.value.toFixed(2),
    hint: monitoringAvailable.value === false ? "Prometheus 不可用" : "网关请求 TPS",
    hintClass: monitoringAvailable.value === false ? "is-danger" : "is-success",
    tag: { text: "TPS", type: "primary" as const },
    icon: Document,
    iconClass: "is-warning",
  },
  {
    label: "健康实例",
    value: `${healthyGatewayCount.value}/${gatewayInstances.value.length || "--"}`,
    hint: gatewayInstances.value.length ? "网关实例运行状态" : "实例状态不可用",
    hintClass:
      gatewayInstances.value.length && healthyGatewayCount.value === gatewayInstances.value.length
        ? "is-success"
        : "is-muted",
    tag: { text: "状态", type: "success" as const },
    icon: Document,
    iconClass: "is-success",
  },
  {
    label: "待处理通知",
    value: unreadNoticeCount.value,
    hint: noticeLoading.value ? "正在加载通知" : `共 ${notices.value.length} 条最新通知`,
    hintClass: "is-muted",
    tag: { text: "待办", type: "warning" as const },
    icon: Bell,
    iconClass: "is-danger",
    path: "/my-notice",
  },
]);

function goTo(path: string) {
  router.push(path);
}
function hasRoutePath(path: string) {
  return router.resolve(path).matched.some((route) => route.path === path);
}
function formatDate(value?: Date) {
  return value ? dayjs(value).format("MM-DD HH:mm") : "--";
}
const currentTps = computed(() => trendPoints.value.at(-1)?.tps ?? 0);
const trendPoints = ref<ReturnType<typeof aggregateDashboardTrend>>([]);

async function fetchNotices() {
  try {
    notices.value = (await NoticeAPI.getMyNoticePage({ pageNum: 1, pageSize: 5 })).data;
  } finally {
    noticeLoading.value = false;
  }
}
async function fetchAuditLogs() {
  try {
    auditLogs.value = (await AuditLogAPI.getPage({ pageNum: 1, pageSize: 5 })).data;
  } finally {
    auditLoading.value = false;
  }
}
async function fetchTrend() {
  if (!canAccessMonitoring.value) return;
  try {
    const history = await GatewayApiRouteAPI.getRouteHistory({
      range: `${visitTrendDateRange.value}d`,
    });
    trendPoints.value = aggregateDashboardTrend(history);
    updateTrend();
  } catch {
    trendPoints.value = [];
    updateTrend();
  }
}
function updateTrend() {
  visitTrendChartOptions.value = {
    tooltip: { trigger: "axis" },
    legend: { data: ["请求 TPS", "错误 TPS"], bottom: 0 },
    grid: { left: "2%", right: "4%", bottom: "12%", containLabel: true },
    xAxis: { type: "time" },
    yAxis: { type: "value", splitLine: { lineStyle: { type: "dashed" } } },
    series: [
      {
        name: "请求 TPS",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: trendPoints.value.map((point) => [point.timestamp * 1000, point.tps]),
        areaStyle: { color: "rgba(64, 158, 255, .12)" },
        itemStyle: { color: "#409eff" },
      },
      {
        name: "错误 TPS",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: trendPoints.value.map((point) => [point.timestamp * 1000, point.errorTps]),
        areaStyle: { color: "rgba(245, 108, 108, .12)" },
        itemStyle: { color: "#f56c6c" },
      },
    ],
  };
}

async function fetchDashboardStatus() {
  const [onlineResult, monitoringResult, runtimeResult] = await Promise.allSettled([
    OnlineUserAPI.list({ pageNum: 1, pageSize: 1 }),
    GatewayApiRouteAPI.getMonitoringStatus(),
    GatewayApiRouteAPI.getRuntimeSnapshots(),
  ]);
  if (onlineResult.status === "fulfilled") {
    onlineUserTotal.value = onlineResult.value.page.total;
    onlineUserAvailable.value = true;
  }
  if (monitoringResult.status === "fulfilled")
    monitoringAvailable.value = monitoringResult.value.available;
  if (runtimeResult.status === "fulfilled") gatewayInstances.value = runtimeResult.value;
  dashboardUpdatedAt.value = Date.now();
}

watch(visitTrendDateRange, fetchTrend, { immediate: true });
onMounted(() => {
  void fetchDashboardStatus();
  void fetchNotices();
  if (canAccessAudit.value) void fetchAuditLogs();
});
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 24px;
  background: var(--el-fill-color-light);
}
.welcome-card {
  display: flex;
  gap: 24px;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  background: linear-gradient(120deg, var(--el-color-primary-light-9), #fff);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}
.welcome-card__main {
  display: flex;
  gap: 16px;
  align-items: center;
  h1 {
    margin: 0 0 8px;
    font-size: 20px;
  }
  p {
    margin: 0;
    color: var(--el-text-color-secondary);
  }
}
.welcome-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.metric-grid,
.dashboard-row {
  margin-top: 16px;
}
.metric-grid :deep(.el-col) {
  margin-bottom: 16px;
}
.metric-card {
  height: 150px;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  &:hover {
    box-shadow: var(--el-box-shadow-light);
    transform: translateY(-2px);
  }
}
.metric-card__header,
.metric-card__content,
.card-header,
.status-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.metric-card__header {
  color: var(--el-text-color-secondary);
}
.metric-card__content {
  margin: 18px 0 10px;
  strong {
    font-size: 28px;
    line-height: 1;
  }
  .el-icon {
    font-size: 30px;
  }
}
.metric-card p {
  margin: 0;
  font-size: 13px;
}
.is-primary {
  color: var(--el-color-primary);
}
.is-success {
  color: var(--el-color-success);
}
.is-warning {
  color: var(--el-color-warning);
}
.is-danger {
  color: var(--el-color-danger);
}
.is-muted {
  color: var(--el-text-color-secondary);
}
.trend-card,
.side-card,
.audit-card {
  height: 100%;
}
.dashboard-row__aside {
  margin-top: 0;
}
.side-card :deep(.el-card__body) {
  min-height: 340px;
}
.audit-card :deep(.el-card__body) {
  min-height: 208px;
}
.notice-list {
  display: flex;
  flex-direction: column;
}
.notice-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 12px 0;
  text-align: left;
  cursor: pointer;
  background: none;
  border: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
.status-line {
  padding: 14px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  &:last-child {
    border-bottom: 0;
  }
}
@media (max-width: 1199px) {
  .dashboard-row__aside {
    margin-top: 16px;
  }
  .side-card :deep(.el-card__body) {
    min-height: auto;
  }
}
@media (max-width: 767px) {
  .dashboard-container {
    padding: 16px;
  }
  .welcome-card {
    flex-direction: column;
    align-items: flex-start;
  }
  .welcome-card__actions {
    width: 100%;
  }
  .notice-item {
    grid-template-columns: auto minmax(0, 1fr);
    time {
      display: none;
    }
  }
}
</style>
