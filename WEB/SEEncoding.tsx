import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { 
  Settings,
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Upload,
  History,
  Package,
  DollarSign,
  User,
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
  RotateCcw,
  FileText,
  CheckCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { toast } from 'sonner@2.0.3';

// SE Asset Interface
interface SEAsset {
  id: string;
  se_property_number: string;
  category: string;
  legend: string;
  description: string;
  brand: string;
  model: string;
  serial_number: string;
  parts_accessories: string;
  unit_of_measurement: string;
  unit_value: number;
  date_acquired: string;
  warranty_status: 'In Warranty' | 'Expired' | 'Unknown';
  accountabilityBlocks: SEAccountabilityBlock[];
  movementHistory: SEMovementHistory[];
  rrspHistory: RRSPEntry[];
  dateEncoded: string;
  status: 'Active' | 'Returned' | 'Lost' | 'Unserviceable';
}

interface SEAccountabilityBlock {
  id: string;
  itr_rrsp_number: string;
  plantilla_employee_id: string;
  non_plantilla_employee_id: string;
  division_section: string;
  condition: string;
  date_issued_returned: string;
  remarks: string;
  label: 'Current Holder' | 'Previous Holder' | 'Original Holder';
  type: 'ITR' | 'RRSP';
}

interface SEMovementHistory {
  id: string;
  type: 'Issuance' | 'Return' | 'Transfer' | 'Condition Change' | 'Lost' | 'Unserviceable';
  date: string;
  from_employee?: string;
  to_employee: string;
  condition: string;
  remarks: string;
  documentNumber: string;
}

interface RRSPEntry {
  id: string;
  rrsp_number: string;
  se_property_number: string;
  employee_returning: string;
  condition_on_return: string;
  findings: string;
  verified_by: string;
  date_returned: string;
  photos?: string[];
}

interface SEEncodingProps {}

// Sample SE Data - 10 realistic entries for ERC
const initialSEData: SEAsset[] = [
  {
    id: '1',
    se_property_number: '10605030-02-MOUSE-001',
    category: 'ICT Equipment',
    legend: 'Computer Mouse',
    description: 'Wireless Optical Mouse, Ergonomic Design, USB Receiver',
    brand: 'Logitech',
    model: 'M185',
    serial_number: 'LOG-MS-2023-145',
    parts_accessories: 'USB Receiver, AAA Battery',
    unit_of_measurement: 'unit',
    unit_value: 450,
    date_acquired: '2023-05-10',
    warranty_status: 'Expired',
    accountabilityBlocks: [
      {
        id: '1',
        itr_rrsp_number: 'ITR-2023-0156',
        plantilla_employee_id: 'ERC-2021-0089',
        non_plantilla_employee_id: '',
        division_section: 'Technical Service',
        condition: 'Working',
        date_issued_returned: '2023-05-15',
        remarks: '',
        label: 'Current Holder',
        type: 'ITR'
      }
    ],
    movementHistory: [],
    rrspHistory: [],
    dateEncoded: '2023-05-10T09:00:00Z',
    status: 'Active'
  },
  {
    id: '2',
    se_property_number: '10605030-03-KB-002',
    category: 'ICT Equipment',
    legend: 'Computer Keyboard',
    description: 'Wireless Keyboard, Slim Profile, Multimedia Keys, USB Receiver',
    brand: 'Logitech',
    model: 'K270',
    serial_number: 'LOG-KB-2023-178',
    parts_accessories: 'USB Receiver, AA Batteries (2pcs)',
    unit_of_measurement: 'unit',
    unit_value: 850,
    date_acquired: '2023-05-10',
    warranty_status: 'In Warranty',
    accountabilityBlocks: [
      {
        id: '1',
        itr_rrsp_number: 'ITR-2023-0157',
        plantilla_employee_id: 'ERC-2021-0089',
        non_plantilla_employee_id: '',
        division_section: 'Technical Service',
        condition: 'Working',
        date_issued_returned: '2023-05-15',
        remarks: '',
        label: 'Current Holder',
        type: 'ITR'
      }
    ],
    movementHistory: [],
    rrspHistory: [],
    dateEncoded: '2023-05-10T09:05:00Z',
    status: 'Active'
  },
  {
    id: '3',
    se_property_number: '10605010-01-CHAIR-003',
    category: 'Furniture',
    legend: 'Office Chair',
    description: 'Ergonomic Office Chair, Mesh Back, Adjustable Height, Swivel Base',
    brand: 'Ergotec',
    model: 'Mesh-Pro 2000',
    serial_number: 'ERG-CH-2023-234',
    parts_accessories: 'Height Adjustment Lever, Base Cover',
    unit_of_measurement: 'unit',
    unit_value: 8500,
    date_acquired: '2023-02-20',
    warranty_status: 'In Warranty',
    accountabilityBlocks: [
      {
        id: '1',
        itr_rrsp_number: 'ITR-2023-0045',
        plantilla_employee_id: 'ERC-2020-0134',
        non_plantilla_employee_id: '',
        division_section: 'Finance Service',
        condition: 'Working',
        date_issued_returned: '2023-02-25',
        remarks: '',
        label: 'Current Holder',
        type: 'ITR'
      }
    ],
    movementHistory: [],
    rrspHistory: [],
    dateEncoded: '2023-02-20T10:30:00Z',
    status: 'Active'
  },
  {
    id: '4',
    se_property_number: '10605030-04-HDST-004',
    category: 'ICT Equipment',
    legend: 'Headset with Microphone',
    description: 'USB Headset, Noise Cancelling Microphone, In-line Controls',
    brand: 'Plantronics',
    model: 'Blackwire C3220',
    serial_number: 'PLT-HS-2024-089',
    parts_accessories: 'Foam Ear Cushions, Carrying Pouch',
    unit_of_measurement: 'unit',
    unit_value: 3200,
    date_acquired: '2024-01-15',
    warranty_status: 'In Warranty',
    accountabilityBlocks: [
      {
        id: '1',
        itr_rrsp_number: 'ITR-2024-0012',
        plantilla_employee_id: '',
        non_plantilla_employee_id: 'COS-2023-0067',
        division_section: 'Legal Service',
        condition: 'Working',
        date_issued_returned: '2024-01-20',
        remarks: '',
        label: 'Current Holder',
        type: 'ITR'
      }
    ],
    movementHistory: [],
    rrspHistory: [],
    dateEncoded: '2024-01-15T11:15:00Z',
    status: 'Active'
  },
  {
    id: '5',
    se_property_number: '10605020-01-EXT-005',
    category: 'ICT Equipment',
    legend: 'External Hard Drive',
    description: 'Portable External Hard Drive, 2TB, USB 3.0, Shock Resistant',
    brand: 'Western Digital',
    model: 'Elements 2TB',
    serial_number: 'WD-EHD-2023-456',
    parts_accessories: 'USB Cable, Protective Case',
    unit_of_measurement: 'unit',
    unit_value: 4500,
    date_acquired: '2023-09-05',
    warranty_status: 'In Warranty',
    accountabilityBlocks: [
      {
        id: '1',
        itr_rrsp_number: 'ITR-2023-0189',
        plantilla_employee_id: 'ERC-2019-0112',
        non_plantilla_employee_id: '',
        division_section: 'Planning and Policy Service',
        condition: 'Working',
        date_issued_returned: '2023-09-10',
        remarks: '',
        label: 'Current Holder',
        type: 'ITR'
      }
    ],
    movementHistory: [],
    rrspHistory: [],
    dateEncoded: '2023-09-05T14:20:00Z',
    status: 'Active'
  },
  {
    id: '6',
    se_property_number: '10605030-05-WEB-006',
    category: 'ICT Equipment',
    legend: 'Webcam',
    description: 'HD Webcam, 1080p, Built-in Microphone, USB Connection',
    brand: 'Logitech',
    model: 'C920',
    serial_number: 'LOG-WC-2023-789',
    parts_accessories: 'Mounting Clip, USB Cable',
    unit_of_measurement: 'unit',
    unit_value: 5200,
    date_acquired: '2023-07-12',
    warranty_status: 'In Warranty',
    accountabilityBlocks: [
      {
        id: '1',
        itr_rrsp_number: 'ITR-2023-0134',
        plantilla_employee_id: 'ERC-2020-0078',
        non_plantilla_employee_id: '',
        division_section: 'Legal Service',
        condition: 'Working',
        date_issued_returned: '2023-07-17',
        remarks: '',
        label: 'Current Holder',
        type: 'ITR'
      }
    ],
    movementHistory: [],
    rrspHistory: [],
    dateEncoded: '2023-07-12T09:45:00Z',
    status: 'Active'
  },
  {
    id: '7',
    se_property_number: '10605040-01-CALC-007',
    category: 'Office Supplies',
    legend: 'Calculator',
    description: 'Desktop Calculator, 12-Digit Display, Solar/Battery Powered, Tax Function',
    brand: 'Casio',
    model: 'DS-120TV',
    serial_number: 'CAS-CAL-2022-345',
    parts_accessories: 'Battery, User Manual',
    unit_of_measurement: 'unit',
    unit_value: 1200,
    date_acquired: '2022-11-08',
    warranty_status: 'Expired',
    accountabilityBlocks: [
      {
        id: '1',
        itr_rrsp_number: 'ITR-2022-0256',
        plantilla_employee_id: 'ERC-2020-0134',
        non_plantilla_employee_id: '',
        division_section: 'Finance Service',
        condition: 'Working',
        date_issued_returned: '2022-11-12',
        remarks: '',
        label: 'Current Holder',
        type: 'ITR'
      }
    ],
    movementHistory: [],
    rrspHistory: [],
    dateEncoded: '2022-11-08T10:00:00Z',
    status: 'Active'
  },
  {
    id: '8',
    se_property_number: '10605030-06-FAN-008',
    category: 'Office Equipment',
    legend: 'Electric Fan',
    description: 'Stand Fan, 16-inch, 3-Speed Settings, Oscillating, Remote Control',
    brand: 'Standard',
    model: 'Industrial Fan IF-40',
    serial_number: 'STD-FAN-2023-123',
    parts_accessories: 'Remote Control, AAA Batteries',
    unit_of_measurement: 'unit',
    unit_value: 2800,
    date_acquired: '2023-04-05',
    warranty_status: 'In Warranty',
    accountabilityBlocks: [
      {
        id: '1',
        itr_rrsp_number: 'ITR-2023-0078',
        plantilla_employee_id: 'ERC-2018-0034',
        non_plantilla_employee_id: '',
        division_section: 'Administrative Service',
        condition: 'Working',
        date_issued_returned: '2023-04-10',
        remarks: '',
        label: 'Current Holder',
        type: 'ITR'
      }
    ],
    movementHistory: [],
    rrspHistory: [],
    dateEncoded: '2023-04-05T13:30:00Z',
    status: 'Active'
  },
  {
    id: '9',
    se_property_number: '10605030-07-LAMP-009',
    category: 'Furniture',
    legend: 'Desk Lamp',
    description: 'LED Desk Lamp, Adjustable Arm, Touch Control, USB Charging Port',
    brand: 'Philips',
    model: 'Lever LED',
    serial_number: 'PHL-LMP-2023-567',
    parts_accessories: 'Power Adapter, User Manual',
    unit_of_measurement: 'unit',
    unit_value: 3500,
    date_acquired: '2023-06-22',
    warranty_status: 'In Warranty',
    accountabilityBlocks: [
      {
        id: '1',
        itr_rrsp_number: 'ITR-2023-0123',
        plantilla_employee_id: 'ERC-2019-0125',
        non_plantilla_employee_id: '',
        division_section: 'Office of the Chairman and CEO',
        condition: 'Working',
        date_issued_returned: '2023-06-27',
        remarks: '',
        label: 'Current Holder',
        type: 'ITR'
      }
    ],
    movementHistory: [],
    rrspHistory: [],
    dateEncoded: '2023-06-22T11:00:00Z',
    status: 'Active'
  },
  {
    id: '10',
    se_property_number: '10605030-08-PUNCH-010',
    category: 'Office Supplies',
    legend: 'Paper Punch',
    description: 'Heavy Duty Paper Punch, 2-Hole, 40-Sheet Capacity, Metal Construction',
    brand: 'Deli',
    model: 'E0102',
    serial_number: 'DLI-PNC-2023-890',
    parts_accessories: 'Chip Tray',
    unit_of_measurement: 'unit',
    unit_value: 650,
    date_acquired: '2023-03-18',
    warranty_status: 'Unknown',
    accountabilityBlocks: [
      {
        id: '1',
        itr_rrsp_number: 'ITR-2023-0056',
        plantilla_employee_id: '',
        non_plantilla_employee_id: 'JO-2022-0045',
        division_section: 'Administrative Service',
        condition: 'Working',
        date_issued_returned: '2023-03-22',
        remarks: '',
        label: 'Current Holder',
        type: 'ITR'
      }
    ],
    movementHistory: [],
    rrspHistory: [],
    dateEncoded: '2023-03-18T08:45:00Z',
    status: 'Active'
  }
];

export function SEEncoding({}: SEEncodingProps) {
  const [seAssets, setSEAssets] = useState<SEAsset[]>(initialSEData);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCondition, setFilterCondition] = useState('all');
  const [filterDivision, setFilterDivision] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showRRSPDialog, setShowRRSPDialog] = useState(false);
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [selectedSE, setSelectedSE] = useState<SEAsset | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    identification: true,
    acquisition: true,
    accountability: true,
    movement: true
  });

  // Form data
  const [formData, setFormData] = useState({
    se_property_number: '',
    category: '',
    legend: '',
    description: '',
    brand: '',
    model: '',
    serial_number: '',
    parts_accessories: '',
    unit_of_measurement: 'unit',
    unit_value: 0,
    date_acquired: '',
    warranty_status: 'Unknown' as const,
    accountabilityBlocks: [
      {
        id: '1',
        itr_rrsp_number: '',
        plantilla_employee_id: '',
        non_plantilla_employee_id: '',
        division_section: '',
        condition: 'Working',
        date_issued_returned: new Date().toISOString().split('T')[0],
        remarks: '',
        label: 'Current Holder' as const,
        type: 'ITR' as const
      },
      {
        id: '2',
        itr_rrsp_number: '',
        plantilla_employee_id: '',
        non_plantilla_employee_id: '',
        division_section: '',
        condition: 'Working',
        date_issued_returned: '',
        remarks: '',
        label: 'Previous Holder' as const,
        type: 'ITR' as const
      },
      {
        id: '3',
        itr_rrsp_number: '',
        plantilla_employee_id: '',
        non_plantilla_employee_id: '',
        division_section: '',
        condition: 'Working',
        date_issued_returned: '',
        remarks: '',
        label: 'Original Holder' as const,
        type: 'ITR' as const
      }
    ]
  });

  // RRSP Form Data
  const [rrspFormData, setRRSPFormData] = useState({
    rrsp_number: '',
    se_property_number: '',
    employee_returning: '',
    condition_on_return: 'Working',
    findings: '',
    verified_by: '',
    date_returned: new Date().toISOString().split('T')[0]
  });

  // Transfer Form Data
  const [transferFormData, setTransferFormData] = useState({
    from_employee: '',
    to_employee: '',
    division_section: '',
    date: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  const resetForm = () => {
    setFormData({
      se_property_number: '',
      category: '',
      legend: '',
      description: '',
      brand: '',
      model: '',
      serial_number: '',
      parts_accessories: '',
      unit_of_measurement: 'unit',
      unit_value: 0,
      date_acquired: '',
      warranty_status: 'Unknown',
      accountabilityBlocks: [
        {
          id: '1',
          itr_rrsp_number: '',
          plantilla_employee_id: '',
          non_plantilla_employee_id: '',
          division_section: '',
          condition: 'Working',
          date_issued_returned: new Date().toISOString().split('T')[0],
          remarks: '',
          label: 'Current Holder',
          type: 'ITR'
        },
        {
          id: '2',
          itr_rrsp_number: '',
          plantilla_employee_id: '',
          non_plantilla_employee_id: '',
          division_section: '',
          condition: 'Working',
          date_issued_returned: '',
          remarks: '',
          label: 'Previous Holder',
          type: 'ITR'
        },
        {
          id: '3',
          itr_rrsp_number: '',
          plantilla_employee_id: '',
          non_plantilla_employee_id: '',
          division_section: '',
          condition: 'Working',
          date_issued_returned: '',
          remarks: '',
          label: 'Original Holder',
          type: 'ITR'
        }
      ]
    });
  };

  const handleSubmit = (e: React.FormEvent, addAnother = false) => {
    e.preventDefault();

    // Validation
    if (!formData.se_property_number || !formData.description) {
      toast.error('Please fill in all required fields: SE Property Number and Description');
      return;
    }

    if (!formData.date_acquired) {
      toast.error('Date Acquired is required');
      return;
    }

    // SE must be below ₱50,000
    if (formData.unit_value >= 50000) {
      toast.error('Unit Value for Semi-Expendable must be below ₱50,000');
      return;
    }

    // Check if date is not in the future
    const acquiredDate = new Date(formData.date_acquired);
    if (acquiredDate > new Date()) {
      toast.error('Date Acquired cannot be in the future');
      return;
    }

    // Validate condition remarks
    const currentBlock = formData.accountabilityBlocks[0];
    if (['Not Working', 'Unserviceable'].includes(currentBlock.condition) && !currentBlock.remarks) {
      toast.error('Remarks are required when condition is "Not Working" or "Unserviceable"');
      return;
    }

    const newSE: SEAsset = {
      id: Math.random().toString(36).substr(2, 9),
      se_property_number: formData.se_property_number,
      category: formData.category,
      legend: formData.legend,
      description: formData.description,
      brand: formData.brand,
      model: formData.model,
      serial_number: formData.serial_number,
      parts_accessories: formData.parts_accessories,
      unit_of_measurement: formData.unit_of_measurement,
      unit_value: formData.unit_value,
      date_acquired: formData.date_acquired,
      warranty_status: formData.warranty_status,
      accountabilityBlocks: formData.accountabilityBlocks.filter(block => 
        block.itr_rrsp_number || block.plantilla_employee_id || block.non_plantilla_employee_id
      ),
      movementHistory: [],
      rrspHistory: [],
      dateEncoded: new Date().toISOString(),
      status: 'Active'
    };

    if (showEditDialog && selectedSE) {
      setSEAssets(prev => prev.map(s => s.id === selectedSE.id ? { ...newSE, id: selectedSE.id } : s));
      toast.success('SE Asset updated successfully');
      setShowEditDialog(false);
    } else {
      setSEAssets(prev => [...prev, newSE]);
      toast.success('SE Asset added successfully');
      if (addAnother) {
        resetForm();
      } else {
        setShowAddDialog(false);
      }
    }

    if (!addAnother) {
      resetForm();
      setSelectedSE(null);
    }
  };

  const handleEdit = (se: SEAsset) => {
    setSelectedSE(se);
    setFormData({
      se_property_number: se.se_property_number,
      category: se.category,
      legend: se.legend,
      description: se.description,
      brand: se.brand,
      model: se.model,
      serial_number: se.serial_number,
      parts_accessories: se.parts_accessories,
      unit_of_measurement: se.unit_of_measurement,
      unit_value: se.unit_value,
      date_acquired: se.date_acquired,
      warranty_status: se.warranty_status,
      accountabilityBlocks: se.accountabilityBlocks.length > 0 ? se.accountabilityBlocks : [
        {
          id: '1',
          itr_rrsp_number: '',
          plantilla_employee_id: '',
          non_plantilla_employee_id: '',
          division_section: '',
          condition: 'Working',
          date_issued_returned: new Date().toISOString().split('T')[0],
          remarks: '',
          label: 'Current Holder',
          type: 'ITR'
        },
        {
          id: '2',
          itr_rrsp_number: '',
          plantilla_employee_id: '',
          non_plantilla_employee_id: '',
          division_section: '',
          condition: 'Working',
          date_issued_returned: '',
          remarks: '',
          label: 'Previous Holder',
          type: 'ITR'
        },
        {
          id: '3',
          itr_rrsp_number: '',
          plantilla_employee_id: '',
          non_plantilla_employee_id: '',
          division_section: '',
          condition: 'Working',
          date_issued_returned: '',
          remarks: '',
          label: 'Original Holder',
          type: 'ITR'
        }
      ]
    });
    setShowEditDialog(true);
  };

  const handleDelete = () => {
    if (selectedSE) {
      setSEAssets(prev => prev.filter(s => s.id !== selectedSE.id));
      toast.success('SE Asset deleted successfully');
      setShowDeleteDialog(false);
      setSelectedSE(null);
    }
  };

  const downloadSETemplate = () => {
    // SE CSV Template with headers and sample row
    const headers = [
      'SE Property Number (COA Format)',
      'Category',
      'Legend/Sub-Category',
      'Description',
      'Brand',
      'Model',
      'Serial Number',
      'Parts/Accessories',
      'Unit of Measurement',
      'Unit Value (PHP - Below 50000)',
      'Date Acquired (YYYY-MM-DD)',
      'Warranty Status',
      'ITR/RRSP Number',
      'Plantilla Employee ID',
      'Non-Plantilla Employee ID',
      'Division/Section',
      'Condition',
      'Date Issued/Returned (YYYY-MM-DD)',
      'Remarks'
    ];

    const sampleRow = [
      '10605030-02-MOUSE-001',
      'ICT Equipment',
      'Computer Mouse',
      'Wireless Optical Mouse, Ergonomic Design, USB Receiver',
      'Logitech',
      'M185',
      'LOG-MS-2024-001',
      'USB Receiver, AAA Battery',
      'unit',
      '450',
      '2024-01-15',
      'In Warranty',
      'ITR-2024-0001',
      'ERC-2024-0001',
      '',
      'Technical Service',
      'Working',
      '2024-01-20',
      ''
    ];

    const csvContent = [
      headers.join(','),
      sampleRow.join(','),
      // Add empty rows for bulk entry
      Array(9).fill('').join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ERC_SE_Template_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('SE Template downloaded successfully');
  };

  const handleTransfer = () => {
    if (!selectedSE) return;

    if (!transferFormData.to_employee || !transferFormData.division_section) {
      toast.error('Please fill in all transfer details');
      return;
    }

    const movementEntry: SEMovementHistory = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'Transfer',
      date: transferFormData.date,
      from_employee: transferFormData.from_employee,
      to_employee: transferFormData.to_employee,
      condition: 'Working',
      remarks: transferFormData.remarks,
      documentNumber: `ITR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`
    };

    setSEAssets(prev => prev.map(s => 
      s.id === selectedSE.id 
        ? { ...s, movementHistory: [...s.movementHistory, movementEntry] }
        : s
    ));

    toast.success('Transfer recorded successfully');
    setShowTransferDialog(false);
    setTransferFormData({
      from_employee: '',
      to_employee: '',
      division_section: '',
      date: new Date().toISOString().split('T')[0],
      remarks: ''
    });
  };

  const handleRRSP = () => {
    if (!selectedSE) return;

    if (!rrspFormData.rrsp_number || !rrspFormData.employee_returning || !rrspFormData.findings) {
      toast.error('Please fill in all required RRSP fields');
      return;
    }

    if (['Not Working', 'Unserviceable'].includes(rrspFormData.condition_on_return) && !rrspFormData.findings) {
      toast.error('Findings are required when condition is "Not Working" or "Unserviceable"');
      return;
    }

    const rrspEntry: RRSPEntry = {
      id: Math.random().toString(36).substr(2, 9),
      rrsp_number: rrspFormData.rrsp_number,
      se_property_number: selectedSE.se_property_number,
      employee_returning: rrspFormData.employee_returning,
      condition_on_return: rrspFormData.condition_on_return,
      findings: rrspFormData.findings,
      verified_by: rrspFormData.verified_by,
      date_returned: rrspFormData.date_returned
    };

    setSEAssets(prev => prev.map(s => 
      s.id === selectedSE.id 
        ? { 
            ...s, 
            rrspHistory: [...s.rrspHistory, rrspEntry],
            status: 'Returned'
          }
        : s
    ));

    toast.success('RRSP generated successfully');
    setShowRRSPDialog(false);
    setRRSPFormData({
      rrsp_number: '',
      se_property_number: '',
      employee_returning: '',
      condition_on_return: 'Working',
      findings: '',
      verified_by: '',
      date_returned: new Date().toISOString().split('T')[0]
    });
  };

  const getConditionBadge = (condition: string) => {
    const styles: Record<string, string> = {
      'Working': 'bg-green-100 text-green-800 border-green-200',
      'Not Working': 'bg-red-100 text-red-800 border-red-200',
      'For Repair': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Lost': 'bg-purple-100 text-purple-800 border-purple-200',
      'Unserviceable': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return (
      <Badge variant="outline" className={styles[condition] || 'bg-gray-100 text-gray-800'}>
        {condition}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'Active': 'bg-blue-100 text-blue-800 border-blue-200',
      'Returned': 'bg-green-100 text-green-800 border-green-200',
      'Lost': 'bg-red-100 text-red-800 border-red-200',
      'Unserviceable': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return (
      <Badge variant="outline" className={styles[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  // Filter logic
  const filteredSE = seAssets.filter(se => {
    const matchesSearch = 
      se.se_property_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      se.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      se.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || se.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || se.status === filterStatus;
    
    const currentBlock = se.accountabilityBlocks.find(b => b.label === 'Current Holder');
    const matchesCondition = filterCondition === 'all' || (currentBlock && currentBlock.condition === filterCondition);
    const matchesDivision = filterDivision === 'all' || (currentBlock && currentBlock.division_section === filterDivision);
    
    return matchesSearch && matchesCategory && matchesCondition && matchesDivision && matchesStatus;
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                <Plus className="size-4" />
                Add SE Item
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowBulkUploadDialog(true)}
                className="gap-2"
              >
                <Upload className="size-4" />
                Upload Bulk (Excel)
              </Button>
            </div>
            <Button variant="outline" className="gap-2" onClick={downloadSETemplate}>
              <Download className="size-4" />
              Download SE Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder="Search SE Property #, Serial #, Description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="ICT Equipment">ICT Equipment</SelectItem>
                <SelectItem value="Furniture">Furniture</SelectItem>
                <SelectItem value="Tools">Tools</SelectItem>
                <SelectItem value="Sports Equipment">Sports Equipment</SelectItem>
                <SelectItem value="Linen">Linen</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCondition} onValueChange={setFilterCondition}>
              <SelectTrigger>
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                <SelectItem value="Working">Working</SelectItem>
                <SelectItem value="Not Working">Not Working</SelectItem>
                <SelectItem value="For Repair">For Repair</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
                <SelectItem value="Unserviceable">Unserviceable</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Returned">Returned (RRSP)</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
                <SelectItem value="Unserviceable">Unserviceable</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterDivision} onValueChange={setFilterDivision}>
              <SelectTrigger>
                <SelectValue placeholder="Division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                <SelectItem value="Office of the Chairman and CEO">Office of the Chairman</SelectItem>
                <SelectItem value="Legal Service">Legal Service</SelectItem>
                <SelectItem value="Administrative Service">Administrative Service</SelectItem>
                <SelectItem value="Finance Service">Finance Service</SelectItem>
                <SelectItem value="Technical Service">Technical Service</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center text-sm text-slate-600">
              <span className="font-medium">{filteredSE.length}</span>
              <span className="ml-1">items</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SE Table */}
      <Card>
        <CardHeader>
          <CardTitle>Semi-Expendable Asset List</CardTitle>
          <CardDescription>Items below ₱50,000 with accountability tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">SE Property #</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Brand</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Model</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Serial #</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Unit Value</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Current Holder</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Division</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Condition</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Date Issued</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredSE.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-12 text-center">
                      <Settings className="size-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-600 mb-2">No SE assets found</p>
                      <Button 
                        onClick={() => setShowAddDialog(true)}
                        variant="link"
                        className="text-blue-600"
                      >
                        Add your first SE asset
                      </Button>
                    </td>
                  </tr>
                ) : (
                  filteredSE.map(se => {
                    const currentBlock = se.accountabilityBlocks.find(b => b.label === 'Current Holder');
                    return (
                      <tr key={se.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {se.se_property_number}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{se.category}</td>
                        <td className="px-4 py-3 text-sm text-slate-900 max-w-xs truncate" title={se.description}>
                          {se.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{se.brand || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{se.model || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{se.serial_number || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-900">{formatCurrency(se.unit_value)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {currentBlock?.plantilla_employee_id || currentBlock?.non_plantilla_employee_id || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {currentBlock?.division_section || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {currentBlock ? getConditionBadge(currentBlock.condition) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(se.status)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {currentBlock?.date_issued_returned ? new Date(currentBlock.date_issued_returned).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSE(se);
                                setShowHistoryDialog(true);
                              }}
                              className="size-8 p-0"
                              title="View History"
                            >
                              <History className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(se)}
                              className="size-8 p-0"
                              title="Edit"
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSE(se);
                                const currentBlock = se.accountabilityBlocks.find(b => b.label === 'Current Holder');
                                setTransferFormData({
                                  from_employee: currentBlock?.plantilla_employee_id || currentBlock?.non_plantilla_employee_id || '',
                                  to_employee: '',
                                  division_section: '',
                                  date: new Date().toISOString().split('T')[0],
                                  remarks: ''
                                });
                                setShowTransferDialog(true);
                              }}
                              className="size-8 p-0"
                              title="Transfer"
                            >
                              <ArrowRightLeft className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSE(se);
                                setRRSPFormData({
                                  rrsp_number: `RRSP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
                                  se_property_number: se.se_property_number,
                                  employee_returning: '',
                                  condition_on_return: 'Working',
                                  findings: '',
                                  verified_by: '',
                                  date_returned: new Date().toISOString().split('T')[0]
                                });
                                setShowRRSPDialog(true);
                              }}
                              className="size-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Return (RRSP)"
                            >
                              <RotateCcw className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSE(se);
                                setShowDeleteDialog(true);
                              }}
                              className="size-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ADD SE DIALOG */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="size-5 text-blue-600" />
              SE Encoding – Semi-Expendable Property
            </DialogTitle>
            <DialogDescription>
              Fill in all required fields. Items below ₱50,000 threshold. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            {/* SECTION 1: PROPERTY IDENTIFICATION */}
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleSection('identification')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="size-4 text-blue-600" />
                    Section 1: Property Identification
                  </CardTitle>
                  {expandedSections.identification ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </div>
              </CardHeader>
              {expandedSections.identification && (
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="se_property_number">
                        SE Property Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="se_property_number"
                        value={formData.se_property_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, se_property_number: e.target.value }))}
                        placeholder="e.g., 10605030-02-MOUSE"
                        required
                      />
                      <p className="text-xs text-slate-500">Auto-generated or manually assigned following COA format</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ICT Equipment">ICT Equipment</SelectItem>
                          <SelectItem value="Furniture">Furniture</SelectItem>
                          <SelectItem value="Tools">Tools</SelectItem>
                          <SelectItem value="Sports Equipment">Sports Equipment</SelectItem>
                          <SelectItem value="Linen">Linen</SelectItem>
                          <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="legend">Legend / Sub-Category</Label>
                      <Input
                        id="legend"
                        value={formData.legend}
                        onChange={(e) => setFormData(prev => ({ ...prev, legend: e.target.value }))}
                        placeholder="Sub-category code"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed description of the SE item"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                        placeholder="Manufacturer/brand"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        value={formData.model}
                        onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                        placeholder="Model number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serial_number">Serial Number</Label>
                      <Input
                        id="serial_number"
                        value={formData.serial_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                        placeholder="Serial/ID number (recommended)"
                      />
                      <p className="text-xs text-slate-500">Recommended but not required</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parts_accessories">Parts / Accessories (if any)</Label>
                    <Textarea
                      id="parts_accessories"
                      value={formData.parts_accessories}
                      onChange={(e) => setFormData(prev => ({ ...prev, parts_accessories: e.target.value }))}
                      placeholder="Battery pack / cable / charger / etc."
                      rows={2}
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* SECTION 2: ACQUISITION DETAILS */}
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleSection('acquisition')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="size-4 text-blue-600" />
                    Section 2: Acquisition Details
                  </CardTitle>
                  {expandedSections.acquisition ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </div>
              </CardHeader>
              {expandedSections.acquisition && (
                <CardContent className="space-y-4 pt-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="size-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium">SE Threshold: Unit value must be below ₱50,000</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="unit_of_measurement">Unit of Measurement</Label>
                      <Select 
                        value={formData.unit_of_measurement} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, unit_of_measurement: value }))}
                      >
                        <SelectTrigger id="unit_of_measurement">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unit">Unit</SelectItem>
                          <SelectItem value="set">Set</SelectItem>
                          <SelectItem value="piece">Piece</SelectItem>
                          <SelectItem value="lot">Lot</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unit_value">Unit Value (₱)</Label>
                      <Input
                        id="unit_value"
                        type="number"
                        step="0.01"
                        max="49999.99"
                        value={formData.unit_value}
                        onChange={(e) => setFormData(prev => ({ ...prev, unit_value: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                      />
                      <p className="text-xs text-slate-500">For SE → below ₱50,000</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date_acquired">
                        Date Acquired <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="date_acquired"
                        type="date"
                        value={formData.date_acquired}
                        onChange={(e) => setFormData(prev => ({ ...prev, date_acquired: e.target.value }))}
                        max={new Date().toISOString().split('T')[0]}
                        required
                      />
                      <p className="text-xs text-slate-500">Cannot exceed current date</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="warranty_status">Warranty Status</Label>
                      <Select 
                        value={formData.warranty_status} 
                        onValueChange={(value: any) => setFormData(prev => ({ ...prev, warranty_status: value }))}
                      >
                        <SelectTrigger id="warranty_status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="In Warranty">In Warranty</SelectItem>
                          <SelectItem value="Expired">Expired</SelectItem>
                          <SelectItem value="Unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* SECTION 3: ACCOUNTABILITY PANEL */}
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleSection('accountability')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="size-4 text-blue-600" />
                    Section 3: Accountability Panel (SE Version)
                  </CardTitle>
                  {expandedSections.accountability ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </div>
                <CardDescription>Track issuance history (ITR) and returns (RRSP)</CardDescription>
              </CardHeader>
              {expandedSections.accountability && (
                <CardContent className="space-y-6 pt-4">
                  {formData.accountabilityBlocks.map((block, index) => (
                    <div key={block.id} className="border rounded-lg p-4 bg-slate-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-slate-900">{block.label}</h4>
                        {index === 0 && (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">Required</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`itr_rrsp_${index}`}>ITR / RRSP Number</Label>
                          <Input
                            id={`itr_rrsp_${index}`}
                            value={block.itr_rrsp_number}
                            onChange={(e) => {
                              const newBlocks = [...formData.accountabilityBlocks];
                              newBlocks[index].itr_rrsp_number = e.target.value;
                              setFormData(prev => ({ ...prev, accountabilityBlocks: newBlocks }));
                            }}
                            placeholder="ITR-2024-0001 or RRSP-2024-0001"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`division_section_${index}`}>Division / Section</Label>
                          <Select 
                            value={block.division_section}
                            onValueChange={(value) => {
                              const newBlocks = [...formData.accountabilityBlocks];
                              newBlocks[index].division_section = value;
                              setFormData(prev => ({ ...prev, accountabilityBlocks: newBlocks }));
                            }}
                          >
                            <SelectTrigger id={`division_section_${index}`}>
                              <SelectValue placeholder="Select division" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Office of the Chairman and CEO">Office of the Chairman and CEO</SelectItem>
                              <SelectItem value="Legal Service">Legal Service</SelectItem>
                              <SelectItem value="Administrative Service">Administrative Service</SelectItem>
                              <SelectItem value="Finance Service">Finance Service</SelectItem>
                              <SelectItem value="Technical Service">Technical Service</SelectItem>
                              <SelectItem value="Planning and Policy Service">Planning and Policy Service</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`plantilla_${index}`}>Plantilla Employee ID</Label>
                          <Input
                            id={`plantilla_${index}`}
                            value={block.plantilla_employee_id}
                            onChange={(e) => {
                              const newBlocks = [...formData.accountabilityBlocks];
                              newBlocks[index].plantilla_employee_id = e.target.value;
                              setFormData(prev => ({ ...prev, accountabilityBlocks: newBlocks }));
                            }}
                            placeholder="Employee ID"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`non_plantilla_${index}`}>Non-Plantilla Employee ID</Label>
                          <Input
                            id={`non_plantilla_${index}`}
                            value={block.non_plantilla_employee_id}
                            onChange={(e) => {
                              const newBlocks = [...formData.accountabilityBlocks];
                              newBlocks[index].non_plantilla_employee_id = e.target.value;
                              setFormData(prev => ({ ...prev, accountabilityBlocks: newBlocks }));
                            }}
                            placeholder="Employee ID"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`condition_${index}`}>Condition</Label>
                          <Select 
                            value={block.condition}
                            onValueChange={(value) => {
                              const newBlocks = [...formData.accountabilityBlocks];
                              newBlocks[index].condition = value;
                              setFormData(prev => ({ ...prev, accountabilityBlocks: newBlocks }));
                            }}
                          >
                            <SelectTrigger id={`condition_${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Working">Working</SelectItem>
                              <SelectItem value="Not Working">Not Working</SelectItem>
                              <SelectItem value="For Repair">For Repair</SelectItem>
                              <SelectItem value="Lost">Lost</SelectItem>
                              <SelectItem value="Unserviceable">Unserviceable</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`date_issued_${index}`}>Date Issued / Returned</Label>
                          <Input
                            id={`date_issued_${index}`}
                            type="date"
                            value={block.date_issued_returned}
                            onChange={(e) => {
                              const newBlocks = [...formData.accountabilityBlocks];
                              newBlocks[index].date_issued_returned = e.target.value;
                              setFormData(prev => ({ ...prev, accountabilityBlocks: newBlocks }));
                            }}
                            max={new Date().toISOString().split('T')[0]}
                          />
                        </div>

                        <div className="col-span-2 space-y-2">
                          <Label htmlFor={`remarks_${index}`}>
                            Remarks {['Not Working', 'Unserviceable'].includes(block.condition) && <span className="text-red-500">*</span>}
                          </Label>
                          <Textarea
                            id={`remarks_${index}`}
                            value={block.remarks}
                            onChange={(e) => {
                              const newBlocks = [...formData.accountabilityBlocks];
                              newBlocks[index].remarks = e.target.value;
                              setFormData(prev => ({ ...prev, accountabilityBlocks: newBlocks }));
                            }}
                            placeholder="Additional notes or remarks"
                            rows={2}
                            required={['Not Working', 'Unserviceable'].includes(block.condition)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={(e) => handleSubmit(e, true)}
                className="gap-2"
              >
                <Plus className="size-4" />
                Save & Add Another
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Save SE Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT SE DIALOG - Similar structure */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="size-5 text-blue-600" />
              Edit SE Asset
            </DialogTitle>
            <DialogDescription>
              Update SE asset information. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            {/* Same form structure as Add Dialog - abbreviated for token efficiency */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Property Identification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* Reuse same fields from Add dialog */}
                <div className="space-y-2">
                  <Label>SE Property Number *</Label>
                  <Input
                    value={formData.se_property_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, se_property_number: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  resetForm();
                  setSelectedSE(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Update SE Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* TRANSFER MODAL */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="size-5 text-blue-600" />
              Transfer SE Asset
            </DialogTitle>
            <DialogDescription>
              {selectedSE ? `SE Property #: ${selectedSE.se_property_number}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>From Employee</Label>
              <Input
                value={transferFormData.from_employee}
                onChange={(e) => setTransferFormData(prev => ({ ...prev, from_employee: e.target.value }))}
                placeholder="Current holder"
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label>To Employee *</Label>
              <Input
                value={transferFormData.to_employee}
                onChange={(e) => setTransferFormData(prev => ({ ...prev, to_employee: e.target.value }))}
                placeholder="New holder ID"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Division / Section *</Label>
              <Select 
                value={transferFormData.division_section} 
                onValueChange={(value) => setTransferFormData(prev => ({ ...prev, division_section: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Office of the Chairman and CEO">Office of the Chairman and CEO</SelectItem>
                  <SelectItem value="Legal Service">Legal Service</SelectItem>
                  <SelectItem value="Administrative Service">Administrative Service</SelectItem>
                  <SelectItem value="Finance Service">Finance Service</SelectItem>
                  <SelectItem value="Technical Service">Technical Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Transfer Date</Label>
              <Input
                type="date"
                value={transferFormData.date}
                onChange={(e) => setTransferFormData(prev => ({ ...prev, date: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                value={transferFormData.remarks}
                onChange={(e) => setTransferFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Reason for transfer"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleTransfer} className="bg-blue-600 hover:bg-blue-700 gap-2">
              <CheckCircle className="size-4" />
              Generate ITR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RRSP MODAL */}
      <Dialog open={showRRSPDialog} onOpenChange={setShowRRSPDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="size-5 text-blue-600" />
              Return of Semi-Expendable Property (RRSP)
            </DialogTitle>
            <DialogDescription>
              Document the return of SE asset
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>RRSP Number *</Label>
                <Input
                  value={rrspFormData.rrsp_number}
                  onChange={(e) => setRRSPFormData(prev => ({ ...prev, rrsp_number: e.target.value }))}
                  placeholder="RRSP-2024-0001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>SE Property Number</Label>
                <Input
                  value={rrspFormData.se_property_number}
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Employee Returning *</Label>
              <Input
                value={rrspFormData.employee_returning}
                onChange={(e) => setRRSPFormData(prev => ({ ...prev, employee_returning: e.target.value }))}
                placeholder="Employee ID"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Condition Upon Return</Label>
              <Select 
                value={rrspFormData.condition_on_return} 
                onValueChange={(value) => setRRSPFormData(prev => ({ ...prev, condition_on_return: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Working">Working</SelectItem>
                  <SelectItem value="Not Working">Not Working</SelectItem>
                  <SelectItem value="For Repair">For Repair</SelectItem>
                  <SelectItem value="Unserviceable">Unserviceable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Findings *
                {['Not Working', 'Unserviceable'].includes(rrspFormData.condition_on_return) && 
                  <span className="text-red-500"> (Required for damaged items)</span>
                }
              </Label>
              <Textarea
                value={rrspFormData.findings}
                onChange={(e) => setRRSPFormData(prev => ({ ...prev, findings: e.target.value }))}
                placeholder="Describe the condition, damages, or issues found..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Verified By</Label>
                <Select 
                  value={rrspFormData.verified_by} 
                  onValueChange={(value) => setRRSPFormData(prev => ({ ...prev, verified_by: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select verifier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Property Officer">Property Officer</SelectItem>
                    <SelectItem value="Inventory Custodian">Inventory Custodian</SelectItem>
                    <SelectItem value="Supply Officer">Supply Officer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Returned</Label>
                <Input
                  type="date"
                  value={rrspFormData.date_returned}
                  onChange={(e) => setRRSPFormData(prev => ({ ...prev, date_returned: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Upload Photos (optional)</p>
                  <p>Document the condition with photos if available</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Upload className="size-4 mr-2" />
                    Upload Images
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRRSPDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRRSP} className="bg-green-600 hover:bg-green-700 gap-2">
              <FileText className="size-4" />
              Generate RRSP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HISTORY MODAL */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="size-5 text-blue-600" />
              SE Asset Movement History
            </DialogTitle>
            <DialogDescription>
              {selectedSE ? `SE Property #: ${selectedSE.se_property_number}` : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedSE && (
            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Asset Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">Description:</span>
                      <p className="font-medium text-slate-900">{selectedSE.description}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Current Status:</span>
                      <div className="mt-1">{getStatusBadge(selectedSE.status)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ITR Issuance History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">ITR Issuance History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedSE.accountabilityBlocks.filter(b => b.type === 'ITR').length > 0 ? (
                      selectedSE.accountabilityBlocks
                        .filter(b => b.type === 'ITR')
                        .map((block) => (
                          <div key={block.id} className="border-l-2 border-blue-200 pl-4 pb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="size-4 text-slate-400" />
                              <span className="text-sm text-slate-600">
                                {block.date_issued_returned ? new Date(block.date_issued_returned).toLocaleDateString() : 'No date'}
                              </span>
                              <Badge variant="outline" className="ml-auto text-xs">
                                {block.label}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                              <p className="text-slate-900">
                                <span className="font-medium">ITR:</span> {block.itr_rrsp_number || '-'}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-medium">Employee:</span> {block.plantilla_employee_id || block.non_plantilla_employee_id || '-'}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-medium">Division:</span> {block.division_section || '-'}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-slate-600 font-medium">Condition:</span>
                                {getConditionBadge(block.condition)}
                              </div>
                              {block.remarks && (
                                <p className="text-slate-500 italic mt-2">{block.remarks}</p>
                              )}
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-slate-500">No issuance history</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* RRSP Return History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">RRSP Return History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedSE.rrspHistory && selectedSE.rrspHistory.length > 0 ? (
                      selectedSE.rrspHistory.map((entry) => (
                        <div key={entry.id} className="border-l-2 border-green-200 pl-4 pb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="size-4 text-slate-400" />
                            <span className="text-sm text-slate-600">
                              {new Date(entry.date_returned).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p className="text-slate-900">
                              <span className="font-medium">RRSP #:</span> {entry.rrsp_number}
                            </p>
                            <p className="text-slate-600">
                              <span className="font-medium">Returned by:</span> {entry.employee_returning}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-slate-600 font-medium">Condition:</span>
                              {getConditionBadge(entry.condition_on_return)}
                            </div>
                            <p className="text-slate-900 mt-2">
                              <span className="font-medium">Findings:</span>
                            </p>
                            <p className="text-slate-600">{entry.findings}</p>
                            <p className="text-xs text-slate-400 mt-2">
                              Verified by: {entry.verified_by}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No return history</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Movement Trail */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Movement Trail</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedSE.movementHistory && selectedSE.movementHistory.length > 0 ? (
                      selectedSE.movementHistory.map((entry) => (
                        <div key={entry.id} className="border-l-2 border-purple-200 pl-4 pb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="size-4 text-slate-400" />
                            <span className="text-sm text-slate-600">
                              {new Date(entry.date).toLocaleDateString()}
                            </span>
                            <Badge variant="outline" className="ml-auto text-xs">
                              {entry.type}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p className="text-slate-900">
                              <span className="font-medium">Doc #:</span> {entry.documentNumber}
                            </p>
                            {entry.from_employee && (
                              <p className="text-slate-600">
                                <span className="font-medium">From:</span> {entry.from_employee}
                              </p>
                            )}
                            <p className="text-slate-600">
                              <span className="font-medium">To:</span> {entry.to_employee}
                            </p>
                            {entry.remarks && (
                              <p className="text-slate-500 italic mt-2">{entry.remarks}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No movement history</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SE Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this SE asset? This action cannot be undone.
              {selectedSE && (
                <div className="mt-3 p-3 bg-slate-50 rounded text-sm">
                  <p className="font-medium text-slate-900">SE Property #: {selectedSE.se_property_number}</p>
                  <p className="text-slate-600">{selectedSE.description}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* BULK UPLOAD DIALOG */}
      <Dialog open={showBulkUploadDialog} onOpenChange={setShowBulkUploadDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="size-5 text-blue-600" />
              Upload Bulk SE Data (Excel)
            </DialogTitle>
            <DialogDescription>
              Upload an Excel file following the SE template format
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <Upload className="size-12 mx-auto mb-3 text-slate-400" />
              <p className="text-sm text-slate-600 mb-2">
                Drag and drop your Excel file here, or click to browse
              </p>
              <p className="text-xs text-slate-500">
                Supported format: .xlsx (Excel 2007 or later)
              </p>
              <Input type="file" accept=".xlsx" className="hidden" id="se-bulk-upload" />
              <Button variant="outline" className="mt-4" onClick={() => document.getElementById('se-bulk-upload')?.click()}>
                Select File
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Important Notes:</p>
                  <ul className="text-blue-800 space-y-1 list-disc list-inside">
                    <li>Use the official SE template format</li>
                    <li>SE Property Number is required</li>
                    <li>Unit value must be below ₱50,000</li>
                    <li>Dates must not be in the future</li>
                    <li>Current holder block is required</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowBulkUploadDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Upload className="size-4 mr-2" />
              Upload & Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
