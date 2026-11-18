/**
 * Vercel Serverless Function: GET /api/prices
 * Securely fetches live gold and silver prices in PKR and other currencies.
 * API keys (if any in future) are never exposed to the client.
 * Caches results on Vercel CDN and in-memory for 3 hours.
 * Falls back safely to editable seed prices if external providers are unavailable.
 */

const Nisab = require('../nisab.js');

// In-memory cache for warm lambda executions
let memoryCache = null;
let memoryCacheTime = 0;
const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

const FALLBACK_FX = {
  USD: 1.0,
  PKR: 278.0,
  SAR: 3.75,
  AED: 3.67,
  GBP: 0.79
};

const TROY_OUNCE_TO_GRAMS = 31.1034768;

async function fetchWithTimeout(url, options = {}, timeoutMs = 4000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function getLiveMetalsPrices() {
  // Return memory cache if still fresh
  if (memoryCache && (Date.now() - memoryCacheTime < CACHE_TTL_MS)) {
    return memoryCache;
  }

  // Fetch Gold (XAU) and Silver (XAG) per troy ounce in USD
  const [goldRes, silverRes, fxRes] = await Promise.all([
    fetchWithTimeout('https://api.gold-api.com/price/XAU'),
    fetchWithTimeout('https://api.gold-api.com/price/XAG'),
    fetchWithTimeout('https://open.er-api.com/v6/latest/USD')
  ]);

  if (!goldRes.ok || !silverRes.ok) {
    throw new Error(`Metals API response not OK: Gold ${goldRes.status}, Silver ${silverRes.status}`);
  }

  const goldData = await goldRes.json();
  const silverData = await silverRes.json();
  let fxRates = FALLBACK_FX;

  if (fxRes.ok) {
    try {
      const fxJson = await fxRes.json();
      if (fxJson && fxJson.rates) {
        fxRates = {
          USD: 1.0,
          PKR: fxJson.rates.PKR || FALLBACK_FX.PKR,
          SAR: fxJson.rates.SAR || FALLBACK_FX.SAR,
          AED: fxJson.rates.AED || FALLBACK_FX.AED,
          GBP: fxJson.rates.GBP || FALLBACK_FX.GBP
        };
      }
    } catch (_) {
      // Use fallback FX
    }
  }

  const goldUsdPerOunce = Number(goldData.price) || 0;
  const silverUsdPerOunce = Number(silverData.price) || 0;

  if (goldUsdPerOunce <= 0 || silverUsdPerOunce <= 0) {
    throw new Error('Invalid metal prices received');
  }

  const goldUsdPerGram = goldUsdPerOunce / TROY_OUNCE_TO_GRAMS;
  const silverUsdPerGram = silverUsdPerOunce / TROY_OUNCE_TO_GRAMS;

  const ratesByCurrency = {};
  for (const curr of ['PKR', 'USD', 'SAR', 'AED', 'GBP']) {
    const fx = fxRates[curr] || 1.0;
    const goldPerGram = Math.round(goldUsdPerGram * fx * 100) / 100;
    const silverPerGram = Math.round(silverUsdPerGram * fx * 100) / 100;
    const goldPerTola = Math.round(goldPerGram * Nisab.CONSTANTS.TOLA_TO_GRAMS);
    const silverPerTola = Math.round(silverPerGram * Nisab.CONSTANTS.TOLA_TO_GRAMS);

    ratesByCurrency[curr] = {
      currency: curr,
      goldPricePerGram: goldPerGram,
      goldPricePerTola: goldPerTola,
      silverPricePerGram: silverPerGram,
      silverPricePerTola: silverPerTola
    };
  }

  const now = new Date();
  const payload = {
    isLive: true,
    source: 'Live International Bullion Spot',
    updatedAt: now.toISOString(),
    updatedAtReadable: now.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    currencies: ratesByCurrency
  };

  memoryCache = payload;
  memoryCacheTime = Date.now();
  return payload;
}

module.exports = async function handler(req, res) {
  // CORS & Cache Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const liveData = await getLiveMetalsPrices();
    // Cache for 3 hours on Vercel Edge CDN, allow serving stale while revalidating
    res.setHeader('Cache-Control', 'public, s-maxage=10800, stale-while-revalidate=3600');
    return res.status(200).json({
      success: true,
      ...liveData
    });
  } catch (error) {
    // Graceful fallback to seed prices from 18 Nov 2026
    const fallbackCurrencies = {};
    for (const [code, val] of Object.entries(Nisab.FALLBACK_PRICES)) {
      fallbackCurrencies[code] = {
        currency: code,
        goldPricePerGram: val.goldPricePerGram,
        goldPricePerTola: val.goldPricePerTola,
        silverPricePerGram: val.silverPricePerGram,
        silverPricePerTola: val.silverPricePerTola
      };
    }

    // Cache fallback briefly (10 mins) so we retry live service soon
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=300');
    return res.status(200).json({
      success: false,
      isLive: false,
      source: 'Offline Fallback Standards',
      updatedAt: '2026-11-18T00:00:00Z',
      updatedAtReadable: '18 Nov 2026 (Manual / Fallback rates)',
      notice: 'Live price unavailable. Please check the price below.',
      noticeUrdu: 'لائیو ریٹس دستیاب نہیں ہیں۔ برائے مہربانی نیچے دی گئی قیمت چیک کر لیں۔',
      currencies: fallbackCurrencies
    });
  }
};
