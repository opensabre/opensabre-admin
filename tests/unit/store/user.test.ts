import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useUserStore } from "@/store/modules/user";
import UserAPI from "@/api/system/user";
import AuthAPI from "@/api/auth";
import { AuthStorage } from "@/utils/auth";

vi.mock("@/api/system/user", () => ({
  default: {
    getInfo: vi.fn(),
  },
}));

vi.mock("@/store", async () => {
  const { createPinia } = await import("pinia");

  return {
    store: createPinia(),
    useTagsViewStore: vi.fn(() => ({
      delAllViews: vi.fn(),
    })),
  };
});

vi.mock("@/store/modules/permission", () => ({
  usePermissionStoreHook: vi.fn(() => ({
    resetRouter: vi.fn(),
  })),
}));

vi.mock("@/store/modules/dict", () => ({
  useDictStoreHook: vi.fn(() => ({
    clearDictCache: vi.fn(),
  })),
}));

vi.mock("@/api/auth", () => ({
  default: {
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
  },
}));

vi.mock("@/utils/auth", () => ({
  AuthStorage: {
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    getRememberMe: vi.fn(() => false),
    setTokens: vi.fn(),
    clearAuth: vi.fn(),
  },
}));

vi.mock("@/composables", () => ({
  cleanupWebSocket: vi.fn(),
}));

describe("useUserStore authentication", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("restores login state from a valid gateway session without local token", async () => {
    vi.mocked(AuthStorage.getAccessToken).mockReturnValue("");
    vi.mocked(UserAPI.getInfo).mockResolvedValue({
      id: "101",
      username: "admin",
      name: "Admin User",
    } as any);

    const userStore = useUserStore();

    await expect(userStore.ensureAuthenticated()).resolves.toBe(true);

    expect(UserAPI.getInfo).toHaveBeenCalledTimes(1);
    expect(userStore.authStatus).toBe("authenticated");
    expect(userStore.authMode).toBe("session");
    expect(userStore.userInfo.userId).toBe("101");
    expect(userStore.isLoggedIn()).toBe(true);
  });

  it("退出成功后清理本地认证状态", async () => {
    vi.mocked(AuthAPI.logout).mockResolvedValue(undefined as any);
    const userStore = useUserStore();

    await expect(userStore.logout()).resolves.toBeUndefined();

    expect(AuthStorage.clearAuth).toHaveBeenCalledOnce();
    expect(userStore.authStatus).toBe("anonymous");
    expect(userStore.authMode).toBe("none");
  });

  it("退出请求失败时仍清理本地敏感状态", async () => {
    vi.mocked(AuthAPI.logout).mockRejectedValue(new Error("network error"));
    const userStore = useUserStore();

    await expect(userStore.logout()).rejects.toThrow("network error");

    expect(AuthStorage.clearAuth).toHaveBeenCalledOnce();
    expect(userStore.authStatus).toBe("anonymous");
    expect(userStore.authMode).toBe("none");
  });
});
