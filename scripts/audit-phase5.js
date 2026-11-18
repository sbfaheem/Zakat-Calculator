const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');

console.log('=== 1. ARIA-LIVE REGIONS ===');
const liveMatches = html.match(/aria-live=["'][^"']*["']/g) || [];
console.log('aria-live count:', liveMatches.length, liveMatches);
const announcerInHtml = html.includes('live-calculator-announcer');
const announcerInJs = js.includes('live-calculator-announcer');
console.log('live-calculator-announcer in HTML:', announcerInHtml, 'in JS:', announcerInJs);

console.log('\n=== 2. INPUT LABELS AUDIT ===');
const inputRegex = /<input[^>]+>/g;
let inputMatch;
let missingLabels = 0;
while ((inputMatch = inputRegex.exec(html)) !== null) {
  const tag = inputMatch[0];
  const idMatch = tag.match(/id=["']([^"']+)["']/);
  const typeMatch = tag.match(/type=["']([^"']+)["']/);
  const type = typeMatch ? typeMatch[1] : 'text';
  if (type === 'hidden') continue;

  if (idMatch) {
    const id = idMatch[1];
    const hasLabel = html.includes(`for="${id}"`) || html.includes(`for='${id}'`) || tag.includes('aria-label=') || tag.includes('aria-labelledby=');
    if (!hasLabel) {
      console.log(`Input without label: id="${id}" (tag: ${tag.substring(0, 50)}...)`);
      missingLabels++;
    }
  } else {
    const hasAria = tag.includes('aria-label=') || tag.includes('aria-labelledby=');
    if (!hasAria) {
      console.log(`Input without ID or aria-label: ${tag.substring(0, 50)}...`);
      missingLabels++;
    }
  }
}
console.log('Inputs with missing label/aria-label:', missingLabels);

console.log('\n=== 3. IMAGES AUDIT ===');
const imgRegex = /<img[^>]+>/g;
let imgMatch;
let missingAlts = 0;
while ((imgMatch = imgRegex.exec(html)) !== null) {
  const tag = imgMatch[0];
  if (!tag.includes('alt=')) {
    console.log(`Img without alt: ${tag}`);
    missingAlts++;
  }
}
console.log('Images missing alt:', missingAlts);

console.log('\n=== 4. SVG ACCESSIBILITY AUDIT ===');
const svgRegex = /<svg[^>]*>/g;
let svgMatch;
let svgsWithoutAria = 0;
while ((svgMatch = svgRegex.exec(html)) !== null) {
  const tag = svgMatch[0];
  const hasAriaHidden = tag.includes('aria-hidden=');
  const hasAriaLabel = tag.includes('aria-label=') || tag.includes('aria-labelledby=') || tag.includes('role=');
  if (!hasAriaHidden && !hasAriaLabel) {
    svgsWithoutAria++;
  }
}
console.log('SVGs without aria-hidden or aria-label:', svgsWithoutAria);

console.log('\n=== 5. CHECK PRIVACY POLICY GUARANTEE ===');
console.log('privacy_line in html:', html.includes('privacy_line'));
console.log('privacy_body in html:', html.includes('privacy_body_1'));
