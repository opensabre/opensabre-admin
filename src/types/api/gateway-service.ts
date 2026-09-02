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

/** Fixed Prometheus vectors for basic application instance monitoring. */
export interface ApplicationMetricsSnapshot {
  requestRate: string;
  errorRate: string;
  p95Latency: string;
  cpuUsage: string;
  heapUsed: string;
  heapMax: string;
}

/** Instantaneous values obtained directly from one application's Actuator endpoint. */
export interface ApplicationActuatorSnapshot {
  processCpuUsage: number;
  heapUsedBytes: number;
  heapMaxBytes: number;
  uptimeSeconds: number;
  liveThreads: number;
}

export interface ApplicationInstanceActuator {
  serviceName: string;
  instanceId: string;
  healthy: boolean;
  snapshot?: ApplicationActuatorSnapshot;
  errorMessage?: string;
}
