<template>
  <div class="app-container">
    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="操作类型" prop="operationType">
          <el-select
            v-model="queryParams.operationType"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="item in operationTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人" prop="operatorUsername">
          <el-input
            v-model="queryParams.operatorUsername"
            placeholder="操作人用户名"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="模块" prop="module">
          <el-input
            v-model="queryParams.module"
            placeholder="模块"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="IP" prop="clientIp">
          <el-input
            v-model="queryParams.clientIp"
            placeholder="IP 地址"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="目标Key" prop="targetKey">
          <el-input
            v-model="queryParams.targetKey"
            placeholder="目标Key"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="操作时间" prop="operationTimeRange">
          <el-date-picker
            v-model="queryParams.operationTimeRange"
            type="datetimerange"
            range-separator="~"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item class="search-buttons">
          <el-button type="primary" icon="search" @click="handleQuery">搜索</el-button>
          <el-button icon="refresh" @click="handleResetQuery">重置</el-button>
          <el-button color="#626aef" icon="delete" @click="handleCleanLogs">清理日志</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card shadow="hover" class="table-section">
      <el-table
        v-loading="loading"
        :data="logList"
        highlight-current-row
        border
        class="table-section__content"
      >
        <el-table-column label="操作时间" prop="operationTime" width="180" />
        <el-table-column label="操作人" prop="operatorUsername" width="120" />
        <el-table-column label="类型" prop="operationType" width="100" />
        <el-table-column label="模块" prop="module" width="140" />
        <el-table-column label="目标Key" prop="targetKey" width="120" />
        <el-table-column label="描述" prop="description" min-width="220" show-overflow-tooltip />
        <el-table-column label="IP" prop="clientIp" width="150" />
        <el-table-column label="请求方法" prop="requestMethod" width="110" />
        <el-table-column label="请求URL" prop="requestUrl" min-width="220" show-overflow-tooltip />
        <el-table-column label="执行时间(ms)" prop="executionTime" width="140" />
      </el-table>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="fetchData"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import AuditLogAPI from "@/api/sysadmin/audit-log";
import type { AuditLogItem, AuditLogQueryParams } from "@/types/api";

defineOptions({
  name: "AuditLog",
  inheritAttrs: false,
});

const queryFormRef = ref();
const loading = ref(false);
const total = ref(0);
const logList = ref<AuditLogItem[]>([]);

const queryParams = reactive<AuditLogQueryParams>({
  pageNum: 1,
  pageSize: 10,
});

const operationTypeOptions = [
  { label: "新增", value: "CREATE" },
  { label: "修改", value: "UPDATE" },
  { label: "删除", value: "DELETE" },
  { label: "查询", value: "QUERY" },
  { label: "登录", value: "LOGIN" },
  { label: "登出", value: "LOGOUT" },
  { label: "扫描", value: "SCAN" },
  { label: "导出", value: "EXPORT" },
  { label: "导入", value: "IMPORT" },
  { label: "下载", value: "DOWNLOAD" },
  { label: "上传", value: "UPLOAD" },
];

function fetchData() {
  loading.value = true;
  AuditLogAPI.getPage(queryParams)
    .then((res) => {
      logList.value = res.data;
      total.value = res.page?.total ?? 0;
    })
    .finally(() => {
      loading.value = false;
    });
}

function handleQuery() {
  queryParams.pageNum = 1;
  fetchData();
}

function handleResetQuery() {
  queryFormRef.value.resetFields();
  queryParams.pageNum = 1;
  fetchData();
}

function handleCleanLogs() {
  ElMessageBox.prompt("请输入保留天数", "清理审计日志", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputValue: "30",
    inputPattern: /^\d+$/,
    inputErrorMessage: "请输入正整数",
  }).then(({ value }) => {
    const days = Number(value);
    if (Number.isNaN(days) || days <= 0) {
      ElMessage.warning("请输入大于 0 的天数");
      return;
    }
    AuditLogAPI.cleanExpiredLogs(days).then((count) => {
      ElMessage.success(`已清理 ${count} 条日志`);
      handleQuery();
    });
  });
}

onMounted(() => {
  handleQuery();
});
</script>
