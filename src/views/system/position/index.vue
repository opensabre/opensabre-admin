<template>
  <div class="app-container">
    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="岗位名称" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="岗位名称"
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
        :data="positionList"
        highlight-current-row
        border
        class="table-section__content"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column label="岗位名称" prop="name" min-width="160" />
        <el-table-column
          label="岗位描述"
          prop="description"
          min-width="220"
          show-overflow-tooltip
        />
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
    </el-card>

    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="500px"
      @close="handleCloseDialog"
    >
      <el-form ref="dataFormRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="岗位名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入岗位名称" />
        </el-form-item>
        <el-form-item label="岗位描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入岗位描述"
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
import PositionAPI from "@/api/system/position";
import type { PositionForm, PositionItem, PositionQueryParams } from "@/types/api";

defineOptions({
  name: "Position",
  inheritAttrs: false,
});

const queryFormRef = ref();
const dataFormRef = ref();
const loading = ref(false);
const ids = ref<string[]>([]);
const positionList = ref<PositionItem[]>([]);

const queryParams = reactive<PositionQueryParams>({});

const dialog = reactive({
  title: "",
  visible: false,
});

const formData = reactive<PositionForm>({});

const rules = reactive({
  name: [{ required: true, message: "请输入岗位名称", trigger: "blur" }],
});

function fetchData() {
  loading.value = true;
  PositionAPI.getList(queryParams)
    .then((data) => {
      positionList.value = data;
    })
    .finally(() => {
      loading.value = false;
    });
}

function handleQuery() {
  fetchData();
}

function handleResetQuery() {
  queryFormRef.value.resetFields();
  fetchData();
}

function handleSelectionChange(selection: PositionItem[]) {
  ids.value = selection.map((item) => item.id).filter(Boolean) as string[];
}

function resetFormData() {
  Object.assign(formData, {
    id: undefined,
    name: undefined,
    description: undefined,
  });
}

function handleOpenDialog(id?: string) {
  dialog.visible = true;
  if (id) {
    dialog.title = "修改岗位";
    PositionAPI.getFormData(id).then((data) => Object.assign(formData, data));
  } else {
    dialog.title = "新增岗位";
    resetFormData();
  }
}

function handleSubmit() {
  dataFormRef.value.validate((valid: boolean) => {
    if (!valid) return;
    loading.value = true;
    const positionId = formData.id;
    const request = positionId
      ? PositionAPI.update(positionId, formData)
      : PositionAPI.create(formData);
    request
      .then(() => {
        ElMessage.success(positionId ? "修改成功" : "新增成功");
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
  const positionIds = [id || ids.value].join(",");
  if (!positionIds) {
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
      PositionAPI.deleteByIds(positionIds)
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
