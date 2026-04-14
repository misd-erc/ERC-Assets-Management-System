import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

interface AssetInfo {
  id: number;
  propertyNumber: string;
  description: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  unitValue: number;
  dateAcquired: string;
  group: string;
  category?: { name: string } | null;
  movements?: Array<{
    dateAssigned: string;
    parIcsNumber?: string;
    condition?: string;
    office?: { name: string; acronym: string } | null;
    division?: { name: string; acronym: string } | null;
    employee?: Array<{
      firstName: string;
      middleName: string | null;
      lastName: string;
      suffixName: string | null;
    }>;
  }>;
}

function fmt(date?: string) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function fmtCurrency(val?: number) {
  if (val == null) return '—';
  return '₱' + Number(val).toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

function fmtEmployee(employees?: Array<{ firstName: string; middleName: string | null; lastName: string; suffixName: string | null }>) {
  if (!employees?.length) return 'Unassigned';
  const e = employees[0];
  return [e.firstName, e.middleName, e.lastName, e.suffixName].filter(Boolean).join(' ');
}

function getLatestMovement(movements?: AssetInfo['movements']) {
  if (!movements?.length) return undefined;
  return [...movements].sort(
    (a, b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime()
  )[0];
}

export default function AssetInfoPage() {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = useState<AssetInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('No asset ID provided.');
      setLoading(false);
      return;
    }

    const url = `${API_BASE_URL}/Public/asset/${id}`;

    fetch(url, { headers: { Accept: 'application/json' } })
      .then(r => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(json => {
        const item = Array.isArray(json.data) ? json.data[0] : json.data;
        if (!item) throw new Error('Not found');
        setAsset(item);
        setLoading(false);
      })
      .catch(() => {
        setError('Asset not found. Please verify the QR code or contact the administrator.');
        setLoading(false);
      });
  }, [id]);

  const latestMovement = getLatestMovement(asset?.movements);
  const officeName = latestMovement?.division?.acronym || latestMovement?.division?.name
    || latestMovement?.office?.acronym || latestMovement?.office?.name || '—';
  const personAccountable = fmtEmployee(latestMovement?.employee);
  const personFull = [officeName, personAccountable].filter(s => s && s !== '—').join(' — ');

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-xl bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-blue-700 text-white text-center px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1">
            <img src="/images/erc-logo.png" alt="ERC" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white p-0.5" />
            <div>
              <p className="font-bold text-sm sm:text-base leading-tight">ENERGY REGULATORY COMMISSION</p>
              <p className="text-blue-200 text-[10px] sm:text-xs tracking-widest">PROPERTY INVENTORY STICKER</p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            <p className="text-slate-500 text-sm">Loading asset information...</p>
          </div>
        )}

        {error && (
          <div className="px-6 py-12 text-center">
            <div className="text-4xl mb-3">🔒</div>
            <p className="text-slate-700 font-medium mb-1">Cannot display asset</p>
            <p className="text-slate-500 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && asset && (
          <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-3">

            {/* Group badge */}
            <div className="flex justify-end">
              <span className={`text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 rounded-full text-center ${
                asset.group?.toUpperCase() === 'PPE'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                <span className="hidden sm:inline">{asset.group?.toUpperCase() === 'PPE' ? 'PPE — Property, Plant & Equipment' : 'SE — Semi-Expendable'}</span>
                <span className="sm:hidden">{asset.group?.toUpperCase() === 'PPE' ? 'PPE' : 'SE'}</span>
              </span>
            </div>

            {/* Main info rows */}
            <InfoRow label="Property No." value={asset.propertyNumber} mono />
            <InfoRow label="Description" value={asset.description} />
            {(asset.model || asset.serialNumber) && (
              <InfoRow
                label="Model / Serial Number"
                value={[asset.model, asset.serialNumber ? `SN: ${asset.serialNumber}` : ''].filter(Boolean).join(' / ')}
              />
            )}
            {asset.category?.name && (
              <InfoRow label="Category" value={asset.category.name} />
            )}
            <InfoRow
              label="Acquisition Date / Cost"
              value={`${fmt(asset.dateAcquired)} / ${fmtCurrency(asset.unitValue)}`}
            />
            <InfoRow label="Person Accountable" value={personFull} bold />
            {latestMovement?.parIcsNumber && (
              <InfoRow label="PAR / ICS No." value={latestMovement.parIcsNumber} mono />
            )}
            {latestMovement?.condition && (
              <InfoRow label="Condition" value={latestMovement.condition} />
            )}

            <hr className="border-slate-100 my-1" />

            <p className="text-center text-xs text-slate-400 pb-1 italic">
              Tampering / Removing of this sticker is Punishable under ERC Regulations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, bold }: { label: string; value?: string | null; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
      <span className={`text-sm text-slate-800 ${mono ? 'font-mono' : ''} ${bold ? 'font-semibold' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}
