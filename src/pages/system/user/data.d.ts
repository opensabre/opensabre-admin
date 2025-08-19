export type TableListItem = {
  id: number;
  userId: string;
  username: string;
  name: string;
  mobile: string;
  description: string;
  status: string;
  updatedTime: Date;
  createdTime: Date;
  updatedBy: string;
  createdBy: string;
};

export type TableListPagination = {
  total: number;
  pageSize: number;
  current: number;
};

export type TableListData = {
  list: TableListItem[];
  pagination: Partial<TableListPagination>;
};

export type TableListParams = {
  id?: string;
  name?: string;
  username?: string;
  pageSize?: number;
  currentPage?: number;
  filter?: Record<string, any[]>;
  sorter?: Record<string, any>;
};
