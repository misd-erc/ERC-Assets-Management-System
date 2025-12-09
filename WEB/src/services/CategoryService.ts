import * as categoriesApi from '@/api/supply/categoriesApi';
import { Category, CreateCategoryRequest, UpdateCategoryRequest, CategoryStats } from '@/types/supply/Category';

export class CategoryService {
  // Map API response to Category model (if needed for data transformation)
  private static mapApiToCategory(apiItem: any): Category {
    return {
      id: apiItem.id,
      categoryId: apiItem.categoryId,
      categoryName: apiItem.categoryName,
      description: apiItem.description,
      status: apiItem.status,
      dateCreated: apiItem.dateCreated,
      itemCount: apiItem.itemCount || 0,
      createdBy: apiItem.createdBy,
      updatedAt: apiItem.updatedAt,
    };
  }

  // Generate category ID based on existing categories
  private static generateCategoryId(existingCategories: Category[]): string {
    const maxId = existingCategories.length > 0
      ? Math.max(...existingCategories.map(cat => parseInt(cat.categoryId.split('-')[1])))
      : 0;
    return `CAT-${String(maxId + 1).padStart(3, '0')}`;
  }

  // Calculate category statistics
  static calculateStats(categories: Category[]): CategoryStats {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return {
      totalCategories: categories.length,
      activeCategories: categories.filter(cat => cat.status === 'Active').length,
      totalItems: categories.reduce((sum, cat) => sum + cat.itemCount, 0),
      createdThisMonth: categories.filter(cat => {
        const createdDate = new Date(cat.dateCreated);
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
      }).length,
    };
  }

  // Get all categories with optional filtering
  static async getAll(search?: string, status?: string): Promise<Category[]> {
    try {
      const categories = await categoriesApi.getCategories();

      let filteredCategories = categories;

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        filteredCategories = filteredCategories.filter(cat =>
          cat.categoryName.toLowerCase().includes(searchLower) ||
          cat.categoryId.toLowerCase().includes(searchLower) ||
          cat.description.toLowerCase().includes(searchLower)
        );
      }

      // Apply status filter
      if (status && status !== 'all') {
        filteredCategories = filteredCategories.filter(cat => cat.status.toLowerCase() === status.toLowerCase());
      }

      return filteredCategories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Get category by ID
  static async getById(id: string): Promise<Category> {
    try {
      return await categoriesApi.getCategoryById(id);
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  }

  // Create new category
  static async create(data: CreateCategoryRequest): Promise<Category> {
    try {
      // Get existing categories to generate ID
      const existingCategories = await categoriesApi.getCategories();
      const categoryId = this.generateCategoryId(existingCategories);

      const categoryData = {
        ...data,
        categoryId,
        dateCreated: new Date().toISOString().split('T')[0],
        itemCount: 0,
      };

      return await categoriesApi.createCategory(categoryData);
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // Update existing category
  static async update(id: string, data: UpdateCategoryRequest): Promise<Category> {
    try {
      return await categoriesApi.updateCategory(id, data);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  // Delete category
  static async delete(id: string): Promise<void> {
    try {
      await categoriesApi.deleteCategory(id);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // Get category statistics
  static async getStats(): Promise<CategoryStats> {
    try {
      const categories = await categoriesApi.getCategories();
      return this.calculateStats(categories);
    } catch (error) {
      console.error('Error fetching category stats:', error);
      throw error;
    }
  }
}
