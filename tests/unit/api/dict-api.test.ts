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
});
