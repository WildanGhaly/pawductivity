// Web build of the billing module. There is no in-app purchasing on web, and
// react-native-iap must never be bundled here (it would break the web bundle), so
// this file provides the same API surface with everything reporting unavailable.
import { BillingPlan, PurchaseOutcome } from './types';
export type { BillingPlan, PurchaseOutcome } from './types';

export function isBillingSupported(): boolean {
  return false;
}
export async function connectBilling(): Promise<boolean> {
  return false;
}
export async function disconnectBilling(): Promise<void> {}
export async function fetchPlans(): Promise<BillingPlan[]> {
  return [];
}
export function purchasePlan(): Promise<PurchaseOutcome> {
  return Promise.resolve({ status: 'unavailable' });
}
export async function activeSubscriptions(): Promise<string[]> {
  return [];
}
export async function hasPremiumEntitlement(): Promise<boolean> {
  return false;
}
