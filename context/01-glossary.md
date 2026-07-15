# 01 — Glossary (Naming Authority)

> **Status:** authoritative. This file is the single source of truth for every domain
> noun in the Pawductivity rebuild. When any other context doc, SKILL.md, migration
> note, or piece of app code disagrees with a term defined here, **this file wins** and
> the other should be corrected. Add a term here *before* using it anywhere else.
>
> **Scope:** the legacy app (`old/Pawductivity_App/`, Flutter + `flutter_bloc` + `floor`
> SQLite + `retrofit` remote API) is a **cloud-backed** app. The rebuild is **local-first**
> (Expo/React Native, `expo-sqlite` + `MMKV` + `Zustand`, no mandatory server). Much of the
> naming drift below exists because the legacy code grew a "task" vocabulary and a
> server-shaped data model that the rebuild deliberately renames and reshapes.

---

## 1. How to read this file

Every row carries a **change-tag** describing how the term moves from legacy → rebuild:

| Tag | Meaning |
|-----|---------|
| `[PRESERVE]` | Term and behavior carry over essentially unchanged. |
| `[CHANGE]` | The concept exists in legacy but is **renamed** and/or **reworked** in the rebuild. The row states both the legacy name and the new canonical name. |
| `[NEW]` | No legacy equivalent. Introduced by the rebuild. |
| `[DROP]` | Existed in legacy; intentionally **removed** from the rebuild. Listed so the name is not accidentally reused. |
| `[DECIDE]` | Open naming/behavior question the product owner must resolve. Flagged inline as **[DECIDE]**. |

**Legacy equivalent & source** columns cite the concrete legacy file(s) so a reader can
verify behavior. Paths are relative to the repo root (`old/Pawductivity_App/lib/...`).

**Canonical vs. forbidden:** the canonical term is the **bold** headword. Forbidden or
legacy-only synonyms are listed as _"legacy: X"_ or _"do not use: X"_ — never introduce
those into new docs or code identifiers.

---

## 2. Naming-drift resolutions (read this first)

These are the renames that cause the most confusion. Everything downstream defers to them.

| Legacy term(s) | Canonical rebuild term | Tag | Why / rule |
|----------------|------------------------|-----|------------|
| `task`, `Task`, `TaskEntity`, `activity` | **Quest** | `[CHANGE]` | The user-facing productivity unit is a **Quest**. "Task" survives only as an internal legacy noun in migration notes. A Quest has a **kind** (Target / Checklist / Focus — see §4). |
| `pet`, `Pet`, `PetEntity`, `animal` | **Companion** | `[CHANGE]` | The creature the user raises is a **Companion**. "Pet" is legacy-only. |
| `animalId` / `animal_id` | **Species** (`speciesId`) | `[CHANGE]` | The kind of animal (Dog/Cat/Rabbit) is the **Species**. Legacy stored it as an integer `animalId`. |
| `asset` (Lottie file such as `dog_1.json … dog_5.json`) | **Evolution stage** | `[CHANGE]` / `[NEW]` | Legacy shipped staged Lottie assets (`*_default`, `*_1`…`*_5`) but drove them only cosmetically. The rebuild promotes the staged assets to a first-class **Evolution stage** progression. |
| `level` (on `UserEntity`) + `LevelEntity{level,currentXp,neededXp}` | **Level** (user only) | `[CHANGE]` | **"Level" always means the *user's* account level**, earned via **XP**. A Companion never has a "level" — its progression is its **Evolution stage**. This kills the legacy "pet level vs user level" ambiguity. |
| `health` (0–100 on `PetEntity`) | **Health** | `[PRESERVE]` | Companion vitality, 0–100, raised by **Feeding**. |
| — (no legacy field) | **Mood** | `[NEW]` | Emotional/expression state of the Companion. No legacy equivalent. |
| `premium` (String `'basic'`/`'premium'` on `UserEntity`) | **Membership class** | `[CHANGE]` | The user's tier label is the **Membership class**. What that tier *grants* is an **Entitlement** (see §5). |
| Midtrans web payment (`snapToken`, `redirectUrl`, `premium1Month/1Year`) | — | `[DROP]` | The Midtrans/`snap` web-checkout path is dropped. Rebuild monetizes via **Google Play IAP subscriptions** only. |
| `floor` / Room SQLite + `retrofit` remote API | **Local-first data layer** (`expo-sqlite` + `MMKV` + `Zustand`) | `[CHANGE]` | The server round-trips become local reads/writes. See §6. |
| `reward` (int coins on a task) | **Coin reward** | `[PRESERVE]` | Completing a Quest yields **Coins**. |
| — | **Brain Dump**, **Parser** | `[NEW]` | Free-text capture + parsing into Quests. No legacy equivalent (legacy had no NLP/parse feature). |
| — | **Streak** | `[NEW]` | Consecutive-day engagement counter. No legacy equivalent. |

---

## 3. Companion domain

| Term | Meaning | Legacy equivalent & source | Tag |
|------|---------|----------------------------|-----|
| **Companion** | The animal the user adopts, names, feeds, dresses, and grows. The emotional core of the app. | `PetEntity{id, animalId, name, health, asset, premium, clothesAsset}` — `features/pet/domain/entities/pet.dart`; `features/pet/data/model/pet.dart` | `[CHANGE]` (legacy: "pet") |
| **Species** | The type of Companion. Legacy ships three: **Dog** (`speciesId 1`, 100 coins), **Cat** (`speciesId 2`, 200 coins), **Rabbit** (`speciesId 3`, 200 coins, premium-only). | `petItems` in `config/constant/pet.dart`; `animalId` on `PetModel` | `[CHANGE]` (legacy: `animalId`) |
| **Evolution stage** | A Companion's growth stage, rendered by a staged Lottie asset. Legacy assets per species: `*_default`, `*_1`, `*_2`, `*_3`, `*_4`, `*_5` (6 files each under `assets/pet/<species>/`). What *advances* the stage is a rebuild decision — **[DECIDE]** whether Evolution is driven by user **XP/Level**, by cumulative **Focus** time, or by sustained **Health**. | Lottie files `assets/pet/{cat,dog,rabbit}/*_{default,1..5}.json`; `asset` field on `PetEntity` | `[CHANGE]`/`[NEW]` |
| **Health** | Companion vitality, integer **0–100**. Raised by **Feeding** (`newHealth = (health + food.stats).clamp(0,100)`). Legacy decayed Health **−1 per day at local midnight, floored at 0** (`Pawductivity_BE/internal/routines/decreasePetHealth.routine.go`: `UPDATE pet SET health = health - 1 WHERE health > 0`); whether the rebuild **keeps** decay, and at what rate, is **[DECIDE]**. | `health` on `PetEntity`; clamp at `features/pet/presentation/widget/feed_pet_listener.dart:110` | `[PRESERVE]` |
| **Mood** | Expressive/emotional state of the Companion (e.g. happy, sleepy, sad), surfaced through animation and speech bubbles. Distinct from Health. | No legacy field. (Legacy had a cosmetic `speech_bubble.dart` only.) | `[NEW]` |
| **Feeding** | Consuming a **Food** item from inventory to increase Companion **Health**. | `feed_pet` usecase `features/pet/domain/usecases/feed_pet.dart`; `feed_pet_listener.dart` | `[PRESERVE]` |
| **Food** | Consumable shop item with a `stats` value = Health granted. Legacy catalog: Apple (3¢, +stats), Chicken (3¢), Pizza (4¢, premium), Watermelon (4¢), Carrot (5¢). Prices in **Coins**. | `foodItems` in `config/constant/food.dart`; `FoodEntity{stats}` `features/food/domain/entities/food.dart` | `[PRESERVE]` |
| **Clothes / Cosmetic** | Wearable cosmetic equipped on a Companion. Legacy catalog: Cyan t-shirt (15¢), Green shirt (10¢), Tuxedo (20¢, premium), Star Shirt (15¢, premium), Pink Dress (client 15¢ vs server-seed 20¢ ⚠️ price conflict — canonical value is a **[DECIDE]**, recommend 20¢ per seed-catalogs & clothes-and-wardrobe, premium). | `clothesItems` in `config/constant/clothes.dart`; `ClothesEntity` `features/clothes/domain/entities/clothes.dart` | `[PRESERVE]` |
| **Equipping** | Putting a Clothes item on a Companion (`clothesAsset` overlays the base Lottie). | `equip_clothes_pet` usecase; `equip_clothes_listener.dart` | `[PRESERVE]` |
| **Wardrobe** | The Companion's owned Clothes and the UI for buying/equipping them. | `wardrobe_shop.dart`, `wardrobe_item_card.dart` under `features/user/presentation` | `[PRESERVE]` |
| **Inventory** | The set of consumables/cosmetics the user owns (owned Food quantities, owned Clothes). | `pet_inventory.dart`; food DAO `features/food/data/data_sources/local/DAO/food.dart` | `[PRESERVE]` |
| **Rename** | Setting/changing a Companion's display `name`. | `rename_pet` usecase; `pet_rename_dialog.dart` | `[PRESERVE]` |
| **Adopt / Purchase (Companion)** | Acquiring a new Companion of a Species by paying its Coin price (some Species gated by premium). | `purchase_pet` usecase; `pet_shop.dart` | `[PRESERVE]` |

---

## 4. Quest & focus domain

| Term | Meaning | Legacy equivalent & source | Tag |
|------|---------|----------------------------|-----|
| **Quest** | The core productivity unit the user creates and completes. Carries a name, description, tag, due date, and a **Coin reward**. | `TaskEntity{taskName, taskDescription, estimatedTime, timeCompleted, isCompleted, dueDate}` `features/task/domain/entitites/task.dart`; `TaskTemplateEntity{tag, reward, repetition, allocatedTime, isOnce, isNoLimit}` `.../task_template_entity.dart` | `[CHANGE]` (legacy: "task") |
| **Quest kind** | The discriminator that selects Quest behavior. Three canonical kinds: **Target**, **Checklist**, **Focus**. Legacy had no explicit kind enum — the split is a rebuild formalization of behaviors that existed implicitly (timed vs. one-off vs. sub-items). | Implicit in legacy flags `isOnce`, `isNoLimit`, `estimatedTime` | `[NEW]` (formalization) |
| **Target quest** | A quest completed by reaching a numeric/one-shot target (check it done, or hit a count). Maps to legacy one-off tasks (`isOnce = true`, no timer). | `isOnce` flag on `TaskTemplateEntity` | `[NEW]`/`[CHANGE]` |
| **Checklist quest** | A quest composed of sub-items (subtasks) all completed to finish the parent. Legacy hint: `subId` on `TaskTemplateEntity`. **[DECIDE]** exact sub-item model. | `subId` on `TaskTemplateEntity`; `todo_list` structures | `[NEW]` |
| **Focus quest** | A time-boxed quest driven by a countdown timer; progress = `timeCompleted / estimatedTime`. This is legacy's primary "timed task". | `estimatedTime`, `timeCompleted`, `progress` getter on `TaskEntity`; `task_timer_page.dart` | `[CHANGE]` |
| **Focus Session** | A single run of the Focus timer for a Focus quest — start → run (foreground + background) → pause/complete. Time accrued adds to `timeCompleted`. | `countdown_manager.dart`, `task_timer_handler.dart`, `background_service.dart` | `[CHANGE]` (legacy: "task timer") |
| **Countdown** | The running timer inside a Focus Session, kept alive across app background via the background service. | `countdown_manager.dart`; `features/task/presentation/managers/` | `[PRESERVE]` |
| **Background service** | OS-level mechanism keeping the Focus timer/notifications running when the app is backgrounded. Legacy: `flutter_background_service`. Rebuild uses an Expo background-task equivalent. | `background/background_service.dart`, `setup_background_service.dart` | `[CHANGE]` |
| **Tag** | User-defined category label on a Quest (used in analytics distribution charts). | `tag` on `TaskTemplateEntity`; `tag_distribution_chart.dart` | `[PRESERVE]` |
| **Reminder** | A scheduled notification entry (once/weekly/monthly/yearly), separate from a Quest. | `ReminderEntity`; `ReminderType{once,weekly,monthly,yearly}` `features/task/domain/entitites/enum.dart` | `[PRESERVE]` |
| **Repetition / Repeating days** | Per-weekday recurrence flags for a Quest. | `repetition: List<bool>` on `TaskTemplateEntity`; `new_task_repeating_days.dart` | `[PRESERVE]` |
| **Due date** | When a Quest is due (epoch ms in legacy). | `dueDate` on `TaskEntity` | `[PRESERVE]` |
| **Brain Dump** | Free-text capture surface where the user dumps unstructured thoughts to be turned into Quests. | No legacy equivalent. | `[NEW]` |
| **Parser** | The component that reads a **Brain Dump** and proposes structured Quests (name, kind, due date, tag). Provider/model for any AI parsing is **[DECIDE]**. | No legacy equivalent. | `[NEW]` |
| **Scheduled entry** | Legacy umbrella over `{task, reminder}` on the calendar. | `ScheduledEntryType{task,reminder}` `enum.dart` | `[PRESERVE]` (internal) |

---

## 5. Gamification, economy & monetization

| Term | Meaning | Legacy equivalent & source | Tag |
|------|---------|----------------------------|-----|
| **Coins** | Soft currency earned by completing Quests, spent in the Shop on Food, Clothes, and Companions. Integer, stored on the user. | `coins` on `UserEntity` (`features/user/domain/entities/user.dart`); `CoinEntity` `features/coin/domain/entities/coin.dart`; `reward` on tasks | `[PRESERVE]` |
| **Coin reward** | Coins granted for completing a Quest. | `reward` on `TaskTemplateEntity`; `new_task_rewards.dart`, `task_details_reward.dart` | `[PRESERVE]` |
| **XP (Experience)** | Points that accumulate toward the next **Level**. | `currentXp`, `neededXp` on `LevelEntity` `features/user/domain/entities/level.dart` | `[PRESERVE]` |
| **Level** | The **user's** account level, raised when XP reaches `neededXp`. **Never** applies to a Companion (see §2). | `level` on `UserEntity` + `LevelEntity`; `get_user_level` usecase; `remote_level_bloc.dart` | `[CHANGE]` (disambiguated) |
| **Streak** | Consecutive-day engagement/completion counter that motivates daily return. | No legacy equivalent. | `[NEW]` |
| **Shop** | Storefront hub. Legacy sub-shops: Pet shop, Food shop, Wardrobe shop, Health shop, Premium. | `shop.dart`, `pet_shop.dart`, `food_shop.dart`, `wardrobe_shop.dart`, `health_shop.dart`, `premium.dart` under `features/user/presentation/pages` | `[PRESERVE]` |
| **Purchase** | Spending Coins (in-app) to buy a catalog item; distinct from a real-money **IAP**. | `purchase_pet`, `purchase_clothes` usecases | `[PRESERVE]` |
| **Membership class** | The user's tier label, legacy string `'basic'` (default) or premium. Names *who* the user is. | `premium` String on `UserEntity` (defaults `'basic'`) | `[CHANGE]` (legacy: `premium` string) |
| **Entitlement** | What a Membership class *grants* — the set of unlocked capabilities/content (premium Species, premium Food/Clothes, premium features). Evaluated locally in the rebuild. | Implicit via `premium: bool` flags on catalog items (`pet.dart`, `food.dart`, `clothes.dart`) and `premium_feature_lock.dart` | `[NEW]` (formalization) |
| **Premium** | The paid tier; unlocks premium Entitlements. Rebuild sells it as a **Google Play IAP subscription**. | `features/premium/*`; `SubscriptionEntity{productId, basePlanId, purchaseToken, status, startDate, expiryDate}` | `[CHANGE]` |
| **Subscription** | A recurring Google Play purchase backing Premium, identified by `productId` + `basePlanId`, validated by `purchaseToken`, with `status` and `expiryDate`. | `SubscriptionEntity` / `SubscriptionModel` `features/premium/data/model/subscription_model.dart`; `subscription_purchase`, `subscription_verify` usecases | `[CHANGE]` |
| **IAP (In-App Purchase)** | Real-money Google Play transaction (vs. Coin purchase). Rebuild's only monetization channel. | `subscription_api_service.dart`; `subscription_purchase.dart` | `[CHANGE]` |
| **Midtrans / Snap payment** | Legacy web-checkout payment path (`snapToken`, `redirectUrl`, `premium1Month/6Month/1Year`). Removed. | `PremiumPayloadEntity{orderId, snapToken, redirectUrl}`; `payment_web_view.dart`; `premium1month/6month/1year.dart` | `[DROP]` |
| **Referral** | Inviting friends via a **referral code**; legacy granted **+100 Coins to both** parties (`referral.repository.go:54-56`). Whether to keep it, the amount, and how to attribute it without a server are **[DECIDE]**. | `create_referral`, `use_referral`, `get_referral_users` usecases; `referral_api_service.dart`; `referral_*` widgets | `[PRESERVE]` |

---

## 6. Local-first architecture & platform

The rebuild replaces the legacy cloud stack (`flutter_bloc` + `get_it` + `floor` SQLite +
`retrofit` remote API against `SERVER_URI = https://fcfcvrer.pawductivity.id`) with a
**local-first** Expo/React Native stack. No feature should assume a server is reachable.

| Term | Meaning | Legacy equivalent & source | Tag |
|------|---------|----------------------------|-----|
| **Local-first** | Architecture principle: the device's local store is the source of truth; the app is fully usable offline; any sync is optional/secondary. | Legacy was cloud-authoritative via `retrofit` API + `SERVER_URI` (`config/constant/constant.dart`). | `[CHANGE]` |
| **expo-sqlite** | Relational local database holding structured domain data (Companions, Quests, Inventory, transactions). Replaces `floor`. | `floor` DB `database/app_database.dart`; DAOs under `features/*/data/data_sources/local/DAO/` | `[CHANGE]` |
| **MMKV** | Fast key-value store for small hot state and flags (settings, session, cached scalars, feature flags). Replaces scattered prefs. | `encrypt`/local prefs usage in legacy | `[NEW]`/`[CHANGE]` |
| **Zustand** | Client state-management store (UI + domain state). Replaces `flutter_bloc` blocs/events/states. | `flutter_bloc` (`remote_*_bloc/event/state.dart` throughout) | `[CHANGE]` |
| **Entity** | A domain object definition (e.g., Companion, Quest). Legacy separated `domain/entities` from `data/model`. | `features/*/domain/entities/*` | `[PRESERVE]` (concept) |
| **Repository** | The boundary that reads/writes a domain aggregate. In the rebuild it targets local stores, not a remote API. | `features/*/domain/repository/*` + `data/repository/*_impl.dart` | `[CHANGE]` |
| **Lottie** | Vector animation format used for Companion Evolution stages, Mood expressions, and effects (`.json` under `assets/pet/`). | `assets/pet/{cat,dog,rabbit}/*.json` | `[PRESERVE]` |
| **Analytics** | Event tracking for usage/insight charts. Legacy used Amplitude; rebuild provider **[DECIDE]**. | `core/amplitude/service.dart`; `features/summary/*`, `home_widget/*_chart.dart` | `[DECIDE]` |
| **Notifications** | Local scheduled notifications for Reminders and Focus events. | `flutter_local_notifications`; `notification_drawer.dart` | `[PRESERVE]` |

---

## 7. Master alphabetical index

Quick lookup → section. Bold = canonical headword; _italic_ = legacy/forbidden synonym pointing to its canonical term.

| Term | Section |
|------|---------|
| _activity_ → **Quest** | §4 |
| **Adopt / Purchase (Companion)** | §3 |
| _animalId_ → **Species** | §3 |
| **Analytics** | §6 |
| **Background service** | §4 |
| **Brain Dump** | §4 |
| **Checklist quest** | §4 |
| **Clothes / Cosmetic** | §3 |
| **Coins** | §5 |
| **Coin reward** | §5 |
| **Companion** | §3 |
| **Countdown** | §4 |
| **Due date** | §4 |
| **Entitlement** | §5 |
| **Entity** | §6 |
| **Equipping** | §3 |
| **Evolution stage** | §3 |
| **expo-sqlite** | §6 |
| **Feeding** | §3 |
| **Focus quest** | §4 |
| **Focus Session** | §4 |
| **Food** | §3 |
| **Health** | §3 |
| **IAP (In-App Purchase)** | §5 |
| **Inventory** | §3 |
| **Level** (user) | §5 / §2 |
| **Local-first** | §6 |
| **Lottie** | §6 |
| **Membership class** | §5 |
| _Midtrans / Snap_ → **[DROP]** | §5 |
| **MMKV** | §6 |
| **Mood** | §3 |
| **Notifications** | §6 |
| **Parser** | §4 |
| _pet_ → **Companion** | §3 |
| **Premium** | §5 |
| **Purchase** (Coins) | §5 |
| **Quest** | §4 |
| **Quest kind** | §4 |
| **Referral** | §5 |
| **Reminder** | §4 |
| **Rename** | §3 |
| **Repetition / Repeating days** | §4 |
| **Repository** | §6 |
| **Scheduled entry** | §4 |
| **Shop** | §5 |
| **Species** | §3 |
| **Streak** | §5 |
| **Subscription** | §5 |
| **Tag** | §4 |
| **Target quest** | §4 |
| _task_ → **Quest** | §4 |
| **Wardrobe** | §3 |
| **XP (Experience)** | §5 |
| **Zustand** | §6 |

---

## 8. Cross-links

This glossary is the naming authority; the following sibling docs consume it and must use
its terms verbatim. (Filenames follow the intended `context/` manifest; create/adjust as
those docs are authored.)

- `../CLAUDE.md` §5 — the change-tag legend and project hard rules (the operative conventions for this repo).
- `context/legacy/` — deep legacy behavior analysis per domain (companion, quest, coin economy, premium IAP, timer/background).
- `context/data-model/` — the `expo-sqlite` schema; entity/table names must match §3–§5 headwords.
- `context/migration/` — legacy → rebuild mapping; uses the §2 drift table as its rename contract.
- `context/design/` — UX/visual specs for Companion (Evolution/Mood), Quest kinds, Shop, Premium.
- Per-domain SKILL docs (`.claude/skills/*`): `pet-companion-system`, `task-quest-system`,
  `coin-economy-and-shop`, `premium-and-monetization`, `focus-timer-and-background`,
  `gamification-xp-levels`, `food-and-feeding`, `clothes-and-wardrobe`, `referral-system`,
  `ai-braindump-parser`, `local-first-data-layer` — each must defer to this glossary for nouns.

---

## 9. Open decisions ([DECIDE] roll-up)

Collected for the product owner's review:

1. **Evolution driver** — does a Companion's Evolution stage advance by user **XP/Level**, cumulative **Focus** time, or sustained **Health**? (§3)
2. **Health decay** — legacy decayed Health −1/day at local midnight; should the rebuild keep decay, and at what rate? (§3)
3. **Checklist quest model** — exact sub-item structure and completion rule for Checklist quests (legacy only hinted via `subId`). (§4)
4. **Parser provider** — which engine/model powers Brain Dump parsing; on-device vs. cloud (tension with local-first). (§4)
5. **Referral reward** — legacy granted **+100 Coins to both** referrer and referee (`referral.repository.go:54-56`); the rebuild must decide whether to keep it, the amount, and how to attribute it with no backend. (§5)
6. **Analytics provider** — replacement for legacy Amplitude, or drop analytics for local-first privacy. (§6)
