import { isSupported, getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { firebaseApp, db } from '../firebase_config';
import { OrderStatusNotification } from '../types';

let messagingInstance: Messaging | null = null;
let isFcmSupported: boolean | null = null;

const FCM_TOKEN_STORAGE_KEY = 'dmart_fcm_token';
const NOTIFICATIONS_STORAGE_KEY = 'dmart_order_notifications';

/**
 * Checks if Firebase Cloud Messaging is supported in current environment
 */
export async function checkFcmSupport(): Promise<boolean> {
  if (isFcmSupported !== null) return isFcmSupported;
  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) {
      isFcmSupported = false;
      return false;
    }
    isFcmSupported = await isSupported();
    return isFcmSupported;
  } catch (err) {
    console.warn('[FCM] Error checking support:', err);
    isFcmSupported = false;
    return false;
  }
}

/**
 * Registers Service Worker for Firebase Cloud Messaging
 */
export async function registerFcmServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    console.log('[FCM] Service Worker registered with scope:', reg.scope);
    return reg;
  } catch (err) {
    console.warn('[FCM] Service worker registration note (normal in restricted iframes):', err);
    return null;
  }
}

/**
 * Request browser push notification permission
 */
export async function requestPushNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Attempt to retrieve FCM token once permission is granted
      await retrieveFcmToken();
    }
    return permission;
  } catch (err) {
    console.warn('[Notification] requestPermission error:', err);
    return 'denied';
  }
}

/**
 * Retrieves FCM device registration token
 */
export async function retrieveFcmToken(): Promise<string | null> {
  try {
    const supported = await checkFcmSupport();
    if (!supported) return null;

    if (!messagingInstance) {
      messagingInstance = getMessaging(firebaseApp);
    }

    const swReg = await registerFcmServiceWorker();
    const token = await getToken(messagingInstance, {
      serviceWorkerRegistration: swReg || undefined,
    });

    if (token) {
      localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
      await saveFcmTokenToFirestore(token);
      return token;
    }
  } catch (err) {
    console.warn('[FCM] Token retrieval note:', err);
  }
  return null;
}

/**
 * Store FCM token in Firestore for targeted push notifications
 */
export async function saveFcmTokenToFirestore(token: string, userEmail?: string): Promise<void> {
  try {
    const tokenDocId = token.slice(0, 32);
    const tokenRef = doc(db, 'dmart_fcm_tokens', tokenDocId);
    await setDoc(
      tokenRef,
      {
        token,
        userEmail: userEmail || 'guest',
        updatedAt: new Date().toISOString(),
        platform: 'web',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[FCM] saveFcmTokenToFirestore fallback:', err);
  }
}

/**
 * Initialize FCM foreground message listener
 */
export async function setupFcmForegroundListener(
  onNotification: (payload: { title: string; body: string; data?: Record<string, string> }) => void
): Promise<(() => void) | null> {
  try {
    const supported = await checkFcmSupport();
    if (!supported) return null;

    if (!messagingInstance) {
      messagingInstance = getMessaging(firebaseApp);
    }

    const unsubscribe = onMessage(messagingInstance, (payload) => {
      console.log('[FCM] Received foreground push message:', payload);
      const title = payload.notification?.title || payload.data?.title || 'Order Update';
      const body = payload.notification?.body || payload.data?.body || 'Your order status has transitioned.';
      onNotification({ title, body, data: payload.data });
    });

    return unsubscribe;
  } catch (err) {
    console.warn('[FCM] onMessage setup note:', err);
    return null;
  }
}

/**
 * Trigger native browser notification if permission is granted
 */
export function triggerNativeBrowserNotification(
  title: string,
  body: string,
  orderNumber?: string
): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: orderNumber ? `dmart-order-${orderNumber}` : 'dmart-notification',
    });
  } catch (err) {
    console.warn('[Notification] native push trigger fallback:', err);
  }
}

/**
 * Load stored notifications history from localStorage
 */
export function getStoredNotifications(): OrderStatusNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return [];
}

/**
 * Save notification to history
 */
export function saveNotificationToHistory(notification: OrderStatusNotification): OrderStatusNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getStoredNotifications();
    const updated = [notification, ...existing.filter((n) => n.id !== notification.id)].slice(0, 30);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Clear stored notifications
 */
export function clearStoredNotifications(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
  } catch {}
}
