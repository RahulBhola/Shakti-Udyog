import { apiGet, apiPatch, apiPost, apiPut, apiUpload } from "./client";
import type { QuotationListItem, QuotationDetail, OrderListItem, OrderDetail, Paged } from "./customerApi";

/* ---- Updater-specific types ---------------------------------------------- */

export interface UpdaterRfqListItem {
  id: string;
  productType: string;
  companyName: string | null;
  quantity: string;
  status: string;
  isDraft: boolean;
  assignedToUserId: string | null;
  fileCount: number;
  createdAtUtc: string;
}

export interface UpdaterRfqDetail {
  id: string;
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  productType: string;
  materialGrade: string | null;
  quantity: string;
  deliveryLocation: string | null;
  requirementDetails: string;
  status: string;
  isDraft: boolean;
  submittedByIp: string | null;
  createdAtUtc: string;
  files: { id: string; fileName: string; contentType: string; sizeBytes: number; storageKey: string; uploadedByUserId: string | null; uploadedAtUtc: string }[];
  statusHistory: { fromStatus: string; toStatus: string; changedByRole: string; note: string | null; occurredAtUtc: string }[];
  comments: { id: string; authorUserId: string; authorRole: string; isCustomerVisible: boolean; message: string; createdAtUtc: string }[];
  assignedToUserId: string | null;
}

export interface UpdaterDashboard {
  pendingRfqs: number;
  pendingQuotations: number;
  ordersInProduction: number;
  ordersAwaitingShipment: number;
}

const base = "/api/v1/updater";

export const updaterApi = {
  // ---- Dashboard ----------------------------------------------------------

  dashboard: () => apiGet<UpdaterDashboard>(`${base}/dashboard`),

  // ---- RFQs ---------------------------------------------------------------

  rfqs: (page = 1, pageSize = 20, search?: string, status?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    return apiGet<Paged<UpdaterRfqListItem>>(`${base}/rfqs?${params}`);
  },
  rfq: (id: string) => apiGet<UpdaterRfqDetail>(`${base}/rfqs/${id}`),
  updateRfqStatus: (id: string, newStatus: string, note?: string) =>
    apiPatch<{ message: string }>(`${base}/rfqs/${id}/status`, { newStatus, note }),
  assignRfq: (id: string, assignedToUserId: string) =>
    apiPatch<{ message: string }>(`${base}/rfqs/${id}/assign`, { assignedToUserId }),
  addRfqComment: (id: string, message: string, isCustomerVisible = true) =>
    apiPost<{ id: string }>(`${base}/rfqs/${id}/comments`, { message, isCustomerVisible }),

  // ---- Quotations ---------------------------------------------------------

  quotations: (page = 1, pageSize = 20, search?: string, status?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    return apiGet<Paged<QuotationListItem>>(`${base}/quotations?${params}`);
  },
  quotation: (id: string) => apiGet<QuotationDetail>(`${base}/quotations/${id}`),
  createQuotation: (payload: Record<string, unknown>) =>
    apiPost<{ id: string }>(`${base}/quotations`, payload),
  updateQuotation: (id: string, payload: Record<string, unknown>) =>
    apiPut<{ message: string }>(`${base}/quotations/${id}`, payload),
  submitQuotation: (id: string) =>
    apiPost<{ message: string }>(`${base}/quotations/${id}/submit`),
  uploadAttachment: (id: string, file: File, description?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (description) form.append("description", description);
    return apiUpload<{ id: string; fileName: string }>(`${base}/quotations/${id}/attachments`, form);
  },
  addComment: (id: string, message: string, isCustomerVisible = true) =>
    apiPost<{ id: string; message: string }>(`${base}/quotations/${id}/comments`, { message, isCustomerVisible }),

  // ---- Orders -------------------------------------------------------------

  orders: (page = 1, pageSize = 20, search?: string, status?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    return apiGet<Paged<OrderListItem>>(`${base}/orders?${params}`);
  },
  order: (id: string) => apiGet<OrderDetail>(`${base}/orders/${id}`),
  updateMilestone: (id: string, statusCode: string, customerMessage?: string) =>
    apiPatch<{ message: string }>(`${base}/orders/${id}/milestones`, { statusCode, customerMessage }),
  createShipment: (id: string, transporter?: string, trackingNumber?: string) =>
    apiPost<{ message: string }>(`${base}/orders/${id}/shipment`, { transporter, trackingNumber }),
  uploadOrderDocument: (id: string, file: File, category: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("category", category);
    return apiUpload<{ message: string }>(`${base}/orders/${id}/documents`, form);
  },
};
