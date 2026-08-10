<template>
  <el-card v-loading="loading" shadow="never">
    <template #header>
      <div class="panel-header">
        <div>
          <strong>全局默认过滤器</strong>
          <div class="description">
            对应 spring.cloud.gateway.default-filters，按列表顺序应用于所有显式路由。
          </div>
        </div>
        <el-space>
          <el-tag :type="hasDraft ? 'warning' : 'info'">
            {{ hasDraft ? "策略草稿" : "当前生效配置" }}
          </el-tag>
          <el-button @click="load">刷新</el-button>
        </el-space>
      </div>
    </template>

    <el-alert
      title="TokenRelay 负责向下游转发登录令牌，属于系统保护项，不能停用、修改或删除。"
      type="info"
      :closable="false"
      class="mb-4"
    />

    <el-table :data="filters" row-key="rowId" border>
      <el-table-column label="#" width="70" align="center">
        <template #default="scope">{{ scope.$index + 1 }}</template>
      </el-table-column>
      <el-table-column prop="name" label="Filter" min-width="190">
        <template #default="{ row }">
          <el-space>
            <span class="filter-name">{{ row.name }}</span>
            <el-tag v-if="isProtected(row)" size="small" type="success">系统保护</el-tag>
            <el-tag v-else-if="!supportedNames.includes(row.name)" size="small" type="warning">
              历史类型
            </el-tag>
          </el-space>
        </template>
      </el-table-column>
      <el-table-column label="参数" min-width="380">
        <template #default="{ row }">
          <span v-if="!Object.keys(row.args).length" class="muted">无参数</span>
          <el-tag
            v-for="(value, key) in row.args"
            :key="key"
            class="arg-tag"
            type="info"
            effect="plain"
          >
            {{ key }}={{ value }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-switch v-model="row.enabled" :disabled="isProtected(row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="{ row, $index }">
          <el-button link type="primary" :disabled="isProtected(row)" @click="openEdit($index)">
            修改
          </el-button>
          <el-button link :disabled="$index === 0" @click="move($index, -1)">上移</el-button>
          <el-button link :disabled="$index === filters.length - 1" @click="move($index, 1)">
            下移
          </el-button>
          <el-button link type="danger" :disabled="isProtected(row)" @click="remove($index)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="toolbar">
      <el-button
        v-hasPerm="['gateway:global-rule:update']"
        type="primary"
        plain
        @click="openCreate"
      >
        新增 Filter
      </el-button>
      <el-button v-hasPerm="['gateway:global-rule:update']" @click="addSecurityHeaders">
        添加安全响应头模板
      </el-button>
      <span class="toolbar-spacer" />
      <el-button
        v-hasPerm="['gateway:global-rule:update']"
        type="primary"
        :loading="saving"
        @click="save"
      >
        保存草稿
      </el-button>
      <el-button
        v-hasPerm="['gateway:global-rule:publish']"
        type="success"
        @click="goReleaseCenter"
      >
        查看并发布全部变更
      </el-button>
    </div>
  </el-card>

  <el-dialog
    v-model="dialogVisible"
    :title="editIndex < 0 ? '新增 Filter' : '修改 Filter'"
    width="900px"
  >
    <el-form label-width="110px">
      <el-form-item label="Filter 类型" required>
        <el-select
          v-model="editing.name"
          filterable
          style="width: 100%"
          @change="applyFilterTemplate"
        >
          <el-option
            v-for="name in editableNames"
            :key="name"
            :label="`${name} — ${filterDescriptions[name]}`"
            :value="name"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="参数">
        <div class="args-editor">
          <div v-for="(arg, index) in editingArgs" :key="index" class="arg-row">
            <el-input v-model.trim="arg.key" placeholder="参数名，如 name" />
            <el-input v-model="arg.value" placeholder="参数值" />
            <el-button link type="danger" @click="editingArgs.splice(index, 1)">删除</el-button>
          </div>
          <el-button plain @click="editingArgs.push({ key: '', value: '' })">新增参数</el-button>
        </div>
      </el-form-item>
      <el-form-item label="启用">
        <el-switch v-model="editing.enabled" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmEdit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import GatewayApiRouteAPI from "@/api/gateway-admin/gateway-api-route";
import type {
  GatewayDefaultFilterDraft,
  GatewayDefaultFiltersConfig,
} from "@/types/api/gateway-api-route";

defineOptions({ name: "GatewayDefaultFiltersPanel" });

type FilterRow = GatewayDefaultFilterDraft & { rowId: string };
type ArgRow = { key: string; value: string };

const supportedNames = [
  "TokenRelay",
  "AddRequestHeader",
  "AddResponseHeader",
  "RemoveRequestHeader",
  "RemoveResponseHeader",
  "Retry",
  "CircuitBreaker",
  "RequestRateLimiter",
];
const editableNames = supportedNames.filter((name) => name !== "TokenRelay");
const filterDescriptions: Record<string, string> = {
  TokenRelay: "转发 OAuth2 登录令牌",
  AddRequestHeader: "向下游请求增加 Header",
  AddResponseHeader: "向响应增加 Header",
  RemoveRequestHeader: "移除下游请求 Header",
  RemoveResponseHeader: "移除响应 Header",
  Retry: "失败请求重试",
  CircuitBreaker: "熔断与降级",
  RequestRateLimiter: "Redis 全局限流",
};
const loading = ref(false);
const saving = ref(false);
const router = useRouter();
const hasDraft = ref(false);
const lockVersion = ref<number>();
const baseVersion = ref("");
const filters = ref<FilterRow[]>([]);
const dialogVisible = ref(false);
const editIndex = ref(-1);
const editing = reactive<GatewayDefaultFilterDraft>({ name: "", args: {}, enabled: true });
const editingArgs = ref<ArgRow[]>([]);

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const [runtime, policies] = await Promise.all([
      GatewayApiRouteAPI.getCurrentConfig(),
      GatewayApiRouteAPI.listPolicies("GLOBAL"),
    ]);
    baseVersion.value = runtime.version;
    const policy = policies.find((item) => item.policyType === "DEFAULT_FILTERS");
    hasDraft.value = Boolean(policy);
    lockVersion.value = policy?.lockVersion;
    const config: GatewayDefaultFiltersConfig | undefined = policy?.configJson
      ? JSON.parse(policy.configJson)
      : undefined;
    const source =
      config?.filters ||
      (runtime.defaultFilters || []).map((filter) => ({ ...filter, enabled: true }));
    filters.value = source.map(toRow);
  } finally {
    loading.value = false;
  }
}

function toRow(filter: GatewayDefaultFilterDraft): FilterRow {
  return {
    ...structuredClone(filter),
    args: { ...(filter.args || {}) },
    rowId: crypto.randomUUID(),
  };
}

function isProtected(filter: GatewayDefaultFilterDraft) {
  return filter.name === "TokenRelay";
}

function openCreate() {
  editIndex.value = -1;
  Object.assign(editing, { name: "AddResponseHeader", args: {}, enabled: true });
  editingArgs.value = [
    { key: "name", value: "" },
    { key: "value", value: "" },
  ];
  dialogVisible.value = true;
}

function applyFilterTemplate(name: string) {
  const templates: Record<string, Record<string, string>> = {
    AddRequestHeader: { name: "", value: "" },
    AddResponseHeader: { name: "", value: "" },
    RemoveRequestHeader: { name: "" },
    RemoveResponseHeader: { name: "" },
    Retry: { retries: "3", statuses: "BAD_GATEWAY", methods: "GET" },
    CircuitBreaker: { name: "globalCircuitBreaker" },
    RequestRateLimiter: {
      "redis-rate-limiter.replenishRate": "10",
      "redis-rate-limiter.burstCapacity": "20",
      "rate-limiter": "#{@defaultRedisRateLimiter}",
      "key-resolver": "#{@remoteAddressKeyResolver}",
    },
  };
  editingArgs.value = Object.entries(templates[name] || {}).map(([key, value]) => ({ key, value }));
}

function openEdit(index: number) {
  editIndex.value = index;
  const row = filters.value[index];
  Object.assign(editing, {
    name: row.name,
    args: { ...row.args },
    enabled: row.enabled,
  });
  editingArgs.value = Object.entries(editing.args).map(([key, value]) => ({ key, value }));
  dialogVisible.value = true;
}

function confirmEdit() {
  if (!editing.name.trim()) return warn("请选择或输入 Filter 类型");
  const args: Record<string, string> = {};
  for (const arg of editingArgs.value) {
    if (!arg.key || !arg.value) return warn("Filter 参数名和值不能为空");
    if (args[arg.key] !== undefined) return warn(`参数 ${arg.key} 重复`);
    args[arg.key] = arg.value;
  }
  const row = toRow({ name: editing.name.trim(), args, enabled: editing.enabled });
  if (editIndex.value < 0) filters.value.push(row);
  else filters.value.splice(editIndex.value, 1, row);
  dialogVisible.value = false;
}

function move(index: number, offset: number) {
  const target = index + offset;
  if (target < 0 || target >= filters.value.length) return;
  const [item] = filters.value.splice(index, 1);
  filters.value.splice(target, 0, item);
}

function remove(index: number) {
  filters.value.splice(index, 1);
}

async function addSecurityHeaders() {
  const headers = [
    ["X-Content-Type-Options", "nosniff"],
    ["X-Frame-Options", "DENY"],
    ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ];
  const existing = new Set(
    filters.value
      .filter((filter) => filter.name === "AddResponseHeader")
      .map((filter) => filter.args.name?.toLowerCase())
  );
  headers.forEach(([name, value]) => {
    if (existing.has(name.toLowerCase())) return;
    filters.value.push(toRow({ name: "RemoveResponseHeader", args: { name }, enabled: true }));
    filters.value.push(toRow({ name: "AddResponseHeader", args: { name, value }, enabled: true }));
  });
  ElMessage.success("已添加基础安全响应头，可继续修改参数");
}

function validate() {
  const tokenRelays = filters.value.filter((filter) => isProtected(filter) && filter.enabled);
  if (tokenRelays.length !== 1) return warn("必须包含且启用唯一的 TokenRelay");
  if (
    filters.value.some(
      (filter) => !filter.name || Object.values(filter.args).some((value) => /[\r\n]/.test(value))
    )
  ) {
    return warn("Filter 名称不能为空，参数值不能包含换行");
  }
  return true;
}

async function save() {
  if (!validate()) return false;
  saving.value = true;
  try {
    const policy = await GatewayApiRouteAPI.savePolicy("GLOBAL", undefined, "DEFAULT_FILTERS", {
      mode: "ENABLED",
      defaultFilters: {
        filters: filters.value.map(({ name, args, enabled }) => ({ name, args, enabled })),
      },
      lockVersion: lockVersion.value,
    });
    lockVersion.value = policy.lockVersion;
    hasDraft.value = true;
    ElMessage.success("全局过滤器草稿已保存");
    return true;
  } finally {
    saving.value = false;
  }
}

async function goReleaseCenter() { await router.push("/gateway/releases"); }

function warn(message: string) {
  ElMessage.warning(message);
  return false;
}
</script>

<style scoped>
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.description {
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.filter-name {
  font-family: monospace;
  font-weight: 600;
}
.muted {
  color: var(--el-text-color-secondary);
}
.arg-tag {
  max-width: 100%;
  margin: 2px 6px 2px 0;
}
.toolbar {
  display: flex;
  align-items: center;
  margin-top: 16px;
}
.toolbar-spacer {
  flex: 1;
}
.args-editor {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
}
.arg-row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(240px, 1.4fr) 50px;
  gap: 10px;
}
</style>
