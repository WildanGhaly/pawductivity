# Pawductivity — Implementation Spec (derived from prototype/pawductivity_v1.html)

Single source of truth for the RN rebuild. Where the prototype JS and the asset
README (`_pawductivity-assets/README.md`) disagree on numbers, THE PROTOTYPE JS WINS
(its comment: "catalogs (source of truth = business spec)"). See Decisions log at bottom.

Target stack: Expo ~57, React 19.2, React Native 0.86, TypeScript. Offline-first,
local persistence via expo-sqlite. Backend only for referral + cloud sync, both PARKED
(stubbed locally this run).

## Design tokens (from prototype CSS `:root`)
- teal `#0C4C60`, teal-2 `#12667F`, teal-ink `#0B2530`
- orange `#E28A4B`, orange-2 `#C9773A` (accent, themeable)
- yellow `#FFDA7C`, yellow-2 `#F4B942`
- coin-ink `#1E4B5F`, ink `#2D2F41`, muted `#8B897E`
- cream `#FBF6EC` (app bg), card `#FFFFFF`, line `#EFE6D6`, line-2 `#E4D8C2`
- grass `#A7C34F`, sky `#BFE3F3`, wall `#A0B559`, floor `#DCC79A`
- good `#1E7F91`, danger `#E5654B`, pink `#E68FB0`
- shadow `0 10px 26px rgba(12,76,96,.10)`, shadow-sm `0 4px 12px rgba(12,76,96,.08)`
- nav height 74px, device frame max 440x940, radius: card 20, btn 16
- Font: Poppins 400/500/600/700/800. Buttons use a 3D bottom-shadow press effect.
- Category dots: Work `#6E8BA0`, School `#C79350`, Sport `#6FA06B`, Personal `#B07E9A`, Project `#8580B0`
- Mood dots: happy `#1E7F91`, content `#E9B24C`, tired `#C79350`, hungry `#D98C6A`

## Screen map (nav graph)
Root stack, phone-frame layout:
1. **splash** -> auto-advances after 2600ms. 16 rotating quotes (SPLASH_LINES). Logo + wordmark + tagline "Get things done. Grow a friend."
2. **onboarding** (3 steps): hero -> pick starter (Dog id1 / Cat id2, both free) -> name pet. On finish: fresh state, species set, +200 coins, go to main/home.
3. **main** = bottom tab bar: Home, Quests, [center capture FAB], Pet, Calendar.
Overlays (slide-up sheets over main): **focus, shop, premium, referral, insights, journey, achievements, recap, sync, profile, appearance**. Transient: toast, reward, confetti, dialog scrim.

### Home tab (`renderHome`)
Top bar: greeting + avatar (opens profile) + coin pill. Pet room with Lottie pet, idle coin pile (tap to collect). Weekly streak card (`homeWeekCard`). Capture entry card. Today's quests (or `emptyToday`). Entry points to focus/shop/journey.

### Quests tab (`renderQuests`)
Capture entry, daily goal card (`openGoal`/`setGoal`), today plan (up to 3 quest ids, `openPlan`/`togglePlan`), quest rows (`questRow`) each with tag+dot, est/done progress, "Start" -> focus. `isDone` = done>=est.

### Pet tab (`renderPet`)
Stages: Baby/Young/Grown/Prime/Legend. `petStage = min(5, 1+floor(home.length/2))`. Segbar. Mood pill from health. Feed sheet (`openFeed`/`feed`), equip clothes (`equip`), link to Journey, Shop, Achievements.

### Calendar tab (`renderCal`)
Full month grid, prev/next + month/year picker, "today" jump, swipe. Reminders list with repeat rules (once/daily/weekdays/weekly/monthly), per-day done tracking (`doneOn` keys `y-m-d`). Add reminder (name + mini-cal day + time picker + repeat). `remOccurs`/`remInMonth` compute occurrences.

### Capture (`openCapture`) — unified quick-add + brain dump
- Quick add: title + duration chip (15m/25m/45m/1h/2h = 900/1500/2700/3600/7200s) + tag (Work/School/Sport/Personal/Project) + repeat (Once/Daily/Weekdays). `commitQuick`.
- Brain dump: multiline text -> `parseText` deterministic on-device parser -> multiple quests. `inferTag` guesses category. `commitDump`.

### Focus (`startFocus`/timer)
Modes: standard (Timer) + Pomodoro (WORK 1500s / BREAK 300s). SVG ring (circumference 703.7). Pet with mood-based animation speed. Soundscapes (None/Rain free, Waves/Lo-fi premium) via Web Audio (RN: expo-av or parked). +5min, reset, skip-to-end (demo), pause. On complete (`completeFocus`): bank progress into quest.done, award coins/xp = whole minutes, companion bonus (mood), health effects, reward overlay (`showReward`) + confetti, achievement checks.

### Shop (`openShop`)
Tabs food/pets(companions)/clothes(wardrobe). Coin pill. Cards (`card`) with price, premium lock. Buy flow: `tryBuy` -> `buyDialog` confirm -> deduct coins, add to inventory. Premium items purchasable with coins but gated behind premium flag for some. `buyFood`/`buyPet`/`buyClothes`.

### Premium (`openPremium`)
Paywall. Plans: 1 Month Rp15.000, 1 Year Rp119.000 (best value), 6 Months Rp69.000. "Continue with Google Play" (`buyPremium`, stub). Unlock list. Focus-insights preview -> insights.

### Profile (`renderProfile`)
Avatar (7 options av-0..6, upload), name edit, level/xp, coins, settings toggles (notif/sound), appearance (accents+rooms), sync entry, referral entry, Discord, reset data (typed DELETE gate, `resetData`/`confirmReset`/`doReset`).

### Insights (`renderInsights`) — premium payoff
Range selector (week/month/year/custom). Charts: vertical bars (`vbars`), area (`areaChart`), heat grid (`heatGrid`), day-hour heat (`dayHourHeat`). Category mix, best hours, streaks, totals. `floatLockCard` for non-premium.

### Journey (`renderJourney`) — Pixel's home
9 milestones (JOURNEY): blanket 60, bowl 120, post 220, window 360, toys 540, tree 780, nook 1080, garden 1450, dream 2000. Each perk: +coins/hr (rate), +idle jar hours (cap), or slower health decay. `buildMilestone` spends coins, may grow pet stage.

### Achievements (`renderAchievements`)
~48 badges across groups (Getting started, Focus sessions, Focus time, Streaks, Daily goals, Pixel's growth, Pixel's home, Care & wardrobe, Coins, Habits & style). Progress via `achProg`/`achMet`. `checkAch` grants + toasts.

### Recap (`openRecap`) — weekly, shareable
Range, verdict, stats. Built on device. `copyRecap`/`shareRecap` (share needs net).

### Sync (`renderSync`) — backup & cloud (SIMULATED / parked backend)
Sign in (Google, stub), auto/wifi-only toggles, pending count, last sync, merge conflict resolution (`mergeAsk`/`resolveMerge`), force-fail testing. All simulated locally in prototype; real backend PARKED.

### Referral (`redeemRef`)
Invite code (PAW-7K4Q), share (needs net), redeem a friend's code (needs net). Give 100 / get 100 coins. Real verification PARKED (needs backend); UI stubbed + local placeholder.

### Appearance (`openAppearance`)
Accents (ACCENTS, some premium) recolor --orange. Rooms (Cozy room / Meadow) change --room-bg.

## Data model (from `freshState`) -> SQLite tables
- **profile**: name, avatar(0-6), level, xp, needed, coins, premium(bool)
- **pet**: species(dog/cat), name, health(0-100), stage, clothesId(0=none), home(json array of milestone ids), lastCollect(ts), food(json {foodId:count}), ownedClothes(json array)
- **streak**: current, longest
- **quests**: id, name, tag, est(sec), done(sec), due(nullable), repeat(bool), focus(bool)
- **reminders**: id, name, time(HH:MM), rep(once/daily/weekdays/weekly/monthly), anchor(y/mo/day), doneOn(json array of y-m-d keys)
- **completedDays**: offsets from today (or store as dates)
- **settings**: notif, sound, accent, room, notifAsked
- **cloud**: signedIn, email, lastSync, pending, status, auto, wifiOnly, lastError, device
- **insights**: precomputed chart aggregates (derive from real events where feasible; seed otherwise)
- **today**: min, sessions, goalMin
- **plan**: up to 3 quest ids
- **lifetime**: sessions, minutes
- **achievements**: array of unlocked ids
- counters: nextId, nextRem

## Catalogs (AUTHORITATIVE — prototype JS)
FOODS: Apple 5c +10hp; Chicken 5c +10; Pizza 15c +20 (premium); Watermelon 8c +10; Carrot 10c +15.
CLOTHES: Cyan T-shirt 80; Green Shirt 150; Tuxedo 320 (prem); Star Shirt 250 (prem); Pink Dress 400 (prem). Each maps to `<species>_<id>.json` Lottie when worn.
SPECIES: Dog 500; Cat 800; Rabbit 1200 (premium).

## Core mechanics (exact formulas)
- `reward(est) = floor(est/60)` — coins == xp == whole minutes of the estimate.
- `moodOf(h)`: h>=80 Happy(spd1.25,bonus.25) / h>=40 Content(spd1,bonus.10) / h>=15 Tired(spd.7,0) / else Hungry(spd.6,0).
- `shieldActive = health>=60`.
- `petStage = min(5, 1+floor(home.length/2))`.
- `moodRate`: h>=80->1, >=40->.7, >=15->.4, else .25.
- `idleRate = max(1, round((6 + homePerkRate) * moodRate))` coins/hr.
- `idleCap = 8 + homePerkCap` hours. `idlePending = floor(min(cap, hoursSinceCollect) * idleRate)`.
- Pomodoro: WORK 1500s, BREAK 300s. Ring circumference 703.7.
- Stages names: Baby/Young/Grown/Prime/Legend. STAGE_GOAL=4 sessions/stage (legacy note).

## Assets
101 files under `assets/` (icon/, food/, clothes/, pet/{cat,dog,rabbit}/, nav/, ui/, profile/, images/). Lottie pet animations per species+clothes: `<species>_<clothesId||default>.json`. Fonts Poppins-Regular/Bold under assets.

---
## Decisions log (pragmatic calls, full-auto mode)
- D1: Prototype JS catalog values (prices/heal/premium) are authoritative over the asset README where they differ. Reason: JS is the running spec; README is descriptive and stale.
- D2: Cloud sync + referral verification backend are PARKED (per intake). UI built 1:1, backed by local placeholder logic. No server this run.
- D3: Rabbit is premium (JS: 1200 coins + premium flag). Prototype onboarding only offers Dog/Cat (free starters); Rabbit via shop.
- D4: Web Audio soundscapes -> on RN, use expo-av if trivial, else park the actual audio and keep the UI/selection working.
