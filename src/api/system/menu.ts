import request from "@/utils/request";
import type { MenuQueryParams, MenuItem, MenuForm, OptionItem } from "@/types/api";
import { toAuthorizedRoutes, type OrgMenuItem } from "./menu-adapter";

const ORG_MENU_BASE_URL = "/org/menu";
const ROOT_PARENT_ID = "-1";
const FRONT_ROOT_PARENT_ID = "0";

interface MenuExtra {
  component?: string;
  iframeUrl?: string;
  keepAlive?: number | boolean;
  perm?: string;
  redirect?: string;
  routeName?: string;
  visible?: number;
}

function normalizeMenuType(type?: string) {
  const normalized = String(type ?? "").toUpperCase();
  if (normalized === "CATALOG" || normalized === "C") return "C";
  if (normalized === "BUTTON" || normalized === "B") return "B";
  return "M";
}

function normalizeParentId(parentId?: string) {
  return parentId === ROOT_PARENT_ID ? FRONT_ROOT_PARENT_ID : parentId;
}

function toOrgParentId(parentId?: string) {
  return !parentId || parentId === FRONT_ROOT_PARENT_ID ? ROOT_PARENT_ID : parentId;
}

function normalizeHref(href?: string) {
  if (!href) return "";
  if (/^(https?:)?\/\//.test(href)) return href;
  return href.startsWith("/") ? href : `/${href}`;
}

function getRoutePath(href?: string) {
  return normalizeHref(href).replace(/^\/+/, "");
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

function toMenuItem(menu: OrgMenuItem): MenuItem {
  const extra = parseExtra((menu as OrgMenuItem & { description?: string }).description);
  const routePath = getRoutePath(menu.href);
  const type = normalizeMenuType(menu.type);

  return {
    id: menu.id,
    parentId: normalizeParentId(menu.parentId),
    name: menu.name,
    type,
    path: normalizeHref(menu.href),
    routeName: extra.routeName || `OrgMenu${menu.id}`,
    routePath,
    component: extra.iframeUrl
      ? "system/iframe/index"
      : extra.component || (type === "M" ? `${routePath}/index` : undefined),
    iframeUrl: extra.iframeUrl,
    redirect: extra.redirect,
    icon: menu.icon,
    sort: Number(menu.orderNum ?? 0),
    visible: extra.visible ?? 1,
    perm: extra.perm,
    keepAlive: extra.keepAlive ?? 1,
    hasChildren: type !== "B",
    children: menu.children?.map(toMenuItem),
  } as MenuItem & MenuForm;
}

function toOrgMenuForm(data: MenuForm) {
  const href = data.type === "B" || data.type === "BUTTON"
    ? ""
    : normalizeHref(data.routePath || data.path || data.name);
  return {
    parentId: toOrgParentId(data.parentId),
    name: data.name,
    type: data.type,
    href,
    icon: data.icon,
    orderNum: String(data.sort ?? 0),
    description: JSON.stringify({
      component: data.component,
      iframeUrl: data.iframeUrl,
      keepAlive: data.keepAlive,
      perm: data.perm,
      redirect: data.redirect,
      routeName: data.routeName,
      visible: data.visible ?? 1,
    } satisfies MenuExtra),
  };
}

async function getMenuTree(): Promise<OrgMenuItem[]> {
  return request<any, OrgMenuItem[]>({
    url: `${ORG_MENU_BASE_URL}/tree`,
    method: "get",
  });
}

function filterMenuTree(menus: MenuItem[], keywords?: string): MenuItem[] {
  const keyword = keywords?.trim();
  if (!keyword) return menus;

  return menus.reduce<MenuItem[]>((result, menu) => {
    const children = filterMenuTree(menu.children ?? [], keyword);
    if (menu.name?.includes(keyword) || children.length) {
      result.push({ ...menu, children });
    }
    return result;
  }, []);
}

function toOptions(menus: MenuItem[], onlyParent?: boolean): OptionItem[] {
  return menus
    .filter((menu) => !onlyParent || menu.type !== "B")
    .map((menu) => ({
      value: menu.id || "",
      label: menu.name || "",
      children: menu.children?.length ? toOptions(menu.children, onlyParent) : undefined,
    }));
}

const MenuAPI = {
  /** 获取当前用户的路由列表 */
  async getRoutes(userId: string) {
    const menus = await request<any, OrgMenuItem[]>({
      url: `${ORG_MENU_BASE_URL}/user/${userId}`,
      method: "get",
    });
    return toAuthorizedRoutes(menus);
  },
  /** 获取指定父菜单下的菜单列表 */
  getChildren(parentId?: string | number) {
    const id = parentId == null ? ROOT_PARENT_ID : String(parentId);
    return request<any, OrgMenuItem[]>({
      url: `${ORG_MENU_BASE_URL}/parent/${id}`,
      method: "get",
    }).then((menus) => menus.map(toMenuItem));
  },
  /** 获取菜单树形列表 */
  async getList(queryParams: MenuQueryParams = {}) {
    if (queryParams.keywords?.trim()) {
      const menus = (await getMenuTree()).map(toMenuItem);
      return filterMenuTree(menus, queryParams.keywords);
    }
    return this.getChildren(ROOT_PARENT_ID);
  },
  /** 获取菜单下拉数据源 */
  async getOptions(onlyParent?: boolean) {
    return toOptions((await getMenuTree()).map(toMenuItem), onlyParent);
  },
  /** 获取菜单表单数据 */
  getFormData(id: string) {
    return request<any, OrgMenuItem>({
      url: `${ORG_MENU_BASE_URL}/${id}`,
      method: "get",
    }).then((menu) => toMenuItem(menu) as MenuForm);
  },
  /** 新增菜单 */
  create(data: MenuForm) {
    return request({ url: `${ORG_MENU_BASE_URL}`, method: "post", data: toOrgMenuForm(data) });
  },
  /** 修改菜单 */
  update(id: string, data: MenuForm) {
    return request({ url: `${ORG_MENU_BASE_URL}/${id}`, method: "put", data: toOrgMenuForm(data) });
  },
  /** 删除菜单 */
  deleteById(id: string) {
    return request({ url: `${ORG_MENU_BASE_URL}/${id}`, method: "delete" });
  },
};

export default MenuAPI;
