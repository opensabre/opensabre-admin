import { describe, expect, it } from "vitest";
import { historyChartOptions, matrix } from "@/views/system/gateway/monitoring/history-chart";

describe("monitoring history charts", () => {
  it("turns Prometheus matrices into timestamped ECharts series", () => {
    const raw = JSON.stringify({
      data: {
        result: [
          {
            metric: { routeId: "base-sysadmin-api" },
            values: [
              [1, "2.5"],
              [2, "3.5"],
            ],
          },
        ],
      },
    });
    const history = {
      range: "1h" as const,
      start: "2026-09-18T00:00:00Z",
      end: "2026-09-18T01:00:00Z",
      stepSeconds: 30,
      series: { tps: raw },
    };

    const options = historyChartOptions(history, [{ key: "tps", label: "TPS" }]) as any;

    expect(options.series[0].name).toContain("base-sysadmin-api");
    expect(options.series[0].data).toEqual([
      [1000, 2.5],
      [2000, 3.5],
    ]);
    expect(matrix(raw)).toHaveLength(1);
  });
});
