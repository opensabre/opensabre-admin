import request from "@/utils/request";
import type { DeptQueryParams, DeptItem, DeptForm, OptionItem } from "@/types/api";

const ORG_GROUP_BASE_URL = "/org/group";
const ROOT_PARENT_ID = "-1";

interface GroupExtra {
  code?: string;
  sort?: number;
  status?: number;
}

interface OrgGroup {
  children?: OrgGroup[];
  description?: string;
  id?: string;
  name?: string;
  parentId?: string;
}

function toOrgParentId(parentId?: string) {
  return parentId || ROOT_PARENT_ID;
}

function parseExtra(description?: string): GroupExtra {
  if (!description) return {};
  try {
    const parsed = JSON.parse(description) as GroupExtra;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function toDeptItem(group: OrgGroup): DeptItem {
  const extra = parseExtra(group.description);
  return {
    id: group.id,
    code: extra.code,
    hasChildren: true,
    name: group.name,
    parentId: group.parentId,
    sort: extra.sort ?? 1,
    status: extra.status ?? 1,
    children: group.children?.map(toDeptItem),
  };
}

function toDeptForm(group: OrgGroup): DeptForm {
  const extra = parseExtra(group.description);
  return {
    id: group.id,
    code: extra.code,
    name: group.name,
    parentId: group.parentId,
    sort: extra.sort ?? 1,
    status: extra.status ?? 1,
  };
}

function toOrgGroupForm(data: DeptForm) {
  return {
    parentId: toOrgParentId(data.parentId),
    name: data.name,
    description: JSON.stringify({
      code: data.code,
      sort: data.sort ?? 1,
      status: data.status ?? 1,
    } satisfies GroupExtra),
  };
}

function toOption(group: OrgGroup): OptionItem {
  return {
    value: group.id || "",
    label: group.name || "",
  } as OptionItem & { isLeaf?: boolean };
}

function toTreeParentId(parentId?: string | number) {
  return toOrgParentId(parentId == null ? undefined : String(parentId));
}

function filterDeptTree(depts: DeptItem[], keywords?: string): DeptItem[] {
  const keyword = keywords?.trim();
  if (!keyword) return depts;

  return depts.reduce<DeptItem[]>((result, dept) => {
    const children = filterDeptTree(dept.children ?? [], keyword);
    if (dept.name?.includes(keyword) || children.length) {
      result.push({ ...dept, children });
    }
    return result;
  }, []);
}

const DeptAPI = {
  /** 获取指定父节点下的组织列表 */
  getChildren(parentId?: string | number) {
    return request<any, OrgGroup[]>({
      url: `${ORG_GROUP_BASE_URL}/parent/${toTreeParentId(parentId)}`,
      method: "get",
    }).then((groups) => groups.map(toDeptItem));
  },
  /** 获取指定父节点下的组织下拉列表 */
  getOptionChildren(parentId?: string | number) {
    return request<any, OrgGroup[]>({
      url: `${ORG_GROUP_BASE_URL}/parent/${toTreeParentId(parentId)}`,
      method: "get",
    }).then((groups) => groups.map(toOption));
  },
  /** 获取部门树形列表 */
  async getList(queryParams?: DeptQueryParams) {
    if (queryParams?.keywords?.trim()) {
      return request<any, OrgGroup[]>({
        url: `${ORG_GROUP_BASE_URL}/conditions`,
        method: "post",
        data: { name: queryParams.keywords.trim() },
      }).then((groups) => filterDeptTree(groups.map(toDeptItem), queryParams.keywords));
    }
    return this.getChildren(ROOT_PARENT_ID);
  },
  /** 获取部门下拉数据源 */
  async getOptions(parentId?: string | number) {
    return this.getOptionChildren(parentId ?? ROOT_PARENT_ID);
  },
  /** 获取部门表单数据 */
  getFormData(id: string) {
    return request<any, OrgGroup>({ url: `${ORG_GROUP_BASE_URL}/${id}`, method: "get" }).then(
      toDeptForm
    );
  },
  /** 新增部门 */
  create(data: DeptForm) {
    return request({ url: `${ORG_GROUP_BASE_URL}`, method: "post", data: toOrgGroupForm(data) });
  },
  /** 修改部门 */
  update(id: string, data: DeptForm) {
    return request({
      url: `${ORG_GROUP_BASE_URL}/${id}`,
      method: "put",
      data: toOrgGroupForm(data),
    });
  },
  /** 批量删除部门，多个以英文逗号(,)分割 */
  deleteByIds(ids: string) {
    return Promise.all(
      ids
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .map((id) => request({ url: `${ORG_GROUP_BASE_URL}/${id}`, method: "delete" }))
    );
  },
};

export default DeptAPI;
