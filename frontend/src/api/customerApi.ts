import { apiGet, apiPost, apiPut, apiPatch, apiDelete, apiUpload } from "./client";

/* ---- Types mirroring backend Contracts/Customer ---------------------------- */

export interface Dashboard {
  openEnquiries: number;
  activeQuotations: number;
  activeOrders: number;
  unpaidInvoices: number;
  unreadNotifications: number;
  recentActivity: { type: string; title: string; linkPath: string | null; occurredAtUtc: string }[];
  recentDocuments: DocumentItem[];
}

export interface EnquiryListItem {
  id: string;
  productType: string;
  quantity: string;
  status: string;
  isDraft: boolean;
  fileCount: number;
  createdAtUtc: string;
  partName?: string | null;
  partNumber?: string | null;
  industry?: string | null;
  productionQuantity?: string | null;
  firstFileId?: string | null;
  firstFileContentType?: string | null;
}

export interface EnquiryDetail extends EnquiryListItem {
  fullName: string;
  companyName: string;
  materialGrade: string | null;
  deliveryLocation: string | null;
  requirementDetails: string;
  files: { id: string; fileName: string; contentType?: string; sizeBytes: number; uploadedAtUtc: string }[];
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
}

export interface QuotationListItem {
  id: string;
  quotationNumber: string;
  revisionNumber: number;
  enquiryId: string;
  productType: string;
  total: number;
  currency: string;
  status: string;
  validUntilUtc: string | null;
  createdAtUtc: string;
  companyName: string | null;
  itemCount: number;
  paymentTerms: string | null;
  deliveryTime: string | null;
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
  deliveryTime: string | null;
  warranty: string | null;
  freight: string | null;
  packing: string | null;
  remarks: string | null;
  customerResponseComment: string | null;
  customerRespondedAtUtc: string | null;
  documentId: string | null;
  orderId: string | null;
  orderNumber: string | null;
  items: QuotationItem[];
  advanceAmount?: number | null;
  advancePaymentRef?: string | null;
  advancePaidAtUtc?: string | null;
  advancePaid?: boolean;
  advancePercent?: number | null;
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
  companyName: string | null;
  productType: string | null;
  assignedToUserId: string | null;
  assignedToName: string | null;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  purchaseOrderReference: string | null;
  quotationId: string | null;
  companyName?: string | null;
  manufacturingStage?: string | null;
  advancePaid?: boolean;
  advanceAmount?: number | null;
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
  assignedToUserId: string | null;
  assignedToName: string | null;
}

export interface Shipment {
  id: string;
  transporter: string | null;
  trackingNumber: string | null;
  vehicleNumber: string | null;
  phoneNumber: string | null;
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

export interface OrderComment {
  authorRole: string;
  authorName: string | null;
  message: string;
  createdAtUtc: string;
}

export interface InvoiceListItem {
  id: string;
  orderId: string;
  invoiceNumber: string;
  orderNumber: string | null;
  issueDateUtc: string;
  dueDateUtc: string | null;
  total: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  status: string;
  companyName: string | null;
  companyLogoUrl: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
}

export interface InvoiceDetail extends InvoiceListItem {
  subtotal: number;
  tax: number;
  documentId: string | null;
  items: InvoiceItem[];
  payments: Payment[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  hsnSacCode: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxPercent: number;
  lineTotal: number;
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
  contentType?: string | null;
  orderId?: string | null;
}

export interface SupportRequestItem {
  id: string;
  orderId: string | null;
  orderNumber: string | null;
  subject: string;
  message: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed" | string;
  createdAtUtc: string;
}

export interface EnquiryTimelineEntry {
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
  accountCreatedAtUtc: string | null;
  avatarUrl?: string | null;
  emailConfirmed?: boolean;
  phoneNumberConfirmed?: boolean;
}

// ---- Profile: Company -------------------------------------------------------

export interface CompanyDetail {
  id: string;
  name: string;
  legalBusinessName: string | null;
  businessType: string | null;
  industry: string | null;
  website: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
  purchaseEmail: string | null;
  accountsEmail: string | null;
  registeredAddress: string | null;
  factoryAddress: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pinCode: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  cinNumber: string | null;
  msmeNumber: string | null;
  preferredCurrency: string | null;
  preferredPaymentMethod: string | null;
  preferredCommunication: string | null;
  preferredLanguage: string | null;
  companyLogoUrl: string | null;
  verificationStatus: string;
  verificationSubmittedOn: string | null;
  verifiedOn: string | null;
  gstVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export interface UpdateCompanyRequest {
  legalBusinessName?: string;
  businessType?: string;
  industry?: string;
  website?: string;
  companyEmail?: string;
  companyPhone?: string;
  purchaseEmail?: string;
  accountsEmail?: string;
  registeredAddress?: string;
  factoryAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  gstNumber?: string;
  panNumber?: string;
  cinNumber?: string;
  msmeNumber?: string;
  preferredCurrency?: string;
  preferredPaymentMethod?: string;
  preferredCommunication?: string;
  preferredLanguage?: string;
}

// ---- Profile: Contact Persons ------------------------------------------------

export interface ContactPerson {
  id: string;
  fullName: string;
  designation: string;
  department: string | null;
  email: string;
  phone: string;
  isPrimary: boolean;
  createdAtUtc: string;
}

export interface CreateContactPersonRequest {
  fullName: string;
  designation: string;
  department?: string;
  email: string;
  phone: string;
  isPrimary?: boolean;
}

export interface UpdateContactPersonRequest {
  fullName?: string;
  designation?: string;
  department?: string;
  email?: string;
  phone?: string;
  isPrimary?: boolean;
}

// ---- Profile: Company Addresses ----------------------------------------------

export interface CompanyAddress {
  id: string;
  addressType: string;
  address: string;
  city: string | null;
  state: string | null;
  country: string | null;
  pinCode: string | null;
  isPrimary: boolean;
  createdAtUtc: string;
}

export interface CreateCompanyAddressRequest {
  addressType: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  isPrimary?: boolean;
}

export interface UpdateCompanyAddressRequest {
  addressType?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  isPrimary?: boolean;
}

// ---- Profile: Company Documents ----------------------------------------------

export interface CompanyDocument {
  id: string;
  documentType: string;
  fileName: string;
  sizeBytes: number;
  status: string;
  remarks: string | null;
  uploadedAtUtc: string;
}

export interface UploadDocumentResponse {
  id: string;
  documentType: string;
  fileName: string;
  message: string;
}

// ---- Profile: Security -------------------------------------------------------

export interface SecurityInfo {
  mfaEnabled: boolean;
  activeSessions: ActiveSession[];
  recentLoginHistory: LoginHistoryEntry[];
}

export interface ActiveSession {
  id: string;
  deviceName: string | null;
  ipAddress: string | null;
  createdAtUtc: string;
  lastUsedAtUtc: string | null;
  isCurrent: boolean;
}

export interface LoginHistoryEntry {
  ipAddress: string | null;
  userAgent: string | null;
  succeeded: boolean;
  occurredAtUtc: string;
}

export interface MfaSetupResponse {
  enabled: boolean;
  secretKey: string | null;
  qrCodeUrl: string | null;
}

/* ---- Calls ------------------------------------------------------------------ */

const base = "/api/v1/customer";

export const customerApi = {
  dashboard: () => apiGet<Dashboard>(`${base}/dashboard`),

  enquiries: (page = 1, pageSize = 20, search?: string, status?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    return apiGet<Paged<EnquiryListItem>>(`${base}/enquiries?${params}`);
  },
  enquiry: (id: string) => apiGet<EnquiryDetail>(`${base}/enquiries/${id}`),
  createEnquiry: (payload: {
    productType: string;
    materialGrade?: string;
    quantity: string;
    deliveryLocation?: string;
    requirementDetails: string;
    saveAsDraft: boolean;
    partName?: string;
    partNumber?: string;
    industry?: string;
    application?: string;
    materialStandard?: string;
    approxWeight?: number;
    machiningRequired?: string;
    patternAvailability?: string;
    prototypeQuantity?: string;
    productionQuantity?: string;
    annualRequirement?: string;
    expectedDeliveryDate?: string;
    preferredDeliveryTerms?: string;
    additionalRequirements?: string;
    remarks?: string;
  }) => apiPost<{ id: string }>(`${base}/enquiries`, payload),
  updateEnquiry: (id: string, payload: Record<string, unknown>) => apiPatch<{ message: string }>(`${base}/enquiries/${id}`, payload),
  deleteEnquiry: (id: string) => apiDelete<{ message: string }>(`${base}/enquiries/${id}`),
  submitEnquiry: (id: string) => apiPost<{ message: string }>(`${base}/enquiries/${id}/submit`),
  enquiryTimeline: (id: string) => apiGet<EnquiryTimelineEntry[]>(`${base}/enquiries/${id}/timeline`),
  uploadEnquiryFile: (enquiryId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiUpload<{ id: string; fileName: string }>(`${base}/enquiries/${enquiryId}/files`, form);
  },
  deleteEnquiryFile: (enquiryId: string, fileId: string) =>
    apiDelete<{ message?: string }>(`${base}/enquiries/${enquiryId}/files/${fileId}`),

  quotations: () => apiGet<QuotationListItem[]>(`${base}/quotations`),
  quotation: (id: string) => apiGet<QuotationDetail>(`${base}/quotations/${id}`),
  quotationTimeline: (id: string) => apiGet<QuotationTimelineEntry[]>(`${base}/quotations/${id}/timeline`),
  respondToQuotation: (id: string, response: "accept" | "decline" | "negotiate", comment?: string) =>
    apiPost<{ message: string }>(`${base}/quotations/${id}/response`, { response, comment }),
  payQuotationAdvance: (id: string, paymentRef: string) =>
    apiPost<{ message: string }>(`${base}/quotations/${id}/pay-advance`, { paymentRef }),

  orders: () => apiGet<OrderListItem[]>(`${base}/orders`),
  order: (id: string) => apiGet<OrderDetail>(`${base}/orders/${id}`),
  orderTimeline: (id: string) => apiGet<TimelineEntry[]>(`${base}/orders/${id}/timeline`),
  orderComments: (id: string) => apiGet<OrderComment[]>(`${base}/orders/${id}/comments`),
  addOrderComment: (id: string, message: string) =>
    apiPost<{ message: string }>(`${base}/orders/${id}/comments`, { message }),
  createSupportRequest: (
    orderIdOrPayload: string | { subject: string; message: string; orderId?: string; category?: string },
    subject?: string,
    message?: string
  ) => {
    if (typeof orderIdOrPayload === "string") {
      return apiPost<{ id: string }>(`${base}/orders/${orderIdOrPayload}/support-requests`, { subject, message });
    }
    return apiPost<{ id: string; message: string }>(`${base}/support-requests`, orderIdOrPayload);
  },

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
  previewDocumentUrl: (id: string) => `${base}/documents/${id}/preview`,
  uploadDocument: (payload: { title: string; category: string; orderId?: string; file: File }) => {
    const form = new FormData();
    form.append("title", payload.title);
    form.append("category", payload.category);
    if (payload.orderId) form.append("orderId", payload.orderId);
    form.append("file", payload.file);
    return apiUpload<DocumentItem>(`${base}/documents/upload`, form);
  },
  deleteDocument: (id: string) => apiDelete<{ message: string }>(`${base}/documents/${id}`),

  notifications: (page = 1, pageSize = 20, unreadOnly?: boolean) =>
    apiGet<Paged<NotificationItem>>(
      `${base}/notifications?page=${page}&pageSize=${pageSize}${unreadOnly ? "&unreadOnly=true" : ""}`),
  markNotificationRead: (id: string) => apiPost<void>(`${base}/notifications/${id}/read`),

  profile: () => apiGet<Profile>(`${base}/profile`),
  updateProfile: (payload: { fullName?: string; phoneNumber?: string; deliveryAddresses?: string; avatarUrl?: string | null }) =>
    apiPatch<{ message: string }>(`${base}/profile`, payload),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiPost<{ message: string }>(`${base}/profile/change-password`, { currentPassword, newPassword }),
  sendPhoneOtp: (phoneNumber?: string) =>
    apiPost<{ message: string; expiresAtUtc: string }>(`${base}/profile/send-phone-otp`, { phoneNumber }),
  verifyPhoneOtp: (phoneNumber: string, otp: string) =>
    apiPost<{ message: string }>(`${base}/profile/verify-phone-otp`, { phoneNumber, otp }),

  // ---- Support Requests -------------------------------------------------------
  supportRequests: () => apiGet<SupportRequestItem[]>(`${base}/support-requests`),

  // ---- Company ---------------------------------------------------------------

  companyDetail: () => apiGet<CompanyDetail>(`${base}/company`),
  updateCompany: (payload: UpdateCompanyRequest) =>
    apiPut<{ message: string }>(`${base}/company`, payload),
  submitCompanyVerification: () =>
    apiPost<{ message: string }>(`${base}/company/submit-verification`),

  // ---- Contact Persons -------------------------------------------------------

  contacts: () => apiGet<ContactPerson[]>(`${base}/contacts`),
  createContact: (payload: CreateContactPersonRequest) =>
    apiPost<ContactPerson>(`${base}/contacts`, payload),
  updateContact: (id: string, payload: UpdateContactPersonRequest) =>
    apiPut<ContactPerson>(`${base}/contacts/${id}`, payload),
  deleteContact: (id: string) =>
    apiDelete<{ message: string }>(`${base}/contacts/${id}`),

  // ---- Company Addresses -----------------------------------------------------

  addresses: () => apiGet<CompanyAddress[]>(`${base}/addresses`),
  createAddress: (payload: CreateCompanyAddressRequest) =>
    apiPost<CompanyAddress>(`${base}/addresses`, payload),
  updateAddress: (id: string, payload: UpdateCompanyAddressRequest) =>
    apiPut<CompanyAddress>(`${base}/addresses/${id}`, payload),
  deleteAddress: (id: string) =>
    apiDelete<{ message: string }>(`${base}/addresses/${id}`),

  // ---- Company Documents -----------------------------------------------------

  companyDocuments: () => apiGet<CompanyDocument[]>(`${base}/documents/company`),
  uploadCompanyDocument: (documentType: string, file: File) => {
    const form = new FormData();
    form.append("documentType", documentType);
    form.append("file", file);
    return apiUpload<UploadDocumentResponse>(`${base}/documents/company/upload`, form);
  },
  downloadCompanyDocument: (id: string) => `${base}/documents/company/${id}/download`,
  deleteCompanyDocument: (id: string) =>
    apiDelete<{ message: string }>(`${base}/documents/company/${id}`),

  // ---- Security --------------------------------------------------------------

  securityInfo: () => apiGet<SecurityInfo>(`${base}/security`),
  securityChangePassword: (currentPassword: string, newPassword: string) =>
    apiPost<{ message: string }>(`${base}/security/change-password`, { currentPassword, newPassword }),
  enableMfa: () => apiPost<MfaSetupResponse>(`${base}/security/enable-mfa`),
  disableMfa: () => apiPost<{ message: string }>(`${base}/security/disable-mfa`),
};
