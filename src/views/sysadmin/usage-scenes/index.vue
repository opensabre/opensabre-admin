<template>
  <div class="app-container">
    <el-card shadow="hover">
      <template #header>
        <div class="flex justify-between items-center">
          <span>计次场景</span>
          <el-button type="primary" @click="openCreate">新增场景</el-button>
        </div>
      </template>
      <el-alert
        class="mb-4"
        type="info"
        :closable="false"
        title="只有启用且已登记的对象类型、对象 ID、事件组合会进入使用量统计。"
      />
      <el-table v-loading="loading" :data="scenes" stripe>
        <el-table-column prop="sceneName" label="名称" min-width="150" />
        <el-table-column prop="objectType" label="对象类型" min-width="150" />
        <el-table-column prop="objectId" label="对象 ID" min-width="150" show-overflow-tooltip />
        <el-table-column prop="usageEvent" label="事件" min-width="150" />
        <el-table-column prop="sourceApp" label="所属应用" min-width="120" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">
              {{ row.enabled ? "启用" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.editing ? '编辑计次场景' : '新增计次场景'"
      width="560px"
      destroy-on-close
    >
      <el-form :model="form" label-width="90px">
        <el-form-item label="名称" required><el-input v-model="form.sceneName" /></el-form-item>
        <el-form-item label="对象类型" required>
          <el-input
            v-model="form.objectType"
            :disabled="dialog.editing"
            placeholder="如 CAPTCHA_SCENE"
          />
        </el-form-item>
        <el-form-item label="对象 ID" required>
          <el-input v-model="form.objectId" :disabled="dialog.editing" placeholder="如 LOGIN_SMS" />
        </el-form-item>
        <el-form-item label="使用事件" required>
          <el-input
            v-model="form.usageEvent"
            :disabled="dialog.editing"
            placeholder="如 CAPTCHA_GENERATE"
          />
        </el-form-item>
        <el-form-item label="所属应用">
          <el-input v-model="form.sourceApp" placeholder="如 base-sysadmin" />
        </el-form-item>
        <el-form-item label="是否启用"><el-switch v-model="form.enabled" /></el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import UsageSceneAPI from "@/api/sysadmin/usage-scene";
import type { UsageSceneItem } from "@/types/api";
defineOptions({ name: "UsageScenes", inheritAttrs: false });
const loading = ref(false);
const saving = ref(false);
const scenes = ref<UsageSceneItem[]>([]);
const dialog = reactive({ visible: false, editing: false });
const empty = (): UsageSceneItem => ({
  objectType: "",
  objectId: "",
  usageEvent: "",
  sceneName: "",
  sourceApp: "",
  enabled: true,
  description: "",
});
const form = reactive<UsageSceneItem>(empty());
async function load() {
  loading.value = true;
  try {
    scenes.value = await UsageSceneAPI.list();
  } finally {
    loading.value = false;
  }
}
function openCreate() {
  Object.assign(form, empty());
  dialog.editing = false;
  dialog.visible = true;
}
function openEdit(scene: UsageSceneItem) {
  Object.assign(form, scene);
  dialog.editing = true;
  dialog.visible = true;
}
async function save() {
  if (!form.sceneName || !form.objectType || !form.objectId || !form.usageEvent) return;
  saving.value = true;
  try {
    if (dialog.editing) {
      await UsageSceneAPI.update(form);
    } else {
      await UsageSceneAPI.create(form);
    }
    dialog.visible = false;
    await load();
  } finally {
    saving.value = false;
  }
}
async function remove(scene: UsageSceneItem) {
  await ElMessageBox.confirm(`确认删除计次场景「${scene.sceneName}」吗？`, "警告", {
    type: "warning",
  });
  await UsageSceneAPI.remove(scene);
  await load();
}
onMounted(load);
</script>
