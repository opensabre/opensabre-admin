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
export type GatewayGlobalPolicyType = "SECURITY_HEADERS" | "DEFAULT_FILTERS" | "CORS";
export type GatewayAnyPolicyType = GatewayPolicyType | GatewayGlobalPolicyType;
export type GatewayPolicyMode = "INHERIT" | "ENABLED" | "DISABLED";
export type GatewayPolicyScopeType = "GLOBAL" | "APPLICATION" | "API";

export interface GatewayRateLimitConfig {
  keyType: "IP" | "API";
  replenishRate: number;
  burstCapacity: number;
  requestedTokens: number;
}

export interface GatewayTimeoutConfig {
  connectTimeoutMs: number;
  responseTimeoutMs: number;
}

export interface GatewayCircuitBreakerConfig {
  failureRateThreshold: number;
  slowCallRateThreshold: number;
  slowCallDurationThresholdMs: number;
  minimumNumberOfCalls: number;
  waitDurationInOpenStateMs: number;
  fallbackUri?: string;
}

export interface GatewayAccessControlEntry {
  cidr: string;
  description?: string;
}

export interface GatewayAccessControlConfig {
  accessMode: "ALLOWLIST" | "DENYLIST";
  entries: GatewayAccessControlEntry[];
}

export interface GatewayHeaderEntry {
  name: string;
  value: string;
}

export interface GatewaySecurityHeadersConfig {
  hstsEnabled: boolean;
  hstsMaxAgeSeconds: number;
  hstsIncludeSubDomains: boolean;
  hstsPreload: boolean;
  contentTypeOptions: boolean;
  frameOptions: "DENY" | "SAMEORIGIN" | "DISABLED";
  referrerPolicy:
    | "NO_REFERRER"
    | "SAME_ORIGIN"
    | "STRICT_ORIGIN"
    | "STRICT_ORIGIN_WHEN_CROSS_ORIGIN"
    | "DISABLED";
  contentSecurityPolicy?: string;
  requestHeaders: GatewayHeaderEntry[];
  responseHeaders: GatewayHeaderEntry[];
  removeRequestHeaders: string[];
  removeResponseHeaders: string[];
}

export interface GatewayDefaultFilterDraft {
  name: string;
  args: Record<string, string>;
  enabled: boolean;
}

export interface GatewayDefaultFiltersConfig {
  filters: GatewayDefaultFilterDraft[];
}

export interface GatewayCorsRule {
  pathPattern: string;
  allowedOrigins: string[];
  allowedOriginPatterns: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  allowCredentials: boolean;
  maxAgeSeconds: number;
}

export interface GatewayCorsConfig {
  rules: GatewayCorsRule[];
  addToSimpleUrlHandlerMapping: boolean;
}

export interface GatewayPolicy {
  policyType: GatewayAnyPolicyType;
  mode: GatewayPolicyMode;
  configJson?: string;
  lockVersion?: number;
}

export interface GatewayEffectivePolicy {
  policyType: GatewayAnyPolicyType;
  effectiveMode: GatewayPolicyMode;
  effectiveConfig?: Record<string, any>;
  sourceScope?: "API" | "APPLICATION" | "GLOBAL";
}

export interface GatewayPolicyChange {
  mode: GatewayPolicyMode;
  rateLimit?: GatewayRateLimitConfig;
  timeout?: GatewayTimeoutConfig;
  circuitBreaker?: GatewayCircuitBreakerConfig;
  accessControl?: GatewayAccessControlConfig;
  securityHeaders?: GatewaySecurityHeadersConfig;
  defaultFilters?: GatewayDefaultFiltersConfig;
  cors?: GatewayCorsConfig;
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
  defaultFilters?: GatewayRuntimeRouteDefinition[];
  globalCorsConfigurations?: Record<string, Record<string, any>>;
  corsAddToSimpleUrlHandlerMapping?: boolean;
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
