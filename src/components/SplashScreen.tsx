import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Store, ShoppingBag, Sparkles, Bike, ShieldCheck } from 'lucide-react';
import { Language } from '../types';

interface SplashScreenProps {
  language: Language;
  onFinish?: () => void;
  /**
   * If autoDismiss is false, user can manually dismiss or preview
   */
  autoDismiss?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  language,
  onFinish,
  autoDismiss = true,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [progress, setProgress] = useState(5);

  const isEn = language === 'en';

  useEffect(() => {
    // Smoothly step progress bar across the 5-second lifespan
    const timer1 = setTimeout(() => setProgress(25), 600);
    const timer2 = setTimeout(() => setProgress(50), 1600);
    const timer3 = setTimeout(() => setProgress(75), 2800);
    const timer4 = setTimeout(() => setProgress(95), 3900);
    const timer5 = setTimeout(() => setProgress(100), 4500);

    let finishTimer: NodeJS.Timeout;

    if (autoDismiss) {
      // Finish exactly at 5000ms (completing the full 5.0-second fade-in/out animation cycle)
      finishTimer = setTimeout(() => {
        setIsVisible(false);
        if (onFinish) onFinish();
      }, 5000);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [autoDismiss, onFinish]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onFinish) onFinish();
    }, 400);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      id="dmart-splash-screen"
      initial={{ opacity: 0 }}
      animate={
        isDismissed
          ? { opacity: 0 }
          : {
              opacity: [0, 1, 1, 0],
            }
      }
      transition={
        isDismissed
          ? { duration: 0.4, ease: 'easeInOut' }
          : {
              duration: 5,
              times: [0, 0.16, 0.84, 1], // Gentle fade-in in first 0.8s, full opacity until 4.2s, smooth fade out to 5.0s
              ease: 'easeInOut',
            }
      }
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 select-none overflow-hidden"
    >
      {/* Decorative ambient lights */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-teal-400/15 blur-3xl pointer-events-none"
      />

      {/* Main Container */}
      <div className="relative flex flex-col items-center max-w-sm w-full text-center">
        {/* Animated App Logo with dedicated 5-second smooth fade-in and fade-out */}
        <motion.div
          id="splash-logo-container"
          initial={{ opacity: 0, scale: 0.82, y: 16 }}
          animate={
            isDismissed
              ? { opacity: 0, scale: 0.9, y: -10 }
              : {
                  // Fades in smoothly (0s -> 1.2s), stays solid (1.2s -> 3.7s), and fades out smoothly (3.7s -> 5.0s)
                  opacity: [0, 1, 1, 0],
                  scale: [0.82, 1, 1, 0.92],
                  y: [16, 0, 0, -8],
                }
          }
          transition={
            isDismissed
              ? { duration: 0.4, ease: 'easeInOut' }
              : {
                  duration: 5,
                  times: [0, 0.24, 0.74, 1],
                  ease: 'easeInOut',
                }
          }
          className="relative mb-6"
        >
          {/* Pulsing ambient glow around logo */}
          <div className="absolute -inset-3 rounded-3xl bg-emerald-400/30 blur-md animate-pulse" />

          <div className="relative transform hover:scale-105 transition-transform animate-bounce">
            <img src="/icon.svg" alt="D-Mart" className="w-[108px] h-[108px] rounded-3xl drop-shadow-2xl object-contain shadow-emerald-900/30" />
          </div>

          {/* Floating mini badge */}
          <div className="absolute -bottom-2 -right-2 bg-amber-400 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border border-white flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            <span>MY</span>
          </div>
        </motion.div>

        {/* Brand Name - Synced with Logo Fade-In and Out */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={
            isDismissed
              ? { opacity: 0, y: -6 }
              : {
                  opacity: [0, 1, 1, 0],
                  y: [12, 0, 0, -6],
                }
          }
          transition={
            isDismissed
              ? { duration: 0.35, ease: 'easeInOut' }
              : {
                  duration: 5,
                  times: [0, 0.26, 0.76, 1],
                  ease: 'easeInOut',
                }
          }
          className="flex items-center justify-center gap-2 mb-2"
        >
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
            D<span className="text-emerald-400">-mart</span>
          </h1>
          <span className="bg-emerald-500/30 text-emerald-300 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-emerald-400/40 uppercase tracking-widest">
            Pasaraya
          </span>
        </motion.div>

        {/* Slogan */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={
            isDismissed
              ? { opacity: 0 }
              : {
                  opacity: [0, 1, 1, 0],
                }
          }
          transition={
            isDismissed
              ? { duration: 0.3, ease: 'easeInOut' }
              : {
                  duration: 5,
                  times: [0, 0.3, 0.78, 1],
                  ease: 'easeInOut',
                }
          }
          className="text-emerald-200/90 text-sm font-medium mb-8 max-w-xs"
        >
          {isEn
            ? 'Fresh Groceries & Daily Essentials Delivered Fast'
            : 'Barangan Runcit Segar & Keperluan Harian Dihantar Pantas'}
        </motion.p>

        {/* Realistic Progress Loading Bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0.9 }}
          animate={
            isDismissed
              ? { opacity: 0 }
              : {
                  opacity: [0, 1, 1, 0],
                  scaleX: [0.9, 1, 1, 0.95],
                }
          }
          transition={
            isDismissed
              ? { duration: 0.25 }
              : {
                  duration: 5,
                  times: [0, 0.15, 0.85, 1],
                  ease: 'easeInOut',
                }
          }
          className="w-full max-w-xs bg-emerald-950/70 border border-emerald-500/30 rounded-full h-2 p-0.5 mb-3 overflow-hidden shadow-inner"
        >
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-amber-300 rounded-full transition-all duration-500 ease-out shadow-xs"
            style={{ width: `${progress}%` }}
          />
        </motion.div>

        {/* Loading status message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={
            isDismissed
              ? { opacity: 0 }
              : {
                  opacity: [0, 1, 1, 0],
                }
          }
          transition={
            isDismissed
              ? { duration: 0.25 }
              : {
                  duration: 5,
                  times: [0, 0.2, 0.85, 1],
                }
          }
          className="text-[11px] font-medium text-emerald-300/80 mb-6 flex items-center gap-1.5"
        >
          <Bike className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>
            {progress < 35
              ? (isEn ? 'Connecting to local market hubs...' : 'Menyambung ke hab pasar berdekatan...')
              : progress < 75
              ? (isEn ? 'Loading fresh catalog & rider network...' : 'Memuat katalog segar & rangkaian rider...')
              : (isEn ? 'Ready! Opening D-mart Pasaraya...' : 'Sedia! Membuka D-mart Pasaraya...')}
          </span>
        </motion.div>

        {/* Feature Badges */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={
            isDismissed
              ? { opacity: 0 }
              : {
                  opacity: [0, 1, 1, 0],
                  y: [10, 0, 0, -5],
                }
          }
          transition={
            isDismissed
              ? { duration: 0.25 }
              : {
                  duration: 5,
                  times: [0, 0.35, 0.82, 1],
                  ease: 'easeInOut',
                }
          }
          className="grid grid-cols-3 gap-2 w-full max-w-xs text-[10px] text-emerald-200/80 mb-6"
        >
          <div className="bg-white/10 backdrop-blur-xs py-1.5 px-1 rounded-xl border border-white/10 flex flex-col items-center">
            <span className="font-bold text-amber-300">⚡ 45 Mins</span>
            <span>{isEn ? 'Fast Delivery' : 'Hantar Pantas'}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs py-1.5 px-1 rounded-xl border border-white/10 flex flex-col items-center">
            <span className="font-bold text-emerald-300">🥬 100% Segar</span>
            <span>{isEn ? 'Guaranteed' : 'Terjamin'}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs py-1.5 px-1 rounded-xl border border-white/10 flex flex-col items-center">
            <span className="font-bold text-teal-300">💵 COD / FPX</span>
            <span>{isEn ? 'Easy Pay' : 'Mudah Bayar'}</span>
          </div>
        </motion.div>

        {/* Manual Skip/Enter Button */}
        <motion.button
          id="splash-skip-btn"
          type="button"
          onClick={handleDismiss}
          initial={{ opacity: 0 }}
          animate={
            isDismissed
              ? { opacity: 0 }
              : {
                  opacity: [0, 0.85, 0.85, 0],
                }
          }
          transition={
            isDismissed
              ? { duration: 0.2 }
              : {
                  duration: 5,
                  times: [0, 0.35, 0.82, 1],
                }
          }
          className="text-xs text-white/80 hover:text-white bg-white/15 hover:bg-white/25 px-4 py-1.5 rounded-full font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 border border-white/20"
        >
          <span>{isEn ? 'Skip & Enter Store' : 'Langkau & Masuk Pasaraya'}</span>
          <span>→</span>
        </motion.button>
      </div>
    </motion.div>
  );
};
