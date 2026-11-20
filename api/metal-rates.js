/**
 * Vercel Serverless Function: GET /api/metal-rates
 * Automated live market rate update pipeline for Gold and Silver in Pakistan (PKR)
 * and international currencies (USD, SAR, AED, GBP).
 *
 * Multi-source fallback pipeline:
 * 1. Primary: PakGold Sarafa (Rawalpindi/Islamabad) - live market PKR rates
 * 2. Secondary Fallback: LivePriceOfGold Pakistan - spot parity PKR rates
 * 3. Tertiary Fallback: International Bullion Spot (XAU/XAG) + live FX
 * 4. Last-Known-Good Memory Cache / Offline Seed Rates (stale: true)
 *
 * Caching:
 * - Server-side Edge CDN: Cache-Control: public, s-maxage=900, stale-while-revalidate=300 (15 mins)
 * - In-memory lambda cache: 15 minutes TTL (bypassed if ?refresh=true)
 */

const Nisab = require('../nisab.js');

const TOLA_TO_GRAMS = 11.664;
const TROY_OUNCE_TO_GRAMS = 31.1035;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// In-memory cache across warm serverless invocations
let memoryCache = null;
let memoryCacheTime = 0;
let lastKnownGood = null;

const FALLBACK_FX = {
  USD: 1.0,
  PKR: 278.5,
  SAR: 3.75,
  AED: 3.67,
  GBP: 0.79
};

function parseNumeric(str) {
  if (!str) return 0;
  return parseFloat(String(str).replace(/[^0-9.]/g, '')) || 0;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 4500) {
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

/**
 * Source 1: PakGold Sarafa live market scraping
 */
async function fetchFromPakGold() {
  const res = await fetchWithTimeout('https://www.pakgold.net/v2/gold-silver', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  }, 4500);

  if (!res.ok) throw new Error(`PakGold returned HTTP ${res.status}`);
  const html = await res.text();

  // 24K Gold Tola Sell
  const tolaMatch = html.match(/id=["']vRawaSell["'][^>]*>([0-9,.]+)</i) ||
                    html.match(/id=["']vGTolaS["'][^>]*>([0-9,.]+)</i);
  const gold24kTola = tolaMatch ? parseNumeric(tolaMatch[1]) : 0;

  // 24K Gold 1g Sell
  const g1Match = html.match(/id=["']vG1S["'][^>]*>([0-9,.]+)</i);
  const gold24k1g = g1Match ? parseNumeric(g1Match[1]) : (gold24kTola > 0 ? Math.round((gold24kTola / TOLA_TO_GRAMS) * 100) / 100 : 0);

  // 24K Gold 10g Sell
  const g10Match = html.match(/id=["']vG10S["'][^>]*>([0-9,.]+)</i);
  const gold24k10g = g10Match ? parseNumeric(g10Match[1]) : (gold24k1g > 0 ? Math.round(gold24k1g * 10 * 100) / 100 : 0);

  // Local Silver Tola Sell
  const silverTolaMatch = html.match(/id=["']vSilverLocalSell["'][^>]*>([0-9,.]+)</i);
  const silverTola = silverTolaMatch ? parseNumeric(silverTolaMatch[1]) : 0;
  const silver1g = silverTola > 0 ? Math.round((silverTola / TOLA_TO_GRAMS) * 100) / 100 : 0;
  const silver10g = Math.round(silver1g * 10 * 100) / 100;

  // Timestamp
  const timeMatch = html.match(/id=["']vRateTime["'][^>]*>([^<]+)</i);
  const timeStr = timeMatch ? timeMatch[1].trim() : 'Live';

  if (gold24k1g <= 0 || silver1g <= 0) {
    throw new Error('PakGold HTML did not contain valid positive metal rates');
  }

  return {
    source: 'PakGold Sarafa (Rawalpindi/Islamabad)',
    sourceKey: 'pakgold',
    timeStr,
    gold24k1g,
    gold24kTola: gold24kTola || Math.round(gold24k1g * TOLA_TO_GRAMS),
    gold24k10g,
    silver1g,
    silverTola: silverTola || Math.round(silver1g * TOLA_TO_GRAMS),
    silver10g
  };
}

/**
 * Source 2: LivePriceOfGold Pakistan parity scraping
 */
async function fetchFromLivePriceOfGold() {
  const [goldRes, silverRes] = await Promise.all([
    fetchWithTimeout('https://www.livepriceofgold.com/pakistan-gold-price.html', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, 4500),
    fetchWithTimeout('https://www.livepriceofgold.com/silver-price/pakistan.html', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, 4500)
  ]);

  if (!goldRes.ok || !silverRes.ok) {
    throw new Error(`LivePriceOfGold HTTP error: Gold ${goldRes.status}, Silver ${silverRes.status}`);
  }

  const [goldHtml, silverHtml] = await Promise.all([goldRes.text(), silverRes.text()]);

  // Extract 24K gold per gram via data-price="GXAUUSD_PKR" or table match
  const g24Match = goldHtml.match(/data-price=["']GXAUUSD_PKR["'][^>]*>([0-9,.]+)</i) ||
                   goldHtml.match(/24K\s*Gold\/gram[\s\S]*?data-price[^>]*>([0-9,.]+)</i);
  const gold24k1g = g24Match ? parseNumeric(g24Match[1]) : 0;
  const gold24kTola = Math.round(gold24k1g * TOLA_TO_GRAMS);
  const gold24k10g = Math.round(gold24k1g * 10 * 100) / 100;

  // Extract Silver per gram via data-price="GXAGUSD_PKR"
  const sMatch = silverHtml.match(/data-price=["']GXAGUSD_PKR["'][^>]*>([0-9,.]+)</i) ||
                 silverHtml.match(/Silver\/Gram[\s\S]*?data-price[^>]*>([0-9,.]+)</i);
  const silver1g = sMatch ? parseNumeric(sMatch[1]) : 0;
  const silverTola = Math.round(silver1g * TOLA_TO_GRAMS);
  const silver10g = Math.round(silver1g * 10 * 100) / 100;

  if (gold24k1g <= 0 || silver1g <= 0) {
    throw new Error('LivePriceOfGold HTML did not contain valid positive metal rates');
  }

  return {
    source: 'LivePriceOfGold (Pakistan Parity)',
    sourceKey: 'livepriceofgold',
    timeStr: 'Live Market Parity',
    gold24k1g,
    gold24kTola,
    gold24k10g,
    silver1g,
    silverTola,
    silver10g
  };
}

/**
 * Source 3: International Bullion Spot (XAU/XAG) + Live FX
 */
async function fetchFromInternationalSpot() {
  const [goldRes, silverRes, fxRes] = await Promise.all([
    fetchWithTimeout('https://api.gold-api.com/price/XAU', {}, 4000),
    fetchWithTimeout('https://api.gold-api.com/price/XAG', {}, 4000),
    fetchWithTimeout('https://open.er-api.com/v6/latest/USD', {}, 4000)
  ]);

  if (!goldRes.ok || !silverRes.ok) {
    throw new Error(`International metals API failed: Gold ${goldRes.status}, Silver ${silverRes.status}`);
  }

  const [goldData, silverData] = await Promise.all([goldRes.json(), silverRes.json()]);
  let fxPkr = FALLBACK_FX.PKR;

  if (fxRes.ok) {
    try {
      const fxJson = await fxRes.json();
      if (fxJson && fxJson.rates && fxJson.rates.PKR) {
        fxPkr = fxJson.rates.PKR;
      }
    } catch (_) {}
  }

  const goldUsdPerOunce = Number(goldData.price) || 0;
  const silverUsdPerOunce = Number(silverData.price) || 0;

  if (goldUsdPerOunce <= 0 || silverUsdPerOunce <= 0) {
    throw new Error('International metals returned invalid prices');
  }

  const gold24k1g = Math.round((goldUsdPerOunce / TROY_OUNCE_TO_GRAMS) * fxPkr * 100) / 100;
  const silver1g = Math.round((silverUsdPerOunce / TROY_OUNCE_TO_GRAMS) * fxPkr * 100) / 100;

  return {
    source: 'International Bullion Spot (XAU/XAG + FX)',
    sourceKey: 'international_spot',
    timeStr: 'Live International Spot',
    gold24k1g,
    gold24kTola: Math.round(gold24k1g * TOLA_TO_GRAMS),
    gold24k10g: Math.round(gold24k1g * 10 * 100) / 100,
    silver1g,
    silverTola: Math.round(silver1g * TOLA_TO_GRAMS),
    silver10g: Math.round(silver1g * 10 * 100) / 100
  };
}

/**
 * Normalizes rates across all purities (24K, 22K, 21K, 18K),
 * units (Gram, 10 Grams, Tola), and Nisab thresholds.
 */
function buildMetalRatesPayload(basePkrRates, isLive = true, isStale = false) {
  const g24_1g = basePkrRates.gold24k1g;
  const s_1g = basePkrRates.silver1g;

  // Karat multipliers (Canonical Fiqh & Jewelers Standards)
  const g22_1g = Math.round(g24_1g * (22 / 24) * 100) / 100;
  const g21_1g = Math.round(g24_1g * (21 / 24) * 100) / 100;
  const g18_1g = Math.round(g24_1g * (18 / 24) * 100) / 100;

  const karats = {
    '24K': {
      carat: 24,
      purityFactor: 1.0,
      perGram: g24_1g,
      per10Gram: basePkrRates.gold24k10g || Math.round(g24_1g * 10 * 100) / 100,
      perTola: basePkrRates.gold24kTola || Math.round(g24_1g * TOLA_TO_GRAMS)
    },
    '22K': {
      carat: 22,
      purityFactor: 0.9167,
      perGram: g22_1g,
      per10Gram: Math.round(g22_1g * 10 * 100) / 100,
      perTola: Math.round(g22_1g * TOLA_TO_GRAMS)
    },
    '21K': {
      carat: 21,
      purityFactor: 0.875,
      perGram: g21_1g,
      per10Gram: Math.round(g21_1g * 10 * 100) / 100,
      perTola: Math.round(g21_1g * TOLA_TO_GRAMS)
    },
    '18K': {
      carat: 18,
      purityFactor: 0.75,
      perGram: g18_1g,
      per10Gram: Math.round(g18_1g * 10 * 100) / 100,
      perTola: Math.round(g18_1g * TOLA_TO_GRAMS)
    }
  };

  const silver = {
    purity: '999 Chandi',
    perGram: s_1g,
    per10Gram: basePkrRates.silver10g || Math.round(s_1g * 10 * 100) / 100,
    perTola: basePkrRates.silverTola || Math.round(s_1g * TOLA_TO_GRAMS),
    activePricePerGram: s_1g,
    activePricePerTola: basePkrRates.silverTola || Math.round(s_1g * TOLA_TO_GRAMS)
  };

  const nisab = {
    standard: 'silver',
    silverNisabGrams: Nisab.CONSTANTS.SILVER_NISAB_GRAMS, // 612.36g
    silverNisabTola: Nisab.CONSTANTS.SILVER_NISAB_TOLA,   // 52.5 tola
    silverNisabThreshold: Math.round(s_1g * Nisab.CONSTANTS.SILVER_NISAB_GRAMS * 100) / 100,
    goldNisabGrams: Nisab.CONSTANTS.GOLD_NISAB_GRAMS,     // 87.48g
    goldNisabTola: Nisab.CONSTANTS.GOLD_NISAB_TOLA,       // 7.5 tola
    goldNisabThreshold: Math.round(g24_1g * Nisab.CONSTANTS.GOLD_NISAB_GRAMS * 100) / 100
  };

  // Build currencies map for app-wide compatibility
  const currencies = {};
  const pkrRatio = basePkrRates.gold24k1g / Nisab.FALLBACK_PRICES.PKR.goldPricePerGram;

  for (const [code, val] of Object.entries(Nisab.FALLBACK_PRICES)) {
    if (code === 'PKR') {
      currencies.PKR = {
        currency: 'PKR',
        goldPricePerGram: g24_1g,
        goldPricePerTola: karats['24K'].perTola,
        silverPricePerGram: s_1g,
        silverPricePerTola: silver.perTola
      };
    } else {
      // Derive proportional international rate
      const goldG = Math.round(val.goldPricePerGram * pkrRatio * 100) / 100;
      const silverG = Math.round(val.silverPricePerGram * pkrRatio * 100) / 100;
      currencies[code] = {
        currency: code,
        goldPricePerGram: goldG,
        goldPricePerTola: Math.round(goldG * TOLA_TO_GRAMS),
        silverPricePerGram: silverG,
        silverPricePerTola: Math.round(silverG * TOLA_TO_GRAMS)
      };
    }
  }

  const now = new Date();
  return {
    success: true,
    isLive,
    stale: isStale,
    source: basePkrRates.source,
    sourceKey: basePkrRates.sourceKey,
    updatedAt: now.toISOString(),
    updatedAtReadable: now.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    sourceTimestamp: basePkrRates.timeStr || 'Live',
    gold: {
      karats,
      activePricePerGram: g24_1g,
      activePricePerTola: karats['24K'].perTola
    },
    silver,
    nisab,
    currencies
  };
}

/**
 * Core Live Fetching Pipeline with multi-source fallback
 */
async function getLiveMetalRates(forceRefresh = false) {
  // If memory cache is fresh and not forced, return immediately
  if (!forceRefresh && memoryCache && (Date.now() - memoryCacheTime < CACHE_TTL_MS)) {
    return memoryCache;
  }

  let baseRates = null;

  // 1. Primary: PakGold Sarafa
  try {
    baseRates = await fetchFromPakGold();
  } catch (err1) {
    console.warn('[MetalRates] Primary source (PakGold) failed:', err1.message);

    // 2. Secondary Fallback: LivePriceOfGold
    try {
      baseRates = await fetchFromLivePriceOfGold();
    } catch (err2) {
      console.warn('[MetalRates] Secondary fallback (LivePriceOfGold) failed:', err2.message);

      // 3. Tertiary Fallback: International Spot Bullion + FX
      try {
        baseRates = await fetchFromInternationalSpot();
      } catch (err3) {
        console.warn('[MetalRates] Tertiary fallback (International Spot) failed:', err3.message);
      }
    }
  }

  if (baseRates) {
    const payload = buildMetalRatesPayload(baseRates, true, false);
    memoryCache = payload;
    memoryCacheTime = Date.now();
    lastKnownGood = payload;
    return payload;
  }

  // 4. Last-Known-Good Cache Fallback
  if (lastKnownGood) {
    return {
      ...lastKnownGood,
      stale: true,
      notice: 'Live sources temporarily unreachable. Serving last verified rates.',
      noticeUrdu: 'لائیو سرور سے رابطہ نہ ہو سکا۔ آخری تصدیق شدہ ریٹس دکھائے جا رہے ہیں۔'
    };
  }

  // Final fallback: Seed standard prices from nisab.js
  const fallbackPkr = {
    source: 'Offline Fallback Standards',
    sourceKey: 'fallback_seed',
    timeStr: Nisab.FALLBACK_PRICES.PKR.asOfDate,
    gold24k1g: Nisab.FALLBACK_PRICES.PKR.goldPricePerGram,
    gold24kTola: Nisab.FALLBACK_PRICES.PKR.goldPricePerTola,
    gold24k10g: Math.round(Nisab.FALLBACK_PRICES.PKR.goldPricePerGram * 10),
    silver1g: Nisab.FALLBACK_PRICES.PKR.silverPricePerGram,
    silverTola: Nisab.FALLBACK_PRICES.PKR.silverPricePerTola,
    silver10g: Math.round(Nisab.FALLBACK_PRICES.PKR.silverPricePerGram * 10)
  };

  const seedPayload = buildMetalRatesPayload(fallbackPkr, false, true);
  seedPayload.notice = 'Live price unavailable. Please check the price below.';
  seedPayload.noticeUrdu = 'لائیو ریٹس دستیاب نہیں ہیں۔ برائے مہربانی نیچے دی گئی قیمت چیک کر لیں۔';
  return seedPayload;
}

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const forceRefresh = Boolean(req.query && (req.query.refresh === 'true' || req.query.refresh === '1'));

  try {
    const ratesData = await getLiveMetalRates(forceRefresh);

    // 15-Minute Edge Cache Header
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=300');
    return res.status(200).json(ratesData);
  } catch (error) {
    console.error('[MetalRates Handler Fatal Error]:', error);
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
    return res.status(500).json({
      success: false,
      isLive: false,
      stale: true,
      error: error.message || 'Internal server error fetching rates'
    });
  }
};
