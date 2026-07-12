<template>
  <div class="app-container">
    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model.trim="queryParams.username"
            placeholder="请输入用户名"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item class="search-buttons">
          <el-button type="primary" icon="search" @click="handleQuery">搜索</el-button>
          <el-button icon="refresh" @click="handleResetQuery">重置</el-button>
          <el-button icon="refresh-right" @click="fetchData">刷新</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card shadow="hover" class="table-section">
      <el-table
        v-loading="loading"
        :data="onlineUsers"
        highlight-current-row
        border
        class="table-section__content"
      >
        <el-table-column label="用户名" prop="username" width="140" />
        <el-table-column label="显示名称" prop="displayName" width="140" />
        <el-table-column label="客户端IP" prop="ip" width="150" />
        <el-table-column
          label="认证类型"
          prop="authenticationType"
          width="180"
          show-overflow-tooltip
        />
        <el-table-column label="登录时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.loginTime) }}
          </template>
        </el-table-column>
        <el-table-column label="最后访问" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.lastAccessTime) }}
          </template>
        </el-table-column>
        <el-table-column label="会话ID" prop="sessionId" min-width="220" show-overflow-tooltip />
        <el-table-column label="User-Agent" prop="userAgent" min-width="260" show-overflow-tooltip />
        <el-table-column label="操作" fixed="right" width="100">
          <template #default="{ row }">
            <el-button
              v-hasPerm="['security:online-user:kickout']"
              type="danger"
              link
              @click="handleKickout(row)"
            >
              踢出
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import OnlineUserAPI from "@/api/auth/online-user";
import type { OnlineUserItem, OnlineUserQueryParams } from "@/types/api";

defineOptions({
  name: "OnlineUser",
  inheritAttrs: false,
});

const queryFormRef = ref();
const loading = ref(false);
const onlineUsers = ref<OnlineUserItem[]>([]);

const queryParams = reactive<OnlineUserQueryParams>({
  username: "",
});

function fetchData() {
  loading.value = true;
  OnlineUserAPI.list(queryParams)
    .then((data) => {
      onlineUsers.value = data ?? [];
    })
    .finally(() => {
      loading.value = false;
    });
}

function handleQuery() {
  fetchData();
}

function handleResetQuery() {
  queryFormRef.value?.resetFields();
  fetchData();
}

function handleKickout(row: OnlineUserItem) {
  if (!row.sessionId) {
    ElMessage.warning("会话ID为空，无法踢出");
    return;
  }
  ElMessageBox.confirm(`确认踢出用户 ${row.username || row.sessionId}？`, "踢出在线用户", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    OnlineUserAPI.kickout(row.sessionId!).then(() => {
      ElMessage.success("已踢出在线用户");
      fetchData();
    });
  });
}

function formatDateTime(value?: string | number) {
  if (value == null || value === "") return "";

  const date =
    typeof value === "number" || /^\d+$/.test(String(value))
      ? new Date(Number(value))
      : new Date(String(value).replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return String(value);

  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

onMounted(() => {
  fetchData();
});
</script>
