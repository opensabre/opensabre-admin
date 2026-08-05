import request from "@/utils/request";
import type {
  GatewayApiAsset,
  GatewayApiAssetPage,
  GatewayApiPublicationChange,
  GatewayApiSyncResult,
  GatewayApiPublication,
  GatewayApplicationRoute,
  GatewayApplicationRouteChange,
  GatewayReleaseResult,
  GatewayReleaseValidationResult,
  GatewayRouteConfigSnapshot,
} from "@/types/api/gateway-api-route";

const BASE_URL = "/gateway-admin";

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
