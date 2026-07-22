// src/components/office-management/employee/EmployeeBatchUploadModal.tsx
import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Download, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  batchEditEmployeesRecord,
  EditEmployeeBatchItem,
  EditEmployeeBatchResultRow,
} from '@/api/office-management/employeeApi';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EXPECTED_HEADERS = [
  'Employee ID',
  'First Name',
  'Middle Name',
  'Last Name',
  'Suffix Name',
  'Office Name',
  'Division Name',
  'Employment Type Name',
  'Position Name',
  'Status',
];

const TEMPLATE_URL = '/templates/EMPLOYEE_BATCH_UPLOAD_TEMPLATE.xlsx';

interface ParsedResult {
  items: EditEmployeeBatchItem[];
  errors: string[];
}

function parseWorkbook(file: File): Promise<ParsedResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames.includes('Employees') ? 'Employees' : workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });

        if (!rows.length) {
          resolve({ items: [], errors: ['The uploaded file is empty.'] });
          return;
        }

        const header = (rows[0] || []).map((h) => String(h ?? '').trim());
        const headerErrors: string[] = [];
        EXPECTED_HEADERS.forEach((expected, i) => {
          if ((header[i] || '').toLowerCase() !== expected.toLowerCase()) {
            headerErrors.push(`Column ${i + 1}: expected "${expected}", found "${header[i] || '(blank)'}"`);
          }
        });
        if (headerErrors.length) {
          resolve({ items: [], errors: ['Template headers do not match the expected format:', ...headerErrors] });
          return;
        }

        const items: EditEmployeeBatchItem[] = [];
        const rowErrors: string[] = [];

        for (let r = 1; r < rows.length; r++) {
          const row = rows[r] || [];
          const isBlank = row.every((cell) => String(cell ?? '').trim() === '');
          if (isBlank) continue;

          const employeeIdOriginal = String(row[0] ?? '').trim();
          const firstName = String(row[1] ?? '').trim();
          const middleName = String(row[2] ?? '').trim();
          const lastName = String(row[3] ?? '').trim();

          // Employee ID, First Name, Middle Name, and Last Name are required for every row.
          // Office/Division/Employment Type/Position/Status are optional.
          const missing: string[] = [];
          if (!employeeIdOriginal) missing.push('Employee ID');
          if (!firstName) missing.push('First Name');
          if (!middleName) missing.push('Middle Name');
          if (!lastName) missing.push('Last Name');

          if (missing.length) {
            rowErrors.push(`Row ${r + 1}: missing ${missing.join(', ')}`);
            continue;
          }

          const status = String(row[9] ?? '').trim().toLowerCase();

          items.push({
            employeeIdOriginal,
            firstName,
            middleName,
            lastName,
            suffixName: String(row[4] ?? '').trim() || undefined,
            officeName: String(row[5] ?? '').trim() || undefined,
            divisionName: String(row[6] ?? '').trim() || undefined,
            employmentTypeName: String(row[7] ?? '').trim() || undefined,
            positionName: String(row[8] ?? '').trim() || undefined,
            isActive: status !== 'inactive',
          });
        }

        if (rowErrors.length) {
          resolve({ items: [], errors: ['The file is missing required information and was not uploaded:', ...rowErrors] });
          return;
        }

        resolve({ items, errors: [] });
      } catch {
        reject(new Error('Could not parse the file. Make sure it is a valid .xlsx file.'));
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export function EmployeeBatchUploadModal({ open, onOpenChange, onSuccess }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resultRows, setResultRows] = useState<EditEmployeeBatchResultRow[] | null>(null);

  const reset = () => {
    setFile(null);
    setResultRows(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleDownloadTemplate = () => {
    const a = document.createElement('a');
    a.href = TEMPLATE_URL;
    a.download = 'EMPLOYEE_BATCH_UPLOAD_TEMPLATE.xlsx';
    a.click();
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    setResultRows(null);
    try {
      const { items, errors } = await parseWorkbook(file);

      if (errors.length) {
        toast.error(errors[0]);
        setResultRows(errors.slice(1).map((message) => ({ error: true, message })));
        return;
      }

      if (!items.length) {
        toast.error('No employee rows found in the file');
        return;
      }

      const results = await batchEditEmployeesRecord(items);
      setResultRows(results);

      const successCount = results.filter((r) => !r.error).length;
      const failedCount = results.length - successCount;

      if (failedCount === 0) {
        toast.success(`Batch upload completed: ${successCount} employee(s) processed successfully`);
        reset();
        onSuccess();
      } else if (successCount === 0) {
        toast.error(`Batch upload failed for all ${failedCount} row(s)`);
      } else {
        toast.warning(`${successCount} succeeded, ${failedCount} failed — see details below`);
        onSuccess();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Batch upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Batch Upload Employees</DialogTitle>
          <DialogDescription>
            Upload an Excel file to create or update multiple employee records at once.
            Employee ID, First Name, Middle Name, and Last Name are required for every row —
            Office, Division, Employment Type, Position, and Status are optional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button variant="outline" onClick={handleDownloadTemplate} className="w-full gap-2">
            <Download className="w-4 h-4" />
            Download Sample Template
          </Button>

          <div className="space-y-1">
            <label className="text-sm font-medium">Select File (.xlsx)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setResultRows(null);
              }}
              className="block w-full text-sm border rounded-md file:mr-3 file:py-2 file:px-3 file:border-0 file:bg-muted file:text-sm file:font-medium"
            />
          </div>

          {resultRows && (
            <div className="max-h-56 overflow-y-auto border rounded-md divide-y">
              {resultRows.map((row, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-2 text-xs flex items-start gap-2 ${row.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
                >
                  {row.error && <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
                  <span>
                    {row.employeeIdOriginal && <span className="font-semibold">{row.employeeIdOriginal}: </span>}
                    {row.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading || !file} className="gap-2">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
