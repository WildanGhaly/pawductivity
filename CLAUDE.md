# Pawductivity — Claude Code Operating Guide

> Auto-loaded every session. Read this first, then consult the relevant skill in `.claude/skills/` before implementing any subsystem. Keep answers grounded in the knowledge base, not memory.

## 1. What Pawductivity is now

**Pawductivity** is a gamified, **local-first** productivity app with a virtual **pet companion** (a Dog, Cat, or Rabbit) that you nurture by getting work done. The user writes tasks, runs timed **Focus Sessions**, and completing task time earns **XP/Level** and **Coins**, which are spent in the **Shop** on food (to restore companion **Health**) and clothes (cosmetics for the companion). The companion has Health that decays daily and a **Mood** that drives its animation.

This repository is a **ground-up rebuild** in **React Native + Expo**. The legacy product was a Flutter app + Go/Postgres backend + Next.js marketing site (all under `old/`). The rebuild keeps the product concept but **deletes the entire server**: all data lives on the device.

The website (Google Play only, package `com.production.pawductivity`) marketed six pillars we must still deliver — Virtual Pet, Calendar, Coins, Shop, Level, Timer — plus two **[NEW]** capabilities with no legacy equivalent: a **zero-friction Brain Dump** capture and **dynamic state-driven Lottie**. Their **AI/LLM layer is an optional Phase-2 enhancement, deliberately out of the FE-only MVP** (a client can't safely hold an API key, and the text would leave the device); the MVP ships their **rules-based** forms. See [`context/03-fe-only-gap-analysis.md`](context/03-fe-only-gap-analysis.md).

## 2. HARD RULES (non-negotiable)

1. **No backend, no server code — ever.** No REST/GraphQL server, no auth server, no cron daemon, no cloud database. If a task seems to need a server, stop and flag it as `[DECIDE]` in `context/02-open-decisions.md`. The one honest exception is store receipt verification (see rule 6).
2. **100% local-first data.** Route every read/write to:
   - **expo-sqlite** — all relational/catalog data (tasks, pets, coins ledger, inventory, wardrobe, logs). See [local-first-data-layer](.claude/skills/local-first-data-layer/SKILL.md).
   - **react-native-mmkv + Zustand** — settings, entitlement cache, onboarding flags, and ephemeral state (active timer, pet-health cache/last-decay timestamp). MMKV = persisted K/V; Zustand = reactive in-memory state that writes through to SQLite.
   - There is a **single local user** (id=1, or drop `userid` entirely). No accounts, no login, no `userid` foreign keys needed.
3. **AI/LLM is optional and Phase-2 — the FE-only MVP has none.** The MVP ships a **rules-based** Brain Dump capture ([ai-braindump-parser](.claude/skills/ai-braindump-parser/SKILL.md)) and **state/rules-driven** Lottie ([ai-lottie-director](.claude/skills/ai-lottie-director/SKILL.md)) — no network, no API key, nothing leaves the device. A client-side Claude layer is an **optional later enhancement** requiring **BYO-key or a thin proxy** (never a server we build for inference), and everything must work fully with AI off. See [`context/03-fe-only-gap-analysis.md`](context/03-fe-only-gap-analysis.md).
4. **Strip every legacy server dependency.** The legacy app hardcoded `SERVER_URI = "https://fcfcvrer.pawductivity.id"` (legacy: `Pawductivity_App/lib/config/constant/constant.dart`) and talked to it via retrofit/dio for nearly everything. **Do not port the retrofit/dio/get_it network layer, JWT/`auth_token` gate, plaintext-password storage, Midtrans, Google Sign-In, email OTP, or Amplitude.** These are all `[DROP]`.
5. **`old/` is READ-ONLY legacy reference.** Open it to verify behavior, numbers, and seed data — **never copy its server/auth code** into the new app. It is ground truth for *what the product did*, not *how the new app is built*.
6. **Store billing is the only remote touchpoint.** Premium entitlement uses **react-native-iap or RevenueCat**; cache the resolved status + expiry in MMKV and degrade to `basic` offline. Server-side receipt verification is the one thing that genuinely wants a backend — document the trade-off, do not silently build a server. See [premium-and-monetization](.claude/skills/premium-and-monetization/SKILL.md).

## 3. Tech stack

| Concern | Choice |
| --- | --- |
| Runtime / framework | **Expo** (managed) + **React Native** + **TypeScript** |
| Navigation | **expo-router** (one coherent navigator — legacy had a dual named-route + ad-hoc `Navigator.push` mess) |
| Styling | **NativeWind / Tailwind** |
| Relational data | **expo-sqlite** (consider Drizzle for schema/migrations) |
| K/V + settings + ephemeral state | **react-native-mmkv** |
| Reactive state | **Zustand** |
| Animation | **lottie-react-native** |
| Notifications / reminders | **expo-notifications** (+ expo-task-manager / expo-background-task for wake) |
| In-app purchases | **react-native-iap or RevenueCat** |
| Client-side AI *(optional, Phase-2)* | **Claude** (Anthropic API) for Brain Dump parsing + Lottie direction — **not in the FE-only MVP**; needs BYO-key or a thin proxy |

Local-first mapping cheatsheet lives in the conventions and in `context/migration/backend-to-local-first.md`. Server crons (health decay, membership expiry) become **on-app-open computation from timestamps** — never a daemon.

## 4. Where the knowledge lives

Before writing code for any subsystem, **read its skill**. Skills are auto-loaded by topic; treat them as the spec.

- **`.claude/skills/<name>/SKILL.md`** — one per subsystem, each with business rules, exact numbers, data model, flows, and local-first rebuild guidance. Index and overview: [pawductivity-overview](.claude/skills/pawductivity-overview/SKILL.md). Subsystems include: [pet-companion-system](.claude/skills/pet-companion-system/SKILL.md), [task-quest-system](.claude/skills/task-quest-system/SKILL.md), [focus-timer-and-background](.claude/skills/focus-timer-and-background/SKILL.md), [reminders-and-calendar](.claude/skills/reminders-and-calendar/SKILL.md), [coin-economy-and-shop](.claude/skills/coin-economy-and-shop/SKILL.md), [food-and-feeding](.claude/skills/food-and-feeding/SKILL.md), [clothes-and-wardrobe](.claude/skills/clothes-and-wardrobe/SKILL.md), [gamification-xp-levels](.claude/skills/gamification-xp-levels/SKILL.md), [premium-and-monetization](.claude/skills/premium-and-monetization/SKILL.md), [referral-system](.claude/skills/referral-system/SKILL.md), [analytics-and-insights](.claude/skills/analytics-and-insights/SKILL.md), [lottie-animation-engine](.claude/skills/lottie-animation-engine/SKILL.md), [ai-braindump-parser](.claude/skills/ai-braindump-parser/SKILL.md), [ai-lottie-director](.claude/skills/ai-lottie-director/SKILL.md), [local-first-data-layer](.claude/skills/local-first-data-layer/SKILL.md), [account-and-profile](.claude/skills/account-and-profile/SKILL.md), [navigation-and-app-shell](.claude/skills/navigation-and-app-shell/SKILL.md), [design-system-and-theming](.claude/skills/design-system-and-theming/SKILL.md), [notifications-and-permissions](.claude/skills/notifications-and-permissions/SKILL.md), [legacy-migration-guide](.claude/skills/legacy-migration-guide/SKILL.md).
- **`context/`** — cross-cutting reference that many skills share:
  - `context/00-product-vision.md`, `context/01-glossary.md`, `context/02-open-decisions.md`, `context/03-fe-only-gap-analysis.md`
  - `context/data-model/` — [entity-relationship](context/data-model/entity-relationship.md), [sqlite-schema](context/data-model/sqlite-schema.md), [state-and-mmkv](context/data-model/state-and-mmkv.md), [seed-catalogs](context/data-model/seed-catalogs.md)
  - `context/legacy/` — architecture-overview, backend-api-catalog, navigation-map, known-bugs-and-antipatterns, dead-and-incomplete-features
  - `context/migration/` — flutter-to-react-native, backend-to-local-first, monetization-options
  - `context/design/brand-and-tokens.md`

**Rule of thumb:** subsystem logic → read the matching skill; schema/entities/seed numbers → read `context/data-model/`; "why did legacy do X" → read `context/legacy/`.

## 5. Change-tag legend

Every rule, decision, and mapping in this knowledge base is tagged with exactly one:

| Tag | Meaning |
| --- | --- |
| **[PRESERVE]** | Keep this legacy behavior as-is. |
| **[CHANGE]** | Keep the concept, change the implementation (almost always server → local). |
| **[NEW]** | Net-new capability, no legacy equivalent (Brain Dump AI, dynamic Lottie, dark mode, onboarding, achievements). |
| **[DROP]** | Legacy behavior to delete (accounts/JWT, server sync, plaintext-password storage, Midtrans, Amplitude). |
| **[DECIDE]** | Open product decision the user must make — also rolled up into `context/02-open-decisions.md`. |

When you cite a legacy fact or number, cite the real source: `(legacy: Pawductivity_BE/internal/repository/task.repository.go:470)`. Paths are relative to `old/`. Verify constants against source before restating them — the legacy has real discrepancies (e.g. task-completion coin grant `estimatedTime/60` vs. displayed preview `FLOOR(estimatedTime/60/3)`; seed `needed_xp=150` vs. formula value 160).

## 6. Vocabulary & open decisions

- **Use canonical vocabulary only** — Companion, Evolution stage, Health, Mood, Quest (task/quest), Focus Session, Brain Dump, Coins, XP/Level, Streak, Premium/Entitlement, Shop/Inventory/Wardrobe, Feeding/Equipping, Referral, Local-first. Definitions and legacy-name mappings: [context/01-glossary.md](context/01-glossary.md). Do not introduce synonyms.
- **Unresolved product decisions** (pricing model, whether achievements/referral are in scope, iOS support, legal-doc rewrite for a no-account app, canonical reward formula, task versioning) live in [context/02-open-decisions.md](context/02-open-decisions.md). Consult it before designing anything with an open `[DECIDE]`; add new ones there rather than inventing behavior.

## Related

- [context/00-product-vision.md](context/00-product-vision.md) — the north star.
- [context/01-glossary.md](context/01-glossary.md) — canonical vocabulary.
- [context/02-open-decisions.md](context/02-open-decisions.md) — open `[DECIDE]` items.
- [context/03-fe-only-gap-analysis.md](context/03-fe-only-gap-analysis.md) — what ships FE-only with no backend, and the gaps that don't.
- [.claude/skills/pawductivity-overview/SKILL.md](.claude/skills/pawductivity-overview/SKILL.md) — subsystem map and entry point.
- [context/migration/backend-to-local-first.md](context/migration/backend-to-local-first.md) — the server → device mapping.
