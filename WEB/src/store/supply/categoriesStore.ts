import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Category, CreateCategoryRequest, UpdateCategoryRequest, CategoryStats } from '@/types/supply/Category';
import { CategoryService } from '@/services/CategoryService';
import { toast } from 'sonner';

interface CategoriesState {
  // State
  categories: Category[];
  stats: CategoryStats | null;
  isLoading: boolean;
  error: string | null;

  // Filters
  searchTerm: string;
  statusFilter: string;

  // Dialog states
  showAddDialog: boolean;
  showEditDialog: boolean;
  showDeleteDialog: boolean;
  editingCategory: Category | null;
  categoryToDelete: Category | null;

  // Form data
  formData: {
    categoryName: string;
    description: string;
    status: 'Active' | 'Inactive';
  };

  // Actions
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string) => void;

  // Dialog actions
  openAddDialog: () => void;
  openEditDialog: (category: Category) => void;
  openDeleteDialog: (category: Category) => void;
  closeDialogs: () => void;

  // Form actions
  updateFormData: (data: Partial<CategoriesState['formData']>) => void;
  resetForm: () => void;

  // CRUD actions
  fetchCategories: () => Promise<void>;
  fetchStats: () => Promise<void>;
  createCategory: () => Promise<void>;
  updateCategory: () => Promise<void>;
  deleteCategory: () => Promise<void>;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCategoriesStore = create<CategoriesState>()(
  devtools(
    (set, get) => ({
      // Initial state
      categories: [],
      stats: null,
      isLoading: false,
      error: null,
      searchTerm: '',
      statusFilter: 'all',
      showAddDialog: false,
      showEditDialog: false,
      showDeleteDialog: false,
      editingCategory: null,
      categoryToDelete: null,
      formData: {
        categoryName: '',
        description: '',
        status: 'Active',
      },

      // Filter actions
      setSearchTerm: (term) => set({ searchTerm: term }),
      setStatusFilter: (status) => set({ statusFilter: status }),

      // Dialog actions
      openAddDialog: () => {
        get().resetForm();
        set({
          showAddDialog: true,
          showEditDialog: false,
          showDeleteDialog: false,
          editingCategory: null,
          categoryToDelete: null
        });
      },

      openEditDialog: (category) => {
        set({
          editingCategory: category,
          formData: {
            categoryName: category.categoryName,
            description: category.description,
            status: category.status,
          },
          showAddDialog: false,
          showEditDialog: true,
          showDeleteDialog: false,
          categoryToDelete: null,
        });
      },

      openDeleteDialog: (category) => {
        set({
          categoryToDelete: category,
          showAddDialog: false,
          showEditDialog: false,
          showDeleteDialog: true,
          editingCategory: null,
        });
      },

      closeDialogs: () => {
        set({
          showAddDialog: false,
          showEditDialog: false,
          showDeleteDialog: false,
          editingCategory: null,
          categoryToDelete: null,
        });
      },

      // Form actions
      updateFormData: (data) => {
        set((state) => ({
          formData: { ...state.formData, ...data }
        }));
      },

      resetForm: () => {
        set({
          formData: {
            categoryName: '',
            description: '',
            status: 'Active',
          }
        });
      },

      // CRUD actions
      fetchCategories: async () => {
        try {
          set({ isLoading: true, error: null });
          const { searchTerm, statusFilter } = get();
          const categories = await CategoryService.getAll(searchTerm, statusFilter);
          set({ categories, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch categories';
          set({ error: errorMessage, isLoading: false });
          toast.error(errorMessage);
        }
      },

      fetchStats: async () => {
        try {
          const stats = await CategoryService.getStats();
          set({ stats });
        } catch (error) {
          console.error('Failed to fetch category stats:', error);
        }
      },

      createCategory: async () => {
        try {
          set({ isLoading: true, error: null });
          const { formData } = get();

          if (!formData.categoryName.trim()) {
            toast.error('Category name is required');
            set({ isLoading: false });
            return;
          }

          const newCategory = await CategoryService.create(formData);
          set((state) => ({
            categories: [...state.categories, newCategory],
            isLoading: false,
            showAddDialog: false,
          }));

          get().resetForm();
          get().fetchStats();
          toast.success('Category created successfully');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create category';
          set({ error: errorMessage, isLoading: false });
          toast.error(errorMessage);
        }
      },

      updateCategory: async () => {
        try {
          set({ isLoading: true, error: null });
          const { formData, editingCategory } = get();

          if (!editingCategory) return;

          if (!formData.categoryName.trim()) {
            toast.error('Category name is required');
            set({ isLoading: false });
            return;
          }

          const updatedCategory = await CategoryService.update(editingCategory.id, formData);
          set((state) => ({
            categories: state.categories.map(cat =>
              cat.id === editingCategory.id ? updatedCategory : cat
            ),
            isLoading: false,
            showEditDialog: false,
            editingCategory: null,
          }));

          get().resetForm();
          toast.success('Category updated successfully');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update category';
          set({ error: errorMessage, isLoading: false });
          toast.error(errorMessage);
        }
      },

      deleteCategory: async () => {
        try {
          set({ isLoading: true, error: null });
          const { categoryToDelete } = get();

          if (!categoryToDelete) return;

          await CategoryService.delete(categoryToDelete.id);
          set((state) => ({
            categories: state.categories.filter(cat => cat.id !== categoryToDelete.id),
            isLoading: false,
            showDeleteDialog: false,
            categoryToDelete: null,
          }));

          get().fetchStats();
          toast.success(`Category "${categoryToDelete.categoryName}" deleted successfully`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
          set({ error: errorMessage, isLoading: false });
          toast.error(errorMessage);
        }
      },

      // Utility actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'categories-store',
    }
  )
);
