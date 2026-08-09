import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("API 发布向导流量治理步骤", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/views/system/gateway/api-routes/index.vue"),
    "utf8"
  );
  const settingsSource = readFileSync(
    resolve(process.cwd(), "src/views/system/gateway/components/GovernancePolicySettings.vue"),
    "utf8"
  );
  const accessListSource = readFileSync(
    resolve(process.cwd(), "src/views/system/gateway/security/AccessListPanel.vue"),
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

  it("应用和 API 发布配置包含可继承或自定义的黑白名单", () => {
    expect(settingsSource).toContain(
      'policyTypes: () => ["RATE_LIMIT", "TIMEOUT", "CIRCUIT_BREAKER", "ACCESS_CONTROL"]'
    );
    expect(settingsSource).toContain("data.accessControl =");
    expect(settingsSource).toContain('type: "ACCESS_CONTROL"');
  });

  it("安全管理中的黑白名单入口只维护全局默认值", () => {
    expect(accessListSource).toContain('GatewayApiRouteAPI.listPolicies("GLOBAL")');
    expect(accessListSource).not.toContain('value="APPLICATION"');
    expect(accessListSource).not.toContain('value="API"');
  });
});
