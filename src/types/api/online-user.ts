/**
 * 在线用户类型定义
 */

export interface OnlineUserQueryParams {
  pageNum: number;
  pageSize: number;
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
