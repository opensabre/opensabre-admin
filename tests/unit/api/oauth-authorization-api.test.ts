import OAuthAuthorizationAPI from "@/api/auth/authorization";

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));
vi.mock("@/utils/request", () => ({ default: requestMock }));

describe("OAuthAuthorizationAPI", () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it("passes REFRESHABLE status to the authorization query", async () => {
    requestMock.mockResolvedValueOnce({ records: [], current: 1, size: 10, total: 0 });

    await OAuthAuthorizationAPI.getPage({
      pageNum: 1,
      pageSize: 10,
      status: "REFRESHABLE",
    });

    expect(requestMock).toHaveBeenCalledWith({
      url: "/auth/authorizations/conditions",
      method: "post",
      data: {
        current: 1,
        size: 10,
        clientId: undefined,
        principalName: undefined,
        authorizationGrantType: undefined,
        status: "REFRESHABLE",
      },
    });
  });

  it("uses the destructive authorization endpoint", async () => {
    requestMock.mockResolvedValueOnce(true);

    await OAuthAuthorizationAPI.revoke("authorization-1");

    expect(requestMock).toHaveBeenCalledWith({
      url: "/auth/authorizations/authorization-1",
      method: "delete",
    });
  });

  it("uses the expired authorization cleanup endpoint", async () => {
    requestMock.mockResolvedValueOnce(2);

    await OAuthAuthorizationAPI.cleanupExpired();

    expect(requestMock).toHaveBeenCalledWith({
      url: "/auth/authorizations/expired/cleanup",
      method: "delete",
    });
  });
});
