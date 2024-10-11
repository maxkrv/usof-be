export interface SuccessResponse {
  success: boolean;
}

export interface Pagination {
  page: number;
  total: number;
}

export interface DataWithPagination<T> {
  data: T[];
  pagination: Pagination;
}
