const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load TRANSLATIONS and speech helpers from app.js
const appJsPath = path.join(__dirname, '..', 'app.js');
const appContent = fs.readFileSync(appJsPath, 'utf8');

// Sandbox extraction
const translationsMatch = appContent.match(/const TRANSLATIONS = (\{[\s\S]*?\n\};)/);
if (!translationsMatch) {
  throw new Error('Unable to extract TRANSLATIONS from app.js');
}

const sandbox = {
  window: {},
  document: {
    documentElement: { classList: { add() {}, remove() {} } },
    querySelectorAll() { return []; },
    getElementById() { return null; }
  },
  console: console,
  CURRENCIES: {
    PKR: { symbol: 'Rs', name: 'Pakistani Rupee', gold: 35322.0, silver: 432.8, locale: 'ur-PK' }
  },
  STATE: {
    language: 'ur',
    currency: 'PKR',
    nisabStandard: 'silver',
    goldPrice: 35322.0,
    silverPrice: 432.8,
    wizard: {
      cashInHand: '500000',
      bankAccounts: '300000',
      otherSavings: '',
      moneyOwedToMe: '',
      goldWeight: '',
      goldUnit: 'tola',
      goldCarat: '24',
      silverWeight: '',
      silverUnit: 'tola',
      shopStock: '',
      businessCash: '',
      sharesMutualFunds: '',
      propertyForSale: '',
      debtsDueNow: '',
      unpaidBills: '',
      installmentsThisYear: '',
      hawlAnswer: 'yes'
    }
  },
  NisabModule: require('../nisab.js')
};

const speechFnStart = appContent.indexOf('function getStepSpeechContent');
const speechFnEnd = appContent.indexOf('window.readStepAloud = function');
const speechFnCode = appContent.slice(speechFnStart, speechFnEnd);

vm.runInNewContext('TRANSLATIONS = ' + translationsMatch[1] + ';\n' + speechFnCode, sandbox);

test('Phase 4: Full translation parity across Urdu, English, and Arabic', () => {
  const T = sandbox.TRANSLATIONS;
  const urKeys = Object.keys(T.ur).sort();
  const enKeys = Object.keys(T.en).sort();
  const arKeys = Object.keys(T.ar).sort();

  assert.strictEqual(urKeys.length > 180, true, 'Urdu translation dictionary should be comprehensive');
  assert.deepStrictEqual(urKeys, enKeys, 'Every key in Urdu must exist in English');
  assert.deepStrictEqual(urKeys, arKeys, 'Every key in Urdu must exist in Arabic');
});

test('Phase 4: HTML data-i18n keys are 100% covered in all languages without untranslated strings', () => {
  const htmlPath = path.join(__dirname, '..', 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const regex = /data-i18n=['"]([^'"]+)['"]/g;
  let m;
  const usedKeys = new Set();
  while ((m = regex.exec(htmlContent)) !== null) {
    usedKeys.add(m[1]);
  }

  const T = sandbox.TRANSLATIONS;
  for (const key of usedKeys) {
    assert.ok(T.ur[key], `Missing key in Urdu: ${key}`);
    assert.ok(T.en[key], `Missing key in English: ${key}`);
    assert.ok(T.ar[key], `Missing key in Arabic: ${key}`);
  }
});

test('Phase 4: RTL and LTR directional arrow semantics', () => {
  const T = sandbox.TRANSLATIONS;

  // Urdu & Arabic (RTL): Next points Left (←), Back points Right (→)
  assert.ok(T.ur.btn_back.includes('→'), 'Urdu Back button must point Right in RTL');
  assert.ok(T.ur.btn_next_gold.includes('←'), 'Urdu Next button must point Left in RTL');
  assert.ok(T.ar.btn_back.includes('→'), 'Arabic Back button must point Right in RTL');
  assert.ok(T.ar.btn_next_gold.includes('←'), 'Arabic Next button must point Left in RTL');

  // English (LTR): Next points Right (→), Back points Left (←)
  assert.ok(T.en.btn_back.includes('←'), 'English Back button must point Left in LTR');
  assert.ok(T.en.btn_next_gold.includes('→'), 'English Next button must point Right in LTR');
});

test('Phase 4: Read-aloud speech content generation for all 6 steps', () => {
  const getSpeech = sandbox.getStepSpeechContent;

  // Step 1 Welcome speech in 3 languages
  assert.ok(getSpeech(1, 'ur').includes('خوش آمدید'));
  assert.ok(getSpeech(1, 'en').includes('Welcome'));
  assert.ok(getSpeech(1, 'ar').includes('مرحبًا'));

  // Step 2 Cash speech
  assert.ok(getSpeech(2, 'ur').includes('نقد رقم'));
  assert.ok(getSpeech(2, 'en').includes('Cash'));
  assert.ok(getSpeech(2, 'ar').includes('النقد'));

  // Step 4 Business speech confirms residential home and car are exempt
  assert.ok(getSpeech(4, 'ur').includes('ذاتی رہائشی مکان'));
  assert.ok(getSpeech(4, 'en').includes('personal residence'));
  assert.ok(getSpeech(4, 'ar').includes('بيتك الشخصي'));

  // Step 6 Dynamic calculations speech
  sandbox.STATE.wizard.hawlAnswer = 'yes';
  const speechStep6Eligible = getSpeech(6, 'ur');
  assert.ok(speechStep6Eligible.includes('زکوٰۃ فرض ہے'), 'Should announce Zakat is due when eligible');
  assert.ok(speechStep6Eligible.includes('20000') || speechStep6Eligible.includes('Rs'), 'Should include dynamic amounts');

  // Step 6 Below Nisab speech
  sandbox.STATE.wizard.cashInHand = '50000'; // Below silver nisab
  sandbox.STATE.wizard.bankAccounts = '';
  const speechStep6Below = getSpeech(6, 'ur');
  assert.ok(speechStep6Below.includes('زکوٰۃ واجب نہیں ہے'), 'Should announce wealth is below nisab');

  // Step 6 Hawl 'no' speech
  sandbox.STATE.wizard.cashInHand = '1000000';
  sandbox.STATE.wizard.hawlAnswer = 'no';
  const speechStep6HawlNo = getSpeech(6, 'ur');
  assert.ok(speechStep6HawlNo.includes('مکمل ایک اسلامی قمری سال نہیں گزرا'), 'Should explain Al-Hawl requirement');
});
