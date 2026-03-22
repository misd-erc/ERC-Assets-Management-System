import type { Disposal, DisposalAsset } from './Disposals';

const ENTITY_NAME = 'ENERGY REGULATORY COMMISSION';
const FUND_CLUSTER = 'Regular Agency Fund';
const ACCOUNTABLE_OFFICER = 'CHERRY LYNN S. GONZALES';
const DESIGNATION = 'Administrative Officer V';
const STATION = 'Ortigas, Pasig City';

const commonStyles = `
  @page { size: legal landscape; margin: 10mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 7.5pt; margin: 0; padding: 0; color: #000; }
  .annex { text-align: right; font-size: 7.5pt; font-style: italic; margin-bottom: 2px; }
  .doc-title { text-align: center; font-weight: bold; font-size: 10pt; text-transform: uppercase; margin: 2px 0; }
  .doc-subtitle { text-align: center; font-size: 8pt; margin-bottom: 4px; }
  .header-container { display: flex; align-items: flex-start; margin-bottom: 2px; }
  .header-logo { width: 44px; height: 44px; object-fit: contain; margin-right: 8px; }
  .header-title-block { flex: 1; text-align: center; }
  .blue-rule { height: 2px; background: #0A62C6; margin: 3px 0 5px 0; }
  .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 3px; }
  .meta-table td { border: none; padding: 1px 2px; font-size: 7.5pt; }
  .officer-wrap { display: flex; margin-bottom: 4px; }
  .officer-block { flex: 1; text-align: center; }
  .officer-cell { border-bottom: 1px solid #000; min-height: 14px; font-size: 7.5pt; font-weight: bold; padding-bottom: 1px; }
  .officer-label { font-size: 6.5pt; color: #444; text-align: center; }
  .officer-spacer { width: 12px; flex-shrink: 0; }
  table.main { border-collapse: collapse; width: 100%; margin-bottom: 6px; }
  table.main th, table.main td { border: 1px solid #000; padding: 2px 3px; text-align: center; vertical-align: middle; word-break: break-word; }
  table.main th { background: #f0f0f0; font-size: 6.5pt; font-weight: bold; }
  table.main td { font-size: 7pt; }
  .text-left { text-align: left !important; }
  .text-right { text-align: right !important; }
  .section-hdr { background: #d8d8d8 !important; font-weight: bold; font-size: 7.5pt !important; }
  .cert-table { width: 100%; border-collapse: collapse; margin: 6px 0; }
  .cert-table td { border: none; padding: 2px 6px; font-size: 7pt; vertical-align: top; width: 33.3%; }
  .sig-wrap { display: flex; margin-top: 16px; }
  .sig-col { flex: 1; text-align: center; padding: 0 4px; }
  .sig-col-label { font-size: 7pt; text-align: left; margin-bottom: 18px; }
  .sig-name { font-size: 7.5pt; font-weight: bold; text-transform: uppercase; margin-bottom: 1px; }
  .sig-line { border-top: 1px solid #000; margin-bottom: 1px; }
  .sig-label { font-size: 6pt; color: #444; margin-bottom: 4px; }
  .sig-desig { font-size: 6pt; color: #444; }
  @media print { button { display: none !important; } }
`;

function fmt(n: number) {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildIIRUPHtml(disposal: Disposal): string {
  const asOfDate = disposal.dateApproved ?? disposal.dateRequested ?? new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  const assets = disposal.assets.filter(a => a.group === 'PPE');
  const logoUrl = `${window.location.origin}/images/erc-logo.png`;

  const rows = assets.map((a: DisposalAsset, i: number) => `
    <tr>
      <td>${i + 1}</td>
      <td class="text-left">${a.dateAcquired ? new Date(a.dateAcquired).getFullYear() : ''}</td>
      <td class="text-left">${a.code}</td>
      <td class="text-left">${a.description}</td>
      <td>${fmt(a.acquisitionCost)}</td>
      <td></td>
      <td></td>
      <td>${a.condition}</td>
      <td></td>
      <td></td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title></title>
  <style>${commonStyles}</style>
</head>
<body>
  <div class="annex">Appendix 74</div>
  <div class="header-container">
    <img class="header-logo" src="${logoUrl}" alt="ERC" />
    <div class="header-title-block">
      <div class="doc-title">INVENTORY AND INSPECTION REPORT OF UNSERVICEABLE PROPERTY</div>
      <div class="doc-subtitle">As at ${asOfDate}</div>
    </div>
  </div>
  <div class="blue-rule"></div>

  <table class="meta-table">
    <tr>
      <td style="width:50%">Entity Name: <strong>${ENTITY_NAME}</strong></td>
      <td style="width:30%">Fund Cluster: <strong>${FUND_CLUSTER}</strong></td>
      <td style="width:20%; text-align:right">IIRUP No.: <strong>${disposal.disposalNumber}</strong></td>
    </tr>
  </table>

  <div class="officer-wrap">
    <div class="officer-block">
      <div class="officer-cell">${ACCOUNTABLE_OFFICER}</div>
      <div class="officer-label">Name</div>
    </div>
    <div class="officer-spacer"></div>
    <div class="officer-block">
      <div class="officer-cell">${DESIGNATION}</div>
      <div class="officer-label">Designation</div>
    </div>
    <div class="officer-spacer"></div>
    <div class="officer-block">
      <div class="officer-cell">${STATION}</div>
      <div class="officer-label">Station</div>
    </div>
  </div>

  <table class="main">
    <thead>
      <tr>
        <th rowspan="2">No.</th>
        <th rowspan="2">Year Acquired</th>
        <th rowspan="2">Property Number</th>
        <th rowspan="2">Description</th>
        <th rowspan="2">Acquisition Cost</th>
        <th colspan="2">Accumulated Depreciation</th>
        <th rowspan="2">Condition</th>
        <th rowspan="2">Recommended Disposal Method</th>
        <th rowspan="2">Remarks</th>
      </tr>
      <tr>
        <th>Est. Useful Life</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4" class="text-right section-hdr">TOTAL</td>
        <td class="section-hdr">${fmt(assets.reduce((s, a) => s + a.acquisitionCost, 0))}</td>
        <td class="section-hdr"></td>
        <td class="section-hdr"></td>
        <td class="section-hdr"></td>
        <td class="section-hdr"></td>
        <td class="section-hdr"></td>
      </tr>
    </tfoot>
  </table>

  <table class="cert-table">
    <tr>
      <td>I hereby request disposal of the above-described properties.</td>
      <td>We hereby certify that the properties enumerated above are no longer serviceable and are recommended for disposal.</td>
      <td>Approved:</td>
    </tr>
  </table>

  <div class="sig-wrap">
    <div class="sig-col">
      <div class="sig-col-label">Requested by:</div>
      <div class="sig-name">${disposal.requestedBy}</div>
      <div class="sig-line"></div>
      <div class="sig-label">Signature over Printed Name</div>
      <div class="sig-desig">Accountable Officer/End-user</div>
    </div>
    <div class="sig-col">
      <div class="sig-col-label">Noted by:</div>
      <div class="sig-name">&nbsp;</div>
      <div class="sig-line"></div>
      <div class="sig-label">Signature over Printed Name</div>
      <div class="sig-desig">Inspection Officer</div>
    </div>
    <div class="sig-col">
      <div class="sig-col-label">&nbsp;</div>
      <div class="sig-name">${disposal.approvedBy ?? '&nbsp;'}</div>
      <div class="sig-line"></div>
      <div class="sig-label">Signature over Printed Name</div>
      <div class="sig-desig">Approving Authority</div>
    </div>
  </div>
</body>
</html>`;
}

function buildIIRUSPHtml(disposal: Disposal): string {
  const asOfDate = disposal.dateApproved ?? disposal.dateRequested ?? new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  const assets = disposal.assets.filter(a => a.group === 'SE');
  const logoUrl2 = `${window.location.origin}/images/erc-logo.png`;

  const rows = assets.map((a: DisposalAsset, i: number) => `
    <tr>
      <td>${i + 1}</td>
      <td class="text-left">${a.dateAcquired ? new Date(a.dateAcquired).getFullYear() : ''}</td>
      <td class="text-left">${a.code}</td>
      <td class="text-left">${a.description}</td>
      <td>${fmt(a.acquisitionCost)}</td>
      <td>${a.condition}</td>
      <td></td>
      <td></td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title></title>
  <style>${commonStyles}</style>
</head>
<body>
  <div class="header-container">
    <img class="header-logo" src="${logoUrl2}" alt="ERC" />
    <div class="header-title-block">
      <div class="doc-title">INVENTORY AND INSPECTION REPORT OF UNSERVICEABLE SEMI-EXPENDABLE PROPERTY</div>
      <div class="doc-subtitle">As of ${asOfDate}</div>
    </div>
  </div>
  <div class="blue-rule"></div>

  <table class="meta-table">
    <tr>
      <td style="width:50%">Entity Name: <strong>${ENTITY_NAME}</strong></td>
      <td style="width:30%">Fund Cluster: <strong>${FUND_CLUSTER}</strong></td>
      <td style="width:20%; text-align:right">IIRUSP No.: <strong>${disposal.disposalNumber}</strong></td>
    </tr>
  </table>

  <div class="officer-wrap">
    <div class="officer-block">
      <div class="officer-cell">${ACCOUNTABLE_OFFICER}</div>
      <div class="officer-label">Name</div>
    </div>
    <div class="officer-spacer"></div>
    <div class="officer-block">
      <div class="officer-cell">${DESIGNATION}</div>
      <div class="officer-label">Designation</div>
    </div>
    <div class="officer-spacer"></div>
    <div class="officer-block">
      <div class="officer-cell">${STATION}</div>
      <div class="officer-label">Station</div>
    </div>
  </div>

  <table class="main">
    <thead>
      <tr>
        <th>No.</th>
        <th>Year Acquired</th>
        <th>Property Number</th>
        <th>Description</th>
        <th>Acquisition Cost</th>
        <th>Condition</th>
        <th>Recommended Disposal Method</th>
        <th>Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4" class="text-right section-hdr">TOTAL</td>
        <td class="section-hdr">${fmt(assets.reduce((s, a) => s + a.acquisitionCost, 0))}</td>
        <td class="section-hdr"></td>
        <td class="section-hdr"></td>
        <td class="section-hdr"></td>
      </tr>
    </tfoot>
  </table>

  <table class="cert-table">
    <tr>
      <td>I hereby request disposal of the above-described properties.</td>
      <td>We hereby certify that the properties enumerated above are no longer serviceable and are recommended for disposal.</td>
      <td>Approved:</td>
    </tr>
  </table>

  <div class="sig-wrap">
    <div class="sig-col">
      <div class="sig-col-label">Requested by:</div>
      <div class="sig-name">${disposal.requestedBy}</div>
      <div class="sig-line"></div>
      <div class="sig-label">Signature over Printed Name</div>
      <div class="sig-desig">Accountable Officer/End-user</div>
    </div>
    <div class="sig-col">
      <div class="sig-col-label">Noted by:</div>
      <div class="sig-name">&nbsp;</div>
      <div class="sig-line"></div>
      <div class="sig-label">Signature over Printed Name</div>
      <div class="sig-desig">Inspection Officer</div>
    </div>
    <div class="sig-col">
      <div class="sig-col-label">&nbsp;</div>
      <div class="sig-name">${disposal.approvedBy ?? '&nbsp;'}</div>
      <div class="sig-line"></div>
      <div class="sig-label">Signature over Printed Name</div>
      <div class="sig-desig">Approving Authority</div>
    </div>
  </div>
</body>
</html>`;
}

export function printDisposal(disposal: Disposal): void {
  const html = disposal.group === 'PPE'
    ? buildIIRUPHtml(disposal)
    : buildIIRUSPHtml(disposal);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();

  iframe.onload = () => {
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };
}
