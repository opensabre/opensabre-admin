import request from "@/utils/request";
import type { MenuQueryParams, MenuItem, MenuForm, RouteItem, OptionItem } from "@/types/api";
import { toRouteItems, type OrgMenuItem } from "./menu-adapter";

const MENU_BASE_URL = "/api/v1/menus";
const ORG_MENU_BASE_URL = "/api/org/menu";
const ORG_ROOT_PARENT_ID = "-1";

const MenuAPI = {
  /** 获取当前用户的路由列表 */
  async getRoutes() {
    const menus = await fetchOrgMenuTree();
    return toRouteItems(menus);
  },
  /** 获取菜单树形列表 */
  getList(queryParams: MenuQueryParams) {
    return request<any, MenuItem[]>({
      url: `${MENU_BASE_URL}`,
      method: "get",
      params: queryParams,
    });
  },
  /** 获取菜单下拉数据源 */
  getOptions(onlyParent?: boolean) {
    return request<any, OptionItem[]>({
      url: `${MENU_BASE_URL}/options`,
      method: "get",
      params: { onlyParent },
    });
  },
  /** 获取菜单表单数据 */
  getFormData(id: string) {
    return request<any, MenuForm>({ url: `${MENU_BASE_URL}/${id}/form`, method: "get" });
  },
  /** 新增菜单 */
  create(data: MenuForm) {
    return request({ url: `${MENU_BASE_URL}`, method: "post", data });
  },
  /** 修改菜单 */
  update(id: string, data: MenuForm) {
    return request({ url: `${MENU_BASE_URL}/${id}`, method: "put", data });
  },
  /** 删除菜单 */
  deleteById(id: string) {
    return request({ url: `${MENU_BASE_URL}/${id}`, method: "delete" });
  },
};

export default MenuAPI;

async function fetchOrgMenuTree(parentId: string = ORG_ROOT_PARENT_ID): Promise<OrgMenuItem[]> {
  const menus = await request<any, OrgMenuItem[]>({
    url: `${ORG_MENU_BASE_URL}/parent/${parentId}`,
    method: "get",
  });

  const sortedMenus = [...menus].sort((a, b) => (a.orderNum ?? 0) - (b.orderNum ?? 0));

  return Promise.all(
    sortedMenus.map(async (menu) => ({
      ...menu,
      children: await fetchOrgMenuTree(menu.id),
    }))
  );
}
