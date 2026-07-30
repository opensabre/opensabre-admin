/** 限次场景管理类型定义 */

export type RateLimitAlgorithm = "COUNTER" | "SLIDING_WINDOW" | "TOKEN_BUCKET" | "LEAKY_BUCKET";
export type RateLimitDimension = "IP" | "DEVICE" | "USER" | "TENANT" | "BUSINESS" | "CUSTOM";

/** 后端返回的限次场景配置。 */
export interface RateLimitSceneItem {
  id?: string;
  sceneCode: string;
  sceneName: string;
  algorithm: RateLimitAlgorithm;
  dimensions?: string;
  keyPrefix?: string;
  maxCount: number;
  period: number;
  enabled: boolean;
  description?: string;
}

/** 管理台编辑表单，维度以数组形式方便多选。 */
export interface RateLimitSceneForm extends Omit<RateLimitSceneItem, "dimensions"> {
  dimensions: RateLimitDimension[];
}

/** 提交给限次场景接口的表单。 */
export interface RateLimitScenePayload extends Omit<RateLimitSceneForm, "dimensions"> {
  dimensions: string;
}
