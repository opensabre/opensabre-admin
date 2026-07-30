import request from "@/utils/request";
import type { LoginRequest, LoginResponse, CaptchaInfo, OAuth2Config } from "@/types/api/auth";
import { CaptchaScenario } from "@/types/api/auth";

const AUTH_BASE_URL = "/v1/auth";

/**
 * OAuth2 配置
 */
export const OAuth2_CONFIG: OAuth2Config = {
  authorizeUrl: `/oauth2/authorization/${import.meta.env.VITE_OAUTH2_REGISTRATION_ID || "base-gateway-client"}`,
};

const AuthAPI = {
  /** 登录接口*/
  login(data: LoginRequest) {
    const payload: Record<string, any> = {
      username: data.username,
      password: data.password,
      captchaId: data.captchaId,
      captchaCode: data.captchaCode,
    };

    // tenantId is optional — include only when provided (multi-tenant feature)
    if (typeof data.tenantId !== "undefined") {
      payload.tenantId = data.tenantId;
    }

    return request<any, LoginResponse>({
      url: `${AUTH_BASE_URL}/login`,
      method: "post",
      data: payload,
    });
  },

  /** 切换租户(平台用户) - 返回新的 token */
  switchTenant(tenantId: number) {
    return request<any, LoginResponse>({
      url: `${AUTH_BASE_URL}/switch-tenant`,
      method: "post",
      params: { tenantId },
    });
  },

  /** 刷新 token 接口*/
  refreshToken(refreshToken: string) {
    return request<any, LoginResponse>({
      url: `${AUTH_BASE_URL}/refresh-token`,
      method: "post",
      params: { refreshToken },
      headers: {
        Authorization: "no-auth",
      },
    });
  },

  /** 退出登录接口 */
  logout() {
    return request({
      url: `${AUTH_BASE_URL}/logout`,
      method: "delete",
    });
  },

  /** 获取验证码接口*/
  getCaptcha(requestKey: string, scenario: CaptchaScenario = CaptchaScenario.LOGIN_IMAGE) {
    return request<any, CaptchaInfo>({
      url: "/sysadmin/captcha/send/image",
      method: "post",
      params: { scenario, requestKey },
    });
  },
};

export default AuthAPI;
