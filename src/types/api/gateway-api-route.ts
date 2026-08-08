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
  serviceId?: string;
  operationId?: string;
  httpMethod?: string;
  apiSummary?: string;
  externalPath: string;
  upstreamPath?: string;
  authMode: string;
  resourceId?: string;
  status: string;
  riskLevel: string;
  approvalStatus: string;
  publishedVersion?: string;
  filters?: GatewayRuntimeRouteDefinition[];
  lockVersion?: number;
}

export interface GatewayApiPublicationChange {
  externalPath: string;
  upstreamPath?: string;
  authMode: "PUBLIC" | "AUTHENTICATED" | "RESOURCE_REQUIRED";
  resourceId?: string;
  filters?: GatewayRuntimeRouteDefinition[];
  lockVersion?: number;
}

export type GatewayGovernancePolicyType = "RATE_LIMIT" | "TIMEOUT" | "CIRCUIT_BREAKER";
export type GatewayPolicyType = GatewayGovernancePolicyType | "ACCESS_CONTROL";
export type GatewayPolicyMode = "INHERIT" | "ENABLED" | "DISABLED";
export type GatewayPolicyScopeType = "GLOBAL" | "APPLICATION" | "API";

export interface GatewayAccessControlEntry {
  cidr: string;
  description?: string;
}

export interface GatewayAccessControlConfig {
  accessMode: "ALLOWLIST" | "DENYLIST";
  entries: GatewayAccessControlEntry[];
}

export interface GatewayPolicy {
  policyType: GatewayPolicyType;
  mode: GatewayPolicyMode;
  configJson?: string;
  lockVersion?: number;
}

export interface GatewayEffectivePolicy {
  policyType: GatewayPolicyType;
  effectiveMode: GatewayPolicyMode;
  effectiveConfig?: Record<string, any>;
  sourceScope?: "API" | "APPLICATION" | "GLOBAL";
}

export interface GatewayPolicyChange {
  mode: GatewayPolicyMode;
  rateLimit?: Record<string, any>;
  timeout?: Record<string, any>;
  circuitBreaker?: Record<string, any>;
  accessControl?: GatewayAccessControlConfig;
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
  routeOrder?: number;
  predicates?: GatewayRuntimeRouteDefinition[];
  filters?: GatewayRuntimeRouteDefinition[];
  status: string;
  riskLevel: string;
  approvalStatus: string;
  publishedVersion?: string;
  lockVersion?: number;
  /** 直接来自当前网关运行配置的兼容路由，只读展示。 */
  runtimeOnly?: boolean;
  sourceRouteId?: string;
}

export interface GatewayApplicationRouteChange {
  serviceId: string;
  routeName: string;
  externalPath: string;
  targetUri: string;
  httpMethod?: string;
  rewritePath?: string;
  routeOrder?: number;
  predicates?: GatewayRuntimeRouteDefinition[];
  filters?: GatewayRuntimeRouteDefinition[];
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
  routes?: GatewayRuntimeRoute[];
}

export interface GatewayRuntimeRouteDefinition {
  name: string;
  args: Record<string, string>;
}

export interface GatewayRuntimeRoute {
  id: string;
  uri: string;
  predicates?: GatewayRuntimeRouteDefinition[];
  filters?: GatewayRuntimeRouteDefinition[];
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
