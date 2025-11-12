export const formatCurrency = (n = 0) =>
  n.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 });

export const getStockStatus = (s: any) => {
  if (!s) return 'Unknown';
  if (s.currentStock === 0) return 'Out of Stock';
  if (s.currentStock <= s.reorderPoint) return 'Low Stock';
  return 'Available';
};

export const getStockStatusColor = (status: string) => {
  switch (status) {
    case 'Available': return 'bg-green-100 text-green-800';
    case 'Low Stock': return 'bg-yellow-100 text-yellow-800';
    case 'Out of Stock': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};
