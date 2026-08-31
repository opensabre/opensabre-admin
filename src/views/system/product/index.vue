<template>
  <div class="app-container">
    <el-card shadow="never">
      <template #header>
        <div class="header-row">
          <div>
            <strong>产品管理</strong>
            <p>配置各管理端登录后的名称、描述、Logo、主题与默认首页</p>
          </div>
          <el-button v-permission="['product_manager:add']" type="primary" @click="openDialog()">
            新增产品
          </el-button>
        </div>
      </template>
      <el-table v-loading="loading" :data="products" row-key="code">
        <el-table-column label="产品" min-width="190">
          <template #default="{ row }">
            <div class="product-cell">
              <img v-if="row.logoUrl" :src="row.logoUrl" alt="" />
              <div>
                <strong>{{ row.name }}</strong>
                <small>{{ row.code }}</small>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="shortName" label="简称" width="130" />
        <el-table-column
          prop="description"
          label="产品描述"
          min-width="240"
          show-overflow-tooltip
        />
        <el-table-column prop="homePath" label="默认首页" width="150" />
        <el-table-column label="主题色" width="115">
          <template #default="{ row }">
            <span class="color-dot" :style="{ background: row.primaryColor }" />
            {{ row.primaryColor }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">
              {{ row.enabled ? "启用" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button
              v-permission="['product_manager:edit']"
              link
              type="primary"
              @click="openDialog(row)"
            >
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑产品' : '新增产品'" width="680px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="产品编码" prop="code">
              <el-input v-model="form.code" :disabled="Boolean(form.id)" placeholder="例如 iqc" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态"><el-switch v-model="form.enabled" /></el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="产品名称" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品简称" prop="shortName">
              <el-input v-model="form.shortName" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="产品描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="Logo 地址">
          <el-input v-model="form.logoUrl" placeholder="/assets/products/iqc/logo.svg" />
        </el-form-item>
        <el-form-item label="折叠 Logo"><el-input v-model="form.collapsedLogoUrl" /></el-form-item>
        <el-form-item label="Favicon"><el-input v-model="form.faviconUrl" /></el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="主题色" prop="primaryColor">
              <el-color-picker v-model="form.primaryColor" />
              <el-input v-model="form.primaryColor" class="ml-2" style="width: 120px" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="默认首页" prop="homePath">
              <el-input v-model="form.homePath" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import {
  createProduct,
  listProducts,
  updateProduct,
  type ProductProfile,
  type ProductRequest,
} from "@/api/product";

defineOptions({ name: "ProductManagement" });
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const products = ref<ProductProfile[]>([]);
const formRef = ref<FormInstance>();
const emptyForm = (): ProductProfile => ({
  id: "",
  code: "",
  name: "",
  shortName: "",
  description: "",
  logoUrl: "",
  collapsedLogoUrl: "",
  faviconUrl: "",
  primaryColor: "#409EFF",
  homePath: "/dashboard",
  enabled: true,
});
const form = reactive<ProductProfile>(emptyForm());
const rules: FormRules = {
  code: [
    {
      required: true,
      pattern: /^(COMMON|[a-z][a-z0-9-]{1,63})$/,
      message: "请输入 COMMON 或小写产品编码",
      trigger: "blur",
    },
  ],
  name: [{ required: true, message: "请输入产品名称", trigger: "blur" }],
  shortName: [{ required: true, message: "请输入产品简称", trigger: "blur" }],
  primaryColor: [
    { pattern: /^#[0-9a-fA-F]{6}$/, message: "请输入六位十六进制颜色", trigger: "blur" },
  ],
  homePath: [{ required: true, message: "请输入默认首页", trigger: "blur" }],
};
async function load() {
  loading.value = true;
  try {
    products.value = await listProducts();
  } finally {
    loading.value = false;
  }
}
function openDialog(value?: ProductProfile) {
  Object.assign(form, emptyForm(), value || {});
  dialogVisible.value = true;
}
async function save() {
  if (!(await formRef.value?.validate())) return;
  saving.value = true;
  try {
    const request = Object.fromEntries(Object.entries(form).filter(([key]) => key !== "id"));
    if (form.id) await updateProduct(form.code, request as ProductRequest);
    else await createProduct(request as ProductRequest);
    ElMessage.success("产品配置已保存");
    dialogVisible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}
load();
</script>

<style scoped>
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-row p,
.product-cell small {
  display: block;
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.product-cell {
  display: flex;
  gap: 10px;
  align-items: center;
}
.product-cell img {
  width: 34px;
  height: 34px;
  object-fit: contain;
  border-radius: 8px;
}
.color-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 6px;
  vertical-align: -1px;
  border-radius: 50%;
}
</style>
