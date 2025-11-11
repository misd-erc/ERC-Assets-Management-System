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
  Building2
} from 'lucide-react';

// TOR-based permissions organized by module/feature
export const PERMISSION_CATEGORIES = {
  'Core Operations': [
    { id: 'categories', label: 'Category Management', description: 'Manage asset categories', icon: FolderOpen },
    { id: 'deliveries', label: 'Delivery & Receipt', description: 'Handle deliveries and receipts', icon: Package },
    { id: 'supplies', label: 'Supply Management', description: 'Manage supplies inventory', icon: Archive },
    { id: 'transfers', label: 'Transfers & Returns', description: 'Process transfers and returns', icon: ArrowRightLeft },
    { id: 'disposals', label: 'Disposal Management', description: 'Handle asset disposals', icon: Trash2 },
    { id: 'contracts', label: 'Contract Management', description: 'Manage contracts', icon: FileText }
  ],
  'Asset Management': [
    { id: 'ppe', label: 'PPE & Semi-Expendables', description: 'Manage property and equipment', icon: HardHat },
    { id: 'par-ics', label: 'PAR / ICS', description: 'Handle property accountability', icon: FileText }
  ],
  'Reports & Approvals': [
    { id: 'reports', label: 'Reports Center', description: 'Generate and view reports', icon: BarChart3 },
    { id: 'approvals', label: 'Approvals', description: 'Process approval workflows', icon: CheckCircle }
  ],
  'Administration': [
    { id: 'users', label: 'User Management', description: 'Manage system users', icon: Users },
    { id: 'offices', label: 'Office Management', description: 'Manage office related settings', icon: Building2 },
    { id: 'roles', label: 'Role Management', description: 'Manage user roles', icon: Shield },
    { id: 'settings', label: 'System Settings', description: 'Configure system settings', icon: Settings },
    { id: 'audit', label: 'Audit Logs', description: 'View system audit logs', icon: Eye }
  ]
};
