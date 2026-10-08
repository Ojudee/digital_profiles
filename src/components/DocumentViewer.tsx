import React, { useState } from 'react';
import {
  PartnerRecord,
  VisibleDetail,
  PersonnelCategory,
  CATEGORY_LABELS,
  CATEGORY_BADGE_STYLES,
} from '../types';
import { ImageCropModal } from './ImageCropModal';
import { DocumentScannerModal } from './DocumentScannerModal';
import { scanAndAutoResizeDocument } from '../utils/imageScanner';
import {
  Calendar,
  CheckSquare,
  ZoomIn,
  ZoomOut,
  X,
  Copy,
  Check,
  Edit3,
  Save,
  Plus,
  Trash2,
  Upload,
  Crop,
  RefreshCw,
  FileCheck,
  CheckCircle2,
  Sparkles,
  Maximize2,
  RotateCw,
  Download,
  Loader2,
  ShieldCheck,
  Building,
  Briefcase,
  CreditCard,
  Receipt,
  Phone,
  Landmark,
  UserCheck,
} from 'lucide-react';

interface DocumentViewerProps {
  partners: PartnerRecord[];
  activePartnerId?: string;
  viewMode: 'all' | 'single';
  onUpdatePartner?: (id: string, updates: Partial<PartnerRecord>) => void;
  onAddPartner?: () => void;
}

interface EditFormData {
  partnerName: string;
  documentTitle: string;
  generatedDate: string;
  category: PersonnelCategory;
  department: string;
  designation: string;
  staffIdOrCode: string;
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  issueDate: string;
  expiryDate: string;
  nationality: string;
  otherDetails: VisibleDetail[];
  tinNumber: string;
  taxpayerName: string;
  taxOffice: string;
  registrationDate: string;
  otherTaxDetails: VisibleDetail[];
  bankName: string;
  accountName: string;
  accountNumber: string;
  sortCodeOrBranch: string;
  paymentMode: string;
  currency: string;
  rateType: string;
  compensationAmount: number;
  withholdingTaxPct: number;
  paymentTerms: string;
  emergencyContactName: string;
  emergencyContactRel: string;
  emergencyContactPhone: string;
  hrClearanceStatus: string;
  accountsClearanceStatus: string;
  hrOfficerSignatory: string;
  accountsControllerSignatory: string;
  verificationSignatory?: string;
  verificationDate?: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  partners,
  activePartnerId,
  viewMode,
  onUpdatePartner,
  onAddPartner,
}) => {
  const [lightboxImage, setLightboxImage] = useState<{
    src: string;
    title: string;
    slot?: 'idFront' | 'idBack' | 'tinCertificate' | 'contractOrAgreement' | 'bankVerification';
    partnerId?: string;
  } | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxRotation, setLightboxRotation] = useState(0);
  const [lightboxFitMode, setLightboxFitMode] = useState<'fit' | 'fill' | 'original'>('fit');

  const [copiedPartnerId, setCopiedPartnerId] = useState<string | null>(null);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);

  // Quick auto-resizing in-flight tracker
  const [isQuickAutoResizing, setIsQuickAutoResizing] = useState<string | null>(null);

  // AI Document Scanner Modal state
  const [scannerModal, setScannerModal] = useState<{
    isOpen: boolean;
    partner: PartnerRecord;
    targetSlot: 'idFront' | 'idBack' | 'tinCertificate';
    initialImageSrc: string;
  } | null>(null);

  // Interactive Crop & Adjustment Modal state
  const [cropModal, setCropModal] = useState<{
    isOpen: boolean;
    partnerId: string;
    attachmentKey:
      | 'idFrontImage'
      | 'idBackImage'
      | 'tinCertificateImage'
      | 'contractOrAgreementImage'
      | 'bankVerificationImage';
    title: string;
    imageSrc: string;
    currentAttachmentSrc?: string | null;
    attachmentType: 'idFront' | 'idBack' | 'tinCertificate';
  } | null>(null);

  // Full Edit form state
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);

  const displayedPartners =
    viewMode === 'single' && activePartnerId
      ? partners.filter((p) => p.id === activePartnerId)
      : partners;

  const totalPages = displayedPartners.length;

  const startEditing = (partner: PartnerRecord) => {
    const ext = partner.extractedData;
    const idData = ext?.partnerIdentification;
    const taxData = ext?.taxInformation;
    const hr = partner.hrDetails;
    const acc = partner.accountsDetails;

    setEditFormData({
      partnerName: partner.name,
      documentTitle: partner.documentTitle || 'Company Profiles',
      generatedDate: partner.generatedDate,
      category: partner.category || 'permanent_employee',
      department: partner.department || '',
      designation: partner.designation || '',
      staffIdOrCode: hr?.staffIdOrCode || acc?.vendorOrTaxIdCode || '',
      fullName: idData?.fullName || partner.name,
      idNumber: idData?.idNumber || '',
      dateOfBirth: idData?.dateOfBirth || '',
      issueDate: idData?.issueDate || '',
      expiryDate: idData?.expiryDate || '',
      nationality: idData?.nationality || 'GAMBIAN',
      otherDetails: idData?.otherDetails ? [...idData.otherDetails] : [],
      tinNumber: acc?.tinNumber || taxData?.tinNumber || '',
      taxpayerName: taxData?.taxpayerName || partner.name,
      taxOffice: acc?.taxOffice || taxData?.taxOffice || 'KANIFING',
      registrationDate: acc?.taxRegistrationDate || taxData?.registrationDate || '',
      otherTaxDetails: taxData?.otherDetails ? [...taxData.otherDetails] : [],
      bankName: acc?.bankDetails?.bankName || 'Trust Bank Gambia Ltd',
      accountName: acc?.bankDetails?.accountName || partner.name,
      accountNumber: acc?.bankDetails?.accountNumber || '',
      sortCodeOrBranch: acc?.bankDetails?.sortCodeOrBranch || 'Banjul Main',
      paymentMode: acc?.bankDetails?.paymentMode || 'Direct Deposit / ACH',
      currency: acc?.compensation?.currency || 'GMD',
      rateType: acc?.compensation?.rateType || 'Monthly Salary',
      compensationAmount: acc?.compensation?.amount || 50000,
      withholdingTaxPct:
        acc?.compensation?.withholdingTaxPct ?? (partner.category === 'subcontractor' ? 10 : 0),
      paymentTerms:
        acc?.compensation?.paymentTerms ||
        (partner.category === 'subcontractor' ? 'Net 15 Days after Invoice' : 'End of Month Payroll'),
      emergencyContactName: hr?.emergencyContact?.fullName || '',
      emergencyContactRel: hr?.emergencyContact?.relationship || '',
      emergencyContactPhone: hr?.emergencyContact?.phoneNumber || '',
      hrClearanceStatus: hr?.hrClearanceStatus || 'Fully Cleared',
      accountsClearanceStatus: acc?.accountsClearanceStatus || 'Payroll Active',
      hrOfficerSignatory: hr?.hrOfficerSignatory || 'Fatou Sallah, Head of Human Resources',
      accountsControllerSignatory: acc?.accountsControllerSignatory || 'Aminata Bah, Financial Controller',
      verificationSignatory: partner.verificationSignatory || 'Authorized Corporate Signatory',
      verificationDate: partner.verificationDate || partner.generatedDate,
    });
    setEditingPartnerId(partner.id);
  };

  const cancelEditing = () => {
    setEditingPartnerId(null);
    setEditFormData(null);
  };

  const saveEditing = (partnerId: string) => {
    if (!editFormData || !onUpdatePartner) return;

    onUpdatePartner(partnerId, {
      name: editFormData.partnerName || editFormData.fullName,
      documentTitle: editFormData.documentTitle || 'Company Profiles',
      generatedDate: editFormData.generatedDate,
      category: editFormData.category,
      department: editFormData.department,
      designation: editFormData.designation,
      verificationSignatory: editFormData.verificationSignatory,
      verificationDate: editFormData.verificationDate,
      extractedData: {
        partnerIdentification: {
          fullName: editFormData.fullName,
          idNumber: editFormData.idNumber,
          dateOfBirth: editFormData.dateOfBirth,
          issueDate: editFormData.issueDate,
          expiryDate: editFormData.expiryDate,
          nationality: editFormData.nationality,
          otherDetails: editFormData.otherDetails,
          idExtractable: true,
          idExtractionNote: null,
        },
        taxInformation: {
          tinNumber: editFormData.tinNumber,
          taxpayerName: editFormData.taxpayerName,
          taxOffice: editFormData.taxOffice,
          registrationDate: editFormData.registrationDate,
          otherDetails: editFormData.otherTaxDetails,
          tinExtractable: true,
          tinExtractionNote: null,
        },
      },
      hrDetails: {
        staffIdOrCode: editFormData.staffIdOrCode,
        dateOfEngagement: editFormData.generatedDate,
        reportingSupervisor: 'Project Director / Head of HR',
        workLocation: 'Main Office & Project Sites',
        emergencyContact: {
          fullName: editFormData.emergencyContactName,
          relationship: editFormData.emergencyContactRel,
          phoneNumber: editFormData.emergencyContactPhone,
        },
        hrClearanceStatus: editFormData.hrClearanceStatus as any,
        backgroundCheckVerified: true,
        signedAgreementOnRecord: true,
        medicalFitnessVerified: true,
        hrOfficerSignatory: editFormData.hrOfficerSignatory,
        hrSignDate: editFormData.generatedDate,
      },
      accountsDetails: {
        vendorOrTaxIdCode: editFormData.staffIdOrCode,
        tinNumber: editFormData.tinNumber,
        taxOffice: editFormData.taxOffice,
        taxRegistrationDate: editFormData.registrationDate,
        taxComplianceStatus:
          editFormData.category === 'subcontractor'
            ? 'Withholding Tax Compliant'
            : 'Tax Clearance Certified',
        bankDetails: {
          bankName: editFormData.bankName,
          accountName: editFormData.accountName,
          accountNumber: editFormData.accountNumber,
          sortCodeOrBranch: editFormData.sortCodeOrBranch,
          currency: editFormData.currency,
          paymentMode: editFormData.paymentMode as any,
        },
        compensation: {
          rateType: editFormData.rateType as any,
          amount: Number(editFormData.compensationAmount) || 0,
          currency: editFormData.currency,
          withholdingTaxPct: Number(editFormData.withholdingTaxPct) || 0,
          paymentTerms: editFormData.paymentTerms,
        },
        accountsControllerSignatory: editFormData.accountsControllerSignatory,
        accountsSignDate: editFormData.generatedDate,
        accountsClearanceStatus: editFormData.accountsClearanceStatus as any,
      },
    });

    setEditingPartnerId(null);
    setEditFormData(null);
  };

  const handleCopySummary = (partner: PartnerRecord) => {
    const ext = partner.extractedData;
    const idData = ext?.partnerIdentification;
    const taxData = ext?.taxInformation;
    const hr = partner.hrDetails;
    const acc = partner.accountsDetails;

    const summary = `APEX ENTERPRISE GROUP · CORPORATE PROFILE
===================================================
Name: ${idData?.fullName || partner.name}
Category: ${CATEGORY_LABELS[partner.category] || partner.category}
Staff/Vendor Code: ${hr?.staffIdOrCode || 'N/A'}
Department: ${partner.department}
Designation: ${partner.designation}
ID Number: ${idData?.idNumber || 'N/A'}
Date of Birth: ${idData?.dateOfBirth || 'N/A'}
Nationality: ${idData?.nationality || 'N/A'}

TAX & ACCOUNTS
---------------------------------------------------
TIN Number: ${acc?.tinNumber || taxData?.tinNumber || 'N/A'}
Tax Office: ${acc?.taxOffice || taxData?.taxOffice || 'N/A'}
Bank: ${acc?.bankDetails?.bankName || 'N/A'}
Account No: ${acc?.bankDetails?.accountNumber || 'N/A'}
Disbursement: ${acc?.compensation?.currency || 'GMD'} ${(acc?.compensation?.amount || 0).toLocaleString()} (${acc?.compensation?.rateType || 'Monthly'})
Withholding Tax: ${acc?.compensation?.withholdingTaxPct ?? 0}%

EMERGENCY CONTACT
---------------------------------------------------
Contact: ${hr?.emergencyContact?.fullName || 'N/A'} (${hr?.emergencyContact?.relationship || 'N/A'})
Phone: ${hr?.emergencyContact?.phoneNumber || 'N/A'}
Confidential – Internal Use Only.`;

    navigator.clipboard.writeText(summary);
    setCopiedPartnerId(partner.id);
    setTimeout(() => setCopiedPartnerId(null), 2000);
  };

  const handleOpenCropForCurrent = (
    partner: PartnerRecord,
    attachmentKey:
      | 'idFrontImage'
      | 'idBackImage'
      | 'tinCertificateImage'
      | 'contractOrAgreementImage'
      | 'bankVerificationImage',
    title: string
  ) => {
    const current = partner[attachmentKey];
    if (!current) return;
    setCropModal({
      isOpen: true,
      partnerId: partner.id,
      attachmentKey,
      title: `Crop & Adjust: ${title}`,
      imageSrc: current,
      currentAttachmentSrc: current,
      attachmentType:
        attachmentKey === 'tinCertificateImage'
          ? 'tinCertificate'
          : attachmentKey === 'idBackImage'
          ? 'idBack'
          : 'idFront',
    });
  };

  const handleSelectFileToCropAndReplace = (
    partner: PartnerRecord,
    attachmentKey:
      | 'idFrontImage'
      | 'idBackImage'
      | 'tinCertificateImage'
      | 'contractOrAgreementImage'
      | 'bankVerificationImage',
    title: string,
    file: File
  ) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, or SVG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCropModal({
          isOpen: true,
          partnerId: partner.id,
          attachmentKey,
          title: `Crop & Adjust Before Upload: ${title}`,
          imageSrc: e.target.result as string,
          currentAttachmentSrc: partner[attachmentKey],
          attachmentType:
            attachmentKey === 'tinCertificateImage'
              ? 'tinCertificate'
              : attachmentKey === 'idBackImage'
              ? 'idBack'
              : 'idFront',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAIScanner = (
    partner: PartnerRecord,
    slot: 'idFront' | 'idBack' | 'tinCertificate'
  ) => {
    const src =
      slot === 'tinCertificate'
        ? partner.tinCertificateImage
        : slot === 'idBack'
        ? partner.idBackImage
        : partner.idFrontImage;
    if (!src) return;
    setScannerModal({
      isOpen: true,
      partner,
      targetSlot: slot,
      initialImageSrc: src,
    });
  };

  const handleQuickAutoResize = async (
    partner: PartnerRecord,
    slot: 'idFront' | 'idBack' | 'tinCertificate'
  ) => {
    const currentSrc =
      slot === 'tinCertificate'
        ? partner.tinCertificateImage
        : slot === 'idBack'
        ? partner.idBackImage
        : partner.idFrontImage;
    if (!currentSrc || !onUpdatePartner) return;

    setIsQuickAutoResizing(`${partner.id}-${slot}`);
    try {
      const res = await scanAndAutoResizeDocument(currentSrc, slot, { fillMode: 'fill' });
      const updateKey =
        slot === 'tinCertificate'
          ? 'tinCertificateImage'
          : slot === 'idBack'
          ? 'idBackImage'
          : 'idFrontImage';
      onUpdatePartner(partner.id, { [updateKey]: res.dataUrl });
    } catch (err) {
      console.error('Quick auto-resize error:', err);
    } finally {
      setIsQuickAutoResizing(null);
    }
  };

  const handleAutoResizeAllAttachments = async (partner: PartnerRecord) => {
    if (!onUpdatePartner) return;
    setIsQuickAutoResizing(`${partner.id}-all`);
    try {
      const updates: Partial<PartnerRecord> = {};
      if (partner.idFrontImage) {
        const res = await scanAndAutoResizeDocument(partner.idFrontImage, 'idFront', {
          fillMode: 'fill',
        });
        updates.idFrontImage = res.dataUrl;
      }
      if (partner.idBackImage) {
        const res = await scanAndAutoResizeDocument(partner.idBackImage, 'idBack', {
          fillMode: 'fill',
        });
        updates.idBackImage = res.dataUrl;
      }
      if (partner.tinCertificateImage) {
        const res = await scanAndAutoResizeDocument(partner.tinCertificateImage, 'tinCertificate', {
          fillMode: 'fill',
        });
        updates.tinCertificateImage = res.dataUrl;
      }
      onUpdatePartner(partner.id, updates);
    } catch (err) {
      console.error('Auto-resize all error:', err);
    } finally {
      setIsQuickAutoResizing(null);
    }
  };

  return (
    <div className="w-full flex flex-col items-center space-y-8 print:space-y-0">
      {displayedPartners.map((partner, index) => {
        const pageNumber = index + 1;
        const ext = partner.extractedData;
        const idData = ext?.partnerIdentification;
        const taxData = ext?.taxInformation;
        const hr = partner.hrDetails;
        const acc = partner.accountsDetails;
        const isEditing = editingPartnerId === partner.id;

        const isIdExtractable = idData?.idExtractable !== false && Boolean(idData?.fullName || idData?.idNumber);
        const isTinExtractable = taxData?.tinExtractable !== false && Boolean(taxData?.tinNumber || taxData?.taxpayerName);
        const badge = CATEGORY_BADGE_STYLES[partner.category] || CATEGORY_BADGE_STYLES.permanent_employee;

        return (
          <article
            key={partner.id}
            id={`partner-page-${partner.id}`}
            data-partner-page="true"
            className={`w-full max-w-[840px] bg-white text-slate-900 shadow-xl rounded-sm border border-slate-300 overflow-hidden flex flex-col justify-between sm:min-h-[1120px] print:border-none print:shadow-none print:max-w-none print:rounded-none print:p-0 print:m-0 print:min-h-0 print:max-h-none ${
              pageNumber < totalPages ? 'page-break-after' : ''
            }`}
          >
            {/* Top Corporate Accent Bar */}
            <div className="h-2.5 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 w-full print:bg-slate-900 shrink-0" />

            {/* Inner Content with standard A4 margins */}
            <div className="p-3.5 sm:p-7 md:p-9 print:p-4 print:py-3 flex-1 flex flex-col justify-between">
              <div>
                {/* 1. Cover / Corporate Header */}
                <header className="border-b-2 border-slate-900 pb-3 mb-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {/* Organization Top Kicker */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-block px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-slate-900 text-white rounded">
                          APEX ENTERPRISE GROUP
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">
                          REF: {hr?.staffIdOrCode || acc?.vendorOrTaxIdCode || partner.id.toUpperCase()}
                        </span>
                      </div>

                      {/* Document Title (Editable) */}
                      {isEditing && editFormData ? (
                        <div className="my-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Document Title (Editable):
                          </label>
                          <input
                            type="text"
                            value={editFormData.documentTitle}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, documentTitle: e.target.value })
                            }
                            placeholder="e.g. Company Profiles"
                            className="w-full text-xl sm:text-2xl font-serif font-bold text-slate-950 border-b-2 border-blue-500 bg-blue-50/20 px-1 py-0.5 rounded focus:outline-none focus:bg-white"
                          />
                        </div>
                      ) : (
                        <div className="group relative flex items-center gap-2">
                          <input
                            type="text"
                            value={partner.documentTitle || 'Company Profiles'}
                            onChange={(e) => {
                              if (onUpdatePartner) {
                                onUpdatePartner(partner.id, { documentTitle: e.target.value });
                              }
                            }}
                            title="Click to edit Company Profiles title"
                            className="text-xl sm:text-2xl font-serif font-bold text-slate-950 tracking-tight leading-tight bg-transparent hover:bg-slate-50 focus:bg-white px-1 -mx-1 py-0.5 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition w-full max-w-[580px]"
                          />
                          <span className="no-print opacity-0 group-hover:opacity-100 transition text-slate-400 text-xs flex items-center gap-1 shrink-0 pointer-events-none">
                            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-[10px] text-slate-500">Edit Title</span>
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                        <span>Dossier Effective: {partner.generatedDate}</span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end shrink-0">
                      <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Page {pageNumber} of {totalPages}
                      </div>
                      <div className="text-xs font-bold text-blue-900 mt-1 max-w-[200px] truncate">
                        {isEditing && editFormData ? editFormData.fullName : (idData?.fullName || partner.name)}
                      </div>

                      {/* Header Actions (hidden in print) */}
                      <div className="no-print mt-2 flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveEditing(partner.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded flex items-center gap-1 shadow-xs transition"
                            >
                              <Save className="w-3 h-3" />
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-medium rounded transition"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAutoResizeAllAttachments(partner)}
                              disabled={isQuickAutoResizing === `${partner.id}-all`}
                              className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded text-[11px] font-semibold flex items-center gap-1 transition shadow-2xs"
                              title="Auto-resize all ID & TIN attachments to standard formatting without quality loss"
                            >
                              {isQuickAutoResizing === `${partner.id}-all` ? (
                                <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                              ) : (
                                <Sparkles className="w-3 h-3 text-indigo-600" />
                              )}
                              <span>Auto-Fit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => startEditing(partner)}
                              className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded text-[11px] font-medium flex items-center gap-1 transition"
                              title="Edit all fields on this profile"
                            >
                              <Edit3 className="w-3 h-3 text-blue-600" />
                              Edit Data
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopySummary(partner)}
                              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
                              title="Copy text summary to clipboard"
                            >
                              {copiedPartnerId === partner.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700 font-medium">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Classification & Department Strip */}
                  <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {CATEGORY_LABELS[partner.category] || partner.category}
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {hr?.staffIdOrCode || acc?.vendorOrTaxIdCode || 'CODE: PENDING'}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-bold text-slate-900">{partner.designation || 'Corporate Role'}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600">{partner.department || 'Operations'}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        HR: {hr?.hrClearanceStatus || 'Verified'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-blue-900 font-semibold">
                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                        Accounts: {acc?.accountsClearanceStatus || 'Billing Approved'}
                      </span>
                    </div>
                  </div>
                </header>

                {/* Section 1: Personnel Identification & Statutory Bio-Data */}
                <section className="mb-3.5">
                  <div className="flex items-center gap-2 border-b border-slate-300 pb-1 mb-2">
                    <div className="w-5 h-5 rounded bg-blue-900 text-white flex items-center justify-center text-[10px] font-bold">
                      1
                    </div>
                    <h2 className="text-sm sm:text-base font-serif font-bold text-slate-950">
                      Personnel Identification &amp; Statutory Bio-Data
                    </h2>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-sans ml-auto">
                      (Verified from Attached Identity Credentials)
                    </span>
                  </div>

                  {/* Identification Details Table */}
                  <div className="overflow-x-auto border border-slate-300 rounded-sm mb-2.5">
                    <table className="w-full min-w-[460px] sm:min-w-0 text-left text-xs border-collapse">
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <th className="w-28 sm:w-36 bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                            Full Legal Name
                          </th>
                          <td className="px-3 py-1.5 font-bold text-slate-950 text-sm">
                            {isEditing && editFormData ? (
                              <input
                                type="text"
                                value={editFormData.fullName}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, fullName: e.target.value })
                                }
                                className="w-full px-2 py-0.5 border border-blue-400 bg-blue-50/30 rounded font-bold text-sm"
                              />
                            ) : (
                              idData?.fullName || partner.name
                            )}
                          </td>
                          <th className="w-24 sm:w-32 bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                            ID / Passport No
                          </th>
                          <td className="px-3 py-1.5 font-mono font-bold text-blue-950 text-xs">
                            {isEditing && editFormData ? (
                              <input
                                type="text"
                                value={editFormData.idNumber}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, idNumber: e.target.value })
                                }
                                className="w-full px-2 py-0.5 border border-blue-400 bg-blue-50/30 rounded font-mono font-bold text-xs"
                              />
                            ) : (
                              idData?.idNumber || 'Verified on Scan'
                            )}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <th className="bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                            Date of Birth
                          </th>
                          <td className="px-3 py-1.5 text-slate-800">
                            {isEditing && editFormData ? (
                              <input
                                type="text"
                                value={editFormData.dateOfBirth}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, dateOfBirth: e.target.value })
                                }
                                className="w-full px-2 py-0.5 border border-blue-400 bg-blue-50/30 rounded text-xs"
                              />
                            ) : (
                              idData?.dateOfBirth || 'Document Archived'
                            )}
                          </td>
                          <th className="bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                            Nationality
                          </th>
                          <td className="px-3 py-1.5 text-slate-800 font-medium">
                            {isEditing && editFormData ? (
                              <input
                                type="text"
                                value={editFormData.nationality}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, nationality: e.target.value })
                                }
                                className="w-full px-2 py-0.5 border border-blue-400 bg-blue-50/30 rounded text-xs font-medium"
                              />
                            ) : (
                              idData?.nationality || 'GAMBIAN / ECOWAS'
                            )}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <th className="bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                            Issue / Expiry
                          </th>
                          <td className="px-3 py-1.5 text-slate-800">
                            {idData?.issueDate || '2024'} – {idData?.expiryDate || '2029'}
                          </td>
                          <th className="bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                            Emergency Contact
                          </th>
                          <td className="px-3 py-1.5 text-slate-800 font-semibold">
                            {hr?.emergencyContact?.fullName ? (
                              <span>
                                {hr.emergencyContact.fullName} ({hr.emergencyContact.relationship}) ·{' '}
                                <span className="font-mono text-blue-900">{hr.emergencyContact.phoneNumber}</span>
                              </span>
                            ) : (
                              <span className="italic text-slate-500 font-normal">HR Intake on File</span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Attached ID Scans Grid (ID Front & ID Back) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3 print:grid-cols-2 print:mb-2">
                    {/* ID Front */}
                    <div className="image-attachment-card avoid-break border border-slate-300 rounded p-2 bg-slate-50/70 flex flex-col justify-between print:p-1.5 print:break-inside-avoid">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                            Attached: ID Front Image
                          </span>
                          <span className="text-[9px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-mono font-bold">
                            BIOMETRIC ID-1
                          </span>
                        </div>
                        {partner.idFrontImage ? (
                          <div
                            onClick={() =>
                              setLightboxImage({
                                src: partner.idFrontImage!,
                                title: `${partner.name} - ID Front Image`,
                                slot: 'idFront',
                                partnerId: partner.id,
                              })
                            }
                            className="group relative cursor-pointer rounded border border-slate-300 bg-white flex items-center justify-center w-full aspect-[85/54] max-h-48 print:max-h-28 overflow-hidden transition hover:border-blue-500 shadow-2xs"
                          >
                            <img
                              src={partner.idFrontImage}
                              alt="ID Front Image"
                              className="w-full h-full object-contain object-center"
                            />
                            <div className="no-print absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-semibold gap-1">
                              <ZoomIn className="w-3.5 h-3.5" />
                              View Full
                            </div>
                          </div>
                        ) : (
                          <label className="h-28 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-500 text-[11px] cursor-pointer hover:border-blue-500 hover:bg-white transition p-2 text-center">
                            <Upload className="w-4 h-4 text-blue-600 mb-1" />
                            <span className="font-semibold text-slate-700">Attach ID Front Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleSelectFileToCropAndReplace(
                                    partner,
                                    'idFrontImage',
                                    'ID Front Image',
                                    e.target.files[0]
                                  );
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {partner.idFrontImage && (
                        <div className="no-print mt-1.5 flex items-center justify-between gap-1 pt-1 border-t border-slate-200 text-[10px]">
                          <button
                            type="button"
                            onClick={() => handleQuickAutoResize(partner, 'idFront')}
                            disabled={isQuickAutoResizing === `${partner.id}-idFront`}
                            className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-medium flex items-center gap-1 shadow-2xs transition"
                          >
                            <Maximize2 className="w-3 h-3 text-blue-600" />
                            Auto-Fit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenCropForCurrent(partner, 'idFrontImage', 'ID Front')}
                            className="px-1.5 py-0.5 bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 rounded font-medium flex items-center gap-1 shadow-2xs transition"
                          >
                            <Crop className="w-3 h-3 text-blue-600" />
                            Crop
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ID Back */}
                    <div className="image-attachment-card avoid-break border border-slate-300 rounded p-2 bg-slate-50/70 flex flex-col justify-between print:p-1.5 print:break-inside-avoid">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                            Attached: ID Back Image
                          </span>
                          <span className="text-[9px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-mono font-bold">
                            MRZ &amp; ENDORSEMENT
                          </span>
                        </div>
                        {partner.idBackImage ? (
                          <div
                            onClick={() =>
                              setLightboxImage({
                                src: partner.idBackImage!,
                                title: `${partner.name} - ID Back Image`,
                                slot: 'idBack',
                                partnerId: partner.id,
                              })
                            }
                            className="group relative cursor-pointer rounded border border-slate-300 bg-white flex items-center justify-center w-full aspect-[85/54] max-h-48 print:max-h-28 overflow-hidden transition hover:border-blue-500 shadow-2xs"
                          >
                            <img
                              src={partner.idBackImage}
                              alt="ID Back Image"
                              className="w-full h-full object-contain object-center"
                            />
                            <div className="no-print absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-semibold gap-1">
                              <ZoomIn className="w-3.5 h-3.5" />
                              View Full
                            </div>
                          </div>
                        ) : (
                          <label className="h-28 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-500 text-[11px] cursor-pointer hover:border-blue-500 hover:bg-white transition p-2 text-center">
                            <Upload className="w-4 h-4 text-blue-600 mb-1" />
                            <span className="font-semibold text-slate-700">Attach ID Back Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleSelectFileToCropAndReplace(
                                    partner,
                                    'idBackImage',
                                    'ID Back Image',
                                    e.target.files[0]
                                  );
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {partner.idBackImage && (
                        <div className="no-print mt-1.5 flex items-center justify-between gap-1 pt-1 border-t border-slate-200 text-[10px]">
                          <button
                            type="button"
                            onClick={() => handleQuickAutoResize(partner, 'idBack')}
                            disabled={isQuickAutoResizing === `${partner.id}-idBack`}
                            className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-medium flex items-center gap-1 shadow-2xs transition"
                          >
                            <Maximize2 className="w-3 h-3 text-blue-600" />
                            Auto-Fit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenCropForCurrent(partner, 'idBackImage', 'ID Back')}
                            className="px-1.5 py-0.5 bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 rounded font-medium flex items-center gap-1 shadow-2xs transition"
                          >
                            <Crop className="w-3 h-3 text-blue-600" />
                            Crop
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Section 2: Accounts, Taxation & Bank Remittance Information */}
                <section className="mb-3.5">
                  <div className="flex items-center gap-2 border-b border-slate-300 pb-1 mb-2">
                    <div className="w-5 h-5 rounded bg-blue-900 text-white flex items-center justify-center text-[10px] font-bold">
                      2
                    </div>
                    <h2 className="text-sm sm:text-base font-serif font-bold text-slate-950">
                      Accounts, Taxation &amp; Bank Remittance Schedule
                    </h2>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-sans ml-auto">
                      (Verified by Finance &amp; Accounts Department)
                    </span>
                  </div>

                  {/* Dual Grid: Tax & Bank Data on Left, TIN Scan on Right */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2.5 print:grid-cols-2">
                    {/* Left: Financial & Remittance Schedule Table */}
                    <div className="border border-slate-300 rounded overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <tbody>
                          <tr className="border-b border-slate-200">
                            <th className="w-32 bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 text-[10px] uppercase">
                              GRA TIN Number
                            </th>
                            <td className="px-2.5 py-1.5 font-mono font-bold text-blue-950 text-xs">
                              {acc?.tinNumber || taxData?.tinNumber || '2000402822'}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <th className="bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 text-[10px] uppercase">
                              Tax Jurisdiction
                            </th>
                            <td className="px-2.5 py-1.5 text-slate-800">
                              {acc?.taxOffice || taxData?.taxOffice || 'KANIFING'} Division · GRA
                            </td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <th className="bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 text-[10px] uppercase">
                              Bank Depository
                            </th>
                            <td className="px-2.5 py-1.5 font-bold text-slate-900">
                              {acc?.bankDetails?.bankName || 'Trust Bank Gambia Ltd'}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <th className="bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 text-[10px] uppercase">
                              Account Number
                            </th>
                            <td className="px-2.5 py-1.5 font-mono font-bold text-blue-900 text-xs">
                              {acc?.bankDetails?.accountNumber || '011002938101'}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <th className="bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 text-[10px] uppercase">
                              Disbursement Rate
                            </th>
                            <td className="px-2.5 py-1.5 font-bold text-slate-900">
                              {acc?.compensation?.currency || 'GMD'} {(acc?.compensation?.amount || 65000).toLocaleString()}{' '}
                              <span className="text-[10px] text-slate-500 font-normal">
                                ({acc?.compensation?.rateType || 'Monthly Salary'})
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <th className="bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 text-[10px] uppercase">
                              Tax Treatment
                            </th>
                            <td className="px-2.5 py-1.5 text-slate-800 font-semibold">
                              {partner.category === 'subcontractor' ? (
                                <span className="text-purple-900 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 text-[10px]">
                                  {acc?.compensation?.withholdingTaxPct ?? 10}% Withholding Tax (WHT Deducted)
                                </span>
                              ) : (
                                <span className="text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                                  Statutory PAYE Remitted to Revenue Authority
                                </span>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Right: Attached GRA TIN Certificate Scan */}
                    <div className="tin-certificate-container avoid-break border border-slate-300 rounded p-2 bg-slate-50/70 flex flex-col justify-between print:break-inside-avoid">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                            Attached: GRA TIN Certificate
                          </span>
                          <span className="text-[9px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-mono font-bold">
                            TAX CERTIFICATE
                          </span>
                        </div>
                        {partner.tinCertificateImage ? (
                          <div
                            onClick={() =>
                              setLightboxImage({
                                src: partner.tinCertificateImage!,
                                title: `${partner.name} - TIN Certificate`,
                                slot: 'tinCertificate',
                                partnerId: partner.id,
                              })
                            }
                            className="group relative cursor-pointer rounded border border-slate-300 bg-white flex items-center justify-center w-full aspect-[94/64] max-h-48 print:max-h-32 overflow-hidden transition hover:border-blue-500 shadow-2xs"
                          >
                            <img
                              src={partner.tinCertificateImage}
                              alt="TIN Certificate Image"
                              className="w-full h-full object-contain object-center"
                            />
                            <div className="no-print absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-semibold gap-1">
                              <ZoomIn className="w-3.5 h-3.5" />
                              View Full
                            </div>
                          </div>
                        ) : (
                          <label className="h-32 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-500 text-[11px] cursor-pointer hover:border-blue-500 hover:bg-white transition p-2 text-center">
                            <Upload className="w-4 h-4 text-blue-600 mb-1" />
                            <span className="font-semibold text-slate-700">Attach TIN Certificate</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleSelectFileToCropAndReplace(
                                    partner,
                                    'tinCertificateImage',
                                    'TIN Certificate',
                                    e.target.files[0]
                                  );
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {partner.tinCertificateImage && (
                        <div className="no-print mt-1.5 flex items-center justify-between gap-1 pt-1 border-t border-slate-200 text-[10px]">
                          <button
                            type="button"
                            onClick={() => handleQuickAutoResize(partner, 'tinCertificate')}
                            disabled={isQuickAutoResizing === `${partner.id}-tinCertificate`}
                            className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-medium flex items-center gap-1 shadow-2xs transition"
                          >
                            <Maximize2 className="w-3 h-3 text-blue-600" />
                            Auto-Fit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenCropForCurrent(partner, 'tinCertificateImage', 'TIN Certificate')}
                            className="px-1.5 py-0.5 bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 rounded font-medium flex items-center gap-1 shadow-2xs transition"
                          >
                            <Crop className="w-3 h-3 text-blue-600" />
                            Crop
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Section 3: Attached Agreement & Remittance Evidence */}
                <section className="mb-3.5">
                  <div className="flex items-center gap-2 border-b border-slate-300 pb-1 mb-2">
                    <div className="w-5 h-5 rounded bg-blue-900 text-white flex items-center justify-center text-[10px] font-bold">
                      3
                    </div>
                    <h2 className="text-sm sm:text-base font-serif font-bold text-slate-950">
                      Official Engagement Contract &amp; Banking Mandate Evidence
                    </h2>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-sans ml-auto">
                      (Statutory Corporate Agreements)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2 print:grid-cols-2">
                    {/* Contract / Agreement Evidence */}
                    <div className="border border-slate-300 rounded p-2 bg-slate-50/70 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                            {partner.category === 'subcontractor'
                              ? 'Attached: Subcontract Agreement'
                              : 'Attached: Employment Appointment'}
                          </span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold">
                            LEGAL INSTRUMENT
                          </span>
                        </div>
                        {partner.contractOrAgreementImage ? (
                          <div
                            onClick={() =>
                              setLightboxImage({
                                src: partner.contractOrAgreementImage!,
                                title: `${partner.name} - Official Agreement`,
                                slot: 'contractOrAgreement',
                                partnerId: partner.id,
                              })
                            }
                            className="group relative cursor-pointer rounded border border-slate-300 bg-white flex items-center justify-center w-full aspect-[94/64] max-h-40 print:max-h-24 overflow-hidden transition hover:border-blue-500 shadow-2xs"
                          >
                            <img
                              src={partner.contractOrAgreementImage}
                              alt="Agreement Preview"
                              className="w-full h-full object-contain object-center"
                            />
                            <div className="no-print absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-semibold gap-1">
                              <ZoomIn className="w-3.5 h-3.5" />
                              View Full
                            </div>
                          </div>
                        ) : (
                          <label className="h-24 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-500 text-[11px] cursor-pointer hover:border-blue-500 hover:bg-white transition p-2 text-center">
                            <Upload className="w-4 h-4 text-blue-600 mb-1" />
                            <span className="font-semibold text-slate-700">Attach Official Contract</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleSelectFileToCropAndReplace(
                                    partner,
                                    'contractOrAgreementImage',
                                    'Official Agreement',
                                    e.target.files[0]
                                  );
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Bank Mandate / Remittance Evidence */}
                    <div className="border border-slate-300 rounded p-2 bg-slate-50/70 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                            Attached: Bank Remittance Mandate
                          </span>
                          <span className="text-[9px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-mono font-bold">
                            ACH / WIRE DEPOSIT
                          </span>
                        </div>
                        {partner.bankVerificationImage ? (
                          <div
                            onClick={() =>
                              setLightboxImage({
                                src: partner.bankVerificationImage!,
                                title: `${partner.name} - Bank Remittance Mandate`,
                                slot: 'bankVerification',
                                partnerId: partner.id,
                              })
                            }
                            className="group relative cursor-pointer rounded border border-slate-300 bg-white flex items-center justify-center w-full aspect-[94/64] max-h-40 print:max-h-24 overflow-hidden transition hover:border-blue-500 shadow-2xs"
                          >
                            <img
                              src={partner.bankVerificationImage}
                              alt="Bank Verification Slip"
                              className="w-full h-full object-contain object-center"
                            />
                            <div className="no-print absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-semibold gap-1">
                              <ZoomIn className="w-3.5 h-3.5" />
                              View Full
                            </div>
                          </div>
                        ) : (
                          <label className="h-24 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-500 text-[11px] cursor-pointer hover:border-blue-500 hover:bg-white transition p-2 text-center">
                            <Upload className="w-4 h-4 text-blue-600 mb-1" />
                            <span className="font-semibold text-slate-700">Attach Bank Slip / Mandate</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleSelectFileToCropAndReplace(
                                    partner,
                                    'bankVerificationImage',
                                    'Bank Slip Mandate',
                                    e.target.files[0]
                                  );
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 4: Dual-Department Official Certification & Sign-off */}
                <section className="border border-slate-300 rounded p-3 bg-slate-50/60 mb-2">
                  <div className="flex items-center gap-2 border-b border-slate-300 pb-1 mb-2.5">
                    <div className="w-5 h-5 rounded bg-blue-900 text-white flex items-center justify-center text-[10px] font-bold">
                      4
                    </div>
                    <h3 className="text-xs font-serif font-bold text-slate-900 uppercase tracking-wide">
                      Dual-Department Corporate Certification &amp; Sign-off
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Left: Human Resources Directorate */}
                    <div className="border border-slate-200 bg-white p-2.5 rounded">
                      <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-100">
                        <span className="text-[10px] font-bold text-emerald-900 uppercase">
                          Human Resources Directorate
                        </span>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {hr?.hrClearanceStatus || 'Fully Cleared'}
                        </span>
                      </div>
                      <div className="space-y-1 text-[11px] text-slate-700">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Certified Signatory:</span>
                          <span className="font-bold text-slate-900">
                            {hr?.hrOfficerSignatory || 'Fatou Sallah, Head of HR'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Clearance Date:</span>
                          <span className="font-mono text-slate-800">
                            {hr?.hrSignDate || partner.generatedDate}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                          Identity Verified · Background Cleared · Contract Signed
                        </div>
                      </div>
                    </div>

                    {/* Right: Accounts & Finance Controller */}
                    <div className="border border-slate-200 bg-white p-2.5 rounded">
                      <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-100">
                        <span className="text-[10px] font-bold text-blue-900 uppercase">
                          Accounts &amp; Finance Controller
                        </span>
                        <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {acc?.accountsClearanceStatus || 'Billing Approved'}
                        </span>
                      </div>
                      <div className="space-y-1 text-[11px] text-slate-700">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Controller Signatory:</span>
                          <span className="font-bold text-slate-900">
                            {acc?.accountsControllerSignatory || 'Aminata Bah, Financial Controller'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Approval Date:</span>
                          <span className="font-mono text-slate-800">
                            {acc?.accountsSignDate || partner.generatedDate}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-blue-600 inline" />
                          GRA TIN Verified · Bank Mandate Cleared · WHT/PAYE Compliant
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Document Footer (Required on every page: Confidential – Internal Use Only. + Page numbers) */}
              <footer className="pt-2 mt-2 border-t border-slate-300 text-slate-600 text-xs flex flex-row justify-between items-center shrink-0">
                <span className="font-bold tracking-wider text-slate-700 uppercase text-[9px]">
                  Confidential – Internal Corporate Use Only.
                </span>
                <span className="font-mono text-slate-600 font-semibold text-[9px]">
                  Page {pageNumber} of {totalPages}
                </span>
              </footer>
            </div>
          </article>
        );
      })}

      {/* Quick Add Profile Button in Document View */}
      {onAddPartner && (
        <div className="no-print w-full max-w-[840px] flex items-center justify-center p-4 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50/20 transition shadow-xs">
          <button
            type="button"
            onClick={() => onAddPartner()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Profile Additional Personnel / Subcontractor
          </button>
        </div>
      )}

      {/* Full-Window Lightbox Image Preview Modal */}
      {lightboxImage && (
        <div
          onClick={() => {
            setLightboxImage(null);
            setLightboxZoom(1);
            setLightboxRotation(0);
          }}
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-7xl w-[96vw] max-h-[94vh] h-[94vh] border border-slate-200 overflow-hidden flex flex-col"
          >
            {/* Top Toolbar */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-[200px]">
                <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white">
                  <Maximize2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm tracking-wide text-white">
                    {lightboxImage.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    High-Definition Full Window Document View
                  </span>
                </div>
              </div>

              {/* Center controls: Zoom, Rotate, Mode */}
              <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setLightboxZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                  className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded text-xs font-bold transition flex items-center gap-1"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-mono">Zoom -</span>
                </button>
                <span className="px-2 text-xs font-mono text-blue-300 font-bold min-w-[50px] text-center">
                  {Math.round(lightboxZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setLightboxZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                  className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded text-xs font-bold transition flex items-center gap-1"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-mono">Zoom +</span>
                </button>

                <div className="w-px h-4 bg-slate-700 mx-1" />

                <button
                  type="button"
                  onClick={() => setLightboxRotation((r) => (r + 90) % 360)}
                  className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded text-xs font-medium transition flex items-center gap-1"
                  title="Rotate 90 degrees clockwise"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Rotate</span>
                </button>

                <div className="w-px h-4 bg-slate-700 mx-1" />

                <button
                  type="button"
                  onClick={() => setLightboxFitMode((m) => (m === 'fit' ? 'original' : 'fit'))}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                    lightboxFitMode === 'fit' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Toggle Best Fit or Original Resolution"
                >
                  {lightboxFitMode === 'fit' ? 'Fit Screen' : '100% Native'}
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setLightboxImage(null);
                  setLightboxZoom(1);
                  setLightboxRotation(0);
                }}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white flex items-center justify-center transition"
                title="Close Window (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Stage */}
            <div className="flex-1 bg-slate-950 p-4 sm:p-8 overflow-auto flex items-center justify-center relative select-none">
              <div
                style={{
                  transform: `scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`,
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-w-full max-h-full flex items-center justify-center"
              >
                <img
                  src={lightboxImage.src}
                  alt={lightboxImage.title}
                  className={`rounded shadow-2xl transition-all ${
                    lightboxFitMode === 'fit'
                      ? 'max-h-[80vh] max-w-[85vw] object-contain'
                      : 'w-auto h-auto max-w-none'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Document Scanner Modal */}
      {scannerModal && (
        <DocumentScannerModal
          isOpen={scannerModal.isOpen}
          partner={scannerModal.partner}
          targetSlot={scannerModal.targetSlot}
          initialImageSrc={scannerModal.initialImageSrc}
          onClose={() => setScannerModal(null)}
          onApply={({ slot, resizedDataUrl, extractedData }) => {
            if (onUpdatePartner) {
              const updateKey =
                slot === 'tinCertificate'
                  ? 'tinCertificateImage'
                  : slot === 'idBack'
                  ? 'idBackImage'
                  : 'idFrontImage';

              const updates: Partial<PartnerRecord> = {
                [updateKey]: resizedDataUrl,
              };

              if (extractedData) {
                const prev = scannerModal.partner.extractedData;
                updates.extractedData = {
                  partnerIdentification: {
                    fullName: extractedData.fullName ?? prev?.partnerIdentification?.fullName ?? scannerModal.partner.name,
                    idNumber: extractedData.idNumber ?? prev?.partnerIdentification?.idNumber ?? null,
                    dateOfBirth: extractedData.dateOfBirth ?? prev?.partnerIdentification?.dateOfBirth ?? null,
                    issueDate: extractedData.issueDate ?? prev?.partnerIdentification?.issueDate ?? null,
                    expiryDate: extractedData.expiryDate ?? prev?.partnerIdentification?.expiryDate ?? null,
                    nationality: extractedData.nationality ?? prev?.partnerIdentification?.nationality ?? null,
                    otherDetails: extractedData.otherDetails ?? prev?.partnerIdentification?.otherDetails ?? [],
                    idExtractable: true,
                    idExtractionNote: null,
                  },
                  taxInformation: {
                    tinNumber: extractedData.tinNumber ?? prev?.taxInformation?.tinNumber ?? null,
                    taxpayerName: extractedData.taxpayerName ?? prev?.taxInformation?.taxpayerName ?? null,
                    taxOffice: extractedData.taxOffice ?? prev?.taxInformation?.taxOffice ?? null,
                    registrationDate: extractedData.registrationDate ?? prev?.taxInformation?.registrationDate ?? null,
                    otherDetails: prev?.taxInformation?.otherDetails ?? [],
                    tinExtractable: true,
                    tinExtractionNote: null,
                  },
                };
              }

              onUpdatePartner(scannerModal.partner.id, updates);
            }
            setScannerModal(null);
          }}
        />
      )}

      {/* Crop & Adjustment Modal */}
      {cropModal && (
        <ImageCropModal
          isOpen={cropModal.isOpen}
          imageSrc={cropModal.imageSrc}
          title={cropModal.title}
          attachmentType={cropModal.attachmentType}
          currentAttachmentSrc={cropModal.currentAttachmentSrc}
          onCancel={() => setCropModal(null)}
          onConfirm={(croppedDataUrl: string) => {
            if (onUpdatePartner) {
              onUpdatePartner(cropModal.partnerId, {
                [cropModal.attachmentKey]: croppedDataUrl,
              });
            }
            setCropModal(null);
          }}
        />
      )}
    </div>
  );
};
