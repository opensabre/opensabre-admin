import request from "@/utils/request";
import type { PositionForm, PositionItem, PositionQueryParams } from "@/types/api";

const ORG_POSITION_BASE_URL = "/org/position";

const PositionAPI = {
  /** 获取岗位列表 */
  getList(queryParams?: PositionQueryParams) {
    return request<any, PositionItem[]>({
      url: ORG_POSITION_BASE_URL,
      method: "get",
      params: { name: queryParams?.name ?? "" },
    });
  },
  /** 获取岗位表单数据 */
  getFormData(id: string) {
    return request<any, PositionItem>({
      url: `${ORG_POSITION_BASE_URL}/${id}`,
      method: "get",
    }).then((position) => ({
      id: position.id,
      name: position.name,
      description: position.description,
    }));
  },
  /** 新增岗位 */
  create(data: PositionForm) {
    return request({ url: ORG_POSITION_BASE_URL, method: "post", data });
  },
  /** 更新岗位 */
  update(id: string, data: PositionForm) {
    return request({ url: `${ORG_POSITION_BASE_URL}/${id}`, method: "put", data });
  },
  /** 批量删除岗位，多个以英文逗号(,)分割 */
  deleteByIds(ids: string) {
    return Promise.all(
      ids
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .map((id) => request({ url: `${ORG_POSITION_BASE_URL}/${id}`, method: "delete" }))
    );
  },
};

export default PositionAPI;
