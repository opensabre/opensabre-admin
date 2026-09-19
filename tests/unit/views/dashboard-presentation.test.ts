import { describe, expect, it } from "vitest";

import { aggregateDashboardTrend } from "@/views/dashboard/presentation";

describe("dashboard presentation", () => {
  it("aggregates request and error series across routes", () => {
    const result = aggregateDashboardTrend({
      range: "7d",
      start: "2026-09-12T00:00:00Z",
      end: "2026-09-19T00:00:00Z",
      stepSeconds: 3600,
      series: {
        tps: JSON.stringify({
          data: {
            result: [
              {
                metric: { routeId: "a" },
                values: [
                  [100, "2"],
                  [200, "3"],
                ],
              },
              {
                metric: { routeId: "b" },
                values: [
                  [100, "1.5"],
                  [200, "bad"],
                ],
              },
            ],
          },
        }),
        errorTps: JSON.stringify({
          data: { result: [{ metric: { routeId: "a" }, values: [[100, "0.5"]] }] },
        }),
      },
    });

    expect(result).toEqual([
      { timestamp: 100, tps: 3.5, errorTps: 0.5 },
      { timestamp: 200, tps: 3, errorTps: 0 },
    ]);
  });
});
