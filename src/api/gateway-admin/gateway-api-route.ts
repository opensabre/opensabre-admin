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
  GatewayPolicyType,
  GatewayEffectivePolicy,
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
  savePublication(apiId: string, data: GatewayApiPublicationChange) {
    return request<any, GatewayApiPublication>({
      url: `${BASE_URL}/apis/${encodeURIComponent(apiId)}/publication`,
      method: "put",
      data,
    });
  },
  listApiPolicies(apiId: string) {
    return request<any, GatewayPolicy[]>({
      url: `${BASE_URL}/policies`,
      method: "get",
      params: { scopeType: "API", scopeId: apiId },
    });
  },
  getEffectivePolicy(policyType: GatewayPolicyType, serviceId: string, apiId: string) {
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
  createApplicationRoute(data: GatewayApplicationRouteChange) {
    return request<any, GatewayApplicationRoute>({
      url: `${BASE_URL}/application-routes`,
      method: "post",
      data,
    });
  },
  updateApplicationRoute(id: string, data: GatewayApplicationRouteChange) {
    return request<any, GatewayApplicationRoute>({
      url: `${BASE_URL}/application-routes/${encodeURIComponent(id)}`,
      method: "put",
      data,
    });
  },
};

export default GatewayApiRouteAPI;
