// src/components/employment-type/EmploymentTypeTabContent.tsx
import { EmploymentTypeTable } from './EmploymentTypeTable';
import { EmploymentType } from '../../../types';

interface Props {
  data: EmploymentType[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (type: EmploymentType) => void;
  onDelete: (id: number, name: string) => void;
}

export const EmploymentTypeTabContent = ({ data, loading, onAdd, onEdit, onDelete }: Props) => {
  if (loading) {
    return <p className="text-center text-gray-500 py-12">Loading employment types...</p>;
  }

  return (
    <EmploymentTypeTable
      data={data}
      onAdd={onAdd}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
};