# Dead & Incomplete Legacy Features

> Catalog of legacy Pawductivity features that are **dead, stubbed, schema-only, or shipped-but-unused** — so the rebuild team does NOT waste effort "porting" them and instead makes a deliberate scope decision for each.

This is a **do-not-port / decide-scope** list. Every subsystem here either (a) has no working implementation to copy, (b) exists twice from an unfinished migration, or (c) shipped as real code that the live flow never reaches. For each item: **status**, **evidence** (verified against `old/`), and a **recommended scope decision** with a change-intent tag.

Legend for status:

| Status | Meaning |
|---|---|
| **Schema-only** | DB tables/models exist; no endpoints, no repository, no working UI. |
| **Placeholder** | UI shell renders but has no data, no logic, no purpose. |
| **Dead** | Code exists and compiles but nothing in the live flow reaches it. |
| **Shipped-unused** | Fully built and reachable in code, but the current happy path bypasses it. |
| **Missing** | A capability the product implies (or a legal doc promises) that was never built at all. |
| **Duplicate** | Two parallel implementations from a mid-migration; team must pick one. |

---

## Quick index

| # | Feature | Status | Recommended tag |
|---|---|---|---|
| 1 | Achievements / Badges | Schema-only | [NEW] / [DECIDE] |
| 2 | HealthShop `/shop-health` ("Item 0..19" grid) + potion category | Placeholder | [DECIDE] |
| 3 | Per-category shop pages vs unified shop | Duplicate | [DROP] |
| 4 | Midtrans WebView payment surface | Shipped-unused | [DROP] |
| 5 | Onboarding / WelcomePage + carousel dep | Dead / Missing | [NEW] |
| 6 | Profile action stubs (edit / premium / referral) | Dead | [NEW] |
| 7 | Settings screen | Missing | [NEW] / [DECIDE] |
| 8 | Delete-account / data-reset | Missing (privacy-policy promise) | [NEW] / [DECIDE] |
| 9 | Duplicate / mid-migration code stacks | Duplicate | [DROP] |

---

## 1. Achievements / Badges — schema-only, 100% unimplemented

**Status:** Schema-only (greenfield in practice).

**Evidence**
- Two GORM models exist and are AutoMigrated: `Achievement { ID, Name, Requirements []string }` and `UserAchievement { ID, AchievementID, UserID }` (legacy: `Pawductivity_BE/database/migration/model/achievement.model.go`, `user_achievement.model.go`). Tables are named `achievement` / `userachievement`.
- They are registered for migration at `Pawductivity_BE/database/migration/migration.go:47-48`.
- **No controller, no route, no repository, and no seed data** anywhere in the backend — a grep for `achievement` across the Go code hits only the two model files plus the migration list. There is no `/api/achievement*` endpoint.
- No achievements feature folder exists in the Flutter app. The Profile page carries a commented-out line: `// ProfileBadges(badges: user.badges ?? []),` (legacy: `Pawductivity_App/lib/features/user/presentation/pages/profile.dart:128`) — proof it was *planned* but never wired.
- The `Requirements []string` field hints at rule-driven unlock criteria that were never designed.

**Recommended scope decision** — **[NEW] / [DECIDE].** Treat achievements/badges as **net-new product scope**, not a system to port; there is nothing functional to copy. If the product owner wants gamified badges (e.g. "7-day streak", "first evolution", "100 quests completed"), design them fresh against the new local data model. Otherwise drop the concept entirely. See open decision D-ACH below.

> This dovetails with the existing gamification system (XP/Levels/Streaks). Achievements would layer on top of those already-real signals. Cross-link: [`gamification-xp-levels`](../../.claude/skills/gamification-xp-levels/SKILL.md).

---

## 2. HealthShop `/shop-health` — pure placeholder implying an unbuilt "potion" category

**Status:** Placeholder.

**Evidence** (whole file read — `Pawductivity_App/lib/features/user/presentation/pages/health_shop.dart`)
- The entire screen is a `GridView.builder` of **20 blank cards**, each literally showing the text **`'Item $index'`** (i.e. "Item 0" … "Item 19"). No data source, no price, no purchase action, no product model.
- Contains a **typo'd font family** `fontFamily: 'Poppin'` (the real family is `Poppins`) — a copy-paste stub, never QA'd.
- It is a **live named route**: `case '/shop-health': return _materialRoute(const HealthShop());` (legacy: `Pawductivity_App/lib/config/routes/routes.dart:31-32`).
- An unused asset **`assets/potion.png`** is bundled (declared at `Pawductivity_App/pubspec.yaml:133`), strongly implying an intended **consumable "health potion" category** that would restore companion Health — conceptually adjacent to, or a premium version of, the existing Food/Feeding mechanic.

**Recommended scope decision** — **[DECIDE].** Do NOT port the "Item 0..19" grid. The real decision is a **product** one: should the new Shop have a **consumable "potion / health" category** distinct from Food? Options:
- **(a) Fold into Food** — potions are just higher-heal food items; no new category. Simplest. Aligns with existing Inventory/Feeding.
- **(b) Separate potion category** — instant/large Health restore, possibly premium-gated, with its own art (`potion.png`). More product surface to design.
- **(c) Drop** — Feeding alone covers Health restoration.

See open decision D-POTION. Cross-link: [`food-and-feeding`](../../.claude/skills/food-and-feeding/SKILL.md), [`coin-economy-and-shop`](../../.claude/skills/coin-economy-and-shop/SKILL.md).

---

## 3. Parallel per-category shop pages vs the unified shop — a duplicate stack

**Status:** Duplicate (dead surfaces).

**Evidence**
- Five shop page files coexist (legacy: `Pawductivity_App/lib/features/user/presentation/pages/`): `shop.dart` (the **unified, tabbed** shop that the app actually uses), plus four **standalone per-category pages** — `pet_shop.dart`, `food_shop.dart`, `wardrobe_shop.dart`, `health_shop.dart`.
- Each standalone page has its own named route: `/shop-pet`, `/shop-food`, `/shop-wardrobe`, `/shop-health` (legacy: `config/routes/routes.dart:25-32`). The unified shop is `/shop`.
- The coin/shop analysis focused only on `shop.dart` + its purchase dialogs; these four parallel routes are effectively **dead alternates** left over from an earlier navigation design.

**Recommended scope decision** — **[DROP].** The rebuild ships **one Shop** with category tabs/segments (Pet, Food, Wardrobe, and optionally Potion per item #2). Do not recreate four separate shop screens or their routes. Cross-link: [`coin-economy-and-shop`](../../.claude/skills/coin-economy-and-shop/SKILL.md), [`navigation-and-app-shell`](../../.claude/skills/navigation-and-app-shell/SKILL.md).

---

## 4. Midtrans WebView payment surface — shipped but bypassed

**Status:** Shipped-unused (a full second real-money flow).

**Evidence**
- A complete client UI for a **Midtrans Snap** flow ships: `payment.dart` (plan selection) + `payment_web_view.dart` (a `webview_flutter` `WebView`) (legacy: `Pawductivity_App/lib/features/user/presentation/pages/payment.dart`, `payment_web_view.dart`).
- `payment_web_view.dart` `..loadRequest(Uri.parse(widget.url))` loads the Snap `redirect_url` and its navigation delegate **always returns `NavigationDecision.navigate`** for every request (`payment_web_view.dart:33`) — i.e. there is **no success/failure/completion detection**; it never signals the app that payment finished.
- The Midtrans path is served by `premium_api_service.dart`, but the **live** Premium page (`premium.dart`) is wired to **Google Play IAP** instead. So premium payments are **bifurcated**: two real-money surfaces both have shipped code, only one is reachable in the current flow.

**Recommended scope decision** — **[DROP]** the Midtrans WebView entirely. Do not port either the WebView Snap flow or the Midtrans API client. New-app monetization goes through **native IAP (react-native-iap) or RevenueCat**; server-side receipt verification is the one piece that legitimately wants a backend and is decided separately. The existence of two legacy surfaces is a **warning**, not a blueprint. Cross-link: [`premium-and-monetization`](../../.claude/skills/premium-and-monetization/SKILL.md), [`../migration/monetization-options.md`](../migration/monetization-options.md).

---

## 5. Onboarding — WelcomePage is dead; no first-run flow at all

**Status:** Dead (WelcomePage) + Missing (real onboarding).

**Evidence**
- `WelcomePage` exists (logo + Login / Sign-Up buttons over `assets/background.png`) (legacy: `Pawductivity_App/lib/features/user/presentation/pages/auth/welcome.dart`).
- It is **imported by `main.dart`** (`main.dart:29`) but **never instantiated** — grep for the `Welcome` widget across `lib/` finds only its own definition and that dead import. The real cold-start flow is `UnifiedSplashScreen → AppNavbar` (authenticated) **or** `→ RegisterPage` (unauthenticated), bypassing Welcome entirely.
- There is **no first-run tutorial, pet-selection wizard, or notification-permission priming** anywhere.
- **Nuance on the carousel dependency:** `smooth_page_indicator: ^1.2.1` is declared (`pubspec.yaml:74`). The completeness finding flagged it as "effectively unused," but it **is** actually imported/used in `profile_widget/profile_pets.dart` (the profile pet carousel). So it is not strictly dead — but it points at the *kind* of swipe-carousel UI an onboarding flow would use, and no onboarding carousel exists. (Discrepancy noted per conventions §5: trust the source.)

**Recommended scope decision** — **[NEW].** There is nothing to port. Onboarding is a **fresh opportunity** with high value for a local-first app:
- **Companion selection** on first run (Dog / Cat / Rabbit) instead of legacy's silent "free Cat named 'My Pet' + 200 coins" default.
- **Notification-permission priming** (critical — see native-config note in [`known-bugs-and-antipatterns.md`](known-bugs-and-antipatterns.md) about the missing `POST_NOTIFICATIONS` declaration).
- A short **"how quests/focus/feeding work"** intro, optionally using a page-indicator carousel.
- Persist an `onboarding_completed` flag in MMKV to gate first-run vs returning-user.

Cross-link: [`navigation-and-app-shell`](../../.claude/skills/navigation-and-app-shell/SKILL.md), [`pet-companion-system`](../../.claude/skills/pet-companion-system/SKILL.md), [`notifications-and-permissions`](../../.claude/skills/notifications-and-permissions/SKILL.md).

---

## 6. Profile action stubs — edit / premium / referral are empty no-ops

**Status:** Dead (non-functional buttons).

**Evidence** (legacy: `Pawductivity_App/lib/features/user/presentation/pages/profile.dart:122-124`)

```dart
onEditProfile:   () {},   // no-op
onExplorePremium:() {},   // no-op
onReferAndEarn:  () {},   // no-op
```

- All three `ProfileHeader` callbacks are **empty closures**. So from the Profile screen: **profile editing does nothing**, the **premium entry point does nothing**, and the **referral entry point does nothing**.
- Referral and Premium *do* have working screens elsewhere (`referral_users.dart`, `premium.dart`), but the Profile buttons that should launch them are dead — the features are reachable only via other paths.
- The **only** Profile mutation that actually works is changing the avatar (`profile_index` → `PATCH /user/profile`). Logout merely deletes the `auth_token` key from secure storage.
- A `profile_old.dart` also exists (duplicate; see item #9).

**Recommended scope decision** — **[NEW].** Rebuild the Profile screen from scratch with **working** entry points. In the new local-first model, "edit profile" = edit local name + avatar (MMKV/SQLite), "premium" opens the paywall, "referral" opens the referral/share flow (scope of referral itself is a separate [DECIDE] — see [`referral-system`](../../.claude/skills/referral-system/SKILL.md)). Do not carry over the no-op wiring. Cross-link: [`account-and-profile`](../../.claude/skills/account-and-profile/SKILL.md).

---

## 7. Settings screen — never existed

**Status:** Missing.

**Evidence**
- There is **no settings screen anywhere** in the app — no route, no page file, no entry point. Grep across `lib/` for a settings page finds nothing.
- Consequences: no theme toggle (there is only one hardcoded light theme — see [`known-bugs-and-antipatterns.md`](known-bugs-and-antipatterns.md) / [`design/brand-and-tokens.md`](../design/brand-and-tokens.md)), no notification preferences, no account controls, no "about"/legal links.

**Recommended scope decision** — **[NEW] / [DECIDE].** The new app needs a real **Settings** surface. Minimum candidates: **theme (light/dark)**, **notification/reminder preferences**, **companion name/species**, **data reset/delete** (item #8), **about + privacy-policy link**, and **restore purchases**. The product owner should confirm the settings inventory (D-SETTINGS). Cross-link: [`account-and-profile`](../../.claude/skills/account-and-profile/SKILL.md), [`notifications-and-permissions`](../../.claude/skills/notifications-and-permissions/SKILL.md), [`design-system-and-theming`](../../.claude/skills/design-system-and-theming/SKILL.md).

---

## 8. Delete-account / data reset — promised but never built

**Status:** Missing (contradicts a legal promise).

**Evidence**
- The backend exposes **`DELETE /api/user`**, and the marketing **Website Privacy Policy promises a data-deletion right** — but the **app has no UI** to invoke it. There is no "delete account", no "reset progress", no data-management screen.
- Legacy "logout" only deletes the local `auth_token` key; it does not touch server data.

**Recommended scope decision** — **[NEW] / [DECIDE].** In the local-first rebuild, "account" collapses to a **single on-device profile**, so "delete account" becomes **"reset / wipe local data"** (drop SQLite tables + clear MMKV, then re-run onboarding). This is easy to implement locally AND satisfies the privacy-policy promise. Decide whether it's a full wipe, a "reset progress but keep purchases," or both (D-DELETE). If any optional cloud sync is later added, revisit true remote deletion. Cross-link: [`account-and-profile`](../../.claude/skills/account-and-profile/SKILL.md), [`local-first-data-layer`](../../.claude/skills/local-first-data-layer/SKILL.md), [`../migration/backend-to-local-first.md`](../migration/backend-to-local-first.md).

---

## 9. Duplicate / mid-migration code stacks — pick one, delete the rest

**Status:** Duplicate (unfinished refactors left both copies in the tree).

These are not "features" so much as **twins**. Porting either blindly risks resurrecting the abandoned half. The rebuild starts clean, but the team should know each pair exists so it can lift behavior from the *correct* one.

| Pair | Files (legacy, under `Pawductivity_App/lib/` unless noted) | Which is live / notes |
|---|---|---|
| Focus timer (old vs new) | `task_timer_page.dart` / `task_management_screen.dart` / `task_screen_old.dart`; new `CountdownManager` | New `CountdownManager` is current; old paths superseded. Timer background start/stop calls are **commented out** in the new manager. Covered in depth by the timer analysis — see [`focus-timer-and-background`](../../.claude/skills/focus-timer-and-background/SKILL.md). |
| Task data stack (old vs new) | `TaskApiService` + `TaskApiServiceOld`, `TaskRepository` + `TaskRepositoryOld`, `RemoteTaskBloc` + `RemoteTaskBlocOld`, plus `old_usecases` | **Both** are registered simultaneously in `injection_container.dart` (get_it). Rebuild uses neither (no network); lift *rules* from the new one. See [`task-quest-system`](../../.claude/skills/task-quest-system/SKILL.md). |
| Calendar (navbar vs route) | `calendar_page.dart` (used by AppNavbar tab 1) vs `calendar_screen.dart` (used by `/calendar` route) | Two **divergent** calendar screens for the same concept. Reconcile to one. See [`reminders-and-calendar`](../../.claude/skills/reminders-and-calendar/SKILL.md). |
| Profile (current vs old) | `profile.dart` vs `profile_old.dart` | `profile.dart` is live (with the dead stubs of item #6); `profile_old.dart` is abandoned. |
| Android foreground service (two declarations) | `android/app/src/main/AndroidManifest.xml` | Two FGS declarations, one a **ghost** plugin (`flutter_foreground_task`) not even in `pubspec.yaml`. Native-config detail lives in [`known-bugs-and-antipatterns.md`](known-bugs-and-antipatterns.md). |

**Recommended scope decision** — **[DROP]** all the abandoned halves. When lifting a business rule during the rebuild, always confirm you are reading the **live** file (per the "which is live" column), not its `*_old` / alternate twin. Cross-link: [`legacy-migration-guide`](../../.claude/skills/legacy-migration-guide/SKILL.md), [`architecture-overview.md`](architecture-overview.md).

---

## Related surfaces documented elsewhere (not repeated here)

These are cross-cutting infra/config problems the completeness pass surfaced. They are **behaviors/bugs**, not dead features, so they live in sibling docs — pointers only:

- **Native Android config** (wrong foreground-service type `location`, ghost `flutter_foreground_task` service, missing `POST_NOTIFICATIONS` / `WAKE_LOCK` / `RECEIVE_BOOT_COMPLETED` / exact-alarm / deep-link intent filters) → [`known-bugs-and-antipatterns.md`](known-bugs-and-antipatterns.md).
- **Plaintext password + JWT-as-auth-gate** persisted in `flutter_secure_storage` → [`known-bugs-and-antipatterns.md`](known-bugs-and-antipatterns.md), [`architecture-overview.md`](architecture-overview.md).
- **No dark mode / hardcoded brand-color literals / no design tokens** → [`../design/brand-and-tokens.md`](../design/brand-and-tokens.md), [`design-system-and-theming`](../../.claude/skills/design-system-and-theming/SKILL.md).
- **Interceptor-less single `Dio`, no 401/refresh/retry, no offline cache** → [`architecture-overview.md`](architecture-overview.md), [`backend-api-catalog.md`](backend-api-catalog.md).
- **Startup/splash/BlocProvider orchestration & the `GetUserInfo` auth gate** → [`navigation-map.md`](navigation-map.md), [`architecture-overview.md`](architecture-overview.md).

---

## Open decisions raised by this catalog

| ID | Decision | Default lean |
|---|---|---|
| **D-ACH** | Are achievements/badges in scope for the rebuild? If yes, define unlock criteria against the new local model. | Defer to a later milestone; ship without. |
| **D-POTION** | Is a consumable "potion / health" shop category in scope, and if so separate from Food or folded in? | Fold into Food (no separate category). |
| **D-SETTINGS** | What is the Settings screen inventory (theme, notifications, companion, data reset, about, restore purchases)? | Ship a minimal Settings with theme + notifications + data reset. |
| **D-DELETE** | Scope of "delete/reset": full local wipe, reset-progress-keep-purchases, or both? | Offer full local wipe (re-runs onboarding). |

All four roll up into [`../02-open-decisions.md`](../02-open-decisions.md).

---

## Legacy references

- `Pawductivity_BE/database/migration/model/achievement.model.go`, `user_achievement.model.go`, `Pawductivity_BE/database/migration/migration.go:47-48` — schema-only achievements.
- `Pawductivity_App/lib/features/user/presentation/pages/health_shop.dart` — placeholder grid ("Item 0..19", `'Poppin'` typo).
- `Pawductivity_App/lib/features/user/presentation/pages/{shop,pet_shop,food_shop,wardrobe_shop}.dart` — unified vs per-category shops.
- `Pawductivity_App/lib/config/routes/routes.dart:25-32` — `/shop-*` route table.
- `Pawductivity_App/lib/features/user/presentation/pages/payment.dart`, `payment_web_view.dart` — Midtrans WebView Snap surface (`payment_web_view.dart:33` always `NavigationDecision.navigate`).
- `Pawductivity_App/lib/features/user/presentation/pages/auth/welcome.dart` + `lib/main.dart:29` (dead import); `pubspec.yaml:74` (`smooth_page_indicator`, actually used in `profile_pets.dart`).
- `Pawductivity_App/lib/features/user/presentation/pages/profile.dart:122-124` (stub callbacks), `:128` (commented `ProfileBadges`); `profile_old.dart` (duplicate).
- `Pawductivity_App/lib/injection_container.dart` — simultaneous old+new task stacks.
- `Pawductivity_App/lib/features/user/presentation/pages/{calendar_page,calendar_screen}.dart` — divergent calendars.
- `Pawductivity_App/assets/potion.png` (`pubspec.yaml:133`) — unused potion asset.

## Related

- [`known-bugs-and-antipatterns.md`](known-bugs-and-antipatterns.md) — native config, security, and interceptor issues.
- [`architecture-overview.md`](architecture-overview.md) — full legacy stack & DI wiring.
- [`navigation-map.md`](navigation-map.md) — screen graph, routes, and dead/duplicate screens in context.
- [`backend-api-catalog.md`](backend-api-catalog.md) — every legacy endpoint (incl. the orphan `DELETE /api/user`).
- [`../02-open-decisions.md`](../02-open-decisions.md) — where D-ACH / D-POTION / D-SETTINGS / D-DELETE aggregate.
- Skills: [`account-and-profile`](../../.claude/skills/account-and-profile/SKILL.md), [`coin-economy-and-shop`](../../.claude/skills/coin-economy-and-shop/SKILL.md), [`food-and-feeding`](../../.claude/skills/food-and-feeding/SKILL.md), [`premium-and-monetization`](../../.claude/skills/premium-and-monetization/SKILL.md), [`referral-system`](../../.claude/skills/referral-system/SKILL.md), [`navigation-and-app-shell`](../../.claude/skills/navigation-and-app-shell/SKILL.md), [`legacy-migration-guide`](../../.claude/skills/legacy-migration-guide/SKILL.md).
