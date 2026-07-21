/** Centrally registered framework or application error code. */
export interface ErrorCatalogItem {
  id?: string;
  code: string;
  defaultMessage: string;
  sourceApplication: string;
  module: string;
  sourceVersion?: string;
  httpStatus?: number;
  publicVisible: boolean;
  deprecated: boolean;
  description?: string;
}
