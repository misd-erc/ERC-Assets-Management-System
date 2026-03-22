// src/components/supply-management/supply-ris/RISHeader.tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User } from '@/types';
import { VwOffice, VwDivision } from '@/types'; // adjust import path
import { EditSupplyRIS } from '@/types/supply/ris';

interface Props {
  header: EditSupplyRIS;
  offices: VwOffice[];
  divisions: VwDivision[];
  users: User[];
  isViewMode: boolean;
  onChange: (updated: Partial<EditSupplyRIS>) => void;
}

export const RISHeader = ({
  header,
  offices,
  divisions,
  users,
  isViewMode,
  onChange,
}: Props) => {
  const handleChange = (field: keyof EditSupplyRIS, value: any) => {
    onChange({ [field]: value });
  };

  const filteredDivisions = divisions.filter((d) => d.office?.id === header.officeId);

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <h3 className="font-semibold">RIS Information</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>RIS Number</Label>
          <Input
            value={header.risNumber}
            onChange={(e) => handleChange('risNumber', e.target.value)}
            placeholder="e.g., RIS-2024-001"
            required
            disabled={isViewMode}
          />
        </div>
        <div className="space-y-2">
          <Label>Requested Date</Label>
          <Input
            type="date"
            value={header.risRequestedDate}
            onChange={(e) => handleChange('risRequestedDate', e.target.value)}
            required
            disabled={isViewMode}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Entity Name</Label>
          <Input
            value={header.entityName}
            onChange={(e) => handleChange('entityName', e.target.value)}
            placeholder="e.g., DOST"
            required
            disabled={isViewMode}
          />
        </div>
        <div className="space-y-2">
          <Label>Fund Cluster</Label>
          <Input
            value={header.fundCluster}
            onChange={(e) => handleChange('fundCluster', e.target.value)}
            placeholder="e.g., General Fund"
            required
            disabled={isViewMode}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Office</Label>
          <Select
            value={header.officeId?.toString() || '0'}
            onValueChange={(val) => {
              handleChange('officeId', Number(val));
              if (Number(val) !== header.officeId) handleChange('divisionId', 0);
            }}
            disabled={isViewMode}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Office" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Select Office</SelectItem>
              {offices.map((o) => (
                <SelectItem key={o.id} value={o.id.toString()}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Division</Label>
          <Select
            value={header.divisionId?.toString() || '0'}
            onValueChange={(val) => handleChange('divisionId', Number(val))}
            disabled={isViewMode || !header.officeId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Division" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Select Division</SelectItem>
              {filteredDivisions.map((d) => (
                <SelectItem key={d.id} value={d.id.toString()}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Responsibility Center Code</Label>
        <Input
          value={header.responsibilityCenterCode}
          onChange={(e) => handleChange('responsibilityCenterCode', e.target.value)}
          placeholder="RCC-123"
          required
          disabled={isViewMode}
        />
      </div>

      <div className="space-y-2">
        <Label>Purpose</Label>
        <Textarea
          value={header.risPurpose}
          onChange={(e) => handleChange('risPurpose', e.target.value)}
          placeholder="State the reason for the requisition"
          required
          disabled={isViewMode}
        />
      </div>

      {/* User fields grouped with dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Requested By</Label>
          <Select
            value={header.risRequestedBySystemUserId?.toString() || '0'}
            onValueChange={(val) => handleChange('risRequestedBySystemUserId', val === '0' ? undefined : Number(val))}
            disabled={isViewMode}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Select User</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id.toString()}>
                  {u.firstName} {u.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Requested Date</Label>
          <Input type="date" value={header.risRequestedDate} disabled className="bg-gray-100" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Approved By</Label>
          <Select
            value={header.risApprovedBySystemUserId?.toString() || '0'}
            onValueChange={(val) => handleChange('risApprovedBySystemUserId', val === '0' ? undefined : Number(val))}
            disabled={isViewMode}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Select User</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id.toString()}>
                  {u.firstName} {u.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Approved Date</Label>
          <Input
            type="date"
            value={header.risApprovedDate?.slice(0, 10) || ''}
            onChange={(e) => handleChange('risApprovedDate', e.target.value || undefined)}
            disabled={isViewMode}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Issued By</Label>
          <Select
            value={header.risIssuedBySystemUserId?.toString() || '0'}
            onValueChange={(val) => handleChange('risIssuedBySystemUserId', val === '0' ? undefined : Number(val))}
            disabled={isViewMode}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Select User</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id.toString()}>
                  {u.firstName} {u.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Issued Date</Label>
          <Input
            type="date"
            value={header.risIssuedDate?.slice(0, 10) || ''}
            onChange={(e) => handleChange('risIssuedDate', e.target.value || undefined)}
            disabled={isViewMode}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Received By</Label>
          <Select
            value={header.risReceivedBySystemUserId?.toString() || '0'}
            onValueChange={(val) => handleChange('risReceivedBySystemUserId', val === '0' ? undefined : Number(val))}
            disabled={isViewMode}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Select User</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id.toString()}>
                  {u.firstName} {u.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Received Date</Label>
          <Input
            type="date"
            value={header.risReceivedDate?.slice(0, 10) || ''}
            onChange={(e) => handleChange('risReceivedDate', e.target.value || undefined)}
            disabled={isViewMode}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={header.isActive ? 'active' : 'inactive'}
          onValueChange={(val) => handleChange('isActive', val === 'active')}
          disabled={isViewMode}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};