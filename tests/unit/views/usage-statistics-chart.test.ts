import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("usage statistics trend chart", () => {
  it("reserves vertical space between the legend and the plot", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/views/sysadmin/usage-statistics/index.vue"),
      "utf8"
    );

    expect(source).toContain('legend: { top: 0, data: ["发起", "成功", "失败"] }');
    expect(source).toContain("grid: { top: 48, left: 48, right: 20, bottom: 36 }");
  });
});
