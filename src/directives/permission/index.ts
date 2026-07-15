import type { Directive, DirectiveBinding } from "vue";

import { useUserStore } from "@/store";
import { ROLE_ROOT } from "@/constants";

/**
 * 按钮权限
 */
export const hasPerm: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    applyPermissionState(el, binding);
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    applyPermissionState(el, binding);
  },
};

/**
 * 无按钮权限时保留操作入口，使用禁用态与文字提示解释原因；接口安全仍由后端资源权限负责。
 */
function applyPermissionState(el: HTMLElement, binding: DirectiveBinding) {
  const requiredPerms = binding.value;

  // 校验传入的权限值是否合法
  if (!requiredPerms || (typeof requiredPerms !== "string" && !Array.isArray(requiredPerms))) {
    throw new Error(
      "需要提供权限标识！例如：v-has-perm=\"'sys:user:create'\" 或 v-has-perm=\"['sys:user:create', 'sys:user:update']\""
    );
  }

  const { roles = [], perms = [] } = useUserStore().userInfo;

  const hasAuth = roles.includes(ROLE_ROOT) || requiredPerms.includes("*:*:*") || (Array.isArray(requiredPerms)
    ? requiredPerms.some((perm) => perms.includes(perm))
    : perms.includes(requiredPerms));

  if (hasAuth) {
    el.classList.remove("is-disabled", "permission-disabled");
    el.removeAttribute("aria-disabled");
    el.removeAttribute("title");
    return;
  }

  el.classList.add("is-disabled", "permission-disabled");
  el.setAttribute("aria-disabled", "true");
  el.setAttribute("title", "无权限，请联系管理员");
  if (!el.dataset.permissionGuarded) {
    const block = (event: Event) => {
      if (el.getAttribute("aria-disabled") === "true") {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    el.addEventListener("click", block, true);
    el.addEventListener("keydown", block, true);
    el.dataset.permissionGuarded = "true";
  }
}

/**
 * 角色权限指令
 */
export const hasRole: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const requiredRoles = binding.value;

    // 校验传入的角色值是否合法
    if (!requiredRoles || (typeof requiredRoles !== "string" && !Array.isArray(requiredRoles))) {
      throw new Error(
        "需要提供角色标识！例如：v-has-role=\"'ADMIN'\" 或 v-has-role=\"['ADMIN', 'TEST']\""
      );
    }

    const { roles = [] } = useUserStore().userInfo;

    // 检查是否有对应角色权限
    const hasAuth = Array.isArray(requiredRoles)
      ? requiredRoles.some((role) => roles.includes(role))
      : roles.includes(requiredRoles);

    // 如果没有权限，移除元素
    if (!hasAuth && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  },
};
