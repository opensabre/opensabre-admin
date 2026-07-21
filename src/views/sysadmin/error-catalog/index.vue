<template>
  <div class="app-container">
    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="关键字">
          <el-input
            v-model="queryParams.keywords"
            placeholder="错误码 / 文案 / 模块"
            clearable
            @keyup.enter="search"
          />
        </el-form-item>
        <el-form-item label="应用">
          <el-input
            v-model="queryParams.application"
            placeholder="如 base-sysadmin"
            clearable
            @keyup.enter="search"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.deprecated"
            clearable
            placeholder="全部"
            style="width: 110px"
          >
            <el-option label="有效" :value="false" />
            <el-option label="已废弃" :value="true" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="search" @click="search">搜索</el-button>
          <el-button icon="refresh" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <el-card shadow="hover" class="table-section">
      <el-alert
        title="错误码由各应用在启动后上报；此页面只读展示全局目录。"
        type="info"
        :closable="false"
        class="mb-4"
      />
      <el-table v-loading="loading" :data="items" border>
        <el-table-column prop="code" label="错误码" width="130" />
        <el-table-column
          prop="defaultMessage"
          label="默认文案"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column prop="sourceApplication" label="应用" min-width="150" />
        <el-table-column prop="module" label="模块" min-width="120" />
        <el-table-column prop="sourceVersion" label="版本" width="100" />
        <el-table-column prop="httpStatus" label="HTTP" width="80" />
        <el-table-column label="对外展示" width="100">
          <template #default="{ row }">
            <el-tag :type="row.publicVisible ? 'success' : 'info'">
              {{ row.publicVisible ? "是" : "否" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.deprecated ? 'warning' : 'success'">
              {{ row.deprecated ? "已废弃" : "有效" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="160" show-overflow-tooltip />
      </el-table>
      <pagination
        v-if="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="load"
      />
    </el-card>
  </div>
</template>
<script setup lang="ts">
import ErrorCatalogAPI from "@/api/sysadmin/error-catalog";
import type { ErrorCatalogItem } from "@/types/api";
defineOptions({ name: "ErrorCatalog", inheritAttrs: false });
const loading = ref(false);
const queryFormRef = ref();
const items = ref<ErrorCatalogItem[]>([]);
const total = ref(0);
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  keywords: "",
  application: "",
  deprecated: "" as boolean | "",
});
async function load() {
  loading.value = true;
  try {
    const result = await ErrorCatalogAPI.list(queryParams);
    items.value = result.data;
    total.value = result.page?.total ?? 0;
  } finally {
    loading.value = false;
  }
}
function search() {
  queryParams.pageNum = 1;
  load();
}
function reset() {
  queryFormRef.value?.resetFields();
  search();
}
onMounted(load);
</script>
