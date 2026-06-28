import { beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.fn();

vi.mock("@/utils/request", () => ({
  default: requestMock,
}));

describe("AuditLogAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads audit log page from sysadmin audit log API", async () => {
    requestMock.mockResolvedValueOnce({
      records: [{ id: "1", module: "user", operatorUsername: "admin" }],
      current: 1,
      size: 10,
      total: 1,
    });

    const { default: AuditLogAPI } = await import("@/api/sysadmin/audit-log");

    const page = await AuditLogAPI.getPage({
      pageNum: 1,
      pageSize: 10,
      module: "user",
      operationTimeRange: ["2026-01-01", "2026-01-31"],
    });

    expect(requestMock).toHaveBeenCalledWith({
      url: "/api/sysadmin/audit/log/conditions",
      method: "post",
      data: {
        current: 1,
        size: 10,
        operationType: undefined,
        operatorUsername: undefined,
        module: "user",
        clientIp: undefined,
        targetKey: undefined,
        operationStartTime: "2026-01-01",
        operationEndTime: "2026-01-31",
      },
    });
    expect(page.page).toEqual({ pageNum: 1, pageSize: 10, total: 1 });
    expect(page.data).toEqual([expect.objectContaining({ id: "1", module: "user" })]);
  });
});
