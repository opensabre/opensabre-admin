import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useUserStore } from "@/store/modules/user";
import UserAPI from "@/api/system/user";
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
});
