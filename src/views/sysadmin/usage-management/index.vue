<template>
  <div class="app-container">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="场景管理" name="scenes" lazy>
        <UsageScenes embedded />
      </el-tab-pane>
      <el-tab-pane label="使用统计" name="statistics" lazy>
        <UsageStatistics embedded />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import UsageScenes from "@/views/sysadmin/usage-scenes/index.vue";
import UsageStatistics from "@/views/sysadmin/usage-statistics/index.vue";
import { useRoute } from "vue-router";

defineOptions({ name: "UsageManagement", inheritAttrs: false });

const route = useRoute();
const activeTab = ref(route.query.tab === "statistics" ? "statistics" : "scenes");
</script>
