/**
 * Central API Client & Services
 * Unifies all HTTP endpoints, typed contracts, and authentication hooks.
 */

export * from "./client";
export * from "./publicApi";
export * from "./customerApi";
export { engineerApi, type EngineerDashboard, type EngineerOrder, type EngineerEnquiryListItem } from "./engineerApi";
export { adminApi, type AdminProduct, type AdminCategory, type AdminIndustry, type CreateShipmentPayload } from "./adminApi";
export * from "../auth/authService";
export * from "../auth/oauthService";
