// Google Play billing for Pawductivity Premium (subscriptions), via react-native-iap.
//
// Design constraints that shape every line here:
//  - The IAP native module does NOT exist in Expo Go or on web. So the module is loaded
//    lazily inside try/catch and every entry point degrades to an "unavailable" result
//    rather than throwing. This keeps the app runnable in Expo Go for development.
//  - A subscription is only granted after Play confirms and (when reachable) the backend
//    verifies the purchase token. Play remains the source of truth for price and status.
//  - Nothing here consumes the purchase: subscriptions are acknowledged, not consumed.
import { Platform } from 'react-native';
import { PREMIUM_SKUS } from './products';
import { BillingPlan, PurchaseOutcome } from './types';

export type { BillingPlan, PurchaseOutcome } from './types';

let iap: any = null;
let connected = false;
let updateSub: any = null;
let errorSub: any = null;

// Resolves the react-native-iap module once, or null if it is not present in this
// runtime (Expo Go, web, or a build without the native module linked).
function loadIap(): any {
  if (iap) return iap;
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return null;
  try {
    // Static require so Metro bundles it; the try/catch handles the native module
    // being absent at runtime (Expo Go), where accessing it throws.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    iap = require('react-native-iap');
    return iap;
  } catch (e) {
    console.warn('[billing] react-native-iap unavailable (expected in Expo Go / web):', e);
    return null;
  }
}

export function isBillingSupported(): boolean {
  return !!loadIap();
}

/** Opens the billing connection. Safe to call repeatedly. Returns false if unsupported. */
export async function connectBilling(): Promise<boolean> {
  const m = loadIap();
  if (!m) return false;
  if (connected) return true;
  try {
    await m.initConnection();
    connected = true;
    return true;
  } catch (e) {
    console.warn('[billing] initConnection failed:', e);
    return false;
  }
}

export async function disconnectBilling(): Promise<void> {
  const m = loadIap();
  if (!m || !connected) return;
  try {
    updateSub?.remove?.();
    errorSub?.remove?.();
    updateSub = null;
    errorSub = null;
    await m.endConnection();
  } catch {
    // best effort
  } finally {
    connected = false;
  }
}

/** Fetches the Premium subscription plans with live Play prices. Empty if unsupported. */
export async function fetchPlans(): Promise<BillingPlan[]> {
  const m = loadIap();
  if (!m) return [];
  try {
    if (!connected) await connectBilling();
    const products = await m.fetchProducts({ skus: PREMIUM_SKUS, type: 'subs' });
    return (products || []).map((p: any) => {
      // Android subscriptions expose one or more offers; take the first offer's
      // token and its first pricing phase for the display price.
      const offers = p.subscriptionOfferDetailsAndroid || p.subscriptionOfferDetails || [];
      const offer = offers[0];
      const phase = offer?.pricingPhases?.pricingPhaseList?.[0] || offer?.pricingPhases?.[0];
      return {
        sku: p.id ?? p.productId ?? p.sku,
        price: phase?.formattedPrice || p.displayPrice || p.localizedPrice || '',
        offerToken: offer?.offerToken,
      } as BillingPlan;
    });
  } catch (e) {
    console.warn('[billing] fetchPlans failed:', e);
    return [];
  }
}

/**
 * Launches the subscription purchase flow and resolves once Play reports the result.
 * On success the purchase is acknowledged (not consumed). The caller should still
 * verify the returned purchaseToken with the backend before granting entitlement.
 */
export function purchasePlan(sku: string, offerToken?: string): Promise<PurchaseOutcome> {
  const m = loadIap();
  if (!m) return Promise.resolve({ status: 'unavailable' });

  return new Promise<PurchaseOutcome>(async (resolve) => {
    let settled = false;
    const done = (o: PurchaseOutcome) => {
      if (settled) return;
      settled = true;
      updateSub?.remove?.();
      errorSub?.remove?.();
      updateSub = null;
      errorSub = null;
      resolve(o);
    };

    try {
      if (!connected) {
        const ok = await connectBilling();
        if (!ok) return done({ status: 'unavailable' });
      }

      updateSub = m.purchaseUpdatedListener(async (purchase: any) => {
        const token = purchase?.purchaseTokenAndroid || purchase?.purchaseToken || purchase?.transactionReceipt;
        try {
          // Acknowledge so Play does not auto-refund after a few days. Subscriptions
          // are never consumed.
          await m.finishTransaction({ purchase, isConsumable: false });
        } catch (e) {
          console.warn('[billing] finishTransaction failed:', e);
        }
        done({ status: 'purchased', sku, purchaseToken: token || '' });
      });

      errorSub = m.purchaseErrorListener((err: any) => {
        const code = err?.code || '';
        if (code === 'E_USER_CANCELLED' || code === 'user-cancelled') return done({ status: 'cancelled' });
        done({ status: 'error', message: err?.message || 'Purchase failed' });
      });

      // v15 request shape: subscriptions need the Android offer token.
      await m.requestPurchase({
        type: 'subs',
        request: {
          android: {
            skus: [sku],
            subscriptionOffers: offerToken ? [{ sku, offerToken }] : undefined,
          },
          ios: { sku },
        },
      });
    } catch (e: any) {
      done({ status: 'error', message: e?.message || 'Purchase failed' });
    }
  });
}

/** Returns the SKUs the user currently owns an active subscription for. */
export async function activeSubscriptions(): Promise<string[]> {
  const m = loadIap();
  if (!m) return [];
  try {
    if (!connected) await connectBilling();
    const actives = await m.getActiveSubscriptions(PREMIUM_SKUS);
    return (actives || []).map((a: any) => a.productId || a.sku || a.id).filter(Boolean);
  } catch (e) {
    console.warn('[billing] activeSubscriptions failed:', e);
    return [];
  }
}

/** True if the user owns any Premium subscription right now. */
export async function hasPremiumEntitlement(): Promise<boolean> {
  const skus = await activeSubscriptions();
  return skus.length > 0;
}
