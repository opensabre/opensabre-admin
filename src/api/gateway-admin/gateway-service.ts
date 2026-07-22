import request from "@/utils/request";
import type { GatewayServicePage } from "@/types/api/gateway-service";

const BASE_URL = "/gateway-admin/services";

/** 独立网关控制面的只读服务目录接口。 */
const GatewayServiceAPI = {
  list(params: { page: number; pageSize: number }) {
    return request<any, GatewayServicePage>({ url: BASE_URL, method: "get", params });
  },
};

export default GatewayServiceAPI;
