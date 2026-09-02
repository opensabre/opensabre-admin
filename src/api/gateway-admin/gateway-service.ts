import request from "@/utils/request";
import type {
  ApplicationInstanceActuator,
  ApplicationMetricsSnapshot,
  GatewayServicePage,
} from "@/types/api/gateway-service";

const BASE_URL = "/gateway-admin/services";

/** 独立网关控制面的只读服务目录接口。 */
const GatewayServiceAPI = {
  list(params: { page: number; pageSize: number }) {
    return request<any, GatewayServicePage>({ url: BASE_URL, method: "get", params });
  },
  getApplicationMetrics() {
    return request<any, ApplicationMetricsSnapshot>({
      url: "/gateway-admin/monitoring/applications",
      method: "get",
    });
  },
  getActuatorMetrics(params: { page: number; pageSize: number }) {
    return request<any, ApplicationInstanceActuator[]>({
      url: "/gateway-admin/monitoring/actuator",
      method: "get",
      params,
    });
  },
};

export default GatewayServiceAPI;
