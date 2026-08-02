<template>
  <el-select
    v-if="type === 'select'"
    v-model="selectedValue"
    v-bind="$attrs"
    :placeholder="placeholder"
    :disabled="disabled"
    :loading="loading"
    :style="style"
  >
    <el-option
      v-for="option in options"
      :key="option.value"
      :label="option.label"
      :value="option.value"
    />
  </el-select>
  <el-radio-group
    v-else-if="type === 'radio'"
    v-model="selectedValue"
    v-bind="$attrs"
    :disabled="disabled"
    :style="style"
  >
    <component
      :is="button ? ElRadioButton : ElRadio"
      v-for="option in options"
      :key="option.value"
      :value="option.value"
    >
      {{ option.label }}
    </component>
  </el-radio-group>
  <el-checkbox-group
    v-else
    v-model="selectedValue"
    v-bind="$attrs"
    :disabled="disabled"
    :style="style"
  >
    <el-checkbox v-for="option in options" :key="option.value" :value="option.value">
      {{ option.label }}
    </el-checkbox>
  </el-checkbox-group>
</template>

<script setup lang="ts">
import { ElRadio, ElRadioButton } from "element-plus";
import { useDict } from "@/composables/useDict";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    code?: string;
    dictCode?: string;
    modelValue?: string | number | Array<string | number>;
    type?: "select" | "radio" | "checkbox";
    placeholder?: string;
    disabled?: boolean;
    button?: boolean;
    style?: Record<string, string>;
  }>(),
  {
    type: "select",
    placeholder: "请选择",
    disabled: false,
    button: false,
    style: () => ({ width: "300px" }),
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string | number | Array<string | number> | undefined];
}>();

const dictionaryCode = computed(() => props.dictCode || props.code || "");
const { options, loading } = useDict(dictionaryCode);
const selectedValue = computed<any>({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});
</script>
