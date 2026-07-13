import { describe, expect, it } from "vitest";
import { toRouteItems, type OrgMenuItem } from "@/api/system/menu-adapter";

describe("MenuAPI route adapter", () => {
  it("converts base-organization menu tree to frontend routes", () => {
    const menus: OrgMenuItem[] = [
      {
        id: "101",
        parentId: "-1",
        name: "系统管理",
        type: "MENU",
        href: "/admin",
        icon: "setting",
        orderNum: 0,
        children: [
          {
            id: "102",
            parentId: "101",
            name: "用户管理",
            type: "MENU",
            href: "/admin/users",
            icon: "fa-user",
            orderNum: 10,
            children: [],
          },
          {
            id: "103",
            parentId: "101",
            name: "菜单管理",
            type: "MENU",
            href: "/admin/menus",
            icon: "category",
            orderNum: 20,
            children: [],
          },
          {
            id: "104",
            parentId: "101",
            name: "角色管理",
            type: "MENU",
            href: "/admin/roles",
            icon: "user-filled",
            orderNum: 30,
            children: [],
          },
          {
            id: "105",
            parentId: "101",
            name: "组织管理",
            type: "MENU",
            href: "/admin/groups",
            icon: "office-building",
            orderNum: 40,
            children: [],
          },
        ],
      },
    ];

    expect(toRouteItems(menus)).toEqual([
      {
        path: "/admin",
        name: "OrgMenu101",
        component: "Layout",
        redirect: "users",
        meta: {
          title: "系统管理",
          icon: "setting",
          hidden: false,
          alwaysShow: true,
        },
        children: [
          {
            path: "users",
            name: "OrgMenu102",
            component: "system/user/index",
            redirect: undefined,
            meta: {
              title: "用户管理",
              icon: "fa-user",
              hidden: false,
            },
            children: [],
          },
          {
            path: "menus",
            name: "OrgMenu103",
            component: "system/menu/index",
            redirect: undefined,
            meta: {
              title: "菜单管理",
              icon: "category",
              hidden: false,
            },
            children: [],
          },
          {
            path: "roles",
            name: "OrgMenu104",
            component: "system/role/index",
            redirect: undefined,
            meta: {
              title: "角色管理",
              icon: "user-filled",
              hidden: false,
            },
            children: [],
          },
          {
            path: "groups",
            name: "OrgMenu105",
            component: "system/dept/index",
            redirect: undefined,
            meta: {
              title: "组织管理",
              icon: "office-building",
              hidden: false,
            },
            children: [],
          },
        ],
      },
    ]);
  });

  it("uses the generic iframe page for menus with an embedded URL", () => {
    const routes = toRouteItems([
      {
        id: "118",
        parentId: "117",
        name: "API文档",
        type: "MENU",
        href: "/development/api-docs",
        description: '{"iframeUrl":"/doc.html","visible":1}',
      },
    ]);

    expect(routes[0]).toMatchObject({
      path: "/development/api-docs",
      component: "system/iframe/index",
      meta: { params: { iframeUrl: "/doc.html" } },
    });
  });
});
