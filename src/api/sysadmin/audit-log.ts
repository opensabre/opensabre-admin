import request from "@/utils/request";
import type { AuditLogItem, AuditLogQueryParams } from "@/types/api";

const AUDIT_LOG_BASE_URL = "/sysadmin/audit/log";

interface OrgPage<T> {
  records?: T[];
  current?: number;
  size?: number;
  total?: number;
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
    operationStartTime: queryParams?.operationTimeRange?.[0] || undefined,
    operationEndTime: queryParams?.operationTimeRange?.[1] || undefined,
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
