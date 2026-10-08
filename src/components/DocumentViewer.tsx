import React, { useState } from 'react';
import { PartnerRecord, VisibleDetail } from '../types';
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
} from 'lucide-react';

interface DocumentViewerProps {
  partners: PartnerRecord[];
  activePartnerId?: string;
  viewMode: 'all' | 'single';
  onUpdatePartner?: (id: string, updates: Partial<PartnerRecord>) => void;
  onAddPartner?: () => void;
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
    slot?: 'idFront' | 'idBack' | 'tinCertificate';
    partnerId?: string;
  } | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxRotation, setLightboxRotation] = useState(0);
  const [lightboxFitMode, setLightboxFitMode] = useState<'fit' | 'fill' | 'original'>('fit');

  const [copiedPartnerId, setCopiedPartnerId] = useState<string | null>(null);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);

  // Quick auto-resizing in-flight tracker
  const [isQuickAutoResizing, setIsQuickAutoResizing] = useState<string | null>(null);

  // AI Document Scanner & Auto-Resizer Modal state
  const [scannerModal, setScannerModal] = useState<{
    isOpen: boolean;
    partner: PartnerRecord;
    targetSlot: 'idFront' | 'idBack' | 'tinCertificate';
    initialImageSrc: string;
  } | null>(null);

  // Interactive Crop & Adjustment Modal state for before-upload and before-replacement
  const [cropModal, setCropModal] = useState<{
    isOpen: boolean;
    partnerId: string;
    attachmentKey: 'idFrontImage' | 'idBackImage' | 'tinCertificateImage';
    title: string;
    imageSrc: string;
    currentAttachmentSrc?: string | null;
    attachmentType: 'idFront' | 'idBack' | 'tinCertificate';
  } | null>(null);

  // Temporary edit state
  const [editFormData, setEditFormData] = useState<{
    partnerName: string;
    documentTitle: string;
    generatedDate: string;
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
    verificationSignatory?: string;
    verificationDate?: string;
  } | null>(null);

  const displayedPartners =
    viewMode === 'single' && activePartnerId
      ? partners.filter((p) => p.id === activePartnerId)
      : partners;

  const totalPages = displayedPartners.length;

  const startEditing = (partner: PartnerRecord) => {
    const ext = partner.extractedData;
    const idData = ext?.partnerIdentification;
    const taxData = ext?.taxInformation;

    setEditFormData({
      partnerName: partner.name,
      documentTitle: partner.documentTitle || 'Company Profiles',
      generatedDate: partner.generatedDate,
      fullName: idData?.fullName || '',
      idNumber: idData?.idNumber || '',
      dateOfBirth: idData?.dateOfBirth || '',
      issueDate: idData?.issueDate || '',
      expiryDate: idData?.expiryDate || '',
      nationality: idData?.nationality || '',
      otherDetails: idData?.otherDetails ? [...idData.otherDetails] : [],
      tinNumber: taxData?.tinNumber || '',
      taxpayerName: taxData?.taxpayerName || '',
      taxOffice: taxData?.taxOffice || '',
      registrationDate: taxData?.registrationDate || '',
      otherTaxDetails: taxData?.otherDetails ? [...taxData.otherDetails] : [],
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
    });

    setEditingPartnerId(null);
    setEditFormData(null);
  };

  const handleCopySummary = (partner: PartnerRecord) => {
    const ext = partner.extractedData;
    const idData = ext?.partnerIdentification;
    const taxData = ext?.taxInformation;

    const summary = `COMPANY PARTNER PROFILE
=============================
Name: ${idData?.fullName || partner.name}
ID Number: ${idData?.idNumber || 'N/A'}
Date of Birth: ${idData?.dateOfBirth || 'N/A'}
Nationality: ${idData?.nationality || 'N/A'}
TIN Number: ${taxData?.tinNumber || 'N/A'}
Tax Office: ${taxData?.taxOffice || 'N/A'}
Registration Date: ${taxData?.registrationDate || 'N/A'}
Generated: ${partner.generatedDate}
Confidential – Internal Use Only`;

    navigator.clipboard.writeText(summary);
    setCopiedPartnerId(partner.id);
    setTimeout(() => setCopiedPartnerId(null), 2000);
  };

  // Open crop window for an existing attachment to adjust/rotate/crop
  const handleOpenCropForCurrent = (
    partner: PartnerRecord,
    attachmentKey: 'idFrontImage' | 'idBackImage' | 'tinCertificateImage',
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

  // When user selects a new image file, open Crop Window BEFORE uploading/replacing
  const handleSelectFileToCropAndReplace = (
    partner: PartnerRecord,
    attachmentKey: 'idFrontImage' | 'idBackImage' | 'tinCertificateImage',
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

  // Open the interactive AI Document Scanner & Auto-Resizer modal
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

  // Fast 1-click lossless auto-resizing based on document format
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

  // Auto-resize all 3 attachments for the partner simultaneously
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

  // Apply results from DocumentScannerModal
  const handleApplyScannerResult = ({
    slot,
    resizedDataUrl,
    extractedData,
  }: {
    slot: 'idFront' | 'idBack' | 'tinCertificate';
    resizedDataUrl: string;
    extractedData?: any;
  }) => {
    if (!scannerModal || !onUpdatePartner) return;
    const partnerId = scannerModal.partner.id;
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
      const existing = scannerModal.partner.extractedData || {
        partnerIdentification: {
          fullName: null,
          idNumber: null,
          dateOfBirth: null,
          issueDate: null,
          expiryDate: null,
          nationality: null,
          otherDetails: [],
          idExtractable: true,
        },
        taxInformation: {
          tinNumber: null,
          taxpayerName: null,
          taxOffice: null,
          registrationDate: null,
          otherDetails: [],
          tinExtractable: true,
        },
      };

      if (slot === 'tinCertificate') {
        updates.extractedData = {
          ...existing,
          taxInformation: {
            ...existing.taxInformation,
            tinNumber: extractedData.tinNumber || existing.taxInformation.tinNumber,
            taxpayerName: extractedData.taxpayerName || existing.taxInformation.taxpayerName,
            taxOffice: extractedData.taxOffice || existing.taxInformation.taxOffice,
            registrationDate:
              extractedData.registrationDate || existing.taxInformation.registrationDate,
            otherDetails: extractedData.otherDetails || existing.taxInformation.otherDetails,
            tinExtractable: true,
            tinExtractionNote: null,
          },
        };
        if (extractedData.taxpayerName) {
          updates.name = extractedData.taxpayerName;
        }
      } else {
        updates.extractedData = {
          ...existing,
          partnerIdentification: {
            ...existing.partnerIdentification,
            fullName: extractedData.fullName || existing.partnerIdentification.fullName,
            idNumber: extractedData.idNumber || existing.partnerIdentification.idNumber,
            dateOfBirth: extractedData.dateOfBirth || existing.partnerIdentification.dateOfBirth,
            issueDate: extractedData.issueDate || existing.partnerIdentification.issueDate,
            expiryDate: extractedData.expiryDate || existing.partnerIdentification.expiryDate,
            nationality: extractedData.nationality || existing.partnerIdentification.nationality,
            otherDetails: extractedData.otherDetails || existing.partnerIdentification.otherDetails,
            idExtractable: true,
            idExtractionNote: null,
          },
        };
        if (extractedData.fullName) {
          updates.name = extractedData.fullName;
        }
      }
    }

    onUpdatePartner(partnerId, updates);
  };

  return (
    <div className="w-full flex flex-col items-center gap-10 print:gap-0 print:w-full">
      {displayedPartners.map((partner, index) => {
        const pageNumber = index + 1;
        const ext = partner.extractedData;
        const idData = ext?.partnerIdentification;
        const taxData = ext?.taxInformation;
        const isEditing = editingPartnerId === partner.id;

        const isIdExtractable = idData?.idExtractable !== false && Boolean(idData?.fullName || idData?.idNumber);
        const isTinExtractable = taxData?.tinExtractable !== false && Boolean(taxData?.tinNumber || taxData?.taxpayerName);

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
                {/* 1. Cover / Header */}
                <header className="border-b-2 border-slate-900 pb-3.5 mb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-blue-950 text-white rounded">
                          OFFICIAL CORPORATE DOSSIER
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase font-mono">
                          REF: CPP-{(partner.id.replace('partner-', '')).toUpperCase()}
                        </span>
                      </div>
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
                            className="w-full text-xl sm:text-2xl md:text-3xl font-serif font-bold text-slate-950 border-b-2 border-blue-500 bg-blue-50/20 px-1 py-0.5 rounded focus:outline-none focus:bg-white"
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
                            className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-slate-950 tracking-tight leading-tight bg-transparent hover:bg-slate-50 focus:bg-white px-1 -mx-1 py-0.5 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition w-full max-w-[580px]"
                          />
                          <span
                            className="no-print opacity-0 group-hover:opacity-100 transition text-slate-400 text-xs flex items-center gap-1 shrink-0 pointer-events-none"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-[10px] text-slate-500">Edit Title</span>
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                        {isEditing && editFormData ? (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500">Date:</span>
                            <input
                              type="text"
                              value={editFormData.generatedDate}
                              onChange={(e) =>
                                setEditFormData({ ...editFormData, generatedDate: e.target.value })
                              }
                              className="px-1.5 py-0.5 border border-blue-400 bg-blue-50/30 rounded text-xs text-slate-900 font-medium"
                            />
                          </div>
                        ) : (
                          <span>Date: {partner.generatedDate}</span>
                        )}
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
                              <span>Auto-Fit All</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => startEditing(partner)}
                              className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded text-[11px] font-medium flex items-center gap-1 transition"
                              title="Edit all fields on this partner profile"
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
                </header>

                {/* 2. Partner Identification (from ID Front and ID Back) */}
                <section className="mb-4">
                  <div className="flex items-center gap-2 border-b border-slate-300 pb-1 mb-2.5">
                    <div className="w-5 h-5 rounded bg-blue-900 text-white flex items-center justify-center text-[10px] font-bold">
                      2
                    </div>
                    <h2 className="text-base font-serif font-bold text-slate-950">
                      Partner Identification
                    </h2>
                    <span className="text-[11px] text-slate-500 font-sans ml-auto">
                      (Extracted from ID Front &amp; ID Back)
                    </span>
                  </div>

                  {!isIdExtractable && !isEditing && (
                    <div className="mb-2 p-2 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded">
                      Information could not be extracted from the image.
                    </div>
                  )}

                  {/* Identification Details Table (with inline editing support) */}
                  <div className="overflow-x-auto border border-slate-300 rounded-sm mb-3">
                    <table className="w-full min-w-[460px] sm:min-w-0 text-left text-xs border-collapse">
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <th className="w-28 sm:w-36 bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                            Full Name
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
                              idData?.fullName || (isIdExtractable ? '—' : 'Information could not be extracted from the image.')
                            )}
                          </td>
                          <th className="w-24 sm:w-32 bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                            ID Number
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
                              idData?.idNumber || (isIdExtractable ? '—' : 'Information could not be extracted from the image.')
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
                              idData?.dateOfBirth || (isIdExtractable ? '—' : 'Information could not be extracted from the image.')
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
                              idData?.nationality || (isIdExtractable ? '—' : 'Information could not be extracted from the image.')
                            )}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <th className="bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                            Issue Date
                          </th>
                          <td className="px-3 py-1.5 text-slate-800">
                            {isEditing && editFormData ? (
                              <input
                                type="text"
                                value={editFormData.issueDate}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, issueDate: e.target.value })
                                }
                                className="w-full px-2 py-0.5 border border-blue-400 bg-blue-50/30 rounded text-xs"
                              />
                            ) : (
                              idData?.issueDate || (isIdExtractable ? '—' : 'Information could not be extracted from the image.')
                            )}
                          </td>
                          <th className="bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                            Expiry Date
                          </th>
                          <td className="px-3 py-1.5 text-slate-800 font-semibold">
                            {isEditing && editFormData ? (
                              <input
                                type="text"
                                value={editFormData.expiryDate}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, expiryDate: e.target.value })
                                }
                                className="w-full px-2 py-0.5 border border-blue-400 bg-blue-50/30 rounded text-xs font-semibold"
                              />
                            ) : (
                              idData?.expiryDate || (isIdExtractable ? '—' : 'Information could not be extracted from the image.')
                            )}
                          </td>
                        </tr>

                        {/* Visible Other Details */}
                        {isEditing && editFormData ? (
                          <tr>
                            <th className="bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider align-top">
                              Visible Details
                            </th>
                            <td colSpan={3} className="px-3 py-2 text-slate-800 text-[11px] space-y-1.5">
                              {editFormData.otherDetails.map((d, dIdx) => (
                                <div key={dIdx} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={d.label}
                                    placeholder="Label"
                                    onChange={(e) => {
                                      const updated = [...editFormData.otherDetails];
                                      updated[dIdx].label = e.target.value;
                                      setEditFormData({ ...editFormData, otherDetails: updated });
                                    }}
                                    className="w-1/3 px-2 py-0.5 border border-slate-300 rounded text-xs font-semibold"
                                  />
                                  <input
                                    type="text"
                                    value={d.value}
                                    placeholder="Value"
                                    onChange={(e) => {
                                      const updated = [...editFormData.otherDetails];
                                      updated[dIdx].value = e.target.value;
                                      setEditFormData({ ...editFormData, otherDetails: updated });
                                    }}
                                    className="flex-1 px-2 py-0.5 border border-slate-300 rounded text-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = editFormData.otherDetails.filter((_, i) => i !== dIdx);
                                      setEditFormData({ ...editFormData, otherDetails: updated });
                                    }}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditFormData({
                                    ...editFormData,
                                    otherDetails: [...editFormData.otherDetails, { label: 'New Field', value: '' }],
                                  });
                                }}
                                className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 mt-1"
                              >
                                <Plus className="w-3 h-3" />
                                Add Visible Field
                              </button>
                            </td>
                          </tr>
                        ) : (
                          idData?.otherDetails && idData.otherDetails.length > 0 && (
                            <tr>
                              <th className="bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider align-top">
                                Visible Details
                              </th>
                              <td colSpan={3} className="px-3 py-1.5 text-slate-800 text-[11px] leading-relaxed">
                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                  {idData.otherDetails.map((d, dIdx) => (
                                    <span key={dIdx}>
                                      <strong className="text-slate-700">{d.label}:</strong> {d.value}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Inserted ID Images: ID Front Image and ID Back Image */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 print:grid-cols-2 print:mb-2">
                    {/* ID Front */}
                    <div className="image-attachment-card avoid-break border border-slate-300 rounded p-2 bg-slate-50/70 flex flex-col justify-between print:p-1.5 print:break-inside-avoid print:page-break-inside-avoid">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                            Attached: ID Front Image
                          </span>
                          <span className="text-[9px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-mono font-bold">
                            ID-1 FORMAT (85:54)
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
                            className="group relative cursor-pointer rounded border border-slate-300 bg-white flex items-center justify-center w-full aspect-[85/54] max-h-56 print:aspect-[85/54] print:max-h-32 overflow-hidden print:overflow-visible transition hover:border-blue-500 shadow-2xs"
                          >
                            <img
                              src={partner.idFrontImage}
                              alt="ID Front Image"
                              className="w-full h-full object-contain object-center transition print:object-contain print:w-full print:h-auto print:max-h-32"
                            />
                            <div className="no-print absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-semibold gap-1">
                              <ZoomIn className="w-3.5 h-3.5" />
                              Click to View Full Window
                            </div>
                          </div>
                        ) : (
                          <label className="h-32 sm:h-36 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-500 text-[11px] cursor-pointer hover:border-blue-500 hover:bg-white transition p-2 text-center">
                            <Upload className="w-4 h-4 text-blue-600 mb-1" />
                            <span className="font-semibold text-slate-700">Attach ID Front Image</span>
                            <span className="text-[10px] text-slate-400">Opens crop window before upload</span>
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

                      {/* Image Action Controls: Scan, Auto-Fit, Crop & Replace */}
                      {partner.idFrontImage && (
                        <div className="no-print mt-2 flex flex-wrap items-center justify-between gap-1 pt-1.5 border-t border-slate-200 text-[10px]">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenAIScanner(partner, 'idFront')}
                              className="px-2 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded font-bold flex items-center gap-1 shadow-2xs transition"
                              title="Scan ID Front with AI and automatically resize"
                            >
                              <Sparkles className="w-3 h-3 text-amber-200" />
                              Scan &amp; Resize
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAutoResize(partner, 'idFront')}
                              disabled={isQuickAutoResizing === `${partner.id}-idFront`}
                              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-medium flex items-center gap-1 shadow-2xs transition"
                              title="Auto-Fit ID Card format without reducing quality"
                            >
                              {isQuickAutoResizing === `${partner.id}-idFront` ? (
                                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                              ) : (
                                <Maximize2 className="w-3 h-3 text-blue-600" />
                              )}
                              Auto-Fit
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenCropForCurrent(partner, 'idFrontImage', 'ID Front Image')
                              }
                              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-medium flex items-center gap-1 shadow-2xs transition"
                              title="Crop or rotate"
                            >
                              <Crop className="w-3 h-3 text-slate-600" />
                              Crop
                            </button>

                            <label className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded font-medium flex items-center gap-1 shadow-2xs cursor-pointer transition">
                              <RefreshCw className="w-3 h-3 text-slate-500" />
                              Replace
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
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ID Back */}
                    <div className="image-attachment-card avoid-break border border-slate-300 rounded p-2 bg-slate-50/70 flex flex-col justify-between print:p-1.5 print:break-inside-avoid print:page-break-inside-avoid">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                            Attached: ID Back Image
                          </span>
                          <span className="text-[9px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-mono font-bold">
                            ID-1 FORMAT (85:54)
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
                            className="group relative cursor-pointer rounded border border-slate-300 bg-white flex items-center justify-center w-full aspect-[85/54] max-h-56 print:aspect-[85/54] print:max-h-32 overflow-hidden print:overflow-visible transition hover:border-blue-500 shadow-2xs"
                          >
                            <img
                              src={partner.idBackImage}
                              alt="ID Back Image"
                              className="w-full h-full object-contain object-center transition print:object-contain print:w-full print:h-auto print:max-h-32"
                            />
                            <div className="no-print absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-semibold gap-1">
                              <ZoomIn className="w-3.5 h-3.5" />
                              Click to View Full Window
                            </div>
                          </div>
                        ) : (
                          <label className="h-32 sm:h-36 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-500 text-[11px] cursor-pointer hover:border-blue-500 hover:bg-white transition p-2 text-center">
                            <Upload className="w-4 h-4 text-blue-600 mb-1" />
                            <span className="font-semibold text-slate-700">Attach ID Back Image</span>
                            <span className="text-[10px] text-slate-400">Opens crop window before upload</span>
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

                      {/* Image Action Controls: Scan, Auto-Fit, Crop & Replace */}
                      {partner.idBackImage && (
                        <div className="no-print mt-2 flex flex-wrap items-center justify-between gap-1 pt-1.5 border-t border-slate-200 text-[10px]">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenAIScanner(partner, 'idBack')}
                              className="px-2 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded font-bold flex items-center gap-1 shadow-2xs transition"
                              title="Scan ID Back with AI and automatically resize"
                            >
                              <Sparkles className="w-3 h-3 text-amber-200" />
                              Scan &amp; Resize
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAutoResize(partner, 'idBack')}
                              disabled={isQuickAutoResizing === `${partner.id}-idBack`}
                              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-medium flex items-center gap-1 shadow-2xs transition"
                              title="Auto-Fit ID Card format without reducing quality"
                            >
                              {isQuickAutoResizing === `${partner.id}-idBack` ? (
                                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                              ) : (
                                <Maximize2 className="w-3 h-3 text-blue-600" />
                              )}
                              Auto-Fit
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenCropForCurrent(partner, 'idBackImage', 'ID Back Image')
                              }
                              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-medium flex items-center gap-1 shadow-2xs transition"
                              title="Crop or rotate"
                            >
                              <Crop className="w-3 h-3 text-slate-600" />
                              Crop
                            </button>

                            <label className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded font-medium flex items-center gap-1 shadow-2xs cursor-pointer transition">
                              <RefreshCw className="w-3 h-3 text-slate-500" />
                              Replace
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
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* 3. Tax Information (from TIN Certificate) */}
                <section className="mb-4">
                  <div className="flex items-center gap-2 border-b border-slate-300 pb-1 mb-2.5">
                    <div className="w-5 h-5 rounded bg-blue-900 text-white flex items-center justify-center text-[10px] font-bold">
                      3
                    </div>
                    <h2 className="text-base font-serif font-bold text-slate-950">
                      Tax Information
                    </h2>
                    <span className="text-[11px] text-slate-500 font-sans ml-auto">
                      (Extracted from TIN Certificate)
                    </span>
                  </div>

                  {!isTinExtractable && !isEditing && (
                    <div className="mb-2 p-2 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded">
                      Information could not be extracted from the image.
                    </div>
                  )}

                  {/* Tax Details Table (with inline editing support) */}
                  <div className="overflow-x-auto border border-slate-300 rounded-sm mb-3">
                    <table className="w-full min-w-[460px] sm:min-w-0 text-left text-xs border-collapse">
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <th className="w-28 sm:w-36 bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                            TIN Number
                          </th>
                          <td className="px-3 py-1.5 font-mono font-bold text-blue-950 text-sm">
                            {isEditing && editFormData ? (
                              <input
                                type="text"
                                value={editFormData.tinNumber}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, tinNumber: e.target.value })
                                }
                                className="w-full px-2 py-0.5 border border-blue-400 bg-blue-50/30 rounded font-mono font-bold text-sm"
                              />
                            ) : (
                              taxData?.tinNumber || (isTinExtractable ? '—' : 'Information could not be extracted from the image.')
                            )}
                          </td>
                          <th className="w-24 sm:w-32 bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                            Taxpayer Name
                          </th>
                          <td className="px-3 py-1.5 font-bold text-slate-900 text-xs">
                            {isEditing && editFormData ? (
                              <input
                                type="text"
                                value={editFormData.taxpayerName}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, taxpayerName: e.target.value })
                                }
                                className="w-full px-2 py-0.5 border border-blue-400 bg-blue-50/30 rounded font-bold text-xs"
                              />
                            ) : (
                              taxData?.taxpayerName || (isTinExtractable ? '—' : 'Information could not be extracted from the image.')
                            )}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <th className="bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                            Tax Office
                          </th>
                          <td className="px-3 py-1.5 text-slate-800">
                            {isEditing && editFormData ? (
                              <input
                                type="text"
                                value={editFormData.taxOffice}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, taxOffice: e.target.value })
                                }
                                className="w-full px-2 py-0.5 border border-blue-400 bg-blue-50/30 rounded text-xs"
                              />
                            ) : (
                              taxData?.taxOffice || (isTinExtractable ? '—' : 'Information could not be extracted from the image.')
                            )}
                          </td>
                          <th className="bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                            Registration Date
                          </th>
                          <td className="px-3 py-1.5 text-slate-800">
                            {isEditing && editFormData ? (
                              <input
                                type="text"
                                value={editFormData.registrationDate}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, registrationDate: e.target.value })
                                }
                                className="w-full px-2 py-0.5 border border-blue-400 bg-blue-50/30 rounded text-xs"
                              />
                            ) : (
                              taxData?.registrationDate || (isTinExtractable ? '—' : 'Information could not be extracted from the image.')
                            )}
                          </td>
                        </tr>

                        {/* Visible Other Tax Details */}
                        {isEditing && editFormData ? (
                          <tr>
                            <th className="bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider align-top">
                              Registration Notes
                            </th>
                            <td colSpan={3} className="px-3 py-2 text-slate-800 text-[11px] space-y-1.5">
                              {editFormData.otherTaxDetails.map((d, dIdx) => (
                                <div key={dIdx} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={d.label}
                                    placeholder="Label"
                                    onChange={(e) => {
                                      const updated = [...editFormData.otherTaxDetails];
                                      updated[dIdx].label = e.target.value;
                                      setEditFormData({ ...editFormData, otherTaxDetails: updated });
                                    }}
                                    className="w-1/3 px-2 py-0.5 border border-slate-300 rounded text-xs font-semibold"
                                  />
                                  <input
                                    type="text"
                                    value={d.value}
                                    placeholder="Value"
                                    onChange={(e) => {
                                      const updated = [...editFormData.otherTaxDetails];
                                      updated[dIdx].value = e.target.value;
                                      setEditFormData({ ...editFormData, otherTaxDetails: updated });
                                    }}
                                    className="flex-1 px-2 py-0.5 border border-slate-300 rounded text-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = editFormData.otherTaxDetails.filter((_, i) => i !== dIdx);
                                      setEditFormData({ ...editFormData, otherTaxDetails: updated });
                                    }}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditFormData({
                                    ...editFormData,
                                    otherTaxDetails: [...editFormData.otherTaxDetails, { label: 'Note', value: '' }],
                                  });
                                }}
                                className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 mt-1"
                              >
                                <Plus className="w-3 h-3" />
                                Add Registration Note
                              </button>
                            </td>
                          </tr>
                        ) : (
                          taxData?.otherDetails && taxData.otherDetails.length > 0 && (
                            <tr>
                              <th className="bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider align-top">
                                Registration Notes
                              </th>
                              <td colSpan={3} className="px-3 py-1.5 text-slate-800 text-[11px] leading-relaxed">
                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                  {taxData.otherDetails.map((d, dIdx) => (
                                    <span key={dIdx}>
                                      <strong className="text-slate-700">{d.label}:</strong> {d.value}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Inserted TIN Certificate Image */}
                  <div className="tin-certificate-container avoid-break border border-slate-300 rounded p-2.5 bg-slate-50/70 mb-4 print:mb-2 print:p-2 flex flex-col justify-between print:break-inside-avoid print:page-break-inside-avoid print:overflow-visible">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          Attached: GRA TIN Certificate Image
                        </span>
                        <span className="text-[9px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-mono font-bold">
                          GRA FORMAT (1.47:1)
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
                          className="group relative cursor-pointer rounded border border-slate-300 bg-white flex items-center justify-center w-full aspect-[94/64] max-h-[380px] print:aspect-auto print:max-h-[320px] print:h-auto overflow-hidden print:overflow-visible transition hover:border-blue-500 shadow-2xs"
                        >
                          <img
                            src={partner.tinCertificateImage}
                            alt="TIN Certificate Image"
                            className="w-full h-full object-contain object-center transition print:object-contain print:w-full print:h-auto print:max-h-[310px] print:block print:mx-auto"
                          />
                          <div className="no-print absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-semibold gap-1.5">
                            <ZoomIn className="w-4 h-4" />
                            Click to View Full Window
                          </div>
                        </div>
                      ) : (
                        <label className="h-60 sm:h-76 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-500 text-xs cursor-pointer hover:border-blue-500 hover:bg-white transition p-4 text-center">
                          <Upload className="w-6 h-6 text-blue-600 mb-2" />
                          <span className="font-bold text-slate-800 text-sm">Attach TIN Certificate Image</span>
                          <span className="text-xs text-slate-400 mt-1">
                            Opens crop &amp; adjustment window before uploading
                          </span>
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

                    {/* Image Action Controls: Scan, Auto-Fit, Crop & Replace */}
                    {partner.tinCertificateImage && (
                      <div className="no-print mt-2 flex flex-wrap items-center justify-between gap-1 pt-1.5 border-t border-slate-200 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenAIScanner(partner, 'tinCertificate')}
                            className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded font-bold flex items-center gap-1 shadow-2xs transition"
                            title="Scan TIN Certificate with AI and automatically resize"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                            Scan &amp; Resize
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAutoResize(partner, 'tinCertificate')}
                            disabled={isQuickAutoResizing === `${partner.id}-tinCertificate`}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-medium flex items-center gap-1 shadow-2xs transition"
                            title="Auto-Fit GRA Certificate landscape format without reducing quality"
                          >
                            {isQuickAutoResizing === `${partner.id}-tinCertificate` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            ) : (
                              <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            Auto-Fit
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenCropForCurrent(partner, 'tinCertificateImage', 'TIN Certificate')
                            }
                            className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-900 border border-slate-200 rounded font-medium flex items-center gap-1 shadow-2xs transition"
                            title="Crop, rotate, or adjust current TIN Certificate"
                          >
                            <Crop className="w-3.5 h-3.5 text-blue-600" />
                            Adjust / Crop
                          </button>

                          <label className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded font-medium flex items-center gap-1 shadow-2xs cursor-pointer transition">
                            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                            Replace
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
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* 4. Verification & 5. Attachments Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 print:grid-cols-2">
                  {/* 4. Verification */}
                  <section className="border border-slate-300 rounded p-3 bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 border-b border-slate-300 pb-1 mb-1.5">
                        <div className="w-4 h-4 rounded bg-blue-900 text-white flex items-center justify-center text-[9px] font-bold">
                          4
                        </div>
                        <h3 className="text-xs font-serif font-bold text-slate-900 uppercase tracking-wide">
                          Verification
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1 text-[11px] font-semibold text-slate-800">
                      <div className="flex items-baseline justify-between">
                        <span>Signature:</span>
                        {isEditing && editFormData ? (
                          <input
                            type="text"
                            value={editFormData.verificationSignatory || ''}
                            placeholder="Signatory Name / Title"
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                verificationSignatory: e.target.value,
                              })
                            }
                            className="flex-1 ml-2 px-1.5 py-0.5 border border-blue-400 bg-blue-50/30 rounded text-[11px]"
                          />
                        ) : (
                          <span className="flex-1 ml-2 border-b border-slate-800 text-right font-mono text-slate-900 font-bold">
                            {partner.verificationSignatory || 'Authorized Corporate Signatory'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span>Date:</span>
                        {isEditing && editFormData ? (
                          <input
                            type="text"
                            value={editFormData.verificationDate || ''}
                            placeholder="Date"
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                verificationDate: e.target.value,
                              })
                            }
                            className="flex-1 ml-2 px-1.5 py-0.5 border border-blue-400 bg-blue-50/30 rounded text-[11px]"
                          />
                        ) : (
                          <span className="flex-1 ml-2 border-b border-slate-800 text-right font-mono text-slate-900 font-bold">
                            {partner.verificationDate || partner.generatedDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* 5. Attachments Checklist */}
                  <section className="border border-slate-300 rounded p-3 bg-slate-50/50">
                    <div className="flex items-center gap-1.5 border-b border-slate-300 pb-1 mb-1.5">
                      <div className="w-4 h-4 rounded bg-blue-900 text-white flex items-center justify-center text-[9px] font-bold">
                        5
                      </div>
                      <h3 className="text-xs font-serif font-bold text-slate-900 uppercase tracking-wide">
                        Attachments Checklist
                      </h3>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-800 mt-2">
                      <li className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded bg-blue-900 text-white flex items-center justify-center">
                          <CheckSquare className="w-3 h-3" />
                        </div>
                        <span className="font-semibold text-[11px]">[x] ID Front</span>
                        <span className="text-[10px] text-emerald-700 font-medium ml-auto flex items-center gap-1">
                          {partner.idFrontImage ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Attached
                            </>
                          ) : (
                            'Missing'
                          )}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded bg-blue-900 text-white flex items-center justify-center">
                          <CheckSquare className="w-3 h-3" />
                        </div>
                        <span className="font-semibold text-[11px]">[x] ID Back</span>
                        <span className="text-[10px] text-emerald-700 font-medium ml-auto flex items-center gap-1">
                          {partner.idBackImage ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Attached
                            </>
                          ) : (
                            'Missing'
                          )}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded bg-blue-900 text-white flex items-center justify-center">
                          <CheckSquare className="w-3 h-3" />
                        </div>
                        <span className="font-semibold text-[11px]">[x] TIN Certificate</span>
                        <span className="text-[10px] text-emerald-700 font-medium ml-auto flex items-center gap-1">
                          {partner.tinCertificateImage ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Attached
                            </>
                          ) : (
                            'Missing'
                          )}
                        </span>
                      </li>
                    </ul>
                  </section>
                </div>
              </div>

              {/* Document Footer (Required on every page: Confidential – Internal Use Only. + Page numbers) */}
              <footer className="pt-3 mt-2 border-t border-slate-300 text-slate-600 text-xs flex flex-row justify-between items-center shrink-0">
                <span className="font-bold tracking-wider text-slate-700 uppercase text-[10px]">
                  Confidential – Internal Use Only.
                </span>
                <span className="font-mono text-slate-600 font-semibold text-[10px]">
                  Page {pageNumber} of {totalPages}
                </span>
              </footer>
            </div>
          </article>
        );
      })}

      {/* Quick Add Profile Button in Document View */}
      {onAddPartner && (
        <div className="no-print w-full max-w-[840px] flex items-center justify-center p-5 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50/20 transition shadow-xs">
          <button
            type="button"
            onClick={onAddPartner}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Another Partner Profile
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
                  onClick={() => setLightboxZoom((prev) => Math.max(0.5, parseFloat((prev - 0.2).toFixed(1))))}
                  className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono w-12 text-center text-slate-200 font-semibold">
                  {Math.round(lightboxZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setLightboxZoom((prev) => Math.min(3, parseFloat((prev + 0.2).toFixed(1))))}
                  className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <div className="w-px h-4 bg-slate-700 mx-1" />

                <button
                  type="button"
                  onClick={() => setLightboxRotation((prev) => (prev + 90) % 360)}
                  className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px]"
                  title="Rotate 90 degrees"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{lightboxRotation !== 0 ? `${lightboxRotation}°` : 'Rotate'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLightboxZoom(1);
                    setLightboxRotation(0);
                    setLightboxFitMode(lightboxFitMode === 'fill' ? 'fit' : 'fill');
                  }}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                    lightboxFitMode === 'fill'
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-700 text-slate-300'
                  }`}
                  title="Toggle Fill Window vs Fit Entire"
                >
                  {lightboxFitMode === 'fill' ? 'Fill Window' : 'Fit Entire'}
                </button>
              </div>

              {/* Right controls: AI Scan, Download & Close */}
              <div className="flex items-center gap-2">
                {lightboxImage.slot && lightboxImage.partnerId && (
                  <button
                    type="button"
                    onClick={() => {
                      const p = partners.find((item) => item.id === lightboxImage.partnerId);
                      if (p && lightboxImage.slot) {
                        handleOpenAIScanner(p, lightboxImage.slot);
                        setLightboxImage(null);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-xs transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>AI Scan &amp; Auto-Resize</span>
                  </button>
                )}

                <a
                  href={lightboxImage.src}
                  download={`${lightboxImage.title.replace(/\s+/g, '-')}.png`}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Download full resolution image"
                >
                  <Download className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setLightboxImage(null);
                    setLightboxZoom(1);
                    setLightboxRotation(0);
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Interactive Viewing Area */}
            <div className="flex-1 bg-slate-950 flex items-center justify-center overflow-auto p-4 relative select-none">
              <div
                className="transition-transform duration-150 ease-out flex items-center justify-center"
                style={{
                  transform: `scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`,
                }}
              >
                <img
                  src={lightboxImage.src}
                  alt={lightboxImage.title}
                  className={`rounded shadow-2xl bg-white border border-slate-700 ${
                    lightboxFitMode === 'fill'
                      ? 'w-[90vw] h-[82vh] object-cover'
                      : 'max-w-[90vw] max-h-[82vh] object-contain'
                  }`}
                  style={{ imageRendering: 'auto' }}
                />
              </div>
            </div>

            {/* Bottom Info Bar */}
            <div className="px-5 py-2.5 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400 shrink-0">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Preserved at Full Resolution
                </span>
                <span>• Use controls above to zoom, rotate, or fill the window</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLightboxImage(null);
                  setLightboxZoom(1);
                  setLightboxRotation(0);
                }}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive AI Document Scanner & Auto-Resizer Modal */}
      {scannerModal && scannerModal.isOpen && (
        <DocumentScannerModal
          isOpen={scannerModal.isOpen}
          partner={scannerModal.partner}
          targetSlot={scannerModal.targetSlot}
          initialImageSrc={scannerModal.initialImageSrc}
          onClose={() => setScannerModal(null)}
          onApply={handleApplyScannerResult}
        />
      )}

      {/* Interactive Crop & Adjustment Modal before upload and replacement */}
      {cropModal && cropModal.isOpen && (
        <ImageCropModal
          isOpen={cropModal.isOpen}
          imageSrc={cropModal.imageSrc}
          currentAttachmentSrc={cropModal.currentAttachmentSrc}
          title={cropModal.title}
          attachmentType={cropModal.attachmentType}
          onConfirm={(croppedUrl) => {
            if (onUpdatePartner) {
              onUpdatePartner(cropModal.partnerId, {
                [cropModal.attachmentKey]: croppedUrl,
              });
            }
            setCropModal(null);
          }}
          onCancel={() => setCropModal(null)}
        />
      )}
    </div>
  );
};
