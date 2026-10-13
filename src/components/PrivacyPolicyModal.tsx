import React from 'react';
import {
  X,
  ShieldCheck,
  ExternalLink,
  Printer,
  Trash2,
  Mail,
  Lock,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Language } from '../types';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  if (!isOpen) return null;

  const isEn = language === 'en';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="privacy-policy-modal"
      data-testid="privacy-policy-modal"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between border-b border-emerald-900/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shrink-0 shadow-md ring-1 ring-emerald-400/40">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 id="privacy-modal-title" className="font-extrabold text-base sm:text-lg text-white leading-tight">
                  {isEn ? 'D-Mart Privacy Policy' : 'Dasar Privasi D-Mart'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  PDPA 2010 &bull; Malaysia
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate">
                {isEn
                  ? 'Grocery & Daily Needs Delivery &bull; Almehdhar Trading Co.'
                  : 'Penghantaran Barangan Runcit & Keperluan &bull; Almehdhar Trading Co.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              id="privacy-modal-open-url-btn"
              data-testid="privacy-modal-open-url-btn"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer"
              title={isEn ? 'Open full page in new window' : 'Buka laman penuh di tetingkap baharu'}
              aria-label="Open full page in new window"
            >
              <ExternalLink className="w-4 h-4 text-emerald-300" />
            </a>
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer"
              title={isEn ? 'Print or save policy' : 'Cetak atau simpan dasar'}
              aria-label="Print policy"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="privacy-modal-close-btn"
              data-testid="privacy-modal-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer ml-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed font-sans">
          {/* Quick Notice Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3 text-emerald-950">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-xs sm:text-sm text-emerald-900">
                {isEn ? 'Your Privacy is Protected under Malaysian PDPA 2010' : 'Privasi Anda Dilindungi di Bawah Akta PDPA 2010 Malaysia'}
              </h4>
              <p className="text-xs text-emerald-800 leading-normal">
                {isEn
                  ? 'D-Mart respects your personal data. We collect only what is strictly required to fulfill and deliver your groceries safely in Malaysia. We never sell your personal information.'
                  : 'D-Mart menghormati data peribadi anda. Kami hanya mengumpul maklumat yang diperlukan untuk memproses dan menghantar pesanan runcit anda di Malaysia.'}
              </p>
            </div>
          </div>

          {/* Section 1: Data Collection */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                1
              </span>
              <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                {isEn ? 'Personal Data We Collect' : 'Data Peribadi Yang Dikumpul'}
              </h4>
            </div>
            <p className="text-gray-600">
              {isEn
                ? 'To process supermarket orders and dispatch delivery partners, we collect the following user information:'
                : 'Untuk memproses pesanan pasar raya dan menghantar rakan penghantar, kami mengumpul data berikut:'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/70">
                <span className="font-bold text-gray-900 block text-xs">👤 {isEn ? 'Identity & Contact' : 'Identiti & Hubungan'}</span>
                <span className="text-[11px] text-gray-600 block mt-0.5">
                  {isEn ? 'Full Name, Phone Number (for OTP & rider contact), Email address.' : 'Nama Penuh, Nombor Telefon (untuk OTP & rider), Emel.'}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/70">
                <span className="font-bold text-gray-900 block text-xs">🏠 {isEn ? 'Delivery Address' : 'Alamat Penghantaran'}</span>
                <span className="text-[11px] text-gray-600 block mt-0.5">
                  {isEn ? 'Unit/House number, street, postcode, city & Malaysian state.' : 'No rumah/unit, jalan, poskod, bandar & negeri di Malaysia.'}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/70">
                <span className="font-bold text-gray-900 block text-xs">📍 {isEn ? 'Location Data' : 'Data Lokasi'}</span>
                <span className="text-[11px] text-gray-600 block mt-0.5">
                  {isEn ? 'GPS coordinates for on-demand address drop-off & real-time dispatch routing.' : 'Koordinat GPS untuk penghantaran tepat dan pemantauan masa nyata.'}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/70">
                <span className="font-bold text-gray-900 block text-xs">🛒 {isEn ? 'Purchase History' : 'Sejarah Pembelian'}</span>
                <span className="text-[11px] text-gray-600 block mt-0.5">
                  {isEn ? 'Items ordered, quantities, invoices, transaction references & payment method (COD/FPX/TnG).' : 'Barangan dibeli, invois, rujukan transaksi & kaedah bayaran.'}
                </span>
              </div>
            </div>
          </section>

          {/* Section 2: Use of Data */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                2
              </span>
              <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                {isEn ? 'How We Use Your Data' : 'Cara Kami Menggunakan Data Anda'}
              </h4>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li>{isEn ? 'To fulfill grocery orders, manage packing, and route fleet riders to your destination.' : 'Memenuhi pesanan barangan runcit dan menyalurkan penghantaran kepada rakan armada.'}</li>
              <li>{isEn ? 'To authenticate user accounts via Firebase Auth OTP and secure login sessions.' : 'Mengesahkan akaun pengguna melalui OTP Firebase Auth dan keselamatan sesi.'}</li>
              <li>{isEn ? 'To send real-time order status notifications, delivery ETAs, and digital receipts.' : 'Menghantar makluman status pesanan masa nyata, jangkaan masa tiba, dan resit digital.'}</li>
              <li>{isEn ? 'To provide responsive customer service, address refund requests, and resolve delivery issues.' : 'Menyediakan khidmat pelanggan, pengurusan pemulangan bayaran dan penyelesaian aduan.'}</li>
              <li>{isEn ? 'To comply with Malaysian tax, audit, and commercial accounting regulations.' : 'Mematuhi undang-undang cukai dan peraturan perakaunan berkanun di Malaysia.'}</li>
            </ul>
          </section>

          {/* Section 3: Third-Party Services (Firebase) */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                3
              </span>
              <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                {isEn ? 'Third-Party Services (Firebase & Google)' : 'Perkhidmatan Pihak Ketiga (Firebase & Google)'}
              </h4>
            </div>
            <p className="text-gray-600">
              {isEn
                ? 'We utilize enterprise infrastructure from Google Cloud and Firebase under strict Data Protection Agreements:'
                : 'Kami menggunakan infrastruktur Google Cloud dan Firebase di bawah perjanjian perlindungan data yang ketat:'}
            </p>
            <div className="space-y-2">
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between gap-3 text-xs">
                <div>
                  <strong className="text-gray-900 block">Firebase Authentication</strong>
                  <span className="text-[11px] text-gray-500">
                    {isEn ? 'Phone number verification, OTP tokens, user security credentials.' : 'Pengesahan telefon, token OTP, kawalan keselamatan akaun.'}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] shrink-0">Google Auth</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between gap-3 text-xs">
                <div>
                  <strong className="text-gray-900 block">Cloud Firestore</strong>
                  <span className="text-[11px] text-gray-500">
                    {isEn ? 'Encrypted NoSQL database storing user profiles, active cart state, orders, and delivery addresses.' : 'Pangkalan data NoSQL disulitkan untuk profil, troli, pesanan, dan alamat.'}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold text-[10px] shrink-0">Cloud Database</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between gap-3 text-xs">
                <div>
                  <strong className="text-gray-900 block">Firebase Storage</strong>
                  <span className="text-[11px] text-gray-500">
                    {isEn ? 'Encrypted cloud storage for proof of delivery photos and transaction receipts.' : 'Storan awan disulitkan untuk bukti penghantaran dan resit.'}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 font-bold text-[10px] shrink-0">Storage</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between gap-3 text-xs">
                <div>
                  <strong className="text-gray-900 block">Google Analytics</strong>
                  <span className="text-[11px] text-gray-500">
                    {isEn ? 'Aggregate, anonymized usage analytics to troubleshoot app performance and crash telemetry.' : 'Analisis penggunaan tanpa nama untuk kelajuan aplikasi dan kestabilan sistem.'}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 font-bold text-[10px] shrink-0">Analytics</span>
              </div>
            </div>
          </section>

          {/* Section 4: Account & Data Deletion */}
          <section className="space-y-3 p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-purple-700 shrink-0" />
              <h4 className="font-extrabold text-purple-950 text-sm sm:text-base">
                {isEn ? '4. Account & Personal Data Deletion Guarantee' : '4. Jaminan Pemadaman Akaun & Data'}
              </h4>
            </div>
            <p className="text-purple-900 text-xs sm:text-sm">
              {isEn
                ? 'You have the absolute right to delete your D-Mart account and purge all personal information at any time.'
                : 'Anda berhak sepenuhnya untuk memadam akaun D-Mart dan data peribadi anda pada bila-bila masa.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-white rounded-xl border border-purple-200/80 space-y-1">
                <strong className="text-purple-950 block">{isEn ? 'Option A: In-App Deletion' : 'Pilihan A: Dalam Aplikasi'}</strong>
                <p className="text-gray-600 text-[11px]">
                  {isEn
                    ? 'Click your profile icon > "Delete Account (Permanent)" > confirm deletion via confirmation dialog.'
                    : 'Klik ikon profil anda > "Padam Akaun (Kekal)" > sahkan melalui dialog pengesahan.'}
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-purple-200/80 space-y-1">
                <strong className="text-purple-950 block">{isEn ? 'Option B: Support Email' : 'Pilihan B: Emel Sokongan'}</strong>
                <p className="text-gray-600 text-[11px]">
                  {isEn
                    ? 'Email us at tradingalmehdhar@gmail.com with your registered phone number. Purged within 14 business days.'
                    : 'Emel ke tradingalmehdhar@gmail.com dengan nombor berdaftar anda. Dipadamkan dalam 14 hari bekerja.'}
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: User Rights under PDPA */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                5
              </span>
              <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                {isEn ? 'Your Rights Under Malaysian PDPA 2010' : 'Hak Anda Di Bawah PDPA 2010 Malaysia'}
              </h4>
            </div>
            <p className="text-gray-600 text-xs">
              {isEn
                ? 'Under the Personal Data Protection Act 2010, you are entitled to access your stored data, request rectification of inaccurate records, withdraw consent for marketing broadcasts, and limit data processing.'
                : 'Di bawah Akta Perlindungan Data Peribadi 2010, anda berhak mengakses data yang disimpan, memohon pembetulan maklumat, menarik balik persetujuan pemasaran, dan mengehadkan pemprosesan data.'}
            </p>
          </section>

          {/* Section 6: Contact Support */}
          <section className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-white text-sm">
                {isEn ? '6. Contact Support & Data Protection Office' : '6. Hubungi Khidmat Pelanggan & Pegawai Data'}
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">{isEn ? 'Official Email' : 'Emel Rasmi'}</span>
                <a href="mailto:tradingalmehdhar@gmail.com" className="text-emerald-300 hover:underline font-mono">
                  tradingalmehdhar@gmail.com
                </a>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">{isEn ? 'Operating Territory' : 'Kawasan Operasi'}</span>
                <span className="text-slate-200">Kuala Lumpur / Klang Valley, Malaysia</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">{isEn ? 'Service Desk' : 'Waktu Operasi'}</span>
                <span className="text-slate-200">Daily 8:00 AM – 10:00 PM MYT</span>
              </div>
            </div>
          </section>
        </div>

        {/* Modal Footer Toolbar */}
        <div className="p-3.5 sm:p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>{isEn ? 'Effective: October 2026 &bull; D-Mart Malaysia' : 'Berkuatkuasa: Oktober 2026 &bull; D-Mart Malaysia'}</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
              <span>{isEn ? 'Open Web Page' : 'Buka Laman Web'}</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
            >
              {isEn ? 'Close Policy' : 'Tutup Dasar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
