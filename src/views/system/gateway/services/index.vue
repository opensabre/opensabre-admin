<template>
  <div class="app-container">
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <div class="font-medium">服务目录</div>
            <div class="mt-1 text-xs text-gray-400">数据来自 Nacos，仅提供只读查询</div>
          </div>
          <el-button type="primary" :loading="loading" @click="loadServices">刷新</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="services" row-key="name">
        <el-table-column type="expand">
          <template #default="scope">
            <el-table :data="scope.row.instances" size="small" class="mx-4 mb-3 w-auto">
              <el-table-column label="实例地址" min-width="180">
                <template #default="instance">
                  {{ instance.row.ip }}:{{ instance.row.port }}
                </template>
              </el-table-column>
              <el-table-column prop="cluster" label="集群" min-width="120" />
              <el-table-column label="健康" width="90">
                <template #default="instance">
                  <el-tag :type="instance.row.healthy ? 'success' : 'danger'">
                    {{ instance.row.healthy ? "健康" : "异常" }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="启用" width="80">
                <template #default="instance">{{ instance.row.enabled ? "是" : "否" }}</template>
              </el-table-column>
              <el-table-column prop="weight" label="权重" width="80" />
              <el-table-column label="元数据" min-width="220" show-overflow-tooltip>
                <template #default="instance">{{ metadataText(instance.row.metadata) }}</template>
              </el-table-column>
            </el-table>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="服务名称" min-width="220" />
        <el-table-column prop="instanceCount" label="实例数" width="100" />
        <el-table-column label="健康实例" width="140">
          <template #default="scope">
            <el-tag
              :type="
                scope.row.healthyInstanceCount === scope.row.instanceCount ? 'success' : 'warning'
              "
            >
              {{ scope.row.healthyInstanceCount }} / {{ scope.row.instanceCount }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="query.page"
        v-model:limit="query.pageSize"
        @pagination="loadServices"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import GatewayServiceAPI from "@/api/gateway-admin/gateway-service";
import type { GatewayServiceSummary } from "@/types/api/gateway-service";

defineOptions({ name: "GatewayServices" });

const loading = ref(false);
const total = ref(0);
const services = ref<GatewayServiceSummary[]>([]);
const query = reactive({ page: 1, pageSize: 20 });

async function loadServices() {
  loading.value = true;
  try {
    const result = await GatewayServiceAPI.list(query);
    services.value = result.services || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function metadataText(metadata: Record<string, string>) {
  return (
    Object.entries(metadata || {})
      .map(([key, value]) => `${key}=${value}`)
      .join(", ") || "-"
  );
}

onMounted(loadServices);
</script>
