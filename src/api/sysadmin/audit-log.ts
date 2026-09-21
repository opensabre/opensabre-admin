import request from "@/utils/request";
import type { AuditLogItem, AuditLogQueryParams } from "@/types/api";

const AUDIT_LOG_BASE_URL = "/sysadmin/audit/log";

interface OrgPage<T> {
  records?: T[];
  current?: number;
  size?: number;
  total?: number;
}

function normalizeRangeBoundary(value: string | undefined, endOfDay = false) {
  if (!value || value.length !== 10) return value || undefined;
  return `${value} ${endOfDay ? "23:59:59" : "00:00:00"}`;
}

function toQuery(queryParams?: AuditLogQueryParams) {
  return {
    current: queryParams?.pageNum ?? 1,
    size: queryParams?.pageSize ?? 10,
    operationType: queryParams?.operationType || undefined,
    operatorUsername: queryParams?.operatorUsername || undefined,
    module: queryParams?.module || undefined,
    clientIp: queryParams?.clientIp || undefined,
    targetKey: queryParams?.targetKey || undefined,
    operationStartTime: normalizeRangeBoundary(queryParams?.operationTimeRange?.[0]),
    operationEndTime: normalizeRangeBoundary(queryParams?.operationTimeRange?.[1], true),
  };
}

const AuditLogAPI = {
  getPage(queryParams?: AuditLogQueryParams) {
    const fallbackQuery = queryParams ?? { pageNum: 1, pageSize: 10 };
    return request<any, OrgPage<AuditLogItem>>({
      url: `${AUDIT_LOG_BASE_URL}/conditions`,
      method: "post",
      data: toQuery(queryParams),
    }).then((page) => ({
      data: page.records ?? [],
      page: {
        pageNum: page.current ?? fallbackQuery.pageNum,
        pageSize: page.size ?? fallbackQuery.pageSize,
        total: page.total ?? 0,
      },
    }));
  },
  getFormData(id: string) {
    return request<any, AuditLogItem>({ url: `${AUDIT_LOG_BASE_URL}/${id}`, method: "get" });
  },
  cleanExpiredLogs(days: number) {
    return request({ url: `${AUDIT_LOG_BASE_URL}/clean/${days}`, method: "delete" });
  },
};

export default AuditLogAPI;
