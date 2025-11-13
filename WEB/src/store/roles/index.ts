import { create } from 'zustand';
import { SystemRoleResponseModel, getAllSystemRoles, getSystemRoleById, editSystemRole, PaginationGenericQueryParams, SoloQueryParams, EditSystemRoleQueryParams } from '@/api';
import { toast } from 'sonner';

export interface RolesState {
  roles: SystemRoleResponseModel[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export interface RolesActions {
  fetchRoles: (params: PaginationGenericQueryParams) => Promise<void>;
  fetchRoleById: (id: number, params: SoloQueryParams) => Promise<SystemRoleResponseModel | null>;
  createOrUpdateRole: (params: EditSystemRoleQueryParams) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export type RolesStore = RolesState & RolesActions;

export const useRolesStore = create<RolesStore>((set, get) => ({
  roles: [],
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,

  fetchRoles: async (params: PaginationGenericQueryParams) => {
    set({ loading: true, error: null });
    try {
      const result = await getAllSystemRoles(params);
      set({
        roles: result.data,
        totalCount: result.totalCount,
        currentPage: result.pageNumber,
        pageSize: result.pageSize,
        loading: false
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch roles';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  fetchRoleById: async (id: number, params: SoloQueryParams) => {
    set({ loading: true, error: null });
    try {
      const role = await getSystemRoleById(id, params);
      set({ loading: false });
      return role;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch role';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return null;
    }
  },

  createOrUpdateRole: async (params: EditSystemRoleQueryParams) => {
    set({ loading: true, error: null });
    try {
      await editSystemRole(params);
      set({ loading: false });
      toast.success(params.systemRoleId === 0 ? 'Role created successfully' : 'Role updated successfully');

      // Refresh roles list if we have the systemUserId
      const { fetchRoles } = get();
      if (params.actionBySystemUserId) {
        await fetchRoles({
          pageNumber: get().currentPage,
          pageSize: get().pageSize,
          actionBySystemUserId: params.actionBySystemUserId,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save role';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));

