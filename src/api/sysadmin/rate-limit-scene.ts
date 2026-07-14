import request from "@/utils/request";
import type { RateLimitSceneItem, RateLimitScenePayload } from "@/types/api";

const RATE_LIMIT_SCENE_BASE_URL = "/sysadmin/ratelimit/scenes";

/** 限次场景管理接口。 */
const RateLimitSceneAPI = {
  getList() {
    return request<any, RateLimitSceneItem[]>({ url: RATE_LIMIT_SCENE_BASE_URL, method: "get" });
  },
  getFormData(sceneCode: string) {
    return request<any, RateLimitSceneItem>({
      url: `${RATE_LIMIT_SCENE_BASE_URL}/${sceneCode}`,
      method: "get",
    });
  },
  create(data: RateLimitScenePayload) {
    return request({ url: RATE_LIMIT_SCENE_BASE_URL, method: "post", data });
  },
  update(sceneCode: string, data: RateLimitScenePayload) {
    return request({ url: `${RATE_LIMIT_SCENE_BASE_URL}/${sceneCode}`, method: "put", data });
  },
  delete(sceneCode: string) {
    return request({ url: `${RATE_LIMIT_SCENE_BASE_URL}/${sceneCode}`, method: "delete" });
  },
};

export default RateLimitSceneAPI;
