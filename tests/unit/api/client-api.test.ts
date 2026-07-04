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
      url: "/auth/client/conditions",
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

  it("normalizes client detail fields for edit form", async () => {
    requestMock.mockResolvedValueOnce({
      id: "1",
      clientId: "test_client",
      clientName: "测试客户端",
      authorizationGrantTypes: "authorization_code,refresh_token",
      clientAuthenticationMethods: "client_secret_basic",
      scopes: "openid,profile",
      redirectUris: "http://localhost/callback,http://localhost/other",
      accessTokenTimeToLive: 600,
      refreshTokenTimeToLive: 7200,
      createdBy: "admin",
      createdTime: "2026-06-29 10:00:00",
      updatedBy: "ops",
      updatedTime: "2026-06-29 11:00:00",
    });

    const { default: OAuthClientAPI } = await import("@/api/auth/client");

    const form = await OAuthClientAPI.getFormData("1");

    expect(form.grantTypes).toEqual(["authorization_code", "refresh_token"]);
    expect(form.clientAuthenticationMethods).toEqual(["client_secret_basic"]);
    expect(form.scopes).toEqual(["openid", "profile"]);
    expect(form.redirectUri).toBe("http://localhost/callback,http://localhost/other");
    expect(form.createdBy).toBe("admin");
    expect(form.updatedBy).toBe("ops");
  });

  it("submits editable fields only", async () => {
    requestMock.mockResolvedValueOnce(true);

    const { default: OAuthClientAPI } = await import("@/api/auth/client");

    await OAuthClientAPI.update("1", {
      id: "1",
      clientId: "test_client",
      clientName: "测试客户端",
      clientSecret: "",
      grantTypes: ["authorization_code"],
      clientAuthenticationMethods: ["client_secret_basic"],
      scopes: ["openid"],
      redirectUri: "http://localhost/callback",
      accessTokenTimeToLive: 600,
      refreshTokenTimeToLive: 7200,
      createdBy: "admin",
      createdTime: "2026-06-29 10:00:00",
    });

    expect(requestMock).toHaveBeenCalledWith({
      url: "/auth/client/1",
      method: "put",
      data: {
        id: "1",
        clientId: "test_client",
        clientName: "测试客户端",
        clientSecret: "",
        clientSecretExpires: undefined,
        grantTypes: ["authorization_code"],
        clientAuthenticationMethods: ["client_secret_basic"],
        scopes: ["openid"],
        redirectUri: "http://localhost/callback",
        accessTokenTimeToLive: 600,
        refreshTokenTimeToLive: 7200,
      },
    });
  });
});
