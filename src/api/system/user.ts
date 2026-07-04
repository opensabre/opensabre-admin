import request from "@/utils/request";
import type {
  UserInfo,
  UserForm,
  UserQueryParams,
  UserItem,
  UserProfileDetail,
  UserProfileForm,
  PasswordChangeForm,
  PasswordVerifyForm,
  MobileUpdateForm,
  EmailUpdateForm,
  OptionItem,
} from "@/types/api";

const USER_BASE_URL = "/v1/users";
const ORG_USER_BASE_URL = "/org/user";

interface OrgUser {
  id?: string;
  username?: string;
  name?: string;
  mobile?: string;
  description?: string;
  gender?: string;
  groupId?: string;
  groupName?: string;
  roleIds?: Array<number | string> | Set<number | string>;
  enabled?: boolean;
  createdTime?: Date;
  updatedTime?: Date;
}

interface OrgPage<T> {
  records?: T[];
  current?: number;
  size?: number;
  total?: number;
}

function toUserItem(user: OrgUser): UserItem {
  return {
    id: String(user.id ?? ""),
    username: user.username,
    nickname: user.name,
    mobile: user.mobile,
    gender: user.gender,
    deptName: user.groupName,
    roleNames: Array.isArray(user.roleIds) ? user.roleIds.join(",") : undefined,
    status: user.enabled === false ? 0 : 1,
    createTime: user.createdTime,
  };
}

function toUserForm(user: OrgUser): UserForm {
  return {
    id: user.id,
    username: user.username,
    nickname: user.name,
    mobile: user.mobile,
    gender: user.gender,
    deptId: user.groupId,
    roleIds: Array.from(user.roleIds ?? []).map(String),
    status: user.enabled === false ? 0 : 1,
  };
}

function toOrgUserForm(data: UserForm) {
  return {
    username: data.username,
    password: data.password || undefined,
    name: data.nickname || data.username,
    mobile: data.mobile,
    gender: data.gender,
    groupId: data.deptId,
    roleIds: data.roleIds?.map(String),
    enabled: data.status !== 0,
  };
}

function toOrgUserQuery(queryParams: UserQueryParams) {
  const [createdTimeStart, createdTimeEnd] = queryParams.createTime ?? [];
  return {
    current: queryParams.pageNum,
    size: queryParams.pageSize,
    username: queryParams.keywords || undefined,
    groupId: queryParams.deptId || undefined,
    createdTimeStart,
    createdTimeEnd,
  };
}

const UserAPI = {
  /**
   * 获取当前登录用户信息
   *
   * @returns 登录用户昵称、头像信息，包括角色和权限
   */
  getInfo() {
    return request<any, UserInfo>({
      url: `${ORG_USER_BASE_URL}/101`,
      method: "get",
    });
  },

  /**
   * 获取用户分页列表
   *
   * @param queryParams 查询参数
   */
  getPage(queryParams: UserQueryParams) {
    return request<any, OrgPage<OrgUser>>({
      url: `${ORG_USER_BASE_URL}/conditions`,
      method: "post",
      data: toOrgUserQuery(queryParams),
    }).then((page) => ({
      data: (page.records ?? []).map(toUserItem),
      page: {
        pageNum: page.current ?? queryParams.pageNum,
        pageSize: page.size ?? queryParams.pageSize,
        total: page.total ?? 0,
      },
    }));
  },

  /**
   * 获取用户表单详情
   *
   * @param userId 用户ID
   * @returns 用户表单详情
   */
  getFormData(userId: string) {
    return request<any, OrgUser>({
      url: `${ORG_USER_BASE_URL}/${userId}`,
      method: "get",
    }).then(toUserForm);
  },

  /**
   * 添加用户
   *
   * @param data 用户表单数据
   */
  create(data: UserForm) {
    return request({
      url: `${ORG_USER_BASE_URL}`,
      method: "post",
      data: toOrgUserForm(data),
    });
  },

  /**
   * 修改用户
   *
   * @param id 用户ID
   * @param data 用户表单数据
   */
  update(id: string, data: UserForm) {
    return request({
      url: `${ORG_USER_BASE_URL}/${id}`,
      method: "put",
      data: toOrgUserForm(data),
    });
  },

  /**
   * 修改用户密码
   *
   * @param id 用户ID
   * @param password 新密码
   */
  async resetPassword(id: string, password: string) {
    const user = await request<any, OrgUser>({
      url: `${ORG_USER_BASE_URL}/${id}`,
      method: "get",
    });
    return request({
      url: `${ORG_USER_BASE_URL}/${id}`,
      method: "put",
      data: {
        ...user,
        password,
      },
    });
  },

  /**
   * 批量删除用户，多个以英文逗号(,)分割
   *
   * @param ids 用户ID字符串，多个以英文逗号(,)分割
   */
  deleteByIds(ids: string) {
    return Promise.all(
      ids
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .map((id) =>
          request({
            url: `${ORG_USER_BASE_URL}/${id}`,
            method: "delete",
          })
        )
    );
  },

  /** 下载用户导入模板 */
  downloadTemplate() {
    return request({
      url: `${USER_BASE_URL}/template`,
      method: "get",
      responseType: "blob",
    });
  },

  /**
   * 导出用户
   *
   * @param queryParams 查询参数
   */
  export(queryParams: UserQueryParams) {
    return request({
      url: `${USER_BASE_URL}/export`,
      method: "get",
      params: queryParams,
      responseType: "blob",
    });
  },

  /**
   * 导入用户
   *
   * @param deptId 部门ID
   * @param file 导入文件
   */
  import(deptId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return request<any, ExcelResult>({
      url: `${USER_BASE_URL}/import`,
      method: "post",
      params: { deptId },
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /** 获取个人中心用户信息 */
  getProfile() {
    return request<any, UserProfileDetail>({
      url: `${USER_BASE_URL}/profile`,
      method: "get",
    });
  },

  /** 修改个人中心用户信息 */
  updateProfile(data: UserProfileForm) {
    return request({
      url: `${USER_BASE_URL}/profile`,
      method: "put",
      data,
    });
  },

  /** 修改个人中心用户密码 */
  changePassword(data: PasswordChangeForm) {
    return request({
      url: `${USER_BASE_URL}/password`,
      method: "put",
      data,
    });
  },

  /** 发送短信验证码（绑定或更换手机号）*/
  sendMobileCode(mobile: string) {
    return request({
      url: `${USER_BASE_URL}/mobile/code`,
      method: "post",
      params: { mobile },
    });
  },

  /** 绑定或更换手机号 */
  bindOrChangeMobile(data: MobileUpdateForm) {
    return request({
      url: `${USER_BASE_URL}/mobile`,
      method: "put",
      data,
    });
  },

  /** 解绑手机号 */
  unbindMobile(data: PasswordVerifyForm) {
    return request({
      url: `${USER_BASE_URL}/mobile`,
      method: "delete",
      data,
    });
  },

  /** 发送邮箱验证码（绑定或更换邮箱）*/
  sendEmailCode(email: string) {
    return request({
      url: `${USER_BASE_URL}/email/code`,
      method: "post",
      params: { email },
    });
  },

  /** 绑定或更换邮箱 */
  bindOrChangeEmail(data: EmailUpdateForm) {
    return request({
      url: `${USER_BASE_URL}/email`,
      method: "put",
      data,
    });
  },

  /** 解绑邮箱 */
  unbindEmail(data: PasswordVerifyForm) {
    return request({
      url: `${USER_BASE_URL}/email`,
      method: "delete",
      data,
    });
  },

  /**
   *  获取用户下拉列表
   */
  getOptions() {
    return request<any, OptionItem[]>({
      url: `${USER_BASE_URL}/options`,
      method: "get",
    });
  },
};

export default UserAPI;
