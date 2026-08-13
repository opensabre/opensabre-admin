<template>
  <div class="app-container">
    <el-alert
      class="mb-4"
      type="warning"
      :closable="false"
      title="当前共享配置不支持热刷新：轮换后必须按接收方优先滚动重启全部内部 Token 应用，确认均加载新版本后，才能退役 previous 密钥。"
    />
    <el-alert
      v-if="status && !status.writeEnabled"
      class="mb-4"
      type="warning"
      :closable="false"
      title="密钥写操作当前已关闭。确认所有 Servlet 应用加载同一份共享配置后，再由运维开启写开关。"
    />
    <el-alert
      v-else
      class="mb-4"
      type="info"
      :closable="false"
      title="页面只展示密钥 ID、配置版本和轮换时间；密钥内容不会通过管理 API 返回。"
    />

    <el-card v-loading="statusLoading" shadow="hover" class="status-card">
      <template #header>
        <div class="card-header">
          <span>共享密钥状态</span>
          <div>
            <el-button icon="refresh" @click="loadStatus">刷新</el-button>
            <el-button
              v-hasPerm="'sysadmin:internal-token-key:rotate'"
              type="primary"
              :disabled="!status?.writeEnabled"
              @click="openRotate"
            >
              轮换密钥
            </el-button>
            <el-button
              v-hasPerm="'sysadmin:internal-token-key:retire'"
              type="danger"
              plain
              :loading="mutating"
              :disabled="!canRetirePrevious"
              @click="retirePrevious"
            >
              退役 previous
            </el-button>
          </div>
        </div>
      </template>

      <el-descriptions v-if="status" :column="3" border>
        <el-descriptions-item label="内部 Token 校验">
          <el-tag :type="status.enabled ? 'success' : 'danger'">
            {{ status.enabled ? "已启用" : "已关闭" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="配置版本">
          {{ status.configVersion }}
        </el-descriptions-item>
        <el-descriptions-item label="写操作">
          <el-tag :type="status.writeEnabled ? 'warning' : 'info'">
            {{ status.writeEnabled ? "已开启" : "已关闭" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Active Key ID">
          <span class="key-id">{{ status.activeKeyId || "--" }}</span>
          <el-tag
            class="ml-2"
            size="small"
            :type="status.activeKeyConfigured ? 'success' : 'danger'"
          >
            {{ status.activeKeyConfigured ? "已配置" : "未配置" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Active 生效时间">
          {{ formatDateTime(status.activeKeyActivatedAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="Previous Key ID">
          <span class="key-id">{{ status.previousKeyId || "--" }}</span>
          <el-tag
            v-if="status.previousKeyId"
            class="ml-2"
            size="small"
            :type="status.previousKeyConfigured ? 'warning' : 'danger'"
          >
            {{ status.previousKeyConfigured ? "保护期" : "未配置" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Previous 最早退役时间" :span="3">
          {{ formatDateTime(status.previousKeyRetireAfter) }}
          <el-tag v-if="retirementWaiting" class="ml-2" type="warning" size="small">
            尚未到达保护期
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="hover" class="audit-card">
      <template #header>
        <div class="card-header">
          <span>密钥变更审计</span>
          <el-button icon="refresh" @click="loadAudits">刷新</el-button>
        </div>
      </template>
      <el-table v-loading="auditLoading" :data="audits" border>
        <el-table-column prop="operationTime" label="时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.operationTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="操作" min-width="180" />
        <el-table-column label="结果" width="110">
          <template #default="{ row }">
            <el-tag :type="row.errorMessage ? 'danger' : 'success'">
              {{ row.errorMessage ? "失败" : "成功" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operatorUsername" label="操作人" width="130" />
        <el-table-column prop="targetKey" label="目标 Key" min-width="160" />
        <el-table-column prop="clientIp" label="IP" width="140" />
        <el-table-column prop="request" label="请求信息" min-width="220" show-overflow-tooltip />
        <el-table-column
          prop="errorMessage"
          label="失败原因"
          min-width="180"
          show-overflow-tooltip
        />
      </el-table>
      <pagination
        v-if="auditTotal > 0"
        v-model:page="auditQuery.pageNum"
        v-model:limit="auditQuery.pageSize"
        :total="auditTotal"
        @pagination="loadAudits"
      />
    </el-card>

    <el-dialog
      v-model="rotateDialog.visible"
      title="轮换内部 Token 共享密钥"
      width="560px"
      destroy-on-close
    >
      <el-alert
        class="mb-4"
        type="warning"
        :closable="false"
        title="新密钥由服务端安全生成。提交后旧 active 会进入 previous 保护期；请立即按接收方优先滚动重启全部相关应用。"
      />
      <el-form ref="rotateFormRef" :model="rotateForm" :rules="rotateRules" label-width="100px">
        <el-form-item label="当前版本">
          <el-input :model-value="status?.configVersion" disabled />
        </el-form-item>
        <el-form-item label="新 Key ID" prop="newKeyId">
          <el-input
            v-model="rotateForm.newKeyId"
            maxlength="64"
            placeholder="如 internal-20260725-01"
          />
        </el-form-item>
        <el-form-item label="轮换原因" prop="reason">
          <el-input
            v-model="rotateForm.reason"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rotateDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="mutating" @click="rotate">确认轮换</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { dayjs, type FormInstance, type FormRules } from "element-plus";
import AuditLogAPI from "@/api/sysadmin/audit-log";
import InternalTokenKeyAPI from "@/api/sysadmin/internal-token-key";
import type {
  AuditLogItem,
  InternalTokenKeyRotationPayload,
  InternalTokenKeyStatus,
} from "@/types/api";

defineOptions({ name: "InternalTokenKeys", inheritAttrs: false });

const statusLoading = ref(false);
const auditLoading = ref(false);
const mutating = ref(false);
const status = ref<InternalTokenKeyStatus>();
const audits = ref<AuditLogItem[]>([]);
const auditTotal = ref(0);
const auditQuery = reactive({ pageNum: 1, pageSize: 10 });
const rotateDialog = reactive({ visible: false });
const rotateFormRef = ref<FormInstance>();
const rotateForm = reactive<InternalTokenKeyRotationPayload>({
  expectedConfigVersion: 0,
  newKeyId: "",
  reason: "",
});
const rotateRules: FormRules = {
  newKeyId: [
    { required: true, message: "请输入新 Key ID", trigger: "blur" },
    {
      pattern: /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/,
      message: "只能包含字母、数字、点、下划线和连字符",
      trigger: "blur",
    },
  ],
  reason: [{ required: true, message: "请输入轮换原因", trigger: "blur" }],
};

const retirementWaiting = computed(() => {
  if (!status.value?.previousKeyRetireAfter) return false;
  return dayjs().isBefore(dayjs(status.value.previousKeyRetireAfter));
});

const canRetirePrevious = computed(
  () =>
    Boolean(status.value?.writeEnabled) &&
    Boolean(status.value?.previousKeyConfigured) &&
    !retirementWaiting.value
);

async function loadStatus() {
  statusLoading.value = true;
  try {
    status.value = await InternalTokenKeyAPI.status();
  } finally {
    statusLoading.value = false;
  }
}

async function loadAudits() {
  auditLoading.value = true;
  try {
    const result = await AuditLogAPI.getPage({
      pageNum: auditQuery.pageNum,
      pageSize: auditQuery.pageSize,
      module: "INTERNAL_TOKEN_KEY",
    });
    audits.value = result.data;
    auditTotal.value = result.page?.total ?? 0;
  } finally {
    auditLoading.value = false;
  }
}

function openRotate() {
  if (!status.value) return;
  rotateForm.expectedConfigVersion = status.value.configVersion;
  rotateForm.newKeyId = `internal-${dayjs().format("YYYYMMDD-HHmm")}`;
  rotateForm.reason = "";
  rotateDialog.visible = true;
}

async function rotate() {
  const valid = await rotateFormRef.value?.validate().catch(() => false);
  if (!valid || !status.value) return;
  mutating.value = true;
  try {
    status.value = await InternalTokenKeyAPI.rotate({
      ...rotateForm,
      expectedConfigVersion: status.value.configVersion,
    });
    rotateDialog.visible = false;
    ElMessage.warning("密钥轮换已发布，请按接收方优先滚动重启全部相关应用");
    auditQuery.pageNum = 1;
    await loadAudits();
  } finally {
    mutating.value = false;
  }
}

async function retirePrevious() {
  if (!status.value || !canRetirePrevious.value) return;
  let reason = "";
  try {
    const result = await ElMessageBox.prompt(
      "请先确认全部相关应用已滚动重启并加载当前配置版本。退役后使用 previous 密钥签发的 Token 将不再通过验证，请填写原因。",
      "退役 previous 密钥",
      {
        type: "warning",
        inputType: "textarea",
        inputValidator: (value) => Boolean(value?.trim()) || "请输入退役原因",
        confirmButtonText: "确认退役",
      }
    );
    reason = result.value;
  } catch {
    return;
  }
  mutating.value = true;
  try {
    status.value = await InternalTokenKeyAPI.retirePrevious({
      expectedConfigVersion: status.value.configVersion,
      reason: reason.trim(),
    });
    ElMessage.success("previous 密钥已退役");
    auditQuery.pageNum = 1;
    await loadAudits();
  } finally {
    mutating.value = false;
  }
}

function formatDateTime(value?: string) {
  return value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "--";
}

onMounted(() => {
  loadStatus();
  loadAudits();
});
</script>

<style scoped>
.status-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.key-id {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
