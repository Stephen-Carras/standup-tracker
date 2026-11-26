// Boots index.html's script against a tiny stubbed DOM. No browser or dependencies needed.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const JS = /<script>([\s\S]*)<\/script>/.exec(HTML)[1];
const CSS = /<style id="appcss">([\s\S]*?)<\/style>/.exec(HTML)[1];

function boot() {
  const els = {};
  const mk = (id) => els[id] || (els[id] = {
    id, value: '', checked: false, innerHTML: '', textContent: id === 'appcss' ? CSS : '',
    classList: { toggle() {} }, setAttribute() {}, removeAttribute() {}, style: {}, focus() {}, select() {},
  });
  const handlers = {};
  const store = {};
  const sandbox = {
    console, TextEncoder, Uint8Array, Math, Date, JSON, Object, Array, String, Number, setTimeout, clearTimeout,
    Blob: class {}, URL: { createObjectURL() { return 'blob:x'; }, revokeObjectURL() {} }, FileReader: class {},
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; } },
    matchMedia: () => ({ matches: false }),
    navigator: { clipboard: { writeText: (t) => { sandbox.__copied = t; return Promise.resolve(); } } },
    document: {
      documentElement: { setAttribute() {}, removeAttribute() {} },
      body: { appendChild() {}, removeChild() {} },
      getElementById: mk,
      addEventListener: (t, f) => { handlers[t] = f; },
      createElement: () => ({ click() {}, style: {} }),
    },
  };
  sandbox.window = sandbox;
  sandbox.__STANDUP_TEST__ = {};
  vm.createContext(sandbox);
  vm.runInContext(JS, sandbox);
  const api = sandbox.__STANDUP_TEST__.api;
  const click = (act, id, v) => handlers.click({ target: { closest: () => ({ getAttribute: (n) => ({ 'data-act': act, 'data-id': id, 'data-v': v })[n] }) } });
  const change = (chg, id, value, extra = {}) => handlers.change({ target: { getAttribute: (n) => ({ 'data-chg': chg, 'data-id': id })[n], value, ...extra } });
  const enter = (id) => handlers.keydown({ key: 'Enter', target: { id, tagName: 'INPUT' }, preventDefault() {} });
  return { api, els, sandbox, click, change, enter, field: (id) => mk(id), app: () => els.app.innerHTML, overlay: () => els.overlay.innerHTML, toast: () => (els.toast ? els.toast.innerHTML : '') , store };
}

module.exports = { boot, HTML };
