import request from "@/utils/request";
import type { OptionItem, ResourceForm, ResourceItem, ResourceQueryParams } from "@/types/api";

const ORG_RESOURCE_BASE_URL = "/org/resource";

interface OrgPage<T> {
  records?: T[];
  current?: number;
  size?: number;
  total?: number;
}

function toOrgResourceQuery(queryParams?: ResourceQueryParams) {
  return {
    current: queryParams?.pageNum ?? 1,
    size: queryParams?.pageSize ?? 10,
    name: queryParams?.name || undefined,
    code: queryParams?.code || undefined,
    url: queryParams?.url || undefined,
    method: queryParams?.method || undefined,
  };
}

function toResourceForm(resource: ResourceItem): ResourceForm {
  return {
    id: resource.id,
    name: resource.name,
    code: resource.code,
    type: resource.type,
    url: resource.url,
    method: resource.method,
    description: resource.description,
  };
}

const ResourceAPI = {
  /** 获取资源分页数据 */
  getPage(queryParams?: ResourceQueryParams) {
    const fallbackQuery = queryParams ?? { pageNum: 1, pageSize: 10 };
    return request<any, OrgPage<ResourceItem>>({
      url: `${ORG_RESOURCE_BASE_URL}/conditions`,
      method: "post",
      data: toOrgResourceQuery(queryParams),
    }).then((page) => ({
      data: page.records ?? [],
      page: {
        pageNum: page.current ?? fallbackQuery.pageNum,
        pageSize: page.size ?? fallbackQuery.pageSize,
        total: page.total ?? 0,
      },
    }));
  },
  /** 获取资源下拉数据源 */
  getOptions() {
    return request<any, ResourceItem[]>({
      url: `${ORG_RESOURCE_BASE_URL}/all`,
      method: "get",
    }).then((resources) =>
      resources.map<OptionItem>((resource) => ({
        value: resource.id || "",
        label: `${resource.name || resource.code || ""}（${resource.method || "-"} ${
          resource.url || ""
        }）`,
      }))
    );
  },
  /** 获取资源表单数据 */
  getFormData(id: string) {
    return request<any, ResourceItem>({
      url: `${ORG_RESOURCE_BASE_URL}/${id}`,
      method: "get",
    }).then(toResourceForm);
  },
  /** 新增资源 */
  create(data: ResourceForm) {
    return request({ url: `${ORG_RESOURCE_BASE_URL}`, method: "post", data });
  },
  /** 更新资源 */
  update(id: string, data: ResourceForm) {
    return request({ url: `${ORG_RESOURCE_BASE_URL}/${id}`, method: "put", data });
  },
  /** 批量删除资源，多个以英文逗号(,)分割 */
  deleteByIds(ids: string) {
    return Promise.all(
      ids
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .map((id) => request({ url: `${ORG_RESOURCE_BASE_URL}/${id}`, method: "delete" }))
    );
  },
};

export default ResourceAPI;
