export interface VisibleDetail {
  label: string;
  value: string;
}

export type PersonnelCategory =
  | 'executive_partner'
  | 'permanent_employee'
  | 'contract_staff'
  | 'subcontractor'
  | 'casual_intern';

export type EmploymentStatus =
  | 'active'
  | 'onboarding'
  | 'probation'
  | 'pending_clearance'
  | 'verified';

export interface BankRemittanceInfo {
  bankName: string;
  accountName: string;
  accountNumber: string;
  sortCodeOrBranch?: string;
  swiftOrIban?: string;
  currency: string;
  paymentMode: 'Direct Deposit / ACH' | 'Electronic Wire Transfer' | 'Corporate Cheque' | 'Milestone Disbursement';
}

export interface CompensationStructure {
  rateType: 'Monthly Salary' | 'Daily Rate' | 'Hourly Rate' | 'Milestone Contract Fee' | 'Retainer';
  amount: number;
  currency: string;
  withholdingTaxPct: number; // e.g. 0% for employee PAYE, 5% or 10% for subcontractor WHT
  paymentTerms: string; // e.g. "Monthly (28th of every month)", "Net 15 Days after Invoice", "Milestone Completion"
  pensionPin?: string;
  socialSecurityNo?: string;
}

export interface HRComplianceRecord {
  staffIdOrCode: string;
  dateOfEngagement: string;
  contractEndDate?: string; // empty/indefinite for permanent
  reportingSupervisor: string;
  workLocation: string;
  emergencyContact: {
    fullName: string;
    relationship: string;
    phoneNumber: string;
    address?: string;
  };
  hrClearanceStatus: 'Fully Cleared' | 'Pending Documents' | 'Under Review';
  backgroundCheckVerified: boolean;
  signedAgreementOnRecord: boolean;
  medicalFitnessVerified?: boolean;
  hrOfficerSignatory: string;
  hrSignDate: string;
}

export interface AccountsComplianceRecord {
  vendorOrTaxIdCode: string;
  tinNumber: string;
  taxOffice: string;
  taxRegistrationDate: string;
  taxComplianceStatus:
    | 'Registered Active Taxpayer'
    | 'Tax Clearance Certified'
    | 'Withholding Tax Compliant'
    | 'Pending Registration';
  withholdingTaxCertificateNo?: string;
  bankDetails: BankRemittanceInfo;
  compensation: CompensationStructure;
  accountsControllerSignatory: string;
  accountsSignDate: string;
  accountsClearanceStatus: 'Billing Approved' | 'Payroll Active' | 'Pending Tax Review' | 'Payment On Hold';
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
  category: PersonnelCategory;
  department: string;
  designation: string;
  documentTitle?: string; // Custom editable title e.g. "Company Profiles"
  
  // Attached Document Scans
  idFrontImage: string | null;
  idBackImage: string | null;
  tinCertificateImage: string | null;
  contractOrAgreementImage?: string | null;
  bankVerificationImage?: string | null;

  status: 'empty' | 'ready_to_extract' | 'extracting' | 'extracted' | 'error';
  errorMessage?: string;
  extractedData?: ExtractedProfileData;
  generatedDate: string;

  // HR Specific Dossier Data
  hrDetails?: HRComplianceRecord;

  // Accounts & Payroll Specific Dossier Data
  accountsDetails?: AccountsComplianceRecord;

  // Verification & Signatures
  verificationSignatory?: string;
  verificationDate?: string;
}

export const CATEGORY_LABELS: Record<PersonnelCategory, string> = {
  executive_partner: 'Executive & Partner',
  permanent_employee: 'Permanent Employee',
  contract_staff: 'Contract Staff',
  subcontractor: 'Subcontractor / Trade Vendor',
  casual_intern: 'Casual / Trainee / Intern',
};

export const CATEGORY_BADGE_STYLES: Record<PersonnelCategory, { bg: string; text: string; border: string }> = {
  executive_partner: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  permanent_employee: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  contract_staff: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  subcontractor: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  casual_intern: { bg: 'bg-slate-50', text: 'text-slate-800', border: 'border-slate-200' },
};
