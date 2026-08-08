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

  it("syncs APIs and saves publication/application route drafts", async () => {
    const { default: api } = await import("@/api/gateway-admin/gateway-api-route");

    await api.syncApis("base-organization");
    await api.savePublication("api-1", {
      externalPath: "/users/{id}",
      authMode: "AUTHENTICATED",
    });
    await api.createApplicationRoute({
      serviceId: "base-organization",
      routeName: "organization-api",
      externalPath: "/organization/**",
      targetUri: "lb://base-organization",
    });
    await api.updateApplicationRoute("route-1", {
      serviceId: "base-organization",
      routeName: "organization-api",
      externalPath: "/organization/**",
      targetUri: "lb://base-organization",
      lockVersion: 0,
    });

    expect(requestMock).toHaveBeenNthCalledWith(1, {
      url: "/gateway-admin/services/base-organization/apis/sync",
      method: "post",
    });
    expect(requestMock).toHaveBeenNthCalledWith(2, {
      url: "/gateway-admin/apis/api-1/publication",
      method: "put",
      data: { externalPath: "/users/{id}", authMode: "AUTHENTICATED" },
    });
    expect(requestMock).toHaveBeenNthCalledWith(3, {
      url: "/gateway-admin/application-routes",
      method: "post",
      data: {
        serviceId: "base-organization",
        routeName: "organization-api",
        externalPath: "/organization/**",
        targetUri: "lb://base-organization",
      },
    });
    expect(requestMock).toHaveBeenNthCalledWith(4, {
      url: "/gateway-admin/application-routes/route-1",
      method: "put",
      data: {
        serviceId: "base-organization",
        routeName: "organization-api",
        externalPath: "/organization/**",
        targetUri: "lb://base-organization",
        lockVersion: 0,
      },
    });
  });

  it("validates and publishes the current gateway draft", async () => {
    const { default: api } = await import("@/api/gateway-admin/gateway-api-route");

    await api.getCurrentConfig();
    await api.validateRelease("base-version");
    await api.publishRelease("base-version");

    expect(requestMock).toHaveBeenNthCalledWith(1, {
      url: "/gateway-admin/routes",
      method: "get",
    });
    expect(requestMock).toHaveBeenNthCalledWith(2, {
      url: "/gateway-admin/releases/validate",
      method: "post",
      data: { baseVersion: "base-version" },
    });
    expect(requestMock).toHaveBeenNthCalledWith(3, {
      url: "/gateway-admin/releases",
      method: "post",
      data: { baseVersion: "base-version" },
    });
  });

  it("keeps existing runtime application routes visible when the managed table is empty", async () => {
    const { mergeApplicationRouteViews } = await import("@/api/gateway-admin/gateway-api-route");

    const routes = mergeApplicationRouteViews([], {
      version: "v1",
      routes: [
        {
          id: "base-organization",
          uri: "lb://base-organization",
          predicates: [{ name: "Path", args: { pattern: "/api/org/**" } }],
          filters: [{ name: "StripPrefix", args: { parts: "2" } }],
        },
        {
          id: "api-123",
          uri: "lb://base-organization",
          predicates: [
            { name: "Method", args: { method: "GET" } },
            { name: "Path", args: { pattern: "/users/{id}" } },
          ],
        },
      ],
    });

    expect(routes).toEqual([
      expect.objectContaining({
        id: "runtime:base-organization",
        serviceId: "base-organization",
        externalPath: "/api/org/**",
        status: "PUBLISHED",
        runtimeOnly: true,
      }),
    ]);
  });
});
