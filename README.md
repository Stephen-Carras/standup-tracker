# Standup Tracker

A personal weekly dashboard for people who need to show their manager what they are working on. Plan your day in under a minute, watch the week take shape in charts, then export a clean read-only report.

One HTML file. No backend, no build step, no account. Your data stays in your browser.

**Try the output:** open [`examples/sample-snapshot.html`](examples/sample-snapshot.html) to see exactly what a manager receives.

## Quick start

```bash
git clone <your-fork-url> standup-tracker
cd standup-tracker
open index.html          # or double-click it
```

Prefer a local server? Run `npm start` and visit <http://localhost:8080>.

The first load shows demo data so every chart has something in it. Use **Clear demo** when you are ready to start fresh, then add your name, role, manager and goals in **Settings**.

## What you get

| Tab | What it is for |
| --- | --- |
| **Overview** | KPI tiles with sparklines, status mix donut, goal progress, throughput, time by goal, confidence by goal, blocker burn-down, and a four-week check-in calendar. Pick any past week. |
| **Check-in** | Yesterday, today, blockers and goals on one screen. Unfinished items carry forward automatically. |
| **Week** | Everything shipped and in progress for the selected week, blocker aging, and auto-written highlights. |
| **Wins & asks** | A wins log for performance reviews, plus who you are waiting on and what you owe others, with due-date pills. |
| **Report** | The manager view. Choose what to include, then download a snapshot or copy a text summary. |

Numbers and percentages are shown as color-coded pills, so green, amber and red read at a glance.

### Quick-add shorthand

Type this in the Check-in add box and press Enter:

```
Fix empty-state bug #onboarding !a ~60 @2h
```

| Token | Meaning |
| --- | --- |
| `#key` | Link to a goal (the key is shown next to each goal in Settings) |
| `!g` `!a` `!r` | Status: on track, at risk, off track |
| `~70` | Confidence percent |
| `@2h` or `@1.5h` | Hours spent |
| `!p` | Private, never shown to your manager |

### Keyboard shortcuts

`/` focus the add box · `L` log check-in · `1`–`5` switch tabs · `[` `]` previous or next week · `D` dark mode · `?` help

## Sharing with your manager

1. Open the **Report** tab and pick the week.
2. Tick or untick **Hours & throughput**, **Blockers**, **Asks** and **Wins**.
3. Click **Download snapshot (.html)** and send the file by email or Slack. It is a single read-only page that opens offline in any browser. No scripts, no links back to your data.
4. For a PDF, open the snapshot and use your browser's Print. The layout is print-ready.
5. For a quick message, click **Copy text summary**.

**Private items are excluded everywhere.** Mark an item, blocker, ask or win as private and it never appears in the report, the snapshot or the text summary. The Report tab shows exactly what will be shared.

## Your data

- Everything is stored in your browser's `localStorage` under `standup.solo.v1`. Nothing is uploaded.
- **Clearing site data, using a private window, or switching browsers loses it.** Use **Settings → Copy backup JSON** now and then, and **Restore** to load it back.
- Deletes show an Undo toast for a few seconds.

## Host it on GitHub Pages

The included workflow runs the tests and publishes `index.html` to Pages on every push to `main`.

1. Push the repo to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main`. Your tracker is live at `https://<you>.github.io/<repo>/`.

Hosting only changes where the page loads from. Each person's data still lives in their own browser.

## Development

```bash
npm test             # 11 tests, no dependencies, Node 18+
npm run example      # regenerate examples/sample-snapshot.html
```

The tests load `index.html`'s script against a small stubbed DOM (`tests/boot.js`), so they run anywhere Node does. They cover rendering of every tab, the private-item guarantee, quick-add parsing, create/edit/delete for every record type, carry-forward, backups and the empty state.

The whole app is `index.html`. There is no framework. Charts are hand-built SVG.

## Known limitations

- **Single user, single browser.** There is no sync. That is the point, and it is also the limit.
- **A snapshot is a moment in time.** Export a new one when your week changes.
- **Fonts load from Google Fonts.** Offline, the page falls back to system fonts and still works.
- **Automated tests run on a stubbed DOM.** They do not check pixel layout. Please look at it in your browser and open an issue if something is off on your screen size.
- No notifications or calendar and chat integrations.

## Ideas for later

- Import from GitHub issues or Jira to prefill the plan
- Month and quarter reports for reviews
- Optional encrypted backup file
- Markdown export of the wins log

## License

MIT. See [LICENSE](LICENSE).
