/**
 * 通用 API 类型定义
 */

/**
 * OpenSabre 框架 API 响应规范
 *
 * 所有接口统一返回如下结构：
 * ```json
 * {
 *   "code": "000000",
 *   "mesg": "处理成功",
 *   "time": "2026-02-04T23:31:05.569Z",
 *   "data": 数据值或对象
 * }
 * ```
 *
 * @note
 * - code: 成功固定为 "000000"（6个0）
 * - mesg: 响应消息字段名为 "mesg"（注意不是 "msg"）
 * - time: ISO 8601 格式的时间戳
 * - data: 实际业务数据
 */
export interface ApiResponse<T = any> {
  /** 响应码 */
  code: string;
  /** 响应数据 */
  data: T;
  /** 响应消息（注意：OpenSabre 使用 "mesg" 字段名，不是 "msg"） */
  msg?: string;
  mesg?: string;
  /** 响应时间（ISO 8601 格式） */
  time?: string;

  /** 分页信息（非列表接口通常不存在该字段） */
  page?: PageMeta | null;
}

/** 基础查询参数 */
export interface BaseQueryParams {
  /** 页码 */
  pageNum: number;
  /** 每页记录数 */
  pageSize: number;

  /** 排序字段 */
  sortBy?: string;

  /** 排序方式（正序:ASC；反序:DESC） */
  order?: string;
}

/** 分页元信息 */
export interface PageMeta {
  pageNum: number;
  pageSize: number;
  total: number;
}

/** 列表响应结构（统一） */
export interface PageResult<T> {
  /** 数据列表 */
  data: T[];

  /** 分页信息，不分页时为 null */
  page: PageMeta | null;
}

/** 下拉选项 */
export interface OptionItem {
  /** 选项值 */
  value: string | number;
  /** 选项标签 */
  label: string;
  /** 子选项 */
  children?: OptionItem[];
}

/** Excel 导入结果 */
export interface ExcelResult {
  /** 响应码 */
  code: string;
  /** 无效数据数量 */
  invalidCount: number;
  /** 有效数据数量 */
  validCount: number;
  /** 错误信息列表 */
  messageList: string[];
}
