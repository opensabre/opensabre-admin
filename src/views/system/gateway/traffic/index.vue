<template>
  <div class="app-container gateway-tabs-page">
    <el-card shadow="never" class="gateway-tabs-page__tabs">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="限流规则" name="rate-limits" />
        <el-tab-pane label="熔断与降级" name="circuit-breakers" />
        <el-tab-pane label="超时规则" name="fallbacks" />
      </el-tabs>
    </el-card>

    <el-card v-loading="loading" shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <div class="font-medium">{{ currentDefinition.title }}</div>
            <div class="mt-1 text-xs text-gray-500">{{ currentDefinition.description }}</div>
          </div>
          <div class="flex gap-2">
            <el-button :loading="saving" @click="savePolicy">保存</el-button>
            <el-button type="primary" :loading="publishing" @click="publishPolicy">
              发布到网关
            </el-button>
          </div>
        </div>
      </template>

      <el-alert
        title="策略保存后进入待发布状态；发布时按 API → 应用 → 全局的优先级计算最终配置。"
        type="info"
        :closable="false"
        class="mb-5"
      />

      <el-form label-width="150px" class="traffic-policy-form">
        <el-form-item label="作用范围">
          <el-radio-group v-model="form.scopeType" @change="handleScopeChange">
            <el-radio-button value="GLOBAL">全局</el-radio-button>
            <el-radio-button value="APPLICATION">应用</el-radio-button>
            <el-radio-button value="API">API</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="form.scopeType !== 'GLOBAL'" :label="scopeLabel" required>
          <el-select
            v-model="form.scopeId"
            filterable
            clearable
            class="scope-select"
            :placeholder="`请选择${scopeLabel}`"
            @change="loadPolicy"
          >
            <el-option
              v-for="option in scopeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="本级策略">
          <el-radio-group v-model="form.mode">
            <el-radio value="INHERIT" :disabled="form.scopeType === 'GLOBAL'">继承上级</el-radio>
            <el-radio value="ENABLED">启用</el-radio>
            <el-radio value="DISABLED">停用</el-radio>
          </el-radio-group>
        </el-form-item>

        <template v-if="form.mode === 'ENABLED' && activeTab === 'rate-limits'">
          <el-form-item label="限流维度" required>
            <el-select v-model="form.rateLimit.keyType" class="field-select">
              <el-option label="客户端 IP" value="IP" />
              <el-option label="API 路径" value="API" />
            </el-select>
          </el-form-item>
          <el-form-item label="每秒补充令牌" required>
            <el-input-number v-model="form.rateLimit.replenishRate" :min="1" :max="100000" />
            <span class="field-tip">稳定吞吐上限（请求/秒）</span>
          </el-form-item>
          <el-form-item label="令牌桶容量" required>
            <el-input-number v-model="form.rateLimit.burstCapacity" :min="1" :max="100000" />
            <span class="field-tip">必须大于或等于每秒补充令牌</span>
          </el-form-item>
          <el-form-item label="单次消耗令牌" required>
            <el-input-number v-model="form.rateLimit.requestedTokens" :min="1" :max="100000" />
          </el-form-item>
        </template>

        <template v-if="form.mode === 'ENABLED' && activeTab === 'fallbacks'">
          <el-form-item label="连接超时" required>
            <el-input-number v-model="form.timeout.connectTimeoutMs" :min="1" :max="600000" />
            <span class="field-tip">毫秒</span>
          </el-form-item>
          <el-form-item label="响应超时" required>
            <el-input-number v-model="form.timeout.responseTimeoutMs" :min="1" :max="600000" />
            <span class="field-tip">毫秒</span>
          </el-form-item>
        </template>

        <template v-if="form.mode === 'ENABLED' && activeTab === 'circuit-breakers'">
          <el-form-item label="失败率阈值" required>
            <el-input-number
              v-model="form.circuitBreaker.failureRateThreshold"
              :min="1"
              :max="100"
            />
            <span class="field-tip">%</span>
          </el-form-item>
          <el-form-item label="慢调用率阈值" required>
            <el-input-number
              v-model="form.circuitBreaker.slowCallRateThreshold"
              :min="1"
              :max="100"
            />
            <span class="field-tip">%</span>
          </el-form-item>
          <el-form-item label="慢调用判定" required>
            <el-input-number
              v-model="form.circuitBreaker.slowCallDurationThresholdMs"
              :min="1"
              :max="600000"
            />
            <span class="field-tip">毫秒</span>
          </el-form-item>
          <el-form-item label="最少调用次数" required>
            <el-input-number v-model="form.circuitBreaker.minimumNumberOfCalls" :min="1" />
          </el-form-item>
          <el-form-item label="熔断等待时间" required>
            <el-input-number
              v-model="form.circuitBreaker.waitDurationInOpenStateMs"
              :min="1"
              :max="3600000"
            />
            <span class="field-tip">毫秒</span>
          </el-form-item>
          <el-form-item label="降级地址">
            <el-input
              v-model.trim="form.circuitBreaker.fallbackUri"
              clearable
              placeholder="可选，例如 forward:/fallback/orders"
            />
          </el-form-item>
        </template>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import type { TabsPaneContext } from "element-plus";
import GatewayApiRouteAPI from "@/api/gateway-admin/gateway-api-route";
import type {
  GatewayApiAsset,
  GatewayCircuitBreakerConfig,
  GatewayGovernancePolicyType,
  GatewayPolicyChange,
  GatewayPolicyMode,
  GatewayPolicyScopeType,
  GatewayRateLimitConfig,
  GatewayTimeoutConfig,
} from "@/types/api/gateway-api-route";

defineOptions({ name: "GatewayTraffic" });

type TrafficTab = "rate-limits" | "circuit-breakers" | "fallbacks";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const publishing = ref(false);
const apiAssets = ref<GatewayApiAsset[]>([]);
const activeTab = ref<TrafficTab>(resolveTab());

const definitions: Record<
  TrafficTab,
  { title: string; description: string; policyType: GatewayGovernancePolicyType; path: string }
> = {
  "rate-limits": {
    title: "限流规则",
    description: "使用 Redis 令牌桶按客户端 IP 或 API 路径限制请求速率。",
    policyType: "RATE_LIMIT",
    path: "/gateway/traffic/rate-limits",
  },
  "circuit-breakers": {
    title: "熔断与降级",
    description: "按失败率和慢调用率触发熔断，并可转发到内部降级地址。",
    policyType: "CIRCUIT_BREAKER",
    path: "/gateway/traffic/circuit-breakers",
  },
  fallbacks: {
    title: "超时规则",
    description: "控制网关连接下游服务及等待下游响应的最长时间。",
    policyType: "TIMEOUT",
    path: "/gateway/traffic/fallbacks",
  },
};

const form = reactive({
  scopeType: "GLOBAL" as GatewayPolicyScopeType,
  scopeId: "",
  mode: "DISABLED" as GatewayPolicyMode,
  lockVersion: undefined as number | undefined,
  rateLimit: defaultRateLimit(),
  timeout: defaultTimeout(),
  circuitBreaker: defaultCircuitBreaker(),
});

const currentDefinition = computed(() => definitions[activeTab.value]);
const scopeLabel = computed(() => (form.scopeType === "APPLICATION" ? "应用" : "API"));
const scopeOptions = computed(() => {
  if (form.scopeType === "APPLICATION") {
    return [...new Set(apiAssets.value.map((item) => item.serviceId))]
      .sort()
      .map((serviceId) => ({ value: serviceId, label: serviceId }));
  }
  return apiAssets.value.map((item) => ({
    value: item.id,
    label: `${item.httpMethod} ${item.upstreamPath}（${item.serviceId}）`,
  }));
});

watch(
  () => route.path,
  async () => {
    const next = resolveTab();
    if (next !== activeTab.value) {
      activeTab.value = next;
      await loadPolicy();
    }
  }
);

onMounted(async () => {
  await loadApiAssets();
  await loadPolicy();
});

function resolveTab(): TrafficTab {
  if (route.path.endsWith("/circuit-breakers")) return "circuit-breakers";
  if (route.path.endsWith("/fallbacks")) return "fallbacks";
  return "rate-limits";
}

async function handleTabChange(name: TabsPaneContext["paneName"]) {
  const tab = name as TrafficTab;
  if (route.path !== definitions[tab].path) await router.replace(definitions[tab].path);
}

async function loadApiAssets() {
  const first = await GatewayApiRouteAPI.listApis({ page: 1, pageSize: 200 });
  const pages = Math.ceil(first.total / first.pageSize);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, index) =>
      GatewayApiRouteAPI.listApis({ page: index + 2, pageSize: 200 })
    )
  );
  apiAssets.value = [first, ...rest].flatMap((page) => page.apis);
}

function handleScopeChange() {
  form.scopeId = "";
  resetPolicy();
  if (form.scopeType === "GLOBAL") loadPolicy();
}

async function loadPolicy() {
  if (form.scopeType !== "GLOBAL" && !form.scopeId) return;
  loading.value = true;
  try {
    const policies = await GatewayApiRouteAPI.listPolicies(
      form.scopeType,
      form.scopeType === "GLOBAL" ? undefined : form.scopeId
    );
    const policy = policies.find((item) => item.policyType === currentDefinition.value.policyType);
    resetPolicy();
    if (!policy) return;
    form.mode = policy.mode;
    form.lockVersion = policy.lockVersion;
    if (!policy.configJson) return;
    const config = JSON.parse(policy.configJson);
    if (activeTab.value === "rate-limits") Object.assign(form.rateLimit, config);
    if (activeTab.value === "fallbacks") Object.assign(form.timeout, config);
    if (activeTab.value === "circuit-breakers") Object.assign(form.circuitBreaker, config);
  } finally {
    loading.value = false;
  }
}

function resetPolicy() {
  form.mode = form.scopeType === "GLOBAL" ? "DISABLED" : "INHERIT";
  form.lockVersion = undefined;
  Object.assign(form.rateLimit, defaultRateLimit());
  Object.assign(form.timeout, defaultTimeout());
  Object.assign(form.circuitBreaker, defaultCircuitBreaker());
}

async function savePolicy() {
  if (form.scopeType !== "GLOBAL" && !form.scopeId) {
    ElMessage.warning(`请先选择${scopeLabel.value}`);
    return;
  }
  if (!validateForm()) return;
  const data: GatewayPolicyChange = { mode: form.mode, lockVersion: form.lockVersion };
  if (form.mode === "ENABLED") {
    if (activeTab.value === "rate-limits") data.rateLimit = { ...form.rateLimit };
    if (activeTab.value === "fallbacks") data.timeout = { ...form.timeout };
    if (activeTab.value === "circuit-breakers") {
      data.circuitBreaker = {
        ...form.circuitBreaker,
        fallbackUri: form.circuitBreaker.fallbackUri || undefined,
      };
    }
  }
  saving.value = true;
  try {
    const saved = await GatewayApiRouteAPI.savePolicy(
      form.scopeType,
      form.scopeType === "GLOBAL" ? undefined : form.scopeId,
      currentDefinition.value.policyType,
      data
    );
    form.lockVersion = saved.lockVersion;
    ElMessage.success("策略已保存，发布后生效");
  } finally {
    saving.value = false;
  }
}

function validateForm() {
  if (form.mode !== "ENABLED") return true;
  if (
    activeTab.value === "rate-limits" &&
    form.rateLimit.burstCapacity < form.rateLimit.replenishRate
  ) {
    ElMessage.warning("令牌桶容量不能小于每秒补充令牌");
    return false;
  }
  if (
    activeTab.value === "circuit-breakers" &&
    form.circuitBreaker.fallbackUri &&
    !form.circuitBreaker.fallbackUri.startsWith("forward:/")
  ) {
    ElMessage.warning("降级地址仅支持 forward:/ 开头的内部地址");
    return false;
  }
  return true;
}

async function publishPolicy() {
  publishing.value = true;
  try {
    const current = await GatewayApiRouteAPI.getCurrentConfig();
    await GatewayApiRouteAPI.validateRelease(current.version);
    const result = await GatewayApiRouteAPI.publishRelease(current.version);
    ElMessage.success(`发布已提交：${result.status}`);
  } finally {
    publishing.value = false;
  }
}

function defaultRateLimit(): GatewayRateLimitConfig {
  return { keyType: "IP", replenishRate: 10, burstCapacity: 20, requestedTokens: 1 };
}

function defaultTimeout(): GatewayTimeoutConfig {
  return { connectTimeoutMs: 1000, responseTimeoutMs: 3000 };
}

function defaultCircuitBreaker(): GatewayCircuitBreakerConfig {
  return {
    failureRateThreshold: 50,
    slowCallRateThreshold: 50,
    slowCallDurationThresholdMs: 2000,
    minimumNumberOfCalls: 20,
    waitDurationInOpenStateMs: 10000,
    fallbackUri: "",
  };
}
</script>

<style scoped>
.gateway-tabs-page__tabs {
  margin-bottom: 16px;
}
.gateway-tabs-page__tabs :deep(.el-card__body) {
  padding-bottom: 0;
}
.traffic-policy-form {
  max-width: 820px;
}
.scope-select {
  width: 520px;
  max-width: 100%;
}
.field-select {
  width: 220px;
}
.field-tip {
  margin-left: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
