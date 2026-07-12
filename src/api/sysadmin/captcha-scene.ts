import request from "@/utils/request";
import type { CaptchaSceneForm, CaptchaSceneItem } from "@/types/api";

const CAPTCHA_SCENE_BASE_URL = "/sysadmin/captcha/scenes";

const CaptchaSceneAPI = {
  getList() {
    return request<any, CaptchaSceneItem[]>({
      url: CAPTCHA_SCENE_BASE_URL,
      method: "get",
    });
  },
  getEnabledList() {
    return request<any, CaptchaSceneItem[]>({
      url: `${CAPTCHA_SCENE_BASE_URL}/enabled`,
      method: "get",
    });
  },
  getFormData(sceneCode: string) {
    return request<any, CaptchaSceneForm>({
      url: `${CAPTCHA_SCENE_BASE_URL}/${sceneCode}`,
      method: "get",
    });
  },
  create(data: CaptchaSceneForm) {
    return request({
      url: CAPTCHA_SCENE_BASE_URL,
      method: "post",
      data,
    });
  },
  update(sceneCode: string, data: CaptchaSceneForm) {
    return request({
      url: `${CAPTCHA_SCENE_BASE_URL}/${sceneCode}`,
      method: "put",
      data,
    });
  },
  delete(sceneCode: string) {
    return request({
      url: `${CAPTCHA_SCENE_BASE_URL}/${sceneCode}`,
      method: "delete",
    });
  },
};

export default CaptchaSceneAPI;
