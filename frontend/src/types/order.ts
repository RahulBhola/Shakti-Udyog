/**
 * Order, Milestone, and Shipment domain models.
 */

import type { DocumentItem } from "./catalog";

export interface OrderItem {
  partNumber: string;
  description: string;
  materialGrade: string | null;
  drawingRevision: string | null;
  unit: string;
  quantityOrdered: number;
  quantityProduced: number;
  quantityDispatched: number;
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

export interface CreateShipmentPayload {
  transporter?: string | null;
  trackingNumber?: string | null;
  vehicleNumber?: string | null;
  phoneNumber?: string | null;
  dispatchDateUtc?: string | null;
  estimatedArrivalUtc?: string | null;
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
  status: string;
  statusLabel: string;
  statusDescription: string;
  placedAtUtc: string;
  promisedDispatchDateUtc: string | null;
  deliveryAddress: string | null;
  lastUpdatedAtUtc: string;
  items: OrderItem[];
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

export interface EngineerOrder {
  id: string;
  orderNumber: string;
  companyName: string | null;
  productType: string | null;
  totalQuantity: number;
  manufacturingStage: string;
  stageUpdatedAt: string | null;
  placedAtUtc: string;
}
