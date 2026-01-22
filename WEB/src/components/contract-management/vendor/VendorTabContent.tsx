import { DivisionTable } from '@/components/office-management/division/DivisionTable';
import { Vendor, VwDivision } from '@/types';
import { VendorTable } from './VendorTable';

interface Props {
  data: Vendor[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (vendor: Vendor) => void;
  onDelete: (id: number, name: string) => void;
}

export const VendorTabContent = ({ data, loading, onAdd, onEdit, onDelete }: Props) => {
  if (loading) {
    return <p className="text-center text-gray-500 py-12">Loading vendors...</p>;
  }

  return (
    <VendorTable
      data={data}
      onAdd={onAdd}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
};




