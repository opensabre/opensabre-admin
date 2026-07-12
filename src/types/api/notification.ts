import type { BaseQueryParams } from "./common";

export type NotificationChannel = "SMS" | "EMAIL" | "WECHAT";
export type NotificationSendStatus = "SUCCESS" | "FAILED";

export interface NotificationSceneItem {
  id?: string;
  sceneCode: string;
  sceneName: string;
  description?: string;
  enabled: boolean;
  createdTime?: string;
  updatedTime?: string;
}

export type NotificationSceneForm = NotificationSceneItem;

export interface NotificationTemplateQueryParams {
  sceneCode?: string;
  channel?: NotificationChannel | "";
  enabled?: boolean | "";
}

export interface NotificationTemplateItem {
  id?: string;
  sceneCode: string;
  channel: NotificationChannel;
  templateName: string;
  title?: string;
  content: string;
  paramSchema?: string;
  sort?: number;
  enabled: boolean;
  createdTime?: string;
  updatedTime?: string;
}

export type NotificationTemplateForm = NotificationTemplateItem;

export interface NotificationRecordQueryParams extends BaseQueryParams {
  sceneCode?: string;
  channel?: NotificationChannel | "";
  status?: NotificationSendStatus | "";
}

export interface NotificationRecordItem {
  id: string;
  sceneCode: string;
  channel: NotificationChannel;
  target: string;
  templateId?: string;
  templateTitle?: string;
  templateContent?: string;
  argsJson?: string;
  status: NotificationSendStatus;
  messageId?: string;
  failureReason?: string;
  retryCount?: number;
  nextRetryTime?: string;
  sentTime?: string;
  createdTime?: string;
}
