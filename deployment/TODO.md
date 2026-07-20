# Play Store — chip-away TODO

Ordered so you can do it in small sessions. Tick as you go. Each chunk says whether it needs the
app to exist yet — **most of it doesn't**, so you can make real progress while the rebuild happens.

Legend: 🧑 you (console/browser) · 🤖 I can do it · ⏱️ rough effort

---

## ⚠️ Read this first — the long pole

Google requires **new *personal* developer accounts** (created after ~Nov 2023) to run a **closed
test with at least 12 testers opted in continuously for 14 days** before you can apply for
production access. Organization accounts are exempt.

**So:** if you're starting a brand-new personal account, the 14-day clock is the schedule
bottleneck — not the code. Get *any* signed build into closed testing early (Chunk C) and start
the clock while you build the real app. If you still have the account from the legacy launch,
this likely doesn't apply — confirm in Chunk A.

---

## Chunk A — Recon & decisions  ⏱️ ~15 min · 🧑 · no app needed
The whole plan branches on these. Do this first.

- [ ] Log into [Play Console](https://play.google.com/console). Account exists? **Personal or Organization?**
- [ ] Does the old listing `com.production.pawductivity` still exist, and do you have access?
- [ ] If yes → Setup → **App signing**: is it enrolled in **Play App Signing**?
- [ ] If yes → note the **last published `versionCode`** (your next upload must be higher).
- [ ] **Decide:** reuse `com.production.pawductivity` (keeps ratings/installs) or a **new package**.
- [ ] If no account yet → create one ($25 one-time) and start **identity verification** (can take days).

> Reuse is only possible if it's on Play App Signing **or** you still hold the original signing key.
> Otherwise: new package.

## Chunk B — Paperwork  ⏱️ ~2–3 h (splittable) · 🧑 · **no app needed**
All the copy/answers are already written — this is mostly pasting.

- [ ] **Host the privacy policy** → get a public URL. Source: `privacy-policy.md` (fill the
      `[DATE]`, `[YOUR NAME]`, `[SUPPORT EMAIL]` placeholders first).
- [ ] Create the app in Play Console (name **Pawductivity**, en-US, App, Free).
- [ ] **Main store listing** — paste name / short desc / full desc from `store-listing.md`.
- [ ] **App icon** 512×512 (export from `_pawductivity-assets/branding/logo-paw.png` on `#0C4C60`).
- [ ] **Feature graphic** 1024×500 — needs designing (spec in `store-listing.md`).
- [ ] **Privacy policy URL** → App content.
- [ ] **Data safety** form → answers in `play-console-forms.md` §1 ("No data collected").
- [ ] **Content rating** questionnaire → answers in §2 (expect Everyone/3+).
- [ ] **Target audience** (13+), **Ads** (No), **App access** (no login), gov/financial/health (No) → §3.
- [ ] Store settings: category **Productivity**, Free, countries.

> Screenshots (min 2) are required to *publish*, not to fill the listing — they come in Chunk F.

## Chunk C — Pipeline dry-run  ⏱️ ~half day · 🤖 code + 🧑 upload · needs a *minimal* app
**Highest-value early step.** Proves signing, package name, and the review pipeline work — and
starts the 14-day testing clock — long before the real app is done.

- [ ] 🤖 Scaffold a minimal Expo app with the chosen package name + `app.json`/`eas.json`
      (templates ready in `build-signing-iap.md` §1/§3).
- [ ] 🧑 `eas login`, `eas build:configure`, let EAS generate + store the **upload keystore**.
- [ ] ⚠️ **Back up the keystore / secure the Expo account.** Lose it = can't update the app ever.
- [ ] `eas build -p android --profile production` → get the **AAB**.
- [ ] 🧑 Upload to **Internal testing**, add yourself as a tester, install from the Play link.
- [ ] 🧑 Enroll in **Play App Signing** (default for new apps).

## Chunk D — Monetization  ⏱️ ~1 h · 🧑 · needs a build uploaded first
- [ ] **Payments profile** (Setup → Payments) — required for paid products; verification takes time.
- [ ] Create subscription **`pawductivity_premium`** + base plans `premium-1m` / `premium-6m` /
      `premium-1y` (steps in `build-signing-iap.md` §5).
- [ ] Set prices per region (in console, not in the app).
- [ ] Add **License testers** (Setup → License testing) so purchases are free for you.
- [ ] *(Optional, `[DECIDE]`)* coin packs as consumables — or skip for v1.

## Chunk E — Testing gate  ⏱️ 14+ days elapsed · 🧑 · the clock
- [ ] Create a **Closed testing** track; recruit **12+ testers** (email list or Google Group).
- [ ] Keep them **opted in continuously for 14 days** (they must actually stay enrolled).
- [ ] Then **apply for production access** (new personal accounts only).

## Chunk F — Real release  ⏱️ · **blocked until the app is rebuilt**
- [ ] Rebuild the app (spec + assets are in the repo).
- [ ] **Screenshots** (2–8) — shot list in `store-listing.md`.
- [ ] Integrate IAP (`react-native-iap` or RevenueCat) + verify purchase **and restore**.
- [ ] Smoke test on a real device: timer survives backgrounding/reboot, reminders fire, purchase works.
- [ ] Bump `versionCode`, build the final AAB.
- [ ] Promote Internal → Closed → **Production** with a staged rollout (start ~10–20%).

---

## Suggested first three sessions
1. **Chunk A** (15 min) — unblocks everything; tells you if the 14-day gate applies.
2. **Chunk B** (split over 2–3 sittings) — all the paperwork, zero code.
3. **Chunk C** — minimal build into internal/closed testing to validate signing and start the clock.

Then Chunk D while the rebuild happens, and Chunk F when the app is real.
