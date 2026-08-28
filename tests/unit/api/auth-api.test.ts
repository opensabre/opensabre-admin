import { beforeEach, describe, expect, it, vi } from "vitest";

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));

vi.mock("@/utils/request", () => ({ default: requestMock }));

import AuthAPI from "@/api/auth";

describe("AuthAPI", () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it("通过认证服务退出端点", async () => {
    requestMock.mockResolvedValue(undefined);

    await AuthAPI.logout();

    expect(requestMock).toHaveBeenCalledWith({ url: "/v1/auth/logout", method: "delete" });
  });
});
