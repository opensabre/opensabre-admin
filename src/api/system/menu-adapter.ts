import type { RouteItem } from "@/types/api";

export interface OrgMenuItem {
  children?: OrgMenuItem[];
  href?: string;
  icon?: string;
  id: string;
  name?: string;
  orderNum?: number;
  parentId?: string;
  type?: string;
}

export function toRouteItems(menus: OrgMenuItem[], parentHref = ""): RouteItem[] {
  return menus.map((menu) => {
    const href = normalizeHref(menu.href);
    const children = menu.children?.length ? toRouteItems(menu.children, href) : [];

    return {
      path: toRoutePath(href, parentHref),
      name: `OrgMenu${menu.id}`,
      component: children.length ? "Layout" : toComponentPath(href),
      redirect: children[0]?.path,
      meta: {
        title: menu.name || href,
        icon: menu.icon,
        hidden: menu.type === "BUTTON",
      },
      children,
    };
  });
}

function normalizeHref(href?: string) {
  if (!href) return "/";
  return href.startsWith("/") ? href : `/${href}`;
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
  };

  return legacyOrgMap[path] || `${path}/index`;
}
