<template>
  <div class="app-container">
    <el-alert class="config-status" :closable="false" type="info" show-icon>
      <template #title>
        配置中心：base-gateway.yml · 当前版本：{{ config.version || "读取中" }}
      </template>
      <template #default>
        当前为只读展示，内容来自 Nacos 的
        spring.cloud.gateway.routes。路由修改与发布将在后续版本开放。
      </template>
    </el-alert>

    <div class="filter-section">
      <el-form :inline="true">
        <el-form-item label="关键字">
          <el-input v-model="keyword" clearable placeholder="路由 ID、Path 或目标 URI" />
        </el-form-item>
        <el-form-item class="search-buttons">
          <el-button icon="refresh" :loading="loading" @click="loadConfig">刷新配置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card shadow="hover" class="table-section">
      <div class="table-section__toolbar">
        <span>显式路由（{{ filteredRoutes.length }}）</span>
        <span v-if="config.version" class="version">配置 MD5：{{ config.version }}</span>
      </div>
      <el-table
        v-loading="loading"
        :data="filteredRoutes"
        border
        class="table-section__content"
        empty-text="当前配置没有显式网关路由"
      >
        <el-table-column label="路由 ID" prop="id" min-width="190" />
        <el-table-column label="匹配路径" min-width="260">
          <template #default="{ row }">{{ pathSummary(row) }}</template>
        </el-table-column>
        <el-table-column label="目标 URI" prop="uri" min-width="220" show-overflow-tooltip />
        <el-table-column label="优先级" prop="order" width="90" align="center" />
        <el-table-column label="过滤器" min-width="180">
          <template #default="{ row }">{{ filterSummary(row) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import GatewayRouteAPI from "@/api/sysadmin/gateway-route";
import type { GatewayRoute } from "@/types/api";

defineOptions({ name: "GatewayRoute" });

const loading = ref(false);
const keyword = ref("");
const config = reactive({ version: "", routes: [] as GatewayRoute[] });
const filteredRoutes = computed(() => {
  const search = keyword.value.trim().toLowerCase();
  if (!search) return config.routes;
  return config.routes.filter((route) =>
    `${route.id} ${route.uri} ${pathSummary(route)}`.toLowerCase().includes(search)
  );
});

function pathSummary(route: GatewayRoute) {
  return (
    route.predicates
      .filter((item) => item.name === "Path")
      .map((item) => item.args.pattern || item.args.value)
      .filter(Boolean)
      .join("，") || "-"
  );
}
function filterSummary(route: GatewayRoute) {
  return (
    route.filters
      .map((item) => {
        const args = Object.values(item.args).filter(Boolean).join(", ");
        return args ? `${item.name}(${args})` : item.name;
      })
      .join("，") || "-"
  );
}
async function loadConfig() {
  loading.value = true;
  try {
    const data = await GatewayRouteAPI.getConfig();
    config.version = data.version;
    config.routes = data.routes;
  } finally {
    loading.value = false;
  }
}

onMounted(loadConfig);
</script>

<style scoped lang="scss">
.config-status {
  margin-bottom: 18px;
}
.table-section__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.version {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
