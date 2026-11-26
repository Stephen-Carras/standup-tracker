// Run with: node --test
// Boots index.html's script against a tiny stubbed DOM, so no browser or dependencies are needed.
const test = require('node:test');
const assert = require('node:assert/strict');

const { boot } = require('./boot');

const TABS = ['overview', 'checkin', 'week', 'wins', 'report'];

test('boots with demo data and renders every tab cleanly', () => {
  const t = boot();
  assert.equal(t.api.getState().demo, true);
  for (const tab of TABS) {
    t.click('tab', null, tab);
    assert.ok(t.app().length > 500, tab + ' rendered');
    assert.doesNotMatch(t.app(), /NaN|undefined|\[object/, tab + ' has no bad values');
  }
});

test('private items never reach the manager report, snapshot or summary', () => {
  const t = boot();
  const S = t.api.getState();
  const secret = S.entries.find((e) => e.private);
  assert.ok(secret, 'demo has a private item');
  t.click('tab', null, 'week');
  assert.match(t.app(), new RegExp(secret.text), 'visible to the owner');
  assert.doesNotMatch(t.api.reportHtml(t.api.UI.week), new RegExp(secret.text));
  assert.doesNotMatch(t.api.snapshotHtml(), new RegExp(secret.text));
  assert.doesNotMatch(t.api.summaryText(t.api.UI.week), new RegExp(secret.text));
  // private asks, wins and blockers too
  S.asks.push({ id: 'pa', text: 'SECRET-ASK', who: 'x', dir: 'owed', due: '', done: false, created: t.api.TODAY, private: true });
  S.wins.push({ id: 'pw', date: t.api.TODAY, text: 'SECRET-WIN', impact: '', goal: '', private: true });
  S.blockers.push({ id: 'pb', text: 'SECRET-BLOCKER', severity: 'high', owner: '', opened: t.api.TODAY, resolved: null, private: true });
  const out = t.api.snapshotHtml() + t.api.summaryText(t.api.UI.week);
  assert.doesNotMatch(out, /SECRET-/);
});

test('snapshot is a standalone read-only HTML file', () => {
  const t = boot();
  const html = t.api.snapshotHtml();
  assert.match(html, /^<!DOCTYPE html>/);
  assert.match(html, /<style>[\s\S]+<\/style>/);
  assert.doesNotMatch(html, /<script/);
  assert.doesNotMatch(html, /data-act=/, 'no live controls in the snapshot');
  assert.match(html, /Alex Rivera/);
});

test('quick-add parses goal, status, confidence, hours and private', () => {
  const t = boot();
  t.click('tab', null, 'checkin');
  t.field('addInput').value = 'Write design doc #latency !a ~40 @2.5h !p';
  t.enter('addInput');
  const e = t.api.getState().entries.find((x) => x.text === 'Write design doc');
  assert.ok(e);
  assert.equal(e.status, 'A');
  assert.equal(e.conf, 40);
  assert.equal(e.hours, 2.5);
  assert.equal(e.private, true);
  assert.equal(e.goal, 'g2');
});

test('items: edit, delete and undo', () => {
  const t = boot();
  const e = t.api.getState().entries.find((x) => x.date === t.api.TODAY);
  t.click('edit', e.id);
  assert.match(t.overlay(), /Edit item/);
  t.field('eText').value = 'Renamed item'; t.field('eGoal').value = 'g1'; t.field('eStat').value = 'R';
  t.field('eConf').value = '25'; t.field('eHours').value = '3'; t.field('eDone').checked = true; t.field('ePriv').checked = true;
  t.click('saveItem', e.id);
  const saved = t.api.getState().entries.find((x) => x.id === e.id);
  assert.deepEqual([saved.text, saved.status, saved.conf, saved.hours, saved.done, saved.private], ['Renamed item', 'R', 25, 3, true, true]);
  assert.ok(saved.doneDate);
  t.click('del', e.id);
  assert.ok(!t.api.getState().entries.some((x) => x.id === e.id));
  t.click('undo');
  assert.ok(t.api.getState().entries.some((x) => x.id === e.id));
});

test('blockers, asks and wins support add, edit and delete', () => {
  const t = boot();
  t.field('blText').value = 'Need prod access'; t.field('blSev').value = 'high'; t.field('blOwn').value = 'IT';
  t.click('addBlocker');
  const b = t.api.getState().blockers.find((x) => x.text === 'Need prod access');
  assert.ok(b);
  t.field('bText').value = 'Need prod + staging'; t.field('bSev').value = 'med'; t.field('bOwn').value = 'Platform'; t.field('bOpened').value = b.opened; t.field('bState').value = 'resolved'; t.field('bPriv').checked = false;
  t.click('saveBlocker', b.id);
  assert.ok(t.api.getState().blockers.find((x) => x.id === b.id).resolved);
  t.click('delBlocker', b.id);
  assert.ok(!t.api.getState().blockers.some((x) => x.id === b.id));

  t.field('aText').value = 'Contract review'; t.field('aWho').value = 'Legal'; t.field('aDir').value = 'waiting'; t.field('aDue').value = ''; t.field('aPriv').checked = false;
  t.click('addAsk');
  const a = t.api.getState().asks.find((x) => x.text === 'Contract review');
  assert.ok(a);
  t.change('askdone', a.id, '', { checked: true });
  assert.equal(t.api.getState().asks.find((x) => x.id === a.id).done, true);
  t.click('delAsk', a.id);
  assert.ok(!t.api.getState().asks.some((x) => x.id === a.id));

  t.field('wText').value = 'Launched v2'; t.field('wImpact').value = '+22%'; t.field('wGoal').value = 'g1'; t.field('wDate').value = t.api.TODAY; t.field('wPriv').checked = false;
  t.click('addWin');
  const w = t.api.getState().wins.find((x) => x.text === 'Launched v2');
  assert.ok(w);
  t.click('delWin', w.id);
  assert.ok(!t.api.getState().wins.some((x) => x.id === w.id));
});

test('carry-forward moves unfinished items once per day', () => {
  const t = boot();
  const S = t.api.getState();
  const carried = S.entries.filter((e) => e.carriedFrom);
  const again = boot();
  assert.ok(carried.length >= 1, 'demo carries something over');
  assert.equal(new Set(carried.map((e) => e.carriedFrom)).size, carried.length, 'no item carried twice');
  assert.ok(again.api.getState().entries.length > 0);
});

test('week navigation never goes into the future', () => {
  const t = boot();
  const cur = t.api.UI.week;
  t.click('weekNav', null, '1');
  assert.equal(t.api.UI.week, cur);
  t.click('weekNav', null, '-1');
  assert.ok(t.api.UI.week < cur);
  t.click('weekNav', null, '0');
  assert.equal(t.api.UI.week, cur);
});

test('clear demo leaves a clean empty state and undo restores it', () => {
  const t = boot();
  t.click('clearDemo');
  const S = t.api.getState();
  assert.equal(S.demo, false);
  assert.equal(S.entries.length, 0);
  t.click('tab', null, 'overview');
  assert.match(t.app(), /Welcome/);
  for (const tab of TABS) { t.click('tab', null, tab); assert.doesNotMatch(t.app(), /NaN|undefined/, tab + ' empty state'); }
  t.click('undo');
  assert.equal(t.api.getState().demo, true);
});

test('erase needs a confirmation step', () => {
  const t = boot();
  t.click('settings');
  t.click('eraseAsk');
  assert.match(t.overlay(), /Confirm: erase everything/);
  assert.ok(t.api.getState().entries.length > 0);
  t.click('eraseAll');
  assert.equal(t.api.getState().entries.length, 0);
});

test('backup export and restore round-trips', () => {
  const t = boot();
  const json = JSON.stringify(t.api.getState());
  t.click('eraseAll');
  assert.equal(t.api.getState().entries.length, 0);
  t.field('importBox').value = json;
  t.click('importPaste');
  assert.ok(t.api.getState().entries.length > 0);
  t.field('importBox').value = '{not json';
  t.click('settings');
  t.click('importPaste');
  assert.match(t.toast(), /not valid JSON/);
});

test('download uses the platform save path when present, and the browser fallback otherwise', async () => {
  const t = boot();
  let saved = null;
  t.sandbox.claude = { use: async (n) => (n === 'downloads' ? { save: async (r) => { saved = r; return { status: 'saved' }; } } : null) };
  t.click('downloadSnapshot');
  await new Promise((r) => setTimeout(r, 10));
  assert.match(saved.filename, /^weekly-update-alex-rivera-\d{4}-\d{2}-\d{2}\.html$/);
  assert.match(saved.data, /^<!DOCTYPE html>/);

  const t2 = boot();
  t2.click('downloadSnapshot');
  assert.match(t2.toast(), /Snapshot download started/);
});

test('PowerPoint export is a valid zip, includes the 4-square, and never contains private items', () => {
  const t = boot();
  const S = t.api.getState();
  const secret = S.entries.find((e) => e.private);
  S.asks.push({ id: 'pa', text: 'SECRET-ASK', who: 'x', dir: 'waiting', due: '', done: false, created: t.api.TODAY, private: true });
  S.wins.push({ id: 'pw', date: t.api.TODAY, text: 'SECRET-WIN', impact: '', goal: '', private: true });
  S.blockers.push({ id: 'pb', text: 'SECRET-BLOCKER', severity: 'high', owner: '', opened: t.api.TODAY, resolved: null, private: true });
  const bytes = t.api.buildPptx(t.api.UI.week);
  assert.deepEqual(Array.from(bytes.slice(0, 4)), [0x50, 0x4b, 0x03, 0x04], 'zip signature');
  const text = Buffer.from(bytes).toString('utf8');
  for (const part of ['[Content_Types].xml', 'ppt/presentation.xml', 'ppt/slides/slide1.xml', 'ppt/slides/slide2.xml', 'ppt/theme/theme1.xml']) {
    assert.ok(text.includes(part), part + ' present');
  }
  assert.match(text, /At a glance/);
  assert.match(text, /Alex Rivera/);
  assert.doesNotMatch(text, /SECRET-/);
  assert.ok(!text.includes(secret.text), 'private item text absent');
  const quad = t.api.fourSquare(t.api.compute(t.api.UI.week, true), t.api.UI.inc);
  assert.doesNotMatch(quad, /SECRET-/);
  assert.ok(!quad.includes(secret.text));
});

test('PowerPoint save uses the platform path with a .pptx name, and PDF button guards the sandbox', async () => {
  const t = boot();
  let saved = null;
  t.sandbox.claude = { use: async (n) => (n === 'downloads' ? { save: async (r) => { saved = r; return { status: 'saved' }; } } : null) };
  t.click('downloadPptx');
  await new Promise((r) => setTimeout(r, 10));
  assert.match(saved.filename, /^weekly-update-alex-rivera-\d{4}-\d{2}-\d{2}\.pptx$/);
  assert.ok(saved.data, 'has data');
  t.click('printPdf');
  assert.match(t.toast(), /Printing is blocked in this preview/);
  const t2 = boot();
  t2.click('printPdf');
  assert.match(t2.toast(), /Could not open the print dialog/);
});
