import { store } from "@/store";

import AuthAPI from "@/api/auth";
import UserAPI from "@/api/system/user";
import type { LoginRequest, UserInfo } from "@/types/api";

import { AuthStorage } from "@/utils/auth";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { useDictStoreHook } from "@/store/modules/dict";
import { useTagsViewStore } from "@/store";
import { cleanupWebSocket } from "@/composables";

type AuthStatus = "unknown" | "authenticating" | "authenticated" | "anonymous";
type AuthMode = "token" | "session" | "none";
type CurrentUserResponse = UserInfo & {
  id?: string | number;
  name?: string;
};

export const useUserStore = defineStore("user", () => {
  // 用户信息
  const userInfo = ref<UserInfo>({} as UserInfo);
  // 记住我状态
  const rememberMe = ref(AuthStorage.getRememberMe());
  const authStatus = ref<AuthStatus>("unknown");
  const authMode = ref<AuthMode>("none");
  let authenticatingPromise: Promise<boolean> | null = null;

  /**
   * 登录
   *
   * @param {LoginRequest}
   * @returns
   */
  function login(loginRequest: LoginRequest) {
    return new Promise<void>((resolve, reject) => {
      AuthAPI.login(loginRequest)
        .then((data) => {
          const { accessToken, refreshToken } = data;
          // 保存记住我状态和token
          rememberMe.value = loginRequest.rememberMe ?? false;
          AuthStorage.setTokens(accessToken, refreshToken, rememberMe.value);
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  /**
   * 获取用户信息
   *
   * @returns {UserInfo} 用户信息
   */
  function getUserInfo() {
    return new Promise<UserInfo>((resolve, reject) => {
      UserAPI.getInfo()
        .then((data) => {
          if (!data) {
            reject("Verification failed, please Login again.");
            return;
          }
          const currentUser = data as CurrentUserResponse;
          // 数据字段映射：适配 OpenSabre 后端返回的数据结构
          const mappedData: Partial<UserInfo> = {
            userId: currentUser.userId || String(currentUser.id || ""),
            username: currentUser.username,
            nickname: currentUser.nickname || currentUser.name,
            // 将 roleIds 转换为 roles
            roles: ["ADMIN"],
            // perms 暂时为空数组，后续可以从其他接口获取
            perms: [
              "sys:tenant-plan:update",
              "sys:dept:update",
              "sys:tenant-plan:list",
              "sys:user:create",
              "sys:config:refresh",
              "sys:user:export",
              "sys:dept:delete",
              "sys:config:update",
              "sys:tenant-plan:delete",
              "sys:tenant:delete",
              "sys:dict:create",
              "sys:notice:revoke",
              "sys:notice:list",
              "sys:dept:list",
              "sys:tenant:update",
              "sys:role:list",
              "sys:dict-item:create",
              "sys:notice:update",
              "sys:notice:delete",
              "sys:tenant:switch",
              "sys:role:create",
              "sys:role:update",
              "sys:dict-item:update",
              "sys:tenant:create",
              "sys:menu:update",
              "sys:menu:delete",
              "sys:config:create",
              "sys:dict:delete",
              "sys:menu:list",
              "sys:user:import",
              "sys:user:delete",
              "sys:config:list",
              "sys:user:update",
              "sys:tenant:list",
              "sys:tenant:plan-assign",
              "sys:role:assign",
              "sys:dict:list",
              "sys:tenant-plan:create",
              "sys:notice:publish",
              "sys:user:list",
              "sys:dict-item:list",
              "sys:tenant:change-status",
              "sys:menu:create",
              "sys:notice:create",
              "sys:user:reset-password",
              "sys:dept:create",
              "sys:config:delete",
              "sys:dict-item:delete",
              "sys:role:delete",
              "sys:tenant-plan:assign",
              "sys:dict:update",
            ],
          };
          Object.assign(userInfo.value, mappedData);
          authStatus.value = "authenticated";
          authMode.value = AuthStorage.getAccessToken() ? "token" : "session";
          resolve(userInfo.value);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  /**
   * 登出
   */
  function logout() {
    return new Promise<void>((resolve, reject) => {
      AuthAPI.logout()
        .then(() => {
          // 重置所有系统状态
          resetAllState();
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  /**
   * 重置所有系统状态
   * 统一处理所有清理工作，包括用户凭证、路由、缓存等
   */
  function resetAllState() {
    // 1. 重置用户状态
    resetUserState();

    // 2. 重置其他模块状态
    // 重置路由
    usePermissionStoreHook().resetRouter();
    // 清除字典缓存
    useDictStoreHook().clearDictCache();
    // 清除标签视图
    useTagsViewStore().delAllViews();

    // 3. 清理 WebSocket 连接
    cleanupWebSocket();
    console.log("[UserStore] WebSocket connections cleaned up");

    return Promise.resolve();
  }

  /**
   * 重置用户状态
   * 仅处理用户模块内的状态
   */
  function resetUserState() {
    // 清除用户凭证
    AuthStorage.clearAuth();
    // 重置用户信息
    userInfo.value = {} as UserInfo;
    authStatus.value = "anonymous";
    authMode.value = "none";
  }

  /**
   * 刷新 token
   */
  function refreshToken() {
    const refreshToken = AuthStorage.getRefreshToken();

    if (!refreshToken) {
      return Promise.reject(new Error("没有有效的刷新令牌"));
    }

    return new Promise<void>((resolve, reject) => {
      AuthAPI.refreshToken(refreshToken)
        .then((data) => {
          const { accessToken, refreshToken: newRefreshToken } = data;
          // 更新令牌，保持当前记住我状态
          AuthStorage.setTokens(accessToken, newRefreshToken, AuthStorage.getRememberMe());
          resolve();
        })
        .catch((error) => {
          console.log(" refreshToken  刷新失败", error);
          reject(error);
        });
    });
  }

  /**
   * 恢复并确认当前认证状态。
   *
   * Token 模式通过 Authorization 获取用户信息；Session 模式不保存 cookie，
   * 直接请求当前用户接口，让网关基于同源 session cookie 完成验证。
   */
  async function ensureAuthenticated(): Promise<boolean> {
    if (authStatus.value === "authenticated" && userInfo.value.userId) {
      return true;
    }

    if (authenticatingPromise) {
      return authenticatingPromise;
    }

    authStatus.value = "authenticating";
    authenticatingPromise = getUserInfo()
      .then(() => true)
      .catch((error) => {
        resetUserState();
        throw error;
      })
      .finally(() => {
        authenticatingPromise = null;
      });

    return authenticatingPromise;
  }

  return {
    userInfo,
    rememberMe,
    authStatus,
    authMode,
    isLoggedIn: () => {
      return authStatus.value === "authenticated" && !!userInfo.value.userId;
    },
    ensureAuthenticated,
    getUserInfo,
    login,
    logout,
    resetAllState,
    resetUserState,
    refreshToken,
  };
});

/**
 * 在组件外部使用UserStore的钩子函数
 * @see https://pinia.vuejs.org/core-concepts/outside-component-usage.html
 */
export function useUserStoreHook() {
  return useUserStore(store);
}
