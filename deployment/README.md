# Pawductivity — Google Play deployment runbook

The complete, sequenced todo list to ship Pawductivity to Google Play, with each item marked:

- ✅ **Prepared here** — the artifact/answer is written in this `deployment/` folder; paste/use it.
- 🧑 **You, in the console** — only you can do it (account, forms, uploads); the content to use is prepared.
- ⛔ **Blocked on the app** — needs the rebuilt app + a build (AAB) or real screenshots first.

> **Reality check:** the repo now holds a **buildable Expo shell** (placeholder UI) plus the asset
> pack — enough to produce a real AAB and validate signing/upload/review while the actual app is
> rebuilt. Everything account-, copy-, policy-, and config-shaped is prepared below. Only the
> *final* release bits (real screenshots, IAP smoke test) genuinely wait on the finished app.

---

## 0. Package name — ✅ DECIDED: `com.pawductivity.app`

The legacy `com.production.pawductivity` is **permanently unavailable** — Play Console rejected it
with *"This package name is already in use"*, and Google never releases a package name that has
been published, even after an app is deleted or unpublished. It stays with the old developer
account.

So Pawductivity ships as a **brand-new listing** under **`com.pawductivity.app`**
(set in `app.json` → `android.package` and `ios.bundleIdentifier`).

Consequences to plan around:
- **No inherited ratings, reviews, or install count** — starting from zero.
- **Nothing to reuse from the old signing key** — we generate a fresh upload key (§5).
- **The 12-tester / 14-day closed-testing gate applies** if this is a new *personal* developer
  account (see [`TODO.md`](TODO.md)). Start that clock early.

⚠️ The package name is **permanent** once the app is created in Play Console, and it must match
`app.json` exactly or uploads are rejected.

---

## 1. Account & app shell  🧑

| # | Todo | Status | Notes |
|---|---|---|---|
| 1.1 | Google Play Developer account ($25 one-time) | 🧑 | play.google.com/console — note personal vs organization (affects the 14-day testing gate) |
| 1.2 | Payments/merchant profile (required for paid IAP) | 🧑 | Needed for the premium subscription. Play Console → Setup → Payments profile |
| 1.3 | Create the app in Play Console | 🧑 | Name **Pawductivity**, package `com.pawductivity.app`, en-US, **App** (not Game), **Free** |
| 1.4 | App package name | ✅ decided (§0) | `com.pawductivity.app` — fresh listing |

## 2. Store listing (Main store listing)  ✅ content ready → 🧑 paste

| # | Todo | Status | Where |
|---|---|---|---|
| 2.1 | App name (≤30), short desc (≤80), full desc (≤4000) | ✅ | [`store-listing.md`](store-listing.md) |
| 2.2 | App category + tags + contact details | ✅ | [`store-listing.md`](store-listing.md) |
| 2.3 | App icon 512×512 PNG | ✅ spec / 🧑 export | from `logo-paw.png` — see `store-listing.md` §Graphics |
| 2.4 | Feature graphic 1024×500 PNG | 🧑 (design) | template/spec in `store-listing.md` §Graphics |
| 2.5 | Phone screenshots (2–8, 16:9 or 9:16) | ⛔ | capture from the rebuilt app; shot list in `store-listing.md` |
| 2.6 | (Optional) short promo video | 🧑 | not required |

## 3. Policy & declarations (App content)  ✅ answers ready → 🧑 submit

| # | Todo | Status | Where |
|---|---|---|---|
| 3.1 | **Privacy policy** (public URL required) | ✅ text / 🧑 host | [`privacy-policy.md`](privacy-policy.md) — host it, paste the URL |
| 3.2 | **Data safety** form | ✅ answers | [`play-console-forms.md`](play-console-forms.md) §1 |
| 3.3 | **Content rating** (IARC questionnaire) | ✅ answers | [`play-console-forms.md`](play-console-forms.md) §2 |
| 3.4 | Target audience & content (age groups) | ✅ answers | [`play-console-forms.md`](play-console-forms.md) §3 |
| 3.5 | Ads declaration (contains ads?) | ✅ **No ads** | §3 |
| 3.6 | News / COVID / financial / health declarations | ✅ **all N/A** | §3 |
| 3.7 | Government-app / financial-features declarations | ✅ **No** | §3 |
| 3.8 | Data deletion / account deletion URL | ✅ **N/A (no accounts)** — state it | §1 |

## 4. Android build config  ✅ templates ready

| # | Todo | Status | Where |
|---|---|---|---|
| 4.1 | `app.json`/`app.config` Android block (package, versionCode/Name, adaptive icon, splash) | ✅ template | [`build-signing-iap.md`](build-signing-iap.md) §1 |
| 4.2 | Declared permissions (+ justifications) | ✅ list | §2 (POST_NOTIFICATIONS, exact-alarm, boot, wake-lock, billing) |
| 4.3 | `eas.json` build profiles | ✅ template | §3 |
| 4.4 | Target/compile SDK meets Play's current minimum | ✅ note | Expo SDK 5x default satisfies it; confirm at build time |

## 5. Signing  ✅ steps ready → 🧑 execute

| # | Todo | Status | Where |
|---|---|---|---|
| 5.1 | Choose signing: **EAS-managed keystore** (recommended) or manual `keytool` | ✅ both documented | [`build-signing-iap.md`](build-signing-iap.md) §4 |
| 5.2 | Enroll in **Play App Signing** | 🧑 | Play Console → Setup → App signing (default for new apps) |
| 5.3 | Back up the upload key / EAS credentials off-machine | 🧑 ⚠️ | lose it = can't update the app |

## 6. In-app products (Monetize)  ✅ setup steps ready → 🧑 create

| # | Todo | Status | Where |
|---|---|---|---|
| 6.1 | Subscription `pawductivity_premium` + base plans (1mo/6mo/1yr) | ✅ steps | [`build-signing-iap.md`](build-signing-iap.md) §5 |
| 6.2 | Set prices per region | 🧑 | Play Console (not in the app) |
| 6.3 | (Optional) coin packs as consumables | ✅ noted / 🧑 decide | §5 — economy `[DECIDE]` |
| 6.4 | License/IAP testers | 🧑 | Play Console → Setup → License testing |

## 7. Build → test → release  🟡 the shell builds now; final release waits on the real app

| # | Todo | Status |
|---|---|---|
| 7.1 | Build a signed **AAB** (`eas build -p android --profile production`) | 🧑 ready now |
| 7.2 | Upload to **Internal testing** track; smoke test on a device | 🧑 ready now |
| 7.3 | Verify IAP purchase/restore against a test account | ⛔ |
| 7.4 | Promote → Closed → Open testing (optional) | ⛔ |
| 7.5 | Production release (staged rollout %) | ⛔ |

---

## Suggested order

1. ~~§0 package decision~~ ✅ → §1 create the account + app under `com.pawductivity.app`.
2. §7.1–7.2 **early**: build the shell's AAB and get it into internal/closed testing — that starts
   the 12-tester / 14-day clock while the real app is still being written.
3. In parallel: §2 listing text, §3 all policy forms (host the privacy policy), §5 signing, §6 IAP.
4. When the real app lands: real screenshots, IAP smoke test, then production rollout.

## Files in this folder

- [`COPY-PASTE.md`](COPY-PASTE.md) — **the fill-in sheet.** Every Play Console field → value to paste, screen by screen. Start here when filling forms.
- [`store-listing.md`](store-listing.md) — name, descriptions, category, graphics spec + screenshot list.
- [`privacy-policy.md`](privacy-policy.md) — ready-to-host privacy policy.
- [`play-console-forms.md`](play-console-forms.md) — Data Safety, Content Rating, App Content answers.
- [`build-signing-iap.md`](build-signing-iap.md) — Android config, permissions, signing, EAS, IAP.
