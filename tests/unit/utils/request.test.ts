import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirectToLoginMock } = vi.hoisted(() => ({
  redirectToLoginMock: vi.fn(),
}));

vi.mock("element-plus", () => ({
  ElMessage: { error: vi.fn() },
}));
vi.mock("element-plus/es/components/message/style/css", () => ({}));

vi.mock("@/utils/auth", () => ({
  AuthStorage: {
    getAccessToken: vi.fn(() => ""),
    getRefreshToken: vi.fn(() => ""),
  },
  redirectToLogin: redirectToLoginMock,
}));

vi.mock("@/store/modules/user", () => ({
  useUserStoreHook: vi.fn(() => ({
    userInfo: {},
  })),
}));

import request from "@/utils/request";

function responseAdapter(response: Partial<AxiosResponse>): AxiosRequestConfig["adapter"] {
  return async (config) => ({
    data: response.data,
    status: response.status ?? 200,
    statusText: response.statusText ?? "OK",
    headers: response.headers ?? {},
    config,
    request: response.request,
  });
}

describe("HTTP 响应拦截器", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("API 请求只声明接受 JSON，避免未认证请求被识别为页面导航", () => {
    expect(request.defaults.headers.Accept).toBe("application/json");
  });

  it("API 被重定向到登录页并返回 HTML 时跳转登录", async () => {
    const promise = request({
      url: "/api/org/user/current",
      adapter: responseAdapter({
        data: "<!doctype html><html><body>login</body></html>",
        headers: { "content-type": "text/html" },
        request: { responseURL: "http://opensabre:8080/api/org/user/current" },
      }),
    });

    await expect(promise).rejects.toThrow("Session Invalid");
    expect(redirectToLoginMock).toHaveBeenCalledWith("登录已过期，请重新登录");
  });

  it("最终响应地址为登录页时跳转登录", async () => {
    const promise = request({
      url: "/api/org/user/current",
      adapter: responseAdapter({
        data: "login",
        headers: { "content-type": "text/plain" },
        request: { responseURL: "http://opensabre:8080/login?redirect=%2F" },
      }),
    });

    await expect(promise).rejects.toThrow("Session Invalid");
    expect(redirectToLoginMock).toHaveBeenCalledOnce();
  });

  it("标准 API JSON 响应保持原有处理", async () => {
    const result = await request({
      url: "/api/org/user/current",
      adapter: responseAdapter({
        data: { code: "000000", data: { username: "admin" } },
        headers: { "content-type": "application/json" },
        request: { responseURL: "http://opensabre:8080/api/org/user/current" },
      }),
    });

    expect(result).toEqual({ username: "admin" });
    expect(redirectToLoginMock).not.toHaveBeenCalled();
  });

  it("接受无响应体的 204 成功结果", async () => {
    const result = await request({
      url: "/logout",
      baseURL: "",
      method: "delete",
      adapter: responseAdapter({ status: 204, statusText: "No Content", data: "" }),
    });

    expect(result).toBeUndefined();
    expect(redirectToLoginMock).not.toHaveBeenCalled();
  });
});
