<!-- 字典组件示例 -->
<template>
  <div class="app-container">
    <el-link
      href="https://github.com/opensabre/opensabre-admin"
      type="primary"
      target="_blank"
      class="mb-[20px]"
    >
      示例源码 请点�?>>>
    </el-link>
    <el-form>
      <el-form-item label="性别">
        <dict v-model="stringValue" code="gender" />
        <el-link underline="never" type="primary" class="ml-5">
          值为String: const value = ref("1");
        </el-link>
      </el-form-item>

      <el-form-item label="性别">
        <dict v-model="numberValue" code="gender" />
        <el-link underline="never" type="success" class="ml-5">
          值为Number: const value = ref(1);
        </el-link>
      </el-form-item>

      <el-form-item label="单选框字典">
        <dict v-model="numberValue" type="radio" code="gender" />
        <el-link underline="never" type="success" class="ml-5">
          值为Number: const value = ref(1);
        </el-link>
      </el-form-item>

      <el-form-item label="复选框字典">
        <dict v-model="arrayValue" type="checkbox" code="gender" />
        <el-link underline="never" type="success" class="ml-5">
          值为Array: const value = ref(["1", "2"]);
        </el-link>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
const stringValue = ref("1"); // 性别(值为String)
const numberValue = ref(1); // 性别(值为Number)
const arrayValue = ref(["1", "2"]); // 性别(值为Array)
</script>
