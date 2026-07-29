import request from "@/utils/request";
import type {
  OAuthAuthorizationConsentItem,
  OAuthAuthorizationConsentQueryParams,
} from "@/types/api";

const CONSENT_BASE_URL = "/auth/authorization-consents";

interface AuthorizationConsentPage {
  records?: OAuthAuthorizationConsentItem[];
  current?: number;
  size?: number;
  total?: number;
}

/** 客户端授权同意记录管理 API。 */
const OAuthAuthorizationConsentAPI = {
  getPage(queryParams: OAuthAuthorizationConsentQueryParams) {
    return request<any, AuthorizationConsentPage>({
      url: `${CONSENT_BASE_URL}/conditions`,
      method: "post",
      data: {
        current: queryParams.pageNum,
        size: queryParams.pageSize,
        clientId: queryParams.clientId || undefined,
        principalName: queryParams.principalName || undefined,
        authority: queryParams.authority || undefined,
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
  get(registeredClientId: string, principalName: string) {
    return request<any, OAuthAuthorizationConsentItem>({
      url: CONSENT_BASE_URL,
      method: "get",
      params: { registeredClientId, principalName },
    });
  },
  remove(registeredClientId: string, principalName: string) {
    return request({
      url: CONSENT_BASE_URL,
      method: "delete",
      params: { registeredClientId, principalName },
    });
  },
};

export default OAuthAuthorizationConsentAPI;
