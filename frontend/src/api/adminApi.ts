import { apiGet, apiPatch, apiPost, apiPut, apiDelete, apiUpload } from "./client";
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

  // ---- Product Master -------------------------------------------------------
  productMaster: {
    list: (params?: { page?: number; pageSize?: number; search?: string; categoryId?: string; status?: string; castingType?: string }) => {
      const sp = new URLSearchParams();
      if (params) {
        sp.set("page", String(params.page ?? 1));
        sp.set("pageSize", String(params.pageSize ?? 20));
        if (params.search) sp.set("search", params.search);
        if (params.categoryId) sp.set("categoryId", params.categoryId);
        if (params.status) sp.set("status", params.status);
        if (params.castingType) sp.set("castingType", params.castingType);
      }
      return apiGet<Paged<ProductMasterListItem>>(`${base}/product-master?${sp}`);
    },
    detail: (id: string) => apiGet<ProductMasterDetail>(`${base}/product-master/${id}`),
    usage: (id: string) => apiGet<ProductMasterUsage>(`${base}/product-master/${id}/usage`),
    stats: () => apiGet<ProductMasterStats>(`${base}/product-master/stats`),
    create: (payload: Record<string, unknown>) => apiPost<ProductMasterDetail>(`${base}/product-master`, payload),
    update: (id: string, payload: Record<string, unknown>) => apiPut<ProductMasterDetail>(`${base}/product-master/${id}`, payload),
    archive: (id: string) => apiDelete<{ message: string }>(`${base}/product-master/${id}`),
    duplicate: (id: string) => apiPost<{ id: string } & Record<string, unknown>>(`${base}/product-master/${id}/duplicate`),
    uploadAttachment: (productId: string, file: File, description?: string) => {
      const fd = new FormData();
      fd.append("file", file);
      if (description) fd.append("description", description);
      return apiUpload<ProductMasterAttachmentItem>(`${base}/product-master/${productId}/attachments`, fd);
    },
    downloadAttachmentUrl: (productId: string, attachmentId: string) =>
      `${base}/product-master/${productId}/attachments/${attachmentId}/download`,
  },
};

/* ── Product Master Types ──────────────────────────────────────────── */

export interface ProductMasterListItem {
  id: string;
  productCode: string;
  productName: string;
  categoryName: string | null;
  castingType: string | null;
  material: string | null;
  materialGrade: string | null;
  weight: number | null;
  status: string;
  attachmentCount: number;
  usedInCount: number;
  firstAttachmentId: string | null;
  firstAttachmentContentType: string | null;
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

export interface ProductMasterDetail {
  id: string;
  productCode: string;
  productName: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  castingType: string | null;
  unit: string | null;
  material: string | null;
  materialGrade: string | null;
  weight: number | null;
  tolerance: string | null;
  density: string | null;
  hardness: string | null;
  heatTreatment: string | null;
  surfaceFinish: string | null;
  length: number | null;
  width: number | null;
  height: number | null;
  diameter: number | null;
  drawingNumber: string | null;
  revision: string | null;
  patternNumber: string | null;
  coreRequired: boolean;
  machineRequired: boolean;
  inspectionRequired: boolean;
  machiningRequired: boolean;
  cycleTimeMinutes: number | null;
  standardCost: number | null;
  sellingPrice: number | null;
  gstPercent: number | null;
  hsnCode: string | null;
  currency: string | null;
  status: string;
  isArchived: boolean;
  createdAtUtc: string;
  updatedAtUtc: string | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  attachments: ProductMasterAttachmentItem[];
  usage: ProductMasterUsage;
}

export interface ProductMasterAttachmentItem {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  description: string | null;
  uploadedByUserId: string | null;
  uploadedAtUtc: string;
}

export interface ProductMasterStats {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  categoryCount: number;
  lowUsageProducts: number;
}

export interface ProductMasterUsage {
  rfqCount: number;
  quotationCount: number;
  orderCount: number;
}
