import * as categoriesApi from '@/api/supply/categoriesApi';
import { Category, CreateCategoryRequest, UpdateCategoryRequest, CategoryStats } from '@/types/supply/Category';
import { getAuthParams } from '@/utils/auth';

export class CategoryService {
  // Map inventory API response to Category model
  private static mapInventoryToCategory(apiItem: categoriesApi.InventoryCategory): Category {
    if (!apiItem || typeof apiItem.id === 'undefined') {
      throw new Error('Invalid category data received from API');
    }

    return {
      id: apiItem.id.toString(),
      categoryId: `CAT-${apiItem.id.toString().padStart(3, '0')}`,
      categoryName: apiItem.name || '',
      generalCode: apiItem.generalCode || '',
      description: '', // Inventory API doesn't provide description
      status: apiItem.isActive ? 'Active' : 'Inactive',
      dateCreated: new Date().toISOString().split('T')[0], // Inventory API doesn't provide date
      itemCount: 0, // Inventory API doesn't provide item count
      createdBy: '',
      updatedAt: new Date().toISOString(),
    };
  }

  // Map Category to inventory API format
  private static mapCategoryToInventory(category: Category): categoriesApi.EditCategoryRequest {
    const { systemUserId, sessionKey } = getAuthParams();
    return {
      id: parseInt(category.id),
      name: category.categoryName,
      generalCode: category.categoryId,
      isActive: category.status === 'Active',
      actionBySystemUserId: systemUserId,
      sessionKey: sessionKey,
    };
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
      const { systemUserId, sessionKey } = getAuthParams();
      const params: categoriesApi.GetCategoriesParams = {
        SearchString: search || '',
        PageNumber: 1,
        PageSize: 1000, // Get all categories
        ActionBySystemUserId: systemUserId,
        SessionKey: sessionKey,
      };

      const inventoryCategories = await categoriesApi.getInventoryCategories(params);
      let categories = inventoryCategories.map(cat => this.mapInventoryToCategory(cat));

      // Apply status filter
      if (status && status !== 'all') {
        categories = categories.filter(cat => cat.status.toLowerCase() === status.toLowerCase());
      }

      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Get category by ID
  static async getById(id: string): Promise<Category> {
    try {
      // Since the inventory API doesn't have a get by ID endpoint,
      // we'll fetch all and filter
      const categories = await this.getAll();
      const category = categories.find(cat => cat.id === id);
      if (!category) {
        throw new Error('Category not found');
      }
      return category;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  }

  // Create new category
  static async create(data: CreateCategoryRequest): Promise<void> {
    try {
      const { systemUserId, sessionKey } = getAuthParams();
      const requestData = {
        name: data.categoryName,
        generalCode: data.generalCode || '',
        isActive: data.status === 'Active',
        actionBySystemUserId: systemUserId,
        sessionKey: sessionKey,
      };

      await categoriesApi.createInventoryCategory(requestData);
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // Update existing category
  static async update(id: string, data: UpdateCategoryRequest): Promise<Category> {
    try {
      const { systemUserId, sessionKey } = getAuthParams();
      const requestData: categoriesApi.EditCategoryRequest = {
        id: parseInt(id),
        name: data.categoryName || '',
        generalCode: data.generalCode || '',
        isActive: data.status === 'Active',
        actionBySystemUserId: systemUserId,
        sessionKey: sessionKey,
      };

      const inventoryCategory = await categoriesApi.editInventoryCategory(requestData);
      return this.mapInventoryToCategory(inventoryCategory);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  // Delete category
  static async delete(id: string): Promise<void> {
    try {
      const { systemUserId, sessionKey } = getAuthParams();
      await categoriesApi.deleteInventoryCategory(parseInt(id), systemUserId, sessionKey);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // Get category statistics
  static async getStats(): Promise<CategoryStats> {
    try {
      const categories = await this.getAll();
      return this.calculateStats(categories);
    } catch (error) {
      console.error('Error fetching category stats:', error);
      throw error;
    }
  }
}
