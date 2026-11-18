const fs = require('fs');

const css = fs.readFileSync('styles.css', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

console.log('=== FIXED WIDTH AUDIT ===');
const cssWidths = css.match(/width:\s*([0-9]+)px/g) || [];
console.log('CSS fixed pixel widths:', [...new Set(cssWidths)]);

const inlineWidths = html.match(/style=["'][^"']*width:\s*([0-9]+)px/g) || [];
console.log('HTML inline fixed widths:', inlineWidths);

console.log('\n=== VIEWPORT META TAG ===');
const viewport = html.match(/<meta[^>]*name=["']viewport["'][^>]*>/i);
console.log('Viewport tag:', viewport ? viewport[0] : 'MISSING');

console.log('\n=== CONTAINER MAX WIDTHS ===');
const maxWs = html.match(/max-w-[a-z0-9]+/g) || [];
console.log('Max-width utility classes used:', [...new Set(maxWs)]);
