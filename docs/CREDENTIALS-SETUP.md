# Getting the credentials (Google Sign-In + Play Billing)

Two things need YOUR accounts. Everything in the app code is ready to consume them;
these are console steps only. Package name is **`com.pawductivity.app`**.

Your **upload key** fingerprints (from `credentials/android/keystore.jks`):
- SHA-1:  `9C:97:1C:D9:C3:39:2E:3C:90:4C:2C:D9:A2:68:C1:8F:BE:19:41:0B`
- SHA-256: `51:B0:7E:E5:22:09:50:51:C1:35:E7:BE:A2:CA:1B:7F:8E:3B:C6:32:C2:55:77:EF:A0:67:3B:A4:6A:A6:E2:A3`

> After your first upload, Play re-signs with its own **App Signing** key. Get THAT
> cert's SHA-1 from **Play Console → your app → Setup → App integrity → App signing**
> and add it too (installs from the Play Store use the App Signing cert, sideloaded/
> internal builds use your upload cert — register both).

---

## A. Google Sign-In (OAuth) — ~15 min

1. **Google Cloud Console** (https://console.cloud.google.com) → create a project
   (e.g. "Pawductivity") or reuse one.
2. **APIs & Services → OAuth consent screen**:
   - User type: **External** → Create.
   - App name "Pawductivity", your support email, developer email. Save.
   - Scopes: add `.../auth/userinfo.email` and `.../auth/userinfo.profile` (and
     `openid`). Save.
   - Add yourself under **Test users** (so you can sign in before it's verified).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**, make TWO:
   - **Android**: package `com.pawductivity.app`, SHA-1 = the upload SHA-1 above
     (and later add the Play App Signing SHA-1). This authorizes the app.
   - **Web application**: name it "Pawductivity Web". Copy its **Client ID** — this
     is the `webClientId` the app needs to get an ID token. (No redirect URI needed
     for native Google Sign-In.)
4. **Give me the Web client ID.** The app wires
   `@react-native-google-signin/google-signin` with `webClientId: <that id>`; sign-in
   then returns a real Google account + ID token instead of the current mock.
   - Nothing to paste into a public place; it lives in `app.json` extra / env.

---

## B. Google Play Billing (subscriptions) — needs a payments profile

Prereqs: the app must already exist in Play Console with at least one uploaded build
(you have the AAB in `dist/`), and a **payments profile**.

1. **Play Console → Setup → Payments profile**: create your Google Payments merchant
   account (business name, address, tax + bank details). Subscriptions can't be
   created until this exists.
2. **Play Console → your app → Monetize → Products → Subscriptions → Create
   subscription.** Create THREE, with these EXACT product IDs (the app queries them):
   | Product ID | Base plan | Billing period |
   |---|---|---|
   | `pawductivity_premium_monthly` | auto-renewing | 1 month |
   | `pawductivity_premium_6month`  | auto-renewing | 6 months |
   | `pawductivity_premium_yearly`  | auto-renewing | 1 year |
   Set a price per region for each base plan, then **Activate** each.
3. **License testing** (test purchases without being charged):
   **Play Console → Setup → License testing** → add your tester Gmail account(s) →
   set "License response" to RESPOND_NORMALLY. Also add those testers to your
   **Internal testing** track. IAP only works for accounts on a testing track with
   matching product IDs, on a build downloaded from that track.
4. (Optional, for automated `eas submit` / server-side receipt checks) **Setup → API
   access** → link a Google Cloud project → create a **service account** → grant it
   the Play permissions → download the JSON key → save it as
   `credentials/play-service-account.json` (gitignored). Then `eas.json`'s submit
   config picks it up.

Once the 3 products are **active** and your account is a licensed tester on the
track, the Premium screen shows live prices and a real Buy flow (the code already
uses `react-native-iap`; only Play Console setup is missing).

---

## What to hand back
- **Google Web client ID** (from A.3) — unblocks real Google sign-in.
- Confirmation the **3 subscription IDs above are active** + your tester email — unblocks real billing.
- (Optional) `credentials/play-service-account.json` — unblocks automated submit.
