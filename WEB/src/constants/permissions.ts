import {
  Plus,
  Shield,
  Users,
  Eye,
  Edit,
  Trash2,
  Settings,
  FileText,
  BarChart3,
  Package,
  Archive,
  ArrowRightLeft,
  FolderOpen,
  CheckCircle,
  HardHat,
  Building2,
  Calendar,
  MessageSquare,
  LayoutDashboard
} from 'lucide-react';

// TOR-based permissions organized by module/feature
export const PERMISSION_CATEGORIES = {
  'Dashboard': [
    { id: '1', label: 'Dashboard', description: 'Access to dashboard', icon: LayoutDashboard }
  ],
  'Collaboration': [
    { id: '2', label: 'Calendar & Notifications', description: 'Manage calendar and notifications', icon: Calendar },
    { id: '3', label: 'Communication Tools', description: 'Access communication tools', icon: MessageSquare }
  ],
  'Core Operations': [
    { id: '4', label: 'Category Management', description: 'Manage asset categories', icon: FolderOpen },
    { id: '5', label: 'Delivery & Receipt of Items', description: 'Handle deliveries and receipts', icon: Package },
    { id: '6', label: 'Supply Management', description: 'Manage supplies inventory', icon: Archive },
    { id: '8', label: 'Disposal of Properties', description: 'Handle asset disposals', icon: Trash2 },
    { id: '9', label: 'Contract Management', description: 'Manage contracts', icon: FileText }
  ],
  'Asset Management': [
    { id: '10', label: 'PPE & SE', description: 'Manage PPE and semi-expendables encoding', icon: Package },
    { id: '7', label: 'Transfers & Returns', description: 'Process transfers and returns', icon: ArrowRightLeft },
 ],
  'Reports & Approvals': [
    { id: '12', label: 'Reports Center', description: 'Generate and view reports', icon: BarChart3 },
    { id: '13', label: 'Approvals', description: 'Process approval workflows', icon: CheckCircle }
  ],
  'Administration': [
    { id: '14', label: 'User Management', description: 'Manage system users', icon: Users },
    { id: '15', label: 'Roles Management', description: 'Manage user roles', icon: Shield },
    { id: '16', label: 'Office Management', description: 'Manage office related settings', icon: Building2 },
    { id: '17', label: 'System Settings', description: 'Configure system settings', icon: Settings },
    { id: '18', label: 'Audit Logs', description: 'View system audit logs', icon: Eye }
  ]
};
