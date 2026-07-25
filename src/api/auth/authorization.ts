import request from "@/utils/request";
import type { OAuthAuthorizationItem, OAuthAuthorizationQueryParams } from "@/types/api";

const AUTHORIZATION_BASE_URL = "/auth/authorizations";

interface AuthorizationPage {
  records?: OAuthAuthorizationItem[];
  current?: number;
  size?: number;
  total?: number;
}

const OAuthAuthorizationAPI = {
  getPage(queryParams: OAuthAuthorizationQueryParams) {
    return request<any, AuthorizationPage>({
      url: `${AUTHORIZATION_BASE_URL}/conditions`,
      method: "post",
      data: {
        current: queryParams.pageNum,
        size: queryParams.pageSize,
        clientId: queryParams.clientId || undefined,
        principalName: queryParams.principalName || undefined,
        authorizationGrantType: queryParams.authorizationGrantType || undefined,
        status: queryParams.status || undefined,
      },
    }).then((page) => ({
      data: page.records ?? [],
      page: {
        pageNum: page.current ?? queryParams.pageNum,
        pageSize: page.size ?? queryParams.pageSize,
        total: page.total ?? 0,
      },
    }));
  },
  get(id: string) {
    return request<any, OAuthAuthorizationItem>({
      url: `${AUTHORIZATION_BASE_URL}/${id}`,
      method: "get",
    });
  },
  revoke(id: string) {
    return request({
      url: `${AUTHORIZATION_BASE_URL}/${id}`,
      method: "delete",
    });
  },
};

export default OAuthAuthorizationAPI;
