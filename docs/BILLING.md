# Google Play billing setup

The app has real Google Play subscription billing wired end to end
(`src/billing/`, `PremiumScreen`, and the backend `POST /api/billing/verify`). Three
things must be done outside the codebase before a real purchase can complete. None of
them can be done from a dev machine alone, so they are listed here as the last mile.

## What already works
- Connection, live price fetch, purchase flow, acknowledge, restore, and
  entitlement -> Premium, all in `src/billing/billing.ts`.
- Graceful fallback: in Expo Go and on web the native module is not loaded (guarded by
  `expo-constants` execution environment), so the paywall shows fallback prices and a
  local dev unlock instead of crashing.
- Backend records every purchase token idempotently (`server`, table `purchases`),
  ready for server-side verification.

## Last mile (you)

### 1. Create the subscription products in Play Console
Play Console -> your app -> Monetize -> Products -> Subscriptions. Create three, with
these EXACT product ids (they must match `src/billing/products.ts`):

| Product id | Base plan id | Billing period | Suggested price |
|---|---|---|---|
| `pawductivity_premium_monthly` | `monthly` | 1 month | Rp 15.000 |
| `pawductivity_premium_yearly` | `yearly` | 1 year | Rp 119.000 |
| `pawductivity_premium_6month` | `six-month` | Wait, Play has no 6 month period; use a custom billing period or drop this plan | Rp 69.000 |

Note: Google Play offers 1 month, 3 months, 6 months, 1 year and a few others as base
plan billing periods, so `six-month` is valid. Set each base plan to auto-renewing and
activate it. Price is whatever you choose; the app reads the live price from Play.

### 2. Build and upload a real build (Expo Go cannot do billing)
`react-native-iap` needs a native build.
```bash
npx expo install --check          # sanity
eas build -p android --profile production   # or a development build for testing
```
Upload the AAB to an internal or closed testing track and roll it out. Billing only
works for an app installed from a Play track, signed with the same key, matching the
`com.pawductivity.app` package.

### 3. Add licensed testers
Play Console -> Setup -> License testing: add the Google accounts that will test.
Testers also need to join the testing track. Only then will a purchase run in test mode
(no real charge) instead of failing.

## Optional but recommended: real server-side verification
`POST /api/billing/verify` currently records the token and returns `valid:true` without
cryptographic verification (it says so honestly: `verified:false`). To verify for real:

1. In Google Cloud, create a service account and grant it the Android Publisher API.
2. Link it in Play Console -> Setup -> API access.
3. In `server/src/handlers.mjs` `billingVerify`, call
   `GET https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.pawductivity.app/purchases/subscriptionsv2/tokens/{purchaseToken}`
   with the service-account OAuth token, and set `verified = 1` only when the response
   shows an active, non-expired subscription for the product.
4. Point the app at the deployed backend with `EXPO_PUBLIC_API_URL`.

Until then, the app grants Premium on Play's on-device confirmation (fine for a
cosmetic upgrade) and records the token for later reconciliation.
