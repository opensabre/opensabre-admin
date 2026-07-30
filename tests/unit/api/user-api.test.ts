import { beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.fn();

vi.mock("@/utils/request", () => ({
  default: requestMock,
}));

describe("UserAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads user page from organization conditions API", async () => {
    requestMock.mockResolvedValueOnce({
      records: [
        {
          id: "101",
          username: "admin",
          name: "管理员",
          mobile: "13800138000",
          gender: "M",
          groupId: "101",
          groupName: "总公司",
          roleIds: ["1", "2"],
          enabled: true,
          createdTime: "2026-06-27T10:00:00Z",
        },
      ],
      current: 2,
      size: 20,
      total: 1,
    });

    const { default: UserAPI } = await import("@/api/system/user");

    const page = await UserAPI.getPage({
      pageNum: 2,
      pageSize: 20,
      keywords: "admin",
      deptId: "101",
      createTime: ["2026-06-01", "2026-06-27"],
    });

    expect(requestMock).toHaveBeenCalledWith({
      url: "/org/user/conditions",
      method: "post",
      data: {
        current: 2,
        size: 20,
        username: "admin",
        groupId: "101",
        createdTimeStart: "2026-06-01",
        createdTimeEnd: "2026-06-27",
      },
    });
    expect(page).toEqual({
      data: [
        expect.objectContaining({
          id: "101",
          username: "admin",
          nickname: "管理员",
          mobile: "13800138000",
          gender: "M",
          deptName: "总公司",
          roleNames: "1,2",
          status: 1,
        }),
      ],
      page: {
        pageNum: 2,
        pageSize: 20,
        total: 1,
      },
    });
  });

  it("loads user form data from organization user API", async () => {
    requestMock.mockResolvedValueOnce({
      id: "101",
      username: "admin",
      name: "管理员",
      mobile: "13800138000",
      gender: "M",
      groupId: "101",
      groupName: "总公司",
      roleIds: ["1"],
      enabled: false,
    });

    const { default: UserAPI } = await import("@/api/system/user");

    const form = await UserAPI.getFormData("101");

    expect(requestMock).toHaveBeenCalledWith({
      url: "/org/user/101",
      method: "get",
    });
    expect(form).toMatchObject({
      id: "101",
      username: "admin",
      nickname: "管理员",
      mobile: "13800138000",
      gender: "M",
      deptId: "101",
      roleIds: ["1"],
      status: 0,
    });
  });

  it("loads the authenticated user instead of a fixed user ID", async () => {
    requestMock.mockResolvedValueOnce({
      id: "200",
      username: "operator",
      name: "操作员",
      roleIds: ["103"],
    });

    const { default: UserAPI } = await import("@/api/system/user");

    await expect(UserAPI.getInfo()).resolves.toMatchObject({
      id: "200",
      username: "operator",
    });
    expect(requestMock).toHaveBeenCalledWith({
      url: "/org/user/current",
      method: "get",
    });
  });

  it("creates organization user with initial password", async () => {
    requestMock.mockResolvedValueOnce(true);

    const { default: UserAPI } = await import("@/api/system/user");

    await UserAPI.create({
      username: "newuser",
      password: "123456",
      nickname: "新用户",
      mobile: "13900000000",
      gender: "F",
      deptId: "103",
      roleIds: ["101"],
      status: 1,
    });

    expect(requestMock).toHaveBeenCalledWith({
      url: "/org/user",
      method: "post",
      data: {
        username: "newuser",
        password: "123456",
        name: "新用户",
        mobile: "13900000000",
        gender: "F",
        groupId: "103",
        roleIds: ["101"],
        enabled: true,
      },
    });
  });
});
