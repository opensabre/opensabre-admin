<template>
  <div class="app-container">
    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="客户端ID" prop="clientId">
          <el-input v-model.trim="queryParams.clientId" placeholder="客户端ID" clearable />
        </el-form-item>
        <el-form-item label="用户/主体" prop="principalName">
          <el-input
            v-model.trim="queryParams.principalName"
            placeholder="用户名或主体"
            clearable
          />
        </el-form-item>
        <el-form-item label="授权类型" prop="authorizationGrantType">
          <el-select
            v-model="queryParams.authorizationGrantType"
            placeholder="全部"
            clearable
            style="width: 190px"
          >
            <el-option label="authorization_code" value="authorization_code" />
            <el-option label="client_credentials" value="client_credentials" />
            <el-option label="refresh_token" value="refresh_token" />
            <el-option
              label="device_code"
              value="urn:ietf:params:oauth:grant-type:device_code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="有效" value="ACTIVE" />
            <el-option label="已过期" value="EXPIRED" />
          </el-select>
        </el-form-item>
        <el-form-item class="search-buttons">
          <el-button type="primary" icon="search" @click="handleQuery">搜索</el-button>
          <el-button icon="refresh" @click="handleResetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-alert
      title="撤销授权会删除服务端授权记录并阻止 Refresh Token 继续使用；已签发的自包含 JWT Access Token 可能持续有效至过期。"
      type="warning"
      show-icon
      :closable="false"
      class="mb-4"
    />

    <el-card shadow="hover" class="table-section">
      <div class="table-section__toolbar">
        <el-button
          v-hasPerm="['auth:authorization:revoke']"
          type="danger"
          icon="delete"
          :disabled="selectedIds.length === 0"
          @click="handleBatchRevoke"
        >
          批量撤销
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="records"
        border
        highlight-current-row
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="客户端" min-width="180">
          <template #default="{ row }">
            <div>{{ row.clientName || "-" }}</div>
            <small class="text-gray">{{ row.clientId || "-" }}</small>
          </template>
        </el-table-column>
        <el-table-column label="用户/主体" prop="principalName" min-width="150" />
        <el-table-column
          label="授权类型"
          prop="authorizationGrantType"
          min-width="180"
          show-overflow-tooltip
        />
        <el-table-column label="Scope" min-width="180">
          <template #default="{ row }">
            <el-tag v-for="scope in scopes(row.authorizedScopes)" :key="scope" class="mr-1">
              {{ scope }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Access Token 过期时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.accessTokenExpiresAt) }}</template>
        </el-table-column>
        <el-table-column label="Refresh Token 过期时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.refreshTokenExpiresAt) }}</template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="140">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row.id)">查看</el-button>
            <el-button
              v-hasPerm="['auth:authorization:revoke']"
              type="danger"
              link
              @click="handleRevoke(row)"
            >
              撤销
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="fetchData"
      />
    </el-card>

    <el-drawer v-model="drawerVisible" title="OAuth2 授权详情" size="520px">
      <el-descriptions v-if="detail" :column="1" border>
        <el-descriptions-item label="记录ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="客户端">
          {{ detail.clientName || "-" }}（{{ detail.clientId || "-" }}）
        </el-descriptions-item>
        <el-descriptions-item label="用户/主体">
          {{ detail.principalName || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="授权类型">
          {{ detail.authorizationGrantType || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="Scope">
          {{ detail.authorizedScopes || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="Access Token 类型">
          {{ detail.accessTokenType || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="Access Token 签发时间">
          {{ formatDateTime(detail.accessTokenIssuedAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="Access Token 过期时间">
          {{ formatDateTime(detail.accessTokenExpiresAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="Refresh Token 签发时间">
          {{ formatDateTime(detail.refreshTokenIssuedAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="Refresh Token 过期时间">
          {{ formatDateTime(detail.refreshTokenExpiresAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="包含 ID Token">
          {{ detail.hasIdToken ? "是" : "否" }}
        </el-descriptions-item>
        <el-descriptions-item label="包含设备码">
          {{ detail.hasDeviceCode ? "是" : "否" }}
        </el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import OAuthAuthorizationAPI from "@/api/auth/authorization";
import type {
  OAuthAuthorizationItem,
  OAuthAuthorizationQueryParams,
  OAuthAuthorizationStatus,
} from "@/types/api";

defineOptions({
  name: "OAuthAuthorization",
  inheritAttrs: false,
});

const queryFormRef = ref();
const loading = ref(false);
const total = ref(0);
const records = ref<OAuthAuthorizationItem[]>([]);
const selectedIds = ref<string[]>([]);
const detail = ref<OAuthAuthorizationItem>();
const drawerVisible = ref(false);

const queryParams = reactive<OAuthAuthorizationQueryParams>({
  pageNum: 1,
  pageSize: 10,
  clientId: "",
  principalName: "",
  authorizationGrantType: "",
  status: "",
});

function fetchData() {
  loading.value = true;
  OAuthAuthorizationAPI.getPage(queryParams)
    .then((res) => {
      records.value = res.data;
      total.value = res.page.total;
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
  queryFormRef.value?.resetFields();
  handleQuery();
}

function handleSelectionChange(selection: OAuthAuthorizationItem[]) {
  selectedIds.value = selection.map((item) => item.id);
}

function handleView(id: string) {
  OAuthAuthorizationAPI.get(id).then((data) => {
    detail.value = data;
    drawerVisible.value = true;
  });
}

function handleRevoke(row: OAuthAuthorizationItem) {
  confirmRevoke([row.id], row.principalName || row.id);
}

function handleBatchRevoke() {
  confirmRevoke(selectedIds.value, `${selectedIds.value.length} 条授权记录`);
}

function confirmRevoke(ids: string[], target: string) {
  ElMessageBox.confirm(
    `确认撤销 ${target}？撤销后 Refresh Token 将无法继续使用。`,
    "撤销 OAuth2 授权",
    { confirmButtonText: "确认撤销", cancelButtonText: "取消", type: "warning" }
  ).then(() => {
    loading.value = true;
    Promise.all(ids.map((id) => OAuthAuthorizationAPI.revoke(id)))
      .then(() => {
        ElMessage.success("撤销成功");
        selectedIds.value = [];
        fetchData();
      })
      .finally(() => {
        loading.value = false;
      });
  });
}

function scopes(value?: string) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function statusText(status?: OAuthAuthorizationStatus) {
  return { ACTIVE: "有效", REFRESHABLE: "可刷新", EXPIRED: "已过期" }[status || "EXPIRED"];
}

function statusType(status?: OAuthAuthorizationStatus) {
  if (status === "ACTIVE") return "success";
  if (status === "REFRESHABLE") return "warning";
  return "info";
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

onMounted(fetchData);
</script>
