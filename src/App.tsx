import React, { useState, useEffect } from 'react';
import { PartnerRecord } from './types';
import { DocumentViewer } from './components/DocumentViewer';
import { PartnerManager } from './components/PartnerManager';
import { SCANNED_PARTNERS } from './data/partnersData';
import {
  loadPartnersFromStorage,
  savePartnersToStorage,
  clearPartnersFromStorage,
} from './utils/storage';
import {
  generateAndDownloadPdf,
  downloadStandaloneHtmlDossier,
  openPrintDialogWindow,
} from './utils/printAndPdf';
import {
  FileText,
  Printer,
  Upload,
  Plus,
  Building,
  Shield,
  Users,
  CheckCircle2,
  Download,
  AlertTriangle,
  FileCode,
  Loader2,
  X,
} from 'lucide-react';

export default function App() {
  const [partners, setPartners] = useState<PartnerRecord[]>(SCANNED_PARTNERS);
  const [activePartnerId, setActivePartnerId] = useState<string>(SCANNED_PARTNERS[0].id);
  const [isStorageReady, setIsStorageReady] = useState(false);

  // Load from IndexedDB and server store on initial mount
  useEffect(() => {
    let mounted = true;
    loadPartnersFromStorage()
      .then((saved) => {
        if (mounted) {
          if (saved && Array.isArray(saved) && saved.length > 0) {
            setPartners(saved);
            setActivePartnerId(saved[0]?.id || SCANNED_PARTNERS[0].id);
          }
          setIsStorageReady(true);
        }
      })
      .catch((err) => {
        console.warn('Initial storage load error:', err);
        if (mounted) setIsStorageReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Save to IndexedDB (unlimited quota) and server store on every change
  useEffect(() => {
    if (!isStorageReady) return;
    savePartnersToStorage(partners).catch((err) => {
      console.warn('Auto-save error:', err);
    });
  }, [partners, isStorageReady]);

  const [currentTab, setCurrentTab] = useState<'document' | 'manage'>('document');
  const [docViewMode, setDocViewMode] = useState<'all' | 'single'>('all');

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportProgressText, setExportProgressText] = useState<string | null>(null);

  const handleAddPartner = () => {
    const newIndex = partners.length + 1;
    const newId = `partner-${Date.now()}`;
    const newPartner: PartnerRecord = {
      id: newId,
      name: `Partner #${newIndex}`,
      documentTitle: 'Company Profiles',
      idFrontImage: null,
      idBackImage: null,
      tinCertificateImage: null,
      status: 'empty',
      generatedDate: 'October 6, 2026',
    };
    setPartners((prev) => [...prev, newPartner]);
    setActivePartnerId(newId);
    setDocViewMode('single');
  };

  const handleDeletePartner = (id: string) => {
    if (partners.length <= 1) return;
    const updated = partners.filter((p) => p.id !== id);
    setPartners(updated);
    if (activePartnerId === id) {
      setActivePartnerId(updated[0].id);
    }
  };

  const handleUpdatePartner = (id: string, updates: Partial<PartnerRecord>) => {
    setPartners((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleResetToScannedPartners = async () => {
    if (
      window.confirm(
        'Reset all partner profiles and attachments back to the verified default templates? This will clear custom uploaded images.'
      )
    ) {
      await clearPartnersFromStorage();
      setPartners(SCANNED_PARTNERS);
      setActivePartnerId(SCANNED_PARTNERS[0].id);
      setCurrentTab('document');
    }
  };

  // 1. Direct browser / pop-out print
  const handleNativePrint = () => {
    const listToPrint =
      docViewMode === 'single'
        ? partners.filter((p) => p.id === activePartnerId)
        : partners;

    try {
      openPrintDialogWindow(listToPrint);
      setIsExportModalOpen(false);
    } catch (err) {
      console.warn('Pop-out window error:', err);
      try {
        window.focus();
        window.print();
      } catch {
        setIsExportModalOpen(true);
      }
    }
  };

  // 2. Direct PDF export (.pdf)
  const handleDownloadPdf = async () => {
    setExportLoading(true);
    try {
      const filename =
        docViewMode === 'single'
          ? `Company-Profile-${(partners.find((p) => p.id === activePartnerId)?.name || 'Partner').replace(/\s+/g, '-')}.pdf`
          : 'Company-Profiles-All-5.pdf';

      await generateAndDownloadPdf(filename, (status) => {
        setExportProgressText(status);
      });
      setIsExportModalOpen(false);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      alert(`Could not generate PDF: ${err.message || 'Unknown error'}`);
    } finally {
      setExportLoading(false);
      setExportProgressText(null);
    }
  };

  // 3. Standalone HTML Dossier (.html)
  const handleDownloadHtml = () => {
    const listToDownload =
      docViewMode === 'single'
        ? partners.filter((p) => p.id === activePartnerId)
        : partners;

    downloadStandaloneHtmlDossier(listToDownload);
    setIsExportModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 flex flex-col font-sans">
      {/* Top Corporate Navigation Header (Hidden in Print) */}
      <header className="no-print bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 sm:py-0 sm:h-16 gap-2.5 sm:gap-4">
            {/* Top row on mobile: Brand on left, Action buttons on right */}
            <div className="flex items-center justify-between w-full sm:w-auto">
              {/* Branding */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-inner shrink-0">
                  <Building className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
                  Company Profiles
                </h1>
              </div>

              {/* Action Buttons for Mobile */}
              <div className="flex items-center gap-1.5 sm:hidden">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={exportLoading}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition active:scale-95"
                  title="Download PDF"
                >
                  {exportLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition active:scale-95"
                  title="Print Options"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* View & Print Action Controls (Desktop view + Tabs on mobile) */}
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Tab Selector */}
              <div className="bg-slate-800 p-1 rounded-lg flex items-center border border-slate-700 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setCurrentTab('document')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    currentTab === 'document'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Dossier View ({partners.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentTab('manage')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    currentTab === 'manage'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload / Add Files</span>
                </button>
              </div>

              {/* Direct PDF Download button (Desktop) */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={exportLoading}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition"
                title="Download PDF directly to your device"
              >
                {exportLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Download PDF</span>
              </button>

              {/* Print Dialog Options button (Desktop) */}
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition"
                title="Print or Save Options"
              >
                <Printer className="w-4 h-4" />
                <span>Print Options</span>
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Subbar in Document View for Multi-Partner controls */}
        {currentTab === 'document' && (
          <div className="bg-slate-800/80 border-t border-slate-700/60 px-3 sm:px-6 lg:px-8 py-2">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-slate-400 font-medium">Mode:</span>
                <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setDocViewMode('all')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                      docViewMode === 'all'
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="sm:hidden">All ({partners.length})</span>
                    <span className="hidden sm:inline">All Profiles ({partners.length}) - Compiled Dossier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocViewMode('single')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                      docViewMode === 'single'
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Single
                  </button>
                </div>

                {docViewMode === 'single' && (
                  <select
                    value={activePartnerId}
                    onChange={(e) => setActivePartnerId(e.target.value)}
                    className="bg-slate-900 text-white border border-slate-700 rounded px-2 py-1 text-xs font-medium max-w-[180px] sm:max-w-none truncate"
                  >
                    {partners.map((p, idx) => (
                      <option key={p.id} value={p.id}>
                        {idx + 1}. {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-700/40">
                <button
                  type="button"
                  onClick={handleResetToScannedPartners}
                  className="text-slate-300 hover:text-white hover:underline text-[11px]"
                  title="Restore original 5 verified partner profiles"
                >
                  Reset Defaults
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={handleAddPartner}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs shadow-xs transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-6 lg:p-8 print:p-0 print:max-w-none">
        {currentTab === 'document' ? (
          <div className="flex flex-col items-center">
            {/* Clean Profile Quick-Nav Toolbar (Hidden in Print) */}
            <div className="no-print w-full max-w-[840px] mb-4 bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                {/* Partner Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 touch-pan-x">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mr-1 shrink-0">
                    Profiles:
                  </span>
                  {partners.map((p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setActivePartnerId(p.id);
                        setDocViewMode('single');
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition border flex items-center gap-1 shrink-0 ${
                        docViewMode === 'single' && activePartnerId === p.id
                          ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="text-[10px] opacity-70">#{idx + 1}</span>
                      <span className="max-w-[110px] truncate">{p.name}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddPartner}
                    className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 flex items-center gap-1 shrink-0 transition"
                    title="Add a new partner profile"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>

                {/* Quick Export Controls */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={exportLoading}
                    className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    {exportLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExportModalOpen(true)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>
                </div>
              </div>
            </div>

            <DocumentViewer
              partners={partners}
              activePartnerId={activePartnerId}
              viewMode={docViewMode}
              onUpdatePartner={handleUpdatePartner}
              onAddPartner={handleAddPartner}
            />
          </div>
        ) : (
          <PartnerManager
            partners={partners}
            activePartnerId={activePartnerId}
            onSelectPartner={setActivePartnerId}
            onAddPartner={handleAddPartner}
            onDeletePartner={handleDeletePartner}
            onUpdatePartner={handleUpdatePartner}
            onSwitchToView={() => setCurrentTab('document')}
          />
        )}
      </main>

      {/* Print / Export Options Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Print &amp; Export Partner Dossier</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                <p className="font-semibold">Browser iFrame Notice:</p>
                <p className="mt-0.5 text-blue-800">
                  Web preview iframes can restrict standard browser print dialogues. If clicking "Browser Print" does not open your printer window, use the <strong>Download PDF</strong> or <strong>Standalone HTML</strong> options below!
                </p>
              </div>

              {exportLoading && (
                <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Generating PDF Document...</p>
                    <p className="text-slate-500">{exportProgressText || 'Please wait a moment...'}</p>
                  </div>
                </div>
              )}

              {/* Option 1: Direct PDF Download */}
              <button
                type="button"
                disabled={exportLoading}
                onClick={handleDownloadPdf}
                className="w-full text-left p-3.5 border-2 border-blue-600 bg-blue-50/50 hover:bg-blue-100/50 rounded-xl transition flex items-start gap-3 group"
              >
                <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5 group-hover:bg-blue-700 transition">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-blue-950 flex items-center gap-2">
                    Download Official PDF Document (.pdf)
                    <span className="px-1.5 py-0.2 bg-blue-600 text-white text-[10px] rounded uppercase font-mono">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Directly saves a formatted A4 PDF containing all {docViewMode === 'all' ? partners.length : 1} partner profile(s) with embedded images and footers to your computer.
                  </p>
                </div>
              </button>

              {/* Option 2: Standalone HTML Dossier */}
              <button
                type="button"
                onClick={handleDownloadHtml}
                className="w-full text-left p-3.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl transition flex items-start gap-3 group"
              >
                <div className="p-2 bg-slate-800 text-white rounded-lg shrink-0 mt-0.5">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">
                    Download Standalone HTML Dossier (.html)
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Downloads an independent, self-contained dossier file. Double-click to open in Chrome, Edge, or Safari and press Ctrl+P for 100% vector printing.
                  </p>
                </div>
              </button>

              {/* Option 3: Standard Browser Print Window */}
              <button
                type="button"
                onClick={handleNativePrint}
                className="w-full text-left p-3.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl transition flex items-start gap-3 group"
              >
                <div className="p-2 bg-emerald-700 text-white rounded-lg shrink-0 mt-0.5">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">
                    High-Fidelity Browser Print (Vector Print Dialog)
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Opens a clean, 100% vector print window and triggers your system's printer or "Save as PDF" dialog with zero margin clipping.
                  </p>
                </div>
              </button>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Corporate Web Footer (Hidden in Print) */}
      <footer className="no-print bg-slate-900 text-slate-400 border-t border-slate-800 py-6 mt-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-slate-200">
              Company Partner Profile System
            </span>
            <span className="text-slate-600">|</span>
            <span>Corporate Compliance &amp; Due Diligence Dossier</span>
          </div>
          <div className="text-slate-500 font-mono text-[11px]">
            Strict Image-Only Extraction • Confidential – Internal Use Only
          </div>
        </div>
      </footer>
    </div>
  );
}

