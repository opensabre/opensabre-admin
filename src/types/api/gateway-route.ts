/** 网关显式路由配置。配置中心是唯一运行时来源。 */
export interface GatewayRoute {
  id: string;
  uri: string;
  order: number;
  predicates: GatewayRouteDefinition[];
  filters: GatewayRouteDefinition[];
}

/** Spring Cloud Gateway 断言或过滤器定义。 */
export interface GatewayRouteDefinition {
  name: string;
  args: Record<string, string>;
}

/** Nacos 中网关路由配置的当前版本。 */
export interface GatewayRouteConfig {
  routes: GatewayRoute[];
  defaultFilters: GatewayRouteDefinition[];
  version: string;
  publishedAt?: string;
  publishedBy?: string;
}

/** 以当前 Nacos 版本为前置条件的全局过滤器变更。 */
export interface GatewayDefaultFilterChange {
  defaultFilters: GatewayRouteDefinition[];
  baseVersion: string;
}

/** 以当前 Nacos 配置版本为前置条件的路由变更请求。 */
export interface GatewayRouteChange {
  route: GatewayRoute;
  baseVersion: string;
}

export interface GatewayRoutePublishResult {
  version: string;
  publishedAt: string;
}
