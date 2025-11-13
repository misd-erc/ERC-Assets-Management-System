import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Package,
  FileText,
  ArrowRightLeft,
  DollarSign,
  Calendar,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

interface ApprovalRequest {
  id: string;
  type: 'ris' | 'transfer' | 'disposal' | 'par';
  title: string;
  description: string;
  requester: string;
  department: string;
  priority: 'high' | 'medium' | 'low';
  submittedDate: Date;
  dueDate?: Date;
  totalValue?: number;
  items: Array<{
    name: string;
    quantity: number;
    value?: number;
    unit?: string;
  }>;
}

export function PendingApprovalsCard() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([
    {
      id: 'RIS-2024-001',
      type: 'ris',
      title: 'Office Supplies Request',
      description: 'Monthly office supplies requisition for Q1 2024',
      requester: 'John Smith',
      department: 'Administration',
      priority: 'medium',
      submittedDate: new Date('2024-01-15'),
      dueDate: new Date('2024-01-25'),
      totalValue: 12500,
      items: [
        { name: 'Ballpoint Pens (Blue)', quantity: 50, unit: 'pcs' },
        { name: 'A4 Paper (500 sheets)', quantity: 10, unit: 'reams' },
        { name: 'Printer Ink Cartridges', quantity: 5, unit: 'pcs' },
      ],
    },
    {
      id: 'PAR-2024-002',
      type: 'par',
      title: 'New Laptop Assignment',
      description: 'Property Acknowledgment Receipt for IT equipment procurement',
      requester: 'Jane Doe',
      department: 'IT Department',
      priority: 'high',
      submittedDate: new Date('2024-01-14'),
      dueDate: new Date('2024-01-20'),
      totalValue: 65000,
      items: [
        { name: 'Dell Latitude 7420', quantity: 1, value: 65000, unit: 'unit' },
      ],
    },
    {
      id: 'TRF-2024-003',
      type: 'transfer',
      title: 'Equipment Transfer',
      description: 'Transfer of office equipment between departments',
      requester: 'Mike Johnson',
      department: 'Operations',
      priority: 'low',
      submittedDate: new Date('2024-01-13'),
      dueDate: new Date('2024-01-30'),
      items: [
        { name: 'Executive Office Chair', quantity: 2, unit: 'pcs' },
        { name: 'LED Desk Lamp', quantity: 1, unit: 'pc' },
      ],
    },
    {
      id: 'DIS-2024-004',
      type: 'disposal',
      title: 'Obsolete Equipment Disposal',
      description: 'Disposal of outdated computer equipment',
      requester: 'Sarah Wilson',
      department: 'IT Department',
      priority: 'high',
      submittedDate: new Date('2024-01-12'),
      dueDate: new Date('2024-01-18'),
      totalValue: 25000,
      items: [
        { name: 'Old Desktop Computers', quantity: 5, value: 5000, unit: 'units' },
      ],
    },
  ]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ris':
        return FileText;
      case 'par':
        return Package;
      case 'transfer':
        return ArrowRightLeft;
      case 'disposal':
        return AlertTriangle;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ris':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'par':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'transfer':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'disposal':
        return 'bg-red-50 text-red-600 border-red-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleApprove = (id: string) => {
    setApprovals(prev => prev.filter(item => item.id !== id));
    toast.success(`Request ${id} approved successfully`);
  };

  const handleReject = (id: string) => {
    setApprovals(prev => prev.filter(item => item.id !== id));
    toast.success(`Request ${id} rejected`);
  };

  const handleViewDetails = (request: ApprovalRequest) => {
    toast.info(`Viewing details for ${request.id}`);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `â‚±${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `â‚±${(amount / 1000).toFixed(2)}K`;
    }
    return `â‚±${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilDue = (dueDate?: Date) => {
    if (!dueDate) return null;
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyColor = (daysUntilDue: number | null) => {
    if (daysUntilDue === null) return '';
    if (daysUntilDue <= 1) return 'text-red-600 font-semibold';
    if (daysUntilDue <= 3) return 'text-amber-600 font-medium';
    return 'text-slate-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Pending Approvals</span>
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            {approvals.length} pending
          </Badge>
        </CardTitle>
        <CardDescription>
          Requests awaiting your approval and review
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {approvals.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  All requests have been processed
                </p>
              </div>
            ) : (
              approvals.map((request) => {
                const Icon = getTypeIcon(request.type);
                const daysUntilDue = getDaysUntilDue(request.dueDate);
                return (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getTypeColor(request.type)}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{request.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {request.id} â€¢ {request.requester}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge className={`text-xs ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </Badge>
                        {request.totalValue && (
                          <div className="flex items-center text-xs text-slate-600">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {formatCurrency(request.totalValue)}
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3">
                      {request.description}
                    </p>

                    {/* Items Summary */}
                    <div className="mb-3 p-2 bg-slate-50 rounded text-xs">
                      <p className="font-medium text-slate-700 mb-1">Items ({request.items.length}):</p>
                      <div className="space-y-1">
                        {request.items.slice(0, 2).map((item, index) => (
                          <div key={index} className="flex justify-between text-slate-600">
                            <span>{item.name}</span>
                            <span>{item.quantity} {item.unit}</span>
                          </div>
                        ))}
                        {request.items.length > 2 && (
                          <p className="text-slate-500">+{request.items.length - 2} more items</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          <span>{request.department}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{formatDate(request.submittedDate)}</span>
                        </div>
                      </div>
                      {daysUntilDue !== null && (
                        <div className={`flex items-center ${getUrgencyColor(daysUntilDue)}`}>
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{daysUntilDue <= 0 ? 'Overdue' : `${daysUntilDue}d left`}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(request)}
                        className="flex-1"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(request.id)}
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}




