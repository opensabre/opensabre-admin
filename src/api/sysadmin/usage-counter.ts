import request from "@/utils/request";
import type {
  UsageBatchSummaryQuery,
  UsageObjectSummary,
  UsageRankingItem,
  UsageSummary,
  UsageTrendItem,
  UsageTrendQuery,
} from "@/types/api";

const BASE_URL = "/sysadmin/usage-counters";

/** 对象使用量统计接口。 */
const UsageCounterAPI = {
  getTrend(params: UsageTrendQuery) {
    return request<any, UsageTrendItem[]>({ url: `${BASE_URL}/trend`, method: "get", params });
  },
  getSummary(params: Omit<UsageTrendQuery, "granularity">) {
    return request<any, UsageSummary>({ url: `${BASE_URL}/summary`, method: "get", params });
  },
  getSummaries(data: UsageBatchSummaryQuery) {
    return request<any, UsageObjectSummary[]>({
      url: `${BASE_URL}/summaries`,
      method: "post",
      data,
    });
  },
  getRanking(params: Omit<UsageTrendQuery, "granularity" | "objectId"> & { limit?: number }) {
    return request<any, UsageRankingItem[]>({ url: `${BASE_URL}/ranking`, method: "get", params });
  },
};

export default UsageCounterAPI;
