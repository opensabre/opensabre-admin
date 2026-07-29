/** 客户端授权记录分页查询参数。 */
export interface OAuthAuthorizationConsentQueryParams {
  pageNum: number;
  pageSize: number;
  clientId?: string;
  principalName?: string;
  authority?: string;
}

/** 用户授予 OAuth2 客户端的权限记录。 */
export interface OAuthAuthorizationConsentItem {
  registeredClientId: string;
  clientId?: string;
  clientName?: string;
  principalName: string;
  authorities?: string;
}
