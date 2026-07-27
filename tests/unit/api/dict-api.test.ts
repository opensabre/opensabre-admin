import { beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.fn();

vi.mock("@/utils/request", () => ({
  default: requestMock,
}));

describe("DictAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads dict item options through sysadmin gateway route", async () => {
    requestMock.mockResolvedValueOnce([
      { label: "男", value: "1", tagType: "P" },
      { label: "女", value: "2", tagType: "S" },
    ]);

    const { default: DictAPI } = await import("@/api/system/dict");

    const options = await DictAPI.getDictItems("gender");

    expect(requestMock).toHaveBeenCalledWith({
      url: "/sysadmin/v1/dicts/gender/items/options",
      method: "get",
    });
    expect(options).toEqual([
      { label: "男", value: "1", tagType: "primary" },
      { label: "女", value: "2", tagType: "success" },
    ]);
  });

  it("loads multiple dictionaries in one request", async () => {
    requestMock.mockResolvedValueOnce({
      notice_type: [{ label: "系统通知", value: "1", tagType: "P" }],
      notice_level: [{ label: "普通", value: "1", tagType: "I" }],
    });
    const { default: DictAPI } = await import("@/api/system/dict");

    const groups = await DictAPI.getDictItemsBatch(["notice_type", "notice_level"]);

    expect(requestMock).toHaveBeenCalledWith({
      url: "/sysadmin/v1/dicts/items/options",
      method: "get",
      params: { codes: "notice_type,notice_level" },
    });
    expect(groups.notice_level[0].tagType).toBe("info");
  });
});
