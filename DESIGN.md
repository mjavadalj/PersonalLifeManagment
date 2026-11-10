---
name: Royesh — رویش
description: A compact daily ritual with a lasting personal world.
colors:
  paper: "#faf9f5"
  ink: "#30342d"
  muted: "#74776b"
  olive: "#657349"
  line: "#e5e5dc"
  soft: "#eeeee5"
  primary-hover: "#52603c"
  success: "#7d8b60"
  failure: "#d3b7a2"
  unknown: "#e5e6dd"
typography:
  headline:
    fontFamily: "Vazirmatn, sans-serif"
    fontSize: "21px"
    fontWeight: 600
    lineHeight: 1.6
  title:
    fontFamily: "Vazirmatn, sans-serif"
    fontSize: "15px"
    fontWeight: 500
  body:
    fontFamily: "Vazirmatn, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  label:
    fontFamily: "Vazirmatn, sans-serif"
    fontSize: "12px"
  quote:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "18px"
    lineHeight: 1.55
rounded:
  control: "7px"
  cell: "2px"
spacing:
  tight: "7px"
  control-gap: "8px"
  section-gap: "12px"
  page-inset: "22px"
components:
  button-primary:
    backgroundColor: "{colors.olive}"
    textColor: "#fff"
    rounded: "{rounded.control}"
    padding: "8px 17px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-ghost:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "7px 10px"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 10px"
  navigation:
    typography: "{typography.label}"
    padding: "6px 9px"
  heatmap-cell:
    backgroundColor: "{colors.unknown}"
    rounded: "{rounded.cell}"
    height: "9px"
---
# Design System: Royesh — رویش

## Overview

**Creative North Star: "A compact daily ritual with a lasting personal world"**

A compact daily ritual with a lasting personal world. Warm paper, graphite, olive, local Persian typography and fine separators keep the desktop companion quiet and personal. The approved authority is design/royesh-concept-v2.png for the main window and design/royesh-widget-v3.png for the card widget.

The individual tracker uses an open page with inline statistics; the habit overview uses compact cards to distinguish independently tracked habits. English literary quotations introduce a serif voice alongside Persian UI text. Botanical raster material belongs to the forest; restrained SVG geometry belongs to the sky and optional lamp. The lamp's local glow is functional illustration, not a decorative page gradient.

Recorded from src/style.css, src/App.tsx, src/components.tsx, src/Worlds.tsx, src/main.tsx, electron/main.ts, public assets, PRODUCT.md and the index.html direction contract. This refresh preserves the incumbent approved design contract. Review captures live in .impeccable/review; docs/FINISH-REVIEW.md marks its scored corrections as ship, subject to its stated evidence limits.

**Key Characteristics:**

- Compact cream and olive desktop surfaces.
- Persian RTL interface with deliberate LTR quotation and calendar regions.
- Fine separators, restrained rounding and inline statistics.
- Local imagery and fonts; optional personal media and living worlds.

## Colors

The primary olive sits within warm paper and graphite neutrals. Frontmatter values are normative.

### Primary

Muted olive identifies primary actions, focus, brand and selected accents. Deep olive is the primary hover. Growth olive identifies successful calendar entries.

### Secondary

Quiet clay identifies failed dates, accompanied by a dash and semantic status text.

### Neutral

Warm paper fills the page, widget, fields and dialogs. Graphite carries default text; muted leaf gray supports it. Warm separators divide regions, soft paper supports quiet fields, and unrecorded gray identifies unknown days.

**The Quiet Accent Rule.** Use olive for actions, selected states and growth; keep the surrounding page on warm paper.

## Typography

Local @fontsource imports bundle Vazirmatn at 400, 500 and 600. English quotations use Georgia, Times New Roman and serif fallbacks. No remote font request is required.

The small hierarchy moves from headline (21px) to title (15px), body (13px), navigation/statistics (12px) and fine copy (11px). Calendar and attribution metadata use 9–10px; these are observed compact metadata sizes, not a prescription for new body text. The widget counter uses 60px, weight 500 and line-height 1.2. Counters and statistics use tabular numerals.

English quotations have a 65ch maximum and become 17px below the 700px breakpoint. Persian translation resolves to 13px with line-height 1.95. Widget quotations use English 16px/1.5 and Persian 11px/1.9. The final cascade keeps footer navigation at 12px even below the breakpoint.

**The Two Reading Directions Rule.** Keep Persian controls RTL and English quotation text LTR; do not mirror literary content with the interface.

## Layout

The native main window starts at 820 × 610px with a minimum of 630 × 490px. Its shell caps at 1150px and fills viewport height. A 42px titlebar precedes content padded 28px 32px 0; at widths up to 700px, padding becomes 22px 22px 0. Bottom navigation remains horizontal.

The annual map preserves seven 9px rows with 3px gaps and a 580px minimum internal width. It scrolls horizontally while a separate 49px weekday column stays aligned. Main quotations have two equal columns and a 28px gap, reduced to 20px at the breakpoint.

The separate widget is 280px wide with a 37px titlebar, 16px body side insets and 170px minimum content height. ResizeObserver reports its natural rendered height to the native host. Expanded quotation, photo and lamp modes replace the large counter with a compact 12px inline count. Quote content remains in normal flow with a collapse control.

Media supports natural size, portrait 3:4 and landscape 16:9. Main media caps at 380px high; widget media at 270px. Preserve selected contain/cover behavior and vertical crop position.

## Elevation & Depth

Ordinary depth comes from tonal fields and fine separators. Dialogs use a diffuse shadow (0 18px 65px #30342d20) and translucent backdrop (#30342d35).

**The Flat Page, Lifted Dialog Rule.** Use separators and tonal fields for ordinary surfaces; reserve the diffuse shadow for dialogs.

## Shapes

Controls and annual-map cells use the frontmatter radii. Media, worlds and dialogs use 10px, 12px and 14px corners respectively. Habit cards use 12px corners and their miniature cells use 3px corners. Icons are Lucide outlines. Settings toggles use a 32 × 19px pill with a 13px circular thumb. There is no separate tag/chip system.

## Components

### Buttons and navigation

Primary buttons use white medium-weight text and a 36px minimum height; the full-width widget action uses 35px. Ghost controls gain a light warm hover field, active navigation gains a muted olive field, and text actions gain an underline. Disabled controls reduce opacity. Keyboard focus is a 2px olive outline offset by 3px.

### Fields and settings

Paper fields have a thin muted border (#d9dcd0), labels separated by 7px and related date controls separated by 8px. Invalid dates show actual error text. Time inputs use LTR. Settings use separators and rows at least 44px high.

### Calendar and success feedback

Every date button exposes a full date/status label and title; failure also carries a dash, and today is outlined. Ink travels from the success action to today's cell, then an optional world choice appears. Button transitions use 0.18s; ink wash and world reveal use 0.8s with cubic-bezier(0.16, 1, 0.3, 1). CSS disables animations and transitions under prefers-reduced-motion; application motion also respects the preference.

### Habit overview

Compact bordered paper cards form an auto-fitting grid with a 195px minimum column and 16px gaps; below 700px, the minimum becomes 180px. Each card contains a circular 35px today check, a truncated 15px name, a 35-day miniature map in seven LTR columns, and quiet primary/rename/archive actions. Muted olive, clay, slate and plum card accents distinguish habits without changing the warm page palette. Today's miniature cell has an outline; pre-start dates are subdued. The completed check fills with its card accent and switches to a double-check icon. The name and miniature map open the larger annual tracker; the primary label identifies world growth, and its archive action stays disabled until another primary is selected.

### Quotation and widget

Retain author, work, location and source action. Expanded widget quotes sit below the footer and have a collapse action. Their compact count substitution leaves space for literary content.

### Worlds and lamp

The forest repeats transparent public/tree.png inside SVG placement groups, with date-seeded position, scale and reflection. It is botanical raster artwork, not a vector tree. The generation prompt is retained at design/tree-prompt.txt and embedded in the shipping PNG; shipping icon.png also carries provenance, while icon.svg is vector artwork.

The sky intentionally uses SVG geometry: stars, faint connecting lines, occasional cross rays and a crescent. Its slate field (#263744) and pale warm stars belong to that world, not general chrome. World canvases cap visible height at 340px and scroll as entries accumulate. The optional SVG desk lamp uses localized radial light and a 0.9s opacity transition. Reduced motion preserves its lit state without transition.

## Do's and Don'ts

### Do:

- Do preserve Persian RTL reading order, Solar Hijri labels and explicit LTR English quotations.
- Do keep real instructions in empty states and confine synthetic history to tests and visual verification.
- Do retain aspect ratio and explicit fit/crop controls for personal media.
- Do retain keyboard focus, semantic status labels and reduced-motion behavior.
- Do carry embedded prompt provenance with shipping raster assets.

### Don't:

- Don't add a permanent media sidebar, oversized hero or stacked statistic cards to the compact tracker; keep habit overview cards focused on their name, recent map and actions.
- Don't introduce remote runtime fonts, imagery or telemetry.
- Don't use color alone to convey daily status.
- Don't apply decorative gradients to page chrome; the optional illustrated lamp has a localized light gradient.

### Shipped routine and workspace addition

The workspace now places a 158px navigation sidebar on the left, with RTL content alongside it. Manual collapse uses a 54px icon rail and persists locally; widths up to 700px also use the 54px rail and hide labels. Habit tracker, weekly routine, widget and settings are global destinations. The horizontal footer is scoped to the active goal's Today, My World and Motivation views. These additions extend the incumbent cream, graphite and olive system.

The weekly routine uses seven Saturday-to-Friday columns and 36 half-hour slots from 06:00 to 24:00. Each slot occupies 40px; adjacent activities with equal titles and habit links merge into one block. The table has an 810px minimum width, a 58px time column, sticky 44px day headings and a scroll region capped at 65vh. Filled blocks use soft paper with olive text; selection and hover use a pale olive field. Free time remains muted, and today's heading gains the olive accent. Linked activities carry a small sprout icon and open the habit tracker on ordinary click.

Right-click or the keyboard context-menu key/Shift+F10 opens an inline editor above the table for day, activity and half-hour boundaries, with save and cancel actions. A full-width options row adds daily repetition and habit-link checkboxes with explanatory copy. Habit names and activity editor titles cap at 70 characters. The routine heading sits on the right and its compact current/next summary on the left, separated by 36px; the summary uses an olive clock icon, a 16px activity heading and 12px Persian timing text. Below 700px the gap becomes 20px; below 500px the heading and summary stack. Habit, Motivation and Routine tabs sit below the widget titlebar; the Routine tab reuses the current/next summary.

### Live routine and window controls
The current local-computer-time block uses deep olive with white text and an explicit اکنون label. A one-second clock refreshes on window focus and visibility changes; entry and activity-boundary changes reveal the current block in the independently scrolling weekly grid without taking keyboard focus. The return-to-now action allows recovery after manual browsing. The native titlebar places actions at the right and toggles maximize/restore. Widget compact mode persists as an optional settings field, uses a 220px native width and 120px minimum height versus 280px/170px normal, and reduces media and spacing. Motivation shows personal media and REMEMBER! instead of the daily quote.
