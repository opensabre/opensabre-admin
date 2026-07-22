/** Nacos 中注册的网关可路由服务实例。 */
export interface GatewayServiceInstance {
  ip: string;
  port: number;
  cluster: string;
  healthy: boolean;
  enabled: boolean;
  weight: number;
  metadata: Record<string, string>;
}

/** 服务及实例健康摘要。 */
export interface GatewayServiceSummary {
  name: string;
  instanceCount: number;
  healthyInstanceCount: number;
  instances: GatewayServiceInstance[];
}

/** 网关服务目录分页结果。 */
export interface GatewayServicePage {
  total: number;
  page: number;
  pageSize: number;
  services: GatewayServiceSummary[];
}
