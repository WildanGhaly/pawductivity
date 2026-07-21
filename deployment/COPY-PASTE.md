# Play Console fill-in sheet (copy-paste)

Field to paste, screen by screen, in the order Play Console asks. Pure values, no em dashes.
`FILL:` = something only you can supply (your email, a URL). Everything else is ready to paste.

Fixed identity:
- **Package:** `com.pawductivity.app`
- **App name:** `Pawductivity`
- **Category:** Productivity  ·  **App or game:** App  ·  **Free or paid:** Free
- **Contact email (public):** `FILL: your support email`

---

## 1. Main store listing
*Grow > Store presence > Main store listing*

**App name**
```
Pawductivity
```

**Short description**
```
Turn tasks into quests and raise a pet that grows as you get things done.
```

**Full description**
```
Pawductivity turns getting things done into caring for a companion.

Write down what you need to do, run a focus session, and every minute you complete earns XP and coins, and keeps your pet happy. Neglect your work and your companion gets hungry. It is the gentle nudge that makes focusing feel worth it.

A pet that reacts to your productivity
Adopt a Dog, Cat, or Rabbit, name it, and watch its mood follow how well you are doing. Feed it, dress it up, and grow it as you build momentum.

Focus sessions that survive the background
Pick a task, start the timer, and lock in. The countdown stays accurate even if you leave the app, lock your phone, or reboot, and you get a notification the moment your session is done.

Capture tasks without the friction
Just brain dump what is on your mind in plain language. Pawductivity turns it into quests you can start with one tap.

Earn, spend, repeat
Completing quests pays out coins. Spend them in the shop on food to restore your pet's health and outfits to dress it up. Level up, keep your daily streak alive, and watch your companion thrive.

Reminders that fire on time
Set time anchored reminders and get a local notification exactly when you asked, with no account and no internet needed.

100 percent on your device, private by design
Pawductivity is local first. Your tasks, your pet, your progress, all of it stays on your phone. No account. No sign up. No servers. Nothing to leak.

Whether you are studying, working, building a habit, or just trying to beat procrastination, Pawductivity gives your focus a face.

Premium (optional): unlock extra companions, foods, and outfits, plus detailed productivity stats. The core loop of tasks, focus timer, and your starter pet is always free.
```

**Graphics** (upload, not paste):
- App icon 512x512: export `_pawductivity-assets/logo-paw.png` on solid teal `#0C4C60`, no transparency.
- Feature graphic 1024x500: `FILL: design one` (pet + wordmark on teal or the meadow bg).
- Phone screenshots: `FILL: later, from the real app` (min 2 to publish).

---

## 2. Store settings
*Grow > Store presence > Store settings*

- App or game: **App**
- Category: **Productivity**
- Tags: productivity, to-do list, focus, habit tracker, virtual pet
- Contact details email: `FILL: your support email`
- (Website / phone: optional, leave blank)

---

## 3. App content declarations
*Monitor and improve > Policy > App content* (each row is its own section)

**Privacy policy**
```
FILL: public URL where you host deployment/privacy-policy.md
```

**Ads** → select: **No, my app does not contain ads**

**App access** → select: **All functionality is available without special access**
(no login exists; do not add test credentials)

**Content ratings** → start questionnaire, category **Utility / Productivity**, answer every
sensitive category **No**, and **Yes** only to "digital purchases / in-app purchases". Expected
result: Everyone / 3+. Rating summary email address: `FILL: your email`.

**Target audience and content**
- Target age group: **18 and over** (or **13 to 17 and 18+**). Do NOT include under-13.
- Appeal to children: **No**

**Data safety** → answer: **No, my app does not collect or share any user data**
- Data encrypted in transit: not applicable (no data leaves the device)
- Users can request data deletion: yes, on-device reset / uninstall (no server data)
- Account deletion URL: not applicable, the app has no accounts

**News app** → **No**

**COVID-19 contact tracing or status** → **No**

**Financial features** → **My app doesn't provide any financial features**  ← clears the error

**Health** → answer **No** to all (not a health app, no health content)  ← clears the error

**Government apps** → **No**

**Advertising ID** → **No, my app does not use advertising ID**
(AD_ID permission is already blocked in app.json)

---

## 4. Closed testing track config
*Test and release > Testing > Closed testing*

**Countries / regions** → Add: **Indonesia** (add more or select all if you want wider reach)
← clears the "no countries selected" error

**Testers** → create an email list, paste tester Gmail addresses (need 12+ opted in; see
`testers.md`). This clears the "no testers specified" warning.

---

## 5. Release details
*(Internal or Closed) create release*

**Release name**
```
1.0.0 (2) internal shell
```

**Release notes**
```
<en-US>
Internal build to validate signing and installation. Placeholder UI, full app in progress.
</en-US>
```

Ignore the warning "There is no deobfuscation file" (harmless).

---

## Placeholders to fill before submitting
- [ ] Support/contact email (used in store listing, content-rating email, data-safety)
- [ ] Privacy policy hosted at a public URL (fill `[DATE]`, `[YOUR NAME]`, `[SUPPORT EMAIL]` in
      `privacy-policy.md` first, then host it)
- [ ] Feature graphic 1024x500 designed
- [ ] Phone screenshots (from the real app, later)
- [ ] 12+ testers collected and opted in (`testers.md`)
