const NisabModule = require('../nisab.js');

const prices = {
  goldPricePerGram: 35322.36,
  silverPricePerGram: 432.80
};

console.log('========================================================================');
console.log('         PHASE 6: EXACT VERIFICATION OF THE 5 NUMERICAL CASES');
console.log('========================================================================\n');

// Case (a): Rs 100,000 savings
{
  const wizardData = {
    nisabStandard: 'silver',
    hawlConfirmed: true,
    cashInHand: 100000,
    bankAccounts: 0,
    otherSavings: 0,
    moneyOwedToMe: 0
  };

  const totals = NisabModule.calculateWizardTotals(wizardData, prices);
  const headline = NisabModule.formatZakatHeadline({
    meetsNisab: totals.zakatResult.meetsNisab,
    hawlConfirmed: totals.zakatResult.hawlConfirmed,
    zakatDue: totals.zakatResult.zakatDue,
    symbol: 'Rs',
    language: 'en'
  });
  const story = NisabModule.formatZakatStory({
    grossAssets: totals.totalAssets,
    netWealth: totals.netWealth,
    nisabThreshold: totals.nisabThreshold,
    zakatDue: totals.zakatResult.zakatDue,
    symbol: 'Rs',
    language: 'en'
  });

  console.log('CASE (a): Rs 100,000 savings');
  console.log('--------------------------------------------------');
  console.log('• Total Assets:      Rs ' + totals.totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 }));
  console.log('• Total Liabilities: Rs ' + totals.totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2 }));
  console.log('• Net Wealth:        Rs ' + totals.netWealth.toLocaleString('en-US', { minimumFractionDigits: 2 }));
  console.log('• Silver Nisab:      Rs ' + totals.nisabThreshold.toLocaleString('en-US', { minimumFractionDigits: 2 }) + ' (612.36g × Rs 432.80/g)');
  console.log('• Meets Nisab:       ' + totals.zakatResult.meetsNisab + ' (Shortfall: Rs ' + totals.zakatResult.shortfall.toLocaleString('en-US', { minimumFractionDigits: 2 }) + ')');
  console.log('• Zakat Due:         Rs ' + totals.zakatResult.zakatDue.toFixed(2));
  console.log('• Headline:          "' + headline + '"');
  console.log('• Short Story:       "' + story + '"\n');
}

// Case (b): Rs 800,000 savings
{
  const wizardData = {
    nisabStandard: 'silver',
    hawlConfirmed: true,
    cashInHand: 0,
    bankAccounts: 800000,
    otherSavings: 0,
    moneyOwedToMe: 0
  };

  const totals = NisabModule.calculateWizardTotals(wizardData, prices);
  const headline = NisabModule.formatZakatHeadline({
    meetsNisab: totals.zakatResult.meetsNisab,
    hawlConfirmed: totals.zakatResult.hawlConfirmed,
    zakatDue: totals.zakatResult.zakatDue,
    symbol: 'Rs',
    language: 'en'
  });
  const story = NisabModule.formatZakatStory({
    grossAssets: totals.totalAssets,
    netWealth: totals.netWealth,
    nisabThreshold: totals.nisabThreshold,
    zakatDue: totals.zakatResult.zakatDue,
    symbol: 'Rs',
    language: 'en'
  });

  console.log('CASE (b): Rs 800,000 savings');
  console.log('--------------------------------------------------');
  console.log('• Total Assets:      Rs ' + totals.totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 }));
  console.log('• Total Liabilities: Rs ' + totals.totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2 }));
  console.log('• Net Wealth:        Rs ' + totals.netWealth.toLocaleString('en-US', { minimumFractionDigits: 2 }));
  console.log('• Silver Nisab:      Rs ' + totals.nisabThreshold.toLocaleString('en-US', { minimumFractionDigits: 2 }));
  console.log('• Meets Nisab:       ' + totals.zakatResult.meetsNisab + ' (Excess: Rs ' + totals.zakatResult.excessOverNisab.toLocaleString('en-US', { minimumFractionDigits: 2 }) + ')');
  console.log('• Zakat Due (2.5%):  Rs ' + totals.zakatResult.zakatDue.toLocaleString('en-US', { minimumFractionDigits: 2 }));
  console.log('• Headline:          "' + headline + '"');
  console.log('• Short Story:       "' + story + '"\n');
}

// Case (c): 10 tola of 22K gold plus Rs 50,000 cash
{
  const wizardData = {
    nisabStandard: 'silver',
    hawlConfirmed: true,
    cashInHand: 50000,
    goldWeight: 10,
    goldUnit: 'tola',
    goldCarat: 22
  };

  const totals = NisabModule.calculateWizardTotals(wizardData, prices);
  const headline = NisabModule.formatZakatHeadline({
    meetsNisab: totals.zakatResult.meetsNisab,
    hawlConfirmed: totals.zakatResult.hawlConfirmed,
    zakatDue: totals.zakatResult.zakatDue,
    symbol: 'Rs',
    language: 'en'
  });
  const story = NisabModule.formatZakatStory({
    grossAssets: totals.totalAssets,
    netWealth: totals.netWealth,
    nisabThreshold: totals.nisabThreshold,
    zakatDue: totals.zakatResult.zakatDue,
    symbol: 'Rs',
    language: 'en'
  });

  const goldDetails = totals.breakdown.preciousMetals.gold;
  console.log('CASE (c): 10 tola of 22K gold plus Rs 50,000 cash');
  console.log('--------------------------------------------------');
  console.log('• 10 Tola weight in grams: ' + goldDetails.weightGrams.toFixed(2) + ' g (10 × 11.664 g)');
  console.log('• 22K Purity Factor:       22/24 = ' + (22/24).toFixed(4));
  console.log('• Pure 24K Gold eq.:       ' + goldDetails.pureGoldGrams.toFixed(2) + ' g (or ' + (goldDetails.pureGoldGrams / 11.664).toFixed(4) + ' tola)');
  console.log('• Gold Market Value:       Rs ' + goldDetails.total.toLocaleString('en-US', { minimumFractionDigits: 2 }) + ' (' + goldDetails.pureGoldGrams.toFixed(2) + 'g × Rs 35,322.36/g)');
  console.log('• Cash Assets:             Rs ' + totals.breakdown.cash.total.toLocaleString('en-US', { minimumFractionDigits: 2 }));
  console.log('• Total Zakatable Assets:  Rs ' + totals.totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 }));
  console.log('• Silver Nisab:            Rs ' + totals.nisabThreshold.toLocaleString('en-US', { minimumFractionDigits: 2 }));
  console.log('• Meets Nisab:             ' + totals.zakatResult.meetsNisab);
  console.log('• Zakat Due (2.5%):        Rs ' + totals.zakatResult.zakatDue.toLocaleString('en-US', { minimumFractionDigits: 2 }));
  console.log('• Headline:                "' + headline + '"');
  console.log('• Short Story:             "' + story + '"\n');
}

// Case (d): assets with debts that reduce wealth below nisab
{
  const wizardData = {
    nisabStandard: 'silver',
    hawlConfirmed: true,
    cashInHand: 0,
    bankAccounts: 350000,
    debtsDueNow: 100000
  };

  const totals = NisabModule.calculateWizardTotals(wizardData, prices);
  const headline = NisabModule.formatZakatHeadline({
    meetsNisab: totals.zakatResult.meetsNisab,
    hawlConfirmed: totals.zakatResult.hawlConfirmed,
    zakatDue: totals.zakatResult.zakatDue,
    symbol: 'Rs',
    language: 'en'
  });
  const story = NisabModule.formatZakatStory({
    grossAssets: totals.totalAssets,
    netWealth: totals.netWealth,
    nisabThreshold: totals.nisabThreshold,
    zakatDue: totals.zakatResult.zakatDue,
    symbol: 'Rs',
    language: 'en'
  });

  console.log('CASE (d): Assets (Rs 350,000) with Debts (Rs 100,000) reducing wealth below Nisab');
  console.log('--------------------------------------------------');
  console.log('• Gross Assets:            Rs ' + totals.totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 }));
  console.log('• Deductible Liabilities:  Rs ' + totals.totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2 }));
  console.log('• Net Zakatable Wealth:    Rs ' + totals.netWealth.toLocaleString('en-US', { minimumFractionDigits: 2 }) + ' (Rs 350,000 - Rs 100,000)');
  console.log('• Silver Nisab Threshold:  Rs ' + totals.nisabThreshold.toLocaleString('en-US', { minimumFractionDigits: 2 }));
  console.log('• Meets Nisab:             ' + totals.zakatResult.meetsNisab + ' (Shortfall: Rs ' + totals.zakatResult.shortfall.toLocaleString('en-US', { minimumFractionDigits: 2 }) + ')');
  console.log('• Zakat Due:               Rs ' + totals.zakatResult.zakatDue.toFixed(2));
  console.log('• Headline:                "' + headline + '"');
  console.log('• Short Story:             "' + story + '"\n');
}

// Case (e): the Al-Hawl answer "No"
{
  const wizardData = {
    nisabStandard: 'silver',
    hawlConfirmed: false, // User answered "No"
    cashInHand: 0,
    bankAccounts: 800000
  };

  const totals = NisabModule.calculateWizardTotals(wizardData, prices);
  const headline = NisabModule.formatZakatHeadline({
    meetsNisab: totals.zakatResult.meetsNisab,
    hawlConfirmed: totals.zakatResult.hawlConfirmed,
    zakatDue: totals.zakatResult.zakatDue,
    symbol: 'Rs',
    language: 'en'
  });
  const story = NisabModule.formatZakatStory({
    grossAssets: totals.totalAssets,
    netWealth: totals.netWealth,
    nisabThreshold: totals.nisabThreshold,
    zakatDue: totals.zakatResult.zakatDue,
    symbol: 'Rs',
    language: 'en'
  });

  console.log('CASE (e): The Al-Hawl answer "No" (Wealth Rs 800,000, 1 lunar year not completed)');
  console.log('--------------------------------------------------');
  console.log('• Net Wealth:              Rs ' + totals.netWealth.toLocaleString('en-US', { minimumFractionDigits: 2 }));
  console.log('• Silver Nisab Threshold:  Rs ' + totals.nisabThreshold.toLocaleString('en-US', { minimumFractionDigits: 2 }));
  console.log('• Meets Nisab:             ' + totals.zakatResult.meetsNisab);
  console.log('• Hawl Confirmed:          ' + totals.zakatResult.hawlConfirmed);
  console.log('• Is Eligible for Zakat:   ' + totals.zakatResult.isEligible);
  console.log('• Zakat Due:               Rs ' + totals.zakatResult.zakatDue.toFixed(2));
  console.log('• Headline:                "' + headline + '"');
  console.log('• Short Story:             "' + story + '"');
  console.log('========================================================================\n');
}
