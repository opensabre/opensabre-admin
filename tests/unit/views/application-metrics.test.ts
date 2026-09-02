import { describe, expect, it } from "vitest";
import {
  actuatorMetricsByInstance,
  applicationMetricsByInstance,
  instanceActuator,
  instanceMetrics,
} from "@/views/system/gateway/services/application-metrics";

function vector(instance: string, value: string) {
  return JSON.stringify({ data: { result: [{ metric: { instance }, value: [1, value] }] } });
}

describe("application metrics", () => {
  it("merges fixed vectors by instance", () => {
    const metrics = applicationMetricsByInstance({
      requestRate: vector("10.0.0.1:8080", "12.5"),
      errorRate: vector("10.0.0.1:8080", "0.2"),
      p95Latency: vector("10.0.0.1:8080", "0.15"),
      cpuUsage: vector("10.0.0.1:8080", "0.4"),
      heapUsed: vector("10.0.0.1:8080", "100"),
      heapMax: vector("10.0.0.1:8080", "200"),
    });

    expect(metrics.get("10.0.0.1:8080")).toEqual({
      requestRate: 12.5,
      errorRate: 0.2,
      p95Latency: 0.15,
      cpuUsage: 0.4,
      heapUsed: 100,
      heapMax: 200,
    });
  });

  it("matches prefixed Prometheus instance labels and tolerates invalid responses", () => {
    const metrics = applicationMetricsByInstance({
      requestRate: vector("http://10.0.0.2:8081", "3"),
      errorRate: "invalid",
      p95Latency: "",
      cpuUsage: "{}",
      heapUsed: "{}",
      heapMax: "{}",
    });

    expect(
      instanceMetrics(metrics, {
        ip: "10.0.0.2",
        port: 8081,
        cluster: "DEFAULT",
        healthy: true,
        enabled: true,
        weight: 1,
        metadata: {},
      })?.requestRate
    ).toBe(3);
  });

  it("indexes Actuator snapshots without coupling them to Prometheus", () => {
    const metrics = actuatorMetricsByInstance([
      {
        serviceName: "base-sysadmin",
        instanceId: "10.0.0.3:8020",
        healthy: true,
        snapshot: {
          processCpuUsage: 0.1,
          heapUsedBytes: 100,
          heapMaxBytes: 200,
          uptimeSeconds: 3600,
          liveThreads: 20,
        },
      },
    ]);

    expect(
      instanceActuator(metrics, {
        ip: "10.0.0.3",
        port: 8020,
        cluster: "DEFAULT",
        healthy: true,
        enabled: true,
        weight: 1,
        metadata: {},
      })?.snapshot?.liveThreads
    ).toBe(20);
  });
});
