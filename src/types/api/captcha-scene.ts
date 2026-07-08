import type { BaseQueryParams } from "./common";

export type CaptchaType = "IMAGE" | "SMS" | "EMAIL" | "SLIDER" | "CLICK";

export interface CaptchaSceneQueryParams extends BaseQueryParams {
  keywords?: string;
  captchaType?: CaptchaType | "";
  enabled?: boolean | "";
}

export interface CaptchaSceneItem {
  id?: string;
  sceneCode: string;
  sceneName: string;
  captchaType: CaptchaType;
  templateCode?: string;
  notificationTemplateId?: string;
  description?: string;
  captchaLength: number;
  captchaExpireTime: number;
  captchaAttempts: number;
  minInterval: number;
  maxLimitCount: number;
  enabled: boolean;
  createdTime?: string;
  updatedTime?: string;
}

export type CaptchaSceneForm = Partial<CaptchaSceneItem> & {
  sceneCode: string;
  sceneName: string;
  captchaType: CaptchaType;
  captchaLength: number;
  captchaExpireTime: number;
  captchaAttempts: number;
  minInterval: number;
  maxLimitCount: number;
  enabled: boolean;
};
