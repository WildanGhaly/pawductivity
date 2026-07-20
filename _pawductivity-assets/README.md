# Pawductivity — Asset Pack (flat manifest)

Every product asset + icon for the rebuild, in **one flat set — no folders**. Filenames are
unique across the whole pack, so they work as-is in a flat store (e.g. a Claude project upload).
Reference each asset by its **bare filename** below.

`73` files. Names were normalised to English where the legacy used Indonesian (`apel→apple`, …);
each row traces back to the original. Expo/React framework boilerplate (react-logo, expo badges,
tab scaffolding, adaptive-icon layers) is intentionally excluded — only real product art is here.

Full behavioural spec: **`BUSINESS-PROCESS.md`** (same repo root).

---

## Companions — `dog` · `cat` · `rabbit`
Per species: one shop **thumbnail PNG** + **6 Lottie animations**. The numbered Lotties are the
pet **wearing outfit N** (the outfit is animated ON the pet) — they are **NOT** growth/evolution
stages. `*_default.json` = the pet with no outfit (`clothesId = 0`).

Selection rule: `clothesId > 0 ? <species>_<clothesId>.json : <species>_default.json`.

| Filename | Meaning |
|---|---|
| `dog-thumbnail.png` · `cat-thumbnail.png` · `rabbit-thumbnail.png` | flat PNG for shop / adopt lists |
| `dog_default.json` · `cat_default.json` · `rabbit_default.json` | base pet, no outfit (`clothesId = 0`) |
| `dog_1.json` … `dog_5.json` | dog wearing clothes item 1..5 |
| `cat_1.json` … `cat_5.json` | cat wearing clothes item 1..5 |
| `rabbit_1.json` … `rabbit_5.json` | rabbit wearing clothes item 1..5 |

Species catalog: Dog `speciesId 1`, 100 coins, free · Cat `2`, 200, free · Rabbit `3`, 200,
**premium**.

## Food
Health-restoring consumables. Legacy filenames were Indonesian.

| Filename | Original | Catalog id | Price (coins) | Heals | Premium |
|---|---|---|---|---|---|
| `apple.png` | `apel.png` | 1 | 3 | +10 | no |
| `chicken.png` | `ayam.png` | 2 | 3 | +10 | no |
| `pizza.png` | `pizza.png` | 3 | 4 | +20 | **yes** |
| `watermelon.png` | `semangka.png` | 4 | 4 | +10 | no |
| `carrot.png` | `wortel.png` | 5 | 5 | +15 | no |

## Clothes (outfits)
Cosmetic, single equip slot. Filename prefixed by catalog id. The legacy name→file mismatches are
intentional (kept from the seed). Each garment id maps to the pet's `<species>_<id>.json` Lottie.

| Filename | Original | Catalog id | Name | Price | Premium | Worn Lottie |
|---|---|---|---|---|---|---|
| `01-cyan-tshirt.png` | `shirt.png` | 1 | Cyan t-shirt | 15 | no | `<species>_1.json` |
| `02-green-shirt.png` | `polo_shirt.png` | 2 | Green shirt | 10 | no | `<species>_2.json` |
| `03-tuxedo.png` | `suit.png` | 3 | Tuxedo | 20 | **yes** | `<species>_3.json` |
| `04-star-shirt.png` | `emo_shirt.png` | 4 | Star Shirt | 15 | **yes** | `<species>_4.json` |
| `05-pink-dress.png` | `dress.png` | 5 | Pink Dress | 20¹ | **yes** | `<species>_5.json` |

¹ Pink Dress price conflicts in legacy: SQL seed = **20**, Flutter UI showed **15**. Pick one
(see BUSINESS-PROCESS.md §19).

## Profile avatars
`avatar-0.png` … `avatar-6.png` — 7 selectable profile pictures (legacy `profile/0..6.png`).

## Bottom-nav icons
Full-colour PNGs, rendered at full opacity; the active tab adds the underline mark.

| Filename | Original | Tab |
|---|---|---|
| `home.png` | `nav/home.png` | (legacy home) |
| `todo.png` | `nav/todo.png` | Quests |
| `calendar.png` | `nav/calender.png` | Reminders / Calendar |
| `paw.png` | `nav/paw.png` | Companion / Home |
| `profile.png` | `nav/profil.png` | Profile |
| `active-underline.png` | `nav/line.png` | active-tab underline mark |

> Note: `paw.png` (nav icon, raster) is distinct from `paw.svg` (line icon, vector) below.

## UI icons (raster)
| Filename | Use |
|---|---|
| `coin.png` | coin currency glyph (balance pill, prices) |
| `shop.png` | shop entry button (legacy `shop-icon.png`) |
| `wardrobe.png` | wardrobe shop tab |
| `food.png` | food shop tab |
| `potion.png` | misc / potion |
| `lock.png` | premium-locked overlay |
| `pet.png` | pets shop tab |

## Line icons (SVG, vector — tint at will)
| Filename | Use |
|---|---|
| `play.svg` · `pause.svg` | Focus Session timer controls |
| `check.svg` | complete / done |
| `back.svg` | navigation back |
| `paw.svg` | brand paw mark |
| `chart.svg` | stats / analytics |
| `hanger.svg` | wardrobe |
| `bone.svg` | food / treat |
| `star1.svg` · `star2.svg` · `star3.svg` | rating / decoration stars |

## Backgrounds
| Filename | Original | Where used |
|---|---|---|
| `meadow-background.png` | `background.png` | Quests list + Focus Session backdrop (sky + grassy hill + daisies). `cover`, full-bleed. |
| `pet-room.png` | `pet/pet_home.png` | Home / pet room (green wall + wooden floor + picture-frame corner + round window). 430×932; wall/floor line ≈ 61% down. |
| `referral-background.png` | `referral_background.png` | Referral screen backdrop. |

## Fonts
Poppins is the product typeface (all weights, everywhere).

| Filename | Use |
|---|---|
| `Poppins-Bold.ttf` | headings, numbers, buttons |
| `Poppins-Regular.ttf` | body, labels |

## Branding
`logo-paw.png` (app logo) · `logo-glow.png` · `pie-logo.png` · `splash-icon.png` ·
`app-icon.png` · `favicon.png`. App package id: `com.production.pawductivity`.

---

### Brand tokens (for reference)
- **Primary teal** `#0C4C60` · **Accent orange** `#E28A4B` · **Health yellow** `#FFDA7C`
- Coin count text `#1E4B5F` · dark ink `#2D2F41` / `#0B2530`
- Light-only theme (legacy `scaffoldBackgroundColor: white`).

### Full flat file list (73)
```
Companions (21): dog-thumbnail.png cat-thumbnail.png rabbit-thumbnail.png
  dog_default.json dog_1.json dog_2.json dog_3.json dog_4.json dog_5.json
  cat_default.json cat_1.json cat_2.json cat_3.json cat_4.json cat_5.json
  rabbit_default.json rabbit_1.json rabbit_2.json rabbit_3.json rabbit_4.json rabbit_5.json
Food (5): apple.png chicken.png pizza.png watermelon.png carrot.png
Clothes (5): 01-cyan-tshirt.png 02-green-shirt.png 03-tuxedo.png 04-star-shirt.png 05-pink-dress.png
Avatars (7): avatar-0.png avatar-1.png avatar-2.png avatar-3.png avatar-4.png avatar-5.png avatar-6.png
Nav icons (6): home.png todo.png calendar.png paw.png profile.png active-underline.png
UI icons (7): coin.png shop.png wardrobe.png food.png potion.png lock.png pet.png
Line icons (11): play.svg pause.svg check.svg back.svg paw.svg chart.svg hanger.svg bone.svg
  star1.svg star2.svg star3.svg
Backgrounds (3): meadow-background.png pet-room.png referral-background.png
Fonts (2): Poppins-Bold.ttf Poppins-Regular.ttf
Branding (6): logo-paw.png logo-glow.png pie-logo.png splash-icon.png app-icon.png favicon.png
```
