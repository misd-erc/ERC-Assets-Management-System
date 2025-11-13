// src/components/office-management/DivisionTabContent.tsx
import { DivisionTable } from './DivisionTable';
import { VwDivision } from '@/types';

interface Props {
  data: VwDivision[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (division: VwDivision) => void;
  onDelete: (id: number, name: string) => void;
}

export const DivisionTabContent = ({ data, loading, onAdd, onEdit, onDelete }: Props) => {
  if (loading) {
    return <p className="text-center text-gray-500 py-12">Loading divisions...</p>;
  }

  return (
    <DivisionTable
      data={data}
      onAdd={onAdd}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
};

