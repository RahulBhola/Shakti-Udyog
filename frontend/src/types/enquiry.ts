/**
 * Customer and Engineer RFQ / Enquiry domain models.
 */

export interface EnquiryFile {
  id: string;
  fileName: string;
  sizeBytes: number;
  contentType?: string;
  storageKey?: string;
  uploadedByUserId?: string | null;
  uploadedAtUtc: string;
}

export interface EnquiryTimelineEntry {
  fromStatus: string;
  toStatus: string;
  changedByRole: string;
  note: string | null;
  occurredAtUtc: string;
}

export interface EnquiryComment {
  id: string | null;
  authorUserId: string;
  authorRole: string;
  isCustomerVisible: boolean;
  message: string;
  createdAtUtc: string;
}

export interface EnquiryListItem {
  id: string;
  productType: string;
  companyName?: string | null;
  quantity: string;
  status: string;
  isDraft: boolean;
  fileCount: number;
  priority?: string;
  assignedToUserId?: string | null;
  firstFileId?: string | null;
  firstFileContentType?: string | null;
  createdAtUtc: string;
}

export interface EnquiryDetail extends EnquiryListItem {
  companyId?: string;
  fullName: string;
  companyName: string;
  email?: string;
  phone?: string;
  materialGrade: string | null;
  deliveryLocation: string | null;
  requirementDetails: string;
  submittedByIp?: string | null;
  files: EnquiryFile[];
  statusHistory?: EnquiryTimelineEntry[];
  comments?: EnquiryComment[];
  hasDraftQuotation?: boolean;
  draftQuotationId?: string | null;
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

export type EngineerEnquiryDetail = EnquiryDetail;
export type EngineerEnquiryListItem = EnquiryListItem;
