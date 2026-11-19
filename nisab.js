/**
 * ZakatFlow - Shared Nisab and Zakat Calculation Module
 * Single Source of Truth for Zakat thresholds, conversions, and calculations.
 * Compatible with Node.js (CommonJS / ES Module) and modern browsers.
 */

(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else {
    root.Nisab = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Core Canonical Constants (Strict Scholarly Standards)
  const TOLA_TO_GRAMS = 11.664; // 1 tola = 11.664 grams exactly
  const SILVER_NISAB_TOLA = 52.5; // 52.5 tolas of silver
  const SILVER_NISAB_GRAMS = 612.36; // 52.5 * 11.664 = 612.36 grams
  const GOLD_NISAB_TOLA = 7.5; // 7.5 tolas of gold
  const GOLD_NISAB_GRAMS = 87.48; // 7.5 * 11.664 = 87.48 grams
  const ZAKAT_RATE = 0.025; // 2.5% (1/40th of net qualifying wealth)

  // Seed Fallback Prices (Editable, benchmarked as of 18 Nov 2026 for Pakistan market)
  // Silver: about Rs 5,048 per tola (Rs 432.8 per gram)
  // 24K Gold: about Rs 412,000 per tola (Rs 35,322 per gram)
  const FALLBACK_PRICES = {
    PKR: {
      currency: 'PKR',
      symbol: 'Rs',
      name: 'Pakistani Rupee',
      goldPricePerGram: 35322.0,
      goldPricePerTola: 412000.0,
      silverPricePerGram: 432.8,
      silverPricePerTola: 5048.0,
      asOfDate: '18 Nov 2026'
    },
    USD: {
      currency: 'USD',
      symbol: '$',
      name: 'US Dollar',
      goldPricePerGram: 120.0,
      goldPricePerTola: 1399.68,
      silverPricePerGram: 1.44,
      silverPricePerTola: 16.79,
      asOfDate: '18 Nov 2026'
    },
    SAR: {
      currency: 'SAR',
      symbol: 'SR',
      name: 'Saudi Riyal',
      goldPricePerGram: 450.0,
      goldPricePerTola: 5248.8,
      silverPricePerGram: 5.4,
      silverPricePerTola: 62.99,
      asOfDate: '18 Nov 2026'
    },
    AED: {
      currency: 'AED',
      symbol: 'AED',
      name: 'UAE Dirham',
      goldPricePerGram: 440.0,
      goldPricePerTola: 5132.16,
      silverPricePerGram: 5.28,
      silverPricePerTola: 61.59,
      asOfDate: '18 Nov 2026'
    },
    GBP: {
      currency: 'GBP',
      symbol: '£',
      name: 'British Pound',
      goldPricePerGram: 94.0,
      goldPricePerTola: 1096.42,
      silverPricePerGram: 1.13,
      silverPricePerTola: 13.18,
      asOfDate: '18 Nov 2026'
    }
  };

  /**
   * Convert tola weight to grams
   * @param {number} tolas
   * @returns {number} grams
   */
  function tolaToGrams(tolas) {
    const val = Number(tolas) || 0;
    return Math.round(val * TOLA_TO_GRAMS * 10000) / 10000;
  }

  /**
   * Convert gram weight to tolas
   * @param {number} grams
   * @returns {number} tolas
   */
  function gramsToTola(grams) {
    const val = Number(grams) || 0;
    return Math.round((val / TOLA_TO_GRAMS) * 10000) / 10000;
  }

  /**
   * Carat purity factor relative to pure 24K gold
   * @param {number|string} carat (24, 22, 21, 18)
   * @returns {number} purity fraction (e.g. 22/24 = 0.9167)
   */
  function goldPurityFactor(carat) {
    const c = parseInt(carat, 10);
    switch (c) {
      case 24: return 1.0;
      case 22: return 22 / 24; // 0.916666...
      case 21: return 21 / 24; // 0.875
      case 18: return 18 / 24; // 0.75
      default: return 1.0;
    }
  }

  /**
   * Converts gold weight of given carat to pure 24K equivalent grams
   * @param {number} weightInGrams
   * @param {number|string} carat
   * @returns {number}
   */
  function toPureGoldGrams(weightInGrams, carat = 24) {
    const w = Number(weightInGrams) || 0;
    return w * goldPurityFactor(carat);
  }

  /**
   * Calculates Nisab monetary threshold in active currency
   * Default is Silver standard (612.36g), Hanafi Pakistan consensus.
   * @param {Object} params
   * @param {'silver'|'gold'} [params.standard='silver']
   * @param {number} params.silverPricePerGram
   * @param {number} params.goldPricePerGram
   * @returns {number} Threshold value
   */
  function calculateNisabThreshold({ standard = 'silver', silverPricePerGram = 0, goldPricePerGram = 0 }) {
    if (standard === 'gold') {
      return Number(goldPricePerGram || 0) * GOLD_NISAB_GRAMS;
    }
    return Number(silverPricePerGram || 0) * SILVER_NISAB_GRAMS;
  }

  /**
   * Core Zakat calculation based on net wealth, Nisab threshold, and Al-Hawl status.
   * @param {Object} params
   * @param {number} params.netWealth Total Zakatable assets minus deductible short-term liabilities
   * @param {number} params.nisabThreshold Active Nisab monetary value
   * @param {boolean} [params.hawlConfirmed=true] Whether wealth held for 1 lunar year
   * @returns {Object} Detailed calculation results
   */
  function calculateZakat({ netWealth = 0, nisabThreshold = 0, hawlConfirmed = true }) {
    const net = Math.max(0, Number(netWealth) || 0);
    const threshold = Number(nisabThreshold) || 0;
    const meetsNisab = net >= threshold && threshold > 0;
    const isEligible = meetsNisab && Boolean(hawlConfirmed);

    const zakatDue = isEligible ? Math.round(net * ZAKAT_RATE * 100) / 100 : 0;

    return {
      netWealth: net,
      nisabThreshold: threshold,
      meetsNisab,
      isBelowNisab: !meetsNisab,
      hawlConfirmed: Boolean(hawlConfirmed),
      isEligible,
      zakatRate: ZAKAT_RATE,
      zakatDue,
      excessOverNisab: meetsNisab ? net - threshold : 0,
      shortfall: meetsNisab ? 0 : threshold - net
    };
  }

  /**
   * Parse numeric input accepting English digits (0-9), Arabic-Indic digits (٠-٩),
   * Urdu/Persian digits (۰-۹), commas, spaces, and currency symbols.
   * @param {string|number} input
   * @returns {number}
   */
  function parseLocalizedNumber(input) {
    if (typeof input === 'number') return isNaN(input) ? 0 : input;
    if (!input) return 0;

    let str = String(input).trim();
    // Replace Eastern Arabic-Indic digits (٠-٩)
    str = str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
    // Replace Urdu / Persian-Indic digits (۰-۹)
    str = str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
    // Remove all characters except digits, decimal point, and negative sign
    str = str.replace(/[^0-9.-]/g, '');

    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  }

  const TROY_OUNCE_TO_GRAMS = 31.1034768;

  /**
   * Convert various weight units (tolas, grams, ounces) to grams
   * @param {number|string} weight
   * @param {string} unit ('tola', 'gram', 'ounce')
   * @returns {number} weight in grams
   */
  function weightToGrams(weight, unit = 'tola') {
    const w = parseLocalizedNumber(weight);
    const u = String(unit).toLowerCase();
    if (u === 'tola' || u === 'tolas') return Math.round(w * TOLA_TO_GRAMS * 10000) / 10000;
    if (u === 'oz' || u === 'ounce' || u === 'ounces') return Math.round(w * TROY_OUNCE_TO_GRAMS * 10000) / 10000;
    return w; // Default grams
  }

  /**
   * Computes comprehensive totals and Zakat due for the multi-step wizard.
   * Single source of truth for all wizard steps.
   * @param {Object} wizardData
   * @param {Object} prices
   * @returns {Object}
   */
  function calculateWizardTotals(wizardData = {}, prices = {}) {
    const goldPricePerGram = Number(prices.goldPricePerGram) || 0;
    const silverPricePerGram = Number(prices.silverPricePerGram) || 0;
    const standard = wizardData.nisabStandard || 'silver';

    // Step 2: Cash
    const cashInHand = parseLocalizedNumber(wizardData.cashInHand);
    const bankAccounts = parseLocalizedNumber(wizardData.bankAccounts);
    const otherSavings = parseLocalizedNumber(wizardData.otherSavings);
    const moneyOwedToMe = parseLocalizedNumber(wizardData.moneyOwedToMe);
    const totalCash = cashInHand + bankAccounts + otherSavings + moneyOwedToMe;

    // Step 3: Gold and Silver
    const goldWeight = parseLocalizedNumber(wizardData.goldWeight);
    const goldUnit = wizardData.goldUnit || 'tola';
    const goldCarat = parseInt(wizardData.goldCarat, 10) || 24;
    const goldWeightGrams = weightToGrams(goldWeight, goldUnit);
    const pureGoldGrams = toPureGoldGrams(goldWeightGrams, goldCarat);
    const totalGold = Math.round(pureGoldGrams * goldPricePerGram * 100) / 100;

    const silverWeight = parseLocalizedNumber(wizardData.silverWeight);
    const silverUnit = wizardData.silverUnit || 'tola';
    const silverWeightGrams = weightToGrams(silverWeight, silverUnit);
    const totalSilver = Math.round(silverWeightGrams * silverPricePerGram * 100) / 100;
    const totalPreciousMetals = totalGold + totalSilver;

    // Step 4: Business and Investments
    const shopStock = parseLocalizedNumber(wizardData.shopStock);
    const businessCash = parseLocalizedNumber(wizardData.businessCash);
    const sharesFunds = parseLocalizedNumber(wizardData.sharesFunds);
    const propertyForSale = parseLocalizedNumber(wizardData.propertyForSale);
    const totalBusiness = shopStock + businessCash + sharesFunds + propertyForSale;

    // Total Eligible Assets
    const totalAssets = totalCash + totalPreciousMetals + totalBusiness;

    // Step 5: Debts & Money Owed
    const debtsDueNow = parseLocalizedNumber(wizardData.debtsDueNow);
    const unpaidBills = parseLocalizedNumber(wizardData.unpaidBills);
    const installmentsThisYear = parseLocalizedNumber(wizardData.installmentsThisYear);
    const totalLiabilities = debtsDueNow + unpaidBills + installmentsThisYear;

    // Net Zakatable Wealth
    const netWealth = Math.max(0, totalAssets - totalLiabilities);

    // Nisab Threshold
    const nisabThreshold = calculateNisabThreshold({
      standard,
      silverPricePerGram,
      goldPricePerGram
    });

    const hawlConfirmed = wizardData.hawlConfirmed !== false && wizardData.hawlConfirmed !== 'no';

    const zakatResult = calculateZakat({
      netWealth,
      nisabThreshold,
      hawlConfirmed
    });

    return {
      breakdown: {
        cash: { cashInHand, bankAccounts, otherSavings, moneyOwedToMe, total: totalCash },
        preciousMetals: {
          gold: { weight: goldWeight, unit: goldUnit, carat: goldCarat, weightGrams: goldWeightGrams, pureGoldGrams, total: totalGold },
          silver: { weight: silverWeight, unit: silverUnit, weightGrams: silverWeightGrams, total: totalSilver },
          total: totalPreciousMetals
        },
        business: { shopStock, businessCash, sharesFunds, propertyForSale, total: totalBusiness },
        liabilities: { debtsDueNow, unpaidBills, installmentsThisYear, total: totalLiabilities }
      },
      cashTotal: totalCash,
      goldPureGrams: pureGoldGrams,
      goldValue: totalGold,
      silverGrams: silverWeightGrams,
      silverValue: totalSilver,
      metalsTotal: totalPreciousMetals,
      businessTotal: totalBusiness,
      debtsTotal: totalLiabilities,
      grossAssets: totalAssets,
      totalAssets,
      totalLiabilities,
      netWealth,
      nisabThreshold,
      activeStandard: standard,
      zakatResult,
      meetsNisab: zakatResult.meetsNisab,
      zakatDue: zakatResult.zakatDue,
      isEligible: zakatResult.isEligible
    };
  }

  /**
   * Formats a number with thousands separators, localized according to language
   * @param {number} num
   * @param {string} [locale='en-US']
   * @param {number} [decimals=2]
   * @returns {string}
   */
  function formatNumber(num, locale = 'en-US', decimals = 2) {
    const val = Number(num) || 0;
    return val.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  /**
   * Generates the canonical plain headline for Zakat eligibility
   * Guarantees rule compliance:
   * - "Zakat is due: Rs X"
   * - "No zakat is due this year because your wealth is below the nisab."
   */
  function formatZakatHeadline({ meetsNisab, hawlConfirmed = true, zakatDue = 0, symbol = 'Rs', language = 'en' }) {
    const formattedDue = `${symbol} ${formatNumber(zakatDue)}`;
    if (!meetsNisab) {
      if (language === 'ur') return 'اس سال آپ پر زکوٰۃ واجب نہیں ہے کیونکہ آپ کی دولت نصاب کی حد سے کم ہے۔';
      if (language === 'ar') return 'لا تجب عليك الزكاة هذا العام لأن ثروتك أقل من حد النصاب.';
      return 'No zakat is due this year because your wealth is below the nisab.';
    }
    if (!hawlConfirmed) {
      if (language === 'ur') return 'اس سال آپ پر زکوٰۃ واجب نہیں ہے کیونکہ آپ کے پاس یہ مال مکمل ایک اسلامی سال سے موجود نہیں ہے۔';
      if (language === 'ar') return 'لا تجب عليك الزكاة هذا العام لأنه لم يمضِ على مالك عام هجري كامل.';
      return 'No zakat is due this year because you have not owned this wealth for a full Islamic year.';
    }
    if (language === 'ur') return `زکوٰۃ واجب ہے: ${formattedDue}`;
    if (language === 'ar') return `الزكاة الواجبة: ${formattedDue}`;
    return `Zakat is due: ${formattedDue}`;
  }

  /**
   * Generates the canonical plain short story
   * Required template: "You have Rs A. The nisab is Rs B. Your zakat is 2.5% of Rs C = Rs D."
   */
  function formatZakatStory({ grossAssets = 0, netWealth = 0, nisabThreshold = 0, zakatDue = 0, symbol = 'Rs', language = 'en' }) {
    const a = `${symbol} ${formatNumber(grossAssets)}`;
    const b = `${symbol} ${formatNumber(nisabThreshold)}`;
    const c = `${symbol} ${formatNumber(netWealth)}`;
    const d = `${symbol} ${formatNumber(zakatDue)}`;

    if (language === 'ur') {
      return `آپ کے پاس ${a} ہیں۔ حدِ نصاب ${b} ہے۔ آپ کی زکوٰۃ ${c} کا 2.5٪ = ${d} ہے۔`;
    }
    if (language === 'ar') {
      return `لديك ${a}. وحد النصاب هو ${b}. وزكاتك هي 2.5% من ${c} = ${d}.`;
    }
    return `You have ${a}. The nisab is ${b}. Your zakat is 2.5% of ${c} = ${d}.`;
  }

  return {
    CONSTANTS: {
      TOLA_TO_GRAMS,
      SILVER_NISAB_TOLA,
      SILVER_NISAB_GRAMS,
      GOLD_NISAB_TOLA,
      GOLD_NISAB_GRAMS,
      ZAKAT_RATE,
      TROY_OUNCE_TO_GRAMS
    },
    FALLBACK_PRICES,
    tolaToGrams,
    gramsToTola,
    weightToGrams,
    goldPurityFactor,
    toPureGoldGrams,
    calculateNisabThreshold,
    calculateZakat,
    calculateWizardTotals,
    parseLocalizedNumber,
    formatNumber,
    formatZakatHeadline,
    formatZakatStory
  };
});
