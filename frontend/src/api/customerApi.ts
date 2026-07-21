import { apiGet, apiPost, apiPatch, apiDelete, apiUpload } from "./client";

/* ---- Types mirroring backend Contracts/Customer ---------------------------- */

export interface Dashboard {
  openRfqs: number;
  activeQuotations: number;
  activeOrders: number;
  unpaidInvoices: number;
  unreadNotifications: number;
  recentActivity: { type: string; title: string; linkPath: string | null; occurredAtUtc: string }[];
  recentDocuments: DocumentItem[];
}

export interface RfqListItem {
  id: string;
  productType: string;
  quantity: string;
  status: string;
  isDraft: boolean;
  fileCount: number;
  createdAtUtc: string;
}

export interface RfqDetail extends RfqListItem {
  fullName: string;
  companyName: string;
  materialGrade: string | null;
  deliveryLocation: string | null;
  requirementDetails: string;
  files: { id: string; fileName: string; sizeBytes: number; uploadedAtUtc: string }[];
}

export interface QuotationListItem {
  id: string;
  quotationNumber: string;
  revisionNumber: number;
  rfqId: string;
  productType: string;
  total: number;
  currency: string;
  status: string;
  validUntilUtc: string | null;
  createdAtUtc: string;
}

export interface QuotationItem {
  lineNumber: number;
  partNumber: string;
  description: string;
  materialGrade: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxPercent: number;
  lineTotal: number;
}

export interface QuotationDetail extends QuotationListItem {
  revisionNumber: number;
  subtotal: number;
  tax: number;
  discount: number;
  paymentTerms: string | null;
  deliveryTerms: string | null;
  freight: string | null;
  packing: string | null;
  remarks: string | null;
  customerResponseComment: string | null;
  customerRespondedAtUtc: string | null;
  documentId: string | null;
  items: QuotationItem[];
}

export interface QuotationTimelineEntry {
  fromStatus: string;
  toStatus: string;
  changedByRole: string;
  note: string | null;
  occurredAtUtc: string;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  statusLabel: string;
  placedAtUtc: string;
  promisedDispatchDateUtc: string | null;
  totalQuantity: number;
  lastUpdatedAtUtc: string;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  purchaseOrderReference: string | null;
  status: string;
  statusLabel: string;
  statusDescription: string;
  placedAtUtc: string;
  promisedDispatchDateUtc: string | null;
  deliveryAddress: string | null;
  lastUpdatedAtUtc: string;
  items: {
    partNumber: string;
    description: string;
    materialGrade: string | null;
    drawingRevision: string | null;
    unit: string;
    quantityOrdered: number;
    quantityProduced: number;
    quantityDispatched: number;
  }[];
  shipments: Shipment[];
  commercial: {
    invoiceNumber: string | null;
    invoiceDateUtc: string | null;
    dueDateUtc: string | null;
    total: number | null;
    amountPaid: number | null;
    balanceDue: number | null;
    paymentStatus: string | null;
  } | null;
  documents: DocumentItem[];
}

export interface Shipment {
  id: string;
  transporter: string | null;
  trackingNumber: string | null;
  dispatchDateUtc: string | null;
  estimatedArrivalUtc: string | null;
  deliveredAtUtc: string | null;
  hasProofOfDelivery: boolean;
}

export interface TimelineEntry {
  statusCode: string;
  statusLabel: string;
  message: string | null;
  actorType: string;
  occurredAtUtc: string;
}

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  orderNumber: string | null;
  issueDateUtc: string;
  dueDateUtc: string | null;
  total: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  status: string;
}

export interface InvoiceDetail extends InvoiceListItem {
  subtotal: number;
  tax: number;
  documentId: string | null;
  payments: Payment[];
}

export interface Payment {
  id: string;
  paymentReference: string;
  method: string;
  amount: number;
  paymentDateUtc: string;
  status: string;
  createdAtUtc: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  fileName: string;
  sizeBytes: number;
  orderNumber: string | null;
  createdAtUtc: string;
}

export interface RfqTimelineEntry {
  fromStatus: string;
  toStatus: string;
  changedByRole: string;
  note: string | null;
  occurredAtUtc: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  linkPath: string | null;
  isRead: boolean;
  createdAtUtc: string;
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface Profile {
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  company: {
    name: string;
    addressLine1: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
    gstNumber: string | null;
    deliveryAddresses: string | null;
  } | null;
  mfaEnabled: boolean;
}

/* ---- Calls ------------------------------------------------------------------ */

const base = "/api/v1/customer";

export const customerApi = {
  dashboard: () => apiGet<Dashboard>(`${base}/dashboard`),

  rfqs: (page = 1, pageSize = 20, search?: string, status?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    return apiGet<Paged<RfqListItem>>(`${base}/rfqs?${params}`);
  },
  rfq: (id: string) => apiGet<RfqDetail>(`${base}/rfqs/${id}`),
  createRfq: (payload: {
    productType: string;
    materialGrade?: string;
    quantity: string;
    deliveryLocation?: string;
    requirementDetails: string;
    saveAsDraft: boolean;
  }) => apiPost<{ id: string }>(`${base}/rfqs`, payload),
  updateRfq: (id: string, payload: {
    productType?: string;
    materialGrade?: string;
    quantity?: string;
    deliveryLocation?: string;
    requirementDetails?: string;
  }) => apiPatch<{ message: string }>(`${base}/rfqs/${id}`, payload),
  deleteRfq: (id: string) => apiDelete<{ message: string }>(`${base}/rfqs/${id}`),
  submitRfq: (id: string) => apiPost<{ message: string }>(`${base}/rfqs/${id}/submit`),
  rfqTimeline: (id: string) => apiGet<RfqTimelineEntry[]>(`${base}/rfqs/${id}/timeline`),
  uploadRfqFile: (rfqId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiUpload<{ id: string; fileName: string }>(`${base}/rfqs/${rfqId}/files`, form);
  },

  quotations: () => apiGet<QuotationListItem[]>(`${base}/quotations`),
  quotation: (id: string) => apiGet<QuotationDetail>(`${base}/quotations/${id}`),
  quotationTimeline: (id: string) => apiGet<QuotationTimelineEntry[]>(`${base}/quotations/${id}/timeline`),
  respondToQuotation: (id: string, response: "accept" | "decline", comment?: string) =>
    apiPost<{ message: string }>(`${base}/quotations/${id}/response`, { response, comment }),

  orders: () => apiGet<OrderListItem[]>(`${base}/orders`),
  order: (id: string) => apiGet<OrderDetail>(`${base}/orders/${id}`),
  orderTimeline: (id: string) => apiGet<TimelineEntry[]>(`${base}/orders/${id}/timeline`),
  createSupportRequest: (orderId: string, subject: string, message: string) =>
    apiPost<{ id: string }>(`${base}/orders/${orderId}/support-requests`, { subject, message }),

  invoices: () => apiGet<InvoiceListItem[]>(`${base}/invoices`),
  invoice: (id: string) => apiGet<InvoiceDetail>(`${base}/invoices/${id}`),

  payments: () => apiGet<Payment[]>(`${base}/payments`),
  submitPaymentProof: (payload: {
    invoiceId: string;
    paymentReference: string;
    method: string;
    amount: number;
    paymentDateUtc: string;
    proofFile?: File;
  }) => {
    const form = new FormData();
    form.append("InvoiceId", payload.invoiceId);
    form.append("PaymentReference", payload.paymentReference);
    form.append("Method", payload.method);
    form.append("Amount", String(payload.amount));
    form.append("PaymentDateUtc", payload.paymentDateUtc);
    if (payload.proofFile) form.append("proofFile", payload.proofFile);
    return apiUpload<Payment>(`${base}/payments/proof`, form);
  },

  documents: (search?: string, category?: string) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    const qs = params.toString();
    return apiGet<DocumentItem[]>(`${base}/documents${qs ? `?${qs}` : ""}`);
  },
  /** Returns the authorized download URL path (fetched with auth by downloadDocument). */
  downloadDocument: (id: string) => `${base}/documents/${id}/download`,

  notifications: (page = 1, pageSize = 20, unreadOnly?: boolean) =>
    apiGet<Paged<NotificationItem>>(
      `${base}/notifications?page=${page}&pageSize=${pageSize}${unreadOnly ? "&unreadOnly=true" : ""}`),
  markNotificationRead: (id: string) => apiPost<void>(`${base}/notifications/${id}/read`),

  profile: () => apiGet<Profile>(`${base}/profile`),
  updateProfile: (payload: { fullName?: string; phoneNumber?: string; deliveryAddresses?: string }) =>
    apiPatch<{ message: string }>(`${base}/profile`, payload),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiPost<{ message: string }>(`${base}/profile/change-password`, { currentPassword, newPassword }),
};
