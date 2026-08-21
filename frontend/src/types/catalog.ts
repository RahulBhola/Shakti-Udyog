/**
 * Product, Category, Industry, and Content Catalog domain models.
 */

export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  fileName: string;
  sizeBytes: number;
  orderNumber: string | null;
  createdAtUtc: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  linkPath: string | null;
  isRead: boolean;
  createdAtUtc: string;
}

export interface AdminProduct {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string | null;
  commonGrades: string | null;
  castingWeightRange: string | null;
  availableFinish: string | null;
  categoryId: string | null;
  isPublished: boolean;
  sortOrder: number;
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  parentId: string | null;
  displayOrder: number;
  isVisible: boolean;
}

export interface AdminIndustry {
  id: string;
  name: string;
  description: string | null;
  exampleComponents: string | null;
  isActive: boolean;
  displayOrder: number;
}
