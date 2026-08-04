<template>
  <div class="app-container">
    <el-alert
      class="mb-4"
      type="info"
      show-icon
      :closable="false"
      title="API 级路由管理"
      description="API 默认不对外暴露；只有保存发布声明并经过发布流程后才会进入网关运行时配置。/服务名/** 等应用级通配路由单独展示。"
    />

    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-medium">网关 API 资产与发布状态</span>
          <div class="flex items-center gap-2">
            <el-button type="success" :loading="syncing" @click="syncApis">同步 OpenAPI</el-button>
            <el-button type="primary" :loading="loading" @click="loadAll">刷新</el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="API 资产" name="apis">
          <el-form :inline="true" class="mb-3">
            <el-form-item label="服务名">
              <el-select
                v-model="serviceId"
                clearable
                filterable
                allow-create
                default-first-option
                placeholder="选择或输入服务名"
                class="w-64"
              >
                <el-option
                  v-for="service in services"
                  :key="service.name"
                  :label="service.name"
                  :value="service.name"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button :loading="loading" @click="loadApis">查询</el-button>
            </el-form-item>
          </el-form>

          <el-table v-loading="loading" :data="apis" border row-key="id">
            <el-table-column prop="serviceId" label="服务名" min-width="160" />
            <el-table-column prop="httpMethod" label="方法" width="100" />
            <el-table-column prop="upstreamPath" label="接口路径" min-width="250" />
            <el-table-column prop="operationId" label="Operation ID" min-width="180" />
            <el-table-column prop="summary" label="说明" min-width="220" show-overflow-tooltip />
            <el-table-column label="发现状态" width="110">
              <template #default="{ row }">
                <el-tag :type="statusType(row.discoveryStatus)">
                  {{ row.discoveryStatus || "UNKNOWN" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="发布状态" width="130">
              <template #default="{ row }">
                <el-tag v-if="publicationByApi.get(row.id)" type="success">
                  {{ publicationByApi.get(row.id)?.status }}
                </el-tag>
                <el-tag v-else type="info">未发布</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="110" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openPublicationDialog(row)">
                  {{ publicationByApi.get(row.id) ? "编辑发布" : "发布 API" }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="API 发布声明" name="publications">
          <el-table v-loading="loading" :data="publications" border row-key="id">
            <el-table-column prop="apiId" label="API ID" min-width="190" />
            <el-table-column prop="externalPath" label="外部路径" min-width="230" />
            <el-table-column prop="upstreamPath" label="目标路径" min-width="230" />
            <el-table-column prop="authMode" label="鉴权方式" width="140" />
            <el-table-column prop="riskLevel" label="风险等级" width="110" />
            <el-table-column prop="approvalStatus" label="审批状态" width="130" />
            <el-table-column prop="status" label="发布状态" width="110" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="应用级路由" name="application-routes">
          <div class="mb-3 flex items-center justify-between">
            <span class="text-sm text-gray-500">应用级通配路由草稿</span>
            <el-button type="success" icon="plus" @click="openApplicationRouteDialog()">
              新增应用路由
            </el-button>
          </div>
          <el-table v-loading="loading" :data="applicationRoutes" border row-key="id">
            <el-table-column prop="serviceId" label="服务名" min-width="160" />
            <el-table-column prop="routeName" label="路由名称" min-width="170" />
            <el-table-column prop="externalPath" label="外部路径" min-width="230" />
            <el-table-column prop="targetUri" label="目标 URI" min-width="230" />
            <el-table-column prop="httpMethod" label="方法" width="100" />
            <el-table-column prop="riskLevel" label="风险等级" width="110" />
            <el-table-column prop="approvalStatus" label="审批状态" width="130" />
            <el-table-column prop="status" label="状态" width="110" />
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click="openApplicationRouteDialog(row)"
                >
                  编辑
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="publicationDialog.visible" title="API 发布声明" width="560px">
      <el-form label-width="110px">
        <el-form-item label="API">
          <span>
            {{ publicationDialog.api?.httpMethod }} {{ publicationDialog.api?.upstreamPath }}
          </span>
        </el-form-item>
        <el-form-item label="外部路径" required>
          <el-input v-model="publicationForm.externalPath" placeholder="例如 /users/{id}" />
        </el-form-item>
        <el-form-item label="目标路径">
          <el-input v-model="publicationForm.upstreamPath" placeholder="默认使用 API 原始路径" />
        </el-form-item>
        <el-form-item label="鉴权方式" required>
          <el-select v-model="publicationForm.authMode" class="w-full">
            <el-option label="公开" value="PUBLIC" />
            <el-option label="登录后访问" value="AUTHENTICATED" />
            <el-option label="需要资源授权" value="RESOURCE_REQUIRED" />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="publicationForm.authMode === 'RESOURCE_REQUIRED'"
          label="组织资源"
          required
        >
          <el-select v-model="publicationForm.resourceId" filterable clearable class="w-full">
            <el-option
              v-for="option in resourceOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="publicationDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="savePublication">保存草稿</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="applicationRouteDialog.visible"
      :title="applicationRouteDialog.editing ? '编辑应用级路由' : '新增应用级路由'"
      width="560px"
    >
      <el-form label-width="110px">
        <el-form-item label="服务名" required>
          <el-select
            v-model="applicationRouteForm.serviceId"
            filterable
            allow-create
            class="w-full"
          >
            <el-option
              v-for="service in services"
              :key="service.name"
              :label="service.name"
              :value="service.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="路由名称" required>
          <el-input v-model="applicationRouteForm.routeName" placeholder="例如 organization-api" />
        </el-form-item>
        <el-form-item label="外部路径" required>
          <el-input
            v-model="applicationRouteForm.externalPath"
            placeholder="例如 /organization/**"
          />
        </el-form-item>
        <el-form-item label="目标 URI" required>
          <el-input
            v-model="applicationRouteForm.targetUri"
            placeholder="例如 lb://base-organization"
          />
        </el-form-item>
        <el-form-item label="HTTP 方法">
          <el-select v-model="applicationRouteForm.httpMethod" clearable class="w-full">
            <el-option
              v-for="method in httpMethods"
              :key="method"
              :label="method"
              :value="method"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="重写路径">
          <el-input v-model="applicationRouteForm.rewritePath" placeholder="可选，例如 /$1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applicationRouteDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveApplicationRoute">
          保存草稿
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import GatewayApiRouteAPI from "@/api/gateway-admin/gateway-api-route";
import GatewayServiceAPI from "@/api/gateway-admin/gateway-service";
import ResourceAPI from "@/api/system/resource";
import type {
  GatewayApiAsset,
  GatewayApiPublicationChange,
  GatewayApiPublication,
  GatewayApplicationRoute,
  GatewayApplicationRouteChange,
} from "@/types/api/gateway-api-route";
import type { GatewayServiceSummary } from "@/types/api/gateway-service";
import type { OptionItem } from "@/types/api";

defineOptions({ name: "GatewayApiRoutes" });

const activeTab = ref("apis");
const loading = ref(false);
const syncing = ref(false);
const saving = ref(false);
const serviceId = ref("");
const services = ref<GatewayServiceSummary[]>([]);
const resourceOptions = ref<OptionItem[]>([]);
const apis = ref<GatewayApiAsset[]>([]);
const publications = ref<GatewayApiPublication[]>([]);
const applicationRoutes = ref<GatewayApplicationRoute[]>([]);
const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const publicationDialog = reactive<{
  visible: boolean;
  api?: GatewayApiAsset;
}>({ visible: false });
const publicationForm = reactive<GatewayApiPublicationChange>({
  externalPath: "",
  upstreamPath: "",
  authMode: "AUTHENTICATED",
  resourceId: "",
});
const applicationRouteDialog = reactive({ visible: false, editing: false, id: "" });
const applicationRouteForm = reactive<GatewayApplicationRouteChange>({
  serviceId: "",
  routeName: "",
  externalPath: "",
  targetUri: "",
  httpMethod: "",
  rewritePath: "",
  lockVersion: undefined,
});

const publicationByApi = computed(
  () => new Map(publications.value.map((publication) => [publication.apiId, publication]))
);

function statusType(status?: string) {
  if (status === "ACTIVE" || status === "PUBLISHED") return "success";
  if (status === "MISSING" || status === "OFFLINE") return "warning";
  return "info";
}

async function loadApis() {
  apis.value = await GatewayApiRouteAPI.listApis({
    serviceId: serviceId.value.trim() || undefined,
  });
}

async function loadServices() {
  try {
    const result = await GatewayServiceAPI.list({ page: 1, pageSize: 500 });
    services.value = result.services || [];
  } catch {
    // 请求拦截器已提示错误；允许用户手工输入服务名继续操作。
  }
}

async function loadResourceOptions() {
  if (resourceOptions.value.length) return;
  try {
    resourceOptions.value = await ResourceAPI.getOptions();
  } catch {
    // 只有选择 RESOURCE_REQUIRED 时才需要资源选项。
  }
}

async function syncApis() {
  const targetService = serviceId.value.trim();
  if (!targetService) {
    ElMessage.warning("请先选择或输入服务名");
    return;
  }
  syncing.value = true;
  try {
    const result = await GatewayApiRouteAPI.syncApis(targetService);
    ElMessage.success(
      `同步完成：发现 ${result.discovered} 个，新增 ${result.created} 个，更新 ${result.updated} 个`
    );
    await loadAll();
  } finally {
    syncing.value = false;
  }
}

function openPublicationDialog(api: GatewayApiAsset) {
  const current = publicationByApi.value.get(api.id);
  publicationDialog.api = api;
  publicationDialog.visible = true;
  publicationForm.externalPath = current?.externalPath || api.upstreamPath;
  publicationForm.upstreamPath = current?.upstreamPath || api.upstreamPath;
  publicationForm.authMode =
    (current?.authMode as GatewayApiPublicationChange["authMode"]) || "AUTHENTICATED";
  publicationForm.resourceId = "";
  if (publicationForm.authMode === "RESOURCE_REQUIRED") void loadResourceOptions();
  publicationForm.lockVersion = current?.lockVersion;
}

async function savePublication() {
  const api = publicationDialog.api;
  if (!api || !publicationForm.externalPath.trim()) {
    ElMessage.warning("外部路径不能为空");
    return;
  }
  saving.value = true;
  try {
    await GatewayApiRouteAPI.savePublication(api.id, {
      ...publicationForm,
      externalPath: publicationForm.externalPath.trim(),
      upstreamPath: publicationForm.upstreamPath?.trim() || api.upstreamPath,
      resourceId:
        publicationForm.authMode === "RESOURCE_REQUIRED" ? publicationForm.resourceId : undefined,
    });
    ElMessage.success("API 发布草稿已保存");
    publicationDialog.visible = false;
    await loadAll();
  } finally {
    saving.value = false;
  }
}

function openApplicationRouteDialog(route?: GatewayApplicationRoute) {
  applicationRouteDialog.visible = true;
  applicationRouteDialog.editing = Boolean(route);
  applicationRouteDialog.id = route?.id || "";
  applicationRouteForm.serviceId = route?.serviceId || serviceId.value.trim();
  applicationRouteForm.routeName = route?.routeName || "";
  applicationRouteForm.externalPath = route?.externalPath || "";
  applicationRouteForm.targetUri = route?.targetUri || "";
  applicationRouteForm.httpMethod = route?.httpMethod || "";
  applicationRouteForm.rewritePath = route?.rewritePath || "";
}

async function saveApplicationRoute() {
  const required = [
    applicationRouteForm.serviceId,
    applicationRouteForm.routeName,
    applicationRouteForm.externalPath,
    applicationRouteForm.targetUri,
  ];
  if (required.some((value) => !value.trim())) {
    ElMessage.warning("服务名、路由名称、外部路径和目标 URI 不能为空");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...applicationRouteForm,
      serviceId: applicationRouteForm.serviceId.trim(),
      routeName: applicationRouteForm.routeName.trim(),
      externalPath: applicationRouteForm.externalPath.trim(),
      targetUri: applicationRouteForm.targetUri.trim(),
      httpMethod: applicationRouteForm.httpMethod || undefined,
      rewritePath: applicationRouteForm.rewritePath?.trim() || undefined,
    };
    if (applicationRouteDialog.editing) {
      await GatewayApiRouteAPI.updateApplicationRoute(applicationRouteDialog.id, {
        ...payload,
        lockVersion: applicationRouteForm.lockVersion,
      });
    } else {
      await GatewayApiRouteAPI.createApplicationRoute(payload);
    }
    ElMessage.success(applicationRouteDialog.editing ? "应用路由草稿已更新" : "应用路由草稿已创建");
    applicationRouteDialog.visible = false;
    await loadAll();
  } finally {
    saving.value = false;
  }
}

async function loadAll() {
  loading.value = true;
  try {
    await Promise.all([
      loadApis(),
      GatewayApiRouteAPI.listPublications().then((result) => (publications.value = result)),
      GatewayApiRouteAPI.listApplicationRoutes().then(
        (result) => (applicationRoutes.value = result)
      ),
    ]);
  } finally {
    loading.value = false;
  }
}

onMounted(loadAll);
onMounted(loadServices);
</script>
