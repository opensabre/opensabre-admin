<template>
  <div :class="{ 'app-container': !embedded }">
    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="客户端ID" prop="clientId">
          <el-input v-model.trim="queryParams.clientId" placeholder="客户端ID" clearable />
        </el-form-item>
        <el-form-item label="用户/主体" prop="principalName">
          <el-input v-model.trim="queryParams.principalName" placeholder="用户名或主体" clearable />
        </el-form-item>
        <el-form-item label="授权项" prop="authority">
          <el-input
            v-model.trim="queryParams.authority"
            placeholder="例如 SCOPE_openid"
            clearable
          />
        </el-form-item>
        <el-form-item class="search-buttons">
          <el-button type="primary" icon="search" @click="handleQuery">搜索</el-button>
          <el-button icon="refresh" @click="handleResetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-alert
      title="删除客户端授权记录后，用户下次授权时需要重新同意；已签发 Token 请在“Token 签发”中终止。"
      type="info"
      show-icon
      :closable="false"
      class="mb-4"
    />

    <el-card shadow="hover" class="table-section">
      <el-table v-loading="loading" :data="records" border highlight-current-row>
        <el-table-column label="客户端" min-width="200">
          <template #default="{ row }">
            <div>{{ row.clientName || "-" }}</div>
            <small class="text-gray">{{ row.clientId || "-" }}</small>
          </template>
        </el-table-column>
        <el-table-column label="用户/主体" prop="principalName" min-width="180" />
        <el-table-column label="授权项" min-width="300">
          <template #default="{ row }">
            <el-tag v-for="authority in authorities(row.authorities)" :key="authority" class="mr-1">
              {{ authority }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="140">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">查看</el-button>
            <el-button
              v-hasPerm="['auth:consent:remove']"
              type="danger"
              link
              @click="handleRemove(row)"
            >
              删除
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

    <el-drawer v-model="drawerVisible" title="客户端授权详情" size="520px">
      <el-descriptions v-if="detail" :column="1" border>
        <el-descriptions-item label="客户端">
          {{ detail.clientName || "-" }}（{{ detail.clientId || "-" }}）
        </el-descriptions-item>
        <el-descriptions-item label="注册客户端内部ID">
          {{ detail.registeredClientId }}
        </el-descriptions-item>
        <el-descriptions-item label="用户/主体">
          {{ detail.principalName }}
        </el-descriptions-item>
        <el-descriptions-item label="授权项">
          {{ detail.authorities || "-" }}
        </el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import OAuthAuthorizationConsentAPI from "@/api/auth/authorization-consent";
import type {
  OAuthAuthorizationConsentItem,
  OAuthAuthorizationConsentQueryParams,
} from "@/types/api";

defineOptions({
  name: "OAuthAuthorizationConsent",
  inheritAttrs: false,
});

defineProps<{ embedded?: boolean }>();

const queryFormRef = ref();
const loading = ref(false);
const total = ref(0);
const records = ref<OAuthAuthorizationConsentItem[]>([]);
const detail = ref<OAuthAuthorizationConsentItem>();
const drawerVisible = ref(false);
const queryParams = reactive<OAuthAuthorizationConsentQueryParams>({
  pageNum: 1,
  pageSize: 10,
  clientId: "",
  principalName: "",
  authority: "",
});

function fetchData() {
  loading.value = true;
  return OAuthAuthorizationConsentAPI.getPage(queryParams)
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

function handleView(row: OAuthAuthorizationConsentItem) {
  OAuthAuthorizationConsentAPI.get(row.registeredClientId, row.principalName).then((data) => {
    detail.value = data;
    drawerVisible.value = true;
  });
}

async function handleRemove(row: OAuthAuthorizationConsentItem) {
  try {
    await ElMessageBox.confirm(
      `确认删除 ${row.principalName} 对客户端 ${row.clientName || row.clientId || "-"} 的授权记录？`,
      "删除客户端授权记录",
      { confirmButtonText: "确认删除", cancelButtonText: "取消", type: "warning" }
    );
  } catch {
    return;
  }

  await OAuthAuthorizationConsentAPI.remove(row.registeredClientId, row.principalName);
  ElMessage.success("客户端授权记录已删除");
  fetchData();
}

function authorities(value?: string) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

onMounted(fetchData);
</script>
