import type { MonitoringHistory } from "@/types/api/gateway-api-route";

interface MatrixItem {
  metric: Record<string, string>;
  values: Array<[number, string]>;
}

export function historyChartOptions(
  history: MonitoringHistory | undefined,
  fields: Array<{ key: string; label: string }>,
  valueFormatter: (value: number) => number = (value) => value
) {
  const series = fields.flatMap((field) =>
    matrix(history?.series[field.key]).map((item) => ({
      name: seriesName(field.label, item.metric),
      type: "line",
      showSymbol: false,
      connectNulls: false,
      data: item.values.map(([timestamp, value]) => [
        timestamp * 1000,
        valueFormatter(Number(value)),
      ]),
    }))
  );
  return {
    animation: false,
    tooltip: { trigger: "axis", valueFormatter: formatChartValue },
    legend: { type: "scroll", top: 0 },
    grid: { left: 56, right: 24, top: 48, bottom: 30 },
    xAxis: { type: "time" },
    yAxis: { type: "value", scale: true, axisLabel: { formatter: formatChartValue } },
    series,
  };
}

export function matrix(raw?: string): MatrixItem[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw)?.data?.result || [];
  } catch {
    return [];
  }
}

function seriesName(prefix: string, metric: Record<string, string>) {
  const dimension = metric.routeId || metric.application || metric.instance;
  return dimension ? `${prefix} · ${dimension}` : prefix;
}

function formatChartValue(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "-";
}
