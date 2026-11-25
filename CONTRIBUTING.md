# Contributing

Thanks for helping out. Standup Tracker is deliberately small, so please read the ground rules before you open a pull request.

## Ground rules

1. **One file, no build.** The app is `index.html`: vanilla HTML, CSS and JavaScript. Please don't add frameworks, bundlers, transpilers or runtime dependencies.
2. **No backend, no network calls.** Data lives only in the user's `localStorage`. Pull requests that add servers, `fetch`/XHR, analytics, telemetry or sync will not be merged.
3. **Private means private.** An item, blocker, ask or win marked private must never appear in the manager report, the downloaded snapshot or the text summary. If you add a new record type or a new shared output, extend the privacy test to cover it.
4. **Tests stay green.** `npm test` must pass, and none of the existing tests may be removed or weakened.

## Getting set up

You need Node 18 or newer. There is nothing to install.

```bash
git clone https://github.com/Stephen-Carras/standup-tracker.git
cd standup-tracker
npm test                                    # run the whole suite
node --test --test-name-pattern="quick-add"  # run one test by name
open index.html                             # or: npm start (needs Python 3), then http://localhost:8080
```

## Making a change

1. Branch from `main` (for example `fix/blocker-aging` or `docs/readme-typo`).
2. Make the change in `index.html`. Follow the existing patterns:
   - Render with the HTML string templates and wrap all user text in `esc()`.
   - Add interactions as `data-act` cases in `act()`, not as per-element listeners.
   - Manager-facing output goes through `compute(week, true)`, which filters out private records.
3. Add or update tests in `tests/app.test.js`. The `boot()` helper in `tests/boot.js` gives you `click`, `change`, `enter` and the rendered HTML.
4. If the demo data or the report changes, run `npm run example` to regenerate `examples/sample-snapshot.html`.
5. Tests use a stubbed DOM and cannot see layout, so check the change in a real browser, in both light and dark mode (`D`).
6. Update `README.md` if you change behaviour, shortcuts, quick-add tokens or the test count.

## Pull requests

- Keep each PR focused on one change.
- Describe what changed and why, and include a screenshot for visual changes.
- CI runs `npm test` on every PR. Merges to `main` deploy to GitHub Pages automatically.

## Reporting bugs and ideas

Open an issue with the template. For bugs, include your browser and OS, steps to reproduce, and a screenshot if it's visual. **Please don't paste a backup JSON that holds real work data.** Strip it down or use demo data instead.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
