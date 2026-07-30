<template>
  <div class="app-container">
    <el-card shadow="never">
      <el-empty :description="`${title}功能规划中`">
        <template #image>
          <el-icon :size="72" color="var(--el-color-primary)"><Tools /></el-icon>
        </template>
        <el-alert
          title="菜单结构已初始化，业务能力将在 base-gateway-admin 后续迭代中逐步实现。"
          type="info"
          :closable="false"
          show-icon
        />
      </el-empty>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Tools } from "@element-plus/icons-vue";

defineOptions({ name: "GatewayPlanned" });

const route = useRoute();
const title = computed(() => String(route.meta.title || "网关管理"));
</script>
