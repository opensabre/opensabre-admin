import { beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.fn();

vi.mock("@/utils/request", () => ({
  default: requestMock,
}));

describe("MenuAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads route menus by user id", async () => {
    requestMock.mockResolvedValueOnce([
      {
        id: "101",
        parentId: "-1",
        name: "系统管理",
        type: "MENU",
        href: "/admin",
        icon: "setting",
        orderNum: 0,
        children: [],
      },
    ]);

    const { default: MenuAPI } = await import("@/api/system/menu");

    const routes = await MenuAPI.getRoutes("101");

    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(requestMock).toHaveBeenCalledWith({
      url: "/api/org/menu/user/101",
      method: "get",
    });
    expect(routes[0]).toMatchObject({
      path: "/admin",
      name: "OrgMenu101",
      component: "admin/index",
    });
  });

  it("loads menu management tree from organization parent API", async () => {
    requestMock
      .mockResolvedValueOnce([
        {
          id: "1",
          parentId: "-1",
          name: "系统管理",
          type: "CATALOG",
          href: "/admin",
          icon: "setting",
          orderNum: 1,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "2",
          parentId: "1",
          name: "用户管理",
          type: "MENU",
          href: "/admin/users",
          icon: "user",
          orderNum: 1,
        },
      ])
      .mockResolvedValueOnce([]);

    const { default: MenuAPI } = await import("@/api/system/menu");

    const menus = await MenuAPI.getList({});

    expect(requestMock).toHaveBeenNthCalledWith(1, {
      url: "/api/org/menu/parent/-1",
      method: "get",
    });
    expect(requestMock).toHaveBeenNthCalledWith(2, {
      url: "/api/org/menu/parent/1",
      method: "get",
    });
    expect(requestMock).toHaveBeenNthCalledWith(3, {
      url: "/api/org/menu/parent/2",
      method: "get",
    });
    expect(menus).toEqual([
      expect.objectContaining({
        id: "1",
        parentId: "0",
        name: "系统管理",
        routePath: "admin",
        sort: 1,
        type: "C",
        children: [
          expect.objectContaining({
            id: "2",
            parentId: "1",
            name: "用户管理",
            routePath: "admin/users",
            type: "M",
          }),
        ],
      }),
    ]);
  });
});
