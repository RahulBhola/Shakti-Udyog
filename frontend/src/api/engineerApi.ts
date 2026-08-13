import { apiGet, apiPost, apiPatch } from './client';

const base = '/api/v1/engineer';

export const engineerApi = {
  // ---- Dashboard ----
  dashboard: () => apiGet<any>(`${base}/engineer-board`),

  // ---- Engineer Creation (Admin only) ----
  createEngineer: (request: { fullName: string; password: string }) =>
    apiPost<{ email: string; userId: string; fullName: string }>(
      `${base}/engineers`, request
    ),

  // ---- Manufacturing Board ----
  ordersBoard: () => apiGet<any[]>(`${base}/board`),
  updateStage: (id: string, stage: string) =>
    apiPatch<{ message: string }>(`${base}/orders/${id}/stage`, { stage }),

  // ---- Charts ----
  charts: () => apiGet<any>(`${base}/charts`),
};

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
