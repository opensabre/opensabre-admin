<template>
  <div class="app-container">
    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="关键字" prop="keywords">
          <el-input v-model="queryParams.keywords" placeholder="场景编码/名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态" prop="enabled">
          <el-select v-model="queryParams.enabled" placeholder="全部" clearable style="width: 100px">
            <el-option label="启用" :value="true" />
            <el-option label="停用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item class="search-buttons">
          <el-button type="primary" icon="search" @click="handleQuery">搜索</el-button>
          <el-button icon="refresh" @click="handleResetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card shadow="hover" class="table-section">
      <div class="table-section__toolbar">
        <div class="table-section__toolbar--actions">
          <el-button type="success" icon="plus" @click="handleOpenDialog()">新增</el-button>
        </div>
      </div>
      <el-table v-loading="loading" :data="pagedData" border class="table-section__content">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="场景编码" prop="sceneCode" min-width="150" />
        <el-table-column label="场景名称" prop="sceneName" min-width="150" />
        <el-table-column label="算法" width="150">
          <template #default="{ row }"><el-tag effect="plain">{{ formatAlgorithm(row.algorithm) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="限次维度" min-width="180">
          <template #default="{ row }">{{ formatDimensions(row.dimensions) }}</template>
        </el-table-column>
        <el-table-column label="最大次数" prop="maxCount" width="100" />
        <el-table-column label="周期(秒)" prop="period" width="110" />
        <el-table-column label="Key 前缀" prop="keyPrefix" min-width="130" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
          <template #default="{ row }"><el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? "启用" : "停用" }}</el-tag></template>
        </el-table-column>
        <el-table-column label="描述" prop="description" min-width="180" show-overflow-tooltip />
        <el-table-column fixed="right" label="操作" width="140">
          <template #default="{ row }">
            <el-button type="primary" size="small" link icon="edit" @click="handleOpenDialog(row.sceneCode)">编辑</el-button>
            <el-button type="danger" size="small" link icon="delete" @click="handleDelete(row.sceneCode)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-if="filteredData.length > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="720px" @close="handleCloseDialog">
      <el-alert title="限次按所选维度分别计数；周期单位为秒。" type="info" :closable="false" class="mb-4" />
      <el-form ref="dataFormRef" :model="formData" :rules="rules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="场景编码" prop="sceneCode"><el-input v-model="formData.sceneCode" placeholder="LOGIN_SMS" :disabled="dialog.editing" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="场景名称" prop="sceneName"><el-input v-model="formData.sceneName" placeholder="请输入场景名称" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="限次算法" prop="algorithm"><el-select v-model="formData.algorithm" style="width: 100%"><el-option v-for="item in algorithmOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态" prop="enabled"><el-switch v-model="formData.enabled" active-text="启用" inactive-text="停用" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="最大次数" prop="maxCount"><el-input-number v-model="formData.maxCount" :min="1" :max="100000" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="统计周期(秒)" prop="period"><el-input-number v-model="formData.period" :min="1" :max="86400" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="限次维度" prop="dimensions"><el-checkbox-group v-model="formData.dimensions"><el-checkbox v-for="item in dimensionOptions" :key="item.value" :label="item.value">{{ item.label }}</el-checkbox></el-checkbox-group></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="Key 前缀" prop="keyPrefix"><el-input v-model="formData.keyPrefix" placeholder="ratelimit:login:" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="描述" prop="description"><el-input v-model="formData.description" type="textarea" :rows="3" placeholder="说明这个场景保护的业务操作" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button type="primary" @click="handleSubmit">确定</el-button><el-button @click="handleCloseDialog">取消</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import RateLimitSceneAPI from "@/api/sysadmin/rate-limit-scene";
import type { RateLimitAlgorithm, RateLimitDimension, RateLimitSceneForm, RateLimitSceneItem, RateLimitScenePayload } from "@/types/api";

defineOptions({ name: "RateLimitScenes", inheritAttrs: false });

const queryFormRef = ref();
const dataFormRef = ref();
const loading = ref(false);
const sceneList = ref<RateLimitSceneItem[]>([]);
const queryParams = reactive({ pageNum: 1, pageSize: 10, keywords: "", enabled: "" as boolean | "" });
const dialog = reactive({ title: "", visible: false, editing: false, sceneCode: "" });
const algorithmOptions: Array<{ label: string; value: RateLimitAlgorithm }> = [
  { label: "固定窗口计数器", value: "COUNTER" }, { label: "滑动窗口计数器", value: "SLIDING_WINDOW" }, { label: "令牌桶", value: "TOKEN_BUCKET" }, { label: "漏桶", value: "LEAKY_BUCKET" },
];
const dimensionOptions: Array<{ label: string; value: RateLimitDimension }> = [
  { label: "IP 地址", value: "IP" }, { label: "设备 ID", value: "DEVICE" }, { label: "用户 ID", value: "USER" }, { label: "租户 ID", value: "TENANT" }, { label: "业务 Key", value: "BUSINESS" }, { label: "自定义", value: "CUSTOM" },
];
const defaultForm = (): RateLimitSceneForm => ({ sceneCode: "", sceneName: "", algorithm: "COUNTER", dimensions: ["IP"], keyPrefix: "ratelimit:", maxCount: 5, period: 60, enabled: true, description: "" });
const formData = reactive<RateLimitSceneForm>(defaultForm());
const rules = reactive({
  sceneCode: [{ required: true, message: "请输入场景编码", trigger: "blur" }], sceneName: [{ required: true, message: "请输入场景名称", trigger: "blur" }], algorithm: [{ required: true, message: "请选择限次算法", trigger: "change" }], dimensions: [{ type: "array", required: true, min: 1, message: "至少选择一个限次维度", trigger: "change" }], maxCount: [{ required: true, message: "请输入最大次数", trigger: "change" }], period: [{ required: true, message: "请输入统计周期", trigger: "change" }],
});
const filteredData = computed(() => sceneList.value.filter((item) => {
  const keywords = queryParams.keywords.trim().toLowerCase();
  return (!keywords || item.sceneCode.toLowerCase().includes(keywords) || item.sceneName.toLowerCase().includes(keywords)) && (queryParams.enabled === "" || item.enabled === queryParams.enabled);
}));
const total = computed(() => filteredData.value.length);
const pagedData = computed(() => filteredData.value.slice((queryParams.pageNum - 1) * queryParams.pageSize, queryParams.pageNum * queryParams.pageSize));

function formatAlgorithm(value: RateLimitAlgorithm) { return algorithmOptions.find((item) => item.value === value)?.label ?? value; }
function formatDimensions(value?: string) { return (value || "").split(",").filter(Boolean).map((item) => dimensionOptions.find((option) => option.value === item)?.label ?? item).join("、") || "-"; }
function toForm(scene: RateLimitSceneItem): RateLimitSceneForm { return { ...scene, dimensions: scene.dimensions?.split(",").filter(Boolean) as RateLimitDimension[] || [] }; }
function toPayload(): RateLimitScenePayload { return { ...formData, dimensions: formData.dimensions.join(",") }; }
function fetchData() { loading.value = true; RateLimitSceneAPI.getList().then((data) => { sceneList.value = data ?? []; }).finally(() => { loading.value = false; }); }
function handleQuery() { queryParams.pageNum = 1; }
function handleResetQuery() { queryFormRef.value.resetFields(); queryParams.pageNum = 1; }
function resetForm() { Object.assign(formData, defaultForm()); dataFormRef.value?.clearValidate(); }
function handleOpenDialog(sceneCode?: string) { resetForm(); dialog.visible = true; dialog.editing = Boolean(sceneCode); dialog.sceneCode = sceneCode || ""; dialog.title = sceneCode ? "修改限次场景" : "新增限次场景"; if (sceneCode) RateLimitSceneAPI.getFormData(sceneCode).then((data) => Object.assign(formData, toForm(data))); }
function handleCloseDialog() { dialog.visible = false; resetForm(); }
function handleSubmit() { dataFormRef.value.validate((valid: boolean) => { if (!valid) return; const request = dialog.editing ? RateLimitSceneAPI.update(dialog.sceneCode, toPayload()) : RateLimitSceneAPI.create(toPayload()); request.then(() => { ElMessage.success(dialog.editing ? "修改成功" : "新增成功"); handleCloseDialog(); fetchData(); }); }); }
function handleDelete(sceneCode: string) { ElMessageBox.confirm(`确认删除限次场景「${sceneCode}」吗？`, "警告", { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }).then(() => RateLimitSceneAPI.delete(sceneCode).then(() => { ElMessage.success("删除成功"); fetchData(); })); }
onMounted(fetchData);
</script>
