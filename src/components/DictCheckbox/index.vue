<template>
  <DictSelect
    v-bind="$attrs"
    :model-value="modelValue"
    :code="code"
    :dict-code="dictCode"
    type="checkbox"
    @update:model-value="handleUpdate"
  />
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });

defineProps<{
  code?: string;
  dictCode?: string;
  modelValue?: Array<string | number>;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: Array<string | number> | undefined];
}>();
const handleUpdate = (value: unknown) =>
  emit("update:modelValue", value as Array<string | number> | undefined);
</script>
