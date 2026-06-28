import { beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.fn();

vi.mock("@/utils/request", () => ({
  default: requestMock,
}));

describe("RoleAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads role page from organization conditions API", async () => {
    requestMock.mockResolvedValueOnce({
      records: [{ id: "201", code: "ADMIN", name: "管理员" }],
      current: 1,
      size: 10,
      total: 1,
    });

    const { default: RoleAPI } = await import("@/api/system/role");

    const page = await RoleAPI.getPage({ pageNum: 1, pageSize: 10, keywords: "管理员" });

    expect(requestMock).toHaveBeenCalledWith({
      url: "/api/org/role/conditions",
      method: "post",
      data: {
        current: 1,
        size: 10,
        name: "管理员",
      },
    });
    expect(page).toEqual({
      data: [expect.objectContaining({ id: "201", code: "ADMIN", name: "管理员", status: 1 })],
      page: { pageNum: 1, pageSize: 10, total: 1 },
    });
  });

  it("updates role menus through organization role API", async () => {
    requestMock.mockResolvedValueOnce(true);

    const { default: RoleAPI } = await import("@/api/system/role");

    await RoleAPI.updateRoleMenus("201", ["1", 2]);

    expect(requestMock).toHaveBeenCalledWith({
      url: "/api/org/role/201/menus",
      method: "put",
      data: ["1", "2"],
    });
  });
});
