import request from "@/utils/request";
import type {
  NotificationRecordItem,
  NotificationRecordQueryParams,
  NotificationSceneForm,
  NotificationSceneItem,
  NotificationTemplateForm,
  NotificationTemplateItem,
  NotificationTemplateQueryParams,
} from "@/types/api";

const NOTIFICATION_BASE_URL = "/sysadmin/notification";

const NotificationAdminAPI = {
  getSceneList() {
    return request<any, NotificationSceneItem[]>({
      url: `${NOTIFICATION_BASE_URL}/scenes`,
      method: "get",
    });
  },
  getEnabledSceneList() {
    return request<any, NotificationSceneItem[]>({
      url: `${NOTIFICATION_BASE_URL}/scenes/enabled`,
      method: "get",
    });
  },
  getSceneFormData(sceneCode: string) {
    return request<any, NotificationSceneForm>({
      url: `${NOTIFICATION_BASE_URL}/scenes/${sceneCode}`,
      method: "get",
    });
  },
  createScene(data: NotificationSceneForm) {
    return request({
      url: `${NOTIFICATION_BASE_URL}/scenes`,
      method: "post",
      data,
    });
  },
  updateScene(sceneCode: string, data: NotificationSceneForm) {
    return request({
      url: `${NOTIFICATION_BASE_URL}/scenes/${sceneCode}`,
      method: "put",
      data,
    });
  },
  deleteScene(sceneCode: string) {
    return request({
      url: `${NOTIFICATION_BASE_URL}/scenes/${sceneCode}`,
      method: "delete",
    });
  },
  getTemplateList(queryParams?: NotificationTemplateQueryParams) {
    return request<any, NotificationTemplateItem[]>({
      url: `${NOTIFICATION_BASE_URL}/templates`,
      method: "get",
      params: queryParams,
    });
  },
  getTemplateFormData(id: string) {
    return request<any, NotificationTemplateForm>({
      url: `${NOTIFICATION_BASE_URL}/templates/${id}`,
      method: "get",
    });
  },
  createTemplate(data: NotificationTemplateForm) {
    return request({
      url: `${NOTIFICATION_BASE_URL}/templates`,
      method: "post",
      data,
    });
  },
  updateTemplate(id: string, data: NotificationTemplateForm) {
    return request({
      url: `${NOTIFICATION_BASE_URL}/templates/${id}`,
      method: "put",
      data,
    });
  },
  deleteTemplate(id: string) {
    return request({
      url: `${NOTIFICATION_BASE_URL}/templates/${id}`,
      method: "delete",
    });
  },
  getRecordPage(queryParams: NotificationRecordQueryParams) {
    return request<any, PageResult<NotificationRecordItem>>({
      url: `${NOTIFICATION_BASE_URL}/records`,
      method: "get",
      params: {
        pageNum: queryParams.pageNum ?? 1,
        pageSize: queryParams.pageSize ?? 10,
        sceneCode: queryParams.sceneCode || undefined,
        channel: queryParams.channel || undefined,
        status: queryParams.status || undefined,
      },
    });
  },
  getRecordDetail(id: string) {
    return request<any, NotificationRecordItem>({
      url: `${NOTIFICATION_BASE_URL}/records/${id}`,
      method: "get",
    });
  },
  retryRecord(id: string) {
    return request({
      url: `${NOTIFICATION_BASE_URL}/records/${id}/retry`,
      method: "post",
    });
  },
};

export default NotificationAdminAPI;
