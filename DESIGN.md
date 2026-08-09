# Design law — buildflow projects

This file is LAW for every UI card in this project — the UI mock card and every
frontend card MUST be built and reviewed against it. If a change conflicts with a rule
here, the rule wins (or the rule is changed deliberately, in this file, with a dated note).

Two layers, treat them differently:
- **Structure is law**: the affordance ladder, object-first pattern, forms rules, and the
  never-do list apply to any product. Don't relitigate these per project.
- **Tokens are taste**: the colors, fonts, and gradients below are one good default.
  A project MAY replace them — deliberately, in this file, all at once, with a dated
  note — never ad-hoc per component.

## North Star

**Simple stupid UI for non-technical users; full power kept available — but never in the way.**

Users think in *their* objects ("my workshop", "my ticket", "my booking") — never in
engine concepts. Engine words (workflow, trigger, action, job, queue, webhook, agent,
prompt…) NEVER appear in user-facing copy. Define this project's vocabulary in the
table below and use it everywhere.

### Project vocabulary (fill per project — strings, never code paths)

| Engine concept | This project's user word |
|---|---|
| content node / record | nội dung lịch sử |
| workflow | trạng thái kiểm duyệt |
| queue | danh sách chờ duyệt |
| trigger / action | thao tác |
| version conflict | nội dung đã được cập nhật ở nơi khác |
| publish validation | điều kiện xuất bản |
| audit log | nhật ký biên tập |

## Five rules that override everything

1. **Object-first, not feature-first.** The home page of a thing IS the thing. Tabs are
   lenses on the same object — the user never navigates "out" to reach something related.
2. **WYSIWYG, edited in place.** The daily 80% of edits happen inline on the object's own
   page (see the affordance ladder). A separate Edit page exists only for the structural 20%.
3. **Defaults beat configuration.** Creatable in ≤6 visible fields; everything else behind
   one "More options" disclosure. If a default serves 80%, ship it and demote the toggle.
4. **Plain language beats power syntax.** "4 days after it ends" — never cron. A field-picker
   chip — never `{{ raw.templates }}`. No JSON in any simple surface.
5. **Power behind a door.** If a power surface exists, it's a `Simple | Pro` toggle that
   never loses data, plus a visible "switch to simple" path back. 95% never flip it.

## Edit-affordance ladder (inline ↔ popup is a spectrum, not a switch)

Choose by the field's SEMANTIC SHAPE — always the lightest rung the shape allows.
Decision rule: count the inputs the user must touch to finish the edit.

| Rung | Field shape | Interaction |
|---|---|---|
| 1. Inline text | one free-text value | click → input in place → save on blur/Enter (optimistic) |
| 2. Inline control | one value, known set/format | click → the right native control in place (date picker, stepper, select) |
| 3. Popover composite | ONE displayed line composed of 2–4 sub-choices | click → popover anchored to the field, type-switch + matching input → "Done" writes one line |
| 4. Modal | a multi-field object, or a collection | "+ Add" / "Edit" → centered dialog with all fields |

- Popover edits **one display value**, dims nothing. Modal edits **an object or list**, dims the page.
  Finishing produces one chip → popover. A new row in a list → modal. Never swap them.
- Inline-editable fields: text by default; hover reveals dotted underline + a 12px pencil;
  click becomes the right affordance.
- **Empty state rides the same ladder**: a missing value renders as a dashed `+ Add {label}`
  that opens its own rung. No field is ever a dead-end.

## Object page pattern (the Luma pattern)

Every object-detail page:
- **Pulse strip** — at-a-glance metrics inline (calm, no stat-tile cards, no shadows).
- **Up to 3 hero action cards** — the top things a user does on this object. Big targets,
  gradient-tinted, one click. NOT a kebab menu.
- **Tabs as lenses** — all on the same object. Active tab: 2px bottom border `var(--fg-base)`.
- **Modal-first sub-actions** — small focused modals, one CTA. No multi-screen flows.
- **The overview shows less, not more.** Heavy lifting goes to specialized tabs.

## Quân Sử Việt editorial tokens (locked)

Amended 2026-08-06 for the approved museum-editorial direction: warm archival neutrals,
deep ink-green text and a restrained vermilion accent. This replaces the default token set
as one coordinated change; components may not invent per-surface colors.

Accessibility amendment 2026-08-07: `--fg-subtle` was darkened within the same ink-green
cluster so 9–13 px helper text reaches at least 4.5:1 on both archival page and sidebar
backgrounds. No component-specific color override is permitted.

| Token | Value | Use |
|---|---|---|
| `--bg-base` | `#F8F5EE` | page bg, cards |
| `--bg-subtle` | `#F1ECE2` | sidebar, savebar, secondary surfaces |
| `--bg-muted` | `#E8E1D5` | hover, muted chips |
| `--fg-base` | `#17251F` | primary text, primary buttons |
| `--fg-muted` | `#48564F` | body, descriptions |
| `--fg-subtle` | `#606A64` | helper text, timestamps |
| `--border` | `#D5CDC0` | all 1px borders |
| `--accent` | `#A3442F` | focus rings, accent links, validate-ok |
| `--accent-dark` | `#7F3021` | accent hover only |
| `--accent-success` | `#376144` | verified/source-complete state |
| `--surface-paper` | `#FFFDF8` | elevated reading and form surfaces |
| `--surface-ink` | `#203C32` | dark museum search surface |

**Typography**: `Inter` body/labels/buttons · `Fraunces` h1, card titles, prominent stat
values ONLY · `JetBrains Mono` identifiers, dates, counts, machine-shaped content ONLY.
Don't sprinkle serif on body text or mono on prose.

**Borders**: 1px `var(--border)`. No drop shadows except focus rings, active sidebar item,
and hero-card hover lift. One purposeful elevation, never shadow noise.

## Soft gradients (highlight, not decorate)

Hero surfaces ONLY (hero action cards, gallery/list covers, pulse backdrop). NEVER on
tables, form inputs, sidebars, page backgrounds, or body rows.

```css
--grad-peach:    linear-gradient(135deg, #F9EDE1 0%, #EED8C5 100%);  /* action / first in a series */
--grad-mint:     linear-gradient(135deg, #EDF2E8 0%, #D9E5D2 100%);  /* success / all-green */
--grad-sky:      linear-gradient(135deg, #EBF0EE 0%, #D7E2DE 100%);  /* info / context banners */
--grad-lavender: linear-gradient(135deg, #EFE9E2 0%, #DED4C9 100%);  /* primary surface / pulse */
--grad-rose:     linear-gradient(135deg, #F7E8E3 0%, #EACFC6 100%);  /* sharing / accent */
--grad-pulse:    linear-gradient(90deg, #F8F5EE 0%, #EDE5DA 50%, #F8F5EE 100%); /* subtle strips */
```

Hover on gradient cards: lift `translateY(-1px)` + `box-shadow: 0 8px 24px rgba(9,9,11,.06)`;
no hard accent border.

## Historical illustration policy

Amended 2026-08-09 for period and featured-content artwork. Generated imagery is an editorial aid,
never evidence: every collection carries a visible bilingual disclosure that it is an
original illustration rather than a historical document.

- Period artwork uses the same warm archival paper, etched ink, deep green and restrained
  vermilion collage language as the approved hero; it may not imitate a photograph or
  introduce legible labels, logos or watermarks.
- Every published period has one distinct static asset and a locale-specific descriptive
  alt. Decorative era names stay in nearby HTML and are not baked into the image.
- Masters use a consistent 3:2 frame and remain safely crop-able at 16:10. Cards reserve
  the image aspect ratio before loading, use `object-fit: cover`, and lazy-load below-fold
  artwork so the hero remains the LCP candidate.
- Six period assets together stay at or below 1.8 MB. Generated source files remain outside
  the runtime bundle; the website ships optimized WebP derivatives only.
- Each featured content id maps to one static asset reused by its card, detail page and
  Open Graph fallback. The card image is decorative because its type and title remain in
  HTML; the detail image has locale-specific alt text and a visible disclosure that it is
  not a historical photograph or artifact reproduction.
- Featured content without a mapping retains the type gradient. The six mapped assets stay
  at or below 1.8 MB together, reserve their 3:2 geometry, lazy-load on cards and receive
  priority only on the detail page.

## Motion policy

Amended 2026-08-08 for public-route transitions and viewport reveals. Motion supports
reading order; it never delays access to content or takes control of scrolling.

| Token | Value | Use |
|---|---|---|
| `--motion-duration-route` | `320ms` | Public page entry only |
| `--motion-duration-reveal` | `1ms` | View-timeline attachment; progress comes from scroll |
| `--motion-duration-feedback` | `160ms` | Hover/focus/press feedback on public controls |
| `--motion-duration-confirm` | `220ms` | One-shot confirmation such as copied-link feedback |
| `--motion-ease-out` | `cubic-bezier(.22, 1, .36, 1)` | Calm deceleration |
| `--motion-route-distance` | `8px` | Maximum page-entry offset |
| `--motion-reveal-distance` | `16px` | Maximum card/entry reveal offset |

- Route entry is at most 360ms and 8px; viewport reveal is at most 16px.
- Route entry keeps a non-zero starting opacity so the main content remains eligible for
  Largest Contentful Paint measurement.
- Animate only `opacity` and the individual `translate` property. Never animate layout
  properties, hijack scrolling, or compete with the existing card hover transform.
- Viewport reveal is progressive enhancement: content stays visible when view timelines
  are unsupported.
- Control feedback changes only color, border, shadow, opacity or individual `translate`;
  hover motion is guarded by `(hover: hover)`, lifts at most 1px and never moves layout.
- Keyboard activation receives the same state confirmation as pointer activation; focus
  remains the existing visible outline and is never replaced by motion alone.
- `prefers-reduced-motion: reduce` disables these effects completely and restores every
  animated public element to `opacity: 1` and `translate: none`, with public control
  transition duration set to `0s`.

## Forms

- Max 6 visible fields on any create/edit page; more → disclosure.
- One column, max-width 640px for focused forms. No multi-step wizards for editing.
- Sticky savebar: white, 1px top border, optional 4px gradient accent strip.
- Labels 12px / 500 / `var(--fg-muted)`. Inputs 38px tall, 1px border, accent focus ring.

## Iconography

Stroke line icons (Heroicons/Lucide style), stroke-width 1.6–2, no fill.
**No emojis. Anywhere. Ever.** Use SVGs.

## VN conventions (when the project is Vietnamese-facing)

- Vietnamese copy throughout the user surface — written natively, not translated.
- Prices: `₫750,000` — symbol leading, comma groups. Never "VND 750000.00".
- VietQR scan-to-pay as the default payment presentation; cards demoted to "Thẻ quốc tế".
- Zalo as a first-class support-channel option, not only email.

## What to never do

- Never leak engine words into user-facing copy (see vocabulary table).
- Never show raw `{{ }}` templates or JSON outside a power-user surface.
- Never use multi-step wizards for editing.
- Never gradient form inputs, body backgrounds, or table rows.
- Never stack shadows. Never add emojis. Never write design comments in HTML.

## How this binds the cards

- The **UI mock card** renders these tokens/patterns in static HTML — the mock IS the
  design review; the operator approves against this file.
- Every **frontend card**'s review checks the diff against this file the same way it
  checks shapes against `flow/05-contract.md`. DESIGN.md is to pixels what the contract
  is to shapes.
