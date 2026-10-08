export interface VisibleDetail {
  label: string;
  value: string;
}

export interface PartnerIdentificationData {
  fullName: string | null;
  idNumber: string | null;
  dateOfBirth: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  nationality: string | null;
  otherDetails: VisibleDetail[];
  idExtractable: boolean;
  idExtractionNote?: string | null;
}

export interface TaxInformationData {
  tinNumber: string | null;
  taxpayerName: string | null;
  taxOffice: string | null;
  registrationDate: string | null;
  otherDetails: VisibleDetail[];
  tinExtractable: boolean;
  tinExtractionNote?: string | null;
}

export interface ExtractedProfileData {
  partnerIdentification: PartnerIdentificationData;
  taxInformation: TaxInformationData;
}

export interface PartnerRecord {
  id: string;
  name: string;
  documentTitle?: string; // Custom editable title e.g. "Company Partner Profile"
  idFrontImage: string | null; // data URL or base64
  idBackImage: string | null;
  tinCertificateImage: string | null;
  status: 'empty' | 'ready_to_extract' | 'extracting' | 'extracted' | 'error';
  errorMessage?: string;
  extractedData?: ExtractedProfileData;
  generatedDate: string;
  verificationSignatory?: string;
  verificationDate?: string;
}
