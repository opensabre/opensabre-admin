/**
 * Position 岗位类型定义
 */

/** 岗位查询参数 */
export interface PositionQueryParams {
  name?: string;
}

/** 岗位列表对象 */
export interface PositionItem {
  id?: string;
  name?: string;
  description?: string;
  createdTime?: string;
  updatedTime?: string;
}

/** 岗位表单对象 */
export interface PositionForm {
  id?: string;
  name?: string;
  description?: string;
}
