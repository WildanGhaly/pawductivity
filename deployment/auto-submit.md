# Automating the upload to Google Play

Short version: **the upload can be automated, the account setup cannot.** Nobody (including
Claude) can log into your Play Console for you — it's your Google identity with 2FA. Instead you
create a **service account** (a robot account) once, and after that `eas submit` pushes builds
without anyone clicking.

---

## What must be done by you, once

| # | Step | Why it can't be automated |
|---|---|---|
| 1 | Google Play Developer account ($25) | identity/document verification |
| 2 | Create the app entry in Play Console | the Play Developer API **cannot create apps** — only update existing ones |
| 3 | **Upload the first AAB manually** | a brand-new app rejects API uploads until one build exists (`Only releases with status draft may be created on draft app`) |
| 4 | Store listing + privacy policy + Data safety + content rating | console forms |
| 5 | Create the service account + download its JSON key | it's a credential only you can mint |

After step 5, every subsequent upload is one command.

---

## Creating the service account (one time, ~10 min)

1. **Play Console** → *Setup* → **API access**.
   (First time it asks you to link a Google Cloud project — accept and create/choose one.)
2. Click **Create new service account** → it links out to **Google Cloud Console**.
3. In Google Cloud: *IAM & Admin* → *Service Accounts* → **Create service account**.
   - Name: e.g. `play-publisher`.
   - Skip the optional role/user steps → **Done**.
4. Open the new service account → **Keys** tab → *Add key* → **Create new key** → **JSON** →
   it downloads a `.json` file. **This file is the credential.**
5. Back in **Play Console → Setup → API access**, find the service account → **Grant access**.
   Give it at minimum:
   - *Releases*: **Release apps to testing tracks** and **Release to production** (as you prefer)
   - *App access*: restrict to the Pawductivity app only (least privilege)
   - **Invite user / Apply**.
6. Put the downloaded JSON in the repo root as **`play-service-account.json`**.
   It is already covered by `.gitignore` — **never commit it**.

> ⚠️ Treat this file like a password. Anyone holding it can publish releases to your listing.
> Store a backup in a password manager, not in the repo, not in chat.

---

## Then: uploading is one command

```bash
# build the AAB (cloud)
eas build -p android --profile production

# upload it to the Play internal track
eas submit -p android --profile production
```

`eas submit` reads `eas.json` → `submit.production.android`:

```jsonc
{
  "serviceAccountKeyPath": "./play-service-account.json",
  "track": "internal",        // internal | alpha (closed) | beta (open) | production
  "releaseStatus": "draft"    // draft = uploaded but NOT live until you confirm in the console
}
```

`releaseStatus: "draft"` is deliberate — the build lands in Play Console for you to review and roll
out manually. Change it to `"completed"` only when you're comfortable with fully hands-off
releases.

You can also chain both in one go:
```bash
eas build -p android --profile production --auto-submit
```

## Fully hands-off (optional, later)

Once the service account works, the same key can live as a CI secret (GitHub Actions) so a merge
to `main` builds and submits automatically. Worth doing only after the manual flow is proven —
don't automate a pipeline you haven't seen succeed once.

---

## Where this sits in the plan
This unblocks **Chunk C/F** in [`TODO.md`](TODO.md). The realistic sequence is:

1. You: account → create app → store listing/forms (Chunks A+B).
2. `eas build` → **upload that first AAB manually** in the console.
3. You: create the service account + key (above).
4. From then on: `eas submit` (or `--auto-submit`) does every upload.
