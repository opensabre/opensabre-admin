import request from "@/utils/request";
import type {
  GatewayRouteChange,
  GatewayRouteConfig,
  GatewayRoutePublishResult,
  GatewayDefaultFilterChange,
} from "@/types/api";

const GATEWAY_ROUTE_BASE_URL = "/sysadmin/gateway/routes";

/** 网关路由管理 API。服务端负责 Nacos 的读取、CAS 发布与审计。 */
const GatewayRouteAPI = {
  getConfig() {
    return request<any, GatewayRouteConfig>({ url: GATEWAY_ROUTE_BASE_URL, method: "get" });
  },
  create(data: GatewayRouteChange) {
    return request<any, GatewayRoutePublishResult>({
      url: GATEWAY_ROUTE_BASE_URL,
      method: "post",
      data,
    });
  },
  update(routeId: string, data: GatewayRouteChange) {
    return request<any, GatewayRoutePublishResult>({
      url: `${GATEWAY_ROUTE_BASE_URL}/${encodeURIComponent(routeId)}`,
      method: "put",
      data,
    });
  },
  deleteById(routeId: string, baseVersion: string) {
    return request<any, GatewayRoutePublishResult>({
      url: `${GATEWAY_ROUTE_BASE_URL}/${encodeURIComponent(routeId)}`,
      method: "delete",
      data: { baseVersion },
    });
  },
  updateDefaultFilters(data: GatewayDefaultFilterChange) {
    return request<any, GatewayRouteConfig>({ url: `${GATEWAY_ROUTE_BASE_URL}/default-filters`, method: "put", data });
  },
};

export default GatewayRouteAPI;
