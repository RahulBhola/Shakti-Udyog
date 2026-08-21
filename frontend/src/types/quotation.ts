/**
 * Quotation and Pricing domain models.
 */

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

export interface QuotationTimelineEntry {
  fromStatus: string;
  toStatus: string;
  changedByRole: string;
  note: string | null;
  occurredAtUtc: string;
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

export interface QuotationDetail extends QuotationListItem {
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
  history?: QuotationTimelineEntry[];
}
