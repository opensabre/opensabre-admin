import request from "@/utils/request";
import type { ErrorCatalogItem, PageResult } from "@/types/api";

const BASE_URL = "/sysadmin/error-catalog";
const ErrorCatalogAPI = {
  list: (params: {
    pageNum: number;
    pageSize: number;
    keywords?: string;
    application?: string;
    deprecated?: boolean | "";
  }) => request<any, PageResult<ErrorCatalogItem>>({ url: BASE_URL, method: "get", params }),
};
export default ErrorCatalogAPI;
