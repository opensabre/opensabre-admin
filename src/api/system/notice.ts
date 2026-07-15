import request from "@/utils/request";
import type { NoticeQueryParams, NoticeForm, NoticeItem, NoticeDetail } from "@/types/api";

const NOTICE_BASE_URL = "/sysadmin/internal-messages";

const statusToNumber: Record<string, number> = { DRAFT: 0, PUBLISHED: 1, REVOKED: -1 };
const numberToStatus: Record<number, string> = { 0: "DRAFT", 1: "PUBLISHED", [-1]: "REVOKED" };

function toItem(message: any): NoticeItem {
  return {
    ...message,
    type: message.kind,
    publishStatus: statusToNumber[message.status] ?? 0,
    targetType: message.targetScope === "ALL_ACTIVE_USERS" ? 1 : 2,
  };
}

function toForm(message: any): NoticeForm {
  return {
    ...toItem(message),
    targetUserIds: message.targetUsernames
      ? String(message.targetUsernames).split(",").filter(Boolean)
      : [],
  };
}

function toRequest(data: NoticeForm) {
  return {
    title: data.title,
    content: data.content,
    kind: data.type === "NOTIFICATION" ? "NOTIFICATION" : "ANNOUNCEMENT",
    level: data.level,
    targetScope: data.targetType === 1 ? "ALL_ACTIVE_USERS" : "USERS",
    targetUsernames: Array.isArray(data.targetUserIds)
      ? data.targetUserIds
      : String(data.targetUserIds || "")
          .split(",")
          .filter(Boolean),
  };
}

const NoticeAPI = {
  /** 获取通知公告分页数据 */
  getPage(queryParams?: NoticeQueryParams) {
    return request<any, PageResult<any>>({
      url: `${NOTICE_BASE_URL}`,
      method: "get",
      params: {
        ...queryParams,
        status:
          queryParams?.publishStatus == null
            ? undefined
            : numberToStatus[queryParams.publishStatus],
      },
    }).then((res) => ({ ...res, data: res.data.map(toItem) }));
  },
  /** 获取通知公告表单数据 */
  getFormData(id: string) {
    return request<any, any>({ url: `${NOTICE_BASE_URL}/${id}`, method: "get" }).then(toForm);
  },
  /** 添加通知公告 */
  create(data: NoticeForm) {
    return request({ url: `${NOTICE_BASE_URL}`, method: "post", data: toRequest(data) });
  },
  /** 更新通知公告 */
  update(id: string, data: NoticeForm) {
    return request({ url: `${NOTICE_BASE_URL}/${id}`, method: "put", data: toRequest(data) });
  },
  /** 批量删除通知公告，多个以英文逗号(,)分割 */
  deleteByIds(ids: string) {
    return Promise.all(
      ids
        .split(",")
        .filter(Boolean)
        .map((id) => request({ url: `${NOTICE_BASE_URL}/${id}`, method: "delete" }))
    );
  },
  /** 发布通知 */
  publish(id: string) {
    return request({ url: `${NOTICE_BASE_URL}/${id}/publish`, method: "post" });
  },
  /** 撤回通知 */
  revoke(id: string) {
    return request({ url: `${NOTICE_BASE_URL}/${id}/revoke`, method: "post" });
  },
  /** 查看通知 */
  getDetail(id: string) {
    return request<any, any>({ url: `${NOTICE_BASE_URL}/${id}`, method: "get" }).then(toItem);
  },
  /** 阅读我的站内信（服务端同步记录阅读时间） */
  getInboxDetail(id: string) {
    return request<any, any>({ url: `${NOTICE_BASE_URL}/inbox/${id}`, method: "get" }).then(toItem);
  },
  /** 全部已读 */
  readAll() {
    return request({ url: `${NOTICE_BASE_URL}/inbox/read-all`, method: "post" });
  },
  /** 获取我的通知分页列表 */
  getMyNoticePage(queryParams?: NoticeQueryParams) {
    return request<any, PageResult<NoticeItem>>({
      url: `${NOTICE_BASE_URL}/inbox`,
      method: "get",
      params: queryParams,
    }).then((res) => ({ ...res, data: res.data.map(toItem) }));
  },
};

export default NoticeAPI;
