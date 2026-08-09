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
    expect(source).toContain("apiTrafficPolicySettingsRef.value.save()");
    expect(source).toContain("apiSecurityPolicySettingsRef.value.save()");
  });

  it("每次打开 API 编辑窗口都重新加载持久化策略", () => {
    expect(source).toContain("apiTrafficPolicySettingsRef.value?.load()");
    expect(source).toContain("apiSecurityPolicySettingsRef.value?.load()");
  });

  it("应用和 API 发布配置包含可继承或自定义的黑白名单", () => {
    expect(settingsSource).toContain(
      'policyTypes: () => ["RATE_LIMIT", "TIMEOUT", "CIRCUIT_BREAKER", "ACCESS_CONTROL"]'
    );
    expect(settingsSource).toContain("data.accessControl =");
    expect(settingsSource).toContain('type: "ACCESS_CONTROL"');
    expect(source).toContain('ref="apiSecurityPolicySettingsRef"');
    expect(source).toContain('ref="applicationSecurityPolicySettingsRef"');
    expect(source).toContain(":policy-types=\"['ACCESS_CONTROL']\"");
  });

  it("黑白名单位于安全设置，而不是流量处理组件", () => {
    const trafficStep = source.slice(
      source.indexOf('<div v-show="publicationStep === 1">'),
      source.indexOf('<div v-show="publicationStep === 2">')
    );
    const securityStep = source.slice(
      source.indexOf('<div v-show="publicationStep === 2">'),
      source.indexOf('<div v-if="publicationStep === 3"')
    );
    expect(trafficStep).toContain("'RATE_LIMIT', 'TIMEOUT', 'CIRCUIT_BREAKER'");
    expect(trafficStep).not.toContain("ACCESS_CONTROL");
    expect(securityStep).toContain("ACCESS_CONTROL");
  });

  it("安全管理中的黑白名单入口只维护全局默认值", () => {
    expect(accessListSource).toContain('GatewayApiRouteAPI.listPolicies("GLOBAL")');
    expect(accessListSource).not.toContain('value="APPLICATION"');
    expect(accessListSource).not.toContain('value="API"');
  });
});
