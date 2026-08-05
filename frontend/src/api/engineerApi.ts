import { apiGet, apiPatch, apiPost, apiPut, apiUpload, apiDelete } from "./client";
import type { QuotationListItem, QuotationDetail, OrderListItem, OrderDetail, Paged } from "./customerApi";

/* ---- Updater-specific types ---------------------------------------------- */

export interface EngineerEnquiryListItem {
  id: string;
  productType: string;
  companyName: string | null;
  quantity: string;
  status: string;
  isDraft: boolean;
  assignedToUserId: string | null;
  fileCount: number;
  createdAtUtc: string;
  priority: string;
  firstFileId: string | null;
  firstFileContentType: string | null;
}

export interface EngineerEnquiryDetail {
  id: string;
  companyId: string;
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
  priority: string;
  partName: string | null;
  partNumber: string | null;
  industry: string | null;
  application: string | null;
  materialStandard: string | null;
  approxWeight: number | null;
  machiningRequired: string | null;
  patternAvailability: string | null;
  prototypeQuantity: string | null;
  productionQuantity: string | null;
  annualRequirement: string | null;
  expectedDeliveryDate: string | null;
  preferredDeliveryTerms: string | null;
  additionalRequirements: string | null;
  remarks: string | null;
  hasDraftQuotation: boolean;
  draftQuotationId: string | null;
}

export interface EngineerDashboard {
  pendingEnquiries: number;
  pendingQuotations: number;
  ordersInProduction: number;
  ordersAwaitingShipment: number;
}

const base = "/api/v1/engineer";

export const engineerApi = {
  // ---- Dashboard ----------------------------------------------------------

  dashboard: () => apiGet<EngineerDashboard>(`${base}/dashboard`),

  // ---- Enquiries ---------------------------------------------------------------

  enquiries: (page = 1, pageSize = 20, search?: string, status?: string, companyId?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (companyId) params.set("companyId", companyId);
    return apiGet<Paged<EngineerEnquiryListItem>>(`${base}/enquiries?${params}`);
  },
  enquiry: (id: string) => apiGet<EngineerEnquiryDetail>(`${base}/enquiries/${id}`),
  updateEnquiryStatus: (id: string, newStatus: string, note?: string) =>
    apiPatch<{ message: string }>(`${base}/enquiries/${id}/status`, { newStatus, note }),
  assignEnquiry: (id: string, assignedToUserId: string) =>
    apiPatch<{ message: string }>(`${base}/enquiries/${id}/assign`, { assignedToUserId }),
  addEnquiryComment: (id: string, message: string, isCustomerVisible = true) =>
    apiPost<{ id: string }>(`${base}/enquiries/${id}/comments`, { message, isCustomerVisible }),

  // ---- Quotes ---------------------------------------------------------

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

  orders: (page = 1, pageSize = 20, search?: string, status?: string, companyId?: string, assigned?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (companyId) params.set("companyId", companyId);
    if (assigned) params.set("assigned", assigned);
    return apiGet<Paged<OrderListItem>>(`${base}/orders?${params}`);
  },
  order: (id: string) => apiGet<OrderDetail>(`${base}/orders/${id}`),
  updateMilestone: (id: string, statusCode: string, customerMessage?: string) =>
    apiPatch<{ message: string }>(`${base}/orders/${id}/milestones`, { statusCode, customerMessage }),
  createShipment: (id: string, transporter?: string, vehicleNumber?: string, phoneNumber?: string, dispatchDateUtc?: string, estimatedArrivalUtc?: string) =>
    apiPost<{ message: string }>(`${base}/orders/${id}/shipment`, { transporter, vehicleNumber, phoneNumber, dispatchDateUtc, estimatedArrivalUtc }),
  updateShipment: (orderId: string, shipmentId: string, transporter?: string, vehicleNumber?: string, phoneNumber?: string, dispatchDateUtc?: string, estimatedArrivalUtc?: string) =>
    apiPatch<{ message: string }>(`${base}/orders/${orderId}/shipments/${shipmentId}`, { transporter, vehicleNumber, phoneNumber, dispatchDateUtc, estimatedArrivalUtc }),
  deleteShipment: (orderId: string, shipmentId: string) =>
    apiDelete<{ message: string }>(`${base}/orders/${orderId}/shipments/${shipmentId}`),
  uploadOrderDocument: (id: string, file: File, category: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("category", category);
    return apiUpload<{ message: string }>(`${base}/orders/${id}/documents`, form);
  },
  getOrderComments: (id: string) => apiGet<{authorRole: string; authorName: string | null; message: string; createdAtUtc: string}[]>(`${base}/orders/${id}/comments`),
  addOrderComment: (id: string, message: string) =>
    apiPost<{ message: string }>(`${base}/orders/${id}/comments`, { message, isCustomerVisible: true }),
};
