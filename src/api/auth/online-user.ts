import request from "@/utils/request";
import type { OnlineUserItem, OnlineUserQueryParams } from "@/types/api";

const ONLINE_USER_BASE_URL = "/auth/online-users";

const OnlineUserAPI = {
  list(queryParams?: OnlineUserQueryParams) {
    const query = queryParams ?? { pageNum: 1, pageSize: 10 };
    return request<
      any,
      { records?: OnlineUserItem[]; current?: number; size?: number; total?: number }
    >({
      url: ONLINE_USER_BASE_URL,
      method: "get",
      params: {
        pageNum: query.pageNum,
        pageSize: query.pageSize,
        username: query.username || undefined,
      },
    }).then((page) => ({
      data: page.records ?? [],
      page: {
        pageNum: page.current ?? query.pageNum,
        pageSize: page.size ?? query.pageSize,
        total: page.total ?? 0,
      },
    }));
  },
  kickout(sessionId: string) {
    return request({
      url: `${ONLINE_USER_BASE_URL}/${sessionId}`,
      method: "delete",
    });
  },
};

export default OnlineUserAPI;
