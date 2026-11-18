const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');
const match = js.match(/const TRANSLATIONS = (\{[\s\S]*?\n\};)/);
const vm = require('vm');
const s = {};
vm.runInNewContext('T = ' + match[1], s);
const r = /data-i18n=['"]([^'"]+)['"]/g;
let m;
const keys = new Set();
while ((m = r.exec(html)) !== null) {
  keys.add(m[1]);
}
console.log('Used in HTML:', keys.size);
console.log('Missing in ur:', [...keys].filter(k => !s.T.ur[k]));
console.log('Missing in en:', [...keys].filter(k => !s.T.en[k]));
console.log('Missing in ar:', [...keys].filter(k => !s.T.ar[k]));
