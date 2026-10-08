import React, { useState, useEffect } from 'react';
import { PartnerRecord, PersonnelCategory, CATEGORY_LABELS } from './types';
import { DocumentViewer } from './components/DocumentViewer';
import { PartnerManager } from './components/PartnerManager';
import { HRWorkspace } from './components/HRWorkspace';
import { AccountsWorkspace } from './components/AccountsWorkspace';
import { NewProfileModal } from './components/NewProfileModal';
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
  CreditCard,
  Briefcase,
  Layers,
  ChevronDown,
} from 'lucide-react';

type TabType = 'document' | 'hr' | 'accounts' | 'registry';

export default function App() {
  const [partners, setPartners] = useState<PartnerRecord[]>(SCANNED_PARTNERS);
  const [activePartnerId, setActivePartnerId] = useState<string>(SCANNED_PARTNERS[0].id);
  const [isStorageReady, setIsStorageReady] = useState(false);

  // Tab & View Navigation
  const [currentTab, setCurrentTab] = useState<TabType>('document');
  const [docViewMode, setDocViewMode] = useState<'all' | 'single'>('all');

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isNewProfileModalOpen, setIsNewProfileModalOpen] = useState(false);
  const [newProfileCategoryPreset, setNewProfileCategoryPreset] = useState<PersonnelCategory>('permanent_employee');

  // PDF Export loading
  const [exportLoading, setExportLoading] = useState(false);
  const [exportProgressText, setExportProgressText] = useState<string | null>(null);

  // Load from IndexedDB and server store on initial mount with automatic schema enrichment
  useEffect(() => {
    let mounted = true;
    loadPartnersFromStorage()
      .then((saved) => {
        if (mounted) {
          if (saved && Array.isArray(saved) && saved.length > 0) {
            // Enrich existing stored records with full HR and Accounts metadata
            const enriched: PartnerRecord[] = saved.map((p, idx): PartnerRecord => {
              const matchedScanned = SCANNED_PARTNERS.find((sp) => sp.id === p.id);
              return {
                ...p,
                category: p.category || matchedScanned?.category || 'permanent_employee',
                department: p.department || matchedScanned?.department || 'Operations',
                designation: p.designation || matchedScanned?.designation || 'Corporate Personnel',
                documentTitle: p.documentTitle || 'Company Profiles',
                contractOrAgreementImage:
                  p.contractOrAgreementImage || matchedScanned?.contractOrAgreementImage || null,
                bankVerificationImage:
                  p.bankVerificationImage || matchedScanned?.bankVerificationImage || null,
                hrDetails: p.hrDetails || matchedScanned?.hrDetails || {
                  staffIdOrCode: `EMP-2026-00${idx + 1}`,
                  dateOfEngagement: p.generatedDate || 'October 6, 2026',
                  reportingSupervisor: 'Project Director',
                  workLocation: 'Central Headquarters & Project Sites',
                  emergencyContact: {
                    fullName: 'Contact on File',
                    relationship: 'Family',
                    phoneNumber: '+220 700 0000',
                  },
                  hrClearanceStatus: 'Fully Cleared',
                  backgroundCheckVerified: true,
                  signedAgreementOnRecord: true,
                  hrOfficerSignatory: 'Fatou Sallah, Head of Human Resources',
                  hrSignDate: p.generatedDate || 'October 6, 2026',
                },
                accountsDetails: p.accountsDetails || matchedScanned?.accountsDetails || {
                  vendorOrTaxIdCode: `ACC-2026-00${idx + 1}`,
                  tinNumber: p.extractedData?.taxInformation?.tinNumber || '2000402822',
                  taxOffice: p.extractedData?.taxInformation?.taxOffice || 'KANIFING',
                  taxRegistrationDate: p.generatedDate || 'October 6, 2026',
                  taxComplianceStatus: 'Tax Clearance Certified',
                  bankDetails: {
                    bankName: 'Trust Bank Gambia Ltd',
                    accountName: p.name,
                    accountNumber: '011002938101',
                    currency: 'GMD',
                    paymentMode: 'Direct Deposit / ACH',
                  },
                  compensation: {
                    rateType: 'Monthly Salary',
                    amount: 65000,
                    currency: 'GMD',
                    withholdingTaxPct: 0,
                    paymentTerms: 'End of Month Payroll',
                  },
                  accountsControllerSignatory: 'Aminata Bah, Financial Controller',
                  accountsSignDate: p.generatedDate || 'October 6, 2026',
                  accountsClearanceStatus: 'Payroll Active',
                },
              };
            });

            // Merge in missing enterprise defaults (subcontractors & staff) if user only had initial records
            const hasSubcontractor = enriched.some((p) => p.category === 'subcontractor');
            if (!hasSubcontractor) {
              const missingNewProfiles = SCANNED_PARTNERS.filter(
                (sp) => !enriched.some((p) => p.id === sp.id)
              );
              enriched.push(...missingNewProfiles);
            }

            setPartners(enriched);
            setActivePartnerId(enriched[0]?.id || SCANNED_PARTNERS[0].id);
          } else {
            setPartners(SCANNED_PARTNERS);
            setActivePartnerId(SCANNED_PARTNERS[0].id);
          }
          setIsStorageReady(true);
        }
      })
      .catch((err) => {
        console.warn('Initial storage load error:', err);
        if (mounted) {
          setPartners(SCANNED_PARTNERS);
          setIsStorageReady(true);
        }
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

  const handleOpenAddModal = (preset?: PersonnelCategory) => {
    setNewProfileCategoryPreset(preset || 'permanent_employee');
    setIsNewProfileModalOpen(true);
  };

  const handleAddNewProfile = (newProfile: PartnerRecord) => {
    setPartners((prev) => [...prev, newProfile]);
    setActivePartnerId(newProfile.id);
    setDocViewMode('single');
    setCurrentTab('document');
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
        'Reset all personnel and subcontractor profiles back to the verified default enterprise templates?'
      )
    ) {
      await clearPartnersFromStorage();
      setPartners(SCANNED_PARTNERS);
      setActivePartnerId(SCANNED_PARTNERS[0].id);
      setCurrentTab('document');
    }
  };

  const handleSelectPartnerFromWorkspace = (id: string) => {
    setActivePartnerId(id);
    setDocViewMode('single');
    setCurrentTab('document');
  };

  // 1. Browser Native / Vector Print
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
      const activeObj = partners.find((p) => p.id === activePartnerId);
      const filename =
        docViewMode === 'single'
          ? `Company-Profile-${(activeObj?.name || 'Personnel').replace(/\s+/g, '-')}.pdf`
          : `Enterprise-Profiles-All-${partners.length}.pdf`;

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
    const listToExport =
      docViewMode === 'single'
        ? partners.filter((p) => p.id === activePartnerId)
        : partners;

    downloadStandaloneHtmlDossier(
      listToExport,
      docViewMode === 'single'
        ? `Company-Profile-${(partners.find((p) => p.id === activePartnerId)?.name || 'Personnel').replace(/\s+/g, '-')}.html`
        : `Company-Profiles-All-${partners.length}.html`
    );
    setIsExportModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased">
      {/* Top Corporate Navigation Header (Hidden in Print) */}
      <header className="no-print bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Main Top Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
            {/* Corporate Brand Identity */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                    Company Profiles
                  </h1>
                  <p className="text-[11px] text-slate-400 font-medium">
                    HR Department &amp; Accounts Disbursement Portal
                  </p>
                </div>
              </div>

              {/* Mobile Quick Action Buttons */}
              <div className="flex sm:hidden items-center gap-1.5">
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

            {/* Department Navigation Tabs & Desktop Action Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              {/* Tab Selector */}
              <div className="bg-slate-800 p-1 rounded-lg flex items-center border border-slate-700 overflow-x-auto text-xs">
                <button
                  type="button"
                  onClick={() => setCurrentTab('document')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition whitespace-nowrap ${
                    currentTab === 'document'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Official Dossiers</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTab('hr')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition whitespace-nowrap ${
                    currentTab === 'hr'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>HR Department</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTab('accounts')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition whitespace-nowrap ${
                    currentTab === 'accounts'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Accounts &amp; Payroll</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTab('registry')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition whitespace-nowrap ${
                    currentTab === 'registry'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Uploads &amp; Scans</span>
                </button>
              </div>

              {/* Desktop Action Controls */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAddModal('permanent_employee')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Profile</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={exportLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold transition"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition"
                  title="Print Options"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Subbar in Document View for Multi-Partner controls */}
        {currentTab === 'document' && (
          <div className="bg-slate-800/80 border-t border-slate-700/60 px-3 sm:px-6 lg:px-8 py-2">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-slate-400 font-medium">View Mode:</span>
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
                    Single Profile
                  </button>
                </div>

                {docViewMode === 'single' && (
                  <select
                    value={activePartnerId}
                    onChange={(e) => setActivePartnerId(e.target.value)}
                    className="bg-slate-900 text-white border border-slate-700 rounded px-2.5 py-1 text-xs font-medium max-w-[220px] truncate"
                  >
                    {partners.map((p, idx) => (
                      <option key={p.id} value={p.id}>
                        #{idx + 1} {p.name} ({CATEGORY_LABELS[p.category] || p.category})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-700/40">
                <button
                  type="button"
                  onClick={handleResetToScannedPartners}
                  className="text-slate-300 hover:text-white hover:underline text-[11px]"
                  title="Restore verified default profiles"
                >
                  Reset Defaults
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={() => handleOpenAddModal('permanent_employee')}
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
        {currentTab === 'document' && (
          <div className="flex flex-col items-center">
            {/* Quick Profile Selector Toolbar */}
            <div className="no-print w-full max-w-[840px] mb-4 bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
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
                      <span className="max-w-[120px] truncate">{p.name}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleOpenAddModal()}
                    className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 flex items-center gap-1 shrink-0 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New
                  </button>
                </div>

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
              onAddPartner={() => handleOpenAddModal('permanent_employee')}
            />
          </div>
        )}

        {currentTab === 'hr' && (
          <HRWorkspace
            partners={partners}
            onSelectPartner={handleSelectPartnerFromWorkspace}
            onUpdatePartner={handleUpdatePartner}
            onOpenAddModal={handleOpenAddModal}
          />
        )}

        {currentTab === 'accounts' && (
          <AccountsWorkspace
            partners={partners}
            onSelectPartner={handleSelectPartnerFromWorkspace}
            onUpdatePartner={handleUpdatePartner}
            onOpenAddModal={handleOpenAddModal}
          />
        )}

        {currentTab === 'registry' && (
          <PartnerManager
            partners={partners}
            activePartnerId={activePartnerId}
            onSelectPartner={setActivePartnerId}
            onAddPartner={() => handleOpenAddModal('permanent_employee')}
            onDeletePartner={handleDeletePartner}
            onUpdatePartner={handleUpdatePartner}
            onSwitchToView={() => setCurrentTab('document')}
          />
        )}
      </main>

      {/* New Profile Wizard / Modal */}
      <NewProfileModal
        isOpen={isNewProfileModalOpen}
        initialCategory={newProfileCategoryPreset}
        onClose={() => setIsNewProfileModalOpen(false)}
        onAddProfile={handleAddNewProfile}
      />

      {/* Print / Export Options Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Print &amp; Export Corporate Dossier</h3>
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
                <p className="font-semibold">Browser Print &amp; PDF Options:</p>
                <p className="mt-0.5 text-blue-800">
                  Select your preferred high-resolution export format below.
                </p>
              </div>

              {exportLoading && (
                <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Generating Official PDF...</p>
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
                    Download Official PDF Dossier (.pdf)
                    <span className="px-1.5 py-0.2 bg-blue-600 text-white text-[10px] rounded uppercase font-mono">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Directly saves a formatted A4 PDF containing {docViewMode === 'all' ? `all ${partners.length} profile(s)` : 'the active profile'} with high-res scanned attachments and sign-offs.
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
                    Self-contained document package for offline viewing and ultra-crisp vector printing.
                  </p>
                </div>
              </button>

              {/* Option 3: Browser Vector Print */}
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
                    Vector Browser Print Window
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Opens a dedicated vector print window and triggers your system's printer or "Save as PDF" dialog.
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
              Apex Infrastructure &amp; Enterprise Group
            </span>
            <span className="text-slate-600">|</span>
            <span>Corporate HR &amp; Accounts Profiling System</span>
          </div>
          <div className="text-slate-500 font-mono text-[11px]">
            Confidential Enterprise Registry • Internal Corporate Use Only
          </div>
        </div>
      </footer>
    </div>
  );
}
