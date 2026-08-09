<template>
  <el-card v-loading="loading" shadow="never">
    <template #header>
      <div class="panel-header">
        <div>
          <strong>全局跨域规则</strong>
          <div class="description">
            对应 spring.cloud.gateway.globalcors.cors-configurations，按 Path 分别管理。
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
      title="删除规则后需保存或发布才会生效；删除全部规则并发布会移除 globalcors。"
      type="info"
      :closable="false"
      class="mb-4"
    />

    <el-table :data="rules" row-key="pathPattern" border empty-text="暂无跨域规则">
      <el-table-column prop="pathPattern" label="Path Pattern" min-width="170" />
      <el-table-column label="允许的 Origin" min-width="300">
        <template #default="{ row }">
          <el-tag
            v-for="origin in [...row.allowedOrigins, ...row.allowedOriginPatterns]"
            :key="origin"
            class="value-tag"
            type="info"
            effect="plain"
          >
            {{ origin }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="方法" min-width="220">
        <template #default="{ row }">
          <el-tag v-for="method in row.allowedMethods" :key="method" class="value-tag">
            {{ method }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="凭证" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.allowCredentials ? 'success' : 'info'">
            {{ row.allowCredentials ? "允许" : "禁止" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="maxAgeSeconds" label="预检缓存（秒）" width="140" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ $index }">
          <el-button link type="primary" @click="openEdit($index)">修改</el-button>
          <el-button link type="danger" @click="remove($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="toolbar">
      <el-button v-hasPerm="['gateway:cors:update']" type="primary" plain @click="openCreate">
        新增跨域规则
      </el-button>
      <el-checkbox v-model="addToSimpleUrlHandlerMapping">
        处理未匹配路由的 OPTIONS 请求
      </el-checkbox>
      <span class="toolbar-spacer" />
      <el-button v-hasPerm="['gateway:cors:update']" type="primary" :loading="saving" @click="save">
        保存草稿
      </el-button>
      <el-button
        v-hasPerm="['gateway:global-rule:publish']"
        type="success"
        :loading="publishing"
        @click="publish"
      >
        预检并发布
      </el-button>
    </div>
  </el-card>

  <el-dialog
    v-model="dialogVisible"
    :title="editIndex < 0 ? '新增跨域规则' : '修改跨域规则'"
    width="900px"
  >
    <el-form label-width="150px">
      <el-form-item label="Path Pattern" required>
        <el-input v-model.trim="editing.pathPattern" placeholder="如 /** 或 /api/**" />
      </el-form-item>
      <el-alert
        v-if="editing.allowCredentials"
        title="允许凭证时不能使用 * 作为精确 Origin，请填写明确 Origin 或 Origin Pattern。"
        type="warning"
        :closable="false"
        class="mb-4"
      />
      <el-form-item label="允许的 Origin" required>
        <TagInput v-model="editing.allowedOrigins" placeholder="如 https://admin.example.com" />
      </el-form-item>
      <el-form-item label="Origin Pattern">
        <TagInput v-model="editing.allowedOriginPatterns" placeholder="如 https://*.example.com" />
      </el-form-item>
      <el-form-item label="允许的方法" required>
        <el-select v-model="editing.allowedMethods" multiple style="width: 100%">
          <el-option v-for="method in methods" :key="method" :label="method" :value="method" />
        </el-select>
      </el-form-item>
      <el-form-item label="允许的 Header" required>
        <TagInput v-model="editing.allowedHeaders" placeholder="如 Authorization；可使用 *" />
      </el-form-item>
      <el-form-item label="暴露的 Header">
        <TagInput v-model="editing.exposedHeaders" placeholder="如 X-Request-Id" />
      </el-form-item>
      <el-form-item label="允许携带凭证">
        <el-switch v-model="editing.allowCredentials" />
      </el-form-item>
      <el-form-item label="预检缓存时间">
        <el-input-number v-model="editing.maxAgeSeconds" :min="0" :max="86400" />
        <span class="unit">秒</span>
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
import type { GatewayCorsConfig, GatewayCorsRule } from "@/types/api/gateway-api-route";
import TagInput from "./components/TagInput.vue";

defineOptions({ name: "GatewayCorsPanel" });

const methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"];
const loading = ref(false);
const saving = ref(false);
const publishing = ref(false);
const hasDraft = ref(false);
const lockVersion = ref<number>();
const baseVersion = ref("");
const rules = ref<GatewayCorsRule[]>([]);
const addToSimpleUrlHandlerMapping = ref(true);
const dialogVisible = ref(false);
const editIndex = ref(-1);
const editing = reactive<GatewayCorsRule>(defaults());

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const [runtime, policies] = await Promise.all([
      GatewayApiRouteAPI.getCurrentConfig(),
      GatewayApiRouteAPI.listPolicies("GLOBAL"),
    ]);
    baseVersion.value = runtime.version;
    const policy = policies.find((item) => item.policyType === "CORS");
    hasDraft.value = Boolean(policy);
    lockVersion.value = policy?.lockVersion;
    if (policy?.configJson) {
      const config = JSON.parse(policy.configJson) as GatewayCorsConfig;
      rules.value = config.rules.map(copyRule);
      addToSimpleUrlHandlerMapping.value = config.addToSimpleUrlHandlerMapping;
    } else {
      rules.value = Object.entries(runtime.globalCorsConfigurations || {}).map(([path, values]) =>
        fromRuntime(path, values)
      );
      addToSimpleUrlHandlerMapping.value = runtime.corsAddToSimpleUrlHandlerMapping ?? true;
    }
  } finally {
    loading.value = false;
  }
}

function fromRuntime(pathPattern: string, values: Record<string, any>): GatewayCorsRule {
  const value = (camel: string, kebab: string) => values[camel] ?? values[kebab];
  return {
    pathPattern,
    allowedOrigins: value("allowedOrigins", "allowed-origins") || [],
    allowedOriginPatterns: value("allowedOriginPatterns", "allowed-origin-patterns") || [],
    allowedMethods: value("allowedMethods", "allowed-methods") || [],
    allowedHeaders: value("allowedHeaders", "allowed-headers") || [],
    exposedHeaders: value("exposedHeaders", "exposed-headers") || [],
    allowCredentials: value("allowCredentials", "allow-credentials") ?? false,
    maxAgeSeconds: value("maxAge", "max-age") ?? 3600,
  };
}

function copyRule(rule: GatewayCorsRule): GatewayCorsRule {
  return {
    ...rule,
    allowedOrigins: [...rule.allowedOrigins],
    allowedOriginPatterns: [...rule.allowedOriginPatterns],
    allowedMethods: [...rule.allowedMethods],
    allowedHeaders: [...rule.allowedHeaders],
    exposedHeaders: [...rule.exposedHeaders],
  };
}

function openCreate() {
  editIndex.value = -1;
  Object.assign(editing, defaults());
  dialogVisible.value = true;
}

function openEdit(index: number) {
  editIndex.value = index;
  Object.assign(editing, copyRule(rules.value[index]));
  dialogVisible.value = true;
}

function confirmEdit() {
  if (!validateRule(editing, editIndex.value)) return;
  const rule = copyRule(editing);
  if (editIndex.value < 0) rules.value.push(rule);
  else rules.value.splice(editIndex.value, 1, rule);
  dialogVisible.value = false;
}

async function remove(index: number) {
  await ElMessageBox.confirm(
    `确定删除 ${rules.value[index].pathPattern} 的跨域规则吗？`,
    "删除规则",
    {
      type: "warning",
    }
  );
  rules.value.splice(index, 1);
}

async function save() {
  if (rules.value.some((rule, index) => !validateRule(rule, index, false))) return false;
  saving.value = true;
  try {
    const enabled = rules.value.length > 0;
    const policy = await GatewayApiRouteAPI.savePolicy("GLOBAL", undefined, "CORS", {
      mode: enabled ? "ENABLED" : "DISABLED",
      cors: enabled
        ? {
            rules: rules.value.map(copyRule),
            addToSimpleUrlHandlerMapping: addToSimpleUrlHandlerMapping.value,
          }
        : undefined,
      lockVersion: lockVersion.value,
    });
    lockVersion.value = policy.lockVersion;
    hasDraft.value = true;
    ElMessage.success(enabled ? "跨域规则草稿已保存" : "跨域规则已标记为关闭");
    return true;
  } finally {
    saving.value = false;
  }
}

async function publish() {
  await ElMessageBox.confirm("将保存当前规则，执行预检并原子发布 globalcors。", "发布跨域规则", {
    type: "warning",
  });
  publishing.value = true;
  try {
    if (!(await save())) return;
    await GatewayApiRouteAPI.validateRelease(baseVersion.value);
    const result = await GatewayApiRouteAPI.publishRelease(baseVersion.value);
    ElMessage.success(`发布完成：${result.status}`);
    await load();
  } finally {
    publishing.value = false;
  }
}

function validateRule(rule: GatewayCorsRule, index: number, notify = true) {
  const fail = (message: string) => (notify ? warn(message) : false);
  if (!rule.pathPattern.startsWith("/")) return fail("Path Pattern 必须以 / 开头");
  if (
    rules.value.some(
      (item, itemIndex) => itemIndex !== index && item.pathPattern === rule.pathPattern
    )
  ) {
    return fail("Path Pattern 不能重复");
  }
  const origins = [...rule.allowedOrigins, ...rule.allowedOriginPatterns];
  if (!origins.length) return fail("至少配置一个允许的 Origin 或 Pattern");
  if (!rule.allowedMethods.length || !rule.allowedHeaders.length)
    return fail("方法和 Header 不能为空");
  if (rule.allowCredentials && rule.allowedOrigins.includes("*")) {
    return fail("允许凭证时不能使用 * 作为精确 Origin");
  }
  const originPattern = /^https?:\/\/(?:\*\.)?[A-Za-z0-9.-]+(?::\d{1,5})?$/;
  if (origins.some((origin) => origin !== "*" && !originPattern.test(origin))) {
    return fail("Origin 必须是合法的 HTTP(S) Origin，且不能包含路径");
  }
  return true;
}

function warn(message: string) {
  ElMessage.warning(message);
  return false;
}

function defaults(): GatewayCorsRule {
  return {
    pathPattern: "/**",
    allowedOrigins: [],
    allowedOriginPatterns: [],
    allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
    exposedHeaders: ["X-Request-Id"],
    allowCredentials: true,
    maxAgeSeconds: 3600,
  };
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
.value-tag {
  max-width: 100%;
  margin: 2px 6px 2px 0;
}
.toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 16px;
}
.toolbar-spacer {
  flex: 1;
}
.unit {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}
</style>
