/** 网关 API 资产。 */
export interface GatewayApiAsset {
  id: string;
  serviceId: string;
  operationId?: string;
  httpMethod: string;
  upstreamPath: string;
  summary?: string;
  sourceType?: string;
  discoveryStatus?: string;
  lastDiscoveredTime?: string;
}

/** 网关 API 资产分页结果。 */
export interface GatewayApiAssetPage {
  total: number;
  page: number;
  pageSize: number;
  apis: GatewayApiAsset[];
}

/** API 对外发布声明。 */
export interface GatewayApiPublication {
  id: string;
  apiId: string;
  externalPath: string;
  upstreamPath?: string;
  authMode: string;
  status: string;
  riskLevel: string;
  approvalStatus: string;
  publishedVersion?: string;
  lockVersion?: number;
}

export interface GatewayApiPublicationChange {
  externalPath: string;
  upstreamPath?: string;
  authMode: "PUBLIC" | "AUTHENTICATED" | "RESOURCE_REQUIRED";
  resourceId?: string;
  lockVersion?: number;
}

/** 应用级路由声明。 */
export interface GatewayApplicationRoute {
  id: string;
  serviceId: string;
  routeName: string;
  externalPath: string;
  targetUri: string;
  httpMethod?: string;
  rewritePath?: string;
  status: string;
  riskLevel: string;
  approvalStatus: string;
  publishedVersion?: string;
  lockVersion?: number;
}

export interface GatewayApplicationRouteChange {
  serviceId: string;
  routeName: string;
  externalPath: string;
  targetUri: string;
  httpMethod?: string;
  rewritePath?: string;
  lockVersion?: number;
}

export interface GatewayApiSyncResult {
  serviceId: string;
  discovered: number;
  created: number;
  updated: number;
  missing: number;
}

/** 当前 Nacos 网关配置的并发基线。 */
export interface GatewayRouteConfigSnapshot {
  version: string;
}

/** 网关发布预检结果。 */
export interface GatewayReleaseValidationResult {
  baseVersion: string;
  apiRouteCount: number;
  applicationRouteCount: number;
}

/** 网关正式发布结果。 */
export interface GatewayReleaseResult {
  releaseId: string;
  sourceVersion: string;
  targetVersion: string;
  apiCount: number;
  applicationRouteCount: number;
  status: "PUBLISHING" | "SUCCEEDED" | "PARTIALLY_APPLIED" | "FAILED" | "RECONCILIATION_REQUIRED";
}
