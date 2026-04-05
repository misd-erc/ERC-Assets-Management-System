export interface FilteredRMSIItemDetailResponseModel {
  risNumber?: string | null;
  responsibilityCenterCode?: string | null;
  issueQuantity: number; // Assuming this is also a long/int in your C# detail model
}

export interface FilteredRMSIItemGroupResponseModel {
  stockNumber?: string | null;
  itemDescription?: string | null;
  total: number; // Maps to your C# 'long Total'
  items?: FilteredRMSIItemDetailResponseModel[] | null;
}