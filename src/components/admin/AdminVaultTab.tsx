import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  FileCheck,
  CreditCard,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  ExternalLink,
  Lock,
  Landmark,
  FileText,
  DollarSign,
  ChevronRight,
  Eye,
  Check
} from 'lucide-react';
import { BusinessDocument, RiderPayout, StoreBankInfo, Language } from '../../types';
import {
  exportBusinessDocumentPDF,
  downloadComplianceDocument,
  exportRiderPayoutSummaryPDF,
  exportRiderPayoutsCSV
} from '../../utils/pdfGenerator';

interface AdminVaultTabProps {
  documents: BusinessDocument[];
  onUpdateDocuments?: (updated: BusinessDocument[]) => void;
  payouts: RiderPayout[];
  bankInfo: StoreBankInfo;
  onUpdatePayoutStatus: (payoutId: string, status: RiderPayout['status']) => void;
  onUpdateBankInfo: (info: StoreBankInfo) => void;
  language: Language;
}

export const AdminVaultTab: React.FC<AdminVaultTabProps> = ({
  documents,
  onUpdateDocuments,
  payouts,
  bankInfo,
  onUpdatePayoutStatus,
  onUpdateBankInfo,
  language,
}) => {
  const [activeSubSection, setActiveSubSection] = useState<'docs' | 'banking'>('docs');
  const [editingBank, setEditingBank] = useState<StoreBankInfo>(bankInfo);
  const [bankSavedToast, setBankSavedToast] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<BusinessDocument | null>(null);
  const [docList, setDocList] = useState<BusinessDocument[]>(documents);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setDocList(documents);
  }, [documents]);

  const handleFileUpload = (docId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formattedSize = file.size >= 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const updated = docList.map((d) => {
      if (d.id === docId) {
        return {
          ...d,
          fileName: file.name,
          fileSize: formattedSize,
          status: 'verified' as const,
          notes: `Renewed & attached file (${file.name}) on ${new Date().toLocaleDateString('en-GB')}.`,
        };
      }
      return d;
    });

    setDocList(updated);
    onUpdateDocuments?.(updated);
    setToastMessage(
      language === 'en'
        ? `Document renewed & attached: "${file.name}"`
        : `Fail dokumen dikemaskini & diperbaharui: "${file.name}"`
    );
    setTimeout(() => setToastMessage(null), 3500);

    event.target.value = '';
  };

  const triggerUploadInput = (docId: string) => {
    const inputEl = document.getElementById(`upload-vault-doc-${docId}`) as HTMLInputElement | null;
    if (inputEl) {
      inputEl.click();
    }
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBankInfo(editingBank);
    setBankSavedToast(true);
    setTimeout(() => setBankSavedToast(false), 3000);
  };

  const totalDisbursedThisWeek = payouts.reduce((acc, p) => acc + p.totalPayout, 0);
  const pendingPayoutCount = payouts.filter((p) => p.status === 'ready_for_payout').length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {bankSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-500/40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">Bank account information updated securely.</span>
        </div>
      )}

      {/* Sub-navigation Switcher */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveSubSection('docs')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubSection === 'docs'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{language === 'en' ? 'Commercial Licenses & Regulatory' : 'Lesen & Sijil Perniagaan'}</span>
            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full">
              {documents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubSection('banking')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubSection === 'banking'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Landmark className="w-4 h-4 text-emerald-600" />
            <span>{language === 'en' ? 'Merchant Bank & Rider Payouts' : 'Bank & Pembayaran Rider'}</span>
            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full">
              RM {totalDisbursedThisWeek.toFixed(0)}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60 font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-Bit SSL Encrypted Vault</span>
        </div>
      </div>

      {activeSubSection === 'docs' ? (
        /* Section 1: Business Documentation & Licenses */
        <div className="space-y-4">
          {toastMessage && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-emerald-600 hover:text-emerald-900 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {docList.map((doc) => {
              const isVerified = doc.status === 'verified';
              const isRenewal = doc.status === 'renewal_pending';

              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:border-emerald-300 transition-all p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileCheck className="w-5 h-5" />
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isVerified
                            ? 'bg-emerald-100 text-emerald-800'
                            : isRenewal
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {doc.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-900 text-sm leading-snug">{doc.title}</h4>
                      <p className="text-xs text-gray-500 font-mono mt-1">{doc.regNumber}</p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="text-gray-400">Issuer:</span>
                        <span className="font-semibold text-gray-800 truncate max-w-[160px]">{doc.issuedBy}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="text-gray-400">Expires:</span>
                        <span className="font-semibold text-gray-800">{doc.expiryDate}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{doc.notes}</p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[10px] font-bold uppercase border border-gray-200">
                        {doc.fileName?.split('.').pop() || 'FILE'}
                      </span>
                      <span className="text-[11px] text-gray-400 font-mono">{doc.fileSize}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="file"
                        id={`upload-vault-doc-${doc.id}`}
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.docx"
                        onChange={(e) => handleFileUpload(doc.id, e)}
                      />
                      <button
                        type="button"
                        onClick={() => triggerUploadInput(doc.id)}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 hover:text-gray-900 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-95"
                        title={language === 'en' ? `Upload / renew file for ${doc.title}` : `Muat naik atau perbaharui fail untuk ${doc.title}`}
                      >
                        <Upload className="w-3.5 h-3.5 text-gray-600" />
                        <span>Upload</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadComplianceDocument(doc)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-95"
                        title={language === 'en' ? `Download ${doc.fileName || doc.title}` : `Muat turun ${doc.fileName || doc.title}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Section 2: Store Official Bank Info & Rider Payouts */
        <div className="space-y-6">
          {/* Store Bank Account Configuration */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-gray-900 text-sm">
                  {language === 'en' ? 'Official Corporate Merchant Bank Account' : 'Akaun Bank Pedagang Korporat Rasmi'}
                </h4>
              </div>
              <span className="text-xs text-gray-400 font-medium">Maybank Corporate GIRO</span>
            </div>

            <form onSubmit={handleSaveBank} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={editingBank.bankName}
                  onChange={(e) => setEditingBank({ ...editingBank, bankName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Corporate Account Holder</label>
                <input
                  type="text"
                  value={editingBank.accountHolder}
                  onChange={(e) => setEditingBank({ ...editingBank, accountHolder: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Account Number</label>
                <input
                  type="text"
                  value={editingBank.accountNumber}
                  onChange={(e) => setEditingBank({ ...editingBank, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Branch / Location</label>
                <input
                  type="text"
                  value={editingBank.branch}
                  onChange={(e) => setEditingBank({ ...editingBank, branch: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">SWIFT / BIC Code</label>
                <input
                  type="text"
                  value={editingBank.swiftBic}
                  onChange={(e) => setEditingBank({ ...editingBank, swiftBic: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Save Bank Account Info
                </button>
              </div>
            </form>
          </div>

          {/* Rider Payouts Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-black text-gray-900 text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'en' ? 'Rider Dispatch Payout Summaries' : 'Ringkasan Pembayaran Gaji Rider'}</span>
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Automated computation of base trip earnings, customer tips, and performance bonuses.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportRiderPayoutsCSV(payouts)}
                  className="px-3 py-2 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export All to Banking CSV</span>
                </button>
              </div>
            </div>

            {/* Mobile Horizontal Swipe Instruction Banner */}
            <div className="md:hidden flex items-center justify-between px-3.5 py-2 bg-emerald-50/80 border-b border-emerald-100 text-emerald-950 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="animate-pulse">↔️</span>
                <span>{language === 'en' ? 'Swipe horizontally to view all payout columns' : 'Leret ke sisi untuk melihat semua maklumat pembayaran'}</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">
                {payouts.length} payouts
              </span>
            </div>

            <div className="overflow-x-auto no-scrollbar sm:overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-bold text-xs uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 min-w-[180px]">Rider / Phone</th>
                    <th className="py-3 px-3 whitespace-nowrap">Vehicle</th>
                    <th className="py-3 px-3 min-w-[160px]">Bank Details</th>
                    <th className="py-3 px-3 whitespace-nowrap">Trips</th>
                    <th className="py-3 px-3 whitespace-nowrap">Base Pay</th>
                    <th className="py-3 px-3 whitespace-nowrap">Tips + Bonus</th>
                    <th className="py-3 px-3 whitespace-nowrap">Net Payout</th>
                    <th className="py-3 px-3 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap min-w-[150px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900">{p.riderName}</p>
                        <p className="text-xs text-gray-500">{p.riderPhone}</p>
                      </td>

                      <td className="py-3 px-3 text-xs text-gray-600 font-medium whitespace-nowrap">
                        {p.vehiclePlate}
                      </td>

                      <td className="py-3 px-3 text-xs">
                        <span className="font-bold text-gray-800 block">{p.bankName}</span>
                        <span className="font-mono text-gray-500">{p.accountNumber}</span>
                      </td>

                      <td className="py-3 px-3 text-xs font-bold text-gray-700 whitespace-nowrap">
                        {p.totalDeliveries} orders
                      </td>

                      <td className="py-3 px-3 text-xs font-semibold text-gray-700 whitespace-nowrap">
                        RM {p.basePay.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-xs text-emerald-700 font-semibold whitespace-nowrap">
                        +RM {(p.tipsCollected + p.performanceBonus).toFixed(2)}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-sm font-black text-emerald-700">
                          RM {p.totalPayout.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            p.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'processing'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        {p.status !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => onUpdatePayoutStatus(p.id, 'paid')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => exportRiderPayoutSummaryPDF(p)}
                          className="p-1.5 bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-800 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
                          title="Download Official Payslip PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
