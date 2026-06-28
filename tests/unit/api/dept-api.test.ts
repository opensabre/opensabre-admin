import { beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.fn();

vi.mock("@/utils/request", () => ({
  default: requestMock,
}));

describe("DeptAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads only root organization groups by default", async () => {
    requestMock.mockResolvedValueOnce([
      {
        id: "301",
        parentId: "-1",
        name: "总部",
        description: JSON.stringify({ code: "HQ", sort: 1, status: 1 }),
      },
    ]);

    const { default: DeptAPI } = await import("@/api/system/dept");

    const groups = await DeptAPI.getList({});

    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(requestMock).toHaveBeenNthCalledWith(1, {
      url: "/api/org/group/parent/-1",
      method: "get",
    });
    expect(groups).toEqual([
      expect.objectContaining({
        id: "301",
        parentId: "0",
        name: "总部",
        code: "HQ",
        sort: 1,
        status: 1,
      }),
    ]);
  });

  it("loads child organization groups on demand", async () => {
    requestMock.mockResolvedValueOnce([
      {
        id: "302",
        parentId: "301",
        name: "上海分公司",
      },
    ]);

    const { default: DeptAPI } = await import("@/api/system/dept");

    const groups = await DeptAPI.getChildren("301");

    expect(requestMock).toHaveBeenCalledWith({
      url: "/api/org/group/parent/301",
      method: "get",
    });
    expect(groups).toEqual([expect.objectContaining({ id: "302", parentId: "301" })]);
  });

  it("creates organization group with frontend extra fields in description", async () => {
    requestMock.mockResolvedValueOnce(true);

    const { default: DeptAPI } = await import("@/api/system/dept");

    await DeptAPI.create({
      parentId: "0",
      name: "研发部",
      code: "RD",
      sort: 2,
      status: 1,
    });

    expect(requestMock).toHaveBeenCalledWith({
      url: "/api/org/group",
      method: "post",
      data: {
        parentId: "-1",
        name: "研发部",
        description: JSON.stringify({ code: "RD", sort: 2, status: 1 }),
      },
    });
  });
});
