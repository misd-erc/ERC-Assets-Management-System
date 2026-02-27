import { Badge } from '@/components/ui/badge';

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Pending':
      return <Badge className="bg-amber-100 text-amber-800 border-0">Pending</Badge>;
    case 'Approved':
      return <Badge className="bg-blue-100 text-blue-800 border-0">Approved</Badge>;
    case 'Disposed':
      return <Badge className="bg-green-100 text-green-800 border-0">Disposed</Badge>;
    case 'Rejected':
      return <Badge className="bg-red-100 text-red-800 border-0">Rejected</Badge>;
    default:
      return <Badge className="bg-slate-100 text-slate-800 border-0">Unknown</Badge>;
  }
};
