<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="通知场景" name="scenes">
        <el-card shadow="hover" class="table-section">
          <div class="table-section__toolbar">
            <div class="table-section__toolbar--actions">
              <el-button type="success" icon="plus" @click="handleOpenSceneDialog()">
                新增场景
              </el-button>
            </div>
          </div>

          <el-table
            v-loading="sceneLoading"
            :data="sceneList"
            highlight-current-row
            border
            class="table-section__content"
          >
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column label="场景编码" prop="sceneCode" min-width="160" />
            <el-table-column label="场景名称" prop="sceneName" min-width="160" />
            <el-table-column label="今日发送" width="100">
              <template #default="{ row }">
                {{ sceneUsageSummary[row.sceneCode]?.attemptCount ?? 0 }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'">
                  {{ row.enabled ? "启用" : "停用" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              label="描述"
              prop="description"
              min-width="220"
              show-overflow-tooltip
            />
            <el-table-column label="更新时间" prop="updatedTime" width="180" />
            <el-table-column fixed="right" label="操作" width="190">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  link
                  @click="openUsage('NOTIFICATION_SCENE', row.sceneCode)"
                >
                  趋势
                </el-button>
                <el-button
                  type="primary"
                  size="small"
                  link
                  icon="edit"
                  @click="handleOpenSceneDialog(row.sceneCode)"
                >
                  编辑
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  link
                  icon="delete"
                  @click="handleDeleteScene(row.sceneCode)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="通知模板" name="templates">
        <div class="filter-section">
          <el-form ref="templateQueryFormRef" :model="templateQueryParams" :inline="true">
            <el-form-item label="场景" prop="sceneCode">
              <el-select
                v-model="templateQueryParams.sceneCode"
                placeholder="全部"
                clearable
                filterable
                style="width: 180px"
              >
                <el-option
                  v-for="item in sceneList"
                  :key="item.sceneCode"
                  :label="item.sceneName"
                  :value="item.sceneCode"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="渠道" prop="channel">
              <el-select
                v-model="templateQueryParams.channel"
                placeholder="全部"
                clearable
                style="width: 110px"
              >
                <el-option
                  v-for="item in channelOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="enabled">
              <el-select
                v-model="templateQueryParams.enabled"
                placeholder="全部"
                clearable
                style="width: 100px"
              >
                <el-option label="启用" :value="true" />
                <el-option label="停用" :value="false" />
              </el-select>
            </el-form-item>
            <el-form-item class="search-buttons">
              <el-button type="primary" icon="search" @click="fetchTemplates">搜索</el-button>
              <el-button icon="refresh" @click="handleResetTemplateQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-card shadow="hover" class="table-section">
          <div class="table-section__toolbar">
            <div class="table-section__toolbar--actions">
              <el-button type="success" icon="plus" @click="handleOpenTemplateDialog()">
                新增模板
              </el-button>
            </div>
          </div>

          <el-table
            v-loading="templateLoading"
            :data="templateList"
            highlight-current-row
            border
            class="table-section__content"
          >
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column label="模板名称" prop="templateName" min-width="160" />
            <el-table-column label="场景" min-width="150">
              <template #default="{ row }">
                {{ formatScene(row.sceneCode) }}
              </template>
            </el-table-column>
            <el-table-column label="渠道" width="90">
              <template #default="{ row }">
                <el-tag>{{ formatChannel(row.channel) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="标题" prop="title" min-width="160" show-overflow-tooltip />
            <el-table-column label="内容" prop="content" min-width="220" show-overflow-tooltip />
            <el-table-column label="排序" prop="sort" width="80" />
            <el-table-column label="今日发送" width="100">
              <template #default="{ row }">
                {{ templateUsageSummary[row.id]?.attemptCount ?? 0 }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'">
                  {{ row.enabled ? "启用" : "停用" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column fixed="right" label="操作" width="190">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  link
                  @click="openUsage('NOTIFICATION_TEMPLATE', row.id)"
                >
                  趋势
                </el-button>
                <el-button
                  type="primary"
                  size="small"
                  link
                  icon="edit"
                  @click="handleOpenTemplateDialog(row.id)"
                >
                  编辑
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  link
                  icon="delete"
                  @click="handleDeleteTemplate(row.id)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="发送记录" name="records">
        <div class="filter-section">
          <el-form ref="recordQueryFormRef" :model="recordQueryParams" :inline="true">
            <el-form-item label="场景" prop="sceneCode">
              <el-select
                v-model="recordQueryParams.sceneCode"
                placeholder="全部"
                clearable
                filterable
                style="width: 180px"
              >
                <el-option
                  v-for="item in sceneList"
                  :key="item.sceneCode"
                  :label="item.sceneName"
                  :value="item.sceneCode"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="渠道" prop="channel">
              <el-select
                v-model="recordQueryParams.channel"
                placeholder="全部"
                clearable
                style="width: 110px"
              >
                <el-option
                  v-for="item in channelOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select
                v-model="recordQueryParams.status"
                placeholder="全部"
                clearable
                style="width: 110px"
              >
                <el-option label="成功" value="SUCCESS" />
                <el-option label="失败" value="FAILED" />
              </el-select>
            </el-form-item>
            <el-form-item class="search-buttons">
              <el-button type="primary" icon="search" @click="handleRecordQuery">搜索</el-button>
              <el-button icon="refresh" @click="handleResetRecordQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-card shadow="hover" class="table-section">
          <el-table
            v-loading="recordLoading"
            :data="recordList"
            highlight-current-row
            border
            class="table-section__content"
          >
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column label="发送时间" prop="sentTime" width="180" />
            <el-table-column label="场景" min-width="150">
              <template #default="{ row }">
                {{ formatScene(row.sceneCode) }}
              </template>
            </el-table-column>
            <el-table-column label="渠道" width="90">
              <template #default="{ row }">
                <el-tag>{{ formatChannel(row.channel) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="目标" prop="target" min-width="160" show-overflow-tooltip />
            <el-table-column
              label="模板标题"
              prop="templateTitle"
              min-width="160"
              show-overflow-tooltip
            />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === 'SUCCESS' ? 'success' : 'danger'">
                  {{ row.status === "SUCCESS" ? "成功" : "失败" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="重试次数" prop="retryCount" width="100" />
            <el-table-column
              label="失败原因"
              prop="failureReason"
              min-width="220"
              show-overflow-tooltip
            />
            <el-table-column fixed="right" label="操作" width="160">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="handleOpenRecordDetail(row.id)">
                  查看
                </el-button>
                <el-button
                  v-if="row.status === 'FAILED'"
                  type="warning"
                  size="small"
                  link
                  @click="handleRetryRecord(row.id)"
                >
                  重试
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <pagination
            v-if="recordTotal > 0"
            v-model:total="recordTotal"
            v-model:page="recordQueryParams.pageNum"
            v-model:limit="recordQueryParams.pageSize"
            @pagination="fetchRecords"
          />
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="sceneDialog.visible"
      :title="sceneDialog.title"
      width="560px"
      @close="handleCloseSceneDialog"
    >
      <el-form ref="sceneFormRef" :model="sceneForm" :rules="sceneRules" label-width="100px">
        <el-form-item label="场景编码" prop="sceneCode">
          <el-input
            v-model="sceneForm.sceneCode"
            placeholder="LOGIN_SMS"
            :disabled="sceneDialog.editing"
          />
        </el-form-item>
        <el-form-item label="场景名称" prop="sceneName">
          <el-input v-model="sceneForm.sceneName" placeholder="请输入场景名称" />
        </el-form-item>
        <el-form-item label="状态" prop="enabled">
          <el-switch v-model="sceneForm.enabled" active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="sceneForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleSubmitScene">确定</el-button>
          <el-button @click="handleCloseSceneDialog">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="templateDialog.visible"
      :title="templateDialog.title"
      width="760px"
      @close="handleCloseTemplateDialog"
    >
      <el-form
        ref="templateFormRef"
        :model="templateForm"
        :rules="templateRules"
        label-width="110px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="模板名称" prop="templateName">
              <el-input v-model="templateForm.templateName" placeholder="请输入模板名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="场景" prop="sceneCode">
              <el-select v-model="templateForm.sceneCode" filterable style="width: 100%">
                <el-option
                  v-for="item in sceneList"
                  :key="item.sceneCode"
                  :label="item.sceneName"
                  :value="item.sceneCode"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="渠道" prop="channel">
              <el-select v-model="templateForm.channel" style="width: 100%">
                <el-option
                  v-for="item in channelOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number
                v-model="templateForm.sort"
                :min="0"
                :max="9999"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="标题" prop="title">
              <el-input v-model="templateForm.title" placeholder="邮件标题或短信签名标题，可选" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="内容" prop="content">
              <el-input
                v-model="templateForm.content"
                type="textarea"
                :rows="5"
                placeholder="支持 {code}、{minutes} 等命名占位符"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="参数说明" prop="paramSchema">
              <el-input
                v-model="templateForm.paramSchema"
                type="textarea"
                :rows="3"
                placeholder="可记录 JSON schema 或参数说明"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="状态" prop="enabled">
              <el-switch v-model="templateForm.enabled" active-text="启用" inactive-text="停用" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleSubmitTemplate">确定</el-button>
          <el-button @click="handleCloseTemplateDialog">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="recordDialog.visible" title="发送记录详情" width="720px">
      <el-descriptions v-if="currentRecord" :column="1" border>
        <el-descriptions-item label="场景">
          {{ formatScene(currentRecord.sceneCode) }}
        </el-descriptions-item>
        <el-descriptions-item label="渠道">
          {{ formatChannel(currentRecord.channel) }}
        </el-descriptions-item>
        <el-descriptions-item label="目标">{{ currentRecord.target }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ currentRecord.status === "SUCCESS" ? "成功" : "失败" }}
        </el-descriptions-item>
        <el-descriptions-item label="模板标题">
          {{ currentRecord.templateTitle || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="模板内容">
          <pre class="record-detail__pre">{{ currentRecord.templateContent || "-" }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="参数">
          <pre class="record-detail__pre">{{ currentRecord.argsJson || "-" }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="失败原因">
          {{ currentRecord.failureReason || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="消息ID">
          {{ currentRecord.messageId || "-" }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import NotificationAdminAPI from "@/api/sysadmin/notification";
import UsageCounterAPI from "@/api/sysadmin/usage-counter";
import type {
  NotificationChannel,
  NotificationRecordItem,
  NotificationRecordQueryParams,
  NotificationSceneForm,
  NotificationSceneItem,
  NotificationTemplateForm,
  NotificationTemplateItem,
  NotificationTemplateQueryParams,
  UsageObjectSummary,
  UsageObjectType,
} from "@/types/api";
import { dayjs } from "element-plus";
import { useRouter } from "vue-router";

defineOptions({
  name: "NotificationAdmin",
  inheritAttrs: false,
});

const activeTab = ref("scenes");
const sceneLoading = ref(false);
const templateLoading = ref(false);
const recordLoading = ref(false);
const sceneList = ref<NotificationSceneItem[]>([]);
const templateList = ref<NotificationTemplateItem[]>([]);
const recordList = ref<NotificationRecordItem[]>([]);
const recordTotal = ref(0);
const currentRecord = ref<NotificationRecordItem | null>(null);
const sceneUsageSummary = ref<Record<string, UsageObjectSummary>>({});
const templateUsageSummary = ref<Record<string, UsageObjectSummary>>({});
const router = useRouter();

const templateQueryFormRef = ref();
const recordQueryFormRef = ref();
const sceneFormRef = ref();
const templateFormRef = ref();

const templateQueryParams = reactive<NotificationTemplateQueryParams>({
  sceneCode: "",
  channel: "",
  enabled: "",
});

const recordQueryParams = reactive<NotificationRecordQueryParams>({
  pageNum: 1,
  pageSize: 10,
  sceneCode: "",
  channel: "",
  status: "",
});

const channelOptions: Array<{ label: string; value: NotificationChannel }> = [
  { label: "短信", value: "SMS" },
  { label: "邮件", value: "EMAIL" },
  { label: "微信", value: "WECHAT" },
];

const sceneDialog = reactive({
  title: "",
  visible: false,
  editing: false,
  sceneCode: "",
});

const templateDialog = reactive({
  title: "",
  visible: false,
  editing: false,
  id: "",
});

const recordDialog = reactive({
  visible: false,
});

const defaultSceneForm = (): NotificationSceneForm => ({
  sceneCode: "",
  sceneName: "",
  description: "",
  enabled: true,
});

const defaultTemplateForm = (): NotificationTemplateForm => ({
  sceneCode: "",
  channel: "SMS",
  templateName: "",
  title: "",
  content: "",
  paramSchema: "",
  sort: 0,
  enabled: true,
});

const sceneForm = reactive<NotificationSceneForm>(defaultSceneForm());
const templateForm = reactive<NotificationTemplateForm>(defaultTemplateForm());

const sceneRules = reactive({
  sceneCode: [{ required: true, message: "请输入场景编码", trigger: "blur" }],
  sceneName: [{ required: true, message: "请输入场景名称", trigger: "blur" }],
});

const templateRules = reactive({
  sceneCode: [{ required: true, message: "请选择场景", trigger: "change" }],
  channel: [{ required: true, message: "请选择渠道", trigger: "change" }],
  templateName: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
  content: [{ required: true, message: "请输入模板内容", trigger: "blur" }],
});

function formatChannel(channel?: string) {
  return channelOptions.find((item) => item.value === channel)?.label ?? channel ?? "-";
}

function formatScene(sceneCode?: string) {
  if (!sceneCode) return "-";
  const scene = sceneList.value.find((item) => item.sceneCode === sceneCode);
  return scene ? `${scene.sceneName}（${scene.sceneCode}）` : sceneCode;
}

function fetchScenes() {
  sceneLoading.value = true;
  NotificationAdminAPI.getSceneList()
    .then((data) => {
      sceneList.value = data ?? [];
      fetchUsageSummary(
        "NOTIFICATION_SCENE",
        sceneList.value.map((item) => item.sceneCode),
        sceneUsageSummary
      );
    })
    .finally(() => {
      sceneLoading.value = false;
    });
}

function fetchTemplates() {
  templateLoading.value = true;
  NotificationAdminAPI.getTemplateList(templateQueryParams)
    .then((data) => {
      templateList.value = data ?? [];
      fetchUsageSummary(
        "NOTIFICATION_TEMPLATE",
        templateList.value.map((item) => item.id).filter(Boolean) as string[],
        templateUsageSummary
      );
    })
    .finally(() => {
      templateLoading.value = false;
    });
}

function fetchUsageSummary(
  objectType: UsageObjectType,
  objectIds: string[],
  target: Ref<Record<string, UsageObjectSummary>>
) {
  if (!objectIds.length) return;
  UsageCounterAPI.getSummaries({
    from: dayjs().startOf("day").format("YYYY-MM-DDTHH:mm:ss"),
    to: dayjs().format("YYYY-MM-DDTHH:mm:ss"),
    objectType,
    objectIds,
    usageEvent: "NOTIFICATION_SEND",
  }).then((data) => {
    target.value = Object.fromEntries((data || []).map((item) => [item.objectId, item]));
  });
}

function openUsage(objectType: UsageObjectType, objectId?: string) {
  if (!objectId) return;
  router.push({
    path: "/sysadmin/usage-statistics",
    query: { objectType, objectId, usageEvent: "NOTIFICATION_SEND" },
  });
}

function fetchRecords() {
  recordLoading.value = true;
  NotificationAdminAPI.getRecordPage(recordQueryParams)
    .then((res) => {
      recordList.value = res.data ?? [];
      recordTotal.value = res.page?.total ?? 0;
    })
    .finally(() => {
      recordLoading.value = false;
    });
}

function handleTabChange(tabName: string | number) {
  if (tabName === "templates") fetchTemplates();
  if (tabName === "records") fetchRecords();
}

function handleResetTemplateQuery() {
  templateQueryFormRef.value.resetFields();
  fetchTemplates();
}

function handleRecordQuery() {
  recordQueryParams.pageNum = 1;
  fetchRecords();
}

function handleResetRecordQuery() {
  recordQueryFormRef.value.resetFields();
  recordQueryParams.pageNum = 1;
  fetchRecords();
}

function resetSceneForm() {
  Object.assign(sceneForm, defaultSceneForm());
  sceneFormRef.value?.clearValidate();
}

function resetTemplateForm() {
  Object.assign(templateForm, defaultTemplateForm());
  templateFormRef.value?.clearValidate();
}

function handleOpenSceneDialog(sceneCode?: string) {
  resetSceneForm();
  sceneDialog.visible = true;
  sceneDialog.editing = Boolean(sceneCode);
  sceneDialog.sceneCode = sceneCode || "";
  sceneDialog.title = sceneCode ? "修改通知场景" : "新增通知场景";
  if (sceneCode) {
    NotificationAdminAPI.getSceneFormData(sceneCode).then((data) => {
      Object.assign(sceneForm, data);
    });
  }
}

function handleCloseSceneDialog() {
  sceneDialog.visible = false;
  resetSceneForm();
}

function handleSubmitScene() {
  sceneFormRef.value.validate((valid: boolean) => {
    if (!valid) return;
    const request = sceneDialog.editing
      ? NotificationAdminAPI.updateScene(sceneDialog.sceneCode, sceneForm)
      : NotificationAdminAPI.createScene(sceneForm);
    request.then(() => {
      ElMessage.success(sceneDialog.editing ? "修改成功" : "新增成功");
      handleCloseSceneDialog();
      fetchScenes();
    });
  });
}

function handleDeleteScene(sceneCode: string) {
  ElMessageBox.confirm(`确认删除通知场景「${sceneCode}」吗？`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    NotificationAdminAPI.deleteScene(sceneCode).then(() => {
      ElMessage.success("删除成功");
      fetchScenes();
    });
  });
}

function handleOpenTemplateDialog(id?: string) {
  resetTemplateForm();
  templateDialog.visible = true;
  templateDialog.editing = Boolean(id);
  templateDialog.id = id || "";
  templateDialog.title = id ? "修改通知模板" : "新增通知模板";
  if (id) {
    NotificationAdminAPI.getTemplateFormData(id).then((data) => {
      Object.assign(templateForm, data);
    });
  }
}

function handleCloseTemplateDialog() {
  templateDialog.visible = false;
  resetTemplateForm();
}

function handleSubmitTemplate() {
  templateFormRef.value.validate((valid: boolean) => {
    if (!valid) return;
    const request = templateDialog.editing
      ? NotificationAdminAPI.updateTemplate(templateDialog.id, templateForm)
      : NotificationAdminAPI.createTemplate(templateForm);
    request.then(() => {
      ElMessage.success(templateDialog.editing ? "修改成功" : "新增成功");
      handleCloseTemplateDialog();
      fetchTemplates();
    });
  });
}

function handleDeleteTemplate(id?: string) {
  if (!id) return;
  ElMessageBox.confirm("确认删除该通知模板吗？", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    NotificationAdminAPI.deleteTemplate(id).then(() => {
      ElMessage.success("删除成功");
      fetchTemplates();
    });
  });
}

function handleOpenRecordDetail(id: string) {
  NotificationAdminAPI.getRecordDetail(id).then((data) => {
    currentRecord.value = data;
    recordDialog.visible = true;
  });
}

function handleRetryRecord(id: string) {
  NotificationAdminAPI.retryRecord(id).then(() => {
    ElMessage.success("重试请求已提交");
    fetchRecords();
  });
}

onMounted(() => {
  fetchScenes();
});
</script>

<style scoped>
.record-detail__pre {
  margin: 0;
  font-family: inherit;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>
