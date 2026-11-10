# Release validation

The implementation is an offline Windows x64 Electron application. Tests use isolated `ROYESH_DATA_DIR` folders; synthetic heatmap history and media are not included in user data or the installer.

## Evidence matrix

| Requirement | Evidence |
|---|---|
| Persian RTL, local font, Solar Hijri year map, Saturday–Friday, past-year navigation | `src/components.tsx`, `src/shared/date.ts`; leap/new-year unit test; screenshots at 820 and 630 CSS pixels and 150% pixel scaling |
| Daily status/edit/delete, no future/pre-goal records, totals/current/best streak | Strict command validation and `tests/logic.test.ts`; actual Electron onboarding and success flow |
| New goal archives; rename preserves history | Command tests and read-only archive UI |
| 7/14/21 recovery, failures during recovery reset same period, unknown suspends, history reconciliation | Dedicated deterministic tests in `tests/logic.test.ts` |
| One forest/sky claim per eligible day, deferred selection, retained prior world | Command/ledger tests; browser and native interaction tests; forest/sky captures |
| Ink and lamp | `src/InkTravel.tsx`, `src/Worlds.tsx`, reduced-motion CSS; native/browser lamp screenshots |
| Exactly 100 unique sourced public-domain quotations with Persian translations | `src/data/quotes.ts`, `docs/QUOTES.md`, `docs/quote-verification.json`; verifier confirms 100/100 source matches |
| Quote stable by day, 100-item shuffle, no boundary repeat, no skipped-day consumption | Quote cycle unit test; relaunch and resume integration tests; both windows use the same main-process selection |
| Image/video imports copied, originals retained; optional section/photo defaults off | Native import/protocol/deletion tests and settings defaults |
| Portrait PNG, landscape JPEG/WebP, incompatible MP4, missing file, WebM play/pause | `scripts/electron-check.mjs`, `scripts/native-edge-check.mjs`; actual Chromium decode and pause assertions |
| Main/widget immediate synchronization, always-on-top, natural resizing | Native tests inspect BrowserWindow state and rendered content; expansion/collapse height assertion |
| Saved/clamped widget position, close main to tray | Native window tests simulate offscreen/display change and inspect visibility; main-process tray menu implementation |
| Generic reminder once/day and after resume | Pure reminder tests and actual powerMonitor resume event with isolated process clock; Notification.show intercepted to avoid sending test notifications |
| Sandboxed renderer, narrow typed IPC, no runtime network | Native webPreferences checks, no renderer require, failed external fetch; private protocol allowlists and zod validation |
| Atomic queued persistence and previous good backup | Store tests, missing/corrupt primary recovery tests, real executable relaunch |
| Windows installer | NSIS build and silent installation to a temporary workspace directory; final executable validation recorded separately below |

## Scope of verification

18 unit tests pass. Browser workflow, native workflow, and native media/resume edge suites pass. Source quote matching is not a substitute for editorial attribution: authors, works, translators and passage locations are supplied separately in the corpus and quote documentation.

Keyboard onboarding, success/growth choice, heatmap activation, dialog focus containment, Escape dismissal and focus restoration are verified by `scripts/native-accessibility-check.mjs` and `keyboard-check.json`.

The independent design reviewer returned **ship for the scored fixes** (weekday orientation, widget hierarchy, forest material and native quote overflow); see `FINISH-REVIEW.md`. This is not a blanket claim about every possible Windows environment.

Display disconnect handling was exercised through Electron's screen event and offscreen bounds; a physical monitor was not unplugged. Resume was simulated without changing the system clock or putting the user's computer to sleep. Windows notification delivery remains subject to OS permissions and Do Not Disturb. The executable has no commercial signing certificate. Media codecs depend on the file encoding. No secure-desktop/fullscreen-game guarantee is made.

## Final installed release

On 2026-09-26 the final NSIS installer exited successfully (0) when installed into `tmp/installed-smoke`. Both native suites passed against that installed `Royesh.exe`, not just a development server. See `native-check.json` and `native-edge-check.json`; `browser-check.json` records the browser fixture workflow. No page errors were reported by the native workflow.

Installer: `release/Royesh Setup 1.0.0.exe`.

SHA-256: `F5CBE1B2433DF5C5B7EA3E77D48A5A16129D8B01CFDD80A6C750A7AABA3208F8`.
