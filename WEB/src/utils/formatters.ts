import { SupplyItem } from '../types/supply';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const getStatusBadge = (status: string): string => {
  const colors = {
    'Available': 'bg-green-100 text-green-800',
    'Low Stock': 'bg-yellow-100 text-yellow-800',
    'Out of Stock': 'bg-red-100 text-red-800',
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Approved': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Released': 'bg-blue-100 text-blue-800',
    'Delivery': 'bg-blue-100 text-blue-800',
    'Issuance': 'bg-green-100 text-green-800',
    'Return': 'bg-purple-100 text-purple-800',
    'Disposal': 'bg-red-100 text-red-800',
    'Adjustment': 'bg-gray-100 text-gray-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export const getStockStatus = (supply: SupplyItem): string => {
  if (supply.quantity <= (supply.minThreshold || 0)) return 'Low Stock';
  if (supply.quantity === 0) return 'Out of Stock';
  return 'Available';
};

export const getStockStatusColor = (status: string): string => {
  switch (status) {
    case 'Available': return 'bg-green-100 text-green-800';
    case 'Low Stock': return 'bg-yellow-100 text-yellow-800';
    case 'Out of Stock': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};
