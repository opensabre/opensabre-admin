import { beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.fn();

vi.mock("@/utils/request", () => ({
  default: requestMock,
}));

describe("OAuthClientAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads client page from authorization client API", async () => {
    requestMock.mockResolvedValueOnce({
      records: [{ id: "1", clientId: "test_client", clientName: "测试客户端" }],
      current: 1,
      size: 10,
      total: 1,
    });

    const { default: OAuthClientAPI } = await import("@/api/auth/client");

    const page = await OAuthClientAPI.getPage({
      pageNum: 1,
      pageSize: 10,
      clientId: "test_client",
    });

    expect(requestMock).toHaveBeenCalledWith({
      url: "/api/v1/auth/client/conditions",
      method: "post",
      data: {
        current: 1,
        size: 10,
        clientId: "test_client",
        clientName: undefined,
      },
    });
    expect(page.page).toEqual({ pageNum: 1, pageSize: 10, total: 1 });
    expect(page.data).toEqual([
      expect.objectContaining({ id: "1", clientId: "test_client", clientName: "测试客户端" }),
    ]);
  });
});
