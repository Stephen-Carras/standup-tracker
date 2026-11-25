# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Hard constraints

- **The whole app is `index.html`**: vanilla JS/HTML/CSS. No framework, no bundler, no build step, no runtime dependencies. Do not introduce any.
- **No backend and no network calls.** Data lives only in the browser's `localStorage` (keys `standup.solo.v1` for state, `standup.solo.ui` for theme and report toggles). The only external request is the Google Fonts stylesheet, which is optional (system fonts are the fallback). Do not add `fetch`, XHR, analytics or sync.
- **Private items never leave the owner's view.** Anything with `private: true` (entries, blockers, asks, wins) must never appear in the manager report, the downloaded snapshot or the copied text summary. Test 2 in `tests/app.test.js` enforces this; keep it passing and extend it whenever you add a new shared output or record type.
- **`npm test` must pass with all 12 tests.** CI (`.github/workflows/pages.yml`) runs it on every push and PR and only deploys to GitHub Pages from `main` after it passes.

## Commands

```bash
npm test                                   # node --test, 12 tests, Node 18+, no npm install needed
node --test --test-name-pattern="quick-add" # run one test by name
npm run example                            # regenerate examples/sample-snapshot.html from demo data
npm start                                  # python3 -m http.server 8080 (needs Python 3, not Node)
```

There is no lint or build step. Opening `index.html` directly in a browser also works.

## Architecture

`index.html` has one `<style id="appcss">` block and one inline `<script>`. The test harness extracts both with regexes, so keep exactly one inline `<script>` tag and keep the `appcss` id.

Data flow inside the script:

- **State**: the global `S` holds the persisted data (`goals`, `entries`, `blockers`, `asks`, `wins`, `checkins`, `carried`, profile fields, `demo` flag). `UI` holds view state (tab, selected week, modal, theme, report include toggles, undo buffer). `save()` writes `S` to localStorage, and `snap()` stores an undo copy before destructive actions.
- **Rendering**: string-template HTML. `render()` rebuilds `#app` from `view<Tab>()` functions, and `renderModal()` builds `#overlay`. Charts are hand-built SVG strings (`spark`, `donut`, `barsChart`, `burndown`, etc.). Always pass user text through `esc()`.
- **Events**: four delegated listeners on `document` (`click`, `change`, `input`, `keydown`). Buttons carry `data-act` / `data-id` / `data-v`, and `click` dispatches to the big `act(a, el)` switch. Form inputs use `data-chg`. Add new interactions as `data-act` cases, not per-element listeners.
- **Metrics**: `compute(weekStart, shared)` derives everything a view needs for a week. With `shared === true` it filters out private records, and that is the privacy chokepoint. `reportHtml`, `summaryText` and `snapshotHtml` (the manager-facing outputs) must go through `compute(ws, true)`.
- **Snapshot**: `snapshotHtml()` emits a standalone document with inlined CSS and no `<script>` or `data-act` attributes. Tests assert this. `downloadFile` uses `window.claude` save when present, otherwise a Blob download.
- **Test hook**: at the bottom of the script, if `window.__STANDUP_TEST__` exists, internals are exposed on `.api` (`getState`, `setState`, `reportHtml`, `snapshotHtml`, `summaryText`, `compute`, `seed`, `TODAY`, `UI`).

Tests: `tests/boot.js` runs the script in a `node:vm` sandbox with a stubbed DOM and in-memory localStorage, and returns helpers (`click(act, id, v)`, `change`, `enter`, `field`, `app()`, `overlay()`) that drive the real delegated handlers. Tests check rendered HTML strings, not layout, so check visual changes in a real browser. `scripts/build-example.js` reuses the same harness to write the sample snapshot.

## Docs and deploy

- Screenshots live in `docs/` (`overview.png`, `overview-dark.png`, `checkin.png`, `report.png`).
- Pages deploy copies only `index.html` and `examples/` into the site. Live at https://stephen-carras.github.io/standup-tracker/.
- When the test count or the shorthand and keyboard shortcuts change, update `README.md` to match.
