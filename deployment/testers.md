# Closed-testing tester kit

The 12-tester / 14-day gate is the schedule bottleneck. This is everything needed to hit it
cleanly — the mechanics that trip people up, a ready-to-send invite, and a tracker.

---

## The rule (exactly)

To apply for production access you must:
- have **≥ 12 testers opted in** to a **closed** testing track,
- keep them opted in for **≥ 14 continuous days**,
- with at least one release published to that closed track.

> Internal testing does **not** count toward this. The 14 days must run on a **Closed** track.
> (You can still upload to Internal now to validate the build — but the clock is a Closed-track thing.)

## The trap: an email alone doesn't count

A tester only counts when **all three** happen:
1. You add their **Google-account email** to the track's tester list in Play Console.
2. They open the **opt-in link** and tap **"Become a tester" / accept**.
3. They **install the app from Google Play** (the tester link) on a device.

If someone is on the list but never opts in or installs, they are **not** one of your 12. Over-invite
(aim for ~15–16) so you're safe if a few flake, and check the opted-in count in Console.

## Two ways to manage the tester list

- **Email list** (simplest for ~12): Play Console → *Closed testing* → *Testers* → create an email
  list → paste addresses. Good enough here.
- **Google Group** (easier to grow/manage): create a group, add the group email as the tester list;
  anyone in the group is a tester. Better if the list will churn.

## Device requirement

Each tester needs the app **installed** on a device where they're signed into that Google account.
An emulator counts if signed in with a listed account, but real phones are simplest. One account =
one tester (12 distinct Google accounts, not 12 devices on your account).

---

## Ready-to-send invite (Indonesian)

> Subject: **Bantu tes app-ku di Play Store (5 menit) 🐾**
>
> Halo! Aku lagi rilis app **Pawductivity** (fokus/produktivitas dengan pet virtual) ke Google
> Play, tapi Google minta minimal 12 orang jadi tester dulu selama 14 hari.
>
> Butuh bantuanmu, cuma 5 menit + biarin ke-install aja:
> 1. Kasih aku **email Google (Gmail)** kamu — buat aku daftarin.
> 2. Nanti aku kirim **link**. Buka link-nya → tap **"Jadi tester / Become a tester"**.
> 3. Install **Pawductivity** dari Play Store lewat link itu.
> 4. **Jangan di-uninstall** selama ±2 minggu ya (biar kehitung sama Google).
>
> Itu aja — nggak perlu ngetes macam-macam. Makasih banyak! 🙏

## Ready-to-send invite (English)

> Subject: **Help me test my app on Play Store (5 min) 🐾**
>
> Hey! I'm launching **Pawductivity** (a focus/productivity app with a virtual pet) on Google
> Play, and Google requires at least 12 testers for 14 days before I can publish.
>
> Could you help? ~5 minutes, then just leave it installed:
> 1. Send me your **Google (Gmail) address** so I can add you.
> 2. I'll send a **link** → open it → tap **"Become a tester."**
> 3. Install **Pawductivity** from Play Store via that link.
> 4. **Please don't uninstall** for ~2 weeks (so Google counts you).
>
> That's it — no testing tasks needed. Thank you! 🙏

---

## Tracker (aim for 15–16 to safely clear 12)

| # | Name | Gmail | Added to list | Opted in | Installed |
|---|---|---|---|---|---|
| 1 |  |  | ☐ | ☐ | ☐ |
| 2 |  |  | ☐ | ☐ | ☐ |
| 3 |  |  | ☐ | ☐ | ☐ |
| 4 |  |  | ☐ | ☐ | ☐ |
| 5 |  |  | ☐ | ☐ | ☐ |
| 6 |  |  | ☐ | ☐ | ☐ |
| 7 |  |  | ☐ | ☐ | ☐ |
| 8 |  |  | ☐ | ☐ | ☐ |
| 9 |  |  | ☐ | ☐ | ☐ |
| 10 |  |  | ☐ | ☐ | ☐ |
| 11 |  |  | ☐ | ☐ | ☐ |
| 12 |  |  | ☐ | ☐ | ☐ |
| 13 |  |  | ☐ | ☐ | ☐ |
| 14 |  |  | ☐ | ☐ | ☐ |
| 15 |  |  | ☐ | ☐ | ☐ |
| 16 |  |  | ☐ | ☐ | ☐ |

**Done when:** the "opted-in testers" count in Play Console shows ≥ 12 and stays there for 14 days.

---

## Upload steps (Internal testing — do now to validate the build)

1. Download the AAB (from EAS build `zjjRLRE…`).
2. Play Console → *Test and release* → *Testing* → **Internal testing** → **Create new release**.
3. Accept **Play App Signing** enrollment if prompted (recommended default).
4. Upload the AAB → add release notes → **Save** → **Review release** → **Start rollout to Internal testing**.
5. *Testers* tab → create an email list with your own account → copy the **opt-in URL** → open on
   your phone → install. Confirms signing + package + install work end to end.

When the real app is ready, repeat on the **Closed testing** track — that's the release that starts
the 14-day clock.
