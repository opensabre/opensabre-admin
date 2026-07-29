import OAuthAuthorizationConsentAPI from "@/api/auth/authorization-consent";
import request from "@/utils/request";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/utils/request");

describe("OAuthAuthorizationConsentAPI", () => {
  beforeEach(() => {
    vi.mocked(request).mockResolvedValue({ records: [], current: 1, size: 10, total: 0 });
  });

  it("passes consent query conditions", async () => {
    await OAuthAuthorizationConsentAPI.getPage({
      pageNum: 1,
      pageSize: 10,
      clientId: "gateway",
      principalName: "alice",
      authority: "SCOPE_openid",
    });

    expect(request).toHaveBeenCalledWith({
      url: "/auth/authorization-consents/conditions",
      method: "post",
      data: {
        current: 1,
        size: 10,
        clientId: "gateway",
        principalName: "alice",
        authority: "SCOPE_openid",
      },
    });
  });

  it("passes the composite key when removing a consent", async () => {
    await OAuthAuthorizationConsentAPI.remove("client/id", "alice@example.com");

    expect(request).toHaveBeenCalledWith({
      url: "/auth/authorization-consents",
      method: "delete",
      params: {
        registeredClientId: "client/id",
        principalName: "alice@example.com",
      },
    });
  });
});
