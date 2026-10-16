# AWR Group site — client feedback log

Working file: [04-hybrid.html](04-hybrid.html) (the "newest" AWR site — the hybrid concept).
Assets live in [../awrgroup-assets/web/](../awrgroup-assets/web/).

Each round below records the feedback as given, what changed, and anything left
open. Rounds are appended in the order the feedback arrived.

---

## Round 1 — Selected work grid (marked-up screenshot, 2026-09-11)

### Feedback as marked
- ✗ **The Chrysler Building** card — "take out"
- ✗ **Radio City Music Hall** card — "take out"
- ✗ **Woolworth Building** chip (overflow tag row) — crossed out, with an arrow
  labelled **"put picture"** pointing up into the card grid.

Read as: pull the two landmarks AWR shouldn't be showing, and promote Woolworth
from a text-only chip to a real photo card in the grid.

### Changes made

| # | Change | Where |
| - | ------ | ----- |
| 1 | Removed the Chrysler Building card; replaced that grid slot with a **Woolworth Building** photo card (`Historic Restoration` subtitle, matching the Flatiron card). | `04-hybrid.html:517-518` |
| 2 | Removed the Radio City Music Hall card entirely. | `04-hybrid.html` (was 519-520) |
| 3 | Removed the `Woolworth Building` chip from the overflow tag row — it's a card now, so it no longer belongs in the "also worked on" list. Tag row is 20 chips. | `04-hybrid.html:523` |
| 4 | Dropped Chrysler and Radio City from the scrolling **landmark marquee** under the hero, so the site doesn't claim them anywhere. | `04-hybrid.html:411-413` |
| 5 | Quick-bar "Projects" teaser said `Chrysler · Radio City · Flatiron` → now `Woolworth · Flatiron · Eldorado`. | `04-hybrid.html:398` |
| 6 | Generated `woolworth-sm.webp` (800w, 29 KB) so the new card has the same responsive `srcset` treatment as every other card. | `../awrgroup-assets/web/woolworth-sm.webp` |

Changes 4 and 5 weren't marked on the screenshot, but the same two landmark
names appeared in the marquee and the quick-bar. Taking them off the cards while
leaving them elsewhere on the page would have left the claim standing, so they
went too.

### Open / needs a decision

- **The grid is now 8 cards in a 3-across layout** (6 gallery projects +
  Woolworth + Flatiron), so the last row sits 2-wide with a gap on the right.
  Options: leave it, or promote one more landmark to a card to get back to a
  clean 9. Images already on hand for: NY State Capitol, The Eldorado,
  The Carlyle Hotel, Warwick Hotel, 666 Broadway.
- **Woolworth card subtitle** is `Historic Restoration` (borrowed from the
  Flatiron card). If AWR's actual scope there was masonry/roofing, say so and
  I'll swap it.
- **Other concept files** (`01-skyline.html`, `02-central.html`,
  `03-greene.html`) plus `../awrgroup.html`, `../export.html` and
  `../temp_dir/index.html` still carry Chrysler and Radio City. Left untouched
  on the assumption only the hybrid is live. Say the word and I'll sweep them.

---

## Round 2 — Hero stat band (marked-up screenshot, 2026-09-11)

### Feedback as marked
- ✗ **75+** — "change to **celebrating 80**"
- **30** — circled with a "**?**" (query on where the number comes from)

### Changes made

| # | Change | Where |
| - | ------ | ----- |
| 1 | Stat `75+` → **`80`**. | `04-hybrid.html:486` |
| 2 | Section eyebrow `Since 1947` → **`Celebrating 80 years`**, so "celebrating" lands as a line of its own instead of doubling up under the big `80`. The `1947` stat card right below still carries the founding year. | `04-hybrid.html:480` |
| 3 | Headline `Seventy-five years on the New York skyline.` → **`Eighty years on the New York skyline.`** — same claim as the stat, so it had to move with it. | `04-hybrid.html:481` |
| 4 | Footer `Since / 1947 / 75+ years` → `80 years`. | `04-hybrid.html:579` |
| 5 | Stat `30` → **`28`** (see below). | `04-hybrid.html:488` |

### On the "30 ?"

`30` was the count of every project named on the page: 9 photo cards + 21 chips
in the tag row. Round 1 removed two cards (Chrysler, Radio City) and promoted
Woolworth from chip to card, so the page now names **8 cards + 20 chips = 28**.
Updated to match. It'll need bumping again whenever cards or chips are added.

### Open / needs a decision

- **`80` is rounded up.** 1947 → 2026 is 79 years; the 80th is 2027. `75+` had a
  `+` doing that work, `80` doesn't. If AWR wants it strictly accurate today,
  `79` or `80th year` both work — say which and I'll swap it.
- **Eyebrow vs. headline.** Right now the eyebrow reads `Celebrating 80 years`
  and the headline reads `Eighty years on the New York skyline.` That's the word
  "years" twice in a row. Alternative: leave the eyebrow at `Since 1947` and put
  the celebration in the headline — `Celebrating eighty years on the New York
  skyline.` Happy to flip it.

---

## Round 3 — "What we do" services list (marked-up screenshot, 2026-09-11)

### Feedback as marked
- **03 Windows & Restoration** — struck through, replaced with "**Garage Restoration**"
- **05 Inspections & Repairs** — a note underneath reading roughly
  "— Boom & …", scribbled out again in a second pass. Not legible. *Left alone —
  see open items.*
- **08 Awnings** — "**Remove awnings**"

### Changes made

| # | Change | Where |
| - | ------ | ----- |
| 1 | Service 03 renamed `Windows & Restoration` → **`Garage Restoration`**, in both the list item and its detail panel. | `04-hybrid.html:428`, `445-448` |
| 2 | Wrote new panel copy for it — "Parking garage and plaza deck restoration, from concrete repair to waterproofing," bullets `Concrete repair · Traffic coatings · Waterproofing · Expansion joints`. The old bullets were window-specific (refurbishment, painting, caulking, wood restoration) and couldn't carry over. **Placeholder — flagged with a `TO CONFIRM WITH AWR` comment in the file.** | `04-hybrid.html:445-448` |
| 3 | Removed service **08 Awnings** — list item and detail panel both. | `04-hybrid.html` |
| 4 | Renumbered `09 Scaffolding` → **`08 Scaffolding`** and re-indexed its `data-i` from `8` to `7`, keeping the list buttons and the panel figures in sync (the tab script maps `data-i` straight onto figure position). Verified: 8 buttons, 8 figures, same order. | `04-hybrid.html:435` |
| 5 | Service count 9 → 8 everywhere it's stated: hero stat `9 Service areas` → **`8`**, quick-bar `Nine service areas` → **`Eight service areas`**, and the mobile-accordion code comment that said "all nine items". | `04-hybrid.html:394`, `487`, `605` |

### Open / needs a decision

- **The note under 05 Inspections & Repairs is unreadable** — it looks like
  "— Boom & " followed by a word that was then scratched out. Two readings:
  (a) it's a service to add (boom lifts? boom & swing staging?), or (b) it was
  written and then retracted. I left 05 untouched. Tell me which and I'll do it.
- **Garage Restoration copy is invented** and needs AWR's sign-off — I don't
  know their actual garage scope. Same for the bullets.
- **No garage photo exists** in `../awrgroup-assets/web/projects/`. The panel is
  currently showing `westend-facade.webp` (a residential facade) as a stand-in,
  which reads wrong under a "Garage Restoration" heading. Needs a real photo.
- `cabrini-entrance.webp` is now unused (it was the Awnings image). Left on disk
  in case it's wanted elsewhere.

---

## Round 4 — Clearer re-shots: services + stat band (2026-09-11)

Two screenshots, both re-marking areas from earlier rounds in legible handwriting.
They **supersede** the Round 3 readings where they differ.

### Feedback as marked

**Screenshot A — services list**
- **03 Windows & Restoration** struck through → "**Garage Repairs**"
  (Round 3 was read as "Garage Restoration" — this is the correction)
- **05 Inspections & Repairs** → "— **Boom & suspended scaffold inspections**"
  (this is the note that was illegible in Round 3)

**Screenshot B — stat band**
- **9 Service areas** — the `9` crossed out, replaced with "**Tri-State Area
  (North East)**" and "**Don't limit ourselves**"

### Changes made

| # | Change | Where |
| - | ------ | ----- |
| 1 | Service 03 `Garage Restoration` → **`Garage Repairs`** in the list item, the panel heading, the image `alt`, and the `TO CONFIRM` comment. Panel blurb reworded to match ("Parking garage and plaza deck repairs, from concrete work to waterproofing"). | `04-hybrid.html:428`, `445-449` |
| 2 | Service 05 now states the boom and suspended scaffold work: blurb extended to "…including boom and suspended scaffold inspections," and a **`Boom & suspended scaffold`** chip added to its bullet list. | `04-hybrid.html:457-460` |
| 3 | The **`8 Service areas`** stat is gone. It read as geographic coverage, which wasn't the intent (it was counting service categories) and capped the footprint either way. Replaced with **`Tri-State` / "Service area — and across the Northeast."** | `04-hybrid.html:487` |
| 4 | Added a `.num.word` modifier for word-valued stats. The numeric `clamp(2.3rem,4.4vw,3.3rem)` overflows a quarter-width card at "Tri-State"; the word variant sizes down to `clamp(1.75rem,2.7vw,2.4rem)`. | `04-hybrid.html:191-192` |

Round 3's service-count work (9 → 8) is partly superseded: the **stat card** no
longer counts services at all. The quick-bar still reads "Eight service areas",
which is accurate — it's a nav teaser for the Services section, not a claim
about territory.

HTML tag balance verified clean after all four rounds.

### Open / needs a decision

- **Two other places still say New York only**, and "don't limit ourselves"
  arguably applies to them as well. Left alone because they're brand lines that
  weren't marked:
  - stat `80 — "Years restoring **NYC** buildings"` (`:486`), sitting directly
    beside the new Tri-State card
  - footer — "…across the **New York metro area**" (`:580`)
  - hero headline — "Eighty years on **the New York skyline**" (`:481`)

  Say the word on any of these and I'll broaden them.
- **Garage Repairs copy and photo** are still open from Round 3 — placeholder
  blurb, placeholder image.

---

## Round 5 — Logo colour, root-caused and fixed (2026-10-15)

### What was actually happening

Ronald's "Wrong Color" note was on the header logo. The header swaps logo files
on scroll (`04-hybrid.html:361-366`):

- **at the top** — `header` is not `.stuck`, so `.dark` shows → `logo-knockout.png`
- **once scrolled** — `header.stuck` → `.light` shows → `logo-trans.png`

The two files didn't share a green. Sampled from the PNGs:

| File | State | Green |
| ---- | ----- | ----- |
| `logo-trans.png` | scrolled / footer | **`#00A600`** — the brand green |
| `logo-knockout.png` | top of page, over hero | **`#96D66E`** — a pale lime |

So the logo was off-brand only at the top of the page and corrected itself on
scroll, which is exactly what the screenshots show.

### Changes made

| # | Change | Where |
| - | ------ | ----- |
| 1 | Recoloured every green pixel in `logo-knockout.png` from `#96D66E` to **`#00A600`**, preserving the alpha channel (the file antialiases in alpha, not by blending RGB, so the edges stayed clean). | `../awrgroup-assets/web/logo-knockout.png` |
| 2 | Set the small `WATERPROOFING & RESTORATION` tagline to **white** in the knockout only. At brand green it disappeared against the dark hero — it was already marginal in lime. The knockout already recolours the black wordmark to white, so this is the same treatment applied consistently. The light-background logo is untouched and keeps its green tagline. | same file |
| 3 | Kept the original as `logo-knockout-lime-ORIG.png` in case we need to revert. | `../awrgroup-assets/web/` |

Verified by compositing the logo over the hero image with the hero's own CSS
filters applied (`grayscale(.12) contrast(1.05) brightness(.68)` + the
`rgba(16,19,16,.66)` scrim). The brand green reads better against the dark hero
than the lime did.

### Open

- `#00A600` was **sampled from `logo-trans.png`**, not supplied by AWR. If their
  brand spec names a different green, send the hex and it's a one-line re-run.

---

## Round 6 — Steven's notes (2026-10-15)

### Changes made

| # | Change | Where |
| - | ------ | ----- |
| 1 | **Years in business now derived from the founding year** instead of hardcoded. One constant `FOUNDED=1947`; every `.yrs` span gets `currentYear - FOUNDED` on load. Four places update together: the eyebrow, the headline, the hero stat, and the footer. The markup still carries the current value as a no-JS fallback. | `04-hybrid.html:479-485`, `578`, `~620` |
| 2 | **Removed the years from the project cards** on "Buildings you already know" — `2026`, `2025`, `2025–2026` are gone from all six gallery cards. | `04-hybrid.html:499-514` |
| 3 | **Lightbox now rolls into the next building.** Paging past the last photo of a gallery opens the next building at photo 1; paging back before photo 1 opens the previous building at its last photo; both ends wrap around the full list. Preloading follows across the boundary, and closing returns focus to whichever building you ended on rather than the one you opened. | `04-hybrid.html:628-680` |
| 4 | **About photo is no longer muted when idle** — was `grayscale(.85)` until hover, now `contrast(1.03)` all the time and the hover override is gone. | `04-hybrid.html:221-222` |

### Verified in a real browser

Served the folder and drove it with Playwright:

- all four `.yrs` spans render `79`, matching `currentYear - 1947`
- project cards read as bare building names, no years
- about image computed filter is `contrast(1.03)` — no grayscale
- gallery roll-over, walked end to end:
  `195 Bowery 6/6 → next → 684 Broadway 1/3`,
  `684 Broadway 1/3 → prev → 195 Bowery 6/6`,
  `240 Centre Street 1/14 → prev → 246 West End Avenue 11/11` (wraps)
- declared `data-n` photo counts match the files on disk for all six galleries
- JS parses clean (`node --check`), HTML tags balanced

### Open / needs a decision

- ~~The computed figure is 79, not 80.~~ **Resolved** — the owner wants at least
  80, so the count now floors there: `Math.max(80, currentYear - 1947)`. It holds
  at 80 through 2027 and tracks the real figure from 2028 on (81, 82, …), so it
  still never goes stale. Verified rendering `80` in all four places.
- **The headline is now numeric** — "80 years on the New York skyline" where it
  used to spell out "Seventy-five". It had to become a digit to be computed. If
  the spelled-out form matters, the alternative is dropping the number from the
  headline entirely: "On the New York skyline since 1947."
- **Woolworth and Flatiron still carry "Historic Restoration"** under the name,
  since those are service descriptors rather than years. The six gallery cards
  now have no subtitle at all, so the grid is slightly uneven. Easy to strip
  those two as well if you want every card to be just a name.

---

## Round 7 — 4 Park Avenue added as a gallery project (2026-10-15)

Ronald sent four photos; they arrived as a `4 Park` folder sitting loose in the
repo root.

### Changes made

| # | Change | Where |
| - | ------ | ----- |
| 1 | Converted the four WhatsApp JPEGs to webp and built a gallery: `gallery/park/00-03.webp`. Order runs wide → context → crown detail → courtyard arch. | `../awrgroup-assets/web/projects/gallery/park/` |
| 2 | Card cover `park-tower.webp` (1024w) + `park-tower-sm.webp` (800w), from the full-tower frame — the one that holds up best in the card's portrait crop. | `../awrgroup-assets/web/projects/` |
| 3 | Added the **4 Park Avenue** card to the grid as a real gallery card (`data-g="park" data-n="4"`), placed after 246 West End Avenue and before the Woolworth/Flatiron pair. | `04-hybrid.html:515-517` |
| 4 | Added `4 Park Avenue` to the landmark marquee. | `04-hybrid.html:411` |
| 5 | Portfolio count `28` → **`29`**. | `04-hybrid.html:488` |
| 6 | Moved the originals out of the repo root to `../awrgroup-assets/source/4-park/` and removed the stray `4 Park` directory. | — |

**Side effect worth noting:** the grid is back to a clean **3×3**. Round 1 left
it at 8 cards with a hole in the last row; 4 Park fills it.

### Verified in a real browser

- all nine cards render, no broken images in the grid
- card order: 240 Centre · 200 Rector · 250 Cabrini · 195 Bowery · 684 Broadway ·
  246 West End · **4 Park Avenue** · Woolworth · Flatiron
- gallery opens at `4 Park Avenue 1 / 4`, pages through all four, and
  `4/4 → next → 240 Centre Street 1/14` (rolls over correctly)
- lightbox image decodes at 1024×576

### Open

- **Title is "4 Park Avenue"** — inferred from Ronald's "4 Park" note and the
  building in the photos. Worth a quick confirm.
- **Source photos are WhatsApp-compressed** (1024×576, ~100 KB each), so this
  card and its gallery are softer than the rest, which come from 1200×675 and
  1050×1400 originals. If Ronald has the originals, they'd be a straight swap.
- **NYU and 92nd St Y** are still outstanding from Ronald's list — no photos yet.

---

## Round 8 — Stat band, chips, and a measured mobile pass (2026-10-15)

### Changes made

| # | Change | Where |
| - | ------ | ----- |
| 1 | Removed the **"29 / Projects listed in our portfolio"** stat. The band is three up now: `1947`, `80`, `Tri-State`. Grid dropped `repeat(4,1fr)` → `repeat(3,1fr)`, and the tablet step that forced 2 columns was removed so three survive down to the phone breakpoint. | `04-hybrid.html:185`, `482-484` |
| 2 | Gave `.num` `flex-direction:column; justify-content:space-between` so the labels sit on one line. "Tri-State" uses a smaller cap height than `1947`/`80`, which left three different baselines in a row. | `04-hybrid.html:186-191` |
| 3 | **Removed the chip hover** — `.tagrow span:hover` (filled forest green) is gone. Chips keep their shape and border. | `04-hybrid.html` |

### Mobile pass — what was actually measured

Served the site and drove it at 390×844, DPR 2.

**Confirmed bugs, now fixed:**

| # | Problem | Fix |
| - | ------- | --- |
| 4 | **The mobile menu never closed.** Tapping Services/Projects/About left the white panel open on top of the section you just jumped to. Only the burger toggled it — nothing listened for a link tap. This is the single biggest "feels off" on mobile. | Added a delegated click handler on the nav that clears `.open` when a link is tapped. Verified: opens on burger, closes on tap. |
| 5 | **Header flicker — this is what the screenshot caught.** `header` had `transition:.35s` on *all* properties, so `background-color` animated too. Crossing the 90px threshold during a momentum scroll gives you ~⅓ second of a half-transparent bar with the logo floating over the content behind it. Reproduced it exactly. | Scoped the transition to `padding` and `box-shadow` only. The background now switches instantly; padding and shadow still ease. |
| 6 | **Hero image had no `srcset`** — 1800px / **221 KB** shipped to a 390px phone. It's the largest asset on the page and it loads first. | Added a 900w step. Phone now pulls **62 KB**. |
| 7 | **15 of 24 images had no `srcset`** — the whole services panel was serving 1400px originals into ~359px slots. | Generated 6 missing `-sm` variants and added `srcset`/`sizes` to 11 images (hero, all 8 service panels, About, CTA). |
| 8 | **6 width descriptors were wrong**, including pre-existing ones: `westend-facade-sm` was declared `800w` but the file is 600px, and three portrait images declared their long edge instead of their width. A wrong `w` makes the browser pick the wrong candidate. | Wrote a check that reads every `srcset` candidate off disk and rewrites the descriptor to the real pixel width. All 11 now verified against the files. |
| 9 | **No `scroll-padding-top`** — anchor jumps had nothing accounting for the 72px fixed header. It happened to look fine because sections carry padding, but it was luck. | `html{scroll-padding-top:86px}`. |
| 10 | **Mobile menu tap targets were 43px.** | `min-height:44px` on the open nav links. |

**Measured after:**

- hero on mobile: **221 KB → 62 KB**
- initial mobile load: **199 KB**
- no image now serves a source more than ~1.5× its slot at DPR 2
- menu: opens on burger, closes on link tap ✅
- JS parses clean, HTML tags balanced

### Not a bug, worth knowing

Full-page weight scrolled end to end is ~1.2 MB, but that's ~20 lazy-loaded
photos on a portfolio site and nothing above the fold. At DPR 2 a 92vw slot on a
390px phone genuinely needs ~720 real pixels, so the 1050px portrait assets are
close to correctly sized — there isn't much more to win there without cutting
image quality.

### Still open on mobile

- **Hero is `min-height:92vh`** on phones. With browser chrome that's a full
  screen of photo before any copy — worth considering `svh` units or a shorter
  hero so the headline and CTA land above the fold.
- **The logo PNGs are 340px for an 89px slot.** Only ~25 KB each so it barely
  matters, but they could be halved, and they have no `width`/`height`
  attributes, so they contribute a little layout shift.

---

## Round 9 — Hero bleed and menu dismissal (2026-10-15)

### 1. The green bar leaking into the hero

Measured at 390×787: the hero was `min-height:92vh` = **724px in a 787px
viewport**, so **63px of the green quick-bar sat on the first screen** — and
since each quick item is 119px tall, that sliced the "Services" row in half.
A cut-off icon and a cut-off label, which reads as broken rather than as a
deliberate "scroll for more" peek.

**Fix:** `min-height:100svh` (with a `100vh` fallback for older browsers), both
in the base rule and in the mobile override that was forcing 92vh. `svh` is the
viewport *with* browser chrome showing, so the hero fills the visible screen no
matter what the address bar is doing.

Verified: hero is now exactly 787px on a 787px mobile viewport, **0px of green
bar visible**, and still exactly 900px on a 900px desktop viewport.

### 2. Menu wouldn't dismiss

Only the burger could close it. Added:

- click anywhere outside the panel closes it
- `Escape` closes it
- tapping a link closes it (from Round 8)
- the burger still toggles both ways
- `aria-expanded` now tracks state on the burger

All five verified in the browser:

| behaviour | result |
| --------- | ------ |
| opens on burger | ✅ |
| closes on outside click | ✅ |
| closes on Escape | ✅ |
| closes on link tap | ✅ |
| burger toggles both ways | ✅ |
| `aria-expanded` tracks state | ✅ |

JS parses clean.

---

## Round 10 — NYU / 35 West 4th Street added (2026-10-15)

Three photos arrived as an `NYU - 35 West 4th` folder in the repo root. The
folder name also answers the open naming question from Ronald's list.

### Changes made

| # | Change | Where |
| - | ------ | ----- |
| 1 | Converted the three JPEGs to a gallery: `gallery/nyu/00-02.webp`. Order: skyline hero → aerial context → facade detail. | `../awrgroup-assets/web/projects/gallery/nyu/` |
| 2 | Cover `nyu-west4th.webp` (576w) + `-sm` (400w), from the skyline frame. That source is already portrait (576×1024), so it loses almost nothing to the card's 4:4.2 crop. | `../awrgroup-assets/web/projects/` |
| 3 | Added the **NYU — 35 West 4th Street** card (`data-g="nyu" data-n="3"`), after 4 Park Avenue. | `04-hybrid.html` |
| 4 | Added it to the landmark marquee. | `04-hybrid.html:411` |
| 5 | Moved originals to `../awrgroup-assets/source/nyu-35-west-4th/`; removed the loose folder from the repo root. | — |

### Verified

- 10 cards, none broken
- title fits on one line in the card
- gallery: `NYU 1/3 → 2/3 → 3/3 → next → 240 Centre Street 1/14` (rolls over)
- all `srcset` width descriptors re-audited against the files: **0 mismatches**

### Open

- **The grid is 10 cards in 3 columns, so the last row holds Flatiron alone**
  with two empty cells beside it. Round 7 had got it to a clean 3×3; this breaks
  it again. When 92nd St Y lands it'll be 11 (two in the last row). Options:
  promote one landmark from the chip row to a card to reach **12** — images
  already on hand for NY State Capitol, The Eldorado, The Carlyle Hotel,
  Warwick Hotel, 666 Broadway — or leave it ragged.
- **Card title is longer than the others** ("NYU — 35 West 4th Street" vs plain
  addresses). It fits on one line, but if consistency matters it could be just
  "35 West 4th Street" — though "NYU" is the recognisable half, which is the
  point of a section called "Buildings you already know."
- **WhatsApp-compressed again** (576×1024, ~95 KB). Fine for the card, but the
  lightbox shows them at 576px wide on a large screen. Originals would help.
- **92nd St Y** is the last one outstanding from Ronald's list.

---

## Round 11 — Renamed the source photos (2026-10-15)

The archived originals still carried their WhatsApp filenames. Renamed so the
number matches the gallery slot the photo became, and the suffix says what it is:

| Project | Was | Now | Gallery slot |
| ------- | --- | --- | ------------ |
| 4 Park Avenue | `WhatsApp Image … 9.02.58 PM.jpeg` | `00-tower.jpeg` | `gallery/park/00.webp` |
| | `… 9.02.58 PM (1).jpeg` | `01-aerial-context.jpeg` | `01.webp` |
| | `… 9.02.58 PM (2).jpeg` | `02-crown-detail.jpeg` | `02.webp` |
| | `… 9.02.58 PM (3).jpeg` | `03-courtyard-arch.jpeg` | `03.webp` |
| NYU / 35 W 4th | `… 9.06.41 PM.jpeg` | `00-skyline.jpeg` | `gallery/nyu/00.webp` |
| | `… 9.05.59 PM.jpeg` | `01-aerial.jpeg` | `01.webp` |
| | `… 9.07.13 PM.jpeg` | `02-facade-detail.jpeg` | `02.webp` |

Note the WhatsApp ordering was **not** the gallery ordering — the un-suffixed
`PM.jpeg` was slot 00 for 4 Park, and NYU's `9.06.41` came before `9.05.59`.
Rather than trust my notes, I re-encoded each source and matched it to its
gallery `.webp` by checksum, so the numbering is verified rather than assumed.

No WhatsApp-named files remain anywhere in the repo. Nothing in the page
references these originals — they're the archive — so no markup changed.

---

## Round 12 — Production pass (2026-10-15)

Concept label removed and a full pre-launch pass run. Details and the launch
checklist live in [PRODUCTION-NOTES.md](PRODUCTION-NOTES.md); summary here.

| # | Change | Where |
| - | ------ | ----- |
| 1 | Footer `Concept 04 — the mix` → `Restoration & waterproofing since 1947`. | `04-hybrid.html` |
| 2 | Real `<title>`, 153-char meta description, `theme-color`, canonical. | `<head>` |
| 3 | Open Graph + Twitter card tags, and a generated **1200×630 `og-card.jpg`** (hero frame, graded to match, logo knocked out bottom-left). | `../awrgroup-assets/web/og-card.jpg` |
| 4 | `GeneralContractor` JSON-LD. Only page-verifiable facts — deliberately **no address**, since none is published anywhere on the site. | `<head>` |
| 5 | Copyright year derived from the clock instead of hardcoded `2026`. | footer + years script |
| 6 | `tel:7187290412` → `tel:+17187290412` (E.164). | 2 places |
| 7 | Fixed the heading outline: it jumped `h1→h4` and `h2→h4`. Quick-bar labels became `<span class="qt">` (they're nav teasers, not sections) with identical styling; footer column heads promoted to `h2`. Zero skips now. | `04-hybrid.html` |

### Audit result

0 broken images · 0 failed requests (21 total) · 0 console errors · 0 heading
skips · 1 `h1` · all images have `alt` · every anchor resolves · JSON-LD, JS and
HTML all parse clean · no concept/lorem text remaining.

### I did not mark this launch-ready

Six content blockers remain, all needing AWR rather than code — the invented
**Garage Repairs** copy and its missing photo, the **About photo Ronald
rejected**, the unverified **"three generations" / family-run** claims, **92nd
St Y**, and the **Woolworth scope**. Plus four deployment decisions: the real
domain (canonical/OG currently guess `awrgroup.com`), the `noindex` launch
switch, the asset path prefix, and stripping the `TO CONFIRM WITH AWR` comments
so they don't ship in public page source.
