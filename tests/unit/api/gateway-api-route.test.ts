import { beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.fn();
vi.mock("@/utils/request", () => ({ default: requestMock }));

describe("GatewayApiRouteAPI", () => {
  beforeEach(() => vi.clearAllMocks());

  it("queries API assets from the gateway control plane", async () => {
    const { default: api } = await import("@/api/gateway-admin/gateway-api-route");

    await api.listApis({ serviceId: "base-organization" });

    expect(requestMock).toHaveBeenCalledWith({
      url: "/gateway-admin/apis",
      method: "get",
      params: { serviceId: "base-organization" },
    });
  });

  it("queries publication declarations and application routes", async () => {
    const { default: api } = await import("@/api/gateway-admin/gateway-api-route");

    await api.listPublications();
    await api.listApplicationRoutes();

    expect(requestMock).toHaveBeenNthCalledWith(1, {
      url: "/gateway-admin/api-publications",
      method: "get",
    });
    expect(requestMock).toHaveBeenNthCalledWith(2, {
      url: "/gateway-admin/application-routes",
      method: "get",
    });
  });
});
