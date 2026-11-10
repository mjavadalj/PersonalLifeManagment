# رویش

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
User-approved Electron, React, TypeScript, Vite, electron-builder; Windows desktop, offline.

## Users
A private personal companion for multiple independently tracked habits, including a configurable abstinence goal. Persian RTL and Solar Hijri dates. No medical claims or shame-based copy.

## Product Purpose
Record daily success, failure, or unknown; see a yearly contribution map and streaks; enjoy a sourced daily bilingual quote, optional personal media, and a desktop widget.

## Capabilities and Constraints
Multiple habits with independent daily records and one primary habit for world growth. Local files only, no accounts or telemetry. 100 public-domain quotes with original Persian translations. Always-on-top card widget, optional photo, quote expansion, and lamp mode. Photos and videos retain aspect ratio; videos only in main app. User selects forest or sky for each eligible successful date of the primary habit. First broken streak imposes 7 consecutive successful recovery days, next post-recovery break 14, then 21. Recovery-day failure restarts same period. Missing days suspend evaluation until resolved. Growth resumes the day after recovery completes. No retroactive growth for recovery days; existing worlds persist across failures. Historical edits deterministically reconcile current primary growth validity.

Habits can be added, renamed and softly archived; names are limited to 70 characters. Archiving preserves records and removes routine links. The primary habit must be replaced before it can be archived. Selecting another primary starts its growth period today, preserves previous worlds in growthHistory, and prevents a second growth choice for a date already used by a previous primary. The overview shows a compact 35-day card per habit, a quick today check, and a large yearly heatmap on opening a card. An existing today record opens the day editor instead of silently replacing it.

## Brand Commitments
Compact cream/olive main window approved in design/royesh-concept-v2.png. Card widget variants approved in design/royesh-widget-v3.png. Ink animation on success, optional living forest/sky and desk lamp. Main window approval supersedes v1. Media can be portrait or landscape. Image-first approval has been completed.

## Accessibility & Inclusion
Keyboard navigation, reduced motion, readable contrast, local Persian font; success/failure identified beyond color.

## Shipped Weekly Routine Addition

Global left navigation adds Habit Tracker, Weekly Routine, Widget and Settings destinations. The sidebar switches between 158px labels and a 54px icon rail, collapses responsively at 700px, and remembers manual collapse locally. Today, My World and Motivation remain a footer within the habit tracker views when a goal exists.

The recurring weekly schedule starts from the imported Schedule.md data: seven days, Saturday through Friday, each with 36 half-hour slots spanning 06:00–24:00. Adjacent activities with equal titles and habit links merge into blocks on a 40px slot grid. Right-click, the keyboard context-menu key or Shift+F10 opens an inline editor for day, title and range. Saving replaces activities in the target range; moving a block clears matching activity slots in its original day/range first. An empty title makes it free time. End time must follow start time. The editor and routineTask command limit titles to 70 characters; the raw routine schema still accepts 120-character slot titles for compatibility.

Daily repetition writes the same interval to all seven days. The habit checkbox links an already linked active habit, reuses an active habit with the exact same name, or creates one. Unticking unlinks the edited interval while preserving the habit and its history. A linked block opens that habit's tracker on ordinary click; checking a habit's completion remains independent of its schedule.

Routine saves use validated commands and the existing queued atomic state-file transaction with backup. Optional routine, routineLinks, primarySince and growthHistory fields preserve compatibility with older version-1 state files; an absent routine displays the imported default until a schedule is saved. Edits persist in the app's local state and do not rewrite Schedule.md.

The desktop widget adds locally remembered Habit, Motivation and Routine tabs. Routine shows the current activity or free time, its interval and remaining minutes, plus the next nonempty activity across the recurring week. It uses the computer's local weekday and time, refreshes every second and refreshes on focus/visibility changes. The routine remains available independently of an active habit goal and keeps the incumbent cream/olive visual identity.

Browser preview with ?demo seeds sample habits in the isolated roy-demo-habits localStorage key. Ordinary browser preview uses roy-preview; Electron uses its native bridge and real local state, never the browser demo store.
