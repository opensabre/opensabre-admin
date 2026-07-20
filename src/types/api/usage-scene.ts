/** 计次场景登记项。 */
export interface UsageSceneItem {
  id?: string;
  objectType: string;
  objectId: string;
  usageEvent: string;
  sceneName: string;
  sourceApp?: string;
  enabled: boolean;
  description?: string;
}
