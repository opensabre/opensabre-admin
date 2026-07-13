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
      url: "/org/menu/user/101",
      method: "get",
    });
    expect(routes[0]).toMatchObject({
      path: "/admin",
      name: "OrgMenu101",
      component: "admin/index",
    });
  });

  it("loads only root menus when opening menu management", async () => {
    requestMock.mockResolvedValueOnce([
      {
        id: "1",
        parentId: "-1",
        name: "系统管理",
        type: "CATALOG",
        href: "/admin",
        icon: "setting",
        orderNum: 1,
      },
    ]);

    const { default: MenuAPI } = await import("@/api/system/menu");

    const menus = await MenuAPI.getList({});

    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(requestMock).toHaveBeenCalledWith({
      url: "/org/menu/parent/-1",
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
        hasChildren: true,
      }),
    ]);
  });

  it("loads child menus only when a menu row is expanded", async () => {
    requestMock.mockResolvedValueOnce([
      {
        id: "2",
        parentId: "1",
        name: "用户管理",
        type: "MENU",
        href: "/admin/users",
        icon: "user",
        orderNum: 1,
      },
    ]);

    const { default: MenuAPI } = await import("@/api/system/menu");

    const menus = await MenuAPI.getChildren("1");

    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(requestMock).toHaveBeenCalledWith({
      url: "/org/menu/parent/1",
      method: "get",
    });
    expect(menus).toEqual([
      expect.objectContaining({
        id: "2",
        parentId: "1",
        name: "用户管理",
        routePath: "admin/users",
        type: "M",
        hasChildren: true,
      }),
    ]);
  });
});
