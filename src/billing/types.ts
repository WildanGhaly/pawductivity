// Shared billing types, imported by both the native and web billing modules so the
// web stub does not have to import from its own platform sibling.

export interface BillingPlan {
  sku: string;
  /** Localised price string straight from Play, e.g. "Rp 15.000". */
  price: string;
  /** Android subscription offer token, needed to launch the purchase flow. */
  offerToken?: string;
}

export type PurchaseOutcome =
  | { status: 'purchased'; sku: string; purchaseToken: string }
  | { status: 'cancelled' }
  | { status: 'unavailable' }
  | { status: 'error'; message: string };
