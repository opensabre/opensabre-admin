import { beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.fn();

vi.mock("@/utils/request", () => ({ default: requestMock }));

describe("RateLimitSceneAPI", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses the sysadmin rate-limit scene endpoints", async () => {
    const { default: RateLimitSceneAPI } = await import("@/api/sysadmin/rate-limit-scene");
    const scene = {
      sceneCode: "LOGIN_SMS",
      sceneName: "短信登录",
      algorithm: "COUNTER" as const,
      dimensions: "IP,BUSINESS",
      maxCount: 5,
      period: 60,
      enabled: true,
    };

    await RateLimitSceneAPI.getList();
    await RateLimitSceneAPI.create(scene);
    await RateLimitSceneAPI.update("LOGIN_SMS", scene);
    await RateLimitSceneAPI.delete("LOGIN_SMS");

    expect(requestMock).toHaveBeenNthCalledWith(1, {
      url: "/sysadmin/ratelimit/scenes",
      method: "get",
    });
    expect(requestMock).toHaveBeenNthCalledWith(2, {
      url: "/sysadmin/ratelimit/scenes",
      method: "post",
      data: scene,
    });
    expect(requestMock).toHaveBeenNthCalledWith(3, {
      url: "/sysadmin/ratelimit/scenes/LOGIN_SMS",
      method: "put",
      data: scene,
    });
    expect(requestMock).toHaveBeenNthCalledWith(4, {
      url: "/sysadmin/ratelimit/scenes/LOGIN_SMS",
      method: "delete",
    });
  });
});
