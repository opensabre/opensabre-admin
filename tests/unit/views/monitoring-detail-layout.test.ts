import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const viewPath = resolve(process.cwd(), "src/views/system/gateway/services/index.vue");

describe("service monitoring detail layout", () => {
  it("uses instance tabs and grouped detail sections instead of a single wide table row", () => {
    const source = readFileSync(viewPath, "utf8");
    const dialog = source.slice(source.indexOf("<el-dialog"), source.indexOf("</el-dialog>") + 12);

    expect(dialog).toContain("monitoring-instance-tabs");
    expect(dialog).toContain("<el-tab-pane");
    expect(dialog).toContain("基础信息");
    expect(dialog).toContain("流量表现");
    expect(dialog).toContain("资源运行");
    expect(dialog).toContain("注册元数据");
    expect(dialog).not.toContain("<el-table");
  });
});
