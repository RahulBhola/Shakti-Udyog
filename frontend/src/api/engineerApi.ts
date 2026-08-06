import { apiGet, apiPatch } from "./client";

const base = "/api/v1/engineer";

/** An order card on the engineer manufacturing Kanban. */
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

export const engineerApi = {
  /** Orders visible on the board — only the caller's assigned orders (admins see all). */
  orders: () => apiGet<EngineerOrder[]>(`${base}/orders`),
  /** Advance an assigned order one stage forward (front-backend enforced). */
  updateStage: (orderId: string, stage: string) =>
    apiPatch<{ message: string }>(`${base}/orders/${orderId}/stage`, { stage }),
};
