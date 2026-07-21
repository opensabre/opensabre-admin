import { beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.fn();
vi.mock("@/utils/request", () => ({ default: requestMock }));

describe("GatewayRouteAPI", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps using base-sysadmin before the control-plane cutover", async () => {
    const { default: GatewayRouteAPI } = await import("@/api/gateway-admin/gateway-route");

    await GatewayRouteAPI.getConfig();

    expect(requestMock).toHaveBeenCalledWith({ url: "/sysadmin/gateway/routes", method: "get" });
  });

  it("accepts the base-gateway-admin route after cutover", async () => {
    const { resolveGatewayRouteBaseUrl } = await import("@/api/gateway-admin/gateway-route");

    expect(resolveGatewayRouteBaseUrl(" /gateway-admin/routes ")).toBe("/gateway-admin/routes");
  });
});
