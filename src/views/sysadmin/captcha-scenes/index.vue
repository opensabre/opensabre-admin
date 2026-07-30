<template>
  <div class="app-container">
    <div class="filter-section">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="关键字" prop="keywords">
          <el-input
            v-model="queryParams.keywords"
            placeholder="场景编码/名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="验证码类型" prop="captchaType">
          <el-select
            v-model="queryParams.captchaType"
            placeholder="全部"
            clearable
            style="width: 130px"
          >
            <el-option
              v-for="item in captchaTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="enabled">
          <el-select
            v-model="queryParams.enabled"
            placeholder="全部"
            clearable
            style="width: 100px"
          >
            <el-option label="启用" :value="true" />
            <el-option label="停用" :value="false" />
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
          <el-button
            v-hasPerm="'sysadmin:captcha-scene:create'"
            type="success"
            icon="plus"
            @click="handleOpenDialog()"
          >
            新增
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="pagedData"
        highlight-current-row
        border
        class="table-section__content"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="场景编码" prop="sceneCode" min-width="150" />
        <el-table-column label="场景名称" prop="sceneName" min-width="150" />
        <el-table-column label="类型" prop="captchaType" width="110">
          <template #default="{ row }">
            <el-tag>{{ formatCaptchaType(row.captchaType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="通知模板" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatTemplate(row.notificationTemplateId) }}
          </template>
        </el-table-column>
        <el-table-column label="长度" prop="captchaLength" width="80" />
        <el-table-column label="有效期(分钟)" prop="captchaExpireTime" width="120" />
        <el-table-column label="最小间隔(秒)" prop="minInterval" width="120" />
        <el-table-column label="最大次数" prop="maxLimitCount" width="100" />
        <el-table-column label="今日生成" width="100">
          <template #default="{ row }">
            {{ usageSummary[row.sceneCode]?.attemptCount ?? 0 }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">
              {{ row.enabled ? "启用" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="描述" prop="description" min-width="180" show-overflow-tooltip />
        <el-table-column fixed="right" label="操作" width="190">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="openUsage(row.sceneCode)">
              趋势
            </el-button>
            <el-button
              v-hasPerm="'sysadmin:captcha-scene:update'"
              type="primary"
              size="small"
              link
              icon="edit"
              @click="handleOpenDialog(row.sceneCode)"
            >
              编辑
            </el-button>
            <el-button
              v-hasPerm="'sysadmin:captcha-scene:delete'"
              type="danger"
              size="small"
              link
              icon="delete"
              @click="handleDelete(row.sceneCode)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-if="filteredData.length > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
      />
    </el-card>

    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="720px"
      @close="handleCloseDialog"
    >
      <el-form ref="dataFormRef" :model="formData" :rules="rules" label-width="130px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="场景编码" prop="sceneCode">
              <el-input
                v-model="formData.sceneCode"
                placeholder="LOGIN_SMS"
                :disabled="dialog.editing"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="场景名称" prop="sceneName">
              <el-input v-model="formData.sceneName" placeholder="请输入场景名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="验证码类型" prop="captchaType">
              <el-select v-model="formData.captchaType" style="width: 100%">
                <el-option
                  v-for="item in captchaTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="通知模板" prop="notificationTemplateId">
              <el-select
                v-model="formData.notificationTemplateId"
                clearable
                filterable
                placeholder="图片验证码可不选"
                style="width: 100%"
              >
                <el-option
                  v-for="item in notificationTemplateOptionsWithId"
                  :key="item.id"
                  :label="`${item.templateName}（${formatChannel(item.channel)}）`"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="验证码长度" prop="captchaLength">
              <el-input-number
                v-model="formData.captchaLength"
                :min="1"
                :max="12"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效期(分钟)" prop="captchaExpireTime">
              <el-input-number
                v-model="formData.captchaExpireTime"
                :min="1"
                :max="120"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="允许尝试次数" prop="captchaAttempts">
              <el-input-number
                v-model="formData.captchaAttempts"
                :min="1"
                :max="20"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最小间隔(秒)" prop="minInterval">
              <el-input-number
                v-model="formData.minInterval"
                :min="0"
                :max="3600"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="周期最大次数" prop="maxLimitCount">
              <el-input-number
                v-model="formData.maxLimitCount"
                :min="1"
                :max="1000"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="enabled">
              <el-switch v-model="formData.enabled" active-text="启用" inactive-text="停用" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="兼容模板编码" prop="templateCode">
              <el-input v-model="formData.templateCode" placeholder="旧模板编码，可选" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="3"
                placeholder="请输入描述"
              />
            </el-form-item>
          </el-col>
        </el-row>
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
import CaptchaSceneAPI from "@/api/sysadmin/captcha-scene";
import NotificationAdminAPI from "@/api/sysadmin/notification";
import UsageCounterAPI from "@/api/sysadmin/usage-counter";
import type {
  CaptchaSceneForm,
  CaptchaSceneItem,
  CaptchaSceneQueryParams,
  CaptchaType,
  NotificationTemplateItem,
  UsageObjectSummary,
} from "@/types/api";
import { dayjs } from "element-plus";
import { useRouter } from "vue-router";

defineOptions({
  name: "CaptchaScenes",
  inheritAttrs: false,
});

const queryFormRef = ref();
const dataFormRef = ref();
const loading = ref(false);
const sceneList = ref<CaptchaSceneItem[]>([]);
const notificationTemplateOptions = ref<NotificationTemplateItem[]>([]);
const usageSummary = ref<Record<string, UsageObjectSummary>>({});
const router = useRouter();

const queryParams = reactive<CaptchaSceneQueryParams>({
  pageNum: 1,
  pageSize: 10,
  keywords: "",
  captchaType: "",
  enabled: "",
});

const dialog = reactive({
  title: "",
  visible: false,
  editing: false,
  sceneCode: "",
});

const defaultForm = (): CaptchaSceneForm => ({
  sceneCode: "",
  sceneName: "",
  captchaType: "IMAGE",
  templateCode: "",
  notificationTemplateId: "",
  description: "",
  captchaLength: 4,
  captchaExpireTime: 5,
  captchaAttempts: 3,
  minInterval: 60,
  maxLimitCount: 10,
  enabled: true,
});

const formData = reactive<CaptchaSceneForm>(defaultForm());

const captchaTypeOptions: Array<{ label: string; value: CaptchaType }> = [
  { label: "图片", value: "IMAGE" },
  { label: "短信", value: "SMS" },
  { label: "邮件", value: "EMAIL" },
  { label: "滑块", value: "SLIDER" },
  { label: "点选", value: "CLICK" },
];

const channelLabels: Record<string, string> = {
  SMS: "短信",
  EMAIL: "邮件",
  WECHAT: "微信",
};

const rules = reactive({
  sceneCode: [{ required: true, message: "请输入场景编码", trigger: "blur" }],
  sceneName: [{ required: true, message: "请输入场景名称", trigger: "blur" }],
  captchaType: [{ required: true, message: "请选择验证码类型", trigger: "change" }],
  captchaLength: [{ required: true, message: "请输入验证码长度", trigger: "change" }],
  captchaExpireTime: [{ required: true, message: "请输入有效期", trigger: "change" }],
  captchaAttempts: [{ required: true, message: "请输入允许尝试次数", trigger: "change" }],
  minInterval: [{ required: true, message: "请输入最小间隔", trigger: "change" }],
  maxLimitCount: [{ required: true, message: "请输入周期最大次数", trigger: "change" }],
});

const filteredData = computed(() => {
  const keywords = queryParams.keywords?.trim().toLowerCase();
  return sceneList.value.filter((item) => {
    const matchKeywords =
      !keywords ||
      item.sceneCode.toLowerCase().includes(keywords) ||
      item.sceneName.toLowerCase().includes(keywords);
    const matchType = !queryParams.captchaType || item.captchaType === queryParams.captchaType;
    const matchEnabled = queryParams.enabled === "" || item.enabled === queryParams.enabled;
    return matchKeywords && matchType && matchEnabled;
  });
});

const total = computed(() => filteredData.value.length);

const notificationTemplateOptionsWithId = computed(() =>
  notificationTemplateOptions.value.filter(
    (item): item is NotificationTemplateItem & { id: string } => Boolean(item.id)
  )
);

const pagedData = computed(() => {
  const pageNum = queryParams.pageNum ?? 1;
  const pageSize = queryParams.pageSize ?? 10;
  const start = (pageNum - 1) * pageSize;
  return filteredData.value.slice(start, start + pageSize);
});

function formatCaptchaType(type: string) {
  return captchaTypeOptions.find((item) => item.value === type)?.label ?? type;
}

function formatChannel(channel?: string) {
  return channel ? channelLabels[channel] || channel : "-";
}

function formatTemplate(id?: string) {
  if (!id) return "-";
  const template = notificationTemplateOptions.value.find((item) => item.id === id);
  return template ? `${template.templateName}（${formatChannel(template.channel)}）` : id;
}

function fetchData() {
  loading.value = true;
  CaptchaSceneAPI.getList()
    .then((data) => {
      sceneList.value = data ?? [];
      fetchUsageSummary();
    })
    .finally(() => {
      loading.value = false;
    });
}

function fetchUsageSummary() {
  const objectIds = sceneList.value.map((item) => item.sceneCode);
  if (!objectIds.length) return;
  UsageCounterAPI.getSummaries({
    from: dayjs().startOf("day").format("YYYY-MM-DDTHH:mm:ss"),
    to: dayjs().format("YYYY-MM-DDTHH:mm:ss"),
    objectType: "CAPTCHA_SCENE",
    objectIds,
    usageEvent: "CAPTCHA_GENERATE",
  }).then((data) => {
    usageSummary.value = Object.fromEntries((data || []).map((item) => [item.objectId, item]));
  });
}

function openUsage(sceneCode: string) {
  router.push({
    path: "/sysadmin/usage-statistics",
    query: { objectType: "CAPTCHA_SCENE", objectId: sceneCode, usageEvent: "CAPTCHA_GENERATE" },
  });
}

function fetchTemplateOptions() {
  NotificationAdminAPI.getTemplateList({ enabled: true }).then((data) => {
    notificationTemplateOptions.value = data ?? [];
  });
}

function handleQuery() {
  queryParams.pageNum = 1;
}

function handleResetQuery() {
  queryFormRef.value.resetFields();
  queryParams.pageNum = 1;
}

function resetForm() {
  Object.assign(formData, defaultForm());
  dataFormRef.value?.clearValidate();
}

function handleOpenDialog(sceneCode?: string) {
  resetForm();
  dialog.visible = true;
  dialog.editing = Boolean(sceneCode);
  dialog.sceneCode = sceneCode || "";
  dialog.title = sceneCode ? "修改验证码场景" : "新增验证码场景";
  if (sceneCode) {
    CaptchaSceneAPI.getFormData(sceneCode).then((data) => {
      Object.assign(formData, data);
    });
  }
}

function handleCloseDialog() {
  dialog.visible = false;
  resetForm();
}

function handleSubmit() {
  dataFormRef.value.validate((valid: boolean) => {
    if (!valid) return;
    const request = dialog.editing
      ? CaptchaSceneAPI.update(dialog.sceneCode, formData)
      : CaptchaSceneAPI.create(formData);
    request.then(() => {
      ElMessage.success(dialog.editing ? "修改成功" : "新增成功");
      handleCloseDialog();
      fetchData();
    });
  });
}

function handleDelete(sceneCode: string) {
  ElMessageBox.confirm(`确认删除验证码场景「${sceneCode}」吗？`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    CaptchaSceneAPI.delete(sceneCode).then(() => {
      ElMessage.success("删除成功");
      fetchData();
    });
  });
}

onMounted(() => {
  fetchTemplateOptions();
  fetchData();
});
</script>
