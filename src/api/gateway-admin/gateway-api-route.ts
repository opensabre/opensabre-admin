import request from "@/utils/request";
import type {
  GatewayApiAsset,
  GatewayApiPublication,
  GatewayApplicationRoute,
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
};

export default GatewayApiRouteAPI;
