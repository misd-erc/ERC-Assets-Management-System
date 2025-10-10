import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  FileText, 
  ArrowRightLeft, 
  Clock, 
  User,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface PendingApproval {
  id: string;
  type: string;
  title: string;
  requester: string;
  department: string;
  date: Date;
  priority: 'high' | 'medium' | 'low';
}

export function PendingApprovalsCard() {
  const [approvals, setApprovals] = useState<PendingApproval[]>([
    {
      id: 'RIS-2024-001',
      type: 'RIS',
      title: 'Office Supplies Request',
      requester: 'John Doe',
      department: 'Finance',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      priority: 'high'
    },
    {
      id: 'PTR-2024-015',
      type: 'Transfer',
      title: 'IT Equipment Transfer',
      requester: 'Jane Smith',
      department: 'IT Department',
      date: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      priority: 'medium'
    },
    {
      id: 'DISP-2024-003',
      type: 'Disposal',
      title: 'Old Computer Disposal',
      requester: 'Mike Johnson',
      department: 'Admin',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      priority: 'low'
    }
  ]);

  const handleApprove = (id: string) => {
    setApprovals(prev => prev.filter(approval => approval.id !== id));
    toast.success(`Request ${id} approved successfully`);
  };

  const handleReview = (id: string) => {
    toast.info(`Opening ${id} for detailed review`);
  };

  const handleViewAll = () => {
    toast.info('Navigating to approvals management page');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'RIS':
        return FileText;
      case 'Transfer':
        return ArrowRightLeft;
      case 'Disposal':
        return AlertTriangle;
      default:
        return FileText;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Pending Approvals</span>
          <Badge variant="destructive">{approvals.length}</Badge>
        </CardTitle>
        <CardDescription>
          Requests requiring your approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {approvals.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No pending approvals</p>
            </div>
          ) : (
            approvals.map((approval) => {
            const Icon = getTypeIcon(approval.type);
            return (
              <div key={approval.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm">{approval.title}</p>
                      <p className="text-xs text-muted-foreground">{approval.id}</p>
                    </div>
                  </div>
                  <Badge className={`text-xs ${getPriorityColor(approval.priority)}`}>
                    {approval.priority}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{approval.requester}</span>
                    </div>
                    <span>•</span>
                    <span>{approval.department}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(approval.date)}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleApprove(approval.id)}
                  >
                    Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleReview(approval.id)}
                  >
                    Review
                  </Button>
                </div>
              </div>
            );
          })
          )}
        </div>
        
        <Button variant="outline" className="w-full mt-4" size="sm" onClick={handleViewAll}>
          View All Approvals
        </Button>
      </CardContent>
    </Card>
  );
}
