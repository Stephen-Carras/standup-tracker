// Regenerates examples/sample-snapshot.html from the demo data.
// Usage: node scripts/build-example.js
const fs = require('node:fs');
const path = require('node:path');
const { boot } = require('../tests/boot');

const t = boot();
const out = path.join(__dirname, '..', 'examples', 'sample-snapshot.html');
fs.writeFileSync(out, t.api.snapshotHtml());
console.log('Wrote ' + path.relative(process.cwd(), out));
