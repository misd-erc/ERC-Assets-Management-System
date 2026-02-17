import { Asset } from '@/types/asset/UnifiedAsset';

export interface PTAData {
  id: number;
  group: string;
  propertyNumber: string;
  category: string;
  legend: string;
  description: string;
  unitOfMeasurement: string;
  unitValue: number;
  dateAcquired?: string;
  fiscalYear?: number;
  movements: Array<{
    id: number;
    ptaId: number;
    dateAssigned: string;
    ptrItrNumber: string;
    parIcsNumber: string;
    plantillaEmployeeId: number | null;
    nonPlantillaEmployeeId: number | null;
    actualOfficeId: number | null;
    actualDivisionId: number | null;
    condition: string;
    isActive: boolean;
  }>;
}

export class PTAService {
  static async getAllForRPCPPE(Date: Date, categoryId?: number): Promise<Asset[]> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      const API_BASE_URL = process.env.REACT_APP_API_URL || '';

      const pageSize = 1000;
      const asOfDate = Date.toISOString().split('T')[0];
      // Build URL with AsOfDate parameter (filters assets acquired on or before this date)
      let url = `${API_BASE_URL}/Inventory/pta/se-ppe/all?PageSize=${pageSize}&AsOfDate=${asOfDate}&GroupName=ppe&ActionBySystemUserId=${actionBySystemUserId}&SessionKey=${encodeURIComponent(sessionKey)}`;

      // Add CategoryId if specified
      if (categoryId) {
        url += `&CategoryId=${categoryId}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch PTA data');
      }

      const data = await response.json();
      const ptaItems: PTAData[] = data.data?.items || [];

      // Convert PTA data to Asset format for RPCPPE generation
      const assets: Asset[] = ptaItems.map(item => this.mapPTAToAsset(item));

      return assets;
    } catch (error) {
      console.error('Error fetching PTA data for RPCPPE:', error);
      throw error;
    }
  }

  static async getAllForSE(Date: Date): Promise<Asset[]> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      const API_BASE_URL = process.env.REACT_APP_API_URL || '';

      const pageSize = 1000;
      const asOfDate = Date.toISOString().split('T')[0];
      // Build URL with AsOfDate parameter (filters assets acquired on or before this date) for SE assets
      const url = `${API_BASE_URL}/Inventory/pta/se-ppe/all?PageSize=${pageSize}&AsOfDate=${asOfDate}&GroupName=se&ActionBySystemUserId=${actionBySystemUserId}&SessionKey=${encodeURIComponent(sessionKey)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch SE PTA data');
      }

      const data = await response.json();
      const ptaItems: PTAData[] = data.data?.items || [];

      // Convert PTA data to Asset format
      const assets: Asset[] = ptaItems.map(item => this.mapPTAToAsset(item));

      return assets;
    } catch (error) {
      console.error('Error fetching SE PTA data:', error);
      throw error;
    }
  }

  private static mapPTAToAsset(ptaItem: PTAData): Asset {
    // Map category string to categoryId
    const categoryMapping: { [key: string]: number } = {
      'Information and Communication Technology Equipment': 1,
      'Communication Equipment': 2,
      'Medical Equipment': 3,
      'Office Equipment': 4,
      'Furniture and Fixtures': 5,
      'Books and Reference Materials': 6,
      'Other PPE': 7,
    };

    const categoryId = categoryMapping[ptaItem.category] || 0;

    // Prefer explicit dateAcquired from API, otherwise fall back to latest movement
    const latestMovement = (ptaItem.movements || [])
      .filter(m => m.dateAssigned)
      .sort((a, b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime())[0];

    const dateAcquired = ptaItem.dateAcquired || latestMovement?.dateAssigned || '';

    return {
      id: ptaItem.id,
      group: ptaItem.group as 'PPE' | 'SE',
      propertyNumber: ptaItem.propertyNumber,
      category: typeof ptaItem.category === 'object' ? ptaItem.category : {
        id: 0,
        name: ptaItem.category || '',
        generalCode: '',
        isActive: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
      },
      legend: typeof ptaItem.legend === 'object' ? ptaItem.legend : null,
      description: ptaItem.description,
      brand: '',
      model: '',
      serialNumber: null,
      parts: [],
      unitOfMeasurement: ptaItem.unitOfMeasurement,
      unitValue: ptaItem.unitValue,
      dateAcquired,
      estimatedUsefulLife: 5,
      fiscalDate: new Date().toISOString(),
      condition: latestMovement?.condition || '',
      movements: ptaItem.movements.map(m => ({
        id: m.id,
        ptaId: m.ptaId,
        dateAssigned: m.dateAssigned,
        ptrItrNumber: m.ptrItrNumber || '',
        parIcsNumber: m.parIcsNumber || '',
        plantillaEmployeeId: m.plantillaEmployeeId,
        nonPlantillaEmployeeId: m.nonPlantillaEmployeeId,
        actualOfficeId: m.actualOfficeId || undefined,
        actualDivisionId: m.actualDivisionId || undefined,
        condition: m.condition,
        isActive: m.isActive,
        isDeleted: false,
        office: undefined,
        division: undefined,
        createdAt: m.dateAssigned,
        plantillaEmployeeIdOriginal: '',
        nonPlantillaEmployeeIdOriginal: '',
      })),
      isActive: true,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    };
  }
}
