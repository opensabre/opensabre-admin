<template>
  <el-select
    v-model="model"
    multiple
    filterable
    allow-create
    default-first-option
    :placeholder="placeholder"
  />
</template>

<script setup lang="ts">
defineProps<{ placeholder: string }>();
const model = defineModel<string[]>({ required: true });
</script>
