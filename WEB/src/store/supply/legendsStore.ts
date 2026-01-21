import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  getLegendsDetailed,
  createLegend as apiCreateLegend,
  updateLegend as apiUpdateLegend,
  deleteLegend as apiDeleteLegend,
} from '@/api/asset/inventoryApi';
import { getAuthParams } from '@/utils/auth';
import { toast } from 'sonner';

/* =========================
   TYPES
========================= */

export interface Legend {
  id: number;
  name: string;
  generalCode?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface LegendStats {
  totalLegends: number;
  activeLegends: number;
  createdThisMonth: number;
}

/* =========================
   STORE STATE
========================= */

interface LegendsState {
  legends: Legend[];
  stats: LegendStats | null;
  isLoading: boolean;
  error: string | null;

  // Filters
  searchTerm: string;

  // Dialog states
  showAddDialog: boolean;
  showEditDialog: boolean;
  showDeleteDialog: boolean;

  // Selected items
  editingLegend: Legend | null;
  legendToDelete: Legend | null;

  // Form data
  formData: {
    name: string;
    generalCode: string;
    isActive: boolean;
  };

  // Actions
  setSearchTerm: (term: string) => void;
  fetchLegends: () => Promise<void>;
  fetchStats: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Dialog actions
  openAddDialog: () => void;
  openEditDialog: (legend: Legend) => void;
  openDeleteDialog: (legend: Legend) => void;
  closeDialogs: () => void;

  // Form actions
  updateFormData: (data: Partial<LegendsState['formData']>) => void;
  resetForm: () => void;

  // CRUD actions
  createLegend: () => Promise<void>;
  updateLegend: () => Promise<void>;
  deleteLegend: () => Promise<void>;
}

/* =========================
   STORE IMPLEMENTATION
========================= */

export const useLegendsStore = create<LegendsState>()(
  devtools(
    (set, get) => ({
      legends: [],
      stats: null,
      isLoading: false,
      error: null,
      searchTerm: '',

      showAddDialog: false,
      showEditDialog: false,
      showDeleteDialog: false,

      editingLegend: null,
      legendToDelete: null,

      formData: {
        name: '',
        generalCode: '',
        isActive: true,
      },

      /* =========================
         BASIC ACTIONS
      ========================= */

      setSearchTerm: (term: string) => set({ searchTerm: term }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),

      /* =========================
         FETCH DATA
      ========================= */

      fetchLegends: async () => {
        try {
          set({ isLoading: true, error: null });
          const data = await getLegendsDetailed();
          set({ legends: data, isLoading: false });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to fetch legends';
          set({ error: errorMessage, isLoading: false });
          toast.error(errorMessage);
        }
      },

      fetchStats: async () => {
        try {
          const { legends } = get();

          const stats: LegendStats = {
            totalLegends: legends.length,
            activeLegends: legends.filter((l) => l.isActive).length,
            createdThisMonth: legends.length, // placeholder
          };

          set({ stats });
        } catch (error) {
          console.error('Failed to calculate legend stats:', error);
        }
      },

      /* =========================
         DIALOG ACTIONS
      ========================= */

      openAddDialog: () => {
        get().resetForm();
        set({
          showAddDialog: true,
          showEditDialog: false,
          showDeleteDialog: false,
          editingLegend: null,
          legendToDelete: null,
        });
      },

      openEditDialog: (legend: Legend) => {
        set({
          editingLegend: legend,
          formData: {
            name: legend.name,
            generalCode: legend.generalCode || '',
            isActive: legend.isActive ?? true,
          },
          showAddDialog: false,
          showEditDialog: true,
          showDeleteDialog: false,
          legendToDelete: null,
        });
      },

      openDeleteDialog: (legend: Legend) => {
        set({
          legendToDelete: legend,
          showAddDialog: false,
          showEditDialog: false,
          showDeleteDialog: true,
          editingLegend: null,
        });
      },

      closeDialogs: () => {
        set({
          showAddDialog: false,
          showEditDialog: false,
          showDeleteDialog: false,
          editingLegend: null,
          legendToDelete: null,
        });
      },

      /* =========================
         FORM ACTIONS
      ========================= */

      updateFormData: (data) => {
        set((state) => ({
          formData: { ...state.formData, ...data },
        }));
      },

      resetForm: () => {
        set({
          formData: {
            name: '',
            generalCode: '',
            isActive: true,
          },
        });
      },

      /* =========================
         CRUD ACTIONS
      ========================= */

      createLegend: async () => {
        try {
          set({ isLoading: true, error: null });

          const { formData } = get();

          if (!formData.name.trim()) {
            toast.error('Legend name is required');
            set({ isLoading: false });
            return;
          }

          const { systemUserId, sessionKey } = getAuthParams();
          const newLegend = await apiCreateLegend(
            {
              name: formData.name,
              generalCode: formData.generalCode || undefined,
            },
            String(systemUserId),
            sessionKey
          );

          // Refetch legends from server to ensure list is up to date
          await get().fetchLegends();

          set({
            isLoading: false,
            showAddDialog: false,
          });


          get().resetForm();
          get().fetchStats();
          toast.success('Legend created successfully');
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to create legend';

          set({ error: errorMessage, isLoading: false });
          toast.error(errorMessage);
        }
      },

      updateLegend: async () => {
        try {
          set({ isLoading: true, error: null });

          const { formData, editingLegend } = get();

          if (!editingLegend) {
            toast.error('No legend selected for editing');
            set({ isLoading: false });
            return;
          }

          if (!formData.name.trim()) {
            toast.error('Legend name is required');
            set({ isLoading: false });
            return;
          }

          const { systemUserId, sessionKey } = getAuthParams();
          const updatedLegend = await apiUpdateLegend(
            editingLegend.id,
            {
              name: formData.name,
              generalCode: formData.generalCode || undefined,
              isActive: formData.isActive,
            },
            String(systemUserId),
            sessionKey
          );

          // Refetch legends from server to ensure list is up to date
          await get().fetchLegends();

          set({
            isLoading: false,
            showEditDialog: false,
            editingLegend: null,
          });


          get().resetForm();
          get().fetchStats();
          toast.success('Legend updated successfully');
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to update legend';

          set({ error: errorMessage, isLoading: false });
          toast.error(errorMessage);
        }
      },

      deleteLegend: async () => {
        try {
          set({ isLoading: true, error: null });

          const { legendToDelete } = get();

          if (!legendToDelete) {
            toast.error('No legend selected for deletion');
            set({ isLoading: false });
            return;
          }

          const { systemUserId, sessionKey } = getAuthParams();
          await apiDeleteLegend(
            legendToDelete.id,
            String(systemUserId),
            sessionKey
          );

          set((state) => ({
            legends: state.legends.filter((legend) => legend.id !== legendToDelete.id),
            isLoading: false,
            showDeleteDialog: false,
            legendToDelete: null,
          }));

          get().fetchStats();
          toast.success('Legend deleted successfully');
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to delete legend';

          set({ error: errorMessage, isLoading: false });
          toast.error(errorMessage);
        }
      },
    }),
    {
      name: 'legends-store',
    }
  )
);
