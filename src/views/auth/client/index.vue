<template>
  <div class="app-container">
    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="客户端ID" prop="clientId">
          <el-input
            v-model="queryParams.clientId"
            placeholder="客户端ID"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="客户端名称" prop="clientName">
          <el-input
            v-model="queryParams.clientName"
            placeholder="客户端名称"
            clearable
            @keyup.enter="handleQuery"
          />
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
          <el-button
            type="danger"
            :disabled="ids.length === 0"
            icon="delete"
            @click="handleDelete()"
          >
            删除
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="clientList"
        highlight-current-row
        border
        class="table-section__content"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="客户端ID" prop="clientId" min-width="160" />
        <el-table-column label="客户端名称" prop="clientName" min-width="160" />
        <el-table-column label="授权类型" min-width="220">
          <template #default="scope">
            <el-tag
              v-for="item in scope.row.authorizationGrantTypes || []"
              :key="item"
              class="mr-1"
            >
              {{ item }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="作用域" min-width="220">
          <template #default="scope">
            <el-tag v-for="item in scope.row.scopes || []" :key="item" class="mr-1">
              {{ item }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="过期时间" prop="clientSecretExpiresAt" width="180" />
        <el-table-column label="创建人" prop="createdBy" width="120" />
        <el-table-column label="创建时间" prop="createdTime" width="180" />
        <el-table-column label="更新人" prop="updatedBy" width="120" />
        <el-table-column label="更新时间" prop="updatedTime" width="180" />
        <el-table-column fixed="right" label="操作" width="150">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              link
              icon="edit"
              @click="handleOpenDialog(scope.row.id)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              link
              icon="delete"
              @click="handleDelete(scope.row.id)"
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

    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="760px"
      @close="handleCloseDialog"
    >
      <el-form ref="dataFormRef" :model="formData" :rules="rules" label-width="120px">
        <el-form-item label="客户端ID" prop="clientId">
          <el-input v-model="formData.clientId" placeholder="请输入客户端ID" />
        </el-form-item>
        <el-form-item label="客户端名称" prop="clientName">
          <el-input v-model="formData.clientName" placeholder="请输入客户端名称" />
        </el-form-item>
        <el-form-item label="客户端密钥" prop="clientSecret">
          <el-input
            v-model="formData.clientSecret"
            placeholder="新增必填，编辑可留空保持原值"
            show-password
          />
        </el-form-item>
        <el-form-item label="密钥过期秒数" prop="clientSecretExpires">
          <el-input-number
            v-model="formData.clientSecretExpires"
            :min="0"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="授权类型" prop="grantTypes">
          <el-select
            v-model="formData.grantTypes"
            multiple
            collapse-tags
            filterable
            style="width: 100%"
          >
            <el-option label="client_credentials" value="client_credentials" />
            <el-option label="authorization_code" value="authorization_code" />
            <el-option label="refresh_token" value="refresh_token" />
            <el-option label="mobile" value="mobile" />
            <el-option label="device_code" value="device_code" />
          </el-select>
        </el-form-item>
        <el-form-item label="认证方式" prop="clientAuthenticationMethods">
          <el-select
            v-model="formData.clientAuthenticationMethods"
            multiple
            collapse-tags
            filterable
            style="width: 100%"
          >
            <el-option label="client_secret_basic" value="client_secret_basic" />
            <el-option label="client_secret_post" value="client_secret_post" />
            <el-option label="none" value="none" />
          </el-select>
        </el-form-item>
        <el-form-item label="作用域" prop="scopes">
          <el-select
            v-model="formData.scopes"
            multiple
            collapse-tags
            filterable
            style="width: 100%"
          >
            <el-option label="read" value="read" />
            <el-option label="write" value="write" />
            <el-option label="openid" value="openid" />
            <el-option label="profile" value="profile" />
          </el-select>
        </el-form-item>
        <el-form-item label="回调地址" prop="redirectUri">
          <el-input
            v-model="formData.redirectUri"
            type="textarea"
            :rows="2"
            placeholder="多个地址用英文逗号分隔"
          />
        </el-form-item>
        <el-form-item label="访问令牌秒数" prop="accessTokenTimeToLive">
          <el-input-number
            v-model="formData.accessTokenTimeToLive"
            :min="1"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="刷新令牌秒数" prop="refreshTokenTimeToLive">
          <el-input-number
            v-model="formData.refreshTokenTimeToLive"
            :min="1"
            controls-position="right"
          />
        </el-form-item>
        <template v-if="formData.id">
          <el-divider />
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="创建人">
                <el-input :model-value="formData.createdBy || '-'" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="创建时间">
                <el-input :model-value="formData.createdTime || '-'" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="更新人">
                <el-input :model-value="formData.updatedBy || '-'" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="更新时间">
                <el-input :model-value="formData.updatedTime || '-'" disabled />
              </el-form-item>
            </el-col>
          </el-row>
        </template>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleSubmit">确定</el-button>
          <el-button @click="handleCloseDialog">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import OAuthClientAPI from "@/api/auth/client";
import type { OAuthClientForm, OAuthClientItem, OAuthClientQueryParams } from "@/types/api";

defineOptions({
  name: "OAuthClient",
  inheritAttrs: false,
});

const queryFormRef = ref();
const dataFormRef = ref();
const loading = ref(false);
const ids = ref<string[]>([]);
const total = ref(0);
const clientList = ref<OAuthClientItem[]>([]);

const queryParams = reactive<OAuthClientQueryParams>({
  pageNum: 1,
  pageSize: 10,
});

const dialog = reactive({
  title: "",
  visible: false,
});

const formData = reactive<OAuthClientForm>({
  clientSecretExpires: 7200,
  accessTokenTimeToLive: 300,
  refreshTokenTimeToLive: 3600,
  grantTypes: [],
  clientAuthenticationMethods: [],
  scopes: [],
  redirectUri: "",
});

const rules = reactive({
  clientId: [{ required: true, message: "请输入客户端ID", trigger: "blur" }],
  clientName: [{ required: true, message: "请输入客户端名称", trigger: "blur" }],
  clientSecret: [
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        if (!formData.id && !value) {
          callback(new Error("请输入客户端密钥"));
          return;
        }
        callback();
      },
      trigger: "blur",
    },
  ],
  grantTypes: [{ required: true, message: "请选择授权类型", trigger: "change" }],
  clientAuthenticationMethods: [{ required: true, message: "请选择认证方式", trigger: "change" }],
  scopes: [{ required: true, message: "请选择作用域", trigger: "change" }],
});

function fetchData() {
  loading.value = true;
  OAuthClientAPI.getPage(queryParams)
    .then((res) => {
      clientList.value = res.data;
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

function handleSelectionChange(selection: OAuthClientItem[]) {
  ids.value = selection.map((item) => item.id).filter(Boolean) as string[];
}

function resetFormData() {
  Object.assign(formData, {
    id: undefined,
    clientId: "",
    clientName: "",
    clientSecret: "",
    clientSecretExpires: 7200,
    grantTypes: [],
    clientAuthenticationMethods: [],
    scopes: [],
    redirectUri: "",
    accessTokenTimeToLive: 300,
    refreshTokenTimeToLive: 3600,
    createdBy: undefined,
    createdTime: undefined,
    updatedBy: undefined,
    updatedTime: undefined,
  });
}

function handleOpenDialog(id?: string) {
  dialog.visible = true;
  if (id) {
    dialog.title = "修改客户端";
    OAuthClientAPI.getFormData(id).then((data) => {
      Object.assign(formData, data);
      formData.clientSecret = "";
    });
  } else {
    dialog.title = "新增客户端";
    resetFormData();
  }
}

function handleSubmit() {
  dataFormRef.value.validate((valid: boolean) => {
    if (!valid) return;
    loading.value = true;
    const clientId = formData.id;
    const request = clientId
      ? OAuthClientAPI.update(clientId, formData)
      : OAuthClientAPI.create(formData);
    request
      .then(() => {
        ElMessage.success(clientId ? "修改成功" : "新增成功");
        handleCloseDialog();
        handleQuery();
      })
      .finally(() => {
        loading.value = false;
      });
  });
}

function handleCloseDialog() {
  dialog.visible = false;
  dataFormRef.value?.resetFields();
  dataFormRef.value?.clearValidate();
  resetFormData();
}

function handleDelete(id?: string) {
  const clientIds = [id || ids.value].join(",");
  if (!clientIds) {
    ElMessage.warning("请勾选删除项");
    return;
  }

  ElMessageBox.confirm("确认删除已选中的数据项?", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(
    () => {
      loading.value = true;
      OAuthClientAPI.deleteByIds(clientIds)
        .then(() => {
          ElMessage.success("删除成功");
          handleQuery();
        })
        .finally(() => {
          loading.value = false;
        });
    },
    () => {
      ElMessage.info("已取消删除");
    }
  );
}

onMounted(() => {
  handleQuery();
});
</script>
