import { describe, expect, it } from "vitest";
import { toAuthorizedRoutes, toRouteItems, type OrgMenuItem } from "@/api/system/menu-adapter";

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
            children: [
              {
                id: "130",
                parentId: "102",
                name: "新增用户",
                type: "BUTTON",
                href: "",
                description: '{"perm":"sys:user:create"}',
              },
            ],
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

  it("does not turn button permissions into child routes", () => {
    const routes = toRouteItems([
      {
        id: "102",
        name: "用户管理",
        type: "MENU",
        href: "/admin/users",
        children: [
          { id: "130", name: "新增用户", type: "BUTTON", href: "" },
          { id: "131", name: "修改用户", type: "B", href: "" },
        ],
      },
    ]);

    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      path: "/admin/users",
      component: "system/user/index",
      children: [],
      meta: { title: "用户管理", hidden: false },
    });
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

  it("collects button permissions without exposing buttons as routes", () => {
    const authorized = toAuthorizedRoutes([
      {
        id: "120",
        parentId: "109",
        name: "网关路由",
        type: "MENU",
        href: "/sysadmin/gateway-routes",
        description: '{"component":"system/gateway-route/index"}',
        children: [
          {
            id: "144",
            parentId: "120",
            name: "新增路由",
            type: "BUTTON",
            href: "",
            description: '{"perm":"sys:gateway-route:create"}',
          },
          {
            id: "145",
            parentId: "120",
            name: "修改路由",
            type: "B",
            href: "",
            description: '{"perm":"sys:gateway-route:update"}',
          },
        ],
      },
    ]);

    expect(authorized.permissions).toEqual([
      "sys:gateway-route:create",
      "sys:gateway-route:update",
    ]);
    expect(authorized.routes).toMatchObject([
      {
        path: "/sysadmin/gateway-routes",
        component: "system/gateway-route/index",
        children: [],
      },
    ]);
  });

  it("converts the initialized gateway management hierarchy", () => {
    const routes = toRouteItems([
      {
        id: "160",
        name: "网关",
        type: "MENU",
        href: "/gateway",
        children: [
          {
            id: "202",
            parentId: "160",
            name: "流量治理",
            type: "MENU",
            href: "/gateway/traffic",
            children: [
              {
                id: "217",
                parentId: "202",
                name: "限流规则",
                type: "MENU",
                href: "/gateway/traffic/rate-limits",
                description:
                  '{"routeName":"GatewayRateLimits","component":"system/gateway/planned/index","visible":1}',
              },
            ],
          },
        ],
      },
    ]);

    expect(routes).toMatchObject([
      {
        path: "/gateway",
        component: "Layout",
        children: [
          {
            path: "traffic",
            component: "Layout",
            children: [
              {
                path: "rate-limits",
                name: "GatewayRateLimits",
                component: "system/gateway/planned/index",
                meta: { title: "限流规则", hidden: false },
              },
            ],
          },
        ],
      },
    ]);
  });
});
