<template>
  <el-tag v-if="tagType" :type="tagType" :size="size">{{ label }}</el-tag>
  <span v-else>{{ label }}</span>
</template>

<script setup lang="ts">
import { useDict } from "@/composables/useDict";

const props = withDefaults(
  defineProps<{
    code?: string;
    dictCode?: string;
    modelValue?: string | number;
    value?: string | number;
    fallback?: string;
    size?: "default" | "large" | "small";
  }>(),
  { size: "default" }
);

const dictionaryCode = computed(() => props.dictCode || props.code || "");
const currentValue = computed(() => props.value ?? props.modelValue);
const { options } = useDict(dictionaryCode);
const item = computed(() =>
  options.value.find((option) => String(option.value) === String(currentValue.value))
);
const label = computed(
  () => item.value?.label ?? props.fallback ?? String(currentValue.value ?? "")
);
const tagType = computed(() => item.value?.tagType || undefined);
</script>
