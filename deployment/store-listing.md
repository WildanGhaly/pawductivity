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
```
Pawductivity turns getting things done into caring for a companion.

Write down what you need to do, run a focus session, and every minute you complete earns XP and
coins — and keeps your pet happy. Neglect your work and your companion gets hungry. It's the
gentle nudge that makes focusing feel worth it.

★ A pet that reacts to your productivity
Adopt a Dog, Cat, or Rabbit, name it, and watch its mood follow how well you're doing. Feed it,
dress it up, and grow it as you build momentum.

★ Focus sessions that actually survive the background
Pick a task, start the timer, and lock in. The countdown is accurate even if you leave the app,
lock your phone, or reboot — and you get a notification the moment your session is done.

★ Capture tasks without the friction
Just brain-dump what's on your mind in plain language. Pawductivity turns it into quests you can
start with one tap.

★ Earn, spend, repeat
Completing quests pays out coins. Spend them in the shop on food to restore your pet's health and
outfits to dress it up. Level up, keep your daily streak alive, and watch your companion thrive.

★ Reminders that fire on time
Set time-anchored reminders and get a local notification exactly when you asked — no account, no
internet needed.

★ 100% on your device — private by design
Pawductivity is local-first. Your tasks, your pet, your progress — all of it stays on your phone.
No account. No sign-up. No servers. Nothing to leak.

Whether you're studying, working, building a habit, or just trying to beat procrastination,
Pawductivity gives your focus a face.

Premium (optional): unlock extra companions, foods, and outfits, plus detailed productivity
stats. The core loop — tasks, focus timer, and your starter pet — is always free.
```

> Trim/expand as you like; keep the "local-first / private" and "focus timer survives
> backgrounding" points — they're the honest differentiators.

## What's new  (release notes, ≤500 chars)
```
First release of Pawductivity — gamified focus with a virtual pet that grows as you get things
done. Tasks, focus timer, coins, shop, reminders, streaks. 100% on-device.
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
