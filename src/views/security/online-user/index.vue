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
        <el-table-column type="index" label="#" width="56" />
        <el-table-column label="用户名" prop="username" width="140" />
        <el-table-column label="显示名称" prop="displayName" width="140" />
        <el-table-column label="客户端IP" prop="ip" width="150" />
        <el-table-column
          label="认证类型"
          prop="authenticationType"
          width="180"
          show-overflow-tooltip
        />
        <el-table-column label="活跃状态" width="110">
          <template #default="{ row }">
            <el-tag :type="activityTagType(row.lastAccessTime)" effect="light">
              {{ activityStatusLabel(row.lastAccessTime) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="登录时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.loginTime) }}
          </template>
        </el-table-column>
        <el-table-column label="在线时长" width="140">
          <template #default="{ row }">{{ onlineDuration(row.loginTime) }}</template>
        </el-table-column>
        <el-table-column label="最近活跃" width="180">
          <template #default="{ row }">
            <div>{{ lastActiveText(row.lastAccessTime) }}</div>
            <div class="text-xs text-gray-400">{{ formatDateTime(row.lastAccessTime) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="会话ID" prop="sessionId" min-width="220" show-overflow-tooltip />
        <el-table-column label="客户端" min-width="210">
          <template #default="{ row }">
            <span :title="row.userAgent">{{ clientSummary(row.userAgent) }}</span>
          </template>
        </el-table-column>
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
import { activityStatus, clientSummary, lastActiveText, onlineDuration } from "./presentation";

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

function activityStatusLabel(value?: string | number) {
  return { active: "活跃", idle: "空闲", inactive: "不活跃", unknown: "未知" }[
    activityStatus(value)
  ];
}

function activityTagType(value?: string | number) {
  return { active: "success", idle: "warning", inactive: "info", unknown: "info" }[
    activityStatus(value)
  ] as "success" | "warning" | "info";
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
