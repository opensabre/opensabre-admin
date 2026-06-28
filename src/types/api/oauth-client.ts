/**
 * OAuth2 客户端类型定义
 */

import type { BaseQueryParams } from "./common";

/** OAuth2 客户端分页查询参数 */
export interface OAuthClientQueryParams extends BaseQueryParams {
  clientId?: string;
  clientName?: string;
}

/** OAuth2 客户端列表对象 */
export interface OAuthClientItem {
  id?: string;
  clientId?: string;
  clientName?: string;
  clientSecret?: string;
  clientIdIssuedAt?: string;
  clientSecretExpiresAt?: string;
  clientAuthenticationMethods?: string[];
  authorizationGrantTypes?: string[];
  redirectUris?: string[];
  scopes?: string[];
  accessTokenTimeToLive?: number;
  refreshTokenTimeToLive?: number;
}

/** OAuth2 客户端表单对象 */
export interface OAuthClientForm {
  id?: string;
  clientId?: string;
  clientName?: string;
  clientSecret?: string;
  clientSecretExpires?: number | null;
  grantTypes?: string[];
  clientAuthenticationMethods?: string[];
  scopes?: string[];
  redirectUri?: string;
  accessTokenTimeToLive?: number | null;
  refreshTokenTimeToLive?: number | null;
}
