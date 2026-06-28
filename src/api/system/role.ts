import request from "@/utils/request";
import type { RoleQueryParams, RoleItem, RoleForm } from "@/types/api";

const ORG_ROLE_BASE_URL = "/api/org/role";

interface OrgRole {
  code?: string;
  description?: string;
  id?: string;
  name?: string;
  resourceIds?: Array<number | string> | Set<number | string>;
}

interface OrgPage<T> {
  records?: T[];
  current?: number;
  size?: number;
  total?: number;
}

function toRoleItem(role: OrgRole): RoleItem {
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    status: 1,
    sort: 1,
  };
}

function toRoleForm(role: OrgRole): RoleForm {
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    remark: role.description,
    status: 1,
    sort: 1,
  };
}

function toOrgRoleForm(data: RoleForm) {
  return {
    code: data.code,
    name: data.name,
    description: data.remark,
  };
}

function toOrgRoleQuery(queryParams?: RoleQueryParams) {
  return {
    current: queryParams?.pageNum ?? 1,
    size: queryParams?.pageSize ?? 10,
    name: queryParams?.keywords || undefined,
  };
}

const RoleAPI = {
  /** 获取角色分页数据 */
  getPage(queryParams?: RoleQueryParams) {
    const fallbackQuery = queryParams ?? { pageNum: 1, pageSize: 10 };
    return request<any, OrgPage<OrgRole>>({
      url: `${ORG_ROLE_BASE_URL}/conditions`,
      method: "post",
      data: toOrgRoleQuery(queryParams),
    }).then((page) => ({
      data: (page.records ?? []).map(toRoleItem),
      page: {
        pageNum: page.current ?? fallbackQuery.pageNum,
        pageSize: page.size ?? fallbackQuery.pageSize,
        total: page.total ?? 0,
      },
    }));
  },
  /** 获取角色下拉数据源 */
  getOptions() {
    return request<any, OrgRole[]>({ url: `${ORG_ROLE_BASE_URL}/all`, method: "get" }).then(
      (roles) =>
        roles.map((role) => ({
          value: role.id || "",
          label: role.name || role.code || "",
        }))
    );
  },
  /** 获取角色的菜单ID集合 */
  getRoleMenuIds(roleId: string) {
    return request<any, string[]>({ url: `${ORG_ROLE_BASE_URL}/${roleId}/menuIds`, method: "get" });
  },
  /** 分配菜单权限 */
  updateRoleMenus(roleId: string, data: Array<number | string>) {
    return request({
      url: `${ORG_ROLE_BASE_URL}/${roleId}/menus`,
      method: "put",
      data: data.map(String),
    });
  },
  /** 获取角色的资源ID集合 */
  getRoleResourceIds(roleId: string) {
    return request<any, string[]>({
      url: `${ORG_ROLE_BASE_URL}/${roleId}/resourceIds`,
      method: "get",
    });
  },
  /** 分配功能资源 */
  updateRoleResources(roleId: string, data: Array<number | string>) {
    return request({
      url: `${ORG_ROLE_BASE_URL}/${roleId}/resources`,
      method: "put",
      data: data.map(String),
    });
  },
  /** 获取角色表单数据 */
  getFormData(id: string) {
    return request<any, OrgRole>({ url: `${ORG_ROLE_BASE_URL}/${id}`, method: "get" }).then(
      toRoleForm
    );
  },
  /** 新增角色 */
  create(data: RoleForm) {
    return request({ url: `${ORG_ROLE_BASE_URL}`, method: "post", data: toOrgRoleForm(data) });
  },
  /** 更新角色 */
  update(id: string, data: RoleForm) {
    return request({ url: `${ORG_ROLE_BASE_URL}/${id}`, method: "put", data: toOrgRoleForm(data) });
  },
  /** 批量删除角色，多个以英文逗号(,)分割 */
  deleteByIds(ids: string) {
    return Promise.all(
      ids
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .map((id) => request({ url: `${ORG_ROLE_BASE_URL}/${id}`, method: "delete" }))
    );
  },
};

export default RoleAPI;
