/** 网关 API 资产。 */
export interface GatewayApiAsset {
  id: string;
  serviceId: string;
  operationId?: string;
  httpMethod: string;
  upstreamPath: string;
  summary?: string;
  sourceType?: string;
  discoveryStatus?: string;
  lastDiscoveredTime?: string;
}

/** API 对外发布声明。 */
export interface GatewayApiPublication {
  id: string;
  apiId: string;
  externalPath: string;
  upstreamPath?: string;
  authMode: string;
  status: string;
  riskLevel: string;
  approvalStatus: string;
  publishedVersion?: string;
  lockVersion?: number;
}

/** 应用级路由声明。 */
export interface GatewayApplicationRoute {
  id: string;
  serviceId: string;
  routeName: string;
  externalPath: string;
  targetUri: string;
  httpMethod?: string;
  rewritePath?: string;
  status: string;
  riskLevel: string;
  approvalStatus: string;
  publishedVersion?: string;
  lockVersion?: number;
}
