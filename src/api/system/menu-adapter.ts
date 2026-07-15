import type { RouteItem } from "@/types/api";

export interface OrgMenuItem {
  children?: OrgMenuItem[];
  description?: string;
  href?: string;
  icon?: string;
  id: string;
  name?: string;
  orderNum?: number;
  parentId?: string;
  type?: string;
}

export interface AuthorizedRoutes {
  routes: RouteItem[];
  permissions: string[];
}

interface MenuExtra {
  component?: string;
  iframeUrl?: string;
  redirect?: string;
  routeName?: string;
  visible?: number | boolean;
  perm?: string;
}

export function toRouteItems(menus: OrgMenuItem[], parentHref = ""): RouteItem[] {
  return menus.filter((menu) => !isButton(menu)).map((menu) => {
    const href = normalizeHref(menu.href);
    const children = menu.children?.length ? toRouteItems(menu.children, href) : [];
    const extra = parseExtra(menu.description);

    return {
      path: toRoutePath(href, parentHref),
      name: extra.routeName || `OrgMenu${menu.id}`,
      component: children.length ? "Layout" : extra.iframeUrl ? "system/iframe/index" : extra.component || toComponentPath(href),
      redirect: extra.redirect || children[0]?.path,
      meta: {
        title: menu.name || href,
        icon: menu.icon,
        hidden: menu.type === "BUTTON" || extra.visible === 0 || extra.visible === false,
        ...(extra.iframeUrl ? { params: { iframeUrl: extra.iframeUrl } } : {}),
        ...(children.length ? { alwaysShow: true } : {}),
      },
      children,
    };
  });
}

/** 从已授权菜单树收集按钮权限；按钮本身不应成为动态路由。 */
export function toAuthorizedRoutes(menus: OrgMenuItem[]): AuthorizedRoutes {
  return { routes: toRouteItems(menus), permissions: collectButtonPermissions(menus) };
}

function collectButtonPermissions(menus: OrgMenuItem[]): string[] {
  const permissions = new Set<string>();
  const visit = (items: OrgMenuItem[]) => items.forEach((menu) => {
    const extra = parseExtra(menu.description);
    if (isButton(menu) && extra.perm?.trim()) permissions.add(extra.perm.trim());
    if (menu.children?.length) visit(menu.children);
  });
  visit(menus);
  return [...permissions];
}

function isButton(menu: OrgMenuItem) {
  const type = String(menu.type ?? "").toUpperCase();
  return type === "BUTTON" || type === "B";
}

function normalizeHref(href?: string) {
  if (!href) return "/";
  if (/^(https?:)?\/\//.test(href)) return href;
  return href.startsWith("/") ? href : `/${href}`;
}

function parseExtra(description?: string): MenuExtra {
  if (!description) return {};
  try {
    const parsed = JSON.parse(description) as MenuExtra;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function toRoutePath(href: string, parentHref: string) {
  if (!parentHref || parentHref === "/") return href;

  const prefix = parentHref.endsWith("/") ? parentHref : `${parentHref}/`;
  if (!href.startsWith(prefix)) return href;

  return href.slice(prefix.length) || href;
}

function toComponentPath(href: string) {
  const path = href.replace(/^\/+/, "");
  const legacyOrgMap: Record<string, string> = {
    "admin/users": "system/user/index",
    "admin/menus": "system/menu/index",
    "admin/roles": "system/role/index",
    "admin/role": "system/role/index",
    "admin/groups": "system/dept/index",
    "admin/group": "system/dept/index",
    "admin/org": "system/dept/index",
    "admin/resources": "system/resource/index",
    "admin/resource": "system/resource/index",
    "admin/positions": "system/position/index",
    "admin/position": "system/position/index",
    "auth/client": "auth/client/index",
    "auth/online-user": "security/online-user/index",
    "security/audit-log": "security/audit-log/index",
    "security/online-user": "security/online-user/index",
    "sysadmin/audit-log": "security/audit-log/index",
    "sysadmin/online-user": "security/online-user/index",
    "sysadmin/dicts": "system/dict/index",
    "sysadmin/dict-items": "system/dict/dict-item",
    "sysadmin/captcha-scenes": "sysadmin/captcha-scenes/index",
    "sysadmin/captcha-scene": "sysadmin/captcha-scenes/index",
    "sysadmin/notification": "sysadmin/notification/index",
    "sysadmin/notifications": "sysadmin/notification/index",
    "sysadmin/ratelimit-scenes": "sysadmin/ratelimit-scenes/index",
    "sysadmin/ratelimit-scene": "sysadmin/ratelimit-scenes/index",
  };

  return legacyOrgMap[path] || `${path}/index`;
}
