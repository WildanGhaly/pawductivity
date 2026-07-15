# Pawductivity — Rebuild Knowledge Base

> The map you open first. This workspace defines **how Pawductivity should work** so the product owner can review the plan before any new code is written.

**Pawductivity** is a gamified, local-first productivity app built around a **virtual pet companion**: you complete tasks (framed as **quests** for your pet), earn **coins**, level up, and keep your companion healthy and growing. The legacy product's own tagline: *"a task tracker and timer app with gamification, featuring virtual pets and accessories to make your productivity journey fun and engaging"* (legacy: Pawductivity-Website/components/footer.tsx:15).

---

## What this workspace is

This is a **knowledge base for a ground-up rebuild of Pawductivity**, and we are currently in the **business-process-definition phase** — we are *not* writing app code yet. Each file describes how one subsystem *should* work in the new app, grounded in exactly what the legacy app actually did.

- **Old product** (the source of truth for *what it did*): a Flutter mobile app + Go backend + Next.js marketing site, all under `old/`.
- **New product** (what these docs specify): **React Native + Expo, 100% local-first** — `expo-sqlite` (relational data), `react-native-mmkv` + **Zustand** (state/settings/ephemeral timer state), and on-device scheduling. Two net-new features — the **Brain Dump** capture and dynamic **Lottie** control — ship **rules-based / FE-only in the MVP**; their **client-side Claude AI layer is an optional Phase-2** enhancement (BYO-key or thin proxy), not required to run. See [`context/03-fe-only-gap-analysis.md`](context/03-fe-only-gap-analysis.md).
- **No backend server.** Accounts, JWT auth, server sync, server cron routines, and third-party analytics are being removed; server-driven behavior becomes on-device computation from timestamps.

Everything here is a **specification / reference**, not implementation. Numbers and formulas are quoted from the legacy code and verified against `old/`.

## How it was produced

The `old/` codebase was analysed subsystem-by-subsystem into structured "findings," then turned into the forward-looking specs in this repo. Sources analysed:

| Legacy component | Stack | Location | Role in the rebuild |
|---|---|---|---|
| **Pawductivity_App** | Flutter (Dart) | `old/Pawductivity_App/` | The real UX + business logic to port — pet, tasks/quests, timer, shop, coins, levels. |
| **Pawductivity_BE** | Go (GORM + Postgres) | `old/Pawductivity_BE/` | Server rules & seed catalogs to fold into local SQLite; the server itself is dropped. |
| **Pawductivity-Website** | Next.js (pages router) | `old/Pawductivity-Website/` | Product positioning, pricing, and legal copy — most stays true; the privacy/legal copy must be rewritten for local-first. |

Every business rule, behavior, and recommendation carries a **change-intent tag** (legend below) and a **legacy citation** back to the exact source file, so a reviewer can trace any claim.

## How to review this knowledge base

Read in this order:

1. **[`context/00-product-vision.md`](context/00-product-vision.md)** — start here. The what/why of the product and the local-first rebuild direction.
2. **[`context/01-glossary.md`](context/01-glossary.md)** — the canonical vocabulary used across every file (Companion, Quest, Focus Session, Coins, Premium, …). Skim it so the terms read consistently.
3. **The skills, by subsystem** — the [Table of Contents](#table-of-contents) below. Each `.claude/skills/<name>/SKILL.md` is a self-contained spec for one subsystem, and doubles as an auto-loaded reference for Claude Code during development. Read the ones you care about most; **[pawductivity-overview](.claude/skills/pawductivity-overview/SKILL.md)** ties them together.
4. **[`context/03-fe-only-gap-analysis.md`](context/03-fe-only-gap-analysis.md)** — **the FE-only feasibility verdict.** Feature-by-feature: what ships with no backend (≈95%), and the exact gaps (cloud-LLM AI, referral, IAP verification) with their resolutions.
5. **[`context/02-open-decisions.md`](context/02-open-decisions.md)** — **this is where your input is needed.** Every `[DECIDE]` raised anywhere rolls up here: pricing model, iOS scope, referral without a backend, what to do about the legacy privacy policy, and more.

The `context/` folder holds the shared reference material the skills link into: the data model, the legacy record (architecture, API catalog, bugs, dead features), the migration guides, and the design tokens.

---

## Table of contents

### Skills — one spec per subsystem (`.claude/skills/<name>/SKILL.md`)

| Skill | What it covers |
|---|---|
| [pawductivity-overview](.claude/skills/pawductivity-overview/SKILL.md) | The whole-product map: how every subsystem fits, the core loop, and the local-first architecture at a glance. Start here among the skills. |
| [pet-companion-system](.claude/skills/pet-companion-system/SKILL.md) | The Companion: species (Dog/Cat/Rabbit), Evolution stages 1–5, Health 0–100, Mood, daily health decay, and how the pet's state drives everything. |
| [task-quest-system](.claude/skills/task-quest-system/SKILL.md) | Tasks framed as Quests — Target, Checklist, and Focus quests; creation, completion, coin/XP rewards, and deadlines. |
| [focus-timer-and-background](.claude/skills/focus-timer-and-background/SKILL.md) | Focus Sessions (the timer) and background survival: timestamp-based elapsed time, ongoing notifications, and app-resume recovery. |
| [reminders-and-calendar](.claude/skills/reminders-and-calendar/SKILL.md) | Deadlines, reminders, and the calendar/activity view; local notification scheduling and recompute-on-boot. |
| [coin-economy-and-shop](.claude/skills/coin-economy-and-shop/SKILL.md) | Coins as soft currency: how they're earned, the coin ledger, and the unified Shop where they're spent. |
| [food-and-feeding](.claude/skills/food-and-feeding/SKILL.md) | Food inventory and Feeding to restore Health (capped at 100); seed food catalog and heal values. |
| [clothes-and-wardrobe](.claude/skills/clothes-and-wardrobe/SKILL.md) | Cosmetic clothes, the Wardrobe, Equipping onto the companion, and the seed clothes catalog. |
| [gamification-xp-levels](.claude/skills/gamification-xp-levels/SKILL.md) | The *user's* XP and Level (distinct from Evolution stage), the level-up formula, streaks, and reward-on-level-up rules. |
| [premium-and-monetization](.claude/skills/premium-and-monetization/SKILL.md) | The Premium tier, entitlement, Google Play IAP, and the honest options for billing without a backend. |
| [referral-system](.claude/skills/referral-system/SKILL.md) | Invite-a-friend codes (+100 coins to both) and the challenge of referral in a no-backend, local-first app. |
| [analytics-and-insights](.claude/skills/analytics-and-insights/SKILL.md) | The summary/stats screens — rebuilt as on-device SQLite aggregate queries; third-party telemetry dropped. |
| [lottie-animation-engine](.claude/skills/lottie-animation-engine/SKILL.md) | State-driven Lottie pet rendering: how Health/Mood/Evolution select the animation asset to play. |
| [ai-braindump-parser](.claude/skills/ai-braindump-parser/SKILL.md) | **[NEW]** Brain Dump capture → structured tasks/quests; **rules-based in MVP**, optional Phase-2 Claude parsing. |
| [ai-lottie-director](.claude/skills/ai-lottie-director/SKILL.md) | **[NEW]** Client-side Claude that dynamically drives/composes Lottie animation on-device. |
| [local-first-data-layer](.claude/skills/local-first-data-layer/SKILL.md) | The persistence architecture: expo-sqlite for relational data, MMKV + Zustand for state/settings, no server. |
| [account-and-profile](.claude/skills/account-and-profile/SKILL.md) | Identity collapses to a single local profile — edit name/avatar, settings, and data reset/delete (all net-new UI). |
| [navigation-and-app-shell](.claude/skills/navigation-and-app-shell/SKILL.md) | The app skeleton: the tab shell (legacy 5-tab PageView), startup/splash flow, and one coherent navigator. |
| [design-system-and-theming](.claude/skills/design-system-and-theming/SKILL.md) | Brand palette, typography, tokens, and dark mode (net-new) — replacing scattered hardcoded color literals. |
| [notifications-and-permissions](.claude/skills/notifications-and-permissions/SKILL.md) | Local notifications and the Android/iOS permission model the timer + reminders depend on. |
| [legacy-migration-guide](.claude/skills/legacy-migration-guide/SKILL.md) | The overall port plan: Flutter→RN, backend→local-first, and what to drop vs. keep. |

### Context — shared reference (`context/`)

| Doc | What it covers |
|---|---|
| [00-product-vision](context/00-product-vision.md) | The product, the audience, and the local-first rebuild direction. **Reviewer entry point.** |
| [01-glossary](context/01-glossary.md) | Canonical vocabulary — the exact terms every file uses. |
| [02-open-decisions](context/02-open-decisions.md) | Every `[DECIDE]` rolled up. **Where your input is needed.** |
| [03-fe-only-gap-analysis](context/03-fe-only-gap-analysis.md) | FE-only (no-backend) feasibility verdict, feature-by-feature, with the hard gaps and their resolutions. |
| [data-model/entity-relationship](context/data-model/entity-relationship.md) | The entities and how they relate (ERD) across the whole app. |
| [data-model/sqlite-schema](context/data-model/sqlite-schema.md) | The proposed expo-sqlite table schema. |
| [data-model/state-and-mmkv](context/data-model/state-and-mmkv.md) | What lives in MMKV + Zustand vs. SQLite (settings, entitlement, timer state). |
| [data-model/seed-catalogs](context/data-model/seed-catalogs.md) | Seed pets, foods, and clothes — prices and stats to bundle locally. |
| [legacy/architecture-overview](context/legacy/architecture-overview.md) | How the old Flutter + Go + Next.js system was wired together. |
| [legacy/backend-api-catalog](context/legacy/backend-api-catalog.md) | The old Go API surface — every route, folded into local logic. |
| [legacy/navigation-map](context/legacy/navigation-map.md) | The old app's screen graph, routes, and the duplicate/mid-migration screens. |
| [legacy/known-bugs-and-antipatterns](context/legacy/known-bugs-and-antipatterns.md) | Real bugs and antipatterns to *not* carry over (coin discrepancy, plaintext password, wrong FGS type, …). |
| [legacy/dead-and-incomplete-features](context/legacy/dead-and-incomplete-features.md) | Shipped-but-dead surfaces (achievements schema-only, HealthShop placeholder, dead onboarding, Midtrans WebView). |
| [migration/flutter-to-react-native](context/migration/flutter-to-react-native.md) | Porting the Flutter app to React Native + Expo. |
| [migration/backend-to-local-first](context/migration/backend-to-local-first.md) | Turning server behavior (cron, sync, auth) into on-device computation. |
| [migration/monetization-options](context/migration/monetization-options.md) | Honest billing options when there's no backend to verify receipts. |
| [design/brand-and-tokens](context/design/brand-and-tokens.md) | The extracted brand palette and design tokens. |

Root files: this **README** (the map) and **CLAUDE.md** (project instructions for Claude Code).

---

## Change-tag legend

Every rule, decision, and mapping in this knowledge base is tagged with exactly one intent:

| Tag | Meaning |
|---|---|
| **[PRESERVE]** | Keep this legacy behavior as-is in the new app. |
| **[CHANGE]** | Keep the concept but change the implementation — almost always **server → local**. |
| **[NEW]** | Net-new capability with no legacy equivalent (Brain Dump AI, dynamic AI Lottie, dark mode, onboarding, achievements). |
| **[DROP]** | Legacy behavior to delete (accounts/JWT, server sync, plaintext-password storage, Midtrans, Amplitude). |
| **[DECIDE]** | An open product decision the owner must make — all collected in [`context/02-open-decisions.md`](context/02-open-decisions.md). |

---

## Legacy at a glance

- **Distribution:** Google Play only (Android), package `com.production.pawductivity` — no iOS path shipped (legacy: Pawductivity-Website/pages/index.tsx:35). iOS is now feasible with RN/Expo — see open decisions. **[DECIDE]**
- **Monetization is contradictory in the legacy:** the site markets premium as a cheap unlock — *"For just Rp3.000,00 … access more pets, foods, clothes"* (legacy: Pawductivity-Website/pages/features/index.tsx:29, ~IDR 3,000 / ~USD 0.20) — while the Terms describe a **recurring monthly license paid via Midtrans**. The app shipped **two** real-money surfaces (Google Play IAP *and* a Midtrans WebView flow). One explicit billing model must be chosen. **[DECIDE]**
- **The legacy is account/server-backed; the rebuild is not.** The old Privacy Policy promises accounts, email collection, cross-border transfer, and server telemetry — none of which fit a no-backend, on-device app. The legal/privacy copy must be **rewritten**, and auth/JWT/Google-Sign-In are **[DROP]**ped in favor of a single local profile.
- **Real local state already lived in key/value, not a database.** The app's live client state (auth token, timer keys, and a **plaintext user password** — a security finding) sat in `flutter_secure_storage`; this maps to **MMKV** in the rebuild, minus the things we're dropping.
- **Server behavior becomes on-device computation.** Health decay (−1/day at local midnight) and membership expiry ran as server cron jobs; the new app recomputes them from timestamps on app-open/resume. **[CHANGE]**
- **Several "features" were never real.** Achievements/badges exist as schema only (no endpoints, no UI); a HealthShop route is a placeholder grid of *"Item 0..19"*; onboarding/welcome is dead code. These are greenfield scope, not systems to port — see [dead-and-incomplete-features](context/legacy/dead-and-incomplete-features.md).
- **The AI features are net-new.** The legacy used manual task forms and static animations. **Brain Dump** (NL → structured quests) and the **AI Lottie director** are additive upgrades to the existing pet/task pillars — the site already ships a Lottie cat, so the animation pipeline is an evolution, not a new medium.

---

## Related

- [`context/00-product-vision.md`](context/00-product-vision.md) — the product vision (read first)
- [`context/02-open-decisions.md`](context/02-open-decisions.md) — decisions awaiting the owner's input
- [`.claude/skills/pawductivity-overview/SKILL.md`](.claude/skills/pawductivity-overview/SKILL.md) — the whole-product overview
