<template>
  <div class="app-container">
    <el-card shadow="hover" class="mb-4">
      <el-form :inline="true">
        <el-form-item label="统计区间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            value-format="YYYY-MM-DDTHH:mm:ss"
            range-separator="至"
          />
        </el-form-item>
        <el-form-item label="对象类型">
          <el-select v-model="filters.objectType" clearable style="width: 160px">
            <el-option
              v-for="item in objectTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="对象 ID">
          <el-input v-model="filters.objectId" clearable placeholder="场景编码或模板 ID" />
        </el-form-item>
        <el-form-item label="事件">
          <el-select v-model="filters.usageEvent" clearable style="width: 150px">
            <el-option
              v-for="item in events"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="粒度">
          <el-select v-model="filters.granularity" style="width: 110px">
            <el-option label="小时" value="HOUR" />
            <el-option label="天" value="DAY" />
            <el-option label="周" value="WEEK" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="loadData">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="16" class="mb-4">
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <el-statistic title="发起次数" :value="summary.attemptCount || 0" />
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <el-statistic title="成功次数" :value="summary.successCount || 0" />
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <el-statistic
            title="成功率"
            :value="(summary.successRate || 0) * 100"
            suffix="%"
            :precision="2"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover">
          <template #header>使用趋势</template>
          <ECharts :options="trendOptions" height="360px" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover">
          <template #header>使用量排行</template>
          <el-table :data="ranking" size="small" max-height="360">
            <el-table-column type="index" label="#" width="48" />
            <el-table-column prop="objectId" label="对象" show-overflow-tooltip />
            <el-table-column prop="attemptCount" label="次数" width="80" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import UsageCounterAPI from "@/api/sysadmin/usage-counter";
import type {
  UsageEvent,
  UsageGranularity,
  UsageObjectType,
  UsageRankingItem,
  UsageSummary,
  UsageTrendItem,
} from "@/types/api";
import { dayjs } from "element-plus";
import { useRoute } from "vue-router";

defineOptions({ name: "UsageStatistics", inheritAttrs: false });

const route = useRoute();
const dateRange = ref([
  dayjs().startOf("day").format("YYYY-MM-DDTHH:mm:ss"),
  dayjs().format("YYYY-MM-DDTHH:mm:ss"),
]);
const loading = ref(false);
const summary = ref<UsageSummary>({ attemptCount: 0, successCount: 0, failureCount: 0 });
const trend = ref<UsageTrendItem[]>([]);
const ranking = ref<UsageRankingItem[]>([]);
const filters = reactive<{
  objectType?: UsageObjectType;
  objectId: string;
  usageEvent?: UsageEvent;
  granularity: UsageGranularity;
}>({
  objectType: route.query.objectType as UsageObjectType | undefined,
  objectId: (route.query.objectId as string) || "",
  usageEvent: route.query.usageEvent as UsageEvent | undefined,
  granularity: "HOUR",
});
const objectTypes: Array<{ label: string; value: UsageObjectType }> = [
  { label: "验证码场景", value: "CAPTCHA_SCENE" },
  { label: "限次场景", value: "RATE_LIMIT_SCENE" },
  { label: "通知场景", value: "NOTIFICATION_SCENE" },
  { label: "通知模板", value: "NOTIFICATION_TEMPLATE" },
];
const events: Array<{ label: string; value: UsageEvent }> = [
  { label: "验证码生成", value: "CAPTCHA_GENERATE" },
  { label: "验证码校验", value: "CAPTCHA_VERIFY" },
  { label: "限次检查", value: "RATE_LIMIT_CHECK" },
  { label: "通知发送", value: "NOTIFICATION_SEND" },
];
const trendOptions = computed(() => ({
  tooltip: { trigger: "axis" },
  legend: { data: ["发起", "成功", "失败"] },
  grid: { left: 48, right: 20, bottom: 36 },
  xAxis: { type: "category", data: trend.value.map((item) => item.bucketStart) },
  yAxis: { type: "value", minInterval: 1 },
  series: [
    {
      name: "发起",
      type: "line",
      smooth: true,
      data: trend.value.map((item) => item.attemptCount),
    },
    {
      name: "成功",
      type: "line",
      smooth: true,
      data: trend.value.map((item) => item.successCount),
    },
    {
      name: "失败",
      type: "line",
      smooth: true,
      data: trend.value.map((item) => item.failureCount),
    },
  ],
}));

async function loadData() {
  if (!dateRange.value?.[0] || !dateRange.value?.[1]) return;
  loading.value = true;
  const params = {
    from: dateRange.value[0],
    to: dateRange.value[1],
    objectType: filters.objectType,
    objectId: filters.objectId || undefined,
    usageEvent: filters.usageEvent,
  };
  try {
    const [summaryData, trendData, rankingData] = await Promise.all([
      UsageCounterAPI.getSummary(params),
      UsageCounterAPI.getTrend({ ...params, granularity: filters.granularity }),
      UsageCounterAPI.getRanking({
        from: params.from,
        to: params.to,
        objectType: filters.objectType,
        usageEvent: filters.usageEvent,
        limit: 20,
      }),
    ]);
    summary.value = summaryData;
    trend.value = trendData || [];
    ranking.value = rankingData || [];
  } finally {
    loading.value = false;
  }
}
onMounted(loadData);
</script>
