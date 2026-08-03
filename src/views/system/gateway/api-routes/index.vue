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
          <el-button type="primary" :loading="loading" @click="loadAll">刷新</el-button>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="API 资产" name="apis">
          <el-form :inline="true" class="mb-3">
            <el-form-item label="服务名">
              <el-input
                v-model="serviceId"
                clearable
                placeholder="按服务名过滤"
                @keyup.enter="loadApis"
              />
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
          <el-table v-loading="loading" :data="applicationRoutes" border row-key="id">
            <el-table-column prop="serviceId" label="服务名" min-width="160" />
            <el-table-column prop="routeName" label="路由名称" min-width="170" />
            <el-table-column prop="externalPath" label="外部路径" min-width="230" />
            <el-table-column prop="targetUri" label="目标 URI" min-width="230" />
            <el-table-column prop="httpMethod" label="方法" width="100" />
            <el-table-column prop="riskLevel" label="风险等级" width="110" />
            <el-table-column prop="approvalStatus" label="审批状态" width="130" />
            <el-table-column prop="status" label="状态" width="110" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import GatewayApiRouteAPI from "@/api/gateway-admin/gateway-api-route";
import type {
  GatewayApiAsset,
  GatewayApiPublication,
  GatewayApplicationRoute,
} from "@/types/api/gateway-api-route";

defineOptions({ name: "GatewayApiRoutes" });

const activeTab = ref("apis");
const loading = ref(false);
const serviceId = ref("");
const apis = ref<GatewayApiAsset[]>([]);
const publications = ref<GatewayApiPublication[]>([]);
const applicationRoutes = ref<GatewayApplicationRoute[]>([]);

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
</script>
