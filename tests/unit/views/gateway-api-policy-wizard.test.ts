import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("API 发布向导流量治理步骤", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/views/system/gateway/api-routes/index.vue"),
    "utf8"
  );

  it("切换到确认步骤后仍保留策略组件，以便保存自定义参数", () => {
    expect(source).toContain('<div v-show="publicationStep === 1">');
    expect(source).not.toContain('<div v-else-if="publicationStep === 1">');
    expect(source).toContain("await apiPolicySettingsRef.value.save()");
  });

  it("每次打开 API 编辑窗口都重新加载持久化策略", () => {
    expect(source).toContain("await apiPolicySettingsRef.value?.load()");
  });
});
