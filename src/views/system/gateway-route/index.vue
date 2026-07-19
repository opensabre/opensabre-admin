<template>
  <div class="app-container">
    <el-alert class="config-status" :closable="false" type="warning" show-icon>
      <template #title>
        配置中心：base-gateway.yml · 当前版本：{{ config.version || "读取中" }}
      </template>
      <template #default>
        编辑后必须确认“发布到配置中心”才会生效。发布使用当前版本校验，冲突时请刷新后重新编辑。
      </template>
    </el-alert>

    <el-card shadow="hover" class="table-section">
      <template #header>
        <div class="table-section__toolbar">
          <span>OAuth2 / OIDC 登录认证方式</span>
          <div>
            <el-button
              v-hasPerm="['gateway:oauth2-client:update']"
              type="success"
              icon="plus"
              @click="openOauthDialog()"
            >
              新增认证方式
            </el-button>
            <el-button
              v-hasPerm="['gateway:oauth2-client:update']"
              type="primary"
              :loading="oauthPublishing"
              @click="publishOauthClients"
            >
              发布认证方式
            </el-button>
          </div>
        </div>
      </template>
      <el-alert
        :closable="false"
        type="info"
        title="选择已有 OAuth Client 后，单独配置网关注册名和回调地址。密钥仅在新增或轮换时提交，发布后由网关在内存中热更新。"
        class="mb-4"
      />
      <el-table
        :data="config.oauth2Clients"
        border
        class="table-section__content"
        empty-text="尚未配置网关登录认证方式"
      >
        <el-table-column label="注册名" prop="registrationId" min-width="180" />
        <el-table-column label="Client ID" prop="clientId" min-width="180" />
        <el-table-column label="Provider" prop="provider" min-width="140" />
        <el-table-column
          label="回调地址"
          prop="redirectUri"
          min-width="280"
          show-overflow-tooltip
        />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">
              {{ row.enabled ? "启用" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130">
          <template #default="{ $index }">
            <el-button
              v-hasPerm="['gateway:oauth2-client:update']"
              link
              type="primary"
              size="small"
              @click="openOauthDialog($index)"
            >
              编辑
            </el-button>
            <el-button
              v-hasPerm="['gateway:oauth2-client:update']"
              link
              type="danger"
              size="small"
              @click="config.oauth2Clients.splice($index, 1)"
            >
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <div class="filter-section">
      <el-form :inline="true">
        <el-form-item label="关键字">
          <el-input v-model="keyword" clearable placeholder="路由 ID、Path 或目标 URI" />
        </el-form-item>
        <el-form-item class="search-buttons">
          <el-button icon="refresh" :loading="loading" @click="loadConfig">刷新配置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card shadow="hover" class="table-section">
      <template #header>
        <div class="table-section__toolbar">
          <span>全局过滤器与限流</span>
          <el-button
            v-hasPerm="['gateway:route:update']"
            type="primary"
            @click="saveDefaultFilters"
          >
            发布全局配置
          </el-button>
        </div>
      </template>
      <el-alert
        :closable="false"
        type="info"
        title="全局过滤器对所有显式路由生效；限流使用 Redis 令牌桶，发布会立即影响网关流量。"
        class="mb-4"
      />
      <el-form label-width="130px">
        <el-form-item label="启用全局限流"><el-switch v-model="rateLimit.enabled" /></el-form-item>
        <template v-if="rateLimit.enabled">
          <el-form-item label="限流维度">
            <el-radio-group v-model="rateLimit.keyResolver">
              <el-radio value="#{@remoteAddressKeyResolver}">客户端 IP</el-radio>
              <el-radio value="#{@apiKeyResolver}">请求路径</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="补充速率(请求/秒)">
            <el-input-number v-model="rateLimit.replenishRate" :min="1" :max="100000" />
          </el-form-item>
          <el-form-item label="突发容量">
            <el-input-number v-model="rateLimit.burstCapacity" :min="1" :max="100000" />
          </el-form-item>
        </template>
        <el-form-item label="其他全局过滤器">
          <el-tag v-for="filter in nonRateLimitFilters" :key="filter.name" class="mr-2">
            {{ filter.name }}
          </el-tag>
          <span v-if="!nonRateLimitFilters.length" class="text-gray">未配置</span>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-section">
      <div class="table-section__toolbar">
        <span>显式路由（{{ filteredRoutes.length }}）</span>
        <div>
          <span v-if="config.version" class="version">配置 MD5：{{ config.version }}</span>
          <el-button
            v-hasPerm="['gateway:route:create']"
            type="success"
            icon="plus"
            @click="openCreate"
          >
            新增路由
          </el-button>
        </div>
      </div>
      <el-table
        v-loading="loading"
        :data="filteredRoutes"
        border
        class="table-section__content"
        empty-text="当前配置没有显式网关路由"
      >
        <el-table-column label="路由 ID" prop="id" min-width="180" />
        <el-table-column label="匹配路径" min-width="220">
          <template #default="{ row }">{{ pathSummary(row) }}</template>
        </el-table-column>
        <el-table-column label="目标 URI" prop="uri" min-width="200" show-overflow-tooltip />
        <el-table-column label="优先级" prop="order" width="90" align="center" />
        <el-table-column label="过滤器" min-width="170">
          <template #default="{ row }">{{ filterSummary(row) }}</template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="150">
          <template #default="{ row }">
            <el-button
              v-hasPerm="['gateway:route:update']"
              type="primary"
              link
              size="small"
              icon="edit"
              @click="openEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-hasPerm="['gateway:route:delete']"
              type="danger"
              link
              size="small"
              icon="delete"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialog.visible"
      :title="dialog.isEdit ? '编辑网关路由' : '新增网关路由'"
      width="720px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="路由 ID" prop="id">
              <el-input
                v-model="form.id"
                :disabled="dialog.isEdit"
                placeholder="如 base-organization"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-input-number v-model="form.order" :min="-9999" :max="9999" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="目标 URI" prop="uri">
          <el-input v-model="form.uri" placeholder="lb://base-organization" />
        </el-form-item>
        <el-alert
          :closable="false"
          type="info"
          title="参数填写规则：Path 直接填 /api/**；其他断言和过滤器按 key=value,key2=value2 填写。"
          class="definition-tip"
        />
        <el-form-item label="断言" required>
          <div class="definition-list">
            <div
              v-for="(item, index) in form.predicates"
              :key="`p-${index}`"
              class="definition-row"
            >
              <el-select v-model="item.name" placeholder="断言">
                <el-option
                  v-for="name in predicateOptions"
                  :key="name"
                  :label="name"
                  :value="name"
                />
              </el-select>
              <el-input v-model="item.argsText" placeholder="Path：/api/**；其他：key=value" />
              <el-button
                link
                type="danger"
                icon="delete"
                @click="form.predicates.splice(index, 1)"
              />
            </div>
            <el-button
              link
              type="primary"
              icon="plus"
              @click="form.predicates.push(emptyDefinition())"
            >
              添加断言
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="过滤器">
          <div class="definition-list">
            <div v-for="(item, index) in form.filters" :key="`f-${index}`" class="definition-row">
              <el-select v-model="item.name" placeholder="过滤器">
                <el-option v-for="name in filterOptions" :key="name" :label="name" :value="name" />
              </el-select>
              <el-input v-model="item.argsText" placeholder="如 StripPrefix：parts=2" />
              <el-button link type="danger" icon="delete" @click="form.filters.splice(index, 1)" />
            </div>
            <el-button
              link
              type="primary"
              icon="plus"
              @click="form.filters.push(emptyDefinition())"
            >
              添加过滤器
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="publishing" @click="handlePublish">
          确认发布到配置中心
        </el-button>
      </template>
    </el-dialog>
    <el-dialog
      v-model="oauthDialog.visible"
      :title="oauthDialog.index < 0 ? '新增 OAuth2 认证方式' : '编辑 OAuth2 认证方式'"
      width="680px"
    >
      <el-form label-width="120px">
        <el-form-item label="网关注册名">
          <el-input
            v-model="oauthForm.registrationId"
            :disabled="oauthDialog.index >= 0"
            placeholder="如 base-gateway-client"
          />
        </el-form-item>
        <el-form-item label="OAuth Client">
          <el-select
            v-model="oauthForm.clientId"
            filterable
            style="width: 100%"
            @change="syncSelectedClient"
          >
            <el-option
              v-for="client in oauthClientOptions"
              :key="client.clientId"
              :label="`${client.clientName || client.clientId}（${client.clientId}）`"
              :value="client.clientId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Provider">
          <el-input v-model="oauthForm.provider" placeholder="如 custom-issuer" />
        </el-form-item>
        <el-form-item label="Issuer URI">
          <el-input v-model="oauthForm.issuerUri" placeholder="如 http://opensabre:8000" />
        </el-form-item>
        <el-form-item label="回调地址"><el-input v-model="oauthForm.redirectUri" /></el-form-item>
        <el-form-item label="作用域">
          <el-select
            v-model="oauthForm.scopes"
            multiple
            filterable
            allow-create
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="客户端密钥">
          <el-input
            v-model="oauthForm.clientSecret"
            show-password
            placeholder="新增必填；编辑留空则保持已发布密钥"
          />
        </el-form-item>
        <el-form-item label="启用"><el-switch v-model="oauthForm.enabled" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="oauthDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveOauthClient">保存到待发布配置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import GatewayRouteAPI from "@/api/sysadmin/gateway-route";
import OAuthClientAPI from "@/api/auth/client";
import type {
  GatewayOauth2Client,
  GatewayRoute,
  GatewayRouteDefinition,
  OAuthClientItem,
} from "@/types/api";
import { ElMessage, ElMessageBox, type FormInstance } from "element-plus";

defineOptions({ name: "GatewayRoute" });
type EditableDefinition = { name: string; argsText: string };
const predicateOptions = [
  "Path",
  "Host",
  "Method",
  "Header",
  "Query",
  "RemoteAddr",
  "After",
  "Before",
  "Between",
];
const filterOptions = [
  "StripPrefix",
  "PrefixPath",
  "RewritePath",
  "AddRequestHeader",
  "AddResponseHeader",
  "RemoveRequestHeader",
  "RemoveResponseHeader",
  "Retry",
  "CircuitBreaker",
];
const formRef = ref<FormInstance>();
const loading = ref(false);
const publishing = ref(false);
const keyword = ref("");
const config = reactive({
  version: "",
  routes: [] as GatewayRoute[],
  defaultFilters: [] as GatewayRouteDefinition[],
  oauth2Clients: [] as GatewayOauth2Client[],
});
const oauthPublishing = ref(false);
const oauthClientOptions = ref<(OAuthClientItem & { clientId: string })[]>([]);
const oauthDialog = reactive({ visible: false, index: -1 });
const oauthForm = reactive<GatewayOauth2Client>({
  registrationId: "",
  provider: "custom-issuer",
  issuerUri: "",
  clientId: "",
  clientSecret: "",
  redirectUri: "",
  scopes: ["read", "openid", "profile"],
  enabled: true,
});
const rateLimit = reactive({
  enabled: false,
  replenishRate: 2,
  burstCapacity: 10,
  keyResolver: "#{@remoteAddressKeyResolver}",
});
const nonRateLimitFilters = computed(() =>
  config.defaultFilters.filter((item) => item.name !== "RequestRateLimiter")
);
const dialog = reactive({ visible: false, isEdit: false, routeId: "" });
const form = reactive({
  id: "",
  uri: "",
  order: 0,
  predicates: [] as EditableDefinition[],
  filters: [] as EditableDefinition[],
});
const rules = {
  id: [{ required: true, message: "请输入路由 ID", trigger: "blur" }],
  uri: [{ required: true, message: "请输入目标 URI", trigger: "blur" }],
};
const filteredRoutes = computed(() => {
  const search = keyword.value.trim().toLowerCase();
  return !search
    ? config.routes
    : config.routes.filter((route) =>
        `${route.id} ${route.uri} ${pathSummary(route)}`.toLowerCase().includes(search)
      );
});
function emptyDefinition(): EditableDefinition {
  return { name: "", argsText: "" };
}
function pathSummary(route: GatewayRoute) {
  return (
    route.predicates
      .filter((item) => item.name === "Path")
      .map((item) => item.args.pattern || item.args.value)
      .filter(Boolean)
      .join("，") || "-"
  );
}
function filterSummary(route: GatewayRoute) {
  return (
    route.filters
      .map((item) => `${item.name}(${Object.values(item.args).filter(Boolean).join(", ")})`)
      .join("，") || "-"
  );
}
function definitionText(item: GatewayRouteDefinition) {
  return item.name === "Path"
    ? item.args.pattern || item.args.value || ""
    : Object.entries(item.args)
        .map(([key, value]) => (key === "value" ? value : `${key}=${value}`))
        .join(",");
}
function parseArgs(name: string, text: string): Record<string, string> {
  const value = text.trim();
  if (!value) return {};
  if (name === "Path") return { pattern: value };
  return Object.fromEntries(
    value.split(",").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return rest.length ? [key.trim(), rest.join("=").trim()] : ["value", key.trim()];
    })
  );
}
function toRoute(): GatewayRoute {
  return {
    id: form.id.trim(),
    uri: form.uri.trim(),
    order: form.order,
    predicates: form.predicates.map((item) => ({
      name: item.name,
      args: parseArgs(item.name, item.argsText),
    })),
    filters: form.filters.map((item) => ({
      name: item.name,
      args: parseArgs(item.name, item.argsText),
    })),
  };
}
function resetForm() {
  Object.assign(form, { id: "", uri: "", order: 0, predicates: [], filters: [] });
  formRef.value?.clearValidate();
}
function openCreate() {
  resetForm();
  form.predicates.push({ name: "Path", argsText: "" });
  dialog.isEdit = false;
  dialog.visible = true;
}
function openEdit(route: GatewayRoute) {
  resetForm();
  Object.assign(form, {
    id: route.id,
    uri: route.uri,
    order: route.order,
    predicates: route.predicates.map((item) => ({
      name: item.name,
      argsText: definitionText(item),
    })),
    filters: route.filters.map((item) => ({ name: item.name, argsText: definitionText(item) })),
  });
  dialog.routeId = route.id;
  dialog.isEdit = true;
  dialog.visible = true;
}
function syncRateLimit(filters: GatewayRouteDefinition[]) {
  const filter = filters.find((item) => item.name === "RequestRateLimiter");
  rateLimit.enabled = !!filter;
  if (!filter) return;
  rateLimit.replenishRate = Number(filter.args["redis-rate-limiter.replenishRate"] || 2);
  rateLimit.burstCapacity = Number(filter.args["redis-rate-limiter.burstCapacity"] || 10);
  rateLimit.keyResolver = filter.args["key-resolver"] || "#{@remoteAddressKeyResolver}";
}
async function loadConfig() {
  loading.value = true;
  try {
    const data = await GatewayRouteAPI.getConfig();
    config.version = data.version;
    config.routes = data.routes;
    config.defaultFilters = data.defaultFilters || [];
    config.oauth2Clients = (data.oauth2Clients || []).map((item) => ({
      ...item,
      clientSecret: "",
    }));
    syncRateLimit(config.defaultFilters);
  } finally {
    loading.value = false;
  }
}
async function loadOauthClientOptions() {
  const result = await OAuthClientAPI.getPage({ pageNum: 1, pageSize: 100 });
  oauthClientOptions.value = result.data.filter(
    (item): item is OAuthClientItem & { clientId: string } => Boolean(item.clientId)
  );
}
function syncSelectedClient(clientId: string) {
  const client = oauthClientOptions.value.find((item) => item.clientId === clientId);
  if (client && !oauthForm.redirectUri)
    oauthForm.redirectUri = Array.isArray(client.redirectUris)
      ? client.redirectUris[0] || ""
      : String(client.redirectUris || "").split(",")[0];
}
function openOauthDialog(index = -1) {
  oauthDialog.index = index;
  const value =
    index < 0
      ? {
          registrationId: "",
          provider: "custom-issuer",
          issuerUri: "",
          clientId: "",
          clientSecret: "",
          redirectUri: "",
          scopes: ["read", "openid", "profile"],
          enabled: true,
        }
      : { ...config.oauth2Clients[index], clientSecret: "" };
  Object.assign(oauthForm, value);
  oauthDialog.visible = true;
}
function saveOauthClient() {
  if (
    !oauthForm.registrationId ||
    !oauthForm.provider ||
    !oauthForm.issuerUri ||
    !oauthForm.clientId ||
    !oauthForm.redirectUri ||
    !oauthForm.scopes.length
  )
    return ElMessage.warning("请填写认证方式的必填项");
  if (oauthDialog.index < 0 && oauthForm.enabled && !oauthForm.clientSecret)
    return ElMessage.warning("启用的认证方式必须填写客户端密钥");
  const value = { ...oauthForm, scopes: [...oauthForm.scopes] };
  if (oauthDialog.index < 0) config.oauth2Clients.push(value);
  else config.oauth2Clients.splice(oauthDialog.index, 1, value);
  oauthDialog.visible = false;
}
async function publishOauthClients() {
  await ElMessageBox.confirm(
    "将 OAuth2/OIDC 认证方式发布到 Nacos，网关会热更新内存快照。",
    "确认发布",
    { type: "warning" }
  );
  oauthPublishing.value = true;
  try {
    const result = await GatewayRouteAPI.updateOauth2Clients({
      baseVersion: config.version,
      clients: config.oauth2Clients,
    });
    config.version = result.version;
    config.oauth2Clients = result.oauth2Clients || [];
    ElMessage.success("OAuth2 认证方式已发布");
  } finally {
    oauthPublishing.value = false;
  }
}
async function saveDefaultFilters() {
  if (rateLimit.burstCapacity < rateLimit.replenishRate)
    return ElMessage.warning("突发容量不能小于补充速率");
  const defaultFilters = [...nonRateLimitFilters.value];
  if (rateLimit.enabled)
    defaultFilters.push({
      name: "RequestRateLimiter",
      args: {
        "redis-rate-limiter.replenishRate": String(rateLimit.replenishRate),
        "redis-rate-limiter.burstCapacity": String(rateLimit.burstCapacity),
        "rate-limiter": "#{@defaultRedisRateLimiter}",
        "key-resolver": rateLimit.keyResolver,
      },
    });
  await ElMessageBox.confirm(
    "将全局过滤器和限流配置发布到 Nacos，配置会立即影响所有显式路由。",
    "确认发布",
    { type: "warning" }
  );
  publishing.value = true;
  try {
    const result = await GatewayRouteAPI.updateDefaultFilters({
      defaultFilters,
      baseVersion: config.version,
    });
    config.version = result.version;
    config.defaultFilters = result.defaultFilters;
    syncRateLimit(result.defaultFilters);
    ElMessage.success("全局配置已发布");
  } finally {
    publishing.value = false;
  }
}
async function handlePublish() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (!form.predicates.length) return ElMessage.warning("至少需要一个断言");
  const route = toRoute();
  await ElMessageBox.confirm(
    `将路由【${route.id}】发布到 Nacos，配置会立即影响网关流量。`,
    "确认发布",
    { type: "warning", confirmButtonText: "发布", cancelButtonText: "取消" }
  );
  publishing.value = true;
  try {
    const result = dialog.isEdit
      ? await GatewayRouteAPI.update(dialog.routeId, { route, baseVersion: config.version })
      : await GatewayRouteAPI.create({ route, baseVersion: config.version });
    config.version = result.version;
    await loadConfig();
    dialog.visible = false;
    ElMessage.success(`发布成功，配置版本：${result.version}`);
  } finally {
    publishing.value = false;
  }
}
async function handleDelete(route: GatewayRoute) {
  await ElMessageBox.confirm(`确认删除路由【${route.id}】并发布到配置中心吗？`, "危险操作", {
    type: "warning",
    confirmButtonText: "删除并发布",
    cancelButtonText: "取消",
  });
  loading.value = true;
  try {
    const result = await GatewayRouteAPI.deleteById(route.id, config.version);
    config.version = result.version;
    await loadConfig();
    ElMessage.success("路由已删除并发布");
  } finally {
    loading.value = false;
  }
}
onMounted(async () => {
  await Promise.all([loadConfig(), loadOauthClientOptions()]);
});
</script>

<style scoped lang="scss">
.config-status {
  margin-bottom: 18px;
}
.table-section__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.version {
  margin-right: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.definition-tip {
  margin-bottom: 12px;
}
.definition-list {
  width: 100%;
}
.definition-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.definition-row .el-select {
  width: 160px;
}
</style>
