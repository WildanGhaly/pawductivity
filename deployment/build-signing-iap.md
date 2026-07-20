# Android build, signing & in-app products

Templates and steps for producing a signed **AAB** and wiring the Premium subscription. These
assume an **Expo (managed) + EAS Build** pipeline (recommended for this app). Adapt package name /
prices to your decisions.

---

## 1. `app.json` — Android block (template)

Drop this into the rebuilt app's `app.json` (or `app.config.ts`). Icons/splash point at the asset
pack; copy the referenced files into the app's `assets/` at rebuild time.

```jsonc
{
  "expo": {
    "name": "Pawductivity",
    "slug": "pawductivity",
    "version": "1.0.0",                       // versionName shown to users
    "orientation": "portrait",
    "icon": "./assets/branding/logo-paw.png",
    "userInterfaceStyle": "light",            // app is light-only by design
    "splash": {
      "image": "./assets/branding/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#0C4C60"
    },
    "android": {
      "package": "com.production.pawductivity", // ← or your new package (deployment/README §0)
      "versionCode": 1,                          // ← integer; MUST increase every upload
      "adaptiveIcon": {
        "foregroundImage": "./assets/branding/logo-paw.png",
        "backgroundColor": "#0C4C60"
      },
      "permissions": [                            // see §2 for justification; keep this minimal
        "POST_NOTIFICATIONS",
        "RECEIVE_BOOT_COMPLETED",
        "WAKE_LOCK",
        "USE_EXACT_ALARM"                         // alarm/timer-app exact alarm (Android 13+)
      ],
      "blockedPermissions": [
        "com.google.android.gms.permission.AD_ID"  // keep "no Advertising ID" true
      ]
    }
  }
}
```

> If you reuse `com.production.pawductivity` on the **existing** listing, `versionCode` must be
> **higher than the last published build** — check the old release's versionCode in Play Console
> and set this above it.

## 2. Permissions — what each is for (Play will ask)

| Permission | Why Pawductivity needs it | Play note |
|---|---|---|
| `POST_NOTIFICATIONS` | reminders + focus-completion alerts (Android 13+ runtime prompt) | standard; requested at runtime |
| `RECEIVE_BOOT_COMPLETED` | re-schedule pending reminders/timer after reboot | standard |
| `WAKE_LOCK` | keep the screen awake while the timer screen is visible | standard |
| `USE_EXACT_ALARM` **or** `SCHEDULE_EXACT_ALARM` | fire the focus-completion + reminder at the exact time | ⚠️ **Exact-alarm needs a Play declaration.** Prefer **`USE_EXACT_ALARM`** — allowed without special review for apps whose core purpose is an alarm/timer/clock (a focus timer qualifies). `SCHEDULE_EXACT_ALARM` requires the exact-alarm form + justification. Pick one; don't ship both. |
| `INTERNET` | added automatically; used only by Google Play Billing (and any future opt-in AI) | no user data sent by the app itself |
| `com.android.vending.BILLING` | added by the IAP library | required for purchases |

**Do NOT** request: location, camera, contacts, storage, microphone, `AD_ID`. If a dependency
pulls one in, add it to `blockedPermissions` so the Data Safety "no data collected" story holds.

## 3. `eas.json` — build profiles (template)

```jsonc
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }     // shareable test APK
    },
    "production": {
      "android": { "buildType": "app-bundle" }  // AAB for Play upload
    }
  },
  "submit": {
    "production": {
      "android": {
        "track": "internal"                 // eas submit target track
        // "serviceAccountKeyPath": "./play-service-account.json"  // if you automate submission
      }
    }
  }
}
```

**Build the release AAB:**
```bash
npm i -g eas-cli
eas login
eas build:configure          # first time
eas build -p android --profile production    # → produces an .aab
# then either download the AAB and upload in Play Console, or:
eas submit -p android --profile production    # uploads to the internal track
```

> No EAS? You can `expo prebuild` and build the AAB with Gradle
> (`cd android && ./gradlew bundleRelease`), but you then manage the keystore yourself (§4, manual).

## 4. Signing

Two supported paths — **pick one**. Either way, enroll in **Play App Signing** (default for new
apps: Google holds the *app signing key*; you hold an *upload key*).

### Option A — EAS-managed keystore (recommended)
- On the first `eas build -p android`, EAS offers to **generate and securely store** your upload
  keystore. Accept. You never handle a keystore file; EAS keeps it.
- Retrieve/rotate later with `eas credentials`.
- ⚠️ It lives in your Expo account — secure that account (2FA). You can export a backup via
  `eas credentials` → download.

### Option B — Manual upload keystore (if you need the file yourself)
```bash
keytool -genkeypair -v \
  -keystore pawductivity-upload.keystore \
  -alias pawductivity-upload \
  -keyalg RSA -keysize 2048 -validity 9125 \
  -storetype PKCS12
# You'll be prompted for a store password + your details. Record them in a password manager.
```
- Reference it in EAS via `eas credentials`, or in `android/app/build.gradle` for a Gradle build.
- ⚠️⚠️ **Back this file + its passwords up off your machine.** If you lose the upload key you can
  request a reset (Play App Signing) — but if you're NOT on Play App Signing and lose the app
  signing key, **you can never update the app again.** This is the single highest-stakes item in
  the whole deployment.

### Reusing the legacy app?
- If the old `com.production.pawductivity` was enrolled in **Play App Signing**, you can generate a
  fresh upload key and keep updating the listing.
- If it was **not** enrolled and the original signing key is lost → you **cannot** update it; ship
  under a new package name (README §0).

## 5. In-app products — Premium subscription

**Path:** Play Console → Monetize → Products → **Subscriptions**. Requires a completed payments
profile (README §1.2) and at least one uploaded build (the product IDs must match the app's IAP
config).

**Create the subscription** (matches the business spec):
- **Product ID:** `pawductivity_premium`  *(keep this exact id — the app checks for it)*
- **Name:** Pawductivity Premium
- **Base plans (3 durations, auto-renewing):**

  | Base plan ID | Billing period | Notes |
  |---|---|---|
  | `premium-1m` | 1 month | |
  | `premium-6m` | 6 months | |
  | `premium-1y` | 1 year | best value |

- **Prices:** set per region **in the console** (not in the app). The legacy Midtrans figures
  (Rp 3 000 / 9 000 / 15 000) are *reference only* — set fresh Play prices.
- **What it unlocks (enforced in-app, not by Play):** premium species (Rabbit), premium foods
  (Pizza), premium outfits (Tuxedo, Star Shirt, Pink Dress), and the detailed stats view.
- Activate each base plan.

**Client library:** use **`react-native-iap`** or **RevenueCat** (RevenueCat also solves
server-side receipt verification without you running a server — the one thing that otherwise wants
a backend). Cache the resolved entitlement + expiry locally (MMKV) and evaluate expiry lazily on
app open; degrade to `basic` offline.

### (Optional) Coin packs — `[DECIDE]`
The economy spec leaves "sell coins for real money?" open. If yes, create **consumable** in-app
products (Play Console → Products → In-app products), e.g. `coins_small` / `coins_medium` /
`coins_large`, and only credit coins after a **verified** purchase. If you're unsure, ship
Premium-only first and add coin packs later.

### Testing IAP
- Add testers under **Setup → License testing** (their Google accounts get test purchases).
- Upload the app to **Internal testing** first; IAP only works for accounts on a testing track
  with matching product IDs.

---

## 6. Definition of done (deployment)
- [ ] Package name decided; `versionCode`/`versionName` set.
- [ ] Signing chosen + **backed up**; Play App Signing enrolled.
- [ ] AAB builds cleanly (`eas build -p android --profile production`).
- [ ] `pawductivity_premium` + base plans created and active; entitlement works in a test purchase.
- [ ] Store listing, privacy policy URL, Data safety, content rating, target audience all submitted.
- [ ] Internal-testing smoke test passes on a real device (timer survives backgrounding; reminders
      fire; purchase + restore work).
- [ ] Promote to production with a staged rollout.
