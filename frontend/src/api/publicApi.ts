import { apiGet, apiPost } from "./client";

/* ---- Catalogue ------------------------------------------------------------- */

export interface Product {
  slug: string;
  title: string;
  summary: string;
  description: string[];
  typicalApplications: string[];
  commonGrades: string;
  castingWeightRange: string;
  availableFinish: string;
}

export interface Resource {
  slug: string;
  title: string;
  summary: string;
  body: string[];
}

export const getProducts = () => apiGet<Product[]>("/api/v1/public/products");
export const getProduct = (slug: string) => apiGet<Product>(`/api/v1/public/products/${slug}`);
export const getResources = () => apiGet<Resource[]>("/api/v1/public/resources");
export const getResource = (slug: string) => apiGet<Resource>(`/api/v1/public/resources/${slug}`);

/* ---- Submissions ------------------------------------------------------------ */

export interface EnquiryPayload {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  city?: string;
  message: string;
  consentGiven: boolean;
  /** Honeypot — must stay empty; hidden from humans. */
  website?: string;
}

export interface RfqPayload {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  productType: string;
  materialGrade?: string;
  quantity: string;
  deliveryLocation?: string;
  requirementDetails: string;
  consentGiven: boolean;
  website?: string;
}

export interface SubmissionAccepted {
  id: string | null;
  message: string;
}

export const submitEnquiry = (payload: EnquiryPayload) =>
  apiPost<SubmissionAccepted>("/api/v1/public/enquiries", payload);

export const submitRfq = (payload: RfqPayload) =>
  apiPost<SubmissionAccepted>("/api/v1/public/rfqs", payload);

export const rfqProductTypes = [
  "Grey Iron Casting",
  "Ductile Iron Casting",
  "Machined Casting",
  "Custom / OEM Casting",
  "Not Sure",
] as const;
