import React, { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Root Error Boundary
 * Prevents blank/white screens on unexpected runtime errors and provides clear recovery actions.
 */
class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[D-Mart Root ErrorBoundary]', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
    } catch {
      // ignore storage access errors
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans text-gray-900">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-100 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 font-black text-2xl shadow-inner">
              D
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">D-mart Malaysia</h1>
            <p className="text-sm text-gray-600 mb-6">
              A temporary interface issue occurred. You can easily reload or reset local cache to continue shopping.
            </p>
            {this.state.error && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl mb-6 text-left overflow-auto max-h-32 border border-red-100 font-mono">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-md shadow-emerald-600/20"
              >
                Reload App
              </button>
              <button
                type="button"
                onClick={this.handleClearAndReset}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-xl text-sm transition-colors"
              >
                Clear Cache & Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Resilient Root Container Mounting
function mountApp() {
  // Security & Privacy Isolation: Ensure newly built APK / shared web sessions start clean
  try {
    const rawUser = localStorage.getItem('dmart_user');
    if (rawUser && (rawUser.includes('tradingalmehdhar') || rawUser.includes('Al-Mehdhar'))) {
      localStorage.removeItem('dmart_user');
      localStorage.removeItem('dmart_buyer_registered');
      localStorage.removeItem('dmart_address');
      localStorage.removeItem('dmart_rider_app');
    }
  } catch {
    // ignore storage access errors
  }

  let rootElement = document.getElementById('root');
  if (!rootElement) {
    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
  }

  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </StrictMode>
  );
}

// Mount safely when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}

// Service Worker Management: Prevent caching conflicts in dev preview
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const isDev = Boolean(((import.meta as unknown) as { env?: { DEV?: boolean } }).env?.DEV);
  if (isDev) {
    // In dev mode, unregister any stale service workers that could intercept Vite modules
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    }).catch(() => {
      // Ignore unregister errors in sandboxed iframes
    });
  } else {
    // In production, register the PWA service worker
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[D-Mart PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[D-Mart PWA] Service Worker registration skipped:', err);
        });
    });
  }
}
