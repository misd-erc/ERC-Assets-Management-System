// src/components/office-management/OfficeTabContent.tsx
import { OfficeTable } from './OfficeTable';
import { Office, VwOffice } from '../../../types';

interface Props {
  data: VwOffice[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (office: Office) => void;
  onDelete: (id: number, name: string) => void;
}

export const OfficeTabContent = ({ data, loading, onAdd, onEdit, onDelete }: Props) => {
  if (loading) {
    return <p className="text-center text-gray-500 py-12">Loading offices...</p>;
  }

  return (
    <OfficeTable
      data={data}
      onAdd={onAdd}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
};