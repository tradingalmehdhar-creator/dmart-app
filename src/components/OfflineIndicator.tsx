import React from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Language } from '../types';

interface OfflineIndicatorProps {
  language?: Language;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ language = 'en' }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  const isEn = language === 'en';

  return (
    <div
      id="pwa-offline-indicator"
      data-testid="pwa-offline-indicator"
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900/95 text-amber-300 border border-amber-500/40 px-3.5 py-2 text-xs font-bold shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-200"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
      </span>
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <span>
        {isEn
          ? 'Offline Mode — Serving cached D-Mart supermarket data.'
          : 'Mod Luar Talian — Memaparkan data pasaran D-Mart yang dicache.'}
      </span>
    </div>
  );
};
