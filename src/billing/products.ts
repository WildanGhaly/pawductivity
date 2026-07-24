// Google Play subscription products for Pawductivity Premium.
//
// These ids must match the subscription ids created in the Play Console exactly.
// Play is the source of truth for price and currency; the `fallbackPrice` values are
// only shown when the store cannot be reached (offline, or running in Expo Go where
// the billing module is unavailable) so the paywall never renders blank.

export interface PremiumPlan {
  /** Play Console subscription id */
  id: string;
  /** Base plan id inside the subscription (Play Billing v5+) */
  basePlanId: string;
  title: string;
  subtitle: string;
  fallbackPrice: string;
  fallbackPeriod: string;
  /** Marked as the recommended plan in the paywall */
  best?: boolean;
}

export const PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: 'pawductivity_premium_monthly',
    basePlanId: 'monthly',
    title: '1 Month',
    subtitle: 'Try it out',
    fallbackPrice: 'Rp 15.000',
    fallbackPeriod: '/month',
  },
  {
    id: 'pawductivity_premium_yearly',
    basePlanId: 'yearly',
    title: '1 Year',
    subtitle: 'Rp 9.900 / month',
    fallbackPrice: 'Rp 119.000',
    fallbackPeriod: '/year',
    best: true,
  },
  {
    id: 'pawductivity_premium_6month',
    basePlanId: 'six-month',
    title: '6 Months',
    subtitle: 'Rp 11.500 / month',
    fallbackPrice: 'Rp 69.000',
    fallbackPeriod: '/6 mo',
  },
];

export const PREMIUM_SKUS = PREMIUM_PLANS.map((p) => p.id);

export function planForSku(sku: string): PremiumPlan | undefined {
  return PREMIUM_PLANS.find((p) => p.id === sku);
}
