import { beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.fn();

vi.mock("@/utils/request", () => ({
  default: requestMock,
}));

describe("CaptchaSceneAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads captcha scenes through sysadmin captcha scene API", async () => {
    requestMock.mockResolvedValueOnce([{ sceneCode: "LOGIN_IMAGE", captchaType: "IMAGE" }]);

    const { default: CaptchaSceneAPI } = await import("@/api/sysadmin/captcha-scene");

    const scenes = await CaptchaSceneAPI.getList();

    expect(requestMock).toHaveBeenCalledWith({
      url: "/sysadmin/captcha/scenes",
      method: "get",
    });
    expect(scenes).toEqual([{ sceneCode: "LOGIN_IMAGE", captchaType: "IMAGE" }]);
  });

  it("updates captcha scene by scene code", async () => {
    requestMock.mockResolvedValueOnce(true);

    const { default: CaptchaSceneAPI } = await import("@/api/sysadmin/captcha-scene");

    await CaptchaSceneAPI.update("LOGIN_SMS", {
      sceneCode: "IGNORED",
      sceneName: "登录短信验证码",
      captchaType: "SMS",
      notificationTemplateId: "tpl-1",
      captchaLength: 6,
      captchaExpireTime: 5,
      captchaAttempts: 3,
      minInterval: 60,
      maxLimitCount: 10,
      enabled: true,
    });

    expect(requestMock).toHaveBeenCalledWith({
      url: "/sysadmin/captcha/scenes/LOGIN_SMS",
      method: "put",
      data: expect.objectContaining({
        sceneCode: "IGNORED",
        captchaType: "SMS",
        notificationTemplateId: "tpl-1",
      }),
    });
  });
});
