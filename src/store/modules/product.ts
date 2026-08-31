import { store } from "@/store/instance";
import { appConfig } from "@/settings";
import { getProductProfile, PRODUCT_CODE, type ProductProfile } from "@/api/product";

/** 当前前端固定产品的品牌配置。 */
export const useProductStore = defineStore("product", () => {
  const profile = ref<ProductProfile>({
    id: PRODUCT_CODE,
    code: PRODUCT_CODE,
    name: appConfig.title,
    shortName: appConfig.title,
    homePath: "/",
    enabled: true,
  });
  let pending: Promise<ProductProfile> | null = null;

  async function load() {
    if (pending) return pending;
    pending = getProductProfile()
      .then((value) => {
        profile.value = value;
        applyBrand(value);
        return value;
      })
      .finally(() => {
        pending = null;
      });
    return pending;
  }

  function applyBrand(value: ProductProfile) {
    document.title = value.name;
    if (value.primaryColor)
      document.documentElement.style.setProperty("--el-color-primary", value.primaryColor);
    if (value.faviconUrl) {
      let favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (!favicon) {
        favicon = document.createElement("link");
        favicon.rel = "icon";
        document.head.appendChild(favicon);
      }
      favicon.href = value.faviconUrl;
    }
  }

  return { profile, load };
});

export function useProductStoreHook() {
  return useProductStore(store);
}
