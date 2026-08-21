/**
 * Common pagination and generic API contract types.
 */

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface ApiResponse<T = void> {
  message?: string;
  data?: T;
  traceId?: string;
}

export interface MessageResponse {
  message: string;
}

export interface DateRange {
  from?: string | null;
  to?: string | null;
}

export interface KeyValue<T = string> {
  key: string;
  value: T;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface FilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortDescending?: boolean;
}
