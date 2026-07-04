/**
 * 认证相关类型定义
 */

/**
 * 登录请求参数
 */
export interface LoginRequest {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 验证码缓存key */
  captchaId?: string;
  /** 验证码 */
  captchaCode?: string;
  /** 记住我 */
  rememberMe?: boolean;
  /** 租户ID */
  tenantId?: number;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  /** 访问令牌 */
  accessToken: string;
  /** 刷新令牌 */
  refreshToken: string;
  /** 令牌类型 */
  tokenType: string;
  /** 过期时间(单位:秒) */
  expiresIn: number;
}

/**
 * 业务场景枚举
 */
export enum CaptchaScenario {
  /** 登录图片验证码 */
  LOGIN_IMAGE = "LOGIN_IMAGE",
  /** 注册图片验证码 */
  REGISTER_IMAGE = "REGISTER_IMAGE",
  /** 登录短信验证码 */
  LOGIN_SMS = "LOGIN_SMS",
  /** 登录邮件验证码 */
  LOGIN_EMAIL = "LOGIN_EMAIL",
}

/**
 * 验证码响应
 */
export interface CaptchaInfo {
  /** 验证码缓存key */
  captchaId: string;
  /** 验证码图片Base64 */
  imageData: string;
  /** 过期时间(单位:秒) */
  expireTime: number;
}

/**
 * OAuth2 配置
 */
export interface OAuth2Config {
  /** 授权地址 */
  authorizeUrl: string;
}
