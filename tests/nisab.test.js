const test = require('node:test');
const assert = require('node:assert/strict');
const Nisab = require('../nisab.js');

test('Tola to Gram and Gram to Tola conversions', () => {
  assert.equal(Nisab.CONSTANTS.TOLA_TO_GRAMS, 11.664, '1 tola must be 11.664 grams');

  // 1 tola -> 11.664 grams
  assert.equal(Nisab.tolaToGrams(1), 11.664);

  // 10 tolas -> 116.64 grams
  assert.equal(Nisab.tolaToGrams(10), 116.64);

  // 52.5 tolas (Silver Nisab weight) -> 612.36 grams
  assert.equal(Nisab.tolaToGrams(52.5), 612.36);

  // 7.5 tolas (Gold Nisab weight) -> 87.48 grams
  assert.equal(Nisab.tolaToGrams(7.5), 87.48);

  // Reverse conversion
  assert.equal(Nisab.gramsToTola(11.664), 1);
  assert.equal(Nisab.gramsToTola(612.36), 52.5);
  assert.equal(Nisab.gramsToTola(87.48), 7.5);
});

test('Nisab constants and threshold values for both standards', () => {
  // Silver Nisab
  assert.equal(Nisab.CONSTANTS.SILVER_NISAB_TOLA, 52.5);
  assert.equal(Nisab.CONSTANTS.SILVER_NISAB_GRAMS, 612.36);

  // Gold Nisab
  assert.equal(Nisab.CONSTANTS.GOLD_NISAB_TOLA, 7.5);
  assert.equal(Nisab.CONSTANTS.GOLD_NISAB_GRAMS, 87.48);

  // Zakat rate
  assert.equal(Nisab.CONSTANTS.ZAKAT_RATE, 0.025);

  // Silver threshold calculation with fallback price (Rs 432.8 / g)
  const silverThreshold = Nisab.calculateNisabThreshold({
    standard: 'silver',
    silverPricePerGram: 432.8,
    goldPricePerGram: 35322.0
  });
  // 612.36 * 432.8 = 265,029.408
  assert.equal(silverThreshold, 612.36 * 432.8);

  // Gold threshold calculation with fallback price (Rs 35,322 / g)
  const goldThreshold = Nisab.calculateNisabThreshold({
    standard: 'gold',
    silverPricePerGram: 432.8,
    goldPricePerGram: 35322.0
  });
  // 87.48 * 35322 = 3,089,968.56
  assert.equal(goldThreshold, 87.48 * 35322.0);

  // Verify silver threshold is substantially lower than gold threshold
  assert.ok(silverThreshold < goldThreshold, 'Silver threshold must be lower than gold threshold');
});

test('2.5% Zakat calculation when wealth exceeds Nisab and Hawl is satisfied', () => {
  const silverThreshold = 612.36 * 432.8; // ~Rs 265,029.41

  // Case (b) from specification: Rs 800,000 savings -> zakat Rs 20,000
  const result = Nisab.calculateZakat({
    netWealth: 800000,
    nisabThreshold: silverThreshold,
    hawlConfirmed: true
  });

  assert.equal(result.isEligible, true);
  assert.equal(result.isBelowNisab, false);
  assert.equal(result.zakatRate, 0.025);
  assert.equal(result.zakatDue, 20000); // 800,000 * 0.025 = 20,000
  assert.ok(result.excessOverNisab > 0);
});

test('Below-Nisab case: no zakat due when wealth is below threshold', () => {
  const silverThreshold = 612.36 * 432.8; // ~Rs 265,029.41

  // Case (a) from specification: Rs 100,000 savings -> below silver nisab, no zakat
  const result = Nisab.calculateZakat({
    netWealth: 100000,
    nisabThreshold: silverThreshold,
    hawlConfirmed: true
  });

  assert.equal(result.isEligible, false);
  assert.equal(result.isBelowNisab, true);
  assert.equal(result.zakatDue, 0);
  assert.ok(result.shortfall > 0);
});

test('Al-Hawl unconfirmed: wealth exceeds Nisab but 1 lunar year not completed', () => {
  const silverThreshold = 612.36 * 432.8;

  // Case (e) from specification: Hawl answer "No"
  const result = Nisab.calculateZakat({
    netWealth: 800000,
    nisabThreshold: silverThreshold,
    hawlConfirmed: false
  });

  assert.equal(result.meetsNisab, true);
  assert.equal(result.hawlConfirmed, false);
  assert.equal(result.isEligible, false);
  assert.equal(result.zakatDue, 0, 'No zakat due if Hawl is not completed');
});

test('Gold purity conversions (24K, 22K, 21K, 18K)', () => {
  // 10 tolas of 22K gold
  // 10 tolas = 116.64 grams
  // 22K purity = 22/24 = 0.9166667
  // Pure gold equivalent grams = 116.64 * (22/24) = 106.92 grams
  const grams10Tola = Nisab.tolaToGrams(10);
  const pureGrams22K = Nisab.toPureGoldGrams(grams10Tola, 22);
  assert.equal(Math.round(pureGrams22K * 100) / 100, 106.92);

  // 24K gold is 100% pure
  assert.equal(Nisab.toPureGoldGrams(100, 24), 100);

  // 18K gold is 75% pure (18/24)
  assert.equal(Nisab.toPureGoldGrams(100, 18), 75);
});

test('Localized number parser handles Urdu and Arabic digits with formatting', () => {
  // Standard English with commas
  assert.equal(Nisab.parseLocalizedNumber('800,000'), 800000);
  assert.equal(Nisab.parseLocalizedNumber('Rs 35,322.50'), 35322.5);

  // Urdu / Persian digits: ۸۰۰۰۰۰ = 800000
  assert.equal(Nisab.parseLocalizedNumber('۸۰۰,۰۰۰'), 800000);
  assert.equal(Nisab.parseLocalizedNumber('۴۱۲۰۰۰'), 412000);

  // Arabic-Indic digits: ٨٠٠٠٠٠ = 800000
  assert.equal(Nisab.parseLocalizedNumber('٨٠٠,٠٠٠'), 800000);
  assert.equal(Nisab.parseLocalizedNumber('٦١٢.٣٦'), 612.36);

  // Empty or invalid strings
  assert.equal(Nisab.parseLocalizedNumber(''), 0);
  assert.equal(Nisab.parseLocalizedNumber(null), 0);
});

test('Wizard totals calculation - Case (c): 10 tola 22K gold + Rs 50,000 cash', () => {
  const prices = {
    goldPricePerGram: 35322.0,
    silverPricePerGram: 432.8
  };

  const wizardData = {
    nisabStandard: 'silver',
    cashInHand: '50,000',
    goldWeight: '10',
    goldUnit: 'tola',
    goldCarat: 22,
    hawlConfirmed: true
  };

  const res = Nisab.calculateWizardTotals(wizardData, prices);

  // 10 tolas of 22K gold = 116.64 * (22/24) = 106.92g pure gold
  // 106.92g * 35,322 = Rs 3,776,628.24
  assert.equal(res.breakdown.preciousMetals.gold.pureGoldGrams, 106.92);
  assert.equal(res.breakdown.preciousMetals.gold.total, 3776628.24);

  // Total cash = 50,000
  assert.equal(res.breakdown.cash.total, 50000);

  // Total assets = 3,776,628.24 + 50,000 = 3,826,628.24
  assert.equal(res.totalAssets, 3826628.24);
  assert.equal(res.netWealth, 3826628.24);

  // Nisab threshold (Silver @ 432.8) = 265,029.41
  assert.equal(res.zakatResult.isEligible, true);
  // Zakat @ 2.5% = 3,826,628.24 * 0.025 = 95,665.71
  assert.equal(res.zakatResult.zakatDue, 95665.71);
});

test('Wizard totals calculation - Case (d): assets with debts reducing wealth below Nisab', () => {
  const prices = {
    goldPricePerGram: 35322.0,
    silverPricePerGram: 432.8
  };

  // Silver threshold = 612.36 * 432.8 = Rs 265,029.41
  // Assets: Rs 300,000 (initially above Nisab)
  // Debts due now: Rs 100,000
  // Net wealth = Rs 200,000 (drops below Nisab threshold!)
  const wizardData = {
    nisabStandard: 'silver',
    bankAccounts: '300,000',
    debtsDueNow: '100,000',
    hawlConfirmed: true
  };

  const res = Nisab.calculateWizardTotals(wizardData, prices);

  assert.equal(res.totalAssets, 300000);
  assert.equal(res.totalLiabilities, 100000);
  assert.equal(res.netWealth, 200000);
  assert.equal(res.zakatResult.isBelowNisab, true);
  assert.equal(res.zakatResult.isEligible, false);
  assert.equal(res.zakatResult.zakatDue, 0, 'No zakat due when net wealth after deductible debts is below Nisab');
});

test('Canonical Headline formatting: "Zakat is due: Rs X" and below-Nisab notice', () => {
  // Case 1: Below Nisab
  const belowNisabEn = Nisab.formatZakatHeadline({
    meetsNisab: false,
    hawlConfirmed: true,
    zakatDue: 0,
    symbol: 'Rs',
    language: 'en'
  });
  assert.equal(belowNisabEn, 'No zakat is due this year because your wealth is below the nisab.');

  // Case 2: Zakat is due
  const zakatDueEn = Nisab.formatZakatHeadline({
    meetsNisab: true,
    hawlConfirmed: true,
    zakatDue: 20000,
    symbol: 'Rs',
    language: 'en'
  });
  assert.equal(zakatDueEn, 'Zakat is due: Rs 20,000.00');

  // Case 3: Hawl not confirmed
  const hawlNoEn = Nisab.formatZakatHeadline({
    meetsNisab: true,
    hawlConfirmed: false,
    zakatDue: 0,
    symbol: 'Rs',
    language: 'en'
  });
  assert.equal(hawlNoEn, 'No zakat is due this year because you have not owned this wealth for a full Islamic year.');
});

test('Canonical Short Story formatting: "You have Rs A. The nisab is Rs B. Your zakat is 2.5% of Rs C = Rs D."', () => {
  const storyEn = Nisab.formatZakatStory({
    grossAssets: 800000,
    netWealth: 800000,
    nisabThreshold: 265029.41,
    zakatDue: 20000,
    symbol: 'Rs',
    language: 'en'
  });

  assert.equal(storyEn, 'You have Rs 800,000.00. The nisab is Rs 265,029.41. Your zakat is 2.5% of Rs 800,000.00 = Rs 20,000.00.');

  const storyUr = Nisab.formatZakatStory({
    grossAssets: 800000,
    netWealth: 800000,
    nisabThreshold: 265029.41,
    zakatDue: 20000,
    symbol: 'Rs',
    language: 'ur'
  });
  assert.ok(storyUr.includes('آپ کے پاس Rs 800,000.00 ہیں'));
  assert.ok(storyUr.includes('حدِ نصاب Rs 265,029.41 ہے'));
  assert.ok(storyUr.includes('Rs 20,000.00'));
});
