// src/components/office-management/employee/EmployeeTabContent.tsx
import { EmployeeTable } from '@/components/office-management/employee/EmployeeTable';
import { EmployeeDetail } from '@/types';

interface Props {
  data: EmployeeDetail[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (employee: EmployeeDetail) => void;
  onDelete: (id: number, name: string) => void;
}

export const EmployeeTabContent = ({ data, loading, onAdd, onEdit, onDelete }: Props) => {
  if (loading) {
    return <p className="text-center text-gray-500 py-12">Loading employees...</p>;
  }

  return (
    <EmployeeTable
      data={data}
      onAdd={onAdd}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
};
