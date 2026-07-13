<template>
  <div class="app-container">
    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="资源名称" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="资源名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="资源编码" prop="code">
          <el-input
            v-model="queryParams.code"
            placeholder="资源编码"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="请求方式" prop="method">
          <el-select v-model="queryParams.method" placeholder="全部" clearable style="width: 120px">
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
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
        :data="resourceList"
        highlight-current-row
        border
        class="table-section__content"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="资源名称" prop="name" min-width="130" />
        <el-table-column label="资源编码" prop="code" min-width="180" />
        <el-table-column label="类型" prop="type" width="100" />
        <el-table-column label="请求方式" prop="method" width="100" align="center">
          <template #default="scope">
            <el-tag>{{ scope.row.method }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="资源路径" prop="url" min-width="180" show-overflow-tooltip />
        <el-table-column label="描述" prop="description" min-width="160" show-overflow-tooltip />
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
      width="560px"
      @close="handleCloseDialog"
    >
      <el-form ref="dataFormRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="资源名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入资源名称" />
        </el-form-item>
        <el-form-item label="资源编码" prop="code">
          <el-input v-model="formData.code" placeholder="例如 resource_manager:add" />
        </el-form-item>
        <el-form-item label="资源类型" prop="type">
          <el-input v-model="formData.type" placeholder="例如 user、role、resource" />
        </el-form-item>
        <el-form-item label="资源路径" prop="url">
          <el-input v-model="formData.url" placeholder="例如 /resource/{id}" />
        </el-form-item>
        <el-form-item label="请求方式" prop="method">
          <el-select v-model="formData.method" placeholder="请选择请求方式">
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
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
import ResourceAPI from "@/api/system/resource";
import type { ResourceForm, ResourceItem, ResourceQueryParams } from "@/types/api";

defineOptions({
  name: "Resource",
  inheritAttrs: false,
});

const queryFormRef = ref();
const dataFormRef = ref();
const loading = ref(false);
const ids = ref<string[]>([]);
const total = ref(0);
const resourceList = ref<ResourceItem[]>([]);

const queryParams = reactive<ResourceQueryParams>({
  pageNum: 1,
  pageSize: 10,
});

const dialog = reactive({
  title: "",
  visible: false,
});

const formData = reactive<ResourceForm>({});

const rules = reactive({
  name: [{ required: true, message: "请输入资源名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入资源编码", trigger: "blur" }],
  type: [{ required: true, message: "请输入资源类型", trigger: "blur" }],
  url: [{ required: true, message: "请输入资源路径", trigger: "blur" }],
  method: [{ required: true, message: "请选择请求方式", trigger: "change" }],
});

function fetchData() {
  loading.value = true;
  ResourceAPI.getPage(queryParams)
    .then((res) => {
      resourceList.value = res.data;
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

function handleSelectionChange(selection: ResourceItem[]) {
  ids.value = selection.map((item) => item.id).filter(Boolean) as string[];
}

function resetFormData() {
  Object.assign(formData, {
    id: undefined,
    name: undefined,
    code: undefined,
    type: undefined,
    url: undefined,
    method: undefined,
    description: undefined,
  });
}

function handleOpenDialog(id?: string) {
  dialog.visible = true;
  if (id) {
    dialog.title = "修改资源";
    ResourceAPI.getFormData(id).then((data) => Object.assign(formData, data));
  } else {
    dialog.title = "新增资源";
    resetFormData();
  }
}

function handleSubmit() {
  dataFormRef.value.validate((valid: boolean) => {
    if (!valid) return;
    loading.value = true;
    const resourceId = formData.id;
    const request = resourceId
      ? ResourceAPI.update(resourceId, formData)
      : ResourceAPI.create(formData);
    request
      .then(() => {
        ElMessage.success(resourceId ? "修改成功" : "新增成功");
        handleCloseDialog();
        handleResetQuery();
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
  const resourceIds = [id || ids.value].join(",");
  if (!resourceIds) {
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
      ResourceAPI.deleteByIds(resourceIds)
        .then(() => {
          ElMessage.success("删除成功");
          handleResetQuery();
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
