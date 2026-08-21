/**
 * Company profile, addresses, and corporate account domain models.
 */

export interface CompanyAddress {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface CompanyDetail {
  id: string;
  name: string;
  legalBusinessName: string | null;
  businessType: string | null;
  industry: string | null;
  website: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
  purchaseEmail: string | null;
  accountsEmail: string | null;
  registeredAddress: string | null;
  factoryAddress: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  tanNumber: string | null;
  cinNumber: string | null;
  msmeNumber: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankIfscCode: string | null;
  bankBranch: string | null;
  accountType: string | null;
  isApproved: boolean;
  creditLimit: number | null;
  paymentTermsDays: number | null;
  addresses?: CompanyAddress[];
  contacts?: ContactPerson[];
  documents?: CompanyDocument[];
}

export interface ContactPerson {
  id: string;
  name: string;
  designation: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
}

export interface CompanyDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedAtUtc: string;
}

export interface Profile {
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  company: {
    name: string;
    addressLine1: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
    gstNumber: string | null;
    deliveryAddresses: string | null;
  } | null;
  mfaEnabled: boolean;
  accountCreatedAtUtc: string | null;
}
