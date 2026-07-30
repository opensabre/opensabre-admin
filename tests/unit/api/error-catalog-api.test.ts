import { beforeEach, describe, expect, it, vi } from "vitest";
const requestMock = vi.fn();
vi.mock("@/utils/request", () => ({ default: requestMock }));
describe("ErrorCatalogAPI", () => {
  beforeEach(() => vi.clearAllMocks());
  it("queries the global sysadmin error catalog", async () => {
    const { default: ErrorCatalogAPI } = await import("@/api/sysadmin/error-catalog");
    const params = {
      pageNum: 1,
      pageSize: 10,
      keywords: "020000",
      application: "base-authorization",
      deprecated: false,
    };
    await ErrorCatalogAPI.list(params);
    expect(requestMock).toHaveBeenCalledWith({
      url: "/sysadmin/error-catalog",
      method: "get",
      params,
    });
  });
});
