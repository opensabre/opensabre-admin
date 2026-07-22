import { beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.fn();
vi.mock("@/utils/request", () => ({ default: requestMock }));

describe("GatewayServiceAPI", () => {
  beforeEach(() => vi.clearAllMocks());

  it("queries the independent gateway service catalog", async () => {
    const { default: GatewayServiceAPI } = await import("@/api/gateway-admin/gateway-service");
    const params = { page: 1, pageSize: 20 };

    await GatewayServiceAPI.list(params);

    expect(requestMock).toHaveBeenCalledWith({
      url: "/gateway-admin/services",
      method: "get",
      params,
    });
  });
});
