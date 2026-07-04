/**
 * Resource 资源类型定义
 */

import type { BaseQueryParams } from "./common";

/** 资源分页查询参数 */
export interface ResourceQueryParams extends BaseQueryParams {
  name?: string;
  code?: string;
  url?: string;
  method?: string;
}

/** 资源分页对象 */
export interface ResourceItem {
  id?: string;
  name?: string;
  code?: string;
  type?: string;
  url?: string;
  method?: string;
  description?: string;
  createdTime?: string;
  updatedTime?: string;
}

/** 资源表单对象 */
export interface ResourceForm {
  id?: string;
  name?: string;
  code?: string;
  type?: string;
  url?: string;
  method?: string;
  description?: string;
}
