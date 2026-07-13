<template>
  <div class="app-container">
    <iframe :src="iframeUrl" frameborder="0" title="内嵌页面" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const iframeUrl = computed(() => {
  const value = (route.meta as { params?: Record<string, unknown> }).params?.iframeUrl;
  if (typeof value === "string" && (/^https?:\/\//.test(value) || value.startsWith("/"))) {
    return value;
  }
  return "about:blank";
});
</script>

<style lang="scss" scoped>
.app-container {
  height: calc(100vh - 50px);
}

.hasTagsView {
  .app-container {
    height: calc(100vh - 84px);
  }
}

iframe {
  width: 100%;
  height: 100%;
  border: 0;
}
</style>
