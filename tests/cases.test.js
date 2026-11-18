const test = require('node:test');
const assert = require('node:assert/strict');
const NisabModule = require('../nisab.js');

const prices = {
  goldPricePerGram: 35322.36,
  silverPricePerGram: 432.80
};

test('Case (a): Rs 100,000 savings -> below silver nisab, no zakat', () => {
  const wizardData = {
    nisabStandard: 'silver',
    hawlConfirmed: true,
    cashInHand: 100000
  };
  const totals = NisabModule.calculateWizardTotals(wizardData, prices);
  assert.equal(totals.netWealth, 100000);
  assert.equal(totals.zakatResult.meetsNisab, false);
  assert.equal(totals.zakatResult.zakatDue, 0);

  const headline = NisabModule.formatZakatHeadline({
    meetsNisab: totals.zakatResult.meetsNisab,
    hawlConfirmed: totals.zakatResult.hawlConfirmed,
    zakatDue: totals.zakatResult.zakatDue,
    symbol: 'Rs',
    language: 'en'
  });
  assert.equal(headline, 'No zakat is due this year because your wealth is below the nisab.');
});

test('Case (b): Rs 800,000 savings -> zakat Rs 20,000', () => {
  const wizardData = {
    nisabStandard: 'silver',
    hawlConfirmed: true,
    bankAccounts: 800000
  };
  const totals = NisabModule.calculateWizardTotals(wizardData, prices);
  assert.equal(totals.netWealth, 800000);
  assert.equal(totals.zakatResult.meetsNisab, true);
  assert.equal(totals.zakatResult.zakatDue, 20000);

  const headline = NisabModule.formatZakatHeadline({
    meetsNisab: totals.zakatResult.meetsNisab,
    hawlConfirmed: totals.zakatResult.hawlConfirmed,
    zakatDue: totals.zakatResult.zakatDue,
    symbol: 'Rs',
    language: 'en'
  });
  assert.equal(headline, 'Zakat is due: Rs 20,000.00');
});

test('Case (c): 10 tola of 22K gold plus Rs 50,000 cash', () => {
  const wizardData = {
    nisabStandard: 'silver',
    hawlConfirmed: true,
    cashInHand: 50000,
    goldWeight: 10,
    goldUnit: 'tola',
    goldCarat: 22
  };
  const totals = NisabModule.calculateWizardTotals(wizardData, prices);
  const gold = totals.breakdown.preciousMetals.gold;
  
  // 10 tola = 116.64 g. 22K pure eq = 106.92 g
  assert.equal(Math.round(gold.weightGrams * 100) / 100, 116.64);
  assert.equal(Math.round(gold.pureGoldGrams * 100) / 100, 106.92);
  
  // 106.92 * 35322.36 = 3,776,666.73
  assert.ok(Math.abs(gold.total - 3776666.73) < 1.0);
  // Net wealth = 3,776,666.73 + 50,000 = 3,826,666.73
  assert.ok(Math.abs(totals.netWealth - 3826666.73) < 1.0);
  // Zakat = 2.5% of 3,826,666.73 = 95,666.67
  assert.ok(Math.abs(totals.zakatResult.zakatDue - 95666.67) < 1.0);
});

test('Case (d): Assets with debts that reduce wealth below nisab', () => {
  const wizardData = {
    nisabStandard: 'silver',
    hawlConfirmed: true,
    bankAccounts: 350000,
    debtsDueNow: 100000
  };
  const totals = NisabModule.calculateWizardTotals(wizardData, prices);
  assert.equal(totals.totalAssets, 350000);
  assert.equal(totals.totalLiabilities, 100000);
  assert.equal(totals.netWealth, 250000);
  // 250,000 < 265,029.41 -> below Nisab
  assert.equal(totals.zakatResult.meetsNisab, false);
  assert.equal(totals.zakatResult.zakatDue, 0);

  const headline = NisabModule.formatZakatHeadline({
    meetsNisab: totals.zakatResult.meetsNisab,
    hawlConfirmed: totals.zakatResult.hawlConfirmed,
    zakatDue: totals.zakatResult.zakatDue,
    symbol: 'Rs',
    language: 'en'
  });
  assert.equal(headline, 'No zakat is due this year because your wealth is below the nisab.');
});

test('Case (e): The Al-Hawl answer "No"', () => {
  const wizardData = {
    nisabStandard: 'silver',
    hawlConfirmed: false,
    bankAccounts: 800000
  };
  const totals = NisabModule.calculateWizardTotals(wizardData, prices);
  assert.equal(totals.netWealth, 800000);
  assert.equal(totals.zakatResult.meetsNisab, true);
  assert.equal(totals.zakatResult.hawlConfirmed, false);
  assert.equal(totals.zakatResult.isEligible, false);
  assert.equal(totals.zakatResult.zakatDue, 0);

  const headline = NisabModule.formatZakatHeadline({
    meetsNisab: totals.zakatResult.meetsNisab,
    hawlConfirmed: totals.zakatResult.hawlConfirmed,
    zakatDue: totals.zakatResult.zakatDue,
    symbol: 'Rs',
    language: 'en'
  });
  assert.equal(headline, 'No zakat is due this year because you have not owned this wealth for a full Islamic year.');
});
