<template>
  <el-card v-loading="loading" shadow="never">
    <template #header>
      <div class="panel-header">
        <div>
          <strong>IP 黑白名单</strong>
          <div class="panel-description">策略保存为草稿，发布后才会应用到网关路由。</div>
        </div>
        <el-button @click="loadPolicy">刷新</el-button>
      </div>
    </template>

    <el-form label-width="110px" class="access-form">
      <el-form-item label="作用域">
        <el-radio-group v-model="form.scopeType" @change="handleScopeChange">
          <el-radio-button value="GLOBAL">全局</el-radio-button>
          <el-radio-button value="APPLICATION">应用</el-radio-button>
          <el-radio-button value="API">API</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="form.scopeType !== 'GLOBAL'" label="作用域" required>
        <el-select
          v-model="form.scopeId"
          filterable
          :placeholder="form.scopeType === 'APPLICATION' ? '请选择应用' : '请选择 API'"
          style="max-width: 420px"
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
      <el-form-item label="策略状态">
        <el-radio-group v-model="form.mode">
          <el-radio value="INHERIT">继承上级</el-radio>
          <el-radio value="ENABLED">启用</el-radio>
          <el-radio value="DISABLED">显式关闭</el-radio>
        </el-radio-group>
      </el-form-item>

      <template v-if="form.mode === 'ENABLED'">
        <el-form-item label="名单模式">
          <el-radio-group v-model="form.accessMode">
            <el-radio value="DENYLIST">黑名单：命中拒绝</el-radio>
            <el-radio value="ALLOWLIST">白名单：仅命中放行</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-alert
          v-if="form.accessMode === 'ALLOWLIST'"
          title="白名单会拒绝所有未命中的来源；发布前请加入当前管理入口、反向代理和运维出口地址。"
          type="warning"
          :closable="false"
          show-icon
          class="mb-4"
        />

        <el-form-item label="IP/CIDR">
          <div class="entry-list">
            <div v-for="(entry, index) in form.entries" :key="index" class="entry-row">
              <el-input v-model.trim="entry.cidr" maxlength="64" placeholder="如 10.0.0.0/8" />
              <el-input
                v-model.trim="entry.description"
                maxlength="100"
                placeholder="说明（可选）"
              />
              <el-button type="danger" link @click="removeEntry(index)">删除</el-button>
            </div>
            <el-button type="primary" plain @click="addEntry">新增规则</el-button>
          </div>
        </el-form-item>
      </template>

      <el-form-item>
        <el-button
          v-hasPerm="['gateway:access-list:update']"
          type="primary"
          :loading="saving"
          @click="savePolicy"
        >
          保存策略
        </el-button>
        <el-button
          v-hasPerm="['gateway:access-list:publish']"
          type="success"
          :loading="publishing"
          @click="publishPolicy"
        >
          发布到网关
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import GatewayApiRouteAPI from "@/api/gateway-admin/gateway-api-route";
import type {
  GatewayAccessControlConfig,
  GatewayAccessControlEntry,
  GatewayApiAsset,
  GatewayPolicyMode,
  GatewayPolicyScopeType,
} from "@/types/api/gateway-api-route";

defineOptions({ name: "GatewayAccessListPanel" });

const loading = ref(false);
const saving = ref(false);
const publishing = ref(false);
const apiAssets = ref<GatewayApiAsset[]>([]);
const form = reactive({
  scopeType: "GLOBAL" as GatewayPolicyScopeType,
  scopeId: "",
  mode: "DISABLED" as GatewayPolicyMode,
  accessMode: "DENYLIST" as GatewayAccessControlConfig["accessMode"],
  entries: [{ cidr: "", description: "" }] as GatewayAccessControlEntry[],
  lockVersion: undefined as number | undefined,
});

const scopeOptions = computed(() => {
  if (form.scopeType === "APPLICATION") {
    return [...new Set(apiAssets.value.map((item) => item.serviceId))]
      .sort()
      .map((serviceId) => ({ value: serviceId, label: serviceId }));
  }
  return apiAssets.value.map((item) => ({
    value: item.id,
    label: `${item.httpMethod} ${item.upstreamPath} (${item.serviceId})`,
  }));
});

onMounted(async () => {
  try {
    const firstPage = await GatewayApiRouteAPI.listApis({ page: 1, pageSize: 200 });
    const pageCount = Math.ceil(firstPage.total / firstPage.pageSize);
    const remainingPages = await Promise.all(
      Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
        GatewayApiRouteAPI.listApis({ page: index + 2, pageSize: 200 })
      )
    );
    apiAssets.value = [firstPage, ...remainingPages].flatMap((page) => page.apis);
  } finally {
    await loadPolicy();
  }
});

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
    const policy = policies.find((item) => item.policyType === "ACCESS_CONTROL");
    resetPolicy();
    if (!policy) return;
    form.mode = policy.mode;
    form.lockVersion = policy.lockVersion;
    if (policy.configJson) {
      const config = JSON.parse(policy.configJson) as GatewayAccessControlConfig;
      form.accessMode = config.accessMode;
      form.entries = config.entries.length
        ? config.entries.map((entry) => ({ ...entry }))
        : emptyEntries();
    }
  } finally {
    loading.value = false;
  }
}

async function savePolicy() {
  if (form.scopeType !== "GLOBAL" && !form.scopeId) {
    ElMessage.warning("请先填写作用域 ID");
    return;
  }
  if (form.mode === "ENABLED" && !validateEntries()) return;
  saving.value = true;
  try {
    const policy = await GatewayApiRouteAPI.savePolicy(
      form.scopeType,
      form.scopeType === "GLOBAL" ? undefined : form.scopeId,
      "ACCESS_CONTROL",
      {
        mode: form.mode,
        accessControl:
          form.mode === "ENABLED"
            ? { accessMode: form.accessMode, entries: form.entries.map((entry) => ({ ...entry })) }
            : undefined,
        lockVersion: form.lockVersion,
      }
    );
    form.lockVersion = policy.lockVersion;
    ElMessage.success("访问控制策略已保存，发布后生效");
  } finally {
    saving.value = false;
  }
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

function validateEntries() {
  const cidrPattern = /^[0-9a-fA-F:.]+(?:\/\d{1,3})?$/;
  const normalized = form.entries.map((entry) => entry.cidr.trim().toLowerCase());
  if (!normalized.length || normalized.some((cidr) => !cidr || !cidrPattern.test(cidr))) {
    ElMessage.warning("请填写合法的 IP 或 CIDR");
    return false;
  }
  if (new Set(normalized).size !== normalized.length) {
    ElMessage.warning("IP/CIDR 不能重复");
    return false;
  }
  return true;
}

function addEntry() {
  if (form.entries.length >= 20) {
    ElMessage.warning("每项策略最多配置 20 条 IP/CIDR");
    return;
  }
  form.entries.push({ cidr: "", description: "" });
}

function removeEntry(index: number) {
  form.entries.splice(index, 1);
  if (!form.entries.length) form.entries = emptyEntries();
}

function resetPolicy() {
  form.mode = form.scopeType === "GLOBAL" ? "DISABLED" : "INHERIT";
  form.accessMode = "DENYLIST";
  form.entries = emptyEntries();
  form.lockVersion = undefined;
}

function emptyEntries(): GatewayAccessControlEntry[] {
  return [{ cidr: "", description: "" }];
}
</script>

<style scoped>
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.panel-description {
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.access-form {
  max-width: 980px;
}
.entry-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
}
.entry-row {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(260px, 1.5fr) 50px;
  gap: 10px;
}
</style>
