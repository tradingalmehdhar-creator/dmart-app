import React, { useState, useEffect } from 'react';
import {
  Sliders,
  ShieldCheck,
  Users,
  FileCheck,
  Download,
  Upload,
  Lock,
  Building2,
  DollarSign,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Key,
  Shield,
  FileText,
  Megaphone,
  ExternalLink
} from 'lucide-react';
import {
  PromoConfig,
  ShippingSettings,
  BusinessDocument,
  SubAdminProfile,
  Language
} from '../../types';
import { AdminPricingSettingsTab } from './AdminPricingSettingsTab';
import { AdminRbacTab } from './AdminRbacTab';
import { AdminPdfSettingsPanel } from './AdminPdfSettingsPanel';
import { AdminStorefrontCopyPanel } from './AdminStorefrontCopyPanel';
import { downloadComplianceDocument } from '../../utils/pdfGenerator';

interface AdminComplianceSettingsTabProps {
  promoSettings: PromoConfig;
  onUpdatePromoSettings: (updated: PromoConfig) => void;
  shippingSettings: ShippingSettings;
  onUpdateShippingSettings: (updated: ShippingSettings) => void;
  documents: BusinessDocument[];
  onUpdateDocuments?: (updated: BusinessDocument[]) => void;
  subAdmins: SubAdminProfile[];
  onUpdateSubAdmins: (profiles: SubAdminProfile[]) => void;
  activeProfile: SubAdminProfile;
  onChangeActiveProfile: (profile: SubAdminProfile) => void;
  language: Language;
}

export const AdminComplianceSettingsTab: React.FC<AdminComplianceSettingsTabProps> = ({
  promoSettings,
  onUpdatePromoSettings,
  shippingSettings,
  onUpdateShippingSettings,
  documents,
  onUpdateDocuments,
  subAdmins,
  onUpdateSubAdmins,
  activeProfile,
  onChangeActiveProfile,
  language,
}) => {
  const [subSection, setSubSection] = useState<'settings' | 'licenses' | 'rbac' | 'pdf_settings' | 'storefront_copy'>('settings');
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

    // Reset input value so re-selecting same file triggers change
    event.target.value = '';
  };

  const triggerUploadInput = (docId: string) => {
    const inputEl = document.getElementById(`upload-compliance-doc-${docId}`) as HTMLInputElement | null;
    if (inputEl) {
      inputEl.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white p-2.5 sm:p-3 rounded-2xl border border-gray-200 shadow-xs gap-3">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSubSection('settings')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              subSection === 'settings'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sliders className="w-4 h-4 text-emerald-600" />
            <span>{language === 'en' ? 'Store & Delivery Pricing' : 'Harga & Tetapan Kedai'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSubSection('licenses')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              subSection === 'licenses'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>{language === 'en' ? 'Regulatory Licenses & Docs' : 'Lesen Perniagaan & Sijil'}</span>
            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full">
              {documents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubSection('rbac')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              subSection === 'rbac'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>{language === 'en' ? 'Admin Accounts & RBAC' : 'Akaun Admin & Keselamatan'}</span>
            <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 text-[10px] rounded-full">
              {subAdmins.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubSection('storefront_copy')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              subSection === 'storefront_copy'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Megaphone className="w-4 h-4 text-emerald-600" />
            <span>{language === 'en' ? 'Banners & Copy Management' : 'Pengurusan Salinan & Banner'}</span>
            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
              Live
            </span>
          </button>

          <button
            type="button"
            id="subnav-pdf-template-settings"
            onClick={() => setSubSection('pdf_settings')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              subSection === 'pdf_settings'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>{language === 'en' ? 'PDF Template Settings' : 'Tetapan Templat PDF'}</span>
            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
              Dynamic
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60 font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>SSM & JAKIM Verified Premise</span>
        </div>
      </div>

      {/* Sub-Section 1: Store & Delivery Pricing */}
      {subSection === 'settings' && (
        <AdminPricingSettingsTab
          promoSettings={promoSettings}
          onUpdatePromoSettings={onUpdatePromoSettings}
          shippingSettings={shippingSettings}
          onUpdateShippingSettings={onUpdateShippingSettings}
          language={language}
        />
      )}

      {/* Sub-Section 2: Business Documents & Regulatory Licenses */}
      {subSection === 'licenses' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                {language === 'en' ? 'Official Commercial & Regulatory Vault' : 'Koleksi Dokumen & Lesen Perniagaan'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Statutory business licenses registered with Malaysian regulatory authorities.
              </p>
            </div>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
              5 Active Certifications
            </span>
          </div>

          {/* Statutory Data Protection & PDPA Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-800/60">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-400/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-white">
                    {language === 'en' ? 'Malaysian PDPA 2010 Privacy Policy' : 'Dasar Privasi PDPA 2010 Malaysia'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    Public Notice Active
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {language === 'en'
                    ? 'Official single-page privacy disclosure covering Firebase Auth, Firestore, Cloud Storage, Google Analytics & Account/Data Deletion requests.'
                    : 'Pendedahan privasi laman tunggal rasmi merangkumi Firebase Auth, Firestore, Cloud Storage, Google Analytics & Pemadaman Data.'}
                </p>
              </div>
            </div>
            <a
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-md cursor-pointer border border-emerald-400/40"
            >
              <span>{language === 'en' ? 'View Live Policy' : 'Lihat Dasar'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

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
                        id={`upload-compliance-doc-${doc.id}`}
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
      )}

      {/* Sub-Section 3: Admin Accounts & RBAC */}
      {subSection === 'rbac' && (
        <AdminRbacTab
          subAdmins={subAdmins}
          onUpdateSubAdmins={onUpdateSubAdmins}
          activeProfile={activeProfile}
          onChangeActiveProfile={onChangeActiveProfile}
          language={language}
        />
      )}

      {/* Sub-Section 4: Header & Footer Copy Management */}
      {subSection === 'storefront_copy' && (
        <AdminStorefrontCopyPanel language={language} />
      )}

      {/* Sub-Section 5: PDF & Statement Settings Console */}
      {subSection === 'pdf_settings' && (
        <AdminPdfSettingsPanel language={language} />
      )}
    </div>
  );
};
