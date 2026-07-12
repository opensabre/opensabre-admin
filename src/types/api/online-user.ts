/**
 * 在线用户类型定义
 */

export interface OnlineUserQueryParams {
  username?: string;
}

export interface OnlineUserItem {
  sessionId?: string;
  username?: string;
  displayName?: string;
  ip?: string;
  userAgent?: string;
  authenticationType?: string;
  loginTime?: string;
  lastAccessTime?: string;
}
