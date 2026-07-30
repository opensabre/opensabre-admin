export type OAuthAuthorizationStatus = "ACTIVE" | "REFRESHABLE" | "EXPIRED";

export interface OAuthAuthorizationQueryParams {
  pageNum: number;
  pageSize: number;
  clientId?: string;
  principalName?: string;
  authorizationGrantType?: string;
  status?: "" | OAuthAuthorizationStatus;
}

export interface OAuthAuthorizationItem {
  id: string;
  clientId?: string;
  clientName?: string;
  principalName?: string;
  authorizationGrantType?: string;
  authorizedScopes?: string;
  accessTokenType?: string;
  accessTokenIssuedAt?: string;
  accessTokenExpiresAt?: string;
  refreshTokenIssuedAt?: string;
  refreshTokenExpiresAt?: string;
  hasIdToken?: boolean;
  hasDeviceCode?: boolean;
  status?: OAuthAuthorizationStatus;
}
