import { describe, expect, it } from "vitest";

import {
  activityStatus,
  clientSummary,
  lastActiveText,
  onlineDuration,
} from "@/views/security/online-user/presentation";

const NOW = new Date("2026-09-05T12:00:00").getTime();

describe("online user presentation", () => {
  it("formats online duration and recent activity", () => {
    expect(onlineDuration("2026-09-05 09:30:00", NOW)).toBe("2 小时 30 分钟");
    expect(lastActiveText("2026-09-05 11:57:00", NOW)).toBe("3 分钟前");
    expect(activityStatus("2026-09-05 11:57:00", NOW)).toBe("active");
    expect(activityStatus("2026-09-05 11:40:00", NOW)).toBe("idle");
    expect(activityStatus("2026-09-05 10:00:00", NOW)).toBe("inactive");
  });

  it("summarizes common browser and operating system user agents", () => {
    expect(
      clientSummary(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36"
      )
    ).toBe("Chrome 140.0.0.0 · Windows");
    expect(clientSummary()).toBe("未知客户端");
  });
});
