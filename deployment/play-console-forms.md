# Play Console — App content form answers

Paste-ready answers for the mandatory **App content** questionnaires. All assume the **local-first,
no-account, no-ads, no-analytics** design in the business spec. ⚠️ **If you add analytics, crash
reporting, ads, or an off-device AI call, several of these change — revisit before submitting.**

---

## 1. Data safety

**Path:** Play Console → App content → Data safety.

- **Does your app collect or share any of the required user data types?** → **No.**
  - Justification: all user content (tasks, focus history, reminders, pet, coins, settings) is
    stored only on the device; the app has no backend, no accounts, no analytics/ads SDKs, and
    makes no network calls that transmit user data. Google Play Billing handles purchases
    independently (you are not collecting payment data in the app).
- **Is all of the user data encrypted in transit?** → Not applicable (no data leaves the device).
  If the form forces an answer, note there is no data transmission.
- **Do you provide a way for users to request that their data be deleted?** → Users can delete all
  data on-device (in-app reset / uninstall). There is no server-side data.
- **Account deletion URL** → **Not applicable — the app has no accounts.** State this; provide the
  privacy-policy URL if a URL is required.

> If Play flags in-app purchases as "financial info": that data is collected by **Google Play**,
> not by your app — you are not collecting/storing it, so your app's answer remains "does not
> collect." Only declare what *your app* collects.

**Result to expect:** a "No data collected / No data shared" Data safety card. This is the honest,
strong story for a local-first app — keep it that way.

---

## 2. Content rating (IARC questionnaire)

**Path:** Play Console → App content → Content rating. Category: **Utility / Productivity /
Communication / Other** (choose Utility/Productivity, **not** "Game", unless you list in Games).

Answer the questionnaire truthfully — for Pawductivity every sensitive category is **No**:

| Question area | Answer |
|---|---|
| Violence (realistic/cartoon/fantasy) | No |
| Blood / gore | No |
| Sexual content or nudity | No |
| Profanity / crude humor | No |
| Controlled substances (drugs/alcohol/tobacco references) | No |
| Gambling (real or simulated) | No — the coin economy is earned in-app, not gambling |
| User-generated content / user interaction / shares location | No — no accounts, no social features, no location sharing |
| Digital purchases | **Yes** — the app offers in-app purchases (Premium subscription) |
| Does the app share the user's current location? | No |
| Is this a web browser / miscellaneous | No |

**Expected outcome:** **Everyone / PEGI 3 / IARC 3+** (all-ages). Digital-purchases = Yes just
adds the "in-app purchases" label, not an age bump.

---

## 3. Other App content declarations

**Path:** Play Console → App content (each is its own section).

| Declaration | Answer |
|---|---|
| **Privacy policy** | Provide the hosted URL of `privacy-policy.md`. Required. |
| **Ads** | **No, my app does not contain ads.** (No ad SDK.) |
| **App access** (does all functionality require special access / login?) | **All functionality is available without special access.** No login exists. Do **not** provide test credentials — there are none. |
| **Content ratings** | Complete §2 above. |
| **Target audience and content** | Target age groups: **13+** (recommended, keeps you out of the stricter "Designed for Families / children" program and its extra requirements). The app isn't designed for or targeted at children. If you *want* the kid-friendly angle, targeting under-13 triggers the Families policy + stricter data rules — avoid unless intended. |
| **News app** | No. |
| **COVID-19 contact tracing/status** | No. |
| **Data safety** | Complete §1 above. |
| **Government apps** | No. |
| **Financial features** | No. |
| **Health apps** | No. |
| **Advertising ID** | The app does **not** use the Advertising ID (no ads/analytics). Declare "not used" — and don't add the `AD_ID` permission (Expo/RN may pull it via a dependency; remove it if present so this stays true). |

---

## 4. Store settings / pricing

| Item | Value |
|---|---|
| **App or game** | App (Productivity) — or Game/Casual if you deliberately want the games storefront. |
| **Free or paid** | **Free** (with in-app purchases). |
| **Contains ads** | No. |
| **In-app purchases** | Yes — Premium subscription (and optionally coin packs). |
| **Countries/regions** | Your choice; Indonesia + worldwide is fine for a local-first app. |

---

### Quick sanity list before you hit "Submit for review"
- [ ] Privacy policy URL is live and reachable.
- [ ] Data safety = "No data collected/shared" and matches reality (no analytics/ads/crash SDK).
- [ ] Content rating completed → Everyone/3+.
- [ ] Target audience 13+ (unless you intend the Families program).
- [ ] No `AD_ID` permission in the built manifest (or Advertising ID declared unused consistently).
- [ ] Exact-alarm permission use is justified (see build-signing-iap.md §2) if you keep it.
