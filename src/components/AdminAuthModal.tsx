import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, CheckCircle2, X, Eye, EyeOff } from 'lucide-react';
import { Language, UserProfile } from '../types';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  language: Language;
  currentUser: UserProfile | null;
}

const DEFAULT_ADMIN_PASSCODE = 'AdminDmart#2026';

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  language,
  currentUser,
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);

  if (!isOpen) return null;

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      const trimmed = passcode.trim();

      // Check 1: Valid admin role in profile
      const hasAdminRole = currentUser?.role === 'admin';

      // Check 2: Passcode matches default AdminDmart#2026
      const isValidPasscode = trimmed === DEFAULT_ADMIN_PASSCODE;

      if (isValidPasscode || hasAdminRole) {
        setPasscode('');
        setErrorMsg(null);
        setAttempts(0);
        onSuccess();
      } else {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        if (!trimmed) {
          setErrorMsg(
            language === 'en'
              ? 'Please enter the administrative security passcode.'
              : 'Sila masukkan kod laluan keselamatan pentadbir.'
          );
        } else {
          setErrorMsg(
            language === 'en'
              ? `Invalid admin security passcode. Attempt ${nextAttempts} failed.`
              : `Kod laluan keselamatan pentadbir tidak sah. Percubaan ${nextAttempts} gagal.`
          );
        }
      }
    }, 450);
  };

  const isEn = language === 'en';

  return (
    <div
      id="admin-auth-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="admin-auth-modal-card"
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-gray-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/15 shadow-inner">
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight leading-tight flex items-center gap-1.5">
                <span>{isEn ? 'Restricted Access' : 'Akses Terhad'}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                  STAFF ONLY
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {isEn ? 'Supermarket Operations Authentication' : 'Pengesahan Operasi Pasaraya'}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="admin-auth-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleVerify} className="p-6 space-y-4">
          <div className="text-xs text-gray-600 bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex items-start gap-2.5 leading-relaxed">
            <KeyRound className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              {isEn
                ? 'This area is restricted to authorized D-mart store managers and dispatch supervisors. Please enter your security passcode to proceed.'
                : 'Kawasan ini dikhaskan untuk pengurus stor dan penyelia penghantaran D-mart yang diberi kuasa. Sila masukkan kod laluan keselamatan anda.'}
            </span>
          </div>

          {/* Current User Role Badge if detected */}
          {currentUser && (
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-gray-500">{isEn ? 'Session User:' : 'Pengguna Semasa:'}</span>
              <div className="flex items-center gap-1.5 font-medium text-gray-800">
                <span className="font-bold">{currentUser.name}</span>
                {currentUser.role === 'admin' ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.5 rounded border border-emerald-200">
                    ROLE: ADMIN
                  </span>
                ) : (
                  <span className="text-[10px] bg-gray-200 text-gray-700 font-bold px-1.5 py-0.5 rounded">
                    {currentUser.role || 'BUYER'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Passcode Input Field */}
          <div className="space-y-1.5">
            <label htmlFor="admin-passcode-input" className="block text-xs font-bold text-gray-700">
              {isEn ? 'Admin Security Passcode' : 'Kod Laluan Keselamatan Admin'}
            </label>
            <div className="relative">
              <input
                id="admin-passcode-input"
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder={isEn ? 'Enter admin passcode...' : 'Masukkan kod laluan...'}
                autoFocus
                autoComplete="current-password"
                className={`w-full pl-3.5 pr-10 py-2.5 bg-white border rounded-xl text-sm font-mono tracking-wider outline-none transition-all ${
                  errorMsg
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/20'
                    : 'border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
              <button
                type="button"
                id="admin-passcode-toggle-btn"
                onClick={() => setShowPasscode((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
              >
                {showPasscode ? (
                  <EyeOff className="w-4 h-4 text-gray-500" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-400">
              {isEn ? 'Default system passcode: AdminDmart#2026' : 'Kod laluan lalai sistem: AdminDmart#2026'}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div
              id="admin-auth-error-msg"
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-start gap-2 animate-in fade-in slide-in-from-top-1"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              id="admin-auth-cancel-btn"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              {isEn ? 'Cancel' : 'Batal'}
            </button>
            <button
              type="submit"
              id="admin-authorize-submit-btn"
              disabled={isVerifying}
              className="px-5 py-2 text-xs font-bold text-white bg-gray-900 hover:bg-black rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60 active:scale-95"
            >
              {isVerifying ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isEn ? 'Verifying...' : 'Mengesahkan...'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isEn ? 'Authorize & Enter' : 'Sahkan & Masuk'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
