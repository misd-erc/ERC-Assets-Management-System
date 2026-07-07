import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Plus, FileText, Printer, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { AssetsTable } from '@/components/assets/AssetsTable';
import { AssetsFilters } from '@/components/assets/AssetsFilters';
import { AssetCreateForm } from '@/components/assets/forms/AssetCreateForm';
import { AssetEditForm } from '@/components/assets/forms/AssetEditForm';
import { AssetsViewCard } from '@/components/assets/AssetsViewCard';
import { AssetsPrintTemplate } from '@/components/assets/AssetsPrintTemplate';
import { UnifiedAssetService } from '@/services/UnifiedAssetService';
import { Asset } from '@/types/asset/UnifiedAsset';
import { ExcelExportService } from '@/utils/excelExport';
import { ReportTab } from '@/components/assets/reports/ReportTab';
import * as XLSX from 'xlsx';
import { secureStorage } from '@/utils/secureStorage';

export function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [ppeTotalCount, setPpeTotalCount] = useState(0);
  const [seTotalCount, setSeTotalCount] = useState(0);
  const [onStockPPECount, setOnStockPPECount] = useState(0);
  const [onStockSECount, setOnStockSECount] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  // Active tab
  const [activeTab, setActiveTab] = useState('PPE');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [officeFilter, setOfficeFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    searchTerm: '',
    categoryFilter: 'all',
    conditionFilter: 'all',
    officeFilter: 'all',
    divisionFilter: 'all',
    employeeFilter: 'all',
    startDate: '',
    endDate: '',
  });

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  // Selected asset
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Batch upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadConfirmDialogOpen, setUploadConfirmDialogOpen] = useState(false);

  // Batch upload row-level issues (rejected file or partially-failed rows)
  const [uploadIssuesOpen, setUploadIssuesOpen] = useState(false);
  const [uploadIssuesTitle, setUploadIssuesTitle] = useState('');
  const [uploadIssuesMessage, setUploadIssuesMessage] = useState('');
  const [uploadIssueRows, setUploadIssueRows] = useState<BatchUploadIssueRow[]>([]);

  // Excel export
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  // Batch upload progress
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadProcessingIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // On mount: apply any pending search from GlobalSearch navigation
  useEffect(() => {
    const raw = sessionStorage.getItem('_gsq');
    if (!raw) return;
    try {
      const { query, tab } = JSON.parse(raw);
      sessionStorage.removeItem('_gsq');
      if (query) {
        setSearchTerm(query);
        setAppliedFilters(f => ({ ...f, searchTerm: query }));
      }
      if (tab) setActiveTab(tab);
    } catch {
      sessionStorage.removeItem('_gsq');
    }
  }, []);

  // On mount, fetch total counts for all tabs
  useEffect(() => {
    const fetchTabCounts = async () => {
      try {
        const [ppeRes, seRes, onStockPpeRes, onStockSeRes] = await Promise.all([
          UnifiedAssetService.getAll({ group: 'PPE', PageNumber: 1, PageSize: 1 }),
          UnifiedAssetService.getAll({ group: 'SE', PageNumber: 1, PageSize: 1 }),
          UnifiedAssetService.getAllNoMovement({ group: 'PPE', PageNumber: 1, PageSize: 1 }),
          UnifiedAssetService.getAllNoMovement({ group: 'SE', PageNumber: 1, PageSize: 1 }),
        ]);
        setPpeTotalCount(ppeRes.totalCount);
        setSeTotalCount(seRes.totalCount);
        setOnStockPPECount(onStockPpeRes.totalCount);
        setOnStockSECount(onStockSeRes.totalCount);
      } catch {}
    };
    fetchTabCounts();
  }, []);

  useEffect(() => {
    loadAssets();
  }, [currentPage, pageSize, appliedFilters, activeTab]);

  const loadAssets = async () => {
    try {
      setLoading(true);

      const isOnStockTab = activeTab === 'onstock-ppe' || activeTab === 'onstock-se';
      const response = isOnStockTab
        ? await UnifiedAssetService.getAllNoMovement({
            search: appliedFilters.searchTerm || undefined,
            category: appliedFilters.categoryFilter !== 'all' ? appliedFilters.categoryFilter : undefined,
            condition: appliedFilters.conditionFilter !== 'all' ? appliedFilters.conditionFilter : undefined,
            group: activeTab === 'onstock-ppe' ? 'PPE' : 'SE',
            PageNumber: currentPage,
            PageSize: pageSize,
          })
        : await UnifiedAssetService.getAll({
            search: appliedFilters.searchTerm || undefined,
            category: appliedFilters.categoryFilter !== 'all' ? appliedFilters.categoryFilter : undefined,
            condition: appliedFilters.conditionFilter !== 'all' ? appliedFilters.conditionFilter : undefined,
            office: appliedFilters.officeFilter !== 'all' ? appliedFilters.officeFilter : undefined,
            division: appliedFilters.divisionFilter !== 'all' ? appliedFilters.divisionFilter : undefined,
            EmployeeId: appliedFilters.employeeFilter !== 'all' ? parseInt(appliedFilters.employeeFilter) : undefined,
            startDate: appliedFilters.startDate || undefined,
            endDate: appliedFilters.endDate || undefined,
            group: activeTab !== 'all' ? activeTab : undefined,
            PageNumber: currentPage,
            PageSize: pageSize,
          });

      setAssets(response.items);
      setTotalCount(response.totalCount);
      setTotalPages(Math.ceil(response.totalCount / pageSize));
      if (activeTab === 'PPE') setPpeTotalCount(response.totalCount);
      else if (activeTab === 'SE') setSeTotalCount(response.totalCount);
      else if (activeTab === 'onstock-ppe') setOnStockPPECount(response.totalCount);
      else if (activeTab === 'onstock-se') setOnStockSECount(response.totalCount);
    } catch (error) {
      console.error('Error loading assets:', error);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = async (data: Omit<Asset, 'id'>) => {
    try {
      await UnifiedAssetService.create(data);
      toast.success('Asset added successfully');
      setAddDialogOpen(false);
      loadAssets();
    } catch (error: any) {
      console.error('Error adding asset:', error);
      toast.error('Failed to add asset: ' + (error?.message || '')); 
    }
  };

  const handleEditAsset = async (data: Asset) => {
    // This function is now only used for closing the dialog, actual update is handled in AssetEditForm
    setEditDialogOpen(false);
    setSelectedAsset(null);
  };

  const handleDeleteAsset = async () => {
    if (!selectedAsset) return;
    try {
      await UnifiedAssetService.delete(selectedAsset.id);
      toast.success('Asset deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedAsset(null);
      loadAssets();
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Failed to delete asset');
    }
  };

interface BatchUploadIssueRow {
  propertyNumber?: string;
  field?: string;
  employeeId?: string;
  dateAssigned?: string;
  reason?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  details: string;
}

const validateBatchUploadFile = async (file: File): Promise<ValidationResult> => {
  try {
    //
    // ASSET DETAILS HEADERS (13 COLUMNS)
    //
    const assetHeaders = [
      "Property Number",
      "Category",
      "Legend/Sub-Category",
      "Description",
      "Brand",
      "Model",
      "Serial Number",
      "Parts/Accessories",
      "Unit of Measurement",
      "Unit Value (PHP)",
      "Date Acquired (YYYY-MM-DD)",
      "Estimated Useful Life (Years)",
      "Fiscal Date (YYYY-MM-DD)"
    ];

    //
    // MOVEMENT BLOCK HEADERS — NEW FORMAT (14 COLUMNS)
    // Plantilla Employee ID + Firstname/Lastname/Position, then Non-Plantilla + Firstname/Lastname/Position
    //
    const movementBlock14 = [
      "PTR/ITR Number",
      "PAR/ICS Number",
      "Plantilla Employee ID",
      "Firstname",
      "Lastname",
      "Position",
      "Non-Plantilla Employee ID",
      "Firstname",
      "Lastname",
      "Position",
      "Office/Division",
      "Condition",
      "Date Assigned (YYYY-MM-DD)",
      "Status"
    ];

    //
    // LEGACY MOVEMENT BLOCK HEADERS (8 COLUMNS — kept for backward compat)
    //
    const movementBlock8 = [
      "PTR/ITR Number",
      "PAR/ICS Number",
      "Plantilla Employee ID",
      "Non-Plantilla Employee ID",
      "Office/Division",
      "Condition",
      "Date Assigned (YYYY-MM-DD)",
      "Status"
    ];

    //
    // READ UPLOADED FILE
    //
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    //
    // HEADER ROW IS EXCEL ROW 2 → INDEX 1
    //
    const HEADER_ROW = 1;
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");

    const headers: string[] = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: HEADER_ROW, c: col })];
      const headerText = cell?.v?.toString().trim() || "";
      headers.push(headerText);
    }

    console.log(`Total columns found: ${headers.length}`);
    console.log(`Headers:`, headers);

    const errors: string[] = [];

    //
    // VALIDATE ASSET HEADERS EXACTLY
    //
    for (let i = 0; i < assetHeaders.length; i++) {
      if (headers[i] !== assetHeaders[i]) {
        const columnLetter = String.fromCharCode(65 + i); // A, B, C, etc.
        errors.push(
          `Column ${columnLetter}${2} (Position ${i + 1}): Expected "${assetHeaders[i]}" but found "${headers[i] || '(empty)'}"`
        );
      }
    }

    // If asset headers don't match, return early with errors
    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
        details: `Asset section has ${errors.length} column mismatch(es)`
      };
    }

    //
    // VALIDATE MOVEMENT BLOCKS — strip trailing empty headers first
    //
    const startIndex = assetHeaders.length;
    // Drop trailing empty columns so extra blank cols at the end of the sheet don't fail validation
    let trimmedHeaders = [...headers];
    while (trimmedHeaders.length > 0 && trimmedHeaders[trimmedHeaders.length - 1] === "") {
      trimmedHeaders.pop();
    }
    const remaining = trimmedHeaders.slice(startIndex);

    if (remaining.length === 0) {
      console.log("Valid: Asset-only template (no movement blocks)");
      return {
        isValid: true,
        errors: [],
        details: "Asset-only template (no movement blocks)"
      };
    }

    const toColumnLabel = (colIndex: number) => {
      if (colIndex < 26) return String.fromCharCode(65 + colIndex);
      return String.fromCharCode(65 + Math.floor(colIndex / 26) - 1) + String.fromCharCode(65 + (colIndex % 26));
    };

    const validateBlocks = (blockSize: number, blockDef: string[]) => {
      const blockCount = remaining.length / blockSize;
      const errs: string[] = [];
      for (let block = 0; block < blockCount; block++) {
        const blockStart = block * blockSize;
        for (let i = 0; i < blockSize; i++) {
          if (remaining[blockStart + i] !== blockDef[i]) {
            const colIndex = startIndex + blockStart + i;
            errs.push(
              `Block ${block + 1}, Column ${toColumnLabel(colIndex)}2 (Position ${colIndex + 1}): Expected "${blockDef[i]}" but found "${remaining[blockStart + i] || '(empty)'}"`
            );
          }
        }
      }
      return errs;
    };

    // New format: 14-column blocks
    if (remaining.length % 14 === 0) {
      const blockCount = remaining.length / 14;
      const errs = validateBlocks(14, movementBlock14);
      if (errs.length > 0) {
        return { isValid: false, errors: errs, details: `Movement blocks have ${errs.length} column mismatch(es)` };
      }
      console.log(`Valid: ${blockCount} movement block(s) found (14-column format)`);
      return { isValid: true, errors: [], details: `Valid template with ${blockCount} movement block(s)` };
    }

    // Legacy format: 8-column blocks
    if (remaining.length % 8 === 0) {
      const blockCount = remaining.length / 8;
      const errs = validateBlocks(8, movementBlock8);
      if (errs.length > 0) {
        return { isValid: false, errors: errs, details: `Movement blocks have ${errs.length} column mismatch(es)` };
      }
      console.log(`Valid: ${blockCount} movement block(s) found (8-column legacy format)`);
      return { isValid: true, errors: [], details: `Valid template with ${blockCount} movement block(s)` };
    }

    return {
      isValid: false,
      errors: [
        `Invalid column structure: Got ${remaining.length} columns after asset details. Movement blocks must be 14 columns (new format) or 8 columns (legacy format).`
      ],
      details: `Cannot form complete movement block(s) with ${remaining.length} remaining columns`
    };
  } catch (error) {
    console.error("Error validating file:", error);
    return {
      isValid: false,
      errors: [(error as Error).message || "Error reading file"],
      details: "Failed to read or parse the Excel file"
    };
  }
};

  const handleBatchUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      // Validate the file against the template
      const validation = await validateBatchUploadFile(uploadFile);
      if (!validation.isValid) {
        // Build detailed error message
        let errorMessage = 'Template Mismatch:\n\n';
        errorMessage += validation.details + '\n\n';
        
        if (validation.errors.length > 0) {
          errorMessage += 'Issues found:\n';
          validation.errors.forEach((error, index) => {
            errorMessage += `${index + 1}. ${error}\n`;
          });
        }
        
        errorMessage += '\nPlease download the template and ensure your file matches the exact structure.';
        
        toast.error(errorMessage);
        return;
      }

      const actionBySystemUserId = secureStorage.getItem('systemUserId') || '';
      const sessionKey = secureStorage.getItem('sessionToken') || '';

      if (!actionBySystemUserId || !sessionKey) {
        toast.error('Authentication required for batch upload');
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      // After upload reaches 80%, slowly inch toward 98% while server processes
      const startProcessingAnimation = () => {
        uploadProcessingIntervalRef.current = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 98) {
              clearInterval(uploadProcessingIntervalRef.current!);
              return 98;
            }
            return prev + 1;
          });
        }, 400);
      };

      const result = await UnifiedAssetService.batchUpload(
        uploadFile,
        actionBySystemUserId,
        sessionKey,
        (percent) => {
          setUploadProgress(percent);
          if (percent >= 80) startProcessingAnimation();
        }
      );

      clearInterval(uploadProcessingIntervalRef.current!);
      setUploadProgress(100);
      await new Promise((r) => setTimeout(r, 500));

      if (result.success) {
        // Format the batch upload summary
        const summaryData = result.data as any;
        const summary = typeof summaryData === 'object' ? summaryData : { assets: { inserted: 0, updated: 0 }, movements: { inserted: 0, updated: 0 }, failed: 0, failedDetails: [] };
        const totalProcessed = (summary.assets?.inserted || 0) + (summary.assets?.updated || 0);
        const totalMovements = (summary.movements?.inserted || 0) + (summary.movements?.updated || 0);
        const failed = summary.failed || 0;

        if (failed > 0) {
          toast.error(
            `Upload completed with issues:\n` +
            `✓ ${totalProcessed} assets (${summary.assets?.inserted || 0} new, ${summary.assets?.updated || 0} updated)\n` +
            `✓ ${totalMovements} movements (${summary.movements?.inserted || 0} new, ${summary.movements?.updated || 0} updated)\n` +
            `✗ ${failed} records failed`
          );

          const rows: BatchUploadIssueRow[] = Array.isArray(summary.failedDetails)
            ? summary.failedDetails.map((d: any) => ({ propertyNumber: d.propertyNumber, reason: d.reason }))
            : [];
          setUploadIssuesTitle('Batch Upload Completed with Issues');
          setUploadIssuesMessage(`${failed} row(s) could not be processed. The rest of the file was saved successfully — fix the rows below and re-upload just those if needed.`);
          setUploadIssueRows(rows);
          setUploadIssuesOpen(true);
        } else if (totalProcessed > 0 || totalMovements > 0) {
          toast.success(
            `Upload completed successfully:\n` +
            `✓ ${totalProcessed} assets (${summary.assets?.inserted || 0} new, ${summary.assets?.updated || 0} updated)\n` +
            `✓ ${totalMovements} movements (${summary.movements?.inserted || 0} new, ${summary.movements?.updated || 0} updated)`
          );
        } else {
          toast.warning('No records were processed from the file');
        }
      } else {
        toast.error(result.message || 'Failed to upload file');

        // Validation-pass rejections return the offending rows in `data` so the user
        // can see exactly what to fix (e.g. Employee IDs that don't exist yet).
        const rows: BatchUploadIssueRow[] = Array.isArray(result.data)
          ? (result.data as any[]).map((d) => ({
              propertyNumber: d.propertyNumber,
              field: d.field,
              employeeId: d.employeeId,
              dateAssigned: d.dateAssigned,
              reason: d.reason,
            }))
          : [];

        if (rows.length > 0) {
          setUploadIssuesTitle('Batch Upload Rejected — Nothing Was Saved');
          setUploadIssuesMessage(result.message || 'Fix the rows below in your file, then re-upload.');
          setUploadIssueRows(rows);
          setUploadIssuesOpen(true);
        }
      }

      // Reset the file input element to allow selecting the same file again
      const fileInput = document.getElementById('batch-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      setUploadFile(null);
      setUploadConfirmDialogOpen(false);
      loadAssets();
    } catch (error) {
      console.error('Error during batch upload:', error);
      toast.error('Failed to upload file');
      
      // Reset the file input on error as well
      const fileInput = document.getElementById('batch-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } finally {
      clearInterval(uploadProcessingIntervalRef.current!);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/ppe-templates/NEW_PPE_SE_LATEST_TEMPLATE.xlsx';
    link.download = 'NEW_PPE_SE_LATEST_TEMPLATE.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Template downloaded successfully');
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setConditionFilter('all');
    setOfficeFilter('all');
    setDivisionFilter('all');
    setEmployeeFilter('all');
    setStartDate('');
    setEndDate('');
    setAppliedFilters({
      searchTerm: '',
      categoryFilter: 'all',
      conditionFilter: 'all',
      officeFilter: 'all',
      divisionFilter: 'all',
      employeeFilter: 'all',
      startDate: '',
      endDate: '',
    });
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      searchTerm,
      categoryFilter,
      conditionFilter,
      officeFilter,
      divisionFilter,
      employeeFilter,
      startDate,
      endDate,
    });
    setCurrentPage(1);
    setShowFilters(false);
  };

  const handleViewDetails = async (asset: Asset) => {
    try {
      // Fetch complete asset data using the unified endpoint
      const fullAssetData = await UnifiedAssetService.getById(asset.id);
      setSelectedAsset(fullAssetData);
      setViewDialogOpen(true);
    } catch (error) {
      console.error('Error fetching asset details for viewing:', error);
      toast.error('Failed to load asset details');
    }
  };

  const handleEdit = async (asset: Asset) => {
    try {
      // Fetch complete asset data using the unified endpoint
      const fullAssetData = await UnifiedAssetService.getById(asset.id);
      setSelectedAsset(fullAssetData);
      setEditDialogOpen(true);
    } catch (error) {
      console.error('Error fetching asset details for edit:', error);
      toast.error('Failed to load asset details for editing');
    }
  };

  const handleDelete = (asset: Asset) => {
    setSelectedAsset(asset);
    setDeleteDialogOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const groupName = (activeTab === 'PPE' || activeTab === 'SE') ? activeTab : 'All';
      await ExcelExportService.exportToExcel({
        groupName,
        startDate: exportStartDate || undefined,
        endDate: exportEndDate || undefined,
      });
      toast.success('Excel report downloaded successfully');
      setExportModalOpen(false);
      setExportStartDate('');
      setExportEndDate('');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-2 pt-5 md:pt-20 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
            Assets Management
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Manage and track your PPE and SE assets
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)} 
            className="gap-2 text-xs sm:text-sm"
          >
            {showFilters ? '✕ Hide Filters' : '⊕ Show Filters'}
          </Button>

          <Button variant="outline" onClick={() => setExportModalOpen(true)} className="gap-2 text-xs sm:text-sm">
            <Download className="size-4" />
            <span className="hidden sm:inline">Export To Excel ({(activeTab === 'PPE' || activeTab === 'SE') ? activeTab : 'ALL'})</span>
            <span className="sm:hidden">Export</span>
          </Button>

          <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2 text-xs sm:text-sm">
            <Download className="size-4" />
            <span className="hidden sm:inline">Download Template</span>
            <span className="sm:hidden">Template</span>
          </Button>

          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="hidden"
              id="batch-upload"
            />
            <Label htmlFor="batch-upload" className="cursor-pointer">
              <Button variant="outline" asChild className="gap-2 text-xs sm:text-sm">
                <span>
                  <Upload className="size-4" />
                  <span className="hidden sm:inline">Batch Upload</span>
                  <span className="sm:hidden">Upload</span>
                </span>
              </Button>
            </Label>
            {uploadFile && (
              <Button onClick={() => setUploadConfirmDialogOpen(true)} className="gap-2 text-xs sm:text-sm">
                <FileText className="size-4" />
                <span className="hidden sm:inline">Upload {uploadFile.name}</span>
                <span className="sm:hidden">Upload</span>
              </Button>
            )}
          </div>

          <Button onClick={() => setAddDialogOpen(true)} className="gap-2 text-xs sm:text-sm">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add Asset</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="PPE" className="gap-2">
            PPE Assets
            <Badge variant="secondary" className="ml-1">{ppeTotalCount.toLocaleString()}</Badge>
          </TabsTrigger>
          <TabsTrigger value="SE" className="gap-2">
            SE Assets
            <Badge variant="secondary" className="ml-1">{seTotalCount.toLocaleString()}</Badge>
          </TabsTrigger>
          <TabsTrigger value="onstock-ppe" className="gap-2">
            OnStock PPE
            <Badge variant="secondary" className="ml-1">{onStockPPECount.toLocaleString()}</Badge>
          </TabsTrigger>
          <TabsTrigger value="onstock-se" className="gap-2">
            OnStock SE
            <Badge variant="secondary" className="ml-1">{onStockSECount.toLocaleString()}</Badge>
          </TabsTrigger>
        </TabsList>



        <TabsContent value="PPE" className="space-y-6">
          {/* Filters - Collapsible */}
          {showFilters && (
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <AssetsFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                categoryFilter={categoryFilter}
                onCategoryFilterChange={setCategoryFilter}
                conditionFilter={conditionFilter}
                onConditionFilterChange={setConditionFilter}
                officeFilter={officeFilter}
                onOfficeFilterChange={setOfficeFilter}
                divisionFilter={divisionFilter}
                onDivisionFilterChange={setDivisionFilter}
                employeeFilter={employeeFilter}
                onEmployeeFilterChange={setEmployeeFilter}
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
                onClearFilters={handleClearFilters}
                onApplyFilters={handleApplyFilters}
                totalResults={totalCount}
                moduleFilter="PPE"
              />
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                <Button onClick={handleApplyFilters} className="gap-2">
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear All
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <AssetsTable
            assets={assets}
            loading={loading}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
          />
        </TabsContent>

        <TabsContent value="SE" className="space-y-6">
          {/* Filters - Collapsible */}
          {showFilters && (
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <AssetsFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                categoryFilter={categoryFilter}
                onCategoryFilterChange={setCategoryFilter}
                conditionFilter={conditionFilter}
                onConditionFilterChange={setConditionFilter}
                officeFilter={officeFilter}
                onOfficeFilterChange={setOfficeFilter}
                divisionFilter={divisionFilter}
                onDivisionFilterChange={setDivisionFilter}
                employeeFilter={employeeFilter}
                onEmployeeFilterChange={setEmployeeFilter}
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
                onClearFilters={handleClearFilters}
                onApplyFilters={handleApplyFilters}
                totalResults={totalCount}
                moduleFilter="SE"
              />
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                <Button onClick={handleApplyFilters} className="gap-2">
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear All
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <AssetsTable
            assets={assets}
            loading={loading}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
          />
        </TabsContent>

        <TabsContent value="onstock-ppe" className="space-y-6">
          {/* Filters - Collapsible */}
          {showFilters && (
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <AssetsFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                categoryFilter={categoryFilter}
                onCategoryFilterChange={setCategoryFilter}
                conditionFilter={conditionFilter}
                onConditionFilterChange={setConditionFilter}
                officeFilter={officeFilter}
                onOfficeFilterChange={setOfficeFilter}
                divisionFilter={divisionFilter}
                onDivisionFilterChange={setDivisionFilter}
                employeeFilter={employeeFilter}
                onEmployeeFilterChange={setEmployeeFilter}
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
                onClearFilters={handleClearFilters}
                onApplyFilters={handleApplyFilters}
                totalResults={totalCount}
                moduleFilter="PPE"
              />
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                <Button onClick={handleApplyFilters} className="gap-2">
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear All
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <AssetsTable
            assets={assets}
            loading={loading}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
          />
        </TabsContent>

        <TabsContent value="onstock-se" className="space-y-6">
          {/* Filters - Collapsible */}
          {showFilters && (
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <AssetsFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                categoryFilter={categoryFilter}
                onCategoryFilterChange={setCategoryFilter}
                conditionFilter={conditionFilter}
                onConditionFilterChange={setConditionFilter}
                officeFilter={officeFilter}
                onOfficeFilterChange={setOfficeFilter}
                divisionFilter={divisionFilter}
                onDivisionFilterChange={setDivisionFilter}
                employeeFilter={employeeFilter}
                onEmployeeFilterChange={setEmployeeFilter}
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
                onClearFilters={handleClearFilters}
                onApplyFilters={handleApplyFilters}
                totalResults={totalCount}
                moduleFilter="SE"
              />
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                <Button onClick={handleApplyFilters} className="gap-2">
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear All
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <AssetsTable
            assets={assets}
            loading={loading}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
          />
        </TabsContent>

        <TabsContent value="reports-center" className="space-y-6">
          <ReportTab />
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-[85vw] !max-w-none max-h-[90vh] overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
            <DialogDescription>
              Enter the details for the new asset.
            </DialogDescription>
          </DialogHeader>
          <AssetCreateForm
            onSubmit={handleAddAsset}
            onCancel={() => setAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-[85vw] !max-w-none max-h-[90vh] overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>
              Update the details for this asset.
            </DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <AssetEditForm
              asset={selectedAsset}
              onSubmit={handleEditAsset}
              onCancel={() => {
                setEditDialogOpen(false);
                setSelectedAsset(null);
              }}
              onSuccess={loadAssets}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-[98vw] sm:w-[95vw] !max-w-none max-h-[90vh] overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <>
              <div className="flex justify-end mb-4">
                <Button variant="outline" className="gap-2" onClick={() => setPrintDialogOpen(true)}>
                  <Printer className="size-4" />
                  Print
                </Button>
              </div>
              <AssetsViewCard
                asset={selectedAsset}
                onEdit={() => {
                  setViewDialogOpen(false);
                  handleEdit(selectedAsset);
                }}
                onClose={() => {
                  setViewDialogOpen(false);
                  setSelectedAsset(null);
                }}
              />
            </>
          )}

      {/* Print Dialog */}
      {selectedAsset && (
        <AssetsPrintTemplate
          asset={selectedAsset}
          open={printDialogOpen}
          onOpenChange={setPrintDialogOpen}
        />
      )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this asset? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedAsset(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAsset} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Upload Progress Dialog */}
      <Dialog open={isUploading} onOpenChange={() => {}}>  
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="size-5 animate-spin text-blue-600" />
              {uploadProgress < 80 ? 'Uploading File...' : uploadProgress < 100 ? 'Processing...' : 'Done!'}
            </DialogTitle>
            <DialogDescription>
              {uploadProgress < 80
                ? 'Sending your file to the server. Please wait.'
                : uploadProgress < 100
                ? 'Server is processing your records. This may take a moment.'
                : 'Upload complete!'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Progress value={uploadProgress} className="h-3" />
            <p className="text-center text-sm font-medium text-slate-700">{uploadProgress}%</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Upload Confirmation */}
      <AlertDialog open={uploadConfirmDialogOpen} onOpenChange={setUploadConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Batch Upload</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to upload the file "{uploadFile?.name}"? This will import assets from the selected file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setUploadConfirmDialogOpen(false);
              handleBatchUpload();
            }}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Upload Issues — shows exactly which rows failed and why */}
      <Dialog open={uploadIssuesOpen} onOpenChange={setUploadIssuesOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{uploadIssuesTitle}</DialogTitle>
            <DialogDescription>{uploadIssuesMessage}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto border rounded-md">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-slate-100">
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Property Number</th>
                  <th className="text-left p-2 font-medium">Field</th>
                  <th className="text-left p-2 font-medium">Employee ID</th>
                  <th className="text-left p-2 font-medium">Date Assigned</th>
                  <th className="text-left p-2 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {uploadIssueRows.map((row, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="p-2">{row.propertyNumber || '-'}</td>
                    <td className="p-2">{row.field || '-'}</td>
                    <td className="p-2">{row.employeeId || '-'}</td>
                    <td className="p-2">{row.dateAssigned ? new Date(row.dateAssigned).toLocaleDateString() : '-'}</td>
                    <td className="p-2 text-red-600">{row.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setUploadIssuesOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Excel Export Modal */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Export to  Excel</DialogTitle>
            <DialogDescription>
              Select date range for the assets report. Leave empty to export all records.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start-date" className="text-right">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end-date" className="text-right">
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setExportModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportExcel} disabled={exporting}>
              {exporting ? 'Downloading...' : 'Download'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
