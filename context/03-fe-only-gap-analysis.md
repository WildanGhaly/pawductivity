# 03 — FE-Only Gap Analysis (React Native, No Backend)

> **Purpose.** The rebuild ships the **full Pawductivity feature set as a React Native / Expo front-end with no backend server**. This doc analyses every business process against that constraint and reports the **gaps** — where "no backend" collides with "full feature set" — plus the concrete FE-only way to close (or consciously defer) each one. Read alongside [00-product-vision](00-product-vision.md), [02-open-decisions](02-open-decisions.md), and [migration/backend-to-local-first](migration/backend-to-local-first.md).

---

## 0. Bottom line (read this first)

**Yes — ~95% of the product ships FE-only with no compromise.** The entire core loop (companion, quests, Focus timer, reminders, calendar, coins, shop, feeding, wardrobe, XP/levels, streaks, premium gating, insights) is pure on-device computation and needs **zero** server. Everything the legacy Go backend did for those systems (coin grants, XP curve, health decay, membership expiry, stats aggregation) is a **local calculation over expo-sqlite + MMKV** — already specified in [migration/backend-to-local-first](migration/backend-to-local-first.md).

**Only three capabilities genuinely want a shared/authoritative party**, and each has a clean FE-only answer:

| Capability | Why it resists FE-only | FE-only resolution (recommended) |
|---|---|---|
| **AI: Brain Dump parser + dynamic Lottie** | A pure client **cannot safely hold the Anthropic API key**, and the brain-dump text **leaves the device** (breaks strict local-first privacy). A key-holding proxy *is* a backend. | **Ship the rules-based engine now** (regex/heuristic parse + deterministic mood→animation) — 100% FE-only and already the designed fallback. Treat cloud-LLM AI as an **opt-in enhancement** delivered via **BYO-key** (truly zero-backend) or a later minimal proxy. **[DECIDE] D22–D25** |
| **Referral (invite-a-friend)** | Attributing "user A referred user B" **inherently links two devices** — impossible without a shared service. | **Defer from MVP** (recommended), or ship a **deep-link self-claim** promo with **no cross-user verification** (accept abuse) as a marketing-only feature. **[DECIDE] D9–D11** |
| **Premium / IAP entitlement** | Google Play receipt verification wants a server-held `service_account.json`. | **Not a real blocker:** use **RevenueCat** (hosted — *not a server we operate*) for real verification, or **react-native-iap client-trust** cached in MMKV (spoofable but the gate is low-value cosmetics). **[DECIDE] D5–D8** |

The single honest casualty of "no backend at all" is **cloud-LLM AI** — the two headline **[NEW]** features. The app remains fully functional without it (rules-based fallbacks), but the *smart* experience needs BYO-key or an eventual thin proxy. Plan around that explicitly.

---

## 1. How to read the verdicts

Every feature below gets a traffic-light FE-only verdict:

| Light | Meaning |
|---|---|
| 🟢 **Native-local** | Fully doable on-device with expo-sqlite / MMKV / Zustand / Expo APIs. No server, no compromise. The bulk of the app. |
| 🟡 **Local workaround** | Doable FE-only, but the removed server changes the design or reliability — needs a specific technique (timestamp math, scheduled notifications, entitlement cache) or an accepted trade-off. |
| 🔴 **Wants a server** | Fundamentally needs a shared/authoritative/secret-holding party. Must be dropped, deferred, degraded, or delegated to a hosted SDK (not our own backend). |

Server responsibilities do **not** disappear — they **relocate**:
- Relational reads/writes → **expo-sqlite**.
- Settings, ephemeral & cached state → **react-native-mmkv (+ Zustand)**.
- Nightly cron jobs (health decay, membership expiry) → **lazy timestamp catch-up on app open/resume**.
- Server-computed rewards/curves → **TypeScript functions inside one SQLite transaction**.

---

## 2. Feature inventory — FE-only verdict for every business process

### 2a. Core loop — 🟢 all native-local, zero server

| Feature | Verdict | FE-only realization | Skill |
|---|---|---|---|
| **Companion** (species, adopt/purchase, rename, evolution stage, mood) | 🟢 | SQLite `pet`/`animal` rows + Lottie selection from state | [pet-companion-system](../.claude/skills/pet-companion-system/SKILL.md) |
| **Health & decay** (−1/day midnight, floor 0, cap 100 on feed) | 🟢 | Lazy catch-up from `pet.last_health_decay_at` on app open — replaces the cron | [pet-companion-system](../.claude/skills/pet-companion-system/SKILL.md) |
| **Quests** (Target / Checklist / Focus, tags, priority, due, recurrence, lifecycle) | 🟢 | SQLite `task` + child rows; all state transitions local | [task-quest-system](../.claude/skills/task-quest-system/SKILL.md) |
| **Focus Session timer** | 🟡 | See §3.4 — timestamp-authoritative, OS background limits | [focus-timer-and-background](../.claude/skills/focus-timer-and-background/SKILL.md) |
| **Reminders** (once/weekly/monthly/yearly) | 🟡 | `expo-notifications` scheduled locally + reschedule-on-boot | [reminders-and-calendar](../.claude/skills/reminders-and-calendar/SKILL.md) |
| **Calendar / activity / checklist heatmap** | 🟢 | On-device SQLite date-aggregate queries over `daily_log` | [reminders-and-calendar](../.claude/skills/reminders-and-calendar/SKILL.md) |
| **Coins** (earn on completion, level-up grant, spend) | 🟢 | Local `coin_ledger` transactions; `buy_coins`/`level_up` procs → TS | [coin-economy-and-shop](../.claude/skills/coin-economy-and-shop/SKILL.md) |
| **Shop** (pets/food/clothes catalogs + purchase) | 🟢 | Seeded catalog tables + local coin debit transaction | [coin-economy-and-shop](../.claude/skills/coin-economy-and-shop/SKILL.md) |
| **Food & feeding** (heal, cap 100, consume 1) | 🟢 | SQLite `food_inventory.quantity` + one feed transaction | [food-and-feeding](../.claude/skills/food-and-feeding/SKILL.md) |
| **Clothes & wardrobe** (own, equip/unequip) | 🟢 | SQLite ownership + `pet_clothes` equip state; Lottie overlay/swap | [clothes-and-wardrobe](../.claude/skills/clothes-and-wardrobe/SKILL.md) |
| **XP / Levels** (curve `10·L²+50·L+100`, carry loop) | 🟢 | TS reward function on `user_profile` | [gamification-xp-levels](../.claude/skills/gamification-xp-levels/SKILL.md) |
| **Streaks** `[NEW]` | 🟢 | Local daily-activity counter | [gamification-xp-levels](../.claude/skills/gamification-xp-levels/SKILL.md) |
| **Achievements / badges** `[NEW]` (greenfield) | 🟢 | Local rule engine over local events | [gamification-xp-levels](../.claude/skills/gamification-xp-levels/SKILL.md) |
| **Insights / charts** (per-tag, timeline, pet-usage, 7-day) | 🟢 | SQLite aggregate queries + RN chart lib | [analytics-and-insights](../.claude/skills/analytics-and-insights/SKILL.md) |
| **Premium gating logic** (which items/screens are locked) | 🟢 | Local check `entitlement.isPremium && item.premium` | [premium-and-monetization](../.claude/skills/premium-and-monetization/SKILL.md) |
| **Dynamic Lottie — rules-first** (mood/streak → color/speed/segment) | 🟢 | Deterministic mapping mutates bundled Lottie JSON on-device | [lottie-animation-engine](../.claude/skills/lottie-animation-engine/SKILL.md), [ai-lottie-director](../.claude/skills/ai-lottie-director/SKILL.md) |
| **Profile / settings / onboarding / navigation** | 🟢 | Local profile in MMKV/SQLite; expo-router shell | [account-and-profile](../.claude/skills/account-and-profile/SKILL.md), [navigation-and-app-shell](../.claude/skills/navigation-and-app-shell/SKILL.md) |
| **Design system / theming (incl. dark mode)** | 🟢 | NativeWind tokens; fully client | [design-system-and-theming](../.claude/skills/design-system-and-theming/SKILL.md) |

### 2b. Removed with the server — 🟢 no gap, deleted by design

| Legacy capability | Verdict | FE-only outcome |
|---|---|---|
| Accounts / email+password / JWT sessions | 🟢 `[DROP]` | Single local profile; no login. |
| Email verification / password reset (SMTP) | 🟢 `[DROP]` | Gone with accounts. |
| Google Sign-In | 🟢 `[DROP]` | Not needed (optional future). |
| Amplitude product telemetry | 🟢 `[DROP]` | Drop, or local-only opt-in. Privacy win. |
| Midtrans web-checkout payment surface | 🟢 `[DROP]` | Store IAP only. |
| Push notifications (FCM/remote) | 🟢 `[DROP]` | **Local** notifications only — no push server. |
| Server crons (decay, membership) | 🟢 `[CHANGE]` | Lazy on-open compute. |

### 2c. The friction points — 🟡 / 🔴

| Feature | Verdict | The gap | Resolution |
|---|---|---|---|
| **AI Brain Dump parser** | 🔴 | Secret key can't ship; text leaves device | §3.1 |
| **AI-driven Lottie (LLM)** | 🟡→🔴 | Rules version is 🟢; *LLM* version needs the key | §3.1 |
| **Referral** | 🔴 | Cross-user attribution needs a shared service | §3.2 |
| **Premium / IAP verification** | 🟡 | Receipt verification wants a server secret | §3.3 |
| **Focus timer background execution** | 🟡 | OS background limits (esp. iOS) — not a *backend* gap, a platform one | §3.4 |
| **Multi-device sync / cloud backup** | 🔴 | Inherently needs a shared store | §3.5 |
| **Data durability** (device = only copy) | 🟡 | No server backup; device loss = data loss | §3.5 |
| **Authoritative time** | 🟡 | Device clock is user-controllable → decay/streak gaming | §4.1 |
| **Economy integrity / anti-cheat** | 🟡 | Client owns the DB → editable | §4.2 |
| **Catalog / content updates** | 🟡 | No server to push new shop items | §4.3 |

---

## 3. Hard-gap deep dives

### 3.1 AI features — the one genuine casualty of "no backend" 🔴

**The two [NEW] headline features — the Brain Dump parser and LLM-driven Lottie — depend on calling Claude, and that is where "FE-only, no backend" actually bites.** Two distinct problems:

1. **Key security.** A React Native/Expo bundle **cannot safely embed an Anthropic API key** — it is extractable from the binary, then abused at your cost (verified concern, [ai-braindump-parser §7](../.claude/skills/ai-braindump-parser/SKILL.md), rule R8).
2. **Privacy.** The brain-dump text must **leave the device** to reach Anthropic — this breaks the strict "nothing leaves the device" promise ([00-product-vision](00-product-vision.md)) and needs an explicit consent gate.

**Transport options (all [DECIDE], D24/D25):**

| Option | Backend? | FE-only-clean? | Trade-off |
|---|---|---|---|
| **Rules-based only** (no LLM) | None | ✅ **Yes** | Ships today; the designed fallback (regex/heuristic parse; deterministic mood→animation). Lower quality, zero cost, fully private. |
| **BYO API key** | None | ✅ **Yes** | User pastes their own Anthropic key (secure storage) → calls go direct. Zero backend, but high friction / niche. |
| **Thin proxy** (Cloud Function / Edge) | **Yes (minimal)** | ❌ No | Real answer for a polished product: key stays server-side, per-user rate-limit. But it **is a backend** — contradicts the current constraint. |
| **Defer to phase 2** | — | ✅ | Ship rules-based now; add LLM when a proxy or BYOK is accepted. |

**Recommendation for the no-backend MVP:** **build the capture UX and the rules-based engine now** (it is FE-only and already specified as the fallback path in [ai-braindump-parser](../.claude/skills/ai-braindump-parser/SKILL.md) and [ai-lottie-director](../.claude/skills/ai-lottie-director/SKILL.md)). Keep the LLM call **transport-agnostic behind an interface** so a proxy or BYOK can be dropped in later without touching the schema/prompt/fallback. **State plainly to stakeholders: a pure no-backend build cannot ship the cloud-LLM "smart" experience as its default** — that specifically is what a backend (even a tiny one) buys you.

> Design consequence: the schema, prompt, and fallback are already **transport-agnostic** in the skills, so this decision does not block starting implementation — the capture box must simply remain fully useful with AI off.

### 3.2 Referral — cross-user linking is impossible FE-only 🔴

Legacy: an 8-char code per user; redeeming another's code granted **+100 coins to both** parties (`referral.repository.go:54-56`) and recorded who-referred-whom. **Both halves require a shared server** — there is no way for device B to prove it used device A's code, or to credit device A, without something in the middle.

**Options ([DECIDE] D9–D11):**
- **(Recommended) Defer from MVP.** Cleanest; revisit if a backend is ever added.
- **Deep-link "referred" self-claim.** Share `pawductivity://invite?code=…`; the *receiver* gets a one-time welcome bonus locally, with **no verification and no credit to the referrer**. It becomes a marketing/install nudge, not a two-sided reward — accept the abuse surface (anyone can claim).
- **Minimal referral-only cloud function.** The one narrow case where a stateless serverless endpoint might later be justified — explicitly out of the no-backend scope now.

### 3.3 Premium / IAP — not actually a blocker 🟡

Google Play purchase happens **client-side** via `react-native-iap`/RevenueCat; the only server-shaped part is *receipt verification* (needs `service_account.json`). Resolutions, none of which is "our backend":

- **(Recommended) RevenueCat** — hosted entitlement + real server-side verification. It is a **third-party service, not a backend we operate**; CLAUDE.md rule 6 already sanctions it. Entitlement cached in MMKV; expiry computed lazily on open (replacing the `CheckMembership` cron).
- **react-native-iap client-trust** — trust Play's local acknowledgement, cache in MMKV. Spoofable on rooted devices, but the gate is **low-value cosmetics**, so tolerable.
- Restore Purchases + offline grace both work locally.

Full analysis: [migration/monetization-options](migration/monetization-options.md). This is 🟡 not 🔴 — the feature ships FE-only; you only choose your fraud tolerance.

### 3.4 Focus timer background execution — a platform gap, not a backend gap 🟡

Removing the server doesn't hurt the timer; **OS background limits** do. FE-only solution (already specified):
- **Timestamp-authoritative**: persist `startedAt` in MMKV; elapsed = `now − startedAt`. **Never** trust a per-second background JS ticker (Android throttles/kills it; iOS suspends it).
- **Ongoing chronometer notification** for the live session (Android foreground service with the **correct** `foregroundServiceType` — not the legacy `"location"`).
- **One-shot completion notification** scheduled at `startedAt + remaining` (fires even if the app is killed) + **reschedule-on-boot**.
- **iOS caveat:** no arbitrary long-running background execution — rely on the scheduled local notification + timestamp recompute on foreground. Cross-platform parity is **[DECIDE] D26**.

See [focus-timer-and-background](../.claude/skills/focus-timer-and-background/SKILL.md) + [notifications-and-permissions](../.claude/skills/notifications-and-permissions/SKILL.md).

### 3.5 Sync, backup & data durability 🔴 / 🟡

With the device as the **only** copy, uninstall / device loss = total data loss (the legacy server was the implicit backup). No cross-device continuity either.

- **Multi-device sync** 🔴 — inherently needs a shared store. **Out of MVP scope** (**[DECIDE] D4**); optional post-MVP via a hosted store or device-native cloud.
- **Backup/restore** 🟡 — ship **local export/import** (JSON/SQLite dump to a file the user saves/shares) as the FE-only durability answer (**[DECIDE] D31**). Optionally back the file to **device-native cloud** (iCloud / Android Auto Backup) — the OS's cloud, still **no server of ours**.

---

## 4. New gaps *introduced* by deleting the server

These weren't "features" — they were properties the server quietly provided. FE-only, you must decide how to handle them.

### 4.1 Authoritative time 🟡
The server was the trusted clock; now the **device clock** governs health decay, streaks, reminders, and membership expiry — and the user can change it. Mitigations: prefer **elapsed/monotonic** measurement where possible; detect large **backward** clock jumps before applying decay/streak-break; otherwise **accept it** (single-player, cosmetic stakes). Recommend: accept, with a backward-jump guard on decay. Ties to **[DECIDE] D16**.

### 4.2 Economy integrity / anti-cheat 🟡
The client now owns `coin_ledger`, XP, and inventory — a technical user can edit the SQLite file and mint coins. Since Pawductivity is **single-player and cosmetic**, this harms no one else. **Recommendation: accept it**; do not build obfuscation/attestation that a no-backend app can't truly enforce ([DECIDE] D16). (Only premium *entitlement* is worth protecting — that's §3.3.)

### 4.3 Catalog / content updates 🟡
The legacy catalog lived in Postgres and *could* change server-side. FE-only, the shop catalog is **seeded in-app** ([data-model/seed-catalogs](data-model/seed-catalogs.md)) and changes only via an **app update**. Acceptable for a small fixed catalog; note it as a constraint (no live events/new items without shipping a release). A future remote **content config** (read-only JSON over CDN) could soften this without a real backend — out of scope now.

---

## 5. Recommended FE-only shipping plan

**Phase 1 — "Full product, no backend" (the target).** Everything in §2a/§2b, plus:
- AI = **rules-based Brain Dump + rules-based Lottie** (🟢), LLM behind an interface, **off by default**.
- Premium via **RevenueCat or client-trust** (🟡), entitlement cached locally.
- **Local export/import** backup (🟡).
- Referral **deferred** (🔴).
- This build is **genuinely backend-free** and delivers the six marketed pillars end-to-end.

**Phase 2 — enhancements that may reintroduce a *minimal* hosted dependency (each an explicit decision):**
- **Cloud-LLM AI** via BYO-key (still zero-backend) or a thin proxy (a small backend) → unlocks the true Brain Dump / dynamic-Lottie experience.
- **Referral** via a stateless function.
- **Cross-device sync/backup** via a hosted store.

The dividing line is clean: **Phase 1 is FE-only and covers the whole feature set except the *cloud-LLM flavour* of AI and *referral*.** Those two are the only things a no-backend app must degrade or defer.

---

## 6. Decisions this analysis forces (cross-ref [02-open-decisions](02-open-decisions.md))

| Gap | Decision | Recommended for no-backend MVP |
|---|---|---|
| AI transport | **D22–D25** | Rules-based now; LLM via BYOK/proxy later; premium-gated when added |
| Referral | **D9–D11** | Defer (or unverified deep-link self-claim) |
| IAP verification | **D5–D8** | RevenueCat (or client-trust for low-value gate) |
| Sync / backup | **D4, D31** | Local export now; sync out of scope |
| Timer / iOS parity | **D26–D29** | Timestamp + scheduled local notifications |
| Time trust / anti-cheat | **D16** | Accept; backward-clock guard on decay |
| Analytics | **D30** | Drop or local opt-in |

---

## Related
- [00-product-vision](00-product-vision.md) — the "nothing leaves the device" stance this doc tests.
- [02-open-decisions](02-open-decisions.md) — the D-items each gap maps to.
- [migration/backend-to-local-first](migration/backend-to-local-first.md) — the per-responsibility server→device mapping (the "how" behind the 🟢 rows).
- [migration/monetization-options](migration/monetization-options.md) — IAP-without-a-backend deep dive.
- [ai-braindump-parser](../.claude/skills/ai-braindump-parser/SKILL.md) · [ai-lottie-director](../.claude/skills/ai-lottie-director/SKILL.md) — the transport-agnostic AI design + rules fallback.
- [referral-system](../.claude/skills/referral-system/SKILL.md) — why referral is the cross-user blocker.
