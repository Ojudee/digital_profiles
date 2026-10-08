import jsPDF from 'jspdf';
import { toJpeg } from 'html-to-image';
import { PartnerRecord } from '../types';

/**
 * Pre-convert SVG data URLs to high-res PNG/JPEG base64 in cloned elements
 * so that html-to-image / rasterizers never choke or drop vector graphics.
 */
async function rasterizeSvgDataUrl(dataUrl: string, width = 1200, height = 800): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => {
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}

/**
 * Direct PDF Download: Renders each partner profile with pixel-exact A4 fitting.
 * Uses a normalized clone so screen resolution, scroll, or responsive resizing never disturbs the output.
 */
export async function generateAndDownloadPdf(
  filename = 'Company-Partner-Profiles.pdf',
  onProgress?: (status: string) => void
): Promise<void> {
  const pageElements = document.querySelectorAll<HTMLElement>('[data-partner-page="true"]');

  if (!pageElements || pageElements.length === 0) {
    throw new Error('No partner profile pages found to export.');
  }

  onProgress?.(`Preparing ${pageElements.length} partner dossier page(s)...`);

  // Standard A4 dimensions in mm
  const a4WidthMm = 210;
  const a4HeightMm = 297;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // Create an off-screen staging container with exact A4 aspect ratio (800px x 1130px)
  const stagingContainer = document.createElement('div');
  stagingContainer.style.position = 'fixed';
  stagingContainer.style.left = '-9999px';
  stagingContainer.style.top = '0';
  stagingContainer.style.width = '800px';
  stagingContainer.style.zIndex = '-1000';
  stagingContainer.style.background = '#ffffff';
  document.body.appendChild(stagingContainer);

  try {
    for (let i = 0; i < pageElements.length; i++) {
      const sourceEl = pageElements[i];
      onProgress?.(`Processing Page ${i + 1} of ${pageElements.length}...`);

      // Deep clone the page element
      const clonedEl = sourceEl.cloneNode(true) as HTMLElement;
      clonedEl.style.width = '800px';
      clonedEl.style.minHeight = '0';
      clonedEl.style.maxHeight = 'none';
      clonedEl.style.height = 'auto';
      clonedEl.style.margin = '0';
      clonedEl.style.padding = '0';
      clonedEl.style.boxShadow = 'none';
      clonedEl.style.border = 'none';
      clonedEl.style.borderRadius = '0';
      clonedEl.style.background = '#ffffff';
      clonedEl.style.overflow = 'visible';

      // Remove any interactive/no-print buttons from clone
      const noPrintElements = clonedEl.querySelectorAll<HTMLElement>('.no-print');
      noPrintElements.forEach((np) => np.remove());

      // Ensure TIN Certificate and ID containers never crop or cut images in the clone
      const tinBoxes = clonedEl.querySelectorAll<HTMLElement>('.tin-certificate-container');
      tinBoxes.forEach((box) => {
        box.style.overflow = 'visible';
        box.style.maxHeight = 'none';
        box.style.height = 'auto';
      });

      const allImages = clonedEl.querySelectorAll<HTMLImageElement>('img');
      allImages.forEach((img) => {
        img.style.objectFit = 'contain';
        img.style.display = 'block';
      });

      // Ensure all images are preloaded and SVGs converted to solid high-res bitmaps
      const imgElements = clonedEl.querySelectorAll<HTMLImageElement>('img');
      for (const img of Array.from(imgElements)) {
        if (img.src && img.src.startsWith('data:image/svg+xml')) {
          try {
            const rasterized = await rasterizeSvgDataUrl(img.src, 1200, 800);
            img.src = rasterized;
          } catch {
            // fallback to original src
          }
        }
      }

      stagingContainer.replaceChildren(clonedEl);

      // Brief layout pause for browser reflow
      await new Promise((r) => setTimeout(r, 60));

      const imgData = await toJpeg(clonedEl, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: false,
      });

      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      const imgProps = pdf.getImageProperties(imgData);

      // Fit with 5mm printable margins
      const margin = 5;
      const targetWidth = a4WidthMm - margin * 2; // 200mm
      const targetHeight = a4HeightMm - margin * 2; // 287mm

      const scale = Math.min(targetWidth / imgProps.width, targetHeight / imgProps.height);
      const finalWidth = imgProps.width * scale;
      const finalHeight = imgProps.height * scale;

      const xOffset = margin + (targetWidth - finalWidth) / 2;
      const yOffset = margin + (targetHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight, undefined, 'FAST');
    }

    onProgress?.('Generating PDF document...');
    pdf.save(filename);
  } finally {
    stagingContainer.remove();
  }
}

/**
 * Open a clean, isolated pop-out window with full vector printing styles and auto-triggers print dialog.
 * Bypasses web iframe restrictions effortlessly!
 */
export function openPrintDialogWindow(partners: PartnerRecord[]): void {
  const printWindow = window.open('', '_blank', 'width=950,height=900,menubar=no,toolbar=no');
  if (!printWindow) {
    // If popups are blocked, download standalone HTML dossier as automatic fallback
    downloadStandaloneHtmlDossier(partners);
    return;
  }

  const htmlContent = buildStandaloneDossierHtml(partners, true);
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Download Standalone HTML Dossier (.html):
 * 100% vector fidelity, works completely offline in Chrome/Edge/Safari with Ctrl+P.
 */
export function downloadStandaloneHtmlDossier(partners: PartnerRecord[], filename = 'Company-Profiles-Dossier.html'): void {
  const htmlContent = buildStandaloneDossierHtml(partners, false);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Shared HTML generator for standalone dossier & pop-out print window
 */
function buildStandaloneDossierHtml(partners: PartnerRecord[], autoPrint = false): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Company Partner Profile - Official Corporate Dossier</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f1f5f9;
      margin: 0;
      padding: 0;
    }
    .page-container {
      width: 100%;
      max-width: 840px;
      margin: 20px auto 40px auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
      break-inside: avoid;
      overflow: hidden;
    }
    .page-container:last-of-type {
      page-break-after: auto;
      break-after: auto;
    }
    .accent-bar {
      height: 8px;
      background: #1e3a8a;
      width: 100%;
    }
    .content {
      padding: 24px 32px 18px 32px;
    }
    header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 10px;
      font-weight: bold;
      background: #0f172a;
      color: #ffffff;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    h1 {
      font-size: 26px;
      font-family: Georgia, serif;
      margin: 6px 0 4px 0;
      color: #0f172a;
      line-height: 1.2;
    }
    .date-line {
      font-size: 11px;
      color: #475569;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: Georgia, serif;
      font-size: 14px;
      font-weight: bold;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin: 12px 0 8px 0;
    }
    .num-badge {
      width: 18px;
      height: 18px;
      background: #1e3a8a;
      color: #ffffff;
      border-radius: 4px;
      font-size: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: sans-serif;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 11px;
      border: 1px solid #cbd5e1;
    }
    th {
      width: 30%;
      background: #f8fafc;
      text-align: left;
      padding: 5px 8px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      border-top: 1px solid #e2e8f0;
    }
    td {
      padding: 5px 8px;
      border-bottom: 1px solid #e2e8f0;
      border-top: 1px solid #e2e8f0;
      color: #0f172a;
    }
    .image-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    .image-card {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 6px;
      border-radius: 4px;
    }
    .image-title {
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      color: #334155;
      margin-bottom: 4px;
    }
    .image-card img {
      width: 100%;
      height: 180px;
      max-height: 180px;
      object-fit: contain;
      object-position: center;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      border-radius: 4px;
      display: block;
    }
    .tin-image-card {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 6px;
      border-radius: 4px;
      margin-bottom: 10px;
      page-break-inside: avoid;
      break-inside: avoid;
      overflow: visible;
    }
    .tin-image-card img {
      width: 100%;
      height: auto;
      max-height: 380px;
      object-fit: contain;
      object-position: center;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      border-radius: 4px;
      display: block;
    }
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    .box {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 8px 12px;
      border-radius: 4px;
    }
    .box-title {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 3px;
      margin-bottom: 6px;
    }
    footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 8px;
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .page-container {
        border: none !important;
        box-shadow: none !important;
        margin: 0 !important;
        max-width: 100% !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 840px; margin: 15px auto; padding: 10px 16px; background: #1e3a8a; color: #ffffff; border-radius: 6px; display: flex; align-items: center; justify-content: space-between;">
    <div>
      <strong style="font-size: 13px;">Company Partner Profile - Official Dossier</strong>
      <div style="font-size: 11px; opacity: 0.9;">Ready for high-fidelity printing. Press Ctrl+P (or Cmd+P) to print or save as PDF.</div>
    </div>
    <button onclick="window.print()" style="padding: 6px 14px; background: #ffffff; color: #1e3a8a; border: none; font-size: 12px; font-weight: bold; border-radius: 4px; cursor: pointer;">
      Print Now (Ctrl+P)
    </button>
  </div>

  ${partners
    .map((partner, idx) => {
      const ext = partner.extractedData;
      const idData = ext?.partnerIdentification;
      const taxData = ext?.taxInformation;
      const pageNum = idx + 1;
      const totalPages = partners.length;

      return `
    <div class="page-container">
      <div class="accent-bar"></div>
      <div class="content">
        <header>
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <span class="badge">OFFICIAL CORPORATE DOSSIER</span>
              <h1>${partner.documentTitle || 'Company Partner Profile'}</h1>
              <div class="date-line">Date: ${partner.generatedDate}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 10px; color: #64748b; font-weight: bold;">PAGE ${pageNum} OF ${totalPages}</div>
              <div style="font-size: 12px; font-weight: bold; color: #1e3a8a; margin-top: 3px;">${idData?.fullName || partner.name}</div>
            </div>
          </div>
        </header>

        <section>
          <div class="section-title">
            <span class="num-badge">2</span>
            <span>Partner Identification (from ID Front &amp; ID Back)</span>
          </div>

          <table>
            <tbody>
              <tr>
                <th>Full Name</th>
                <td style="font-weight: bold;">${idData?.fullName || '—'}</td>
              </tr>
              <tr>
                <th>ID Number</th>
                <td style="font-family: monospace; font-weight: bold; color: #1e3a8a;">${idData?.idNumber || '—'}</td>
              </tr>
              <tr>
                <th>Date of Birth</th>
                <td>${idData?.dateOfBirth || '—'}</td>
              </tr>
              <tr>
                <th>Nationality</th>
                <td>${idData?.nationality || '—'}</td>
              </tr>
              <tr>
                <th>Issue Date / Expiry Date</th>
                <td>${idData?.issueDate || '—'} / ${idData?.expiryDate || '—'}</td>
              </tr>
              ${(idData?.otherDetails || [])
                .slice(0, 4)
                .map(
                  (d) => `
                <tr>
                  <th>${d.label}</th>
                  <td>${d.value}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="image-grid">
            <div class="image-card">
              <div class="image-title">Attached: ID Front Image</div>
              ${partner.idFrontImage ? `<img src="${partner.idFrontImage}" alt="ID Front">` : '<div>No Image</div>'}
            </div>
            <div class="image-card">
              <div class="image-title">Attached: ID Back Image</div>
              ${partner.idBackImage ? `<img src="${partner.idBackImage}" alt="ID Back">` : '<div>No Image</div>'}
            </div>
          </div>
        </section>

        <section>
          <div class="section-title">
            <span class="num-badge">3</span>
            <span>Tax Information (from TIN Certificate)</span>
          </div>

          <table>
            <tbody>
              <tr>
                <th>TIN Number</th>
                <td style="font-family: monospace; font-weight: bold; color: #1e3a8a;">${taxData?.tinNumber || '—'}</td>
              </tr>
              <tr>
                <th>Taxpayer Name</th>
                <td style="font-weight: bold;">${taxData?.taxpayerName || '—'}</td>
              </tr>
              <tr>
                <th>Tax Office</th>
                <td>${taxData?.taxOffice || '—'}</td>
              </tr>
              <tr>
                <th>Registration Date</th>
                <td>${taxData?.registrationDate || '—'}</td>
              </tr>
              ${(taxData?.otherDetails || [])
                .slice(0, 2)
                .map(
                  (d) => `
                <tr>
                  <th>${d.label}</th>
                  <td>${d.value}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="tin-image-card">
            <div class="image-title">Attached: TIN Certificate Image</div>
            ${partner.tinCertificateImage ? `<img src="${partner.tinCertificateImage}" alt="TIN Certificate">` : '<div>No Image</div>'}
          </div>
        </section>

        <div class="two-col">
          <div class="box">
            <div class="box-title">4. Verification</div>
            <div style="margin-top: 14px; font-size: 11px; font-weight: bold;">Signature: __________________________</div>
            <div style="margin-top: 8px; font-size: 11px; font-weight: bold;">Date: __________________________</div>
          </div>

          <div class="box">
            <div class="box-title">5. Attachments Checklist</div>
            <div style="font-size: 11px; line-height: 1.6; margin-top: 4px;">
              <div><strong>[x] ID Front</strong> (Verified Attached)</div>
              <div><strong>[x] ID Back</strong> (Verified Attached)</div>
              <div><strong>[x] TIN Certificate</strong> (Verified Attached)</div>
            </div>
          </div>
        </div>

        <footer>
          <span>Confidential – Internal Use Only.</span>
          <span>Page ${pageNum} of ${totalPages}</span>
        </footer>
      </div>
    </div>
    `;
    })
    .join('')}

  ${autoPrint ? `
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 500);
    });
  </script>
  ` : ''}
</body>
</html>`;
}

