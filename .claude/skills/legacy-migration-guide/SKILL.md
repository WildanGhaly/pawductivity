---
name: legacy-migration-guide
description: Use when starting ANY implementation task that touches the legacy Pawductivity codebase under old/ — how to mine the Flutter app + Go backend for business logic without copying server/auth/network code. Covers the old/ layout, the golden rule, the port-vs-drop map (preserve/change→local/drop/new), and pointers to the migration + known-bugs docs.
---

# Legacy Migration Guide

> The on-ramp for every rebuild task: how to read the old Pawductivity code for *what the product did* and never inherit *how it did it*.

**Status vs legacy:** This is a meta-guide, not a subsystem. It [PRESERVE]s the legacy as a **specification reference** while it [DROP]s the legacy as a **code source** for anything network/auth/server-shaped. Read the old code to learn rules and numbers; write brand-new local-first React Native + Expo code.

## What it is

The old implementation lives under `old/` and is the **source of truth for what Pawductivity did**, not how the rebuild should be built. It is three separate codebases:

| Folder | Stack | Role in the rebuild | How to treat it |
|---|---|---|---|
| `old/Pawductivity_App/` | Flutter (Dart), Bloc, get_it DI, retrofit/dio, Floor SQLite | The UX + client behavior spec | Mine for **screens, flows, gameplay feel, constants**. Ignore the retrofit/dio network layer entirely. |
| `old/Pawductivity_BE/` | Go / Gin, Postgres, GORM, raw SQL, stored procs | The authoritative **business logic + data model** | Mine for **rules, formulas, schema, seed data**. Never port the transport/auth/routine plumbing. |
| `old/Pawductivity-Website/` | Next.js marketing + legal site | Product positioning, pricing copy, privacy/legal promises | Reference for **product decisions & legal obligations** (e.g. data-deletion right). Not app code. |

Critically, **the complete data model lives in the Go backend, not the Flutter app** (legacy: `Pawductivity_BE/database/migration/migration.go`). The Flutter app's local Floor DB registers only 4 entities (Task, Food, Pet, User) and is a lossy, under-used cache — the app was effectively **online-first**. So for data/schema questions, read the backend; for UX/flow questions, read the app.

```
old/
├── Pawductivity_App/           # Flutter client  → UX + flows only
│   ├── lib/
│   │   ├── main.dart           # cold-start / splash / auth-gate orchestration
│   │   ├── injection_container.dart   # get_it DI map (old+new stacks wired together)
│   │   ├── config/             # routes, constants (SERVER_URI hardcoded here)
│   │   ├── theme/              # app_navbar.dart = the 5-tab shell; theme.dart
│   │   └── features/           # clothes, coin, food, pet, premium, summary, task, user
│   ├── android/                # AndroidManifest.xml (FGS type, missing perms) — see below
│   └── assets/                 # Lottie pet JSON, clothes/food PNG, fonts (Poppins)
├── Pawductivity_BE/            # Go/Gin backend → business logic + schema (READ ONLY)
│   ├── cmd/main.go             # server bootstrap, CORS, routine startup
│   ├── internal/
│   │   ├── controllers/        # thin; auth.controller.go has the hardcoded "secret"
│   │   ├── repository/         # ALL business logic lives here as raw SQL
│   │   ├── routines/           # decreasePetHealth + checkMembership midnight loops
│   │   ├── middleware/         # jwtMiddleware.go (DROP), rateLimiter.go (dead)
│   │   └── utils/              # decrypt.utils.go (AES password decrypt — DROP)
│   ├── database/
│   │   ├── script/pawductivity.sql   # hand-written DDL + seed + stored procs (STALE)
│   │   └── migration/model/*.go      # GORM models = effective runtime schema (TRUST THESE)
│   └── routes/                 # 13 route files (flat REST surface)
└── Pawductivity-Website/       # Next.js site → positioning, pricing, legal only
```

## The golden rule

> **Read the legacy for BUSINESS LOGIC. Never copy server, auth, or network code.**

Everything about *transport, identity, and remote state* is being deleted. The rebuild is **100% local-first**: `expo-sqlite` (relational) + `react-native-mmkv` + `Zustand` (state/settings), with **client-side Claude** for the new AI features. There is no backend, no accounts, no JWT, no HTTP.

**Copy the RULE, re-implement the MECHANISM.** Concretely:

- ✅ **DO** extract: numeric constants, formulas, seed catalogs, gating rules, state machines, screen flows, the shape of the data.
- ❌ **DO NOT** port: any Go controller/repository as-is, the retrofit/dio `ApiService` classes, JWT middleware, AES decryption, SMTP, Midtrans/webhook code, the goroutine cron routines, or the `flutter_secure_storage`-as-auth-gate pattern.

Red flags that mean "you are looking at mechanism, stop copying and re-derive locally": anything mentioning `Dio`, `@RestApi`, `@Header('Authorization')`, `SERVER_URI` (legacy: `Pawductivity_App/lib/config/constant/constant.dart` — `https://fcfcvrer.pawductivity.id` hardcoded), `jwt.Parse`, `[]byte("secret")` (legacy: `Pawductivity_BE/internal/middleware/jwtMiddleware.go:27,52` and `auth.controller.go:60,115` — the HMAC secret is the literal string `"secret"`), `DecryptAES`, `buy_coins` the *stored proc*, `midtrans`, `Amplitude`, or a goroutine that sleeps until midnight.

## Core business rules (the port-vs-drop map)

Every subsystem falls into exactly one bucket. Tag your work with the same intent tags used across the knowledge base (`[PRESERVE]` / `[CHANGE]` / `[NEW]` / `[DROP]` / `[DECIDE]`).

### [PRESERVE] — keep the concept and the numbers, re-implement locally

| Subsystem | What to keep | Legacy source |
|---|---|---|
| **Pet companion** | Species (Dog/Cat/Rabbit), Evolution stages 1–5, health 0–100 (`CHECK >= 0`), mood-driven animation | `database/migration/model/pet.model.go`, `animal.model.go` |
| **Task / Quest** | Immutable-versioned task, `estimatedTime` in **seconds** (`CHECK > 600` = 10-min floor), `daily_logs` progress capped at `estimatedTime`, completion = `timeCompleted >= estimatedTime` | `internal/repository/task.repository.go`, `model/task.model.go` |
| **Coin economy** | Earn on completion, spend in Shop, `coins >= 0` invariant, purchases ledger | `internal/repository/purchase.repository.go`, `pawductivity.sql` (`buy_coins`) |
| **Feeding** | `food.stats` restores health, **capped at 100**, one food item consumed per feed | `internal/repository/animal.repository.go` (`FeedPet`) |
| **Wardrobe** | Owned cosmetics, equip one garment per pet via join, unequip removes it | `model/petClothes.model.go`, `wardrobe.model.go` |
| **Focus timer** | Real-time Focus Session driving a Focus quest | `lib/features/task/presentation/managers/countdown_manager.dart` |
| **Reminders** | Standalone reminders alongside tasks, type `once/weekly/monthly/yearly` | `model/reminder.model.go` |
| **Insights / analytics** | 7-day activity window, tag summary, pet-usage, 2-hour timeline buckets, calendar heatmap | `internal/repository/task.repository.go` (summary queries) |

Key constants to carry over verbatim (verify against source before restating — see the [known-bugs register](../../../context/legacy/known-bugs-and-antipatterns.md) for the ones that contradict):
- Health decay **−1/day**, floored at 0. Feed cap **100**.
- Seed pets: **Dog 100c, Cat 200c, Rabbit 200c (premium)**. New user legacy-started with a free **Cat "My Pet" + 200 coins** (via a `buy_coins` misuse bug — `[DECIDE]` whether intended).
- Seed food (price/heal): **Apple 3/10, Chicken 3/10, Pizza 4/20 (premium), Watermelon 4/10, Carrot 5/15**.
- Seed clothes (price): **Cyan t-shirt 15, Green shirt 10, Tuxedo 20 (premium), Star Shirt 15 (premium), Pink Dress 20 (premium)** — all seeded as type `shirt`.
- XP on completion `= estimatedTime/60` (minutes); level curve `needed_xp = 10*level² + 50*level + 100`.
- Referral **+100 coins to both** parties.

### [CHANGE] — same concept, server → on-device implementation

| Legacy mechanism | Local-first replacement | Legacy source |
|---|---|---|
| **Storage**: Postgres via GORM/raw SQL; `flutter_secure_storage` K/V; Floor cache | **expo-sqlite** for all relational data (drop `userid`, single local profile) + **react-native-mmkv/Zustand** for settings & ephemeral timer/pet state | `database/migration/model/*.go`; `remote_auth_bloc.dart`; `countdown_manager.dart` |
| **Cron routines** (health decay, membership expiry) — goroutines sleeping to server-local midnight | **Lazy on-app-open computation** from a stored `last_*_timestamp`; also fixes the missed-midnight & shared-timezone bugs | `internal/routines/decreasePetHealth.routine.go`, `checkMembership.routine.go` |
| **Notifications**: runtime `Permission.notification.request()` with no manifest declaration | **expo-notifications** scheduled locally + correct Android permissions; recompute on boot | `lib/features/task/presentation/pages/home_screen.dart:82`; `AndroidManifest.xml` |
| **Entitlement** (premium): Google Play token verified server-side against Android Publisher API; downgrade cron | **react-native-iap / RevenueCat**, entitlement cached in MMKV, `premium ⇔ expiry > now` computed on read. Server-side receipt validation is the one thing that legitimately wants a backend — document honestly, don't rebuild the Go server | `internal/controllers/subscription.controller.go` |

### [DROP] — delete entirely, do not port

| Dropped | Why | Legacy source |
|---|---|---|
| **Accounts / email-verify signup** | Single-device local app has no identity to prove; account creation is instant/local | `users.controller.go`, `verification` table |
| **JWT auth** | HMAC secret is the literal `"secret"` — trivially forgeable; IDOR across all `/user/:id` routes | `middleware/jwtMiddleware.go`, `auth.controller.go` |
| **AES password decrypt + bcrypt + SMTP** | No password to transmit; no email to send | `internal/utils/decrypt.utils.go` |
| **Amplitude analytics** | Privacy: nothing leaves the device. Insights become on-device SQLite aggregates | hardcoded Amplitude key, events app-wide |
| **Midtrans** (Snap web payments + unauth webhook) | Unauthenticated, signature-unverified webhook = free-premium exploit | `premium.controller.go`, `payment_web_view.dart` |
| **Plaintext password persistence** | User password written in cleartext to `flutter_secure_storage` — a real security defect | `remote_auth_bloc.dart:59` |

Also inert in the legacy and safe to ignore: the unwired per-IP rate limiter, `CORS AllowAllOrigins`, the dead `level_up()` stored proc, the `PurchaseCoin` free-coins endpoint, and the duplicate old/new task stacks both registered in DI.

### [NEW] — no legacy equivalent; greenfield

| New capability | Notes | Related skill |
|---|---|---|
| **Brain Dump AI** | Client-side Claude parses free text/voice into structured task/quest rows, then inserts via the normal local task path. Legacy used manual forms. | ai-braindump-parser |
| **Dynamic Lottie** | Pet animation JSON loaded from bundled assets and mutated client-side by Claude from health/mood, replacing the legacy static `animal.asset` path model | ai-lottie-director, lottie-animation-engine |
| **Onboarding** | First-run pet selection + notification priming. Legacy `welcome.dart` exists but is dead/unreferenced; `smooth_page_indicator` is an unused abandoned-carousel dependency | navigation-and-app-shell |
| **Dark mode / design tokens** | Legacy had one hardcoded light theme; brand colors are raw literals scattered across widgets (teal `0xFF0C4C60`, orange `0xFFE28A4B`, health-yellow `0xFFFFDA7C`). Extract into a token layer | design-system-and-theming |
| **Achievements** | `achievement` + `user_achievement` GORM tables are migrated & seeded but have **zero** controller/route/repo/UI — schema-only dead feature. Treat as greenfield product scope, not a port | analytics-and-insights |

## Key flows — how to use this guide on an implementation task

1. **Identify the subsystem** you're touching and find its bucket in the map above.
2. **Open the relevant `old/` source** to extract exact rules/constants. Prefer the **Go backend GORM models + repository** for logic/schema; the **Flutter feature folder** for UX/flow. Prefer GORM models over `pawductivity.sql` where they disagree — the SQL script is stale (GORM adds `current_xp`, `needed_xp`, `profile_index`, `tasktag`, `duration`, `repetition`).
3. **Verify every number** you cite against the file (per conventions §5) — several legacy constants are internally contradictory (see step 5).
4. **Re-implement locally**: relational → expo-sqlite; ephemeral/settings → MMKV+Zustand; any "nightly" behavior → lazy compute on app open; AI → client-side Claude. Never reproduce a network call.
5. **Check the [known-bugs register](../../../context/legacy/known-bugs-and-antipatterns.md)** before trusting a constant. The big ones:
   - Reward display `FLOOR(estimatedTime/60/3)` ≠ actual grant `estimatedTime/60` — pick ONE.
   - `needed_xp` seeded 150 but the formula yields 160 at level 1, and `needed_xp` is recomputed with the stale pre-increment level — off-by-one curve.
   - Referral coin-grant errors swallowed; unlimited distinct-code redemption.
   - New-user gets free Cat + 200 coins via `buy_coins` misuse.
6. **Confirm it's not a dead/incomplete feature** in the [dead-features register](../../../context/legacy/dead-and-incomplete-features.md) before "porting" it (HealthShop placeholder, achievements, `welcome.dart`, `calendar_screen.dart` vs `calendar_page.dart`, `profile_old.dart`, Midtrans WebView).
7. **Tag every rule/decision** and roll open questions up into `context/02-open-decisions.md`.

## Local-first rebuild guidance

- **One canonical schema.** Collapse every per-user Postgres table into a single-user on-device expo-sqlite DB (drop `userid` or keep a constant `id=1` profile row). Include the GORM-only columns from day one. See `context/data-model/sqlite-schema.md`.
- **Prefer materialized quantity columns** over the legacy "one row per owned item + `COUNT(*)`" inventory design for `playerFood`/`wardrobe`.
- **Stored procs → TypeScript in a Zustand action inside one SQLite transaction** (`applyTaskReward`: add XP=minutes, loop level-up, add coins, write a ledger row).
- **Postgres ENUMs → TS string-literal unions** + CHECK/validation (`membership class`, `purchase type`, `clothes type`, `reminder type`).
- **Timer**: never trust wall-clock ticks across backgrounding — persist `start epoch` + accumulated seconds in MMKV; expo-notifications for the ongoing notification. Fix the legacy Android config (FGS type was wrongly `location`; ghost `flutter_foreground_task` service; missing `POST_NOTIFICATIONS`/`WAKE_LOCK`/`RECEIVE_BOOT_COMPLETED`/exact-alarm).
- Full mappings: `context/migration/backend-to-local-first.md` and `context/migration/flutter-to-react-native.md`.

## New-app enhancements

The AI features are the reason for the rebuild, not incidental. When implementing any task-creation or pet-render path, route it through the new AI layer (Brain Dump Parser for input, dynamic-Lottie director for pet output) rather than reproducing the legacy manual forms and static-asset-path rendering. See the ai-* skills.

## Open decisions

- `[DECIDE]` Canonical reward formula (grant `min` vs display `floor(min/3)`) and level curve seed (150 vs 160).
- `[DECIDE]` Keep the `estimatedTime > 600s` (10-min) floor, or relax it for short Brain-Dump tasks?
- `[DECIDE]` New-user starting inventory — was "free Cat + 200 coins" intended, or a bug artifact?
- `[DECIDE]` Keep premium/monetization? If so it must go through native store IAP, not a server. Confirm the premium-gated set (Rabbit, Pizza, Tuxedo/Star/Pink).
- `[DECIDE]` Referral — meaningless without a shared backend: drop, make cosmetic (no coin reward), or defer to future sync.
- `[DECIDE]` Multi-device / cloud sync — determines whether any identity concept survives at all.
- `[DECIDE]` Pet health at 0 — die / sad state / block features? Legacy only floors at 0 with no consequence.
- `[DECIDE]` Keep task versioning locally, or mutate in place now that there's no multi-device sync?
- `[DECIDE]` Are hat/pants/shoes clothing slots real, or single-slot cosmetic (only `shirt` was ever seeded)?

These roll up into `context/02-open-decisions.md`.

## Legacy references

- App shell / startup: `old/Pawductivity_App/lib/main.dart`, `lib/theme/app_navbar.dart`, `lib/config/routes/routes.dart`
- DI + network (what to delete): `lib/injection_container.dart`, `lib/config/constant/constant.dart`
- Real client state: `lib/features/user/presentation/bloc/user/remote/remote_auth_bloc.dart`, `lib/features/task/presentation/managers/countdown_manager.dart`
- Backend logic: `old/Pawductivity_BE/internal/repository/task.repository.go`, `purchase.repository.go`, `animal.repository.go`, `referral.repository.go`
- Backend routines (→ lazy compute): `internal/routines/decreasePetHealth.routine.go`, `checkMembership.routine.go`
- Auth/payment (→ DROP): `internal/middleware/jwtMiddleware.go`, `internal/controllers/auth.controller.go`, `premium.controller.go`, `subscription.controller.go`, `internal/utils/decrypt.utils.go`
- Schema truth: `database/migration/migration.go` + `database/migration/model/*.go` (trust) vs `database/script/pawductivity.sql` (stale)
- Native config: `old/Pawductivity_App/android/app/src/main/AndroidManifest.xml`

## Related

- Migration deep-dives: [backend-to-local-first](../../../context/migration/backend-to-local-first.md) · [flutter-to-react-native](../../../context/migration/flutter-to-react-native.md) · [monetization-options](../../../context/migration/monetization-options.md)
- Legacy registers: [architecture-overview](../../../context/legacy/architecture-overview.md) · [backend-api-catalog](../../../context/legacy/backend-api-catalog.md) · [navigation-map](../../../context/legacy/navigation-map.md) · [known-bugs-and-antipatterns](../../../context/legacy/known-bugs-and-antipatterns.md) · [dead-and-incomplete-features](../../../context/legacy/dead-and-incomplete-features.md)
- Data model: [entity-relationship](../../../context/data-model/entity-relationship.md) · [sqlite-schema](../../../context/data-model/sqlite-schema.md) · [state-and-mmkv](../../../context/data-model/state-and-mmkv.md) · [seed-catalogs](../../../context/data-model/seed-catalogs.md)
- Product framing: [product-vision](../../../context/00-product-vision.md) · [glossary](../../../context/01-glossary.md) · [open-decisions](../../../context/02-open-decisions.md)
- Subsystem skills: [pawductivity-overview](../pawductivity-overview/SKILL.md) · [pet-companion-system](../pet-companion-system/SKILL.md) · [task-quest-system](../task-quest-system/SKILL.md) · [focus-timer-and-background](../focus-timer-and-background/SKILL.md) · [coin-economy-and-shop](../coin-economy-and-shop/SKILL.md) · [premium-and-monetization](../premium-and-monetization/SKILL.md) · [local-first-data-layer](../local-first-data-layer/SKILL.md)
