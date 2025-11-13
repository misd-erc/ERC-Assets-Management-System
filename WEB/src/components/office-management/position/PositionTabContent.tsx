// src/components/position/PositionTabContent.tsx
import { PositionTable } from './PositionTable';
import { Position, VwPosition } from '@/types';

interface Props {
  data: VwPosition[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (position: Position) => void;
  onDelete: (id: number, name: string) => void;
}

export const PositionTabContent = ({ data, loading, onAdd, onEdit, onDelete }: Props) => {
  if (loading) {
    return <p className="text-center text-gray-500 py-12">Loading positions...</p>;
  }

  return (
    <PositionTable
      data={data}
      onAdd={onAdd}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
};

