import { apiGet, apiPatch, apiPost, apiPut, apiDelete } from "./client";
import type { QuotationListItem, QuotationDetail, QuotationTimelineEntry, OrderListItem, OrderDetail, InvoiceListItem, InvoiceDetail, Paged } from "./customerApi";

const base = "/api/v1/admin";

/** Generic types for admin content management. */
export interface AdminProduct {
  id: string; title: string; slug: string; summary: string; description: string | null;
  commonGrades: string | null; castingWeightRange: string | null; availableFinish: string | null;
  categoryId: string | null; isPublished: boolean; sortOrder: number; createdAtUtc: string;
  updatedAtUtc: string | null;
}
export interface AdminCategory { id: string; name: string; slug: string | null; description: string | null; parentId: string | null; displayOrder: number; isVisible: boolean; }
export interface AdminIndustry { id: string; name: string; description: string | null; exampleComponents: string | null; isActive: boolean; displayOrder: number; }

export const adminApi = {
  // ---- Quotations ---------------------------------------------------------
  quotations: (page = 1, pageSize = 20, search?: string, status?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set("search", search); if (status) params.set("status", status);
    return apiGet<Paged<QuotationListItem>>(`${base}/quotations?${params}`);
  },
  quotation: (id: string) => apiGet<QuotationDetail>(`${base}/quotations/${id}`),
  approveQuotation: (id: string) => apiPatch<{ message: string }>(`${base}/quotations/${id}/approve`, {}),
  rejectQuotation: (id: string, reason: string) => apiPatch<{ message: string }>(`${base}/quotations/${id}/reject`, reason),
  issueQuotation: (id: string) => apiPatch<{ message: string }>(`${base}/quotations/${id}/issue`, {}),
  cancelQuotation: (id: string) => apiPatch<{ message: string }>(`${base}/quotations/${id}/cancel`, {}),
  overrideStatus: (id: string, newStatus: string, note?: string) => apiPatch<{ message: string }>(`${base}/quotations/${id}/override-status`, { newStatus, note }),
  history: (id: string) => apiGet<QuotationTimelineEntry[]>(`${base}/quotations/${id}/history`),

  // ---- Orders -------------------------------------------------------------
  orders: (page = 1, pageSize = 20, search?: string, status?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set("search", search); if (status) params.set("status", status);
    return apiGet<Paged<OrderListItem>>(`${base}/orders?${params}`);
  },
  order: (id: string) => apiGet<OrderDetail>(`${base}/orders/${id}`),
  approveOrderUpdate: (id: string) => apiPatch<{ message: string }>(`${base}/orders/${id}/approve-update`, {}),
  overrideOrderStatus: (id: string, newStatus: string, note?: string) => apiPatch<{ message: string }>(`${base}/orders/${id}/override-status`, { newStatus, note }),
  cancelOrder: (id: string, reason: string) => apiPatch<{ message: string }>(`${base}/orders/${id}/cancel`, reason),
  orderHistory: (id: string) => apiGet<{ fromStatus: string; toStatus: string; changedByRole: string; note: string | null; occurredAtUtc: string }[]>(`${base}/orders/${id}/history`),

  // ---- Invoices -----------------------------------------------------------
  invoices: (page = 1, pageSize = 20, status?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) params.set("status", status);
    return apiGet<Paged<InvoiceListItem>>(`${base}/invoices?${params}`);
  },
  invoice: (id: string) => apiGet<InvoiceDetail>(`${base}/invoices/${id}`),
  createInvoice: (payload: { orderId?: string; companyId: string; subtotal: number; tax: number; total: number; issueDate: string; dueDate?: string; currency: string }) =>
    apiPost<InvoiceDetail>(`${base}/invoices`, payload),

  // ---- Products -----------------------------------------------------------
  products: () => apiGet<AdminProduct[]>(`${base}/products`),
  product: (id: string) => apiGet<AdminProduct>(`${base}/products/${id}`),
  createProduct: (payload: { title: string; slug: string; summary: string; description?: string; categoryId?: string; isPublished: boolean }) =>
    apiPost<AdminProduct>(`${base}/products`, payload),
  updateProduct: (id: string, payload: Record<string, unknown>) => apiPut<{ message: string }>(`${base}/products/${id}`, payload),
  deleteProduct: (id: string) => apiDelete<{ message: string }>(`${base}/products/${id}`),

  // ---- Categories ---------------------------------------------------------
  categories: () => apiGet<AdminCategory[]>(`${base}/categories`),
  createCategory: (payload: { name: string; slug?: string; description?: string; parentId?: string }) =>
    apiPost<AdminCategory>(`${base}/categories`, payload),
  updateCategory: (id: string, payload: { name: string; description?: string; displayOrder: number; isVisible: boolean }) =>
    apiPut<{ message: string }>(`${base}/categories/${id}`, payload),

  // ---- Industries ---------------------------------------------------------
  industries: () => apiGet<AdminIndustry[]>(`${base}/industries`),
  createIndustry: (payload: { name: string; description?: string; exampleComponents?: string }) =>
    apiPost<AdminIndustry>(`${base}/industries`, payload),
  updateIndustry: (id: string, payload: { name: string; description?: string; isActive: boolean }) =>
    apiPut<{ message: string }>(`${base}/industries/${id}`, payload),

  // ---- Resources -----------------------------------------------------------
  resources: () => apiGet<{ id: string; title: string; slug: string; summary: string; category: string | null; isPublished: boolean; createdAtUtc: string }[]>(`${base}/resources`),
  createResource: (payload: { title: string; slug: string; summary: string; body?: string; category?: string }) =>
    apiPost<{ id: string }>(`${base}/resources`, payload),
  updateResource: (id: string, payload: { title: string; summary: string; body?: string; isPublished: boolean }) =>
    apiPut<{ message: string }>(`${base}/resources/${id}`, payload),

  // ---- FAQs -----------------------------------------------------------------
  faqs: () => apiGet<{ id: string; question: string; answer: string; category: string | null; isPublished: boolean; displayOrder: number }[]>(`${base}/faqs`),
  createFaq: (payload: { question: string; answer: string; category?: string }) =>
    apiPost<{ id: string }>(`${base}/faqs`, payload),
  updateFaq: (id: string, payload: { question: string; answer: string; isPublished: boolean }) =>
    apiPut<{ message: string }>(`${base}/faqs/${id}`, payload),

  // ---- Gallery --------------------------------------------------------------
  gallery: () => apiGet<{ id: string; fileName: string; caption: string | null; album: string | null; isVisible: boolean }[]>(`${base}/gallery`),
  deleteGalleryItem: (id: string) => apiDelete<{ message: string }>(`${base}/gallery/${id}`),
};
