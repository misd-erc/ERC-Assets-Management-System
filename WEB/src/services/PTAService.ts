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
  movements: Array<{
    id: number;
    ptaId: number;
    dateAssigned: string;
    parItrNumber: string;
    plantillaEmployeeId: number | null;
    nonPlantillaEmployeeId: number | null;
    actualOfficeId: number | null;
    actualDivisionId: number | null;
    condition: string;
    isActive: boolean;
  }>;
}

export class PTAService {
  static async getAllForRPCPPE(year: number, categoryId?: number): Promise<Asset[]> {
    try {
      const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
      const sessionKey = localStorage.getItem('sessionToken') || '';

      const API_BASE_URL = process.env.REACT_APP_API_URL || '';

      // Fetch PTA data for RPCPPE
      const url = `${API_BASE_URL}/Inventory/pta/se-ppe/all?PageNumber=1&PageSize=10000&ActionBySystemUserId=${actionBySystemUserId}&SessionKey=${encodeURIComponent(sessionKey)}&GroupName=ppe`;

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
      let assets: Asset[] = ptaItems.map(item => this.mapPTAToAsset(item));

      // Filter by year using dateAssigned from latest movement
      assets = assets.filter(asset => {
        const latestMovement = asset.movements
          .filter(m => m.dateAssigned)
          .sort((a, b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime())[0];

        if (!latestMovement) return false;

        const movementYear = new Date(latestMovement.dateAssigned).getFullYear();
        return movementYear === year;
      });

      // Filter by category if specified
      if (categoryId) {
        assets = assets.filter(asset => asset.categoryId === categoryId);
      }

      return assets;
    } catch (error) {
      console.error('Error fetching PTA data for RPCPPE:', error);
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

    // Use the latest movement's dateAssigned as dateAcquired
    const latestMovement = ptaItem.movements
      .filter(m => m.dateAssigned)
      .sort((a, b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime())[0];

    const dateAcquired = latestMovement?.dateAssigned || '';

    return {
      id: ptaItem.id,
      group: ptaItem.group as 'PPE' | 'SE',
      propertyNumber: ptaItem.propertyNumber,
      categoryId,
      legendId: 0, // Not used in RPCPPE
      category: ptaItem.category,
      legend: ptaItem.legend,
      description: ptaItem.description,
      brand: '', // Not in PTA data
      model: '', // Not in PTA data
      serialNumber: '', // Not in PTA data
      parts: [], // Not used in RPCPPE
      unitOfMeasurement: ptaItem.unitOfMeasurement,
      unitValue: ptaItem.unitValue,
      dateAcquired,
      estimatedUsefulLife: 5, // Default
      movements: ptaItem.movements.map(m => ({
        id: m.id,
        ptaId: m.ptaId,
        dateAssigned: m.dateAssigned,
        parItrNumber: m.parItrNumber,
        plantillaEmployeeId: m.plantillaEmployeeId,
        nonPlantillaEmployeeId: m.nonPlantillaEmployeeId,
        actualOfficeId: m.actualOfficeId || undefined,
        actualDivisionId: m.actualDivisionId || undefined,
        condition: m.condition,
        isActive: m.isActive,
        isDeleted: false,
        createdAt: m.dateAssigned,
      })),
    };
  }
}
