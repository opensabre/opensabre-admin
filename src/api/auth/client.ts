import request from "@/utils/request";
import type { OAuthClientForm, OAuthClientItem, OAuthClientQueryParams } from "@/types/api";

const OAUTH_CLIENT_BASE_URL = "/api/v1/auth/client";

interface OrgPage<T> {
  records?: T[];
  current?: number;
  size?: number;
  total?: number;
}

function toQuery(queryParams?: OAuthClientQueryParams) {
  return {
    current: queryParams?.pageNum ?? 1,
    size: queryParams?.pageSize ?? 10,
    clientId: queryParams?.clientId || undefined,
    clientName: queryParams?.clientName || undefined,
  };
}

function toForm(client: OAuthClientItem): OAuthClientForm {
  return {
    id: client.id,
    clientId: client.clientId,
    clientName: client.clientName,
    clientSecret: client.clientSecret,
    clientSecretExpires: client.clientSecretExpiresAt
      ? Math.max(
          0,
          Math.floor((new Date(client.clientSecretExpiresAt).getTime() - Date.now()) / 1000)
        )
      : null,
    grantTypes: client.authorizationGrantTypes ?? [],
    clientAuthenticationMethods: client.clientAuthenticationMethods ?? [],
    scopes: client.scopes ?? [],
    redirectUri: (client.redirectUris ?? []).join(","),
    accessTokenTimeToLive: client.accessTokenTimeToLive ?? 300,
    refreshTokenTimeToLive: client.refreshTokenTimeToLive ?? 3600,
  };
}

const OAuthClientAPI = {
  getPage(queryParams?: OAuthClientQueryParams) {
    const fallbackQuery = queryParams ?? { pageNum: 1, pageSize: 10 };
    return request<any, OrgPage<OAuthClientItem>>({
      url: `${OAUTH_CLIENT_BASE_URL}/conditions`,
      method: "post",
      data: toQuery(queryParams),
    }).then((page) => ({
      data: (page.records ?? []).map((item) => ({
        ...item,
        redirectUris: item.redirectUris ?? [],
        authorizationGrantTypes: item.authorizationGrantTypes ?? [],
        clientAuthenticationMethods: item.clientAuthenticationMethods ?? [],
        scopes: item.scopes ?? [],
      })),
      page: {
        pageNum: page.current ?? fallbackQuery.pageNum,
        pageSize: page.size ?? fallbackQuery.pageSize,
        total: page.total ?? 0,
      },
    }));
  },
  getFormData(id: string) {
    return request<any, OAuthClientItem>({
      url: `${OAUTH_CLIENT_BASE_URL}/${id}`,
      method: "get",
    }).then(toForm);
  },
  create(data: OAuthClientForm) {
    return request({
      url: OAUTH_CLIENT_BASE_URL,
      method: "post",
      data,
    });
  },
  update(id: string, data: OAuthClientForm) {
    return request({
      url: `${OAUTH_CLIENT_BASE_URL}/${id}`,
      method: "put",
      data,
    });
  },
  deleteByIds(ids: string) {
    return Promise.all(
      ids
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .map((id) => request({ url: `${OAUTH_CLIENT_BASE_URL}/${id}`, method: "delete" }))
    );
  },
};

export default OAuthClientAPI;
