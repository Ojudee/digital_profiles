import React, { useState } from 'react';
import { PartnerRecord, PersonnelCategory, CATEGORY_LABELS, CATEGORY_BADGE_STYLES } from '../types';
import {
  Users,
  UserCheck,
  ShieldAlert,
  Search,
  Filter,
  Eye,
  Edit2,
  FileText,
  Phone,
  User,
  Building,
  CheckCircle2,
  Clock,
  Download,
  Plus,
} from 'lucide-react';

interface HRWorkspaceProps {
  partners: PartnerRecord[];
  onSelectPartner: (id: string) => void;
  onUpdatePartner: (id: string, updates: Partial<PartnerRecord>) => void;
  onOpenAddModal: (categoryPreset?: PersonnelCategory) => void;
}

export const HRWorkspace: React.FC<HRWorkspaceProps> = ({
  partners,
  onSelectPartner,
  onUpdatePartner,
  onOpenAddModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [clearanceFilter, setClearanceFilter] = useState<string>('all');
  const [editingPartner, setEditingPartner] = useState<PartnerRecord | null>(null);

  // Metrics
  const totalCount = partners.length;
  const permanentCount = partners.filter((p) => p.category === 'permanent_employee').length;
  const contractCount = partners.filter((p) => p.category === 'contract_staff').length;
  const subcontractorCount = partners.filter((p) => p.category === 'subcontractor').length;
  const execCount = partners.filter((p) => p.category === 'executive_partner').length;
  const clearedCount = partners.filter(
    (p) => p.hrDetails?.hrClearanceStatus === 'Fully Cleared' || p.status === 'extracted'
  ).length;

  const filteredPartners = partners.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.hrDetails?.staffIdOrCode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || p.category === categoryFilter;

    const matchesClearance =
      clearanceFilter === 'all' ||
      (clearanceFilter === 'cleared' && p.hrDetails?.hrClearanceStatus === 'Fully Cleared') ||
      (clearanceFilter === 'pending' && p.hrDetails?.hrClearanceStatus !== 'Fully Cleared');

    return matchesSearch && matchesCategory && matchesClearance;
  });

  const handleToggleClearance = (partner: PartnerRecord) => {
    const current = partner.hrDetails?.hrClearanceStatus;
    const nextStatus = current === 'Fully Cleared' ? 'Pending Documents' : 'Fully Cleared';
    onUpdatePartner(partner.id, {
      hrDetails: {
        ...(partner.hrDetails || {
          staffIdOrCode: `EMP-${Date.now().toString().slice(-4)}`,
          dateOfEngagement: partner.generatedDate,
          reportingSupervisor: 'Executive Board',
          workLocation: 'Main Office',
          emergencyContact: { fullName: '', relationship: '', phoneNumber: '' },
          backgroundCheckVerified: true,
          signedAgreementOnRecord: true,
          hrOfficerSignatory: 'Head of Human Resources',
          hrSignDate: partner.generatedDate,
        }),
        hrClearanceStatus: nextStatus,
      },
    });
  };

  const handleExportCsv = () => {
    const headers = [
      'Staff/Vendor ID',
      'Full Name',
      'Category',
      'Department',
      'Designation',
      'Engagement Date',
      'Contract Expiry',
      'Emergency Contact',
      'Phone',
      'HR Clearance Status',
    ];

    const rows = partners.map((p) => [
      `"${p.hrDetails?.staffIdOrCode || 'N/A'}"`,
      `"${p.name}"`,
      `"${CATEGORY_LABELS[p.category] || p.category}"`,
      `"${p.department || 'N/A'}"`,
      `"${p.designation || 'N/A'}"`,
      `"${p.hrDetails?.dateOfEngagement || p.generatedDate}"`,
      `"${p.hrDetails?.contractEndDate || 'Permanent'}"`,
      `"${p.hrDetails?.emergencyContact?.fullName || 'N/A'} (${p.hrDetails?.emergencyContact?.relationship || ''})"`,
      `"${p.hrDetails?.emergencyContact?.phoneNumber || 'N/A'}"`,
      `"${p.hrDetails?.hrClearanceStatus || 'Under Review'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `HR_Personnel_Roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6">
      {/* Department Banner & Overview Cards */}
      <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-emerald-400">
              <Building className="w-4 h-4" />
              <span>APEX INFRASTRUCTURE &amp; ENTERPRISE GROUP</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight text-white">
              Human Resources Department · Personnel Registry
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Comprehensive personnel management across permanent staff, contract professionals, executive partners, and subcontractors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export Roster (CSV)
            </button>
            <button
              type="button"
              onClick={() => onOpenAddModal('permanent_employee')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              New Personnel Profile
            </button>
          </div>
        </div>

        {/* 5-Metric Quick Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4 pt-1">
          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-400">Total Workforce</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">{totalCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Active profiled members</div>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
            <div className="text-[11px] font-medium text-emerald-400">Permanent Staff</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">{permanentCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Full-time payroll</div>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
            <div className="text-[11px] font-medium text-blue-400">Contract Staff</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">{contractCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Project fixed-term</div>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
            <div className="text-[11px] font-medium text-purple-400">Subcontractors</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">{subcontractorCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Trade &amp; site vendors</div>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-medium text-amber-400">HR Cleared</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">
              {clearedCount}/{totalCount}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              {Math.round((clearedCount / (totalCount || 1)) * 100)}% Verified
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
              placeholder="Search by name, staff ID, role, or department..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Categories ({totalCount})</option>
              <option value="executive_partner">Executive &amp; Partners ({execCount})</option>
              <option value="permanent_employee">Permanent Employees ({permanentCount})</option>
              <option value="contract_staff">Contract Staff ({contractCount})</option>
              <option value="subcontractor">Subcontractors ({subcontractorCount})</option>
            </select>

            <select
              value={clearanceFilter}
              onChange={(e) => setClearanceFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Clearance: All</option>
              <option value="cleared">Fully Cleared</option>
              <option value="pending">Pending Documents</option>
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
            All ({totalCount})
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
            Permanent Staff ({permanentCount})
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
            onClick={() => setCategoryFilter('contract_staff')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
              categoryFilter === 'contract_staff'
                ? 'bg-blue-700 text-white'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            Contract Staff ({contractCount})
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
            Executive &amp; Partners ({execCount})
          </button>
        </div>
      </div>

      {/* Personnel Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3.5">Staff / Vendor ID</th>
                <th className="py-3 px-3.5">Full Name</th>
                <th className="py-3 px-3.5">Category</th>
                <th className="py-3 px-3.5">Department &amp; Designation</th>
                <th className="py-3 px-3.5">Engagement Term</th>
                <th className="py-3 px-3.5">Emergency Contact</th>
                <th className="py-3 px-3.5 text-center">HR Clearance</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No personnel profiles match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPartners.map((partner) => {
                  const badge = CATEGORY_BADGE_STYLES[partner.category] || CATEGORY_BADGE_STYLES.permanent_employee;
                  const isCleared = partner.hrDetails?.hrClearanceStatus === 'Fully Cleared';

                  return (
                    <tr
                      key={partner.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* ID Code */}
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {partner.hrDetails?.staffIdOrCode || (
                          <span className="text-slate-400 italic">Not Assigned</span>
                        )}
                      </td>

                      {/* Name */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{partner.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {partner.extractedData?.partnerIdentification?.nationality || 'Gambian / ECOWAS'}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {CATEGORY_LABELS[partner.category] || partner.category}
                        </span>
                      </td>

                      {/* Department & Role */}
                      <td className="py-3 px-3.5 max-w-[220px]">
                        <div className="font-medium text-slate-900 truncate">
                          {partner.designation || 'Corporate Role'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {partner.department || 'General Enterprise'}
                        </div>
                      </td>

                      {/* Engagement */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="text-slate-800 font-medium">
                          {partner.hrDetails?.dateOfEngagement || partner.generatedDate}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Exp: {partner.hrDetails?.contractEndDate || 'Permanent'}
                        </div>
                      </td>

                      {/* Emergency Contact */}
                      <td className="py-3 px-3.5 max-w-[180px]">
                        {partner.hrDetails?.emergencyContact?.fullName ? (
                          <div>
                            <div className="font-medium text-slate-900 truncate">
                              {partner.hrDetails.emergencyContact.fullName}
                              <span className="text-slate-400 font-normal ml-1 text-[10px]">
                                ({partner.hrDetails.emergencyContact.relationship})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400 inline" />
                              {partner.hrDetails.emergencyContact.phoneNumber}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Pending HR Intake</span>
                        )}
                      </td>

                      {/* Clearance */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleClearance(partner)}
                          title="Click to toggle HR clearance status"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                            isCleared
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          {isCleared ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Cleared
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pending Docs
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

      {/* Edit HR Record Modal */}
      {editingPartner && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Edit HR Record · {editingPartner.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Update official employee/subcontractor classification, contacts, and clearance status.
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
                  category: fd.get('category') as PersonnelCategory,
                  department: fd.get('department') as string,
                  designation: fd.get('designation') as string,
                  hrDetails: {
                    ...(editingPartner.hrDetails || {
                      staffIdOrCode: '',
                      dateOfEngagement: editingPartner.generatedDate,
                      reportingSupervisor: '',
                      workLocation: '',
                      emergencyContact: { fullName: '', relationship: '', phoneNumber: '' },
                      backgroundCheckVerified: true,
                      signedAgreementOnRecord: true,
                      hrOfficerSignatory: 'Head of HR',
                      hrSignDate: editingPartner.generatedDate,
                    }),
                    staffIdOrCode: fd.get('staffIdOrCode') as string,
                    dateOfEngagement: fd.get('dateOfEngagement') as string,
                    contractEndDate: fd.get('contractEndDate') as string,
                    reportingSupervisor: fd.get('reportingSupervisor') as string,
                    workLocation: fd.get('workLocation') as string,
                    hrClearanceStatus: fd.get('hrClearanceStatus') as any,
                    emergencyContact: {
                      fullName: fd.get('emergencyContactName') as string,
                      relationship: fd.get('emergencyContactRel') as string,
                      phoneNumber: fd.get('emergencyContactPhone') as string,
                      address: fd.get('emergencyContactAddr') as string,
                    },
                  },
                });

                setEditingPartner(null);
              }}
              className="p-4 sm:p-5 space-y-4 text-xs"
            >
              {/* Category & IDs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Personnel Category
                  </label>
                  <select
                    name="category"
                    defaultValue={editingPartner.category}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="permanent_employee">Permanent Employee (Full-Time)</option>
                    <option value="subcontractor">Subcontractor / Trade Vendor</option>
                    <option value="contract_staff">Contract Staff (Fixed Term)</option>
                    <option value="executive_partner">Executive &amp; Partner</option>
                    <option value="casual_intern">Casual / Intern / Apprentice</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Staff ID / Subcontractor Code
                  </label>
                  <input
                    type="text"
                    name="staffIdOrCode"
                    defaultValue={editingPartner.hrDetails?.staffIdOrCode || ''}
                    placeholder="e.g. EMP-2026-004 or SUB-ELEC-4401"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Department & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Department / Division
                  </label>
                  <input
                    type="text"
                    name="department"
                    defaultValue={editingPartner.department || ''}
                    placeholder="e.g. Civil & Structural Engineering"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Designation / Role
                  </label>
                  <input
                    type="text"
                    name="designation"
                    defaultValue={editingPartner.designation || ''}
                    placeholder="e.g. Senior Project Engineer"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Engagement Term */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Date of Engagement / Hire
                  </label>
                  <input
                    type="text"
                    name="dateOfEngagement"
                    defaultValue={editingPartner.hrDetails?.dateOfEngagement || editingPartner.generatedDate}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contract Expiry Date (if applicable)
                  </label>
                  <input
                    type="text"
                    name="contractEndDate"
                    defaultValue={editingPartner.hrDetails?.contractEndDate || 'Permanent'}
                    placeholder="e.g. Permanent or Dec 31, 2027"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Reporting & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Reporting Supervisor / Line Lead
                  </label>
                  <input
                    type="text"
                    name="reportingSupervisor"
                    defaultValue={editingPartner.hrDetails?.reportingSupervisor || 'Managing Director'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Work Location / Project Site
                  </label>
                  <input
                    type="text"
                    name="workLocation"
                    defaultValue={editingPartner.hrDetails?.workLocation || 'Headquarters'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2.5">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Phone className="w-3.5 h-3.5 text-blue-700" />
                  Emergency Contact &amp; Next of Kin
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Contact Name</label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      defaultValue={editingPartner.hrDetails?.emergencyContact?.fullName || ''}
                      placeholder="Full Name"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Relationship</label>
                    <input
                      type="text"
                      name="emergencyContactRel"
                      defaultValue={editingPartner.hrDetails?.emergencyContact?.relationship || ''}
                      placeholder="e.g. Spouse / Sibling"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Phone Number</label>
                    <input
                      type="text"
                      name="emergencyContactPhone"
                      defaultValue={editingPartner.hrDetails?.emergencyContact?.phoneNumber || ''}
                      placeholder="+220 ..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Clearance Status */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  HR Clearance &amp; Compliance Status
                </label>
                <select
                  name="hrClearanceStatus"
                  defaultValue={editingPartner.hrDetails?.hrClearanceStatus || 'Fully Cleared'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="Fully Cleared">Fully Cleared (Background &amp; Documents Verified)</option>
                  <option value="Pending Documents">Pending Documents (Awaiting ID / Certs)</option>
                  <option value="Under Review">Under Review (HR Audit in progress)</option>
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
                  Save HR Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
