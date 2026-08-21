/**
 * Shop-floor Kanban and Production Operations domain models.
 */

import type { DocumentItem } from "./catalog";

export interface Dashboard {
  openEnquiries: number;
  activeQuotations: number;
  activeOrders: number;
  unpaidInvoices: number;
  unreadNotifications: number;
  recentActivity: { type: string; title: string; linkPath: string | null; occurredAtUtc: string }[];
  recentDocuments: DocumentItem[];
}

export interface EngineerDashboard {
  pendingEnquiries: number;
  pendingQuotations: number;
  ordersInProduction: number;
  ordersAwaitingShipment: number;
}

export interface ProductionStageInfo {
  code: string;
  label: string;
  description: string;
  category: "pre-production" | "casting" | "finishing" | "post-production" | "fulfillment";
  sequenceOrder: number;
}
