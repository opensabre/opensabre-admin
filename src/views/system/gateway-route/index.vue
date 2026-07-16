<template>
  <div class="app-container">
    <el-alert class="config-status" :closable="false" type="warning" show-icon>
      <template #title>配置中心：base-gateway.yml · 当前版本：{{ config.version || "读取中" }}</template>
      <template #default>编辑后必须确认“发布到配置中心”才会生效。发布使用当前版本校验，冲突时请刷新后重新编辑。</template>
    </el-alert>

    <div class="filter-section">
      <el-form :inline="true">
        <el-form-item label="关键字"><el-input v-model="keyword" clearable placeholder="路由 ID、Path 或目标 URI" /></el-form-item>
        <el-form-item class="search-buttons"><el-button icon="refresh" :loading="loading" @click="loadConfig">刷新配置</el-button></el-form-item>
      </el-form>
    </div>

    <el-card shadow="hover" class="table-section">
      <div class="table-section__toolbar">
        <span>显式路由（{{ filteredRoutes.length }}）</span>
        <div><span v-if="config.version" class="version">配置 MD5：{{ config.version }}</span>
          <el-button v-hasPerm="['gateway:route:create']" type="success" icon="plus" @click="openCreate">新增路由</el-button>
        </div>
      </div>
      <el-table v-loading="loading" :data="filteredRoutes" border class="table-section__content" empty-text="当前配置没有显式网关路由">
        <el-table-column label="路由 ID" prop="id" min-width="180" />
        <el-table-column label="匹配路径" min-width="220"><template #default="{ row }">{{ pathSummary(row) }}</template></el-table-column>
        <el-table-column label="目标 URI" prop="uri" min-width="200" show-overflow-tooltip />
        <el-table-column label="优先级" prop="order" width="90" align="center" />
        <el-table-column label="过滤器" min-width="170"><template #default="{ row }">{{ filterSummary(row) }}</template></el-table-column>
        <el-table-column fixed="right" label="操作" width="150">
          <template #default="{ row }">
            <el-button v-hasPerm="['gateway:route:update']" type="primary" link size="small" icon="edit" @click="openEdit(row)">编辑</el-button>
            <el-button v-hasPerm="['gateway:route:delete']" type="danger" link size="small" icon="delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑网关路由' : '新增网关路由'" width="720px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="路由 ID" prop="id"><el-input v-model="form.id" :disabled="dialog.isEdit" placeholder="如 base-organization" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="优先级"><el-input-number v-model="form.order" :min="-9999" :max="9999" /></el-form-item></el-col></el-row>
        <el-form-item label="目标 URI" prop="uri"><el-input v-model="form.uri" placeholder="lb://base-organization" /></el-form-item>
        <el-alert :closable="false" type="info" title="参数填写规则：Path 直接填 /api/**；其他断言和过滤器按 key=value,key2=value2 填写。" class="definition-tip" />
        <el-form-item label="断言" required><div class="definition-list">
          <div v-for="(item, index) in form.predicates" :key="`p-${index}`" class="definition-row">
            <el-select v-model="item.name" placeholder="断言"><el-option v-for="name in predicateOptions" :key="name" :label="name" :value="name" /></el-select>
            <el-input v-model="item.argsText" placeholder="Path：/api/**；其他：key=value" />
            <el-button link type="danger" icon="delete" @click="form.predicates.splice(index, 1)" />
          </div><el-button link type="primary" icon="plus" @click="form.predicates.push(emptyDefinition())">添加断言</el-button>
        </div></el-form-item>
        <el-form-item label="过滤器"><div class="definition-list">
          <div v-for="(item, index) in form.filters" :key="`f-${index}`" class="definition-row">
            <el-select v-model="item.name" placeholder="过滤器"><el-option v-for="name in filterOptions" :key="name" :label="name" :value="name" /></el-select>
            <el-input v-model="item.argsText" placeholder="如 StripPrefix：parts=2" />
            <el-button link type="danger" icon="delete" @click="form.filters.splice(index, 1)" />
          </div><el-button link type="primary" icon="plus" @click="form.filters.push(emptyDefinition())">添加过滤器</el-button>
        </div></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialog.visible = false">取消</el-button><el-button type="primary" :loading="publishing" @click="handlePublish">确认发布到配置中心</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import GatewayRouteAPI from "@/api/sysadmin/gateway-route";
import type { GatewayRoute, GatewayRouteDefinition } from "@/types/api";
import { ElMessage, ElMessageBox, type FormInstance } from "element-plus";

defineOptions({ name: "GatewayRoute" });
type EditableDefinition = { name: string; argsText: string };
const predicateOptions = ["Path", "Host", "Method", "Header", "Query", "RemoteAddr", "After", "Before", "Between"];
const filterOptions = ["StripPrefix", "PrefixPath", "RewritePath", "AddRequestHeader", "AddResponseHeader", "RemoveRequestHeader", "RemoveResponseHeader", "Retry", "CircuitBreaker"];
const formRef = ref<FormInstance>();
const loading = ref(false); const publishing = ref(false); const keyword = ref("");
const config = reactive({ version: "", routes: [] as GatewayRoute[] });
const dialog = reactive({ visible: false, isEdit: false, routeId: "" });
const form = reactive({ id: "", uri: "", order: 0, predicates: [] as EditableDefinition[], filters: [] as EditableDefinition[] });
const rules = { id: [{ required: true, message: "请输入路由 ID", trigger: "blur" }], uri: [{ required: true, message: "请输入目标 URI", trigger: "blur" }] };
const filteredRoutes = computed(() => { const search = keyword.value.trim().toLowerCase(); return !search ? config.routes : config.routes.filter((route) => `${route.id} ${route.uri} ${pathSummary(route)}`.toLowerCase().includes(search)); });
function emptyDefinition(): EditableDefinition { return { name: "", argsText: "" }; }
function pathSummary(route: GatewayRoute) { return route.predicates.filter((item) => item.name === "Path").map((item) => item.args.pattern || item.args.value).filter(Boolean).join("，") || "-"; }
function filterSummary(route: GatewayRoute) { return route.filters.map((item) => `${item.name}(${Object.values(item.args).filter(Boolean).join(", ")})`).join("，") || "-"; }
function definitionText(item: GatewayRouteDefinition) { return item.name === "Path" ? (item.args.pattern || item.args.value || "") : Object.entries(item.args).map(([key, value]) => key === "value" ? value : `${key}=${value}`).join(","); }
function parseArgs(name: string, text: string): Record<string, string> { const value = text.trim(); if (!value) return {}; if (name === "Path") return { pattern: value }; return Object.fromEntries(value.split(",").map((part) => { const [key, ...rest] = part.trim().split("="); return rest.length ? [key.trim(), rest.join("=").trim()] : ["value", key.trim()]; })); }
function toRoute(): GatewayRoute { return { id: form.id.trim(), uri: form.uri.trim(), order: form.order, predicates: form.predicates.map((item) => ({ name: item.name, args: parseArgs(item.name, item.argsText) })), filters: form.filters.map((item) => ({ name: item.name, args: parseArgs(item.name, item.argsText) })) }; }
function resetForm() { Object.assign(form, { id: "", uri: "", order: 0, predicates: [], filters: [] }); formRef.value?.clearValidate(); }
function openCreate() { resetForm(); form.predicates.push({ name: "Path", argsText: "" }); dialog.isEdit = false; dialog.visible = true; }
function openEdit(route: GatewayRoute) { resetForm(); Object.assign(form, { id: route.id, uri: route.uri, order: route.order, predicates: route.predicates.map((item) => ({ name: item.name, argsText: definitionText(item) })), filters: route.filters.map((item) => ({ name: item.name, argsText: definitionText(item) })) }); dialog.routeId = route.id; dialog.isEdit = true; dialog.visible = true; }
async function loadConfig() { loading.value = true; try { const data = await GatewayRouteAPI.getConfig(); config.version = data.version; config.routes = data.routes; } finally { loading.value = false; } }
async function handlePublish() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; if (!form.predicates.length) return ElMessage.warning("至少需要一个断言"); const route = toRoute(); await ElMessageBox.confirm(`将路由【${route.id}】发布到 Nacos，配置会立即影响网关流量。`, "确认发布", { type: "warning", confirmButtonText: "发布", cancelButtonText: "取消" }); publishing.value = true; try { const result = dialog.isEdit ? await GatewayRouteAPI.update(dialog.routeId, { route, baseVersion: config.version }) : await GatewayRouteAPI.create({ route, baseVersion: config.version }); config.version = result.version; await loadConfig(); dialog.visible = false; ElMessage.success(`发布成功，配置版本：${result.version}`); } finally { publishing.value = false; } }
async function handleDelete(route: GatewayRoute) { await ElMessageBox.confirm(`确认删除路由【${route.id}】并发布到配置中心吗？`, "危险操作", { type: "warning", confirmButtonText: "删除并发布", cancelButtonText: "取消" }); loading.value = true; try { const result = await GatewayRouteAPI.deleteById(route.id, config.version); config.version = result.version; await loadConfig(); ElMessage.success("路由已删除并发布"); } finally { loading.value = false; } }
onMounted(loadConfig);
</script>

<style scoped lang="scss">
.config-status { margin-bottom: 18px; }.table-section__toolbar { display: flex; align-items: center; justify-content: space-between; }.version { margin-right: 12px; font-size: 13px; color: var(--el-text-color-secondary); }.definition-tip { margin-bottom: 12px; }.definition-list { width: 100%; }.definition-row { display: flex; gap: 8px; margin-bottom: 8px; }.definition-row .el-select { width: 160px; }
</style>
