import { beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.fn();

vi.mock("@/utils/request", () => ({
  default: requestMock,
}));

describe("PositionAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads positions from organization position API", async () => {
    requestMock.mockResolvedValueOnce([{ id: "101", name: "首席执行官" }]);

    const { default: PositionAPI } = await import("@/api/system/position");

    const data = await PositionAPI.getList({ name: "首席" });

    expect(requestMock).toHaveBeenCalledWith({
      url: "/org/position",
      method: "get",
      params: { name: "首席" },
    });
    expect(data).toEqual([expect.objectContaining({ id: "101", name: "首席执行官" })]);
  });

  it("loads all positions without blank name parameter", async () => {
    requestMock.mockResolvedValueOnce([{ id: "102", name: "首席技术官" }]);

    const { default: PositionAPI } = await import("@/api/system/position");

    const data = await PositionAPI.getList({ name: " " });

    expect(requestMock).toHaveBeenCalledWith({
      url: "/org/position",
      method: "get",
      params: undefined,
    });
    expect(data).toEqual([expect.objectContaining({ id: "102", name: "首席技术官" })]);
  });
});
