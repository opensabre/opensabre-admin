import { matrix } from "@/views/system/gateway/monitoring/history-chart";
import type { MonitoringHistory } from "@/types/api/gateway-api-route";

export interface DashboardTrendPoint {
  timestamp: number;
  tps: number;
  errorTps: number;
}

/** 将网关监控接口返回的多路 Prometheus 矩阵聚合为首页趋势点。 */
export function aggregateDashboardTrend(history?: MonitoringHistory): DashboardTrendPoint[] {
  const points = new Map<number, DashboardTrendPoint>();
  addSeries(points, matrix(history?.series.tps), "tps");
  addSeries(points, matrix(history?.series.errorTps), "errorTps");
  return [...points.values()].sort((left, right) => left.timestamp - right.timestamp);
}

function addSeries(
  points: Map<number, DashboardTrendPoint>,
  series: Array<{ values: Array<[number, string]> }>,
  key: "tps" | "errorTps"
) {
  for (const item of series) {
    for (const [timestamp, rawValue] of item.values) {
      const value = Number(rawValue);
      if (!Number.isFinite(value)) continue;
      const point = points.get(timestamp) || { timestamp, tps: 0, errorTps: 0 };
      point[key] += value;
      points.set(timestamp, point);
    }
  }
}
