/**
 * 审计日志类型定义
 */

import type { BaseQueryParams } from "./common";

/** 审计日志分页查询参数 */
export interface AuditLogQueryParams extends BaseQueryParams {
  operationType?: string;
  operationTimeRange?: [string, string];
  operatorUsername?: string;
  module?: string;
  clientIp?: string;
  targetKey?: string;
}

/** 审计日志列表对象 */
export interface AuditLogItem {
  id?: string;
  operationType?: string;
  operationTime?: string;
  operatorUsername?: string;
  description?: string;
  module?: string;
  clientIp?: string;
  userAgent?: string;
  requestMethod?: string;
  requestUrl?: string;
  request?: string;
  response?: string;
  errorMessage?: string;
  executionTime?: number;
  targetKey?: string;
}
