<template>
  <div v-loading="loading" class="governance-settings">
    <el-alert
      v-if="scopeType !== 'GLOBAL'"
      :title="inheritanceHint"
      type="info"
      :closable="false"
      class="mb-4"
    />
    <el-card v-for="item in visibleItems" :key="item.type" shadow="never" class="mb-3">
      <div class="flex items-start justify-between gap-4">
        <div>
          <span class="font-medium">{{ item.label }}</span>
          <div class="mt-2 text-sm text-gray-500">{{ item.description }}</div>
          <div v-if="scopeType !== 'GLOBAL'" class="mt-2 text-sm text-gray-600">
            当前生效：{{ effectivePolicyText(item.type) }}
          </div>
        </div>
        <el-select
          v-if="!readonly"
          v-model="forms[item.type].mode"
          class="w-40"
          @change="handleModeChange(item.type)"
        >
          <el-option v-if="scopeType !== 'GLOBAL'" label="继承上级" value="INHERIT" />
          <el-option :label="scopeType === 'GLOBAL' ? '启用默认值' : '自定义'" value="ENABLED" />
          <el-option :label="scopeType === 'GLOBAL' ? '停用' : '本级停用'" value="DISABLED" />
        </el-select>
        <el-tag v-else :type="modeTagType(forms[item.type].mode)">
          {{ modeText(forms[item.type].mode) }}
        </el-tag>
      </div>

      <div
        v-if="displayMode(item.type) !== 'DISABLED'"
        class="policy-fields mt-4"
        :class="{ 'policy-fields--readonly': fieldsReadonly(item.type) }"
      >
        <template v-if="item.type === 'RATE_LIMIT'">
          <div class="policy-field">
            <label>限流维度</label>
            <el-select
              v-model="forms.RATE_LIMIT.config.keyType"
              :disabled="fieldsReadonly(item.type)"
            >
              <el-option label="按 IP" value="IP" />
              <el-option label="按 API" value="API" />
            </el-select>
          </div>
          <div class="policy-field">
            <label>每秒令牌数</label>
            <el-input-number
              v-model="forms.RATE_LIMIT.config.replenishRate"
              :min="1"
              :disabled="fieldsReadonly(item.type)"
            />
          </div>
          <div class="policy-field">
            <label>突发容量</label>
            <el-input-number
              v-model="forms.RATE_LIMIT.config.burstCapacity"
              :min="1"
              :disabled="fieldsReadonly(item.type)"
            />
          </div>
          <div class="policy-field">
            <label>单次请求令牌</label>
            <el-input-number
              v-model="forms.RATE_LIMIT.config.requestedTokens"
              :min="1"
              :disabled="fieldsReadonly(item.type)"
            />
          </div>
        </template>

        <template v-else-if="item.type === 'TIMEOUT'">
          <div class="policy-field">
            <label>连接超时（ms）</label>
            <el-input-number
              v-model="forms.TIMEOUT.config.connectTimeoutMs"
              :min="1"
              :disabled="fieldsReadonly(item.type)"
            />
          </div>
          <div class="policy-field">
            <label>响应超时（ms）</label>
            <el-input-number
              v-model="forms.TIMEOUT.config.responseTimeoutMs"
              :min="1"
              :disabled="fieldsReadonly(item.type)"
            />
          </div>
        </template>

        <template v-else-if="item.type === 'CIRCUIT_BREAKER'">
          <div class="policy-field">
            <label>失败率阈值（%）</label>
            <el-input-number
              v-model="forms.CIRCUIT_BREAKER.config.failureRateThreshold"
              :min="1"
              :max="100"
              :disabled="fieldsReadonly(item.type)"
            />
          </div>
          <div class="policy-field">
            <label>慢调用率阈值（%）</label>
            <el-input-number
              v-model="forms.CIRCUIT_BREAKER.config.slowCallRateThreshold"
              :min="1"
              :max="100"
              :disabled="fieldsReadonly(item.type)"
            />
          </div>
          <div class="policy-field">
            <label>慢调用判定（ms）</label>
            <el-input-number
              v-model="forms.CIRCUIT_BREAKER.config.slowCallDurationThresholdMs"
              :min="1"
              :disabled="fieldsReadonly(item.type)"
            />
          </div>
          <div class="policy-field">
            <label>最少调用数</label>
            <el-input-number
              v-model="forms.CIRCUIT_BREAKER.config.minimumNumberOfCalls"
              :min="1"
              :disabled="fieldsReadonly(item.type)"
            />
          </div>
          <div class="policy-field">
            <label>熔断等待（ms）</label>
            <el-input-number
              v-model="forms.CIRCUIT_BREAKER.config.waitDurationInOpenStateMs"
              :min="1"
              :disabled="fieldsReadonly(item.type)"
            />
          </div>
          <div class="policy-field">
            <label>降级地址（可选）</label>
            <el-input
              v-model="forms.CIRCUIT_BREAKER.config.fallbackUri"
              :disabled="fieldsReadonly(item.type)"
              placeholder="如 forward:/fallback"
            />
          </div>
        </template>

        <template v-else>
          <div class="policy-field">
            <label>名单模式</label>
            <el-radio-group
              v-model="forms.ACCESS_CONTROL.config.accessMode"
              :disabled="fieldsReadonly(item.type)"
            >
              <el-radio value="DENYLIST">黑名单：命中拒绝</el-radio>
              <el-radio value="ALLOWLIST">白名单：仅命中放行</el-radio>
            </el-radio-group>
          </div>
          <div class="policy-field policy-field--wide">
            <label>IP/CIDR</label>
            <div class="entry-list">
              <div
                v-for="(entry, index) in forms.ACCESS_CONTROL.config.entries"
                :key="index"
                class="entry-row"
              >
                <el-input
                  v-model.trim="entry.cidr"
                  :disabled="fieldsReadonly(item.type)"
                  maxlength="64"
                  placeholder="如 10.0.0.0/8"
                />
                <el-input
                  v-model.trim="entry.description"
                  :disabled="fieldsReadonly(item.type)"
                  maxlength="100"
                  placeholder="说明（可选）"
                />
                <el-button
                  v-if="!fieldsReadonly(item.type)"
                  link
                  type="danger"
                  @click="removeAccessEntry(index)"
                >
                  删除
                </el-button>
              </div>
              <el-button
                v-if="!fieldsReadonly(item.type)"
                type="primary"
                plain
                @click="addAccessEntry"
              >
                新增规则
              </el-button>
            </div>
          </div>
          <el-alert
            v-if="forms.ACCESS_CONTROL.config.accessMode === 'ALLOWLIST'"
            title="白名单会拒绝所有未命中的来源，请确认代理和运维出口地址已加入。"
            type="warning"
            :closable="false"
            class="policy-field--wide"
          />
        </template>
      </div>
      <el-empty v-else description="当前层级明确停用该策略" :image-size="48" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import GatewayApiRouteAPI from "@/api/gateway-admin/gateway-api-route";
import type {
  GatewayAccessControlConfig,
  GatewayCircuitBreakerConfig,
  GatewayEffectivePolicy,
  GatewayPolicyType,
  GatewayPolicyChange,
  GatewayPolicyMode,
  GatewayPolicyScopeType,
  GatewayRateLimitConfig,
  GatewayTimeoutConfig,
} from "@/types/api/gateway-api-route";

const props = withDefaults(
  defineProps<{
    scopeType: GatewayPolicyScopeType;
    scopeId?: string;
    serviceId?: string;
    apiId?: string;
    readonly?: boolean;
    policyTypes?: GatewayPolicyType[];
  }>(),
  {
    scopeId: "",
    serviceId: "",
    apiId: "",
    readonly: false,
    policyTypes: () => ["RATE_LIMIT", "TIMEOUT", "CIRCUIT_BREAKER", "ACCESS_CONTROL"],
  }
);

const items: { type: GatewayPolicyType; label: string; description: string }[] = [
  { type: "RATE_LIMIT", label: "限流", description: "使用 Redis 令牌桶限制请求速率。" },
  { type: "TIMEOUT", label: "超时", description: "控制连接下游及等待响应的最长时间。" },
  {
    type: "CIRCUIT_BREAKER",
    label: "熔断与降级",
    description: "按失败率或慢调用率熔断，可转发至内部降级地址。",
  },
  {
    type: "ACCESS_CONTROL",
    label: "IP 黑白名单",
    description: "按来源 IP/CIDR 允许或拒绝请求。",
  },
];

const loading = ref(false);
const effectivePolicies = reactive<Partial<Record<GatewayPolicyType, GatewayEffectivePolicy>>>({});
const forms = reactive({
  RATE_LIMIT: policyForm<GatewayRateLimitConfig>(defaultRateLimit()),
  TIMEOUT: policyForm<GatewayTimeoutConfig>(defaultTimeout()),
  CIRCUIT_BREAKER: policyForm<GatewayCircuitBreakerConfig>(defaultCircuitBreaker()),
  ACCESS_CONTROL: policyForm<GatewayAccessControlConfig>(defaultAccessControl()),
});

const visibleItems = computed(() => items.filter((item) => props.policyTypes.includes(item.type)));
const inheritanceHint = computed(() =>
  props.scopeType === "API"
    ? "默认继承应用级配置；应用未自定义时继续继承全局默认值。继承值仅供查看，切换为“自定义”后才可修改。"
    : "默认继承全局默认值。继承值仅供查看，切换为“自定义”后才可修改。"
);

watch(
  () => [props.scopeType, props.scopeId, props.serviceId, props.apiId, props.policyTypes.join(",")],
  () => void load(),
  { immediate: true }
);

async function load() {
  if (props.scopeType !== "GLOBAL" && !props.scopeId) {
    resetAll();
    return;
  }
  loading.value = true;
  try {
    const [localPolicies, ...effective] = await Promise.all([
      GatewayApiRouteAPI.listPolicies(
        props.scopeType,
        props.scopeType === "GLOBAL" ? undefined : props.scopeId
      ),
      ...visibleItems.value.map((item) =>
        GatewayApiRouteAPI.getEffectivePolicy(
          item.type,
          props.serviceId || undefined,
          props.apiId || undefined
        )
      ),
    ]);
    visibleItems.value.forEach((item, index) => {
      const local = localPolicies.find((policy) => policy.policyType === item.type);
      const resolved = effective[index];
      effectivePolicies[item.type] = resolved;
      const form = forms[item.type];
      form.mode = local?.mode || (props.scopeType === "GLOBAL" ? "DISABLED" : "INHERIT");
      form.lockVersion = local?.lockVersion;
      const config =
        local?.mode === "ENABLED" && local.configJson
          ? JSON.parse(local.configJson)
          : resolved?.effectiveConfig;
      resetConfig(item.type);
      if (config) Object.assign(form.config, config);
    });
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (props.scopeType !== "GLOBAL" && !props.scopeId) throw new Error("缺少策略作用域");
  validate();
  const saved = await Promise.all(
    visibleItems.value.map((item) => {
      const form = forms[item.type];
      const data: GatewayPolicyChange = { mode: form.mode, lockVersion: form.lockVersion };
      if (form.mode === "ENABLED") {
        if (item.type === "RATE_LIMIT") data.rateLimit = { ...forms.RATE_LIMIT.config };
        if (item.type === "TIMEOUT") data.timeout = { ...forms.TIMEOUT.config };
        if (item.type === "CIRCUIT_BREAKER")
          data.circuitBreaker = {
            ...forms.CIRCUIT_BREAKER.config,
            fallbackUri: forms.CIRCUIT_BREAKER.config.fallbackUri || undefined,
          };
        if (item.type === "ACCESS_CONTROL")
          data.accessControl = {
            accessMode: forms.ACCESS_CONTROL.config.accessMode,
            entries: forms.ACCESS_CONTROL.config.entries.map((entry) => ({ ...entry })),
          };
      }
      return GatewayApiRouteAPI.savePolicy(
        props.scopeType,
        props.scopeType === "GLOBAL" ? undefined : props.scopeId,
        item.type,
        data
      );
    })
  );
  saved.forEach((policy) => {
    forms[policy.policyType as GatewayPolicyType].lockVersion = policy.lockVersion;
  });
  await load();
}

function validate() {
  if (
    forms.RATE_LIMIT.mode === "ENABLED" &&
    forms.RATE_LIMIT.config.burstCapacity < forms.RATE_LIMIT.config.replenishRate
  ) {
    throw new Error("限流突发容量不能小于每秒令牌数");
  }
  const fallback = forms.CIRCUIT_BREAKER.config.fallbackUri;
  if (forms.CIRCUIT_BREAKER.mode === "ENABLED" && fallback && !fallback.startsWith("forward:/")) {
    throw new Error("降级地址仅支持 forward:/ 开头的内部地址");
  }
  if (forms.ACCESS_CONTROL.mode === "ENABLED") {
    const cidrs = forms.ACCESS_CONTROL.config.entries.map((entry) =>
      entry.cidr.trim().toLowerCase()
    );
    const cidrPattern = /^[0-9a-fA-F:.]+(?:\/\d{1,3})?$/;
    if (!cidrs.length || cidrs.some((cidr) => !cidr || !cidrPattern.test(cidr))) {
      throw new Error("请填写合法的 IP 或 CIDR");
    }
    if (new Set(cidrs).size !== cidrs.length) throw new Error("IP/CIDR 不能重复");
  }
}

function handleModeChange(type: GatewayPolicyType) {
  if (forms[type].mode !== "ENABLED") return;
  const inherited = effectivePolicies[type]?.effectiveConfig;
  if (inherited) Object.assign(forms[type].config, inherited);
}

function displayMode(type: GatewayPolicyType) {
  if (forms[type].mode !== "INHERIT") return forms[type].mode;
  return effectivePolicies[type]?.effectiveMode || "DISABLED";
}

function fieldsReadonly(type: GatewayPolicyType) {
  return props.readonly || forms[type].mode !== "ENABLED";
}

function effectivePolicyText(type: GatewayPolicyType) {
  const policy = effectivePolicies[type];
  if (!policy || policy.effectiveMode === "DISABLED") return "未启用";
  const source = { API: "API 自定义", APPLICATION: "应用自定义", GLOBAL: "全局默认" }[
    policy.sourceScope || "GLOBAL"
  ];
  return `${policyConfigText(type, policy.effectiveConfig || {})}（来源：${source}）`;
}

function policyConfigText(type: GatewayPolicyType, config: Record<string, any>) {
  if (type === "RATE_LIMIT")
    return `按 ${config.keyType}，每秒 ${config.replenishRate}，突发 ${config.burstCapacity}，单次 ${config.requestedTokens}`;
  if (type === "TIMEOUT")
    return `连接 ${config.connectTimeoutMs} ms，响应 ${config.responseTimeoutMs} ms`;
  if (type === "CIRCUIT_BREAKER")
    return `失败率 ${config.failureRateThreshold}%，慢调用率 ${config.slowCallRateThreshold}%，熔断等待 ${config.waitDurationInOpenStateMs} ms${config.fallbackUri ? `，降级 ${config.fallbackUri}` : ""}`;
  return `${config.accessMode === "ALLOWLIST" ? "白名单" : "黑名单"}，${config.entries?.length || 0} 条规则`;
}

function modeText(mode: GatewayPolicyMode) {
  if (mode === "INHERIT") return "继承上级";
  if (mode === "ENABLED") return props.scopeType === "GLOBAL" ? "全局默认" : "本级自定义";
  return "本级停用";
}

function modeTagType(mode: GatewayPolicyMode) {
  return mode === "ENABLED" ? "success" : mode === "DISABLED" ? "danger" : "info";
}
function policyForm<T>(config: T) {
  return {
    mode: "INHERIT" as GatewayPolicyMode,
    lockVersion: undefined as number | undefined,
    config,
  };
}
function resetAll() {
  visibleItems.value.forEach((item) => {
    forms[item.type].mode = "INHERIT";
    forms[item.type].lockVersion = undefined;
    resetConfig(item.type);
    delete effectivePolicies[item.type];
  });
}
function resetConfig(type: GatewayPolicyType) {
  if (type === "RATE_LIMIT") Object.assign(forms.RATE_LIMIT.config, defaultRateLimit());
  if (type === "TIMEOUT") Object.assign(forms.TIMEOUT.config, defaultTimeout());
  if (type === "CIRCUIT_BREAKER")
    Object.assign(forms.CIRCUIT_BREAKER.config, defaultCircuitBreaker());
  if (type === "ACCESS_CONTROL") Object.assign(forms.ACCESS_CONTROL.config, defaultAccessControl());
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
function defaultAccessControl(): GatewayAccessControlConfig {
  return { accessMode: "DENYLIST", entries: [{ cidr: "", description: "" }] };
}
function addAccessEntry() {
  if (forms.ACCESS_CONTROL.config.entries.length >= 20) {
    ElMessage.warning("每项策略最多配置 20 条 IP/CIDR");
    return;
  }
  forms.ACCESS_CONTROL.config.entries.push({ cidr: "", description: "" });
}
function removeAccessEntry(index: number) {
  forms.ACCESS_CONTROL.config.entries.splice(index, 1);
  if (!forms.ACCESS_CONTROL.config.entries.length) {
    forms.ACCESS_CONTROL.config.entries.push({ cidr: "", description: "" });
  }
}

defineExpose({ load, save });
</script>

<style scoped>
.policy-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.policy-fields--readonly {
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}
.policy-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.policy-field label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.policy-field--wide {
  grid-column: 1 / -1;
}
.entry-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.entry-row {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(260px, 1.5fr) 50px;
  gap: 10px;
}
.policy-field :deep(.el-select),
.policy-field :deep(.el-input-number) {
  width: 100%;
}
@media (max-width: 900px) {
  .policy-fields {
    grid-template-columns: 1fr;
  }
}
</style>
