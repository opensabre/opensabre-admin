<template>
  <DictSelect
    v-bind="$attrs"
    :model-value="modelValue"
    :code="code"
    :dict-code="dictCode"
    type="radio"
    :button="button"
    @update:model-value="handleUpdate"
  />
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });

defineProps<{
  code?: string;
  dictCode?: string;
  modelValue?: string | number;
  button?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string | number | undefined];
}>();
const handleUpdate = (value: unknown) =>
  emit("update:modelValue", value as string | number | undefined);
</script>
