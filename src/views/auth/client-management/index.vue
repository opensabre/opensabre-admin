<template>
  <div class="app-container">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="客户端" name="clients" lazy>
        <OAuthClient embedded />
      </el-tab-pane>
      <el-tab-pane label="Token" name="tokens" lazy>
        <OAuthAuthorization embedded />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import OAuthAuthorization from "@/views/auth/authorization/index.vue";
import OAuthClient from "@/views/auth/client/index.vue";

defineOptions({ name: "OAuthClientManagement", inheritAttrs: false });

const activeTab = ref("clients");
</script>
