# 02 — Open Decisions (Owner Review)

> **Purpose.** This is the single consolidated list of every product/technical decision the
> product owner must make before or during the Pawductivity **rebuild** (legacy Flutter +
> remote server → **local-first** rebuild). It aggregates and de-duplicates the open questions
> surfaced across every legacy subsystem, grouped by theme. Each item is numbered (`D1`, `D2`, …)
> so it can be referenced from other knowledge-base docs, tickets, and review comments.
>
> **This is the most important review artifact.** Read top to bottom, decide each item, and
> record the choice in the "Decision" cell. Nothing downstream (data model, economy tuning,
> monetization) should be finalized until the items it depends on are settled.

> **Provenance note for reviewers.** Every decision below is grounded in **verified legacy source**
> under `old/` (Flutter app + Go backend), with file + line citations. The canonical glossary
> (`context/01-glossary.md`) and the legacy backend-analysis docs (`context/data-model/*`,
> `context/legacy/*`) have since landed and this file has been **reconciled** against them: several
> earlier "unknown" claims (referral reward, task coin grant, XP curve, pet health decay/heal) were
> in fact defined in the Go backend and are now stated with their real values (D10, D12, D15, D17).

---

## How to use this document

- **Tag legend** (rebuild change-tags):
  - `[PRESERVE]` keep legacy behavior as-is · `[CHANGE]` keep the feature, change the rule ·
    `[NEW]` net-new, no legacy equivalent · `[DROP]` remove the legacy feature ·
    `[DECIDE]` genuinely open — owner must choose.
- Every row here is `[DECIDE]`. The **Recommended default** column states the direction the
  rebuild will take *if the owner does not object*, and is annotated with the tag that the
  default would resolve to (e.g. "recommend `[CHANGE]`").
- **Local-first framing.** The legacy app is almost entirely **server-authoritative**:
  `SERVER_URI = "https://fcfcvrer.pawductivity.id"` backs coins, pets, food, clothes,
  subscriptions, referral, and XP/level (`old/Pawductivity_App/lib/config/constant/constant.dart:1`).
  In the rebuild the **device is the source of truth**; any decision that previously "lived on
  the server" is now an open local-first design question. Where a value was **client-invisible but
  defined in the Go backend** (coin grant, XP curve, health decay/heal, referral reward), it is
  **recovered from `old/Pawductivity_BE/` and cited below** rather than left "unknown".

### Decision index (skim table)

| #   | Theme                 | Decision (short)                                     | Recommended default |
|-----|-----------------------|------------------------------------------------------|---------------------|
| D1  | Identity / accounts   | Account requirement model                            | Local anonymous profile; account optional |
| D2  | Identity / accounts   | Which auth methods to support                        | Local + optional Google & Apple |
| D3  | Identity / accounts   | Email verification & password reset                  | Drop (no email/pw) |
| D4  | Identity / accounts   | Multi-device sync / cloud backup                     | Optional, off by default |
| D5  | Monetization / IAP    | Purchase rail: WebView gateway vs native IAP         | Native IAP only |
| D6  | Monetization / IAP    | Subscription tiers & durations                       | Keep 1m / 6m / 12m |
| D7  | Monetization / IAP    | Entitlement source of truth                          | Store receipt, cached locally |
| D8  | Monetization / IAP    | What premium unlocks                                 | Define explicit feature set |
| D9  | Referral              | Keep the referral program at all                     | Defer (needs a server) |
| D10 | Referral              | Referral reward (amount + who gets it)               | +100 Coins to both (legacy); preserve if kept |
| D11 | Referral              | Attribution mechanism without central server         | Deep-link + optional backend |
| D12 | Economy tuning        | Task-completion coin reward                           | Preserve duration-scaled `floor(estimatedTime/60)` |
| D13 | Economy tuning        | Shop pricing (pets / food / clothes)                 | Preserve legacy prices |
| D14 | Economy tuning        | Additional coin sources (streaks, dailies, level-up) | Add streak + daily |
| D15 | Economy tuning        | XP / level curve                                     | Preserve known `10·L²+50·L+100` curve |
| D16 | Economy tuning        | Anti-cheat / economy integrity (no server authority) | Accept; single-player |
| D17 | Pet mechanics         | Health decay + feed restore amounts                  | Preserve known values (−1/day, per-food heal) |
| D18 | Pet mechanics         | Consequence at health 0                              | Sad state, no permadeath |
| D19 | Pet mechanics         | Pet roster & unlock method                           | Preserve 3 pets |
| D20 | Pet mechanics         | Growth stages / evolution (5 lottie stages)          | Tie stages to level |
| D21 | Pet mechanics         | Wardrobe / clothes scope                             | Single equipped item, per-pet |
| D22 | AI features           | Add AI at all (none in legacy)                       | RESOLVED — optional **Phase-2**, NOT in FE-only MVP |
| D23 | AI features (Phase-2)  | Which AI use cases                                   | NL task entry + breakdown |
| D24 | AI features (Phase-2)  | On-device vs cloud model & provider + key transport  | Cloud Claude via BYO-key/proxy; rules-based in MVP |
| D25 | AI features (Phase-2)  | AI cost gating                                       | Premium-only (when added) |
| D26 | Notifications / bg     | Background focus-timer strategy (iOS parity)         | Local-notif model both platforms |
| D27 | Notifications / bg     | Task reminder scheduling                             | Local scheduled notifications |
| D28 | Notifications / bg     | Push notifications                                   | Drop (no server) |
| D29 | Notifications / bg     | Permission request UX                                | Just-in-time prompts |
| D30 | Data & privacy        | Analytics (Amplitude)                                | Drop or make opt-in |
| D31 | Data & privacy        | Data export / backup / restore                       | Add local export |
| D32 | Data & privacy        | Secure-storage scope                                 | Minimize; only secrets |
| D33 | Data & privacy        | Sync encryption (if D4 = yes)                        | E2E if sync added |
| D34 | Scope / greenfield    | Achievements / badges (decorative today)             | Build real system, Phase 2 |
| D35 | Scope / greenfield    | Statistics / summary premium gating                  | Free basic, premium advanced |
| D36 | Scope / greenfield    | Drop legacy `_old` duplicate systems                 | Drop all `_old` |
| D37 | Scope / greenfield    | Platform targets (Android-first legacy)              | Android + iOS parity |
| D38 | Scope / navigation    | Merge Home and Quests (Todo) into one tab?           | Keep separate (default) |
| D39 | Scope / navigation    | Does Focus Session and/or Shop earn a bottom tab?    | No — both pushed (default) |

---

## 1. Identity / accounts

Legacy identity is **fully server-backed and account-required**: email/password register →
email code verification → login, plus Google Sign-In, all returning a bearer token stored in
`flutter_secure_storage`. There is **no guest / anonymous mode** — you cannot use the app without
an account.

Legacy sources: `features/user/presentation/pages/auth/{welcome,register,verification,login,forgot_password}.dart`;
`features/user/data/data_sources/remote/goauth_api_service.dart` (`POST /google-sign-in` → `{token, referral_code}`);
`features/user/domain/usecases/{register_user,login_user,verification_user,forgot_password,change_password,google_oauth}.dart`.

### D1 — Account requirement model `[DECIDE]`
- **Context.** Today an account is mandatory before any use. A local-first app can run entirely
  on-device with no account.
- **Options.** (a) Keep account required. (b) **Local anonymous profile by default**, account
  optional purely for cloud backup/sync. (c) No accounts at all (pure local).
- **Recommended default.** (b) — recommend `[CHANGE]`. Start on-device instantly; offer an
  account later only if D4 (sync) is adopted.
- **Depends on / affects:** D2, D3, D4, D9 (referral needs identity), D30–D33.

### D2 — Which auth methods to support `[DECIDE]`
- **Context.** Legacy supports email/password **and** Google Sign-In (`google_sign_in: ^6.3.0`).
- **Options.** (a) Preserve both. (b) Google-only. (c) **Local profile + optional Google + Apple**
  (App Store requires Sign in with Apple if any third-party social login ships). (d) Drop remote
  auth entirely.
- **Recommended default.** (c) — recommend `[CHANGE]`. Drop email/password; keep social sign-in
  only as an optional backup path.

### D3 — Email verification & password reset `[DECIDE]`
- **Context.** Legacy has an email verification-code flow and forgot/change-password
  (`auth/verification.dart`, `forgot_password.dart`, `usecases/{forgot,change}_password.dart`).
  These only make sense with email/password accounts.
- **Options.** (a) Preserve. (b) **Drop** (falls out automatically if D2 removes email/password).
- **Recommended default.** (b) — recommend `[DROP]`, contingent on D2.

### D4 — Multi-device sync / cloud backup `[DECIDE]`
- **Context.** Legacy implicitly "synced" because all state lived on the server. Local-first
  moves state to the device; cross-device continuity becomes an explicit feature, not free.
- **Options.** (a) No sync (single device). (b) **Optional cloud backup/restore, off by default.**
  (c) Full real-time multi-device sync (requires a backend + conflict resolution).
- **Recommended default.** (b) — recommend `[NEW]`. Ship single-device first; add opt-in backup.
- **Affects:** D31, D33; and whether any server exists at all (impacts D9, D28).

---

## 2. Monetization / IAP

Legacy ships **two parallel, redundant purchase rails** — a strong smell and the biggest
monetization decision:

1. **Server-issued WebView payment** (Indonesian gateway; `.id` domain). `POST /api/premium/1-month`,
   `/6-month`, `/1-year` return a `PremiumPayloadModel` whose URL is opened in an in-app
   `PaymentWebView`. Sources: `features/premium/data/data_sources/remote/premium_api_service.dart`,
   `features/user/presentation/pages/payment_web_view.dart` (note: it never detects payment
   success — `onNavigationRequest` always returns `navigate`).
2. **Native store IAP** (`in_app_purchase: ^3.2.1`) with `POST /api/subscription/purchase` and
   `GET /api/subscription/verify` for server-side receipt validation. Sources:
   `features/premium/data/data_sources/remote/subscription_api_service.dart`,
   `features/premium/domain/usecases/subscription_{purchase,verify}.dart`.

Premium is expressed both as a **subscription** and as per-item `"premium": true` flags on shop
pets/food/clothes (see §4), plus feature locks (`home_widget/premium_feature_lock.dart`).

### D5 — Purchase rail: WebView gateway vs native IAP `[DECIDE]`
- **Context.** Two rails exist; store policy (Apple/Google) **requires** native IAP for digital
  subscriptions, and the legacy WebView flow can't even confirm success.
- **Options.** (a) Keep both. (b) **Native IAP only.** (c) WebView gateway only.
- **Recommended default.** (b) — recommend `[CHANGE]` + `[DROP]` the WebView rail. Use
  `in_app_purchase`; consider RevenueCat to avoid a receipt-validation backend.

### D6 — Subscription tiers & durations `[DECIDE]`
- **Context.** Three durations exist: **1 month, 6 months, 1 year** (three usecases + three
  endpoints). Prices were server-issued and are **unknown from the client**.
- **Options.** (a) Preserve all three. (b) Simplify to monthly + annual. (c) Add a lifetime tier.
- **Recommended default.** (a) — recommend `[PRESERVE]` the three durations; **set concrete store
  prices** (owner must supply). `[DECIDE]` the price points.

### D7 — Entitlement source of truth `[DECIDE]`
- **Context.** Legacy trusts `GET /api/subscription/verify` (server) for "is premium active".
  Local-first has no server to ask.
- **Options.** (a) Keep server verification (requires backend). (b) **Store receipt / RevenueCat
  entitlement, cached on-device**, re-validated on launch.
- **Recommended default.** (b) — recommend `[CHANGE]`.

### D8 — What premium actually unlocks `[DECIDE]`
- **Context.** Premium currently gates: some shop items (`"premium": true` on Rabbit pet, Pizza
  food, Tuxedo/Star/Pink-Dress clothes), and locked stats/insights widgets (`premium_feature_lock`,
  `premium_feature_list`). The full entitlement set is not centrally documented.
- **Options.** (a) Preserve the exact legacy locks. (b) **Define an explicit, documented premium
  feature set** (advanced stats, exclusive cosmetics, AI features per D25, etc.).
- **Recommended default.** (b) — recommend `[CHANGE]`. Ties to D25 and D35.

---

## 3. Referral

Legacy referral is server-mediated: create your code (`POST /api/referral`), redeem someone's code
(`POST /api/referral/use`), list who used yours (`GET /api/referral/users`). Google sign-up also
returns a `referral_code`. The client shows only generic "submitted successfully" dialogs — **no
reward amount is visible client-side** (`referral_widget/referral_dialogs.dart`), but the backend
grants **+100 Coins to both parties** (`Pawductivity_BE/internal/repository/referral.repository.go:54-56`).

Sources: `features/user/data/data_sources/remote/referral_api_service.dart`,
`features/user/domain/usecases/{create_referral,use_referral,get_referral_users}.dart`,
`features/user/presentation/widgets/referral_widget/*`.

### D9 — Keep the referral program at all `[DECIDE]`
- **Context.** Referral is fundamentally a **networked, multi-user** feature (attribute A→B). A
  purely local-first app has no way to attribute or reward it without a backend.
- **Options.** (a) **Defer / drop** until a backend exists. (b) Keep, requiring a minimal
  referral backend. (c) Replace with a non-networked "share the app" link (no reward tracking).
- **Recommended default.** (a) — recommend `[DROP]` for v1 (revisit if D4/D28 add a server).

### D10 — Referral reward (amount + who gets it) `[DECIDE]`
- **Context.** The legacy reward **is known**: **+100 Coins to BOTH** the code owner and the
  redeemer (`Pawductivity_BE/internal/repository/referral.repository.go:54-56`;
  [referral-system](../.claude/skills/referral-system/SKILL.md)). The open question is only whether
  the reward can be *attributed* without a backend (D9/D11), not what it should be.
- **Options.** (a) Preserve +100/+100 if referral is kept. (b) Re-tune the amount. (c) Referee-only
  grant if owner attribution is impossible locally.
- **Recommended default.** `[PRESERVE]` +100/+100 **if** D9 = keep; otherwise moot.

### D11 — Attribution mechanism without a central server `[DECIDE]`
- **Context.** Redemption today is an authenticated server call.
- **Options.** (a) Deep-link / install-referrer capture + lightweight backend. (b) Manual code
  entry that grants the referee reward only (no referrer tracking, fully local).
- **Recommended default.** `[DECIDE]`, contingent on D9.

---

## 4. Economy tuning

The coin economy exists client-side only as **prices and a default reward**; balances, spending,
and XP all lived on the server. Verified constants:

| Item | Value | Source |
|------|-------|--------|
| Task template `reward` default (unused for grant) | **100 coins** | `features/task/data/model/task_template_model.dart:32` (`reward: json['reward'] ?? 100`) |
| **Actual** task-completion coin grant | **`floor(estimatedTime/60)` coins** | `Pawductivity_BE/internal/repository/task.repository.go:470` (`CALL buy_coins(userId, estimatedTime/60)`) |
| Pets: Dog / Cat / Rabbit | **100 / 200 / 200** (Rabbit premium) | `config/constant/pet.dart:2-4` |
| Food: Apple/Chicken/Watermelon/Carrot/Pizza | **3 / 3 / 4 / 5 / 4** (Pizza premium) | `config/constant/food.dart:2-6` |
| Clothes: Green/Cyan/Star/Pink/Tuxedo | **10 / 15 / 15 / 15 / 20** (Tuxedo/Star/Pink premium) | `config/constant/clothes.dart:2-6` |
| Coin balance | `GET /api/user/coins` (server) | `features/coin/data/data_sources/remote/coin_api_service.dart` |
| Level / XP curve | `needed_xp = 10·level² + 50·level + 100` | `Pawductivity_BE/internal/repository/task.repository.go:453` (client model: `features/user/data/model/level.dart`) |

### D12 — Task-completion coin reward `[DECIDE]`
- **Context.** The real backend grant on completion is **`coins += floor(estimatedTime/60)`**
  (`task.repository.go:470`, `CALL buy_coins(userId, estimatedTime/60)`) — scaled by the quest's
  estimated time, **not** a flat 100. The `reward ?? 100` in `task_template_model.dart:32` is an
  unused template default, not the grant. (Note the display-vs-grant discrepancy in CLAUDE.md §5:
  the preview shows `FLOOR(estimatedTime/60/3)`.)
- **Options.** (a) **Preserve the duration-scaled grant** `floor(estimatedTime/60)`. (b) Rebalance
  the scale. (c) Expose the divisor as a tunable config constant.
- **Recommended default.** (a)+(c) — recommend `[PRESERVE]` the duration-scaled formula, exposed as
  a tunable constant so the owner can rebalance without a code change.

### D13 — Shop pricing (pets / food / clothes) `[DECIDE]`
- **Context.** Prices above are the only hard economy anchors we have.
- **Options.** (a) **Preserve** exactly. (b) Rebalance now that earning is local (see D12/D14).
- **Recommended default.** (a) — recommend `[PRESERVE]` for v1; revisit after playtest.

### D14 — Additional coin sources `[DECIDE]`
- **Context.** Legacy client shows only task-reward as an earning path. Local-first retention
  usually needs more loops (streaks, daily bonus, level-up payout).
- **Options.** (a) Task reward only. (b) **Add streak + daily-login bonus.** (c) Add level-up payouts.
- **Recommended default.** (b) — recommend `[NEW]`, values `[DECIDE]`.

### D15 — XP / level curve `[DECIDE]`
- **Context.** The legacy curve **is known**: `needed_xp = 10·level² + 50·level + 100`
  (`Pawductivity_BE/internal/repository/task.repository.go:453`; L1→2 = 160, L2→3 = 240, …), applied
  via the level-up carry loop on each threshold crossing. Note the seed `needed_xp = 150` vs the
  formula's 160 discrepancy (CLAUDE.md §5). The decision is **preserve vs re-tune a known curve**,
  not invent one.
- **Options.** (a) **Preserve** `10·level² + 50·level + 100`. (b) Re-tune the coefficients.
  (c) Hand-authored table.
- **Recommended default.** (a) — recommend `[PRESERVE]` the known curve; re-tune only after playtest.
  See [gamification-xp-levels](../.claude/skills/gamification-xp-levels/SKILL.md).

### D16 — Economy integrity / anti-cheat `[DECIDE]`
- **Context.** With no server authority, a determined user can edit local coin/XP state. Legacy
  relied on the server as the trust boundary.
- **Options.** (a) **Accept it — single-player, cosmetic-only economy, no leaderboards.**
  (b) Add obfuscation/signing (limited value). (c) Server-validate (reintroduces a backend).
- **Recommended default.** (a) — recommend `[CHANGE]` (explicitly stop treating the economy as
  tamper-proof). Only reconsider if D9/D34 add competitive/social surfaces.

---

## 5. Pet mechanics

A pet has `{id, animalId, name, health:int, asset, premium, clothesAsset}`
(`features/pet/data/model/pet.dart`). The Flutter usecases — feed (`feedPet(token, petId, foodId)`),
equip clothes, rename, purchase — only **delegate** to the server, but the numbers **are defined in
the Go backend**: Health **decays −1/day** at local midnight, floored at 0
(`Pawductivity_BE/internal/routines/decreasePetHealth.routine.go:34`); **bounds are 0–100**
(`pawductivity.sql:77`, `health int DEFAULT 100 CHECK (health >= 0)`); **feeding adds the food's
`stats`** then hard-caps at 100 (`animal.repository.go` `FeedPet`) — Apple/Chicken/Watermelon +10,
Carrot +15, Pizza +20 (`pawductivity.sql:255-294`). These are **known**, not unknown.
Each animal ships **six lottie files** (`*_default`, `_1`…`_5`) under `assets/pet/{cat,dog,rabbit}/`;
the numbered `*_1..*_5` are legacy **clothing-outfit variants** selected by `clothesId` (`cat_1`
adds a `baju badan` shirt layer — verified: [lottie-animation-engine](../.claude/skills/lottie-animation-engine/SKILL.md) R3/§2), **not** growth stages. **Evolution stage** is a rebuild reinterpretation with no legacy
equivalent, so per-stage art must be newly authored and clothing needs a separate representation
(overlay/recolor, not a whole-file swap).

### D17 — Health decay + feed restore amounts `[DECIDE]`
- **Context.** The legacy values are known (above): max 100, **−1 Health/day**, per-food heal
  (Apple/Chicken/Watermelon +10, Carrot +15, Pizza +20), floored at 0. The decision is whether to
  **keep or re-tune** them, not to invent them. See [food-and-feeding](../.claude/skills/food-and-feeding/SKILL.md), [pet-companion-system](../.claude/skills/pet-companion-system/SKILL.md).
- **Options.** (a) **Preserve the legacy values.** (b) Re-tune decay rate / per-food heal / cap.
  (c) Change whether decay pauses while the app is closed.
- **Recommended default.** (a) — recommend `[PRESERVE]` the known values, but compute decay from
  elapsed wall-clock on app open (`[CHANGE]`: no background daemon; catch up missed midnights).

### D18 — Consequence at health 0 `[DECIDE]`
- **Context.** Unknown legacy behavior at zero health.
- **Options.** (a) **Sad/neglected visual state, fully recoverable (no permadeath).** (b) Pet
  "runs away"/permadeath. (c) Blocks other features until fed.
- **Recommended default.** (a) — recommend `[NEW]`, non-punitive (retention-friendly).

### D19 — Pet roster & unlock method `[DECIDE]`
- **Context.** Three pets: Dog (100c), Cat (200c), Rabbit (200c, **premium**).
- **Options.** (a) **Preserve 3 pets & unlock rules.** (b) Add pets. (c) Change Rabbit's premium gate.
- **Recommended default.** (a) — recommend `[PRESERVE]`; new pets are a later content decision.

### D20 — Growth stages / evolution `[DECIDE]`
- **Context.** `_1`…`_5` lottie assets exist but the client never referenced a staging rule we
  could find — the progression trigger is unknown.
- **Options.** Tie stage to (a) **user level**, (b) cumulative feeds/care, (c) days owned.
- **Recommended default.** (a) — recommend `[NEW]`: map the 5 stages to level milestones; exact
  thresholds `[DECIDE]`.

### D21 — Wardrobe / clothes scope `[DECIDE]`
- **Context.** Pet stores a single `clothesAsset` string → **one equipped item at a time**.
- **Options.** (a) **Preserve single equipped slot, per pet.** (b) Layered slots (hat/body/etc.).
- **Recommended default.** (a) — recommend `[PRESERVE]`.

---

## 6. AI features (greenfield)

**There are no AI features in the legacy app** — a source scan found no LLM/AI usage anywhere
(only false-positive substring hits in calendar styling). All AI is therefore net-new `[NEW]`. The
AI/LLM layer is **deferred to an optional Phase-2** and is **NOT in the frontend-only MVP** (owner
decision): a pure client can't safely hold an Anthropic key and the input text would leave the
device, so cloud-LLM AI needs BYO-key or a thin proxy — see [`03-fe-only-gap-analysis.md` §3.1](03-fe-only-gap-analysis.md).
The MVP ships the **rules-based** forms of both features (on-device, no network). The items below are
therefore Phase-2 scoping. (Validate provider/model choices against the current Claude/Anthropic
reference before implementing.)

### D22 — Add AI at all — RESOLVED (AI = optional Phase-2, not in MVP) `[NEW]`
- **Context.** No legacy baseline. The **zero-friction Brain Dump capture** and **dynamic
  state-driven Lottie** ship in the MVP as **rules-based, FE-only** features; only the **LLM layer**
  on top of them is AI (CLAUDE.md §1/rule 3, `context/00-product-vision.md` §2, Pillars B & C).
- **Resolution.** The LLM layer is **`[NEW]`, optional, Phase-2 — excluded from the FE-only MVP**.
  When added, provider **Claude** (D24), run client-side with **no inference server we operate**
  (BYO-key or thin proxy). Everything must remain fully functional with AI off. Remaining AI items
  (D23–D25) apply only once/if Phase-2 proceeds.

### D23 — Which AI use cases `[DECIDE]`
- **Context.** Adjacent to the task/pet loops.
- **Options.** NL task capture ("remind me to walk the dog at 6"), task breakdown/subtasks,
  productivity coaching, pet-persona chat, weekly summary narration.
- **Recommended default.** `[DECIDE]` — suggest starting with **NL task entry + task breakdown**.

### D24 — On-device vs cloud model & provider + key transport `[DECIDE]` (Phase-2)
- **Context.** The MVP is **rules-based, no LLM** (no transport question). This decision only applies
  if/when the Phase-2 LLM layer is built. Cloud conflicts with "nothing leaves the device" and a
  client can't safely hold an API key; on-device models are weaker.
- **Options.** (a) On-device small model (private, weaker, no key). (b) **Cloud Claude via a thin
  proxy** (real key security + rate-limit, but the proxy IS a minimal backend). (c) **Cloud Claude via
  BYO-key** (user's own key in secure storage — zero backend, high friction).
- **Recommended default.** For a truly no-backend product, **(c) BYO-key** for early adopters and/or
  **(b) proxy** if/when a minimal hosted dependency becomes acceptable; always behind an explicit
  per-feature consent gate. Confirm model IDs/pricing against the Claude API reference at build time.

### D25 — AI cost gating `[DECIDE]`
- **Context.** Cloud AI has per-call cost.
- **Options.** (a) Free with quota. (b) **Premium-only** (ties to D8). (c) BYO key = free.
- **Recommended default.** (b) — recommend `[NEW]`, premium-gated.

---

## 7. Notifications / background

Legacy uses `flutter_local_notifications: ^18.0.1`, `flutter_background_service: ^5.1.0`, and
`permission_handler: ^11.3.1`. The background service is an **Android foreground service** that
ticks a 1-second countdown for a running focus task and shows an ongoing notification; **iOS is a
no-op stub** (`onIosBackground` just returns `true`). There is **no FCM/push** dependency at all —
everything is local. State is passed to the isolate via `flutter_secure_storage`
(`remaining_time`, `task_name`).

Sources: `features/task/background/{background_service,setup_background_service}.dart`,
`features/task/presentation/handlers/background_service_handler.dart`,
`features/task/presentation/utils/notification_drawer.dart`.

### D26 — Background focus-timer strategy (iOS parity) `[DECIDE]`
- **Context.** The Android per-second foreground service has no iOS equivalent (iOS forbids that
  pattern); legacy simply doesn't support iOS background timing.
- **Options.** (a) Keep Android-only background timer. (b) **Compute elapsed time from a stored
  start-timestamp and drive a single scheduled "timer done" local notification** — works on both
  platforms without a persistent background service. (c) iOS Live Activities (extra scope).
- **Recommended default.** (b) — recommend `[CHANGE]`: timestamp-diff + scheduled completion
  notification, uniform across platforms.

### D27 — Task reminder scheduling `[DECIDE]`
- **Context.** The app has a rich scheduled-task/reminder model (reminder templates, monthly
  reminders, scheduled entries). Reminder delivery in local-first must be device-scheduled.
- **Options.** (a) **Local scheduled notifications** for each due reminder. (b) Server push (needs
  backend — see D28).
- **Recommended default.** (a) — recommend `[PRESERVE]`/`[CHANGE]` toward pure local scheduling.

### D28 — Push notifications `[DECIDE]`
- **Context.** None today; a true remote push channel requires a server and account (D4).
- **Options.** (a) **No push.** (b) Add FCM/APNs for re-engagement (needs backend).
- **Recommended default.** (a) — recommend `[DROP]`/omit for v1.

### D29 — Permission request UX `[DECIDE]`
- **Context.** `permission_handler` is present; notification permission is required on modern
  Android/iOS.
- **Options.** (a) Ask on first launch. (b) **Just-in-time** (ask when the user first sets a
  reminder / starts a focus timer).
- **Recommended default.** (b) — recommend `[CHANGE]` to contextual prompts.

---

## 8. Data & privacy

Legacy sends analytics to **Amplitude** (`amplitude_flutter: ^4.0.0`, `core/amplitude/*`), stores
the auth token in `flutter_secure_storage`, and keeps all real user data on the server. Local-first
inverts this: the device holds everything, which sharpens privacy trade-offs and the owner's stated
"nothing leaves the device unless the user opts in" stance.

### D30 — Analytics (Amplitude) `[DECIDE]`
- **Context.** Amplitude ships events to a third party by default.
- **Options.** (a) Keep as-is. (b) **Remove entirely.** (c) Keep but **opt-in only**, anonymized.
- **Recommended default.** (b) or (c) — recommend `[DROP]` (or `[CHANGE]` to strictly opt-in).

### D31 — Data export / backup / restore `[DECIDE]`
- **Context.** With data on-device, loss/reinstall means total loss unless export exists.
- **Options.** (a) None. (b) **Local file export/import (JSON) of all user data.** (c) Cloud backup (D4).
- **Recommended default.** (b) — recommend `[NEW]`.

### D32 — Secure-storage scope `[DECIDE]`
- **Context.** Legacy stored the bearer token (and transient timer state) in secure storage. If
  accounts shrink (D1/D2), there may be few secrets left.
- **Options.** (a) Keep broad usage. (b) **Minimize — secure storage only for genuine secrets**
  (e.g. optional-sync credentials); ordinary app data in the normal local DB.
- **Recommended default.** (b) — recommend `[CHANGE]`.

### D33 — Sync encryption (only if D4 = yes) `[DECIDE]`
- **Context.** Any optional cloud backup/sync exposes user data off-device.
- **Options.** (a) Server-trust (plaintext at rest). (b) **End-to-end encrypted** backup.
- **Recommended default.** (b) — recommend `[NEW]`, contingent on D4.

---

## 9. Scope / greenfield

### D34 — Achievements / badges `[DECIDE]`
- **Context.** `profile_widget/profile_badges.dart` only renders a passed-in list of **image
  paths** — there is **no earning/unlock logic** anywhere. Badges are decorative placeholders today.
- **Options.** (a) Drop badges. (b) **Build a real achievements system** (unlock rules, storage,
  UI) as a later phase. (c) Ship static/cosmetic badges only.
- **Recommended default.** (b) — recommend `[NEW]`, Phase 2; define achievement list separately.

### D35 — Statistics / summary premium gating `[DECIDE]`
- **Context.** Legacy has a full summary/insights suite (weekly activity, tag distribution, focus
  distribution, favorite-pet, timelines under `features/summary/*` and `home_widget/*_chart.dart`),
  with some charts behind `premium_feature_lock`.
- **Options.** (a) Preserve exact locks. (b) **Free basic stats, premium advanced stats.**
  (c) All free.
- **Recommended default.** (b) — recommend `[CHANGE]`; exact split ties to D8.

### D36 — Drop legacy `_old` duplicate systems `[DECIDE]`
- **Context.** The codebase carries parallel dead/duplicate implementations:
  `task_api_service_old.dart`, `task_repository_impl_old.dart`, `remote_task_bloc_old.dart`
  (+ events/states/usecases), `countdown_manager_old.dart`, `profile_old.dart`, and
  `domain/usecase/old_usecases/*`.
- **Options.** (a) Port some. (b) **Drop all `_old` variants; rebuild fresh from the current path.**
- **Recommended default.** (b) — recommend `[DROP]` every `_old` artifact.

### D37 — Platform targets `[DECIDE]`
- **Context.** Legacy is Android-first (foreground service; iOS background is a stub) but the
  project also carries iOS, macOS, Windows, and web scaffolding.
- **Options.** (a) Android-only. (b) **Android + iOS parity** (drives D26). (c) Add desktop/web.
- **Recommended default.** (b) — recommend `[CHANGE]` to first-class iOS parity; desktop/web out
  of scope for v1.

### D38 — Merge Home and Quests (Todo) into one tab `[DECIDE]`
- **Context.** Legacy Home (dashboard/stats) and Todo (task list) are distinct surfaces; the rebuild
  can keep them as two tabs or collapse them into one "Today/Home" tab (raised by
  [navigation-and-app-shell](../.claude/skills/navigation-and-app-shell/SKILL.md) §5a).
- **Options.** (a) **Keep separate** — Home = glanceable dashboard, Quests = full list/creation.
  (b) Merge into one tab (Quest list with a Companion + stats header), freeing a 5th slot.
- **Recommended default.** (a) — recommend `[CHANGE]` (keep separate); collapse to (b) only if
  playtest shows redundancy, rather than shipping a 6th tab.

### D39 — Does Focus Session and/or Shop earn a bottom tab `[DECIDE]`
- **Context.** Focus Session (one run of one Quest) and the tabbed Shop are **pushed** screens by
  default, not top-level destinations (navigation-and-app-shell §6, R8).
- **Options.** (a) **Both pushed, no tab.** (b) Promote Focus and/or Shop to a tab — only viable by
  merging Home+Quests (D38) to avoid a 6th tab.
- **Recommended default.** (a) — recommend `[CHANGE]` (both pushed); promote only if playtest shows
  constant use.

---

## Cross-links

- **Economy constants & tuning** (D12–D16) → economy/data-model docs under `context/data-model/`.
- **Pet & wardrobe entities** (D17–D21) → `context/data-model/` (pet, food, clothes schema).
- **Monetization mechanics** (D5–D8) → [premium-and-monetization](../.claude/skills/premium-and-monetization/SKILL.md) + [monetization-options.md](migration/monetization-options.md).
- **Legacy behavior of record** for every citation above → `context/legacy/` deep-analysis docs.
- **Local-first data ownership & sync** (D4, D31–D33) → [backend-to-local-first.md](migration/backend-to-local-first.md) + [local-first-data-layer](../.claude/skills/local-first-data-layer/SKILL.md).
- **Notifications & focus timer** (D26–D29) → [focus-timer-and-background](../.claude/skills/focus-timer-and-background/SKILL.md) + [notifications-and-permissions](../.claude/skills/notifications-and-permissions/SKILL.md).
