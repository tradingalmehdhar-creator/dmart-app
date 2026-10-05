import React, { useState } from 'react';
import {
  Bike,
  Car,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Download,
  Phone,
  MapPin,
  ShieldCheck,
  Send,
  UserCheck,
  Eye,
  AlertCircle,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Filter,
  Search,
  Check,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react';
import { DeliveryPartnerApplication, Language } from '../../types';
import { exportRiderCredentialsPDF } from '../../utils/pdfGenerator';

interface AdminFleetTabProps {
  applications: DeliveryPartnerApplication[];
  onUpdateApplicationStatus: (appId: string, newStatus: DeliveryPartnerApplication['status']) => void;
  language: Language;
}

export const AdminFleetTab: React.FC<AdminFleetTabProps> = ({
  applications,
  onUpdateApplicationStatus,
  language,
}) => {
  const [selectedApp, setSelectedApp] = useState<DeliveryPartnerApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLayout, setViewLayout] = useState<'table' | 'cards'>('table');
  const [smsNotificationToast, setSmsNotificationToast] = useState<{
    phone: string;
    message: string;
    type: 'approval' | 'rejection';
  } | null>(null);

  // Trigger SMS notification feedback
  const triggerNotificationAlert = (
    phone: string,
    riderName: string,
    type: 'approval' | 'rejection'
  ) => {
    const message =
      type === 'approval'
        ? language === 'en'
          ? `[D-MART LOGISTICS] Congratulations ${riderName}! Your rider application has been APPROVED. Open the D-mart app to activate your driver dashboard and start accepting delivery orders.`
          : `[D-MART LOGISTICS] Tahniah ${riderName}! Permohonan Rider D-mart anda telah DILULUSKAN. Buka aplikasi D-mart untuk mula menerima pesanan penghantaran runcit.`
        : language === 'en'
        ? `[D-MART LOGISTICS] Hello ${riderName}, your driver application could not be approved due to incomplete documents. Please re-apply or contact support.`
        : `[D-MART LOGISTICS] Salam ${riderName}, permohonan anda tidak dapat diluluskan kerana dokumen tidak lengkap. Sila hubungi khidmat sokongan.`;

    setSmsNotificationToast({ phone, message, type });
    setTimeout(() => setSmsNotificationToast(null), 5000);
  };

  const handleApprove = (app: DeliveryPartnerApplication) => {
    onUpdateApplicationStatus(app.id, 'approved');
    triggerNotificationAlert(app.phoneNumber, app.fullName, 'approval');
    if (selectedApp?.id === app.id) {
      setSelectedApp({ ...app, status: 'approved' });
    }
  };

  const handleReject = (app: DeliveryPartnerApplication) => {
    onUpdateApplicationStatus(app.id, 'under_review');
    triggerNotificationAlert(app.phoneNumber, app.fullName, 'rejection');
    if (selectedApp?.id === app.id) {
      setSelectedApp({ ...app, status: 'under_review' });
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.idNumber.includes(searchQuery) ||
      app.phoneNumber.includes(searchQuery) ||
      app.referenceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.plateNumber.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'pending') {
      matchesStatus = app.status === 'pending' || app.status === 'submitted_waiting_approval';
    } else if (statusFilter === 'approved') {
      matchesStatus = app.status === 'approved';
    } else if (statusFilter === 'rejected') {
      matchesStatus = app.status === 'under_review';
    }

    return matchesSearch && matchesStatus;
  });

  const pendingCount = applications.filter(
    (a) => a.status === 'pending' || a.status === 'submitted_waiting_approval'
  ).length;
  const approvedCount = applications.filter((a) => a.status === 'approved').length;
  const totalFleet = applications.length;

  return (
    <div className="space-y-6">
      {/* Automated SMS / Push Notification Simulated Alert */}
      {smsNotificationToast && (
        <div className="fixed top-6 right-6 z-50 max-w-md bg-gray-900 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-start gap-3 animate-in fade-in slide-in-from-top-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              smsNotificationToast.type === 'approval' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                {language === 'en' ? 'Automated SMS Dispatched' : 'SMS Automatik Dihantar'}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">{smsNotificationToast.phone}</span>
            </div>
            <p className="text-xs text-gray-200 leading-relaxed">{smsNotificationToast.message}</p>
          </div>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              {language === 'en' ? 'Total Fleet Registrations' : 'Jumlah Pendaftaran Rider'}
            </span>
            <span className="text-2xl font-black text-gray-900">{totalFleet}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
            <Bike className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block mb-1">
              {language === 'en' ? 'Pending Verification Approvals' : 'Menunggu Pengesahan'}
            </span>
            <span className="text-2xl font-black text-amber-600">{pendingCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5 animate-spin" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block mb-1">
              {language === 'en' ? 'Active Approved Drivers' : 'Pemandu Aktif Disahkan'}
            </span>
            <span className="text-2xl font-black text-emerald-600">{approvedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'en' ? 'Search by rider name, IC number, plate number, phone...' : 'Cari nama rider, no. kad pengenalan, plat kenderaan...'}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filters */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                statusFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {language === 'en' ? 'All' : 'Semua'}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {language === 'en' ? `Pending (${pendingCount})` : `Menunggu (${pendingCount})`}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                statusFilter === 'approved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {language === 'en' ? `Approved (${approvedCount})` : `Lulus (${approvedCount})`}
            </button>
          </div>

          {/* Layout Toggle: Table vs Cards */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0 text-xs">
            <button
              type="button"
              onClick={() => setViewLayout('table')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                viewLayout === 'table' ? 'bg-white text-emerald-950 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Full Data Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'en' ? 'Table View' : 'Jadual'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('cards')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                viewLayout === 'cards' ? 'bg-white text-emerald-950 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Cards & Inspector View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'en' ? 'Card Inspector' : 'Pemeriksa'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Responsive Data Table OR Card Inspector */}
      {viewLayout === 'table' ? (
        <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">{language === 'en' ? 'Driver / Full Name' : 'Pemandu / Nama'}</th>
                <th className="py-3 px-4">{language === 'en' ? 'NRIC / MyKad' : 'No. Kad Pengenalan'}</th>
                <th className="py-3 px-4 hidden md:table-cell">{language === 'en' ? 'Contact Phone' : 'No. Telefon'}</th>
                <th className="py-3 px-4 hidden lg:table-cell">{language === 'en' ? 'Vehicle & Plate' : 'Kenderaan & No. Plat'}</th>
                <th className="py-3 px-4 whitespace-nowrap">{language === 'en' ? 'Status' : 'Status'}</th>
                <th className="py-3 px-4 hidden xl:table-cell whitespace-nowrap">{language === 'en' ? 'License Doc' : 'Dokumen JPJ'}</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">{language === 'en' ? 'Actions & Dossier' : 'Tindakan & PDF'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                    {language === 'en' ? 'No driver applications match your search filter.' : 'Tiada permohonan pemandu yang sepadan.'}
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const isPending = app.status === 'pending' || app.status === 'submitted_waiting_approval';
                  const isApproved = app.status === 'approved';

                  return (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      {/* Driver / Full Name */}
                      <td className="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                            {app.vehicleType === 'car' ? <Car className="w-4 h-4" /> : <Bike className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{app.fullName}</div>
                            <div className="text-xs text-gray-400">{app.referenceNo}</div>
                          </div>
                        </div>
                      </td>

                      {/* NRIC / MyKad */}
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap font-mono">
                        {app.idNumber}
                      </td>

                      {/* Contact Phone */}
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap hidden md:table-cell font-mono">
                        {app.phoneNumber}
                      </td>

                      {/* Vehicle & Plate */}
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap hidden lg:table-cell">
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-md font-medium">
                          {app.plateNumber}
                        </span>
                      </td>

                      {/* Approval Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPending
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isApproved ? 'Approved' : isPending ? 'Pending' : 'Under Review'}
                        </span>
                      </td>

                      {/* License Doc */}
                      <td className="py-3 px-4 hidden xl:table-cell whitespace-nowrap text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApp(app);
                            setViewLayout('cards');
                          }}
                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-2 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? 'View License' : 'Lihat Dokumen'}</span>
                        </button>
                      </td>

                      {/* Actions & Dossier */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(app)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{language === 'en' ? 'Approve' : 'Lulus'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(app)}
                                  className="px-2 py-1 bg-gray-100 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  <span>{language === 'en' ? 'Reject' : 'Tolak'}</span>
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => exportRiderCredentialsPDF(app)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                              title="Download Credentials PDF Dossier"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedApp(app);
                                setViewLayout('cards');
                              }}
                              className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer"
                              title="Inspect Full Dossier"
                            >
                              <Eye className="w-3.5 h-3.5" />
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
        ) : (
        /* Main Grid: Application List + Detailed Inspector Panel */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Applications Table / Cards */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>{language === 'en' ? 'Rider Sign-Up Queue' : 'Senarai Permohonan Rider'}</span>
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              {filteredApps.length} {language === 'en' ? 'applicants' : 'pemohon'}
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredApps.map((app) => {
              const isPending =
                app.status === 'pending' || app.status === 'submitted_waiting_approval';
              const isApproved = app.status === 'approved';
              const isSelected = selectedApp?.id === app.id;

              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`p-4 transition-all cursor-pointer hover:bg-gray-50/80 ${
                    isSelected ? 'bg-emerald-50/60 border-l-4 border-emerald-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          app.vehicleType === 'car'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {app.vehicleType === 'car' ? (
                          <Car className="w-5 h-5" />
                        ) : (
                          <Bike className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-gray-900 text-sm">{app.fullName}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : isPending
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isApproved ? 'Approved' : isPending ? 'Pending Approval' : 'Under Review'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                          <span className="font-mono text-gray-600 font-medium">{app.referenceNo}</span>
                          <span>•</span>
                          <span>{app.plateNumber}</span>
                          <span>•</span>
                          <span>{app.phoneNumber}</span>
                        </div>

                        <p className="text-xs text-gray-400 mt-1 truncate max-w-sm">{app.address}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-[11px] text-gray-400">{app.submittedAt}</span>

                      {/* Quick One-Click Actions */}
                      <div className="flex items-center gap-1.5">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(app);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-xs cursor-pointer"
                              title="Approve & Send SMS"
                            >
                              <Check className="w-3 h-3" />
                              <span>{language === 'en' ? 'Approve' : 'Lulus'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(app);
                              }}
                              className="px-2.5 py-1 bg-gray-100 hover:bg-rose-100 hover:text-rose-700 text-gray-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              title="Reject Application"
                            >
                              <span>{language === 'en' ? 'Reject' : 'Tolak'}</span>
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportRiderCredentialsPDF(app);
                          }}
                          className="p-1.5 bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-800 rounded-lg transition-colors cursor-pointer"
                          title="Download Credentials PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Document Inspector & PDF Archiver */}
        <div className="lg:col-span-5 sticky top-6 space-y-4">
          {selectedApp ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in">
              <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                    {language === 'en' ? 'Driver Verification Dossier' : 'Dossier Pengesahan Pemandu'}
                  </span>
                  <h3 className="font-black text-white text-base leading-tight mt-0.5">
                    {selectedApp.fullName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => exportRiderCredentialsPDF(selectedApp)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF Export</span>
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Status Alert Banner */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    selectedApp.status === 'approved'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold">
                    {selectedApp.status === 'approved' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-600" />
                    )}
                    <span>
                      {selectedApp.status === 'approved'
                        ? 'Account Verified & Active for Deliveries'
                        : 'Action Needed: Review Credentials & Verify'}
                    </span>
                  </div>
                </div>

                {/* Identity & Vehicle Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-gray-400 font-semibold block mb-0.5">NRIC / MyKad (No. KP)</span>
                    <span className="font-bold text-gray-900">{selectedApp.idNumber}</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-gray-400 font-semibold block mb-0.5">Contact Phone</span>
                    <span className="font-bold text-gray-900">{selectedApp.phoneNumber}</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-gray-400 font-semibold block mb-0.5">Vehicle Plate No</span>
                    <span className="font-bold text-gray-900">{selectedApp.plateNumber}</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-gray-400 font-semibold block mb-0.5">Fleet Class</span>
                    <span className="font-bold text-gray-900 capitalize">
                      {selectedApp.vehicleType === 'car' ? 'Car (Perodua/Proton)' : 'Motorcycle (B2)'}
                    </span>
                  </div>
                </div>

                {/* Address */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                  <span className="text-gray-400 font-semibold block mb-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>Registered Address</span>
                  </span>
                  <p className="text-gray-800 font-medium">{selectedApp.address}</p>
                </div>

                {/* License Document Preview */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Uploaded Driver's License Document</span>
                  </span>

                  <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100 aspect-video group">
                    <img
                      src={
                        selectedApp.licenseDocUrl ||
                        'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80'
                      }
                      alt="Driver License Document"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3 text-white">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">
                          {selectedApp.licenseDocName || 'CDL_Driver_License.jpg'}
                        </p>
                        <p className="text-[10px] text-gray-300">JPJ Competent Driving License</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                  {selectedApp.status !== 'approved' ? (
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedApp)}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve & Dispatch SMS Alert</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleReject(selectedApp)}
                      className="flex-1 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      Suspend / Mark Under Review
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => exportRiderCredentialsPDF(selectedApp)}
                    className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors cursor-pointer"
                    title="Export Official PDF Dossier"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              <UserCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h4 className="font-bold text-gray-700 text-sm">Select a Driver Applicant</h4>
              <p className="text-xs text-gray-400 mt-1">
                Click on any applicant from the queue to inspect identity credentials, preview driving licenses, and export official PDF records.
              </p>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
