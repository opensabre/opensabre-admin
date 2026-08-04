import request from "@/utils/request";
import type {
  GatewayApiAsset,
  GatewayApiPublicationChange,
  GatewayApiSyncResult,
  GatewayApiPublication,
  GatewayApplicationRoute,
  GatewayApplicationRouteChange,
} from "@/types/api/gateway-api-route";

const BASE_URL = "/gateway-admin";

/** API 级网关路由管理接口。 */
const GatewayApiRouteAPI = {
  listApis(params?: { serviceId?: string; status?: string }) {
    return request<any, GatewayApiAsset[]>({
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
