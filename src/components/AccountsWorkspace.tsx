import React, { useState } from 'react';
import { PartnerRecord, PersonnelCategory, CATEGORY_LABELS, CATEGORY_BADGE_STYLES } from '../types';
import {
  CreditCard,
  DollarSign,
  Building,
  CheckCircle2,
  Clock,
  Search,
  Download,
  Plus,
  FileText,
  Edit2,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  Landmark,
} from 'lucide-react';

interface AccountsWorkspaceProps {
  partners: PartnerRecord[];
  onSelectPartner: (id: string) => void;
  onUpdatePartner: (id: string, updates: Partial<PartnerRecord>) => void;
  onOpenAddModal: (categoryPreset?: PersonnelCategory) => void;
}

export const AccountsWorkspace: React.FC<AccountsWorkspaceProps> = ({
  partners,
  onSelectPartner,
  onUpdatePartner,
  onOpenAddModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [billingFilter, setBillingFilter] = useState<string>('all');
  const [editingPartner, setEditingPartner] = useState<PartnerRecord | null>(null);

  // Financial Metrics
  const totalPayees = partners.length;
  const registeredTinCount = partners.filter(
    (p) => p.accountsDetails?.tinNumber || p.extractedData?.taxInformation?.tinNumber
  ).length;
  const subcontractorCount = partners.filter((p) => p.category === 'subcontractor').length;
  const approvedBillingCount = partners.filter(
    (p) =>
      p.accountsDetails?.accountsClearanceStatus === 'Billing Approved' ||
      p.accountsDetails?.accountsClearanceStatus === 'Payroll Active'
  ).length;

  const totalMonthlyCommitment = partners.reduce((sum, p) => {
    const amt = p.accountsDetails?.compensation?.amount || 0;
    return sum + amt;
  }, 0);

  const filteredPartners = partners.filter((p) => {
    const tin = p.accountsDetails?.tinNumber || p.extractedData?.taxInformation?.tinNumber || '';
    const bank = p.accountsDetails?.bankDetails?.bankName || '';
    const acc = p.accountsDetails?.bankDetails?.accountNumber || '';

    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.accountsDetails?.vendorOrTaxIdCode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || p.category === categoryFilter;

    const matchesBilling =
      billingFilter === 'all' ||
      (billingFilter === 'approved' &&
        (p.accountsDetails?.accountsClearanceStatus === 'Billing Approved' ||
          p.accountsDetails?.accountsClearanceStatus === 'Payroll Active')) ||
      (billingFilter === 'pending' &&
        p.accountsDetails?.accountsClearanceStatus !== 'Billing Approved' &&
        p.accountsDetails?.accountsClearanceStatus !== 'Payroll Active');

    return matchesSearch && matchesCategory && matchesBilling;
  });

  const handleToggleBillingApproval = (partner: PartnerRecord) => {
    const current = partner.accountsDetails?.accountsClearanceStatus;
    const isApproved = current === 'Billing Approved' || current === 'Payroll Active';
    const nextStatus = isApproved ? 'Pending Tax Review' : partner.category === 'subcontractor' ? 'Billing Approved' : 'Payroll Active';

    onUpdatePartner(partner.id, {
      accountsDetails: {
        ...(partner.accountsDetails || {
          vendorOrTaxIdCode: `VEND-${Date.now().toString().slice(-4)}`,
          tinNumber: partner.extractedData?.taxInformation?.tinNumber || 'Attached',
          taxOffice: 'KANIFING',
          taxRegistrationDate: partner.generatedDate,
          taxComplianceStatus: 'Registered Active Taxpayer',
          bankDetails: {
            bankName: 'Trust Bank Gambia Ltd',
            accountName: partner.name,
            accountNumber: '011000000000',
            currency: 'GMD',
            paymentMode: 'Direct Deposit / ACH',
          },
          compensation: {
            rateType: 'Monthly Salary',
            amount: 50000,
            currency: 'GMD',
            withholdingTaxPct: partner.category === 'subcontractor' ? 10 : 0,
            paymentTerms: 'Monthly Payroll',
          },
          accountsControllerSignatory: 'Financial Controller',
          accountsSignDate: partner.generatedDate,
        }),
        accountsClearanceStatus: nextStatus,
      },
    });
  };

  const handleExportAccountsCsv = () => {
    const headers = [
      'Vendor/Staff Code',
      'Payee Name',
      'Category',
      'TIN Number',
      'Tax Office',
      'Tax Compliance Status',
      'Bank Name',
      'Account Title',
      'Account Number',
      'Payment Mode',
      'Rate Type',
      'Amount',
      'Currency',
      'Withholding Tax (WHT %)',
      'Payment Terms',
      'Accounts Clearance Status',
    ];

    const rows = partners.map((p) => [
      `"${p.accountsDetails?.vendorOrTaxIdCode || p.hrDetails?.staffIdOrCode || 'N/A'}"`,
      `"${p.name}"`,
      `"${CATEGORY_LABELS[p.category] || p.category}"`,
      `"${p.accountsDetails?.tinNumber || p.extractedData?.taxInformation?.tinNumber || 'N/A'}"`,
      `"${p.accountsDetails?.taxOffice || p.extractedData?.taxInformation?.taxOffice || 'N/A'}"`,
      `"${p.accountsDetails?.taxComplianceStatus || 'Registered Active Taxpayer'}"`,
      `"${p.accountsDetails?.bankDetails?.bankName || 'N/A'}"`,
      `"${p.accountsDetails?.bankDetails?.accountName || p.name}"`,
      `"${p.accountsDetails?.bankDetails?.accountNumber || 'N/A'}"`,
      `"${p.accountsDetails?.bankDetails?.paymentMode || 'Direct Deposit'}"`,
      `"${p.accountsDetails?.compensation?.rateType || 'Monthly Salary'}"`,
      `"${p.accountsDetails?.compensation?.amount || 0}"`,
      `"${p.accountsDetails?.compensation?.currency || 'GMD'}"`,
      `"${p.accountsDetails?.compensation?.withholdingTaxPct ?? (p.category === 'subcontractor' ? 10 : 0)}%"`,
      `"${p.accountsDetails?.compensation?.paymentTerms || 'Standard Terms'}"`,
      `"${p.accountsDetails?.accountsClearanceStatus || 'Payroll Active'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Accounts_Disbursement_Schedule_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6">
      {/* Accounts & Finance Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-blue-400">
              <Landmark className="w-4 h-4" />
              <span>APEX INFRASTRUCTURE &amp; ENTERPRISE GROUP</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight text-white">
              Finance &amp; Accounts Department · Disbursement &amp; Tax Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Taxpayer Identification Number (TIN) verification, Withholding Tax (WHT) compliance, bank remittance mandates, and subcontractor payments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportAccountsCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Disbursement Schedule (CSV)
            </button>
            <button
              type="button"
              onClick={() => onOpenAddModal('subcontractor')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Profile Subcontractor / Payee
            </button>
          </div>
        </div>

        {/* 5-Metric Quick Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4 pt-1">
          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-400">Total Active Payees</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">{totalPayees}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Staff &amp; Subcontractors</div>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
            <div className="text-[11px] font-medium text-emerald-400">Monthly Commitment</div>
            <div className="text-lg sm:text-xl font-bold text-white mt-0.5">
              GMD {totalMonthlyCommitment.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Base payroll &amp; retainers</div>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
            <div className="text-[11px] font-medium text-blue-400">GRA Registered TINs</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">
              {registeredTinCount}/{totalPayees}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">100% Tax Documented</div>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
            <div className="text-[11px] font-medium text-purple-400">Subcontractor WHT</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">{subcontractorCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">5% - 10% Withholding applied</div>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-medium text-amber-400">Payment Clearance</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">
              {approvedBillingCount}/{totalPayees}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              {Math.round((approvedBillingCount / (totalPayees || 1)) * 100)}% Cleared to Disburse
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Payee Name, TIN Number, Bank, or Account Number..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Payees ({totalPayees})</option>
              <option value="subcontractor">Subcontractors &amp; Vendors ({subcontractorCount})</option>
              <option value="permanent_employee">Permanent Employees</option>
              <option value="contract_staff">Contract Staff</option>
              <option value="executive_partner">Executive Partners</option>
            </select>

            <select
              value={billingFilter}
              onChange={(e) => setBillingFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Disbursement: All</option>
              <option value="approved">Approved &amp; Active</option>
              <option value="pending">Pending Tax Review</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pill Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap mr-1">Quick view:</span>
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Accounts ({totalPayees})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('subcontractor')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
              categoryFilter === 'subcontractor'
                ? 'bg-purple-700 text-white'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
            }`}
          >
            Subcontractors ({subcontractorCount})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('permanent_employee')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
              categoryFilter === 'permanent_employee'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Employees (PAYE)
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('executive_partner')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
              categoryFilter === 'executive_partner'
                ? 'bg-amber-700 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Executive Draws
          </button>
        </div>
      </div>

      {/* Accounts & Remittance Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3.5">Vendor / Payee Code</th>
                <th className="py-3 px-3.5">Payee Name &amp; Category</th>
                <th className="py-3 px-3.5">TIN &amp; Tax Office</th>
                <th className="py-3 px-3.5">Bank &amp; Account Number</th>
                <th className="py-3 px-3.5">Remittance / Rate</th>
                <th className="py-3 px-3.5">Tax (WHT / PAYE)</th>
                <th className="py-3 px-3.5 text-center">Billing Approval</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No accounts records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPartners.map((partner) => {
                  const tin =
                    partner.accountsDetails?.tinNumber ||
                    partner.extractedData?.taxInformation?.tinNumber ||
                    'Pending';
                  const taxOffice =
                    partner.accountsDetails?.taxOffice ||
                    partner.extractedData?.taxInformation?.taxOffice ||
                    'Kanifing';
                  const bank = partner.accountsDetails?.bankDetails;
                  const comp = partner.accountsDetails?.compensation;
                  const isApproved =
                    partner.accountsDetails?.accountsClearanceStatus === 'Billing Approved' ||
                    partner.accountsDetails?.accountsClearanceStatus === 'Payroll Active';
                  const badge = CATEGORY_BADGE_STYLES[partner.category] || CATEGORY_BADGE_STYLES.permanent_employee;
                  const whtPct =
                    comp?.withholdingTaxPct ??
                    (partner.category === 'subcontractor' ? 10 : 0);

                  return (
                    <tr
                      key={partner.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Code */}
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {partner.accountsDetails?.vendorOrTaxIdCode ||
                          partner.hrDetails?.staffIdOrCode || (
                            <span className="text-slate-400 italic">PAYE-{partner.id.slice(-4)}</span>
                          )}
                      </td>

                      {/* Payee Name & Category */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{partner.name}</div>
                        <div className="mt-0.5">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {CATEGORY_LABELS[partner.category] || partner.category}
                          </span>
                        </div>
                      </td>

                      {/* TIN & Tax Office */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-blue-900">{tin}</div>
                        <div className="text-[11px] text-slate-500">
                          {taxOffice} Division · GRA
                        </div>
                      </td>

                      {/* Bank Details */}
                      <td className="py-3 px-3.5 max-w-[200px]">
                        <div className="font-semibold text-slate-900 truncate">
                          {bank?.bankName || 'Trust Bank Gambia Ltd'}
                        </div>
                        <div className="font-mono text-[11px] text-slate-600 truncate">
                          {bank?.accountNumber || 'Pending Account Input'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Mode: {bank?.paymentMode || 'Direct Deposit / ACH'}
                        </div>
                      </td>

                      {/* Remittance Amount & Terms */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">
                          {comp?.currency || 'GMD'} {(comp?.amount || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {comp?.rateType || 'Monthly Salary'}
                        </div>
                      </td>

                      {/* Withholding Tax (WHT) / PAYE */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {whtPct > 0 ? (
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                              {whtPct}% WHT
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              GRA Withholding Remittance
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                              PAYE Tax
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Standard Payroll Withholding
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Billing Status */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleBillingApproval(partner)}
                          title="Click to toggle Accounts billing clearance status"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          {isApproved ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Approved
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              Review Tax
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectPartner(partner.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded font-medium text-xs transition"
                          >
                            <FileText className="w-3 h-3" />
                            Dossier
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPartner(partner)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs transition"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Accounts & Remittance Modal */}
      {editingPartner && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Edit Accounts &amp; Tax Record · {editingPartner.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Update bank deposit details, tax identification (TIN), compensation structure, and withholding tax rate.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPartner(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const fd = new FormData(form);

                onUpdatePartner(editingPartner.id, {
                  accountsDetails: {
                    ...(editingPartner.accountsDetails || {
                      vendorOrTaxIdCode: '',
                      tinNumber: '',
                      taxOffice: 'KANIFING',
                      taxRegistrationDate: editingPartner.generatedDate,
                      taxComplianceStatus: 'Registered Active Taxpayer',
                      accountsControllerSignatory: 'Financial Controller',
                      accountsSignDate: editingPartner.generatedDate,
                      accountsClearanceStatus: 'Billing Approved',
                    }),
                    vendorOrTaxIdCode: fd.get('vendorOrTaxIdCode') as string,
                    tinNumber: fd.get('tinNumber') as string,
                    taxOffice: fd.get('taxOffice') as string,
                    taxComplianceStatus: fd.get('taxComplianceStatus') as any,
                    accountsClearanceStatus: fd.get('accountsClearanceStatus') as any,
                    bankDetails: {
                      bankName: fd.get('bankName') as string,
                      accountName: fd.get('accountName') as string,
                      accountNumber: fd.get('accountNumber') as string,
                      sortCodeOrBranch: fd.get('sortCodeOrBranch') as string,
                      swiftOrIban: fd.get('swiftOrIban') as string,
                      currency: fd.get('currency') as string,
                      paymentMode: fd.get('paymentMode') as any,
                    },
                    compensation: {
                      rateType: fd.get('rateType') as any,
                      amount: Number(fd.get('amount') || 0),
                      currency: fd.get('currency') as string,
                      withholdingTaxPct: Number(fd.get('withholdingTaxPct') || 0),
                      paymentTerms: fd.get('paymentTerms') as string,
                      pensionPin: fd.get('pensionPin') as string,
                      socialSecurityNo: fd.get('socialSecurityNo') as string,
                    },
                  },
                });

                setEditingPartner(null);
              }}
              className="p-4 sm:p-5 space-y-4 text-xs"
            >
              {/* Taxation Header */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Receipt className="w-3.5 h-3.5 text-blue-700" />
                  Taxation &amp; GRA Registration
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      TIN Number
                    </label>
                    <input
                      type="text"
                      name="tinNumber"
                      defaultValue={
                        editingPartner.accountsDetails?.tinNumber ||
                        editingPartner.extractedData?.taxInformation?.tinNumber ||
                        ''
                      }
                      placeholder="e.g. 2000402822"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Tax Office / Jurisdiction
                    </label>
                    <input
                      type="text"
                      name="taxOffice"
                      defaultValue={
                        editingPartner.accountsDetails?.taxOffice ||
                        editingPartner.extractedData?.taxInformation?.taxOffice ||
                        'KANIFING'
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Tax Compliance Status
                    </label>
                    <select
                      name="taxComplianceStatus"
                      defaultValue={
                        editingPartner.accountsDetails?.taxComplianceStatus ||
                        'Tax Clearance Certified'
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    >
                      <option value="Tax Clearance Certified">Tax Clearance Certified</option>
                      <option value="Registered Active Taxpayer">Registered Active Taxpayer</option>
                      <option value="Withholding Tax Compliant">Withholding Tax Compliant</option>
                      <option value="Pending Registration">Pending Registration</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Banking & Remittance */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                  Banking &amp; Remittance Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      defaultValue={
                        editingPartner.accountsDetails?.bankDetails?.bankName ||
                        'Trust Bank Gambia Ltd'
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Account Title / Beneficiary
                    </label>
                    <input
                      type="text"
                      name="accountName"
                      defaultValue={
                        editingPartner.accountsDetails?.bankDetails?.accountName ||
                        editingPartner.name
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Account Number / IBAN
                    </label>
                    <input
                      type="text"
                      name="accountNumber"
                      defaultValue={
                        editingPartner.accountsDetails?.bankDetails?.accountNumber ||
                        ''
                      }
                      placeholder="e.g. 011002938101"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Branch / Sort Code
                    </label>
                    <input
                      type="text"
                      name="sortCodeOrBranch"
                      defaultValue={
                        editingPartner.accountsDetails?.bankDetails?.sortCodeOrBranch ||
                        'Banjul Main'
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Disbursement Mode
                    </label>
                    <select
                      name="paymentMode"
                      defaultValue={
                        editingPartner.accountsDetails?.bankDetails?.paymentMode ||
                        'Direct Deposit / ACH'
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    >
                      <option value="Direct Deposit / ACH">Direct Deposit / ACH</option>
                      <option value="Electronic Wire Transfer">Electronic Wire Transfer</option>
                      <option value="Milestone Disbursement">Milestone Disbursement</option>
                      <option value="Corporate Cheque">Corporate Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Currency
                    </label>
                    <input
                      type="text"
                      name="currency"
                      defaultValue={
                        editingPartner.accountsDetails?.compensation?.currency || 'GMD'
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Compensation & WHT */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                  <DollarSign className="w-3.5 h-3.5 text-amber-700" />
                  Compensation &amp; Withholding Tax Structure
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Rate Type
                    </label>
                    <select
                      name="rateType"
                      defaultValue={
                        editingPartner.accountsDetails?.compensation?.rateType ||
                        'Monthly Salary'
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    >
                      <option value="Monthly Salary">Monthly Salary</option>
                      <option value="Milestone Contract Fee">Milestone Contract Fee</option>
                      <option value="Daily Rate">Daily Rate</option>
                      <option value="Retainer">Retainer</option>
                      <option value="Hourly Rate">Hourly Rate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Rate / Amount
                    </label>
                    <input
                      type="number"
                      name="amount"
                      defaultValue={
                        editingPartner.accountsDetails?.compensation?.amount || 50000
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Withholding Tax % (WHT)
                    </label>
                    <select
                      name="withholdingTaxPct"
                      defaultValue={
                        editingPartner.accountsDetails?.compensation?.withholdingTaxPct ??
                        (editingPartner.category === 'subcontractor' ? 10 : 0)
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                    >
                      <option value={0}>0% (Standard Employee PAYE)</option>
                      <option value={5}>5% (Equipment / Building Works WHT)</option>
                      <option value={10}>10% (General Services / Subcontractor WHT)</option>
                      <option value={15}>15% (Professional Consultancy WHT)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Payment Terms / Invoicing Schedule
                    </label>
                    <input
                      type="text"
                      name="paymentTerms"
                      defaultValue={
                        editingPartner.accountsDetails?.compensation?.paymentTerms ||
                        'Net 15 Days after Invoice'
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Clearance Status */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Accounts &amp; Payment Clearance Status
                </label>
                <select
                  name="accountsClearanceStatus"
                  defaultValue={
                    editingPartner.accountsDetails?.accountsClearanceStatus ||
                    'Billing Approved'
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="Billing Approved">Billing Approved (Authorized for Disbursement)</option>
                  <option value="Payroll Active">Payroll Active (Included in Monthly Direct ACH)</option>
                  <option value="Pending Tax Review">Pending Tax Review (Verify TIN / WHT Certificate)</option>
                  <option value="Payment On Hold">Payment On Hold</option>
                </select>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingPartner(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-sm transition"
                >
                  Save Accounts Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
