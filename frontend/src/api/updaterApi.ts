import { apiGet, apiPatch, apiPost, apiPut, apiUpload } from "./client";
import type { QuotationListItem, QuotationDetail, OrderListItem, OrderDetail, Paged } from "./customerApi";

const base = "/api/v1/updater";

export const updaterApi = {
  quotations: (page = 1, pageSize = 20, search?: string, status?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    return apiGet<Paged<QuotationListItem>>(`${base}/quotations?${params}`);
  },
  quotation: (id: string) => apiGet<QuotationDetail>(`${base}/quotations/${id}`),
  createQuotation: (payload: {
    rfqId: string;
    companyId: string;
    currency: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    validUntilUtc?: string;
    paymentTerms?: string;
    deliveryTerms?: string;
    freight?: string;
    packing?: string;
    remarks?: string;
    items: {
      lineNumber: number;
      partNumber: string;
      description: string;
      materialGrade?: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      taxPercent: number;
    }[];
  }) => apiPost<{ id: string }>(`${base}/quotations`, payload),
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

  // ---- Orders ---------------------------------------------------------------

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
