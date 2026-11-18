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

  return {
    CONSTANTS: {
      TOLA_TO_GRAMS,
      SILVER_NISAB_TOLA,
      SILVER_NISAB_GRAMS,
      GOLD_NISAB_TOLA,
      GOLD_NISAB_GRAMS,
      ZAKAT_RATE
    },
    FALLBACK_PRICES,
    tolaToGrams,
    gramsToTola,
    goldPurityFactor,
    toPureGoldGrams,
    calculateNisabThreshold,
    calculateZakat,
    parseLocalizedNumber,
    formatNumber
  };
});
