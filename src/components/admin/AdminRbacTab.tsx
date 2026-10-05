import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  UserCheck,
  Plus,
  Lock,
  Unlock,
  Key,
  Users,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  Building2,
  Trash2,
  Sliders,
  Check,
  X,
  RefreshCw
} from 'lucide-react';
import {
  SubAdminProfile,
  AdminRoleType,
  AdminPermissionSet,
  Language
} from '../../types';

interface AdminRbacTabProps {
  subAdmins: SubAdminProfile[];
  onUpdateSubAdmins: (profiles: SubAdminProfile[]) => void;
  activeProfile: SubAdminProfile;
  onChangeActiveProfile: (profile: SubAdminProfile) => void;
  language: Language;
}

const ROLE_DEFINITIONS: Record<
  AdminRoleType,
  { label: string; department: string; color: string; desc: string; defaultPermissions: AdminPermissionSet }
> = {
  super_admin: {
    label: 'Super Administrator',
    department: 'Executive Management',
    color: 'bg-rose-100 text-rose-800 border-rose-200',
    desc: 'Unrestricted enterprise access across all store operations, financials & system settings.',
    defaultPermissions: {
      canManageInventory: true,
      canManageBatches: true,
      canViewFleetMap: true,
      canReassignOrders: true,
      canManageRiderWallets: true,
      canManagePromotions: true,
      canLaunchPushBroadcasts: true,
      canViewSalesAnalytics: true,
      canExportFinancialReports: true,
      canProcessRefunds: true,
      canCloseTickets: true,
      canManageSubAdmins: true,
      canChangeAppSettings: true,
    },
  },
  warehouse_manager: {
    label: 'Warehouse & Fulfillment Manager',
    department: 'Fulfillment & Inventory Hub',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    desc: 'Responsible for batch tracking, low-stock replenishment, expiry dates, and categories.',
    defaultPermissions: {
      canManageInventory: true,
      canManageBatches: true,
      canViewFleetMap: false,
      canReassignOrders: false,
      canManageRiderWallets: false,
      canManagePromotions: false,
      canLaunchPushBroadcasts: false,
      canViewSalesAnalytics: false,
      canExportFinancialReports: false,
      canProcessRefunds: false,
      canCloseTickets: false,
      canManageSubAdmins: false,
      canChangeAppSettings: false,
    },
  },
  fleet_operator: {
    label: 'Fleet & Dispatch Operator',
    department: 'Last-Mile Logistics',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    desc: 'Monitors live rider telemetry, reassigns delivery orders, and reconciles rider float wallets.',
    defaultPermissions: {
      canManageInventory: false,
      canManageBatches: false,
      canViewFleetMap: true,
      canReassignOrders: true,
      canManageRiderWallets: true,
      canManagePromotions: false,
      canLaunchPushBroadcasts: false,
      canViewSalesAnalytics: false,
      canExportFinancialReports: false,
      canProcessRefunds: false,
      canCloseTickets: false,
      canManageSubAdmins: false,
      canChangeAppSettings: false,
    },
  },
  marketing_specialist: {
    label: 'Marketing & Promotions Lead',
    department: 'Growth & Merchandising',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    desc: 'Creates discount promo codes, designs home banners, and launches push notifications.',
    defaultPermissions: {
      canManageInventory: false,
      canManageBatches: false,
      canViewFleetMap: false,
      canReassignOrders: false,
      canManageRiderWallets: false,
      canManagePromotions: true,
      canLaunchPushBroadcasts: true,
      canViewSalesAnalytics: true,
      canExportFinancialReports: false,
      canProcessRefunds: false,
      canCloseTickets: false,
      canManageSubAdmins: false,
      canChangeAppSettings: false,
    },
  },
  support_agent: {
    label: 'Customer Care & Support Agent',
    department: 'Customer Care',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    desc: 'Investigates missing/damaged goods complaints and executes one-tap wallet refunds.',
    defaultPermissions: {
      canManageInventory: false,
      canManageBatches: false,
      canViewFleetMap: false,
      canReassignOrders: false,
      canManageRiderWallets: false,
      canManagePromotions: false,
      canLaunchPushBroadcasts: false,
      canViewSalesAnalytics: false,
      canExportFinancialReports: false,
      canProcessRefunds: true,
      canCloseTickets: true,
      canManageSubAdmins: false,
      canChangeAppSettings: false,
    },
  },
  financial_auditor: {
    label: 'Corporate Financial Auditor',
    department: 'Accounting & Compliance',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    desc: 'Views sales margins, revenue trends, and exports official tax / CSV ledger statements.',
    defaultPermissions: {
      canManageInventory: false,
      canManageBatches: false,
      canViewFleetMap: false,
      canReassignOrders: false,
      canManageRiderWallets: false,
      canManagePromotions: false,
      canLaunchPushBroadcasts: false,
      canViewSalesAnalytics: true,
      canExportFinancialReports: true,
      canProcessRefunds: false,
      canCloseTickets: false,
      canManageSubAdmins: false,
      canChangeAppSettings: false,
    },
  },
};

export const AdminRbacTab: React.FC<AdminRbacTabProps> = ({
  subAdmins,
  onUpdateSubAdmins,
  activeProfile,
  onChangeActiveProfile,
  language,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Profile Form State
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDepartment, setNewDepartment] = useState('Fulfillment & Inventory Hub');
  const [newRole, setNewRole] = useState<AdminRoleType>('warehouse_manager');
  const [customPermissions, setCustomPermissions] = useState<AdminPermissionSet>(
    ROLE_DEFINITIONS.warehouse_manager.defaultPermissions
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRoleChange = (role: AdminRoleType) => {
    setNewRole(role);
    setNewDepartment(ROLE_DEFINITIONS[role].department);
    setCustomPermissions(ROLE_DEFINITIONS[role].defaultPermissions);
  };

  const handleTogglePermission = (key: keyof AdminPermissionSet) => {
    setCustomPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newEmail) return;

    const created: SubAdminProfile = {
      id: `adm-${Date.now().toString().slice(-4)}`,
      fullName: newFullName,
      email: newEmail,
      phone: newPhone || '012-0000000',
      role: newRole,
      department: newDepartment,
      status: 'active',
      lastActive: 'Never logged in',
      permissions: customPermissions,
    };

    onUpdateSubAdmins([...subAdmins, created]);
    setIsCreateModalOpen(false);
    setNewFullName('');
    setNewEmail('');
    setNewPhone('');
    showToast(
      language === 'en'
        ? `Sub-Admin profile for "${created.fullName}" created with ${created.role} role!`
        : `Profil Sub-Admin untuk "${created.fullName}" berjaya dicipta!`
    );
  };

  const handleToggleStatus = (id: string) => {
    if (id === 'adm-01') {
      showToast('Super Admin profile cannot be suspended.');
      return;
    }

    const updated = subAdmins.map((adm) => {
      if (adm.id === id) {
        return {
          ...adm,
          status: (adm.status === 'active' ? 'suspended' : 'active') as SubAdminProfile['status'],
        };
      }
      return adm;
    });

    onUpdateSubAdmins(updated);
    showToast(language === 'en' ? 'Sub-Admin status updated.' : 'Status Sub-Admin dikemaskini.');
  };

  const handleDeleteProfile = (id: string) => {
    if (id === 'adm-01') {
      showToast('Super Admin account cannot be deleted.');
      return;
    }

    onUpdateSubAdmins(subAdmins.filter((adm) => adm.id !== id));
    showToast(language === 'en' ? 'Sub-Admin profile removed.' : 'Profil Sub-Admin telah dipadam.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-500/40 text-xs font-bold animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Active Persona Simulator Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-indigo-500/30 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-black uppercase tracking-wider">
              RBAC Live Persona Switcher
            </span>
            <span className="text-xs text-indigo-200">
              Logged in as: <strong>{activeProfile.fullName}</strong>
            </span>
          </div>
          <h3 className="text-sm font-black text-white">
            Simulate Dashboard Experience Across Operator Roles
          </h3>
          <p className="text-xs text-gray-300">
            Switch your active session role to test how tabs, refund buttons, and marketing engines are restricted based on permissions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <select
            value={activeProfile.id}
            onChange={(e) => {
              const target = subAdmins.find((a) => a.id === e.target.value);
              if (target) {
                onChangeActiveProfile(target);
                showToast(`Switched active session to ${target.fullName} (${ROLE_DEFINITIONS[target.role].label})`);
              }
            }}
            className="w-full md:w-auto px-3.5 py-2 rounded-xl bg-gray-800 text-white border border-gray-700 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
          >
            {subAdmins.map((adm) => (
              <option key={adm.id} value={adm.id}>
                {adm.fullName} - {ROLE_DEFINITIONS[adm.role].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-black">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900">
              {language === 'en' ? 'Role-Based Access Control (RBAC)' : 'Kawalan Akses Berasaskan Peranan (RBAC)'}
            </h2>
            <p className="text-xs text-gray-500">
              {language === 'en'
                ? 'Create and manage restricted sub-admin profiles with fine-grained permissions'
                : 'Cipta dan urus profil sub-admin dengan kebenaran terhad'}
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-create-subadmin"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'en' ? 'Create Sub-Admin Profile' : 'Cipta Profil Sub-Admin'}</span>
        </button>
      </div>

      {/* Sub-Admin Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subAdmins.map((adm) => {
          const roleInfo = ROLE_DEFINITIONS[adm.role] || ROLE_DEFINITIONS.warehouse_manager;
          const isSuper = adm.role === 'super_admin';
          const isActive = adm.status === 'active';
          const isCurrentSession = activeProfile.id === adm.id;

          return (
            <div
              key={adm.id}
              className={`bg-white rounded-2xl border transition-all shadow-xs flex flex-col justify-between p-4.5 space-y-4 ${
                isCurrentSession
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="space-y-3">
                {/* Card Top */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center font-black text-gray-700 text-sm">
                      {adm.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-gray-900 line-clamp-1">{adm.fullName}</h4>
                      <p className="text-[11px] text-gray-500">{adm.department}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {isActive ? 'Active' : 'Suspended'}
                  </span>
                </div>

                {/* Role Badge */}
                <div>
                  <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg border ${roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                  <p className="text-xs text-gray-600 mt-1.5">{roleInfo.desc}</p>
                </div>

                {/* Contact & Activity */}
                <div className="space-y-1 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span>{adm.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{adm.phone}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 pt-1">
                    Last active: <strong>{adm.lastActive}</strong>
                  </div>
                </div>

                {/* Permission Highlights */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/60 space-y-1.5 text-xs">
                  <span className="font-bold text-gray-700 text-[11px] block">Key Permissions:</span>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      {adm.permissions.canManageInventory ? (
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="w-3 h-3 text-gray-300 shrink-0" />
                      )}
                      <span className={adm.permissions.canManageInventory ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                        Inventory
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {adm.permissions.canViewFleetMap ? (
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="w-3 h-3 text-gray-300 shrink-0" />
                      )}
                      <span className={adm.permissions.canViewFleetMap ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                        Live Fleet
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {adm.permissions.canManagePromotions ? (
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="w-3 h-3 text-gray-300 shrink-0" />
                      )}
                      <span className={adm.permissions.canManagePromotions ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                        Promotions
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {adm.permissions.canProcessRefunds ? (
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="w-3 h-3 text-gray-300 shrink-0" />
                      )}
                      <span className={adm.permissions.canProcessRefunds ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                        Refunds
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onChangeActiveProfile(adm);
                    showToast(`Logged in as ${adm.fullName}`);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center ${
                    isCurrentSession
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {isCurrentSession ? 'Active Session' : 'Login as User'}
                </button>

                {!isSuper && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(adm.id)}
                      className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                    >
                      {isActive ? 'Suspend' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProfile(adm.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE SUB-ADMIN MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Create New Sub-Admin Profile</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mohd Khairul Nizam"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. khairul.warehouse@d-mart.my"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-medium outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 017-8891029"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-medium outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Operational Role Archetype</label>
                <select
                  value={newRole}
                  onChange={(e) => handleRoleChange(e.target.value as AdminRoleType)}
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-bold outline-none cursor-pointer"
                >
                  <option value="warehouse_manager">Warehouse & Fulfillment Manager</option>
                  <option value="fleet_operator">Fleet & Dispatch Operator</option>
                  <option value="marketing_specialist">Marketing & Promotions Lead</option>
                  <option value="support_agent">Customer Care & Support Agent</option>
                  <option value="financial_auditor">Corporate Financial Auditor</option>
                </select>
                <p className="text-[11px] text-gray-500 mt-1">{ROLE_DEFINITIONS[newRole].desc}</p>
              </div>

              {/* Granular Permissions Checklist */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-gray-900 text-xs flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Granular Permission Matrix</span>
                  </h4>
                  <span className="text-[10px] text-gray-400">Customizable</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customPermissions.canManageInventory}
                      onChange={() => handleTogglePermission('canManageInventory')}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Manage Inventory & Stock</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customPermissions.canManageBatches}
                      onChange={() => handleTogglePermission('canManageBatches')}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Batch Codes & Expiry Control</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customPermissions.canViewFleetMap}
                      onChange={() => handleTogglePermission('canViewFleetMap')}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>View Live Fleet Telemetry</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customPermissions.canReassignOrders}
                      onChange={() => handleTogglePermission('canReassignOrders')}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Manual Order Reassignment</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customPermissions.canManageRiderWallets}
                      onChange={() => handleTogglePermission('canManageRiderWallets')}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Manage Rider Float & COD Wallets</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customPermissions.canManagePromotions}
                      onChange={() => handleTogglePermission('canManagePromotions')}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Create Coupons & Store Banners</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customPermissions.canLaunchPushBroadcasts}
                      onChange={() => handleTogglePermission('canLaunchPushBroadcasts')}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Launch Push Notifications</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customPermissions.canViewSalesAnalytics}
                      onChange={() => handleTogglePermission('canViewSalesAnalytics')}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>View GMV & Profit Analytics</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customPermissions.canExportFinancialReports}
                      onChange={() => handleTogglePermission('canExportFinancialReports')}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Export Accounting CSV & PDF</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customPermissions.canProcessRefunds}
                      onChange={() => handleTogglePermission('canProcessRefunds')}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>One-Tap Wallet Refunds</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
