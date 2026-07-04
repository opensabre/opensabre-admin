import { beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.fn();

vi.mock("@/utils/request", () => ({
  default: requestMock,
}));

describe("ResourceAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads resource page from organization conditions API", async () => {
    requestMock.mockResolvedValueOnce({
      records: [{ id: "313", code: "resource_manager:add", name: "新增资源", method: "POST" }],
      current: 1,
      size: 10,
      total: 1,
    });

    const { default: ResourceAPI } = await import("@/api/system/resource");

    const page = await ResourceAPI.getPage({
      pageNum: 1,
      pageSize: 10,
      name: "资源",
      method: "POST",
    });

    expect(requestMock).toHaveBeenCalledWith({
      url: "/org/resource/conditions",
      method: "post",
      data: {
        current: 1,
        size: 10,
        name: "资源",
        code: undefined,
        url: undefined,
        method: "POST",
      },
    });
    expect(page.page).toEqual({ pageNum: 1, pageSize: 10, total: 1 });
    expect(page.data).toEqual([
      expect.objectContaining({ id: "313", code: "resource_manager:add", method: "POST" }),
    ]);
  });
});
