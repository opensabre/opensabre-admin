import { beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.fn();

vi.mock("@/utils/request", () => ({
  default: requestMock,
}));

describe("NotificationAdminAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads notification templates with filters", async () => {
    requestMock.mockResolvedValueOnce([{ id: "tpl-1", sceneCode: "LOGIN_SMS", channel: "SMS" }]);

    const { default: NotificationAdminAPI } = await import("@/api/sysadmin/notification");

    const templates = await NotificationAdminAPI.getTemplateList({
      sceneCode: "LOGIN_SMS",
      channel: "SMS",
      enabled: true,
    });

    expect(requestMock).toHaveBeenCalledWith({
      url: "/sysadmin/notification/templates",
      method: "get",
      params: {
        sceneCode: "LOGIN_SMS",
        channel: "SMS",
        enabled: true,
      },
    });
    expect(templates).toEqual([{ id: "tpl-1", sceneCode: "LOGIN_SMS", channel: "SMS" }]);
  });

  it("loads notification records page and retries failed record", async () => {
    requestMock
      .mockResolvedValueOnce({
        data: [{ id: "record-1", status: "FAILED" }],
        page: { pageNum: 2, pageSize: 20, total: 1 },
      })
      .mockResolvedValueOnce({ success: true });

    const { default: NotificationAdminAPI } = await import("@/api/sysadmin/notification");

    const page = await NotificationAdminAPI.getRecordPage({
      pageNum: 2,
      pageSize: 20,
      sceneCode: "LOGIN_SMS",
      status: "FAILED",
    });
    await NotificationAdminAPI.retryRecord("record-1");

    expect(requestMock).toHaveBeenNthCalledWith(1, {
      url: "/sysadmin/notification/records",
      method: "get",
      params: {
        pageNum: 2,
        pageSize: 20,
        sceneCode: "LOGIN_SMS",
        channel: undefined,
        status: "FAILED",
      },
    });
    expect(requestMock).toHaveBeenNthCalledWith(2, {
      url: "/sysadmin/notification/records/record-1/retry",
      method: "post",
    });
    expect(page.page).toEqual({ pageNum: 2, pageSize: 20, total: 1 });
  });
});
