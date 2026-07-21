import { apiGet, apiPatch } from "./client";
import type { QuotationListItem, QuotationDetail, QuotationTimelineEntry, OrderListItem, OrderDetail, Paged } from "./customerApi";

const base = "/api/v1/admin";

export const adminApi = {
  quotations: (page = 1, pageSize = 20, search?: string, status?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    return apiGet<Paged<QuotationListItem>>(`${base}/quotations?${params}`);
  },
  quotation: (id: string) => apiGet<QuotationDetail>(`${base}/quotations/${id}`),
  approveQuotation: (id: string) => apiPatch<{ message: string }>(`${base}/quotations/${id}/approve`, {}),
  rejectQuotation: (id: string, reason: string) =>
    apiPatch<{ message: string }>(`${base}/quotations/${id}/reject`, reason),
  issueQuotation: (id: string) => apiPatch<{ message: string }>(`${base}/quotations/${id}/issue`, {}),
  cancelQuotation: (id: string) => apiPatch<{ message: string }>(`${base}/quotations/${id}/cancel`, {}),
  overrideStatus: (id: string, newStatus: string, note?: string) =>
    apiPatch<{ message: string }>(`${base}/quotations/${id}/override-status`, { newStatus, note }),
  history: (id: string) => apiGet<QuotationTimelineEntry[]>(`${base}/quotations/${id}/history`),

  // ---- Orders ---------------------------------------------------------------

  orders: (page = 1, pageSize = 20, search?: string, status?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    return apiGet<Paged<OrderListItem>>(`${base}/orders?${params}`);
  },
  order: (id: string) => apiGet<OrderDetail>(`${base}/orders/${id}`),
  approveOrderUpdate: (id: string) => apiPatch<{ message: string }>(`${base}/orders/${id}/approve-update`, {}),
  overrideOrderStatus: (id: string, newStatus: string, note?: string) =>
    apiPatch<{ message: string }>(`${base}/orders/${id}/override-status`, { newStatus, note }),
  cancelOrder: (id: string, reason: string) =>
    apiPatch<{ message: string }>(`${base}/orders/${id}/cancel`, reason),
  orderHistory: (id: string) => apiGet<{ fromStatus: string; toStatus: string; changedByRole: string; note: string | null; occurredAtUtc: string }[]>(`${base}/orders/${id}/history`),
};
