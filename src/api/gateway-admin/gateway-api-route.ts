import request from "@/utils/request";
import type {
  GatewayApiAssetPage,
  GatewayApiPublicationChange,
  GatewayApiSyncResult,
  GatewayApiPublication,
  GatewayApplicationRoute,
  GatewayApplicationRouteChange,
  GatewayReleaseResult,
  GatewayReleaseValidationResult,
  GatewayRouteConfigSnapshot,
  GatewayRuntimeRoute,
  GatewayPolicy,
  GatewayPolicyChange,
  GatewayAnyPolicyType,
  GatewayPolicyType,
  GatewayEffectivePolicy,
  GatewayPolicyScopeType,
  GatewayRelease,
  GatewayReleaseDetail,
  GatewayInstanceVerification,
  GatewayInstanceRuntime,
  GatewayRouteMetricsSnapshot,
} from "@/types/api/gateway-api-route";

const BASE_URL = "/gateway-admin";

function definitionArg(
  route: GatewayRuntimeRoute,
  collection: "predicates" | "filters",
  name: string,
  ...keys: string[]
) {
  const args = route[collection]?.find((item) => item.name === name)?.args;
  if (!args) return undefined;
  if (name === "Path") {
    const patterns = Object.entries(args)
      .map(([key, value]) => {
        const match = /^patterns\.(\d+)$/.exec(key);
        return match ? { index: Number(match[1]), value } : undefined;
      })
      .filter((item): item is { index: number; value: string } => Boolean(item))
      .sort((left, right) => left.index - right.index)
      .map((item) => item.value)
      .filter(Boolean);
    if (patterns.length) return patterns.join(",");
  }
  return keys.map((key) => args[key]).find(Boolean) || Object.values(args)[0];
}

/**
 * 将旧显式路由合并到应用级路由视图。旧路由仍以 Nacos 为事实源，避免在迁移完成前
 * 因新控制面表为空而从管理端消失。
 */
export function mergeApplicationRouteViews(
  managedRoutes: GatewayApplicationRoute[],
  runtimeConfig: GatewayRouteConfigSnapshot
): GatewayApplicationRoute[] {
  const managedRuntimeIds = new Set(managedRoutes.map((route) => `application-${route.id}`));
  const runtimeRoutes = (runtimeConfig.routes || [])
    .filter((route) => !route.id.startsWith("api-") && !managedRuntimeIds.has(route.id))
    .map((route) => {
      const externalPath = definitionArg(route, "predicates", "Path", "pattern", "patterns") || "";
      const httpMethod = definitionArg(route, "predicates", "Method", "method", "methods");
      const regexp = definitionArg(route, "filters", "RewritePath", "regexp");
      const replacement = definitionArg(route, "filters", "RewritePath", "replacement");
      const broadPath = externalPath.includes("**") || !httpMethod;
      return {
        id: `runtime:${route.id}`,
        sourceRouteId: route.id,
        serviceId: route.uri.startsWith("lb://") ? route.uri.slice(5) : route.id,
        routeName: route.id,
        externalPath,
        targetUri: route.uri,
        httpMethod,
        rewritePath: regexp && replacement ? `${regexp}=>${replacement}` : undefined,
        predicates: route.predicates || [],
        filters: route.filters || [],
        status: "PUBLISHED",
        riskLevel: broadPath ? "HIGH" : externalPath.includes("*") ? "MEDIUM" : "LOW",
        approvalStatus: "NOT_REQUIRED",
        runtimeOnly: true,
      };
    });
  return [...managedRoutes, ...runtimeRoutes];
}

/** API 级网关路由管理接口。 */
const GatewayApiRouteAPI = {
  listApis(params?: { serviceId?: string; status?: string; page?: number; pageSize?: number }) {
    return request<any, GatewayApiAssetPage>({
      url: `${BASE_URL}/apis`,
      method: "get",
      params,
    });
  },
  syncApis(serviceId: string) {
    return request<any, GatewayApiSyncResult>({
      url: `${BASE_URL}/services/${encodeURIComponent(serviceId)}/apis/sync`,
      method: "post",
    });
  },
  listPublications() {
    return request<any, GatewayApiPublication[]>({
      url: `${BASE_URL}/api-publications`,
      method: "get",
    });
  },
  listApplicationRoutes() {
    return request<any, GatewayApplicationRoute[]>({
      url: `${BASE_URL}/application-routes`,
      method: "get",
    });
  },
  getCurrentConfig() {
    return request<any, GatewayRouteConfigSnapshot>({
      url: `${BASE_URL}/routes`,
      method: "get",
    });
  },
  validateRelease(baseVersion: string) {
    return request<any, GatewayReleaseValidationResult>({
      url: `${BASE_URL}/releases/validate`,
      method: "post",
      data: { baseVersion },
    });
  },
  publishRelease(baseVersion: string) {
    return request<any, GatewayReleaseResult>({
      url: `${BASE_URL}/releases`,
      method: "post",
      data: { baseVersion },
    });
  },
  listReleases() {
    return request<any, GatewayRelease[]>({ url: `${BASE_URL}/releases`, method: "get" });
  },
  getRelease(id: string) {
    return request<any, GatewayReleaseDetail>({
      url: `${BASE_URL}/releases/${encodeURIComponent(id)}`,
      method: "get",
    });
  },
  rollbackRelease(id: string, baseVersion: string) {
    return request<any, GatewayReleaseResult>({
      url: `${BASE_URL}/releases/${encodeURIComponent(id)}/rollback`,
      method: "post",
      data: { baseVersion },
    });
  },
  verifyReleaseInstances(id: string) {
    return request<any, GatewayInstanceVerification>({
      url: `${BASE_URL}/releases/${encodeURIComponent(id)}/verify-instances`,
      method: "post",
    });
  },
  getRouteMetrics() {
    return request<any, GatewayRouteMetricsSnapshot>({
      url: `${BASE_URL}/monitoring/routes`,
      method: "get",
    });
  },
  getRuntimeSnapshots() {
    return request<any, GatewayInstanceRuntime[]>({
      url: `${BASE_URL}/monitoring/runtime`,
      method: "get",
    });
  },
  savePublication(apiId: string, data: GatewayApiPublicationChange) {
    return request<any, GatewayApiPublication>({
      url: `${BASE_URL}/apis/${encodeURIComponent(apiId)}/publication`,
      method: "put",
      data,
    });
  },
  offlineApi(apiId: string, lockVersion: number) {
    return request<any, GatewayApiPublication>({
      url: `${BASE_URL}/apis/${encodeURIComponent(apiId)}/offline`,
      method: "post",
      data: { lockVersion },
    });
  },
  listApiPolicies(apiId: string) {
    return request<any, GatewayPolicy[]>({
      url: `${BASE_URL}/policies`,
      method: "get",
      params: { scopeType: "API", scopeId: apiId },
    });
  },
  getEffectivePolicy(policyType: GatewayPolicyType, serviceId?: string, apiId?: string) {
    return request<any, GatewayEffectivePolicy>({
      url: `${BASE_URL}/policies/effective`,
      method: "get",
      params: { policyType, serviceId, apiId },
    });
  },
  saveApiPolicy(apiId: string, policyType: GatewayPolicyType, data: GatewayPolicyChange) {
    return request<any, GatewayPolicy>({
      url: `${BASE_URL}/policies`,
      method: "put",
      params: { scopeType: "API", scopeId: apiId, policyType },
      data,
    });
  },
  listPolicies(scopeType: GatewayPolicyScopeType, scopeId?: string) {
    return request<any, GatewayPolicy[]>({
      url: `${BASE_URL}/policies`,
      method: "get",
      params: { scopeType, scopeId },
    });
  },
  savePolicy(
    scopeType: GatewayPolicyScopeType,
    scopeId: string | undefined,
    policyType: GatewayAnyPolicyType,
    data: GatewayPolicyChange
  ) {
    return request<any, GatewayPolicy>({
      url: `${BASE_URL}/policies`,
      method: "put",
      params: { scopeType, scopeId, policyType },
      data,
    });
  },
  createApplicationRoute(data: GatewayApplicationRouteChange) {
    return request<any, GatewayApplicationRoute>({
      url: `${BASE_URL}/application-routes`,
      method: "post",
      data,
    });
  },
  adoptLegacyRoute(routeId: string, baseVersion: string) {
    return request<any, GatewayApplicationRoute>({
      url: `${BASE_URL}/application-routes/adopt`,
      method: "post",
      data: { routeId, baseVersion },
    });
  },
  updateApplicationRoute(id: string, data: GatewayApplicationRouteChange) {
    return request<any, GatewayApplicationRoute>({
      url: `${BASE_URL}/application-routes/${encodeURIComponent(id)}`,
      method: "put",
      data,
    });
  },
  offlineApplicationRoute(id: string, lockVersion: number) {
    return request<any, GatewayApplicationRoute>({
      url: `${BASE_URL}/application-routes/${encodeURIComponent(id)}/offline`,
      method: "post",
      data: { lockVersion },
    });
  },
};

export default GatewayApiRouteAPI;
