import request from "@/utils/request";
import type { PageResult, UsageSceneItem } from "@/types/api";

const BASE_URL = "/sysadmin/usage-scenes";
const UsageSceneAPI = {
  list: (params: {
    pageNum: number;
    pageSize: number;
    keywords?: string;
    enabled?: boolean | "";
  }) => request<any, PageResult<UsageSceneItem>>({ url: BASE_URL, method: "get", params }),
  create: (data: UsageSceneItem) => request({ url: BASE_URL, method: "post", data }),
  update: (data: UsageSceneItem) => request({ url: BASE_URL, method: "put", data }),
  remove: (params: Pick<UsageSceneItem, "objectType" | "objectId" | "usageEvent">) =>
    request({ url: BASE_URL, method: "delete", params }),
};
export default UsageSceneAPI;
