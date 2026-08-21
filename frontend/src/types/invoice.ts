/**
 * Invoicing and Payment domain models.
 */

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
