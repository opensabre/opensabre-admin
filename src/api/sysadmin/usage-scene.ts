import request from "@/utils/request";
import type { UsageSceneItem } from "@/types/api";

const BASE_URL = "/sysadmin/usage-scenes";
const UsageSceneAPI = {
  list: () => request<any, UsageSceneItem[]>({ url: BASE_URL, method: "get" }),
  create: (data: UsageSceneItem) => request({ url: BASE_URL, method: "post", data }),
  update: (data: UsageSceneItem) => request({ url: BASE_URL, method: "put", data }),
  remove: (params: Pick<UsageSceneItem, "objectType" | "objectId" | "usageEvent">) =>
    request({ url: BASE_URL, method: "delete", params }),
};
export default UsageSceneAPI;
