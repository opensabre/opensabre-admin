import request from "@/utils/request";
import type { OnlineUserItem, OnlineUserQueryParams } from "@/types/api";

const ONLINE_USER_BASE_URL = "/auth/online-users";

const OnlineUserAPI = {
  list(queryParams?: OnlineUserQueryParams) {
    return request<any, OnlineUserItem[]>({
      url: ONLINE_USER_BASE_URL,
      method: "get",
      params: {
        username: queryParams?.username || undefined,
      },
    });
  },
  kickout(sessionId: string) {
    return request({
      url: `${ONLINE_USER_BASE_URL}/${sessionId}`,
      method: "delete",
    });
  },
};

export default OnlineUserAPI;
