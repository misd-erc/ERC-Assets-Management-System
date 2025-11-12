export const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      case 'Suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

export const getActivityColor = (type: string) => {
    switch (type) {
      case 'issued':
        return 'bg-blue-50 text-blue-600';
      case 'transferred':
        return 'bg-purple-50 text-purple-600';
      case 'returned':
        return 'bg-green-50 text-green-600';
      case 'created':
        return 'bg-indigo-50 text-indigo-600';
      case 'disposed':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };