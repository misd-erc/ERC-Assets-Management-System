export type CategoryStatus = 'Active' | 'Inactive';

export interface Category {
  id: string;
  categoryId: string;
  categoryName: string;
  description: string;
  status: CategoryStatus;
  dateCreated: string;
  itemCount: number;
  createdBy?: string;
  updatedAt?: string;
}

export interface CreateCategoryRequest {
  categoryName: string;
  description: string;
  status: CategoryStatus;
}

export interface UpdateCategoryRequest {
  categoryName?: string;
  description?: string;
  status?: CategoryStatus;
}

export interface CategoryFilters {
  search?: string;
  status?: CategoryStatus | 'all';
}

export interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  totalItems: number;
  createdThisMonth: number;
}
