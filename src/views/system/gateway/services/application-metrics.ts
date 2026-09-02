import type {
  ApplicationInstanceActuator,
  ApplicationMetricsSnapshot,
  GatewayServiceInstance,
} from "@/types/api/gateway-service";

export interface ApplicationInstanceMetrics {
  requestRate?: number;
  errorRate?: number;
  p95Latency?: number;
  cpuUsage?: number;
  heapUsed?: number;
  heapMax?: number;
}

interface PrometheusVectorItem {
  metric: Record<string, string>;
  value?: [number, string];
}

/** Convert the fixed Prometheus vectors into a lookup keyed by host:port. */
export function applicationMetricsByInstance(snapshot?: ApplicationMetricsSnapshot) {
  const metrics = new Map<string, ApplicationInstanceMetrics>();
  if (!snapshot) return metrics;

  for (const field of [
    "requestRate",
    "errorRate",
    "p95Latency",
    "cpuUsage",
    "heapUsed",
    "heapMax",
  ] as const) {
    for (const item of prometheusVector(snapshot[field])) {
      const instance = item.metric.instance;
      const value = Number(item.value?.[1]);
      if (!instance || !Number.isFinite(value)) continue;
      const current = metrics.get(instance) || {};
      current[field] = value;
      metrics.set(instance, current);
    }
  }
  return metrics;
}

export function instanceMetrics(
  metrics: Map<string, ApplicationInstanceMetrics>,
  instance: GatewayServiceInstance
) {
  const key = `${instance.ip}:${instance.port}`;
  return metrics.get(key) || [...metrics].find(([id]) => id.endsWith(key))?.[1];
}

/** Index Actuator results separately so their availability never affects Prometheus values. */
export function actuatorMetricsByInstance(items: ApplicationInstanceActuator[]) {
  return new Map(items.map((item) => [item.instanceId, item]));
}

export function instanceActuator(
  metrics: Map<string, ApplicationInstanceActuator>,
  instance: GatewayServiceInstance
) {
  const key = `${instance.ip}:${instance.port}`;
  return metrics.get(key) || [...metrics].find(([id]) => id.endsWith(key))?.[1];
}

function prometheusVector(raw: string): PrometheusVectorItem[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw)?.data?.result || [];
  } catch {
    return [];
  }
}
