// src/store/office/useOfficeStore.ts
import { create } from 'zustand';
import { Office, VwDivision, EmploymentType, Position, Division, VwEmploymentType, VwOffice, VwPosition } from '@/types';
import { 
  getOffices, editOffice,
  getEmploymentTypes, editEmploymentType,
  getPositions, editPosition,
  getDivisions,
  editDivision
} from '@/api';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axios';
import { getAuthParams } from '@/utils/auth';

/* ========================================
   OFFICE STORE
======================================== */
interface OfficeState {
  offices: Office[];
  vwOffices: VwOffice[];
  loading: boolean;
  searchQuery: string;

  setOffices: (offices: Office[]) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;

  fetchOffices: () => Promise<void>;
  addOffice: (office: Partial<Office>) => Promise<void>;
  updateOffice: (id: number, updates: Partial<Office>) => Promise<void>;
  deleteOffice: (id: number) => Promise<void>;
}

export const useOfficeStore = create<OfficeState>((set, get) => ({
  offices: [],
  vwOffices: [],
  loading: false,
  searchQuery: '',

  setOffices: (offices) => set({ offices }),
  setLoading: (loading) => set({ loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchOffices: async () => {
    set({ loading: true });
    try {
      const vwOffices = await getOffices();
      set({ vwOffices });
    } catch {
      toast.error('Failed to load offices');
    } finally {
      set({ loading: false });
    }
  },

  addOffice: async (office) => {
    try {
        const { systemUserId, sessionKey } = getAuthParams();
      await editOffice({
        officeId: 0,
        name: office.name || '',
        acronym: office.acronym || '',
        generalCode: office.generalCode || '',
        isActive: office.isActive ?? true,
      });
      await get().fetchOffices();
      toast.success('Office added');
    } catch {
      toast.error('Failed to add office');
    }
  },

  updateOffice: async (id, updates) => {
    try {
      await editOffice({
        officeId: id,
        name: updates.name || '',
        acronym: updates.acronym || '',
        isActive: updates.isActive ?? true
      });
      await get().fetchOffices();
      toast.success('Office updated');
    } catch {
      toast.error('Failed to update office');
    }
  },

  deleteOffice: async (id) => {
    try {
      const { systemUserId, sessionKey } = getAuthParams();
      await axiosInstance.delete(`/Office/delete/${id}`, {
        params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
      });
      await get().fetchOffices();
      toast.success('Office deleted');
    } catch {
      toast.error('Failed to delete office');
    }
  },
}));


/* ========================================
   DIVISION STORE
======================================== */
interface DivisionState {
  divisions: Division[];
  vwDivisions: VwDivision[];
  loading: boolean;
  searchQuery: string;

  setDivisions: (divisions: Division[]) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;

  fetchDivisions: () => Promise<void>;
  addDivision: (division: { officeId: number; name: string; acronym: string; isActive: boolean }) => Promise<void>;
  updateDivision: (id: number, updates: { officeId: number; name: string; acronym: string; isActive: boolean }) => Promise<void>;
  deleteDivision: (id: number) => Promise<void>;
}

export const useDivisionStore = create<DivisionState>((set, get) => ({
  divisions: [],
  vwDivisions: [],
  loading: false,
  searchQuery: '',

  setDivisions: (divisions) => set({ divisions }),
  setLoading: (loading) => set({ loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchDivisions: async () => {
    set({ loading: true });
    try {
      const vwDivisions = await getDivisions();
      set({ vwDivisions });
    } catch {
      toast.error('Failed to load divisions');
    } finally {
      set({ loading: false });
    }
  },

  addDivision: async (division) => {
    try {
      await editDivision({
        id: 0,
        officeId: division.officeId,
        name: division.name,
        acronym: division.acronym,
        isActive: division.isActive
      });
      await get().fetchDivisions();
      toast.success('Division added');
    } catch {
      toast.error('Failed to add division');
    }
  },

  updateDivision: async (id, updates) => {
    try {
      await editDivision({
        id: id,
        officeId: updates.officeId,
        name: updates.name,
        acronym: updates.acronym,
        isActive: updates.isActive
      });
      await get().fetchDivisions();
      toast.success('Division updated');
    } catch {
      toast.error('Failed to update division');
    }
  },

  deleteDivision: async (id) => {
    try {
      const { systemUserId, sessionKey } = getAuthParams();
      await axiosInstance.delete(`/Office/division/delete/${id}`, {
        params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
      });
      await get().fetchDivisions();
      toast.success('Division deleted');
    } catch {
_double: toast.error('Failed to delete division');
    }
  },
}));


/* ========================================
   EMPLOYMENT TYPE STORE
======================================== */
interface EmploymentTypeState {
  employmentTypes: EmploymentType[];
  vwEmploymentTypes: VwEmploymentType[];
  loading: boolean;
  searchQuery: string;

  setEmploymentTypes: (types: EmploymentType[]) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;

  fetchEmploymentTypes: () => Promise<void>;
  addEmploymentType: (office: Partial<EmploymentType>) => Promise<void>;
  updateEmploymentType: (id: number, updates: Partial<EmploymentType>) => Promise<void>;
  deleteEmploymentType: (id: number) => Promise<void>;
}

export const useEmploymentTypeStore = create<EmploymentTypeState>((set, get) => ({
  employmentTypes: [],
  vwEmploymentTypes: [],
  loading: false,
  searchQuery: '',

  setEmploymentTypes: (types) => set({ employmentTypes: types }),
  setLoading: (loading) => set({ loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchEmploymentTypes: async () => {
    set({ loading: true });
    try {
      const types = await getEmploymentTypes();
      set({ vwEmploymentTypes: types });
    } catch {
      toast.error('Failed to load employment types');
    } finally {
      set({ loading: false });
    }
  },

  addEmploymentType: async (type) => {
    try {
      await editEmploymentType({
        name: type.name ?? '',
        isActive: type.isActive ?? true,
      });
      await get().fetchEmploymentTypes();
      toast.success('Employment type added');
    } catch {
      toast.error('Failed to add employment type');
    }
  },

  updateEmploymentType: async (id, updates) => {
    try {
      await editEmploymentType({
        employmentTypeId: id,
        name: updates.name ?? '',
        isActive: updates.isActive ?? true,
      });
      await get().fetchEmploymentTypes();
      toast.success('Employment type updated');
    } catch {
      toast.error('Failed to update employment type');
    }
  },

  deleteEmploymentType: async (id) => {
    try {
      const { systemUserId, sessionKey } = getAuthParams();
      await axiosInstance.delete(`/Office/employment-type/delete/${id}`, {
        params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
      });
      await get().fetchEmploymentTypes();
      toast.success('Employment type deleted');
    } catch {
      toast.error('Failed to delete employment type');
    }
  },
}));


/* ========================================
   POSITION STORE
======================================== */
interface PositionState {
  positions: Position[];
  vwPositions: VwPosition[];
  loading: boolean;
  searchQuery: string;

  setPositions: (positions: Position[]) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;

  fetchPositions: () => Promise<void>;
  addPosition: (position: Partial<Position>) => Promise<void>;
  updatePosition: (id: number, updates: Partial<Position>) => Promise<void>;
  deletePosition: (id: number) => Promise<void>;
}

export const usePositionStore = create<PositionState>((set, get) => ({
  positions: [],
  vwPositions: [],
  loading: false,
  searchQuery: '',

  setPositions: (positions) => set({ positions }),
  setLoading: (loading) => set({ loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchPositions: async () => {
    set({ loading: true });
    try {
      const vwPositions = await getPositions();
      set({ vwPositions });
    } catch {
      toast.error('Failed to load positions');
    } finally {
      set({ loading: false });
    }
  },

  addPosition: async (position) => {
    try {
      await editPosition({
        name: position.name ?? '',
        acronym: position.acronym ?? '',
        salaryGrade: position.salaryGrade ?? '',
        isActive: position.isActive ?? true,
      });
      await get().fetchPositions();
      toast.success('Position added');
    } catch {
      toast.error('Failed to add position');
    }
  },

  updatePosition: async (id, updates) => {
    try {
      await editPosition({
        positionId: id,
        name: updates.name ?? '',
        acronym: updates.acronym ?? '',
        salaryGrade: updates.salaryGrade ?? '',
        isActive: updates.isActive ?? true,
      });
      await get().fetchPositions();
      toast.success('Position updated');
    } catch {
      toast.error('Failed to update position');
    }
  },

  deletePosition: async (id) => {
    try {
      const { systemUserId, sessionKey } = getAuthParams();
      await axiosInstance.delete(`/Office/position/delete/${id}`, {
        params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
      });
      await get().fetchPositions();
      toast.success('Position deleted');
    } catch {
      toast.error('Failed to delete position');
    }
  },
}));



