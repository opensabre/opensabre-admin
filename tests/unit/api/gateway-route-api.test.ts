import { beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.fn();
vi.mock("@/utils/request", () => ({ default: requestMock }));

describe("GatewayRouteAPI", () => {
  beforeEach(() => vi.clearAllMocks());

  it("merges all indexed Path patterns into the application route list", async () => {
    const { mergeApplicationRouteViews } = await import("@/api/gateway-admin/gateway-api-route");

    const routes = mergeApplicationRouteViews([], {
      version: "version",
      routes: [
        {
          id: "base-authorization-api",
          uri: "lb://base-authorization",
          order: 0,
          predicates: [
            {
              name: "Path",
              args: { "patterns.1": "/oauth2/v3/**", "patterns.0": "/api/auth/**" },
            },
          ],
          filters: [],
        },
      ],
    });

    expect(routes[0].externalPath).toBe("/api/auth/**,/oauth2/v3/**");
  });

  it("uses base-gateway-admin after the control-plane cutover", async () => {
    const { default: GatewayRouteAPI } = await import("@/api/gateway-admin/gateway-route");

    await GatewayRouteAPI.getConfig();

    expect(requestMock).toHaveBeenCalledWith({ url: "/gateway-admin/routes", method: "get" });
  });

  it("accepts the base-gateway-admin route after cutover", async () => {
    const { resolveGatewayRouteBaseUrl } = await import("@/api/gateway-admin/gateway-route");

    expect(resolveGatewayRouteBaseUrl(" /gateway-admin/routes ")).toBe("/gateway-admin/routes");
  });
});
