# AWR Group site — production readiness

Page: [04-hybrid.html](04-hybrid.html) · assets: [../awrgroup-assets/](../awrgroup-assets/)

**Status: technically ready, content-blocked.** The build is clean; what's left
is unverified copy and two missing photos. Details below.

---

## Done in the production pass

| Area | What changed |
| ---- | ------------ |
| Concept label | Footer `Concept 04 — the mix` removed → `Restoration & waterproofing since 1947` |
| Title | `AWR Group Inc. — Concept 04 · The Mix` → `AWR Group — Building Restoration & Waterproofing \| New York` |
| Meta description | Added (153 chars) |
| Social sharing | Full Open Graph + Twitter card set, plus a purpose-built **1200×630** `og-card.jpg` generated from the hero with the logo knocked out bottom-left |
| Structured data | `GeneralContractor` JSON-LD — name, phone, email, founding year, tri-state `areaServed`, the eight services. **Only facts that appear on the page**; no address, because none is published anywhere on the site |
| Copyright year | `© 2026` hardcoded → derived from the clock, same block as the years-in-business |
| Phone links | `tel:7187290412` → `tel:+17187290412` (E.164, dials correctly from abroad) |
| Heading outline | Was jumping `h1→h4` and `h2→h4`. Quick-bar labels are nav teasers, not sections — now `<span class="qt">` with identical styling; footer column heads promoted to `h2`. **Zero skips.** |
| `theme-color` | `#163D1D` for mobile browser chrome |

### Verified clean

- 0 broken images, 0 failed requests (21 total), 0 console errors
- 0 heading-level skips · 1 `<h1>` · `lang="en"` · every image has `alt`
- every in-page anchor resolves; no dead links
- JSON-LD parses; JS parses; HTML tags balanced
- no "Concept 04" / "the mix" / lorem text anywhere

---

## Blocking a real launch

These are content, not code. I can't resolve them without AWR.

1. **Garage Repairs copy is invented.** I wrote "Parking garage and plaza deck
   repairs… concrete repair, traffic coatings, waterproofing, expansion joints"
   as a placeholder when Ronald renamed the service. **Shipping this publishes
   service claims nobody at AWR has approved.** Needs their real scope.
2. **No garage photo.** That service panel is showing a residential facade as a
   stand-in, which reads wrong under the heading.
3. **The About photo is the one Ronald rejected** — the "please curb your dog"
   shot. Still in place; no replacement supplied.
4. **"Three generations, one standard" and "family-run ever since" are
   unverified.** Three `TO CONFIRM WITH AWR` comments flag that ownership and
   generations aren't stated anywhere on AWR's current site. These are factual
   claims about the business on its own homepage — they need sign-off.
5. **92nd St Y** — last of Ronald's three additions, no photos yet.
6. **Woolworth Building scope** — card says "Historic Restoration", unconfirmed.

---

## Deployment decisions still needed

1. **Where does this live?** Canonical and OG URLs are set to
   `https://awrgroup.com/` — inferred from the `info@awrgroup.com` address, not
   confirmed. If the domain differs, update `canonical`, `og:url` and
   `og:image`.
2. **`noindex` is still on.** The page sits on stevendias.com, which noindexes
   everything outside the homepage and blog. There's a `LAUNCH SWITCH` comment
   at the top of `<head>` — delete that robots line when it moves to AWR's
   domain. Leaving it on means the site never gets indexed; removing it early
   means a client concept page gets indexed on Steven's personal domain.
3. **Paths.** The page references `../awrgroup-assets/…`. Moving it to a domain
   root means either keeping that folder structure or rewriting the prefix.
   `og:image` already assumes `/assets/og-card.jpg` — reconcile these.
4. **Strip the `TO CONFIRM WITH AWR` comments before launch.** Four of them, and
   HTML comments are visible to anyone who views source. Resolving items 1 and 4
   above removes most of them naturally.
5. **No analytics.** Nothing is installed. Worth asking whether AWR wants
   anything.
6. **Favicon** is `mark.webp`. Safari and older browsers want a real `.ico` or
   PNG set — worth generating if AWR cares about tab presentation.

---

## Nice-to-have, not blocking

- Grid is **10 project cards in 3 columns**, so the last row holds one card with
  two empty cells. Promoting one chip landmark would make it 11; two would make
  12 and square it off.
- Source photos from Ronald are WhatsApp-compressed (1024×576 and 576×1024).
  Fine in the cards, soft in the lightbox on a large screen. Originals would be
  a straight swap.
- Logo PNGs are 340px serving an 89px slot and carry no `width`/`height`
  attributes — a small amount of avoidable layout shift.
