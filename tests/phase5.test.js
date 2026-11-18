const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

test('Phase 5: Exactly one <h1> tag exists on the page', () => {
  const h1Matches = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || [];
  assert.equal(h1Matches.length, 1, `Expected exactly 1 <h1> tag, found ${h1Matches.length}`);
  assert.ok(h1Matches[0].includes('hero_title'), 'The single <h1> should be the hero title');
  
  // The print title must be an <h2>
  assert.ok(html.includes('<h2 data-i18n="print_title"'), 'Print report title must be an <h2>');
});

test('Phase 5: Zero placeholder href="#" links exist in index.html', () => {
  const hrefHashes = html.match(/href\s*=\s*['"]#['"]/g) || [];
  assert.equal(hrefHashes.length, 0, `Expected 0 href="#" placeholders, found ${hrefHashes.length}`);
});

test('Phase 5: Scholarly consensus claim is replaced with Hanafi silver nisab note', () => {
  assert.ok(!html.includes('authentic scholarly consensus'), 'Should not claim authentic scholarly consensus without citation');
  assert.ok(html.includes('Calculated using the Hanafi silver nisab by default.'), 'Hero badge should state Hanafi silver standard');
});

test('Phase 5: PDF print declaration uses advisory wording without "verified" claim', () => {
  assert.ok(
    html.includes('This is an estimate for guidance. Please consult a qualified scholar for your situation.'),
    'Print declaration in HTML must use the required advisory wording'
  );
  assert.ok(
    js.includes('This is an estimate for guidance. Please consult a qualified scholar for your situation.'),
    'Print declaration in JS must use the required advisory wording'
  );
  assert.ok(
    !html.includes('Using verified seed rates'),
    'Should not use misleading "verified seed rates" claim'
  );
});

test('Phase 5: Privacy guarantee is clearly stated across HTML and translations', () => {
  const privacyText = 'Your numbers stay on your device. We do not store your data.';
  assert.ok(html.includes('privacy_line'), 'HTML must feature privacy_line data-i18n');
  assert.ok(js.includes(privacyText), 'app.js translations must feature the exact privacy guarantee');
  assert.ok(html.includes('id="privacy-modal"'), 'Privacy policy modal must exist');
  assert.ok(html.includes('id="terms-modal"'), 'Terms of service modal must exist');
  assert.ok(html.includes('id="support-modal"'), 'Support & guidance modal must exist');
});

test('Phase 5: Screen reader live announcer is present', () => {
  assert.ok(
    html.includes('id="live-calculator-announcer"'),
    'Live calculation announcer must exist in HTML'
  );
  assert.ok(
    html.includes('aria-live="polite"'),
    'Live announcer must have aria-live="polite"'
  );
});

test('Phase 5: All decorative SVGs have aria-hidden="true" or appropriate label', () => {
  const svgRegex = /<svg[^>]*>/g;
  let match;
  let unlabelledCount = 0;
  while ((match = svgRegex.exec(html)) !== null) {
    const tag = match[0];
    const isAccessible = tag.includes('aria-hidden=') || tag.includes('aria-label=') || tag.includes('aria-labelledby=') || tag.includes('role=');
    if (!isAccessible) {
      unlabelledCount++;
    }
  }
  assert.equal(unlabelledCount, 0, `All SVGs must be accessible or hidden, found ${unlabelledCount} unlabelled`);
});
