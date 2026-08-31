import request from "@/utils/request";

export const PRODUCT_CODE = import.meta.env.VITE_PRODUCT_CODE || "opensabre-admin";

export interface ProductProfile {
  id: string;
  code: string;
  name: string;
  shortName: string;
  description?: string;
  logoUrl?: string;
  collapsedLogoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  homePath: string;
  enabled: boolean;
}

export function getProductProfile() {
  return request<any, ProductProfile>({
    url: `/org/products/${PRODUCT_CODE}/profile`,
    method: "get",
  });
}

export function listProducts() {
  return request<any, ProductProfile[]>({ url: "/org/products", method: "get" });
}

export type ProductRequest = Omit<ProductProfile, "id">;

export function createProduct(data: ProductRequest) {
  return request({ url: "/org/products", method: "post", data });
}

export function updateProduct(code: string, data: ProductRequest) {
  return request({ url: `/org/products/${code}`, method: "put", data });
}
