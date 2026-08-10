<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" class="release-tabs">
      <el-tab-pane label="待发布变更" name="pending">
        <el-card shadow="never">
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">统一发布候选</div>
                <div class="mt-1 text-xs text-gray-500">汇总路由、治理、安全及全局规则的全部待生效草稿。</div>
              </div>
              <el-button :loading="candidateLoading" @click="loadCandidate">刷新</el-button>
            </div>
          </template>
          <el-alert title="正式发布是一次完整配置原子替换，会包含当前全部待发布变更。" type="warning" :closable="false" class="mb-5" />
          <el-alert v-if="candidate?.replacedLegacyRouteIds?.length" :title="`将原子替换 ${candidate.replacedLegacyRouteIds.length} 条遗留路由：${candidate.replacedLegacyRouteIds.join(', ')}`" type="info" :closable="false" class="mb-5" show-icon />
          <el-descriptions v-loading="candidateLoading" :column="3" border>
            <el-descriptions-item label="当前配置版本">{{ currentVersion || "-" }}</el-descriptions-item>
            <el-descriptions-item label="API 路由">{{ candidate?.apiRouteCount ?? "-" }}</el-descriptions-item>
            <el-descriptions-item label="应用路由">{{ candidate?.applicationRouteCount ?? "-" }}</el-descriptions-item>
          </el-descriptions>
          <h4>编译后的路由预览</h4>
          <el-alert v-for="warning in candidateWarnings" :key="warning" :title="warning" type="warning" :closable="false" class="mb-2" show-icon />
          <el-table :data="candidate?.managedRoutes || []" border empty-text="本次候选没有托管路由">
            <el-table-column prop="id" label="Route ID" min-width="190" />
            <el-table-column prop="uri" label="目标 URI" min-width="180" />
            <el-table-column label="Predicates" min-width="300" show-overflow-tooltip><template #default="{ row }">{{ definitionsText(row.predicates) }}</template></el-table-column>
            <el-table-column label="Filters" min-width="300" show-overflow-tooltip><template #default="{ row }">{{ definitionsText(row.filters) }}</template></el-table-column>
          </el-table>
          <div class="mt-5 flex justify-end gap-2">
            <el-button :loading="candidateLoading" @click="validateCandidate">重新预检</el-button>
            <el-button type="primary" :loading="publishing" :disabled="!candidate" @click="publish">发布全部变更</el-button>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="发布历史与回滚" name="history">
        <el-card shadow="never">
          <template #header><div class="flex justify-between"><span class="font-medium">发布历史</span><el-button :loading="historyLoading" @click="loadHistory">刷新</el-button></div></template>
          <el-table v-loading="historyLoading" :data="releases" row-key="id">
            <el-table-column prop="id" label="发布 ID" min-width="210" show-overflow-tooltip />
            <el-table-column prop="targetVersion" label="目标版本" min-width="180" show-overflow-tooltip />
            <el-table-column label="状态" width="120"><template #default="{ row }"><el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag></template></el-table-column>
            <el-table-column label="开始时间" min-width="170"><template #default="{ row }">{{ formatTime(row.startedTime) }}</template></el-table-column>
            <el-table-column label="完成时间" min-width="170"><template #default="{ row }">{{ formatTime(row.completedTime) }}</template></el-table-column>
            <el-table-column label="操作" width="100" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openDetail(row.id)">详情</el-button></template></el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-drawer v-model="detailVisible" title="发布详情" size="70%">
      <template v-if="detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="发布 ID">{{ detail.release.id }}</el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag :type="statusType(detail.release.status)">{{ statusLabel(detail.release.status) }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="目标版本">{{ detail.release.targetVersion || "-" }}</el-descriptions-item>
          <el-descriptions-item label="失败原因">{{ detail.release.failureReason || "-" }}</el-descriptions-item>
        </el-descriptions>
        <h4>变更项</h4>
        <el-table :data="detail.items" size="small"><el-table-column prop="itemType" label="类型" width="130" /><el-table-column prop="changeType" label="变更" width="110" /><el-table-column prop="itemId" label="对象" min-width="180" /><el-table-column prop="summary" label="摘要" min-width="260" /></el-table>
        <h4>实例加载确认</h4>
        <el-table :data="detail.instances" size="small"><el-table-column prop="instanceId" label="实例" min-width="180" /><el-table-column prop="loadedVersion" label="加载版本" min-width="180" /><el-table-column prop="status" label="状态" width="130" /><el-table-column prop="errorMessage" label="异常" min-width="220" /></el-table>
        <h4>路由探测</h4>
        <el-table :data="detail.routeProbes" size="small"><el-table-column prop="instanceId" label="实例" min-width="180" /><el-table-column prop="status" label="状态" width="130" /><el-table-column prop="missingRouteIdsJson" label="缺失路由" min-width="240" /><el-table-column prop="errorMessage" label="异常" min-width="220" /></el-table>
      </template>
      <template #footer><el-button :loading="verifying" :disabled="detail?.release.status !== 'PARTIALLY_APPLIED'" @click="verifyInstances">重新确认实例</el-button><el-button type="danger" plain :loading="rollingBack" :disabled="!detail?.release.targetVersion" @click="rollback">回滚到此版本</el-button></template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import GatewayApiRouteAPI from "@/api/gateway-admin/gateway-api-route";
import type { GatewayRelease, GatewayReleaseDetail, GatewayReleaseStatus, GatewayReleaseValidationResult, GatewayRuntimeRouteDefinition } from "@/types/api/gateway-api-route";

defineOptions({ name: "GatewayReleases" });
const activeTab = ref("pending");
const candidateLoading = ref(false);
const historyLoading = ref(false);
const publishing = ref(false);
const verifying = ref(false);
const rollingBack = ref(false);
const currentVersion = ref("");
const candidate = ref<GatewayReleaseValidationResult>();
const releases = ref<GatewayRelease[]>([]);
const detailVisible = ref(false);
const detail = ref<GatewayReleaseDetail>();
const candidateWarnings = computed(() => {
  const warnings: string[] = [];
  for (const route of candidate.value?.managedRoutes || []) {
    const path = route.predicates?.find((item) => item.name === "Path");
    const method = route.predicates?.find((item) => item.name === "Method");
    const pattern = path ? Object.values(path.args || {})[0] : undefined;
    if (route.id.startsWith("application-") && (!method || pattern?.includes("**"))) {
      warnings.push(`${route.id} 是无 Method 限制或宽通配应用路由，可能暴露该服务的全部 API`);
    }
    if (route.metadata?.["opensabre-auth-mode"] === "PUBLIC") {
      warnings.push(`${route.id} 允许公开访问，请确认不需要登录或资源权限`);
    }
  }
  return warnings;
});

async function loadCandidate() { candidateLoading.value = true; try { const current = await GatewayApiRouteAPI.getCurrentConfig(); currentVersion.value = current.version; candidate.value = await GatewayApiRouteAPI.validateRelease(current.version); } finally { candidateLoading.value = false; } }
async function validateCandidate() { await loadCandidate(); ElMessage.success("发布预检通过"); }
async function publish() { await ElMessageBox.confirm("将发布当前全部待生效变更，是否继续？", "统一发布确认", { type: "warning" }); publishing.value = true; try { const result = await GatewayApiRouteAPI.publishRelease(currentVersion.value); ElMessage.success(`发布已提交：${statusLabel(result.status)}`); await Promise.all([loadCandidate(), loadHistory()]); activeTab.value = "history"; } finally { publishing.value = false; } }
async function loadHistory() { historyLoading.value = true; try { releases.value = await GatewayApiRouteAPI.listReleases(); } finally { historyLoading.value = false; } }
async function openDetail(id: string) { detail.value = await GatewayApiRouteAPI.getRelease(id); detailVisible.value = true; }
async function verifyInstances() { if (!detail.value) return; verifying.value = true; try { await GatewayApiRouteAPI.verifyReleaseInstances(detail.value.release.id); await openDetail(detail.value.release.id); ElMessage.success("实例加载状态已更新"); } finally { verifying.value = false; } }
async function rollback() { if (!detail.value) return; await ElMessageBox.confirm("回滚会以该历史版本创建一次新的正式发布，是否继续？", "版本回滚", { type: "warning" }); rollingBack.value = true; try { const current = await GatewayApiRouteAPI.getCurrentConfig(); await GatewayApiRouteAPI.rollbackRelease(detail.value.release.id, current.version); detailVisible.value = false; await loadHistory(); ElMessage.success("回滚发布已提交"); } finally { rollingBack.value = false; } }
function statusLabel(status: GatewayReleaseStatus) { return ({ PUBLISHING: "发布中", SUCCEEDED: "成功", PARTIALLY_APPLIED: "部分生效", FAILED: "失败", RECONCILIATION_REQUIRED: "需人工处理" } as const)[status] || status; }
function statusType(status: GatewayReleaseStatus) { return status === "SUCCEEDED" ? "success" : status === "PUBLISHING" ? "info" : status === "PARTIALLY_APPLIED" ? "warning" : "danger"; }
function formatTime(value?: string) { return value ? new Date(value).toLocaleString() : "-"; }
function definitionsText(items?: GatewayRuntimeRouteDefinition[]) { return (items || []).map((item) => `${item.name}(${Object.entries(item.args || {}).map(([key, value]) => `${key}=${value}`).join(", ")})`).join("; ") || "-"; }
onMounted(() => Promise.all([loadCandidate(), loadHistory()]));
</script>

<style scoped>.release-tabs :deep(.el-tabs__content) { overflow: visible; } h4 { margin: 24px 0 10px; }</style>
