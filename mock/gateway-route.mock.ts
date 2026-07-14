import { defineMock } from "./base";

let version = "d4e7a1c9";
let routes = [
  {
    id: "base-authorization-api",
    uri: "lb://base-authorization",
    order: 0,
    predicates: [{ name: "Path", args: { pattern: "/api/auth/**" } }],
    filters: [{ name: "StripPrefix", args: { parts: "2" } }],
  },
  {
    id: "base-authorization-api-docs",
    uri: "lb://base-authorization",
    order: 0,
    predicates: [{ name: "Path", args: { pattern: "/oauth2/v3/**" } }],
    filters: [{ name: "StripPrefix", args: { parts: "2" } }],
  },
];

function success(data: unknown) {
  return { code: "00000", data, msg: "操作成功" };
}
function publish() {
  version = Math.random().toString(16).slice(2, 10);
  return success({ version, publishedAt: new Date().toISOString() });
}

export default defineMock([
  {
    url: "sysadmin/gateway/routes",
    method: ["GET"],
    body: () =>
      success({ routes, version, publishedAt: "2026-07-14T10:30:00+08:00", publishedBy: "admin" }),
  },
  {
    url: "sysadmin/gateway/routes",
    method: ["POST"],
    body({ body }) {
      if (body.baseVersion !== version)
        return { code: "A0409", msg: "配置已被其他管理员更新，请刷新后重试" };
      if (routes.some((route) => route.id === body.route.id))
        return { code: "A0400", msg: "路由 ID 已存在" };
      routes = [...routes, body.route];
      return publish();
    },
  },
  {
    url: "sysadmin/gateway/routes/:id",
    method: ["PUT"],
    body({ body, params }) {
      if (body.baseVersion !== version)
        return { code: "A0409", msg: "配置已被其他管理员更新，请刷新后重试" };
      routes = routes.map((route) => (route.id === params.id ? body.route : route));
      return publish();
    },
  },
  {
    url: "sysadmin/gateway/routes/:id",
    method: ["DELETE"],
    body({ body, params }) {
      if (body.baseVersion !== version)
        return { code: "A0409", msg: "配置已被其他管理员更新，请刷新后重试" };
      routes = routes.filter((route) => route.id !== params.id);
      return publish();
    },
  },
]);
