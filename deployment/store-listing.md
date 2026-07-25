# Store listing — paste-ready copy

Fill these into **Play Console → Grow → Store presence → Main store listing**. Character limits
noted; everything below is within limits. Adjust voice to taste.

---

## App name  (≤30 chars)
```
Pawductivity
```
(12 chars.) Optional with tagline: `Pawductivity: Focus Pet` (23).

## Short description  (≤80 chars)
```
Turn tasks into quests and raise a pet that grows as you get things done.
```
(72 chars.) Alternatives:
- `A focus timer with a virtual pet. Do your tasks, grow your companion.` (69)
- `Gamified focus & to-do. Finish quests, feed your pet, build your streak.` (71)

## Full description  (≤4000 chars)

> HONEST version. The app does NOT yet send OS notifications (no expo-notifications),
> so do not claim focus-completion or reminder notifications — Play flags listings that
> describe features the app lacks ("does not reflect your app's features"). Re-add those
> lines only after notifications are actually implemented.

```
Pawductivity turns getting things done into raising a companion you care about.

Set your tasks, start a focus session, and every minute you focus earns coins and XP that keep
your pet happy and help it grow. It is a gentle, game-like loop that makes concentration feel
rewarding instead of a chore.

WHAT YOU CAN DO

- Raise a virtual pet
Adopt a cat or dog (a rabbit unlocks with Premium), give it a name, and watch its mood follow how
you are doing. Feed it, dress it in outfits from the wardrobe, and build its forever home piece by
piece as you focus.

- Focus in sessions
Pick a task, choose a length, and start the timer. Optional focus soundscapes help you settle in.
Your elapsed time is tracked accurately even if you leave the app or lock your phone.

- Turn thoughts into quests
Quick-add a single task or brain-dump a whole list in plain language, tag it (Work, School, Sport,
Personal, Project), and set it to repeat once, daily, or on weekdays. Pick up to three to focus on
today.

- Earn coins and spend them
Finishing focus sessions pays out coins. Spend them in the shop on food to keep your pet healthy
and outfits to dress it up. Level up, keep your daily streak alive, and unlock milestones that
build your pet's home.

- See your progress
Track your focus time by day, your best hours, category breakdowns, and streaks, with a shareable
weekly recap. Collect badges as you hit new milestones.

- Private by design, works offline
Pawductivity is local-first. Your tasks, your pet, and your progress stay on your device. No
account and no sign-up needed to use it day to day.

PREMIUM (OPTIONAL SUBSCRIPTION)
Pawductivity Premium unlocks the Rabbit companion, premium foods and outfits, and a detailed
productivity dashboard. It is billed through Google Play as an auto-renewing subscription (monthly,
6-month, or yearly), and you can manage or cancel anytime in Google Play. The core experience,
tasks, the focus timer, coins, the shop, and your starter pet, is free.

Whether you are studying, working, building a habit, or just beating procrastination, Pawductivity
gives your focus a face.
```

## What's new  (release notes, ≤500 chars)
```
First release of Pawductivity: gamified focus with a virtual pet that grows as you get things
done. Focus timer, quests, coins, shop, streaks, badges, and a weekly recap. Works offline, your
data stays on your device.
```

---

## Categorization
- **App category:** `Productivity` (or `Games → Casual` if you want the games storefront — but
  Productivity fits the utility framing better and avoids stricter "games" ad/rating expectations).
- **Tags (Play Console store tags):** productivity, to-do list, focus / concentration, habit
  tracker, virtual pet.
- **Store listing contact details (public):**
  - Email: **required & public** — use a support inbox you're happy to expose.
  - Website / phone: optional.

---

## Graphics — specs + what to use

| Asset | Spec | Source / status |
|---|---|---|
| **App icon** | 512×512 PNG, 32-bit, ≤1 MB, no alpha transparency (flatten on a solid background) | Export from `_pawductivity-assets/branding/logo-paw.png` on the teal `#0C4C60` background. |
| **Feature graphic** | 1024×500 PNG/JPG, no alpha | 🧑 Design one: pet + wordmark on the meadow (`meadow-background.png`) or teal. Required to publish. |
| **Adaptive launcher icon** (in-app, not store) | foreground + background layers | Configure in `app.json` (see build-signing-iap.md) using the paw logo on teal. |
| **Phone screenshots** | 2–8 images, PNG/JPG, 16:9 or 9:16, 320–3840 px per side | ⛔ Capture from the rebuilt app — shot list below. |
| **7"/10" tablet screenshots** | optional | skip unless you target tablets. |

### Screenshot shot list (capture once the app is rebuilt)
1. **Home** — the companion in its room + today's focus stats (the hook).
2. **Focus session running** — the countdown + pet, mid-session.
3. **Quests / brain-dump** — the task list with a quest being captured.
4. **Shop** — food or wardrobe with the pet.
5. **Reward moment** — level-up / coins earned / streak.
6. (optional) **Reminders or profile/stats.**

Add a one-line caption band to each (e.g. "Focus that survives backgrounding", "Your pet grows as
you do") — captioned screenshots convert far better than raw captures.
