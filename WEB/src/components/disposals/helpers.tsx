import { Badge } from '@/components/ui/badge';

const getMethodBadge = (method?: string) => {
  switch (method) {
    case 'Sale':
      return <Badge className="bg-green-100 text-green-800 border-0">Sale</Badge>;
    case 'Donation':
      return <Badge className="bg-blue-100 text-blue-800 border-0">Donation</Badge>;
    case 'Destruction':
      return <Badge className="bg-red-100 text-red-800 border-0">Destruction</Badge>;
    case 'Return to Supplier':
      return <Badge className="bg-slate-100 text-slate-800 border-0">Return to Supplier</Badge>;
    default:
      return <Badge className="bg-green-100 text-green-800 border-0">Disposed</Badge>;
  }
};

export const DISPOSAL_METHODS = ['Sale', 'Donation', 'Destruction', 'Return to Supplier'];

/** True if the asset's current condition indicates it has already been disposed (via a prior IIRUP/IIRSP). */
export const isAlreadyDisposed = (condition?: string): boolean =>
  !!condition && DISPOSAL_METHODS.some(m => m.toLowerCase() === condition.toLowerCase());

/** Tailwind classes for an asset's current condition badge (e.g. "Defective For Disposal", or a disposal method once disposed). */
export const getConditionBadgeClass = (condition?: string): string => {
  if (!condition) return 'bg-slate-100 text-slate-800';

  if (condition.toLowerCase() === 'defective for disposal') {
    return 'bg-amber-100 text-amber-800';
  }

  const method = DISPOSAL_METHODS.find(m => m.toLowerCase() === condition.toLowerCase());
  if (method) {
    switch (method) {
      case 'Sale':
        return 'bg-green-100 text-green-800';
      case 'Donation':
        return 'bg-blue-100 text-blue-800';
      case 'Destruction':
        return 'bg-red-100 text-red-800';
      case 'Return to Supplier':
        return 'bg-slate-100 text-slate-800';
    }
  }

  return 'bg-orange-100 text-orange-800';
};

export const getStatusBadge = (status: string, method?: string) => {
  switch (status) {
    case 'Pending':
      return <Badge className="bg-amber-100 text-amber-800 border-0">Pending</Badge>;
    case 'Approved':
      return <Badge className="bg-blue-100 text-blue-800 border-0">Approved</Badge>;
    case 'Disposed':
      return getMethodBadge(method);
    case 'Rejected':
      return <Badge className="bg-red-100 text-red-800 border-0">Rejected</Badge>;
    default:
      return <Badge className="bg-slate-100 text-slate-800 border-0">Unknown</Badge>;
  }
};
