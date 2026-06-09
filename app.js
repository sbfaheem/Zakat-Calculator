// ZakatFlow Core Logic

// State Management
const STATE = {
  currency: 'USD',
  nisabStandard: 'silver', // 'silver' is preferred by contemporary scholars as default
  goldPrice: 65.50,
  silverPrice: 0.75,
  assets: [
    { id: generateId(), type: 'Cash', unit: 'Currency', amount: 0, price: 1, total: 0, isPriceCustom: false }
  ],
  liabilities: [
    { id: generateId(), description: 'Immediate Bills / Short-term Loans', amount: 0 }
  ],
  alHawlConfirmed: true,
  history: []
};

// Constants & Conversions
const TOLA_TO_GRAMS = 11.6638;
const ZAKAT_RATE = 0.025; // 2.5%

const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', gold: 65.50, silver: 0.75 },
  PKR: { symbol: 'Rs', name: 'Pakistani Rupee', gold: 18200, silver: 210 },
  EUR: { symbol: '€', name: 'Euro', gold: 60.20, silver: 0.69 },
  GBP: { symbol: '£', name: 'British Pound', gold: 52.10, silver: 0.60 },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', gold: 240.50, silver: 2.75 }
};

const ASSET_TYPES = [
  'Cash',
  'Gold',
  'Silver',
  'Shares/Investments',
  'Business Merchandise',
  'Agricultural Produce',
  'Livestock'
];

// Helper to generate unique IDs
function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

// Format Currency Utility
function formatMoney(amount) {
  const symbol = CURRENCIES[STATE.currency].symbol;
  return `${symbol} ${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Initialize the Application
document.addEventListener('DOMContentLoaded', () => {
  loadHistory();
  initCurrencySelector();
  initNisabPrices();
  initCarousel();
  setupEventListeners();
  renderAssets();
  renderLiabilities();
  calculateAll();
});

// Setup currency dropdown and default prices
function initCurrencySelector() {
  const selector = document.getElementById('currency-select');
  if (!selector) return;

  selector.innerHTML = Object.keys(CURRENCIES).map(code => 
    `<option value="${code}">${code} (${CURRENCIES[code].symbol})</option>`
  ).join('');

  selector.value = STATE.currency;
  selector.addEventListener('change', (e) => {
    const prevCurrency = STATE.currency;
    STATE.currency = e.target.value;
    
    // Scale or reset price values based on currency defaults
    const prevDefaults = CURRENCIES[prevCurrency];
    const newDefaults = CURRENCIES[STATE.currency];
    
    // Update global gold/silver prices to new currency defaults if they were untouched
    if (STATE.goldPrice === prevDefaults.gold) {
      STATE.goldPrice = newDefaults.gold;
      document.getElementById('gold-price-input').value = STATE.goldPrice;
    }
    if (STATE.silverPrice === prevDefaults.silver) {
      STATE.silverPrice = newDefaults.silver;
      document.getElementById('silver-price-input').value = STATE.silverPrice;
    }

    // Refresh all price labels and calculations
    updateCurrencyLabels();
    
    // Update asset row prices for gold/silver if they are NOT custom
    STATE.assets.forEach(asset => {
      if (!asset.isPriceCustom) {
        if (asset.type === 'Gold') {
          asset.price = asset.unit === 'Tolas' ? STATE.goldPrice * TOLA_TO_GRAMS : STATE.goldPrice;
        } else if (asset.type === 'Silver') {
          asset.price = asset.unit === 'Tolas' ? STATE.silverPrice * TOLA_TO_GRAMS : STATE.silverPrice;
        }
      }
    });

    renderAssets();
    calculateAll();
  });

  updateCurrencyLabels();
}

function updateCurrencyLabels() {
  const symbol = CURRENCIES[STATE.currency].symbol;
  document.querySelectorAll('.currency-symbol').forEach(el => {
    el.textContent = symbol;
  });
}

function initNisabPrices() {
  const goldInput = document.getElementById('gold-price-input');
  const silverInput = document.getElementById('silver-price-input');
  
  if (goldInput && silverInput) {
    goldInput.value = STATE.goldPrice;
    silverInput.value = STATE.silverPrice;

    goldInput.addEventListener('input', (e) => {
      STATE.goldPrice = parseFloat(e.target.value) || 0;
      syncNisabPricesToAssets();
      calculateAll();
    });

    silverInput.addEventListener('input', (e) => {
      STATE.silverPrice = parseFloat(e.target.value) || 0;
      syncNisabPricesToAssets();
      calculateAll();
    });
  }

  // Nisab standard toggle triggers
  const goldToggle = document.getElementById('nisab-gold-toggle');
  const silverToggle = document.getElementById('nisab-silver-toggle');

  if (goldToggle && silverToggle) {
    goldToggle.addEventListener('click', () => {
      STATE.nisabStandard = 'gold';
      goldToggle.classList.add('bg-emerald-600', 'text-white');
      goldToggle.classList.remove('bg-slate-100', 'text-slate-700');
      silverToggle.classList.remove('bg-emerald-600', 'text-white');
      silverToggle.classList.add('bg-slate-100', 'text-slate-700');
      calculateAll();
    });

    silverToggle.addEventListener('click', () => {
      STATE.nisabStandard = 'silver';
      silverToggle.classList.add('bg-emerald-600', 'text-white');
      silverToggle.classList.remove('bg-slate-100', 'text-slate-700');
      goldToggle.classList.remove('bg-emerald-600', 'text-white');
      goldToggle.classList.add('bg-slate-100', 'text-slate-700');
      calculateAll();
    });
  }
}

function syncNisabPricesToAssets() {
  let updatedAny = false;
  STATE.assets.forEach((asset, index) => {
    if (!asset.isPriceCustom) {
      if (asset.type === 'Gold') {
        asset.price = asset.unit === 'Tolas' ? STATE.goldPrice * TOLA_TO_GRAMS : STATE.goldPrice;
        const input = document.getElementById(`asset-price-input-${index}`);
        if (input) input.value = asset.price.toFixed(2);
        updatedAny = true;
      } else if (asset.type === 'Silver') {
        asset.price = asset.unit === 'Tolas' ? STATE.silverPrice * TOLA_TO_GRAMS : STATE.silverPrice;
        const input = document.getElementById(`asset-price-input-${index}`);
        if (input) input.value = asset.price.toFixed(2);
        updatedAny = true;
      }
    }
  });
}

// Render assets list
function renderAssets() {
  const container = document.getElementById('assets-container');
  if (!container) return;

  container.innerHTML = STATE.assets.map((asset, index) => {
    const isCurrency = asset.unit === 'Currency';
    
    // Automatically match asset rows to selected Gold/Silver price defaults if not customized
    if (!asset.isPriceCustom) {
      if (asset.type === 'Gold') {
        asset.price = asset.unit === 'Tolas' ? STATE.goldPrice * TOLA_TO_GRAMS : STATE.goldPrice;
      } else if (asset.type === 'Silver') {
        asset.price = asset.unit === 'Tolas' ? STATE.silverPrice * TOLA_TO_GRAMS : STATE.silverPrice;
      } else if (isCurrency) {
        asset.price = 1;
      }
    }

    calculateAssetTotal(asset);

    return `
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50/50 p-4 rounded-xl border border-slate-100 transition-all duration-200 animate-scale-in">
        
        <!-- Asset Type Dropdown -->
        <div class="md:col-span-3">
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Asset Category</label>
          <select 
            onchange="updateAsset(${index}, 'type', this.value)" 
            class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium input-focus-ring transition-all-300"
          >
            ${ASSET_TYPES.map(type => `<option value="${type}" ${asset.type === type ? 'selected' : ''}>${type}</option>`).join('')}
          </select>
        </div>

        <!-- Unit Selector Toggle -->
        <div class="md:col-span-2">
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Unit</label>
          <select 
            onchange="updateAsset(${index}, 'unit', this.value)" 
            class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium input-focus-ring transition-all-300"
          >
            <option value="Currency" ${asset.unit === 'Currency' ? 'selected' : ''}>Currency</option>
            <option value="Grams" ${asset.unit === 'Grams' ? 'selected' : ''}>Grams (g)</option>
            <option value="Tolas" ${asset.unit === 'Tolas' ? 'selected' : ''}>Tolas</option>
          </select>
        </div>

        <!-- Amount Input -->
        <div class="md:col-span-2">
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            ${isCurrency ? 'Total Value' : 'Weight / Amount'}
          </label>
          <div class="relative">
            ${isCurrency ? `<span class="absolute left-3 top-2 text-sm font-medium text-slate-400 currency-symbol">${CURRENCIES[STATE.currency].symbol}</span>` : ''}
            <input 
              type="number" 
              value="${asset.amount || ''}" 
              placeholder="0.00" 
              min="0"
              oninput="updateAsset(${index}, 'amount', this.value)" 
              class="w-full bg-white border border-slate-200 rounded-lg ${isCurrency ? 'pl-8' : 'px-3'} pr-3 py-2 text-sm text-slate-700 font-medium input-focus-ring transition-all-300"
            />
          </div>
        </div>

        <!-- Price per Unit Input -->
        <div class="md:col-span-2">
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Price per ${isCurrency ? 'Unit' : (asset.unit === 'Tolas' ? 'Tola' : 'Gram')}
          </label>
          <div class="relative">
            <span class="absolute left-3 top-2 text-sm font-medium text-slate-400 currency-symbol">${CURRENCIES[STATE.currency].symbol}</span>
            <input 
              type="number" 
              id="asset-price-input-${index}"
              value="${isCurrency ? '1.00' : asset.price.toFixed(2)}" 
              placeholder="1.00" 
              min="0"
              ${isCurrency ? 'disabled' : ''}
              oninput="updateAsset(${index}, 'price', this.value)" 
              class="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-700 font-medium input-focus-ring transition-all-300 ${isCurrency ? 'opacity-50 bg-slate-100 cursor-not-allowed' : ''}"
            />
          </div>
        </div>

        <!-- Total Value Readonly Display -->
        <div class="md:col-span-2">
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Total Value</label>
          <div class="bg-slate-100/60 border border-slate-200/50 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 min-h-[38px] flex items-center" id="asset-total-display-${index}">
            ${formatMoney(asset.total)}
          </div>
        </div>

        <!-- Delete Row Button -->
        <div class="md:col-span-1 flex justify-end">
          <button 
            type="button" 
            onclick="removeAsset('${asset.id}')"
            class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all-300"
            title="Remove row"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>

      </div>
    `;
  }).join('');

  updateCurrencyLabels();
}

// Update asset field handler
window.updateAsset = function(index, field, value) {
  const asset = STATE.assets[index];
  if (!asset) return;

  if (field === 'type') {
    asset.type = value;
    asset.isPriceCustom = false; // reset custom status when category changes
    
    // Set matching default units/prices for gold/silver
    if (value === 'Gold') {
      asset.unit = 'Grams';
      asset.price = STATE.goldPrice;
    } else if (value === 'Silver') {
      asset.unit = 'Grams';
      asset.price = STATE.silverPrice;
    } else {
      asset.unit = 'Currency';
      asset.price = 1;
    }
    renderAssets();
  } else if (field === 'unit') {
    asset.unit = value;
    asset.isPriceCustom = false; // reset custom status when unit changes to sync properly
    
    if (value === 'Currency') {
      asset.price = 1;
    } else if (value === 'Grams' || value === 'Tolas') {
      if (asset.type === 'Gold') {
        asset.price = value === 'Tolas' ? STATE.goldPrice * TOLA_TO_GRAMS : STATE.goldPrice;
      } else if (asset.type === 'Silver') {
        asset.price = value === 'Tolas' ? STATE.silverPrice * TOLA_TO_GRAMS : STATE.silverPrice;
      } else {
        asset.price = 100; // default rate
      }
    }
    renderAssets();
  } else if (field === 'price') {
    asset.price = parseFloat(value) || 0;
    asset.isPriceCustom = true; // flag user-defined price
  } else if (field === 'amount') {
    asset.amount = parseFloat(value) || 0;
  }

  // Recalculate row total value
  calculateAssetTotal(asset);
  
  // Real-time update row total element in DOM without full re-render (avoids losing focus)
  const totalDisplay = document.getElementById(`asset-total-display-${index}`);
  if (totalDisplay) {
    totalDisplay.textContent = formatMoney(asset.total);
  }

  calculateAll();
};

function calculateAssetTotal(asset) {
  const amount = asset.amount || 0;
  const price = asset.price || 0;
  
  if (asset.unit === 'Currency') {
    asset.total = amount;
  } else if (asset.unit === 'Grams') {
    asset.total = amount * price;
  } else if (asset.unit === 'Tolas') {
    asset.total = amount * TOLA_TO_GRAMS * price;
  }
}

// Add new asset row
window.addAsset = function() {
  STATE.assets.push({
    id: generateId(),
    type: 'Cash',
    unit: 'Currency',
    amount: 0,
    price: 1,
    total: 0,
    isPriceCustom: false
  });
  renderAssets();
  calculateAll();
};

// Remove asset row
window.removeAsset = function(id) {
  if (STATE.assets.length <= 1) {
    showToast('You must keep at least one asset row.', 'warning');
    return;
  }
  STATE.assets = STATE.assets.filter(a => a.id !== id);
  renderAssets();
  calculateAll();
};

// Render liabilities list
function renderLiabilities() {
  const container = document.getElementById('liabilities-container');
  if (!container) return;

  container.innerHTML = STATE.liabilities.map((lib, index) => {
    return `
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50/50 p-4 rounded-xl border border-slate-100 transition-all duration-200 animate-scale-in">
        
        <!-- Description -->
        <div class="md:col-span-7">
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
          <input 
            type="text" 
            value="${lib.description || ''}" 
            placeholder="e.g. Credit Card Bills, Rent Due" 
            oninput="updateLiability(${index}, 'description', this.value)" 
            class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium input-focus-ring transition-all-300"
          />
        </div>

        <!-- Amount Due -->
        <div class="md:col-span-4">
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Amount Due</label>
          <div class="relative">
            <span class="absolute left-3 top-2 text-sm font-medium text-slate-400 currency-symbol">${CURRENCIES[STATE.currency].symbol}</span>
            <input 
              type="number" 
              value="${lib.amount || ''}" 
              placeholder="0.00" 
              min="0"
              oninput="updateLiability(${index}, 'amount', this.value)" 
              class="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-700 font-medium input-focus-ring transition-all-300"
            />
          </div>
        </div>

        <!-- Delete Button -->
        <div class="md:col-span-1 flex justify-end">
          <button 
            type="button" 
            onclick="removeLiability('${lib.id}')"
            class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all-300"
            title="Remove liability"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>

      </div>
    `;
  }).join('');

  updateCurrencyLabels();
}

window.updateLiability = function(index, field, value) {
  const lib = STATE.liabilities[index];
  if (!lib) return;

  if (field === 'amount') {
    lib.amount = parseFloat(value) || 0;
  } else {
    lib.description = value;
  }
  calculateAll();
};

window.addLiability = function() {
  STATE.liabilities.push({
    id: generateId(),
    description: '',
    amount: 0
  });
  renderLiabilities();
  calculateAll();
};

window.removeLiability = function(id) {
  STATE.liabilities = STATE.liabilities.filter(l => l.id !== id);
  renderLiabilities();
  calculateAll();
};

// Math engine recalculating values
function calculateAll() {
  // Update Nisab Values
  const goldNisab = 87.48 * STATE.goldPrice;
  const silverNisab = 612.36 * STATE.silverPrice;

  document.getElementById('nisab-gold-value').textContent = formatMoney(goldNisab);
  document.getElementById('nisab-silver-value').textContent = formatMoney(silverNisab);

  // Active Nisab Threshold
  const activeNisab = STATE.nisabStandard === 'gold' ? goldNisab : silverNisab;
  const standardName = STATE.nisabStandard === 'gold' ? 'Gold' : 'Silver';
  const thresholdWeight = STATE.nisabStandard === 'gold' ? '87.48g' : '612.36g';

  // Update Active Banner details
  const activeBanner = document.getElementById('active-nisab-banner-text');
  if (activeBanner) {
    activeBanner.innerHTML = `Active Threshold: <strong>${standardName}</strong>. Your wealth must exceed <strong>${formatMoney(activeNisab)}</strong> (${thresholdWeight}) to be eligible for Zakat.`;
  }

  // Calculate totals
  STATE.assets.forEach(asset => calculateAssetTotal(asset));
  const totalAssets = STATE.assets.reduce((sum, asset) => sum + (asset.total || 0), 0);
  const totalLiabilities = STATE.liabilities.reduce((sum, lib) => sum + (lib.amount || 0), 0);
  const netWealth = totalAssets - totalLiabilities;

  // Display outputs in right column summary
  document.getElementById('summary-total-assets').textContent = formatMoney(totalAssets);
  document.getElementById('summary-total-liabilities').textContent = `-${formatMoney(totalLiabilities)}`;
  
  const netWealthEl = document.getElementById('summary-net-wealth');
  netWealthEl.textContent = formatMoney(netWealth);

  // Zakat due box updates
  const resultBox = document.getElementById('zakat-result-box');
  const dueValEl = document.getElementById('zakat-due-value');
  const resultMessage = document.getElementById('zakat-result-message');

  let zakatDue = 0;
  
  if (netWealth >= activeNisab) {
    if (STATE.alHawlConfirmed) {
      zakatDue = netWealth * ZAKAT_RATE;
      
      // Update styling to Premium Emerald Green (Met Nisab)
      resultBox.className = "calculation-box p-6 rounded-2xl bg-emerald-600 text-white shadow-lg animate-scale-in transition-all duration-300";
      dueValEl.className = "text-4xl font-extrabold tracking-tight text-white mt-1 mb-2";
      resultMessage.innerHTML = `<span class="flex items-center gap-1.5 text-emerald-100 text-sm font-medium"><svg class="w-4 h-4 text-emerald-200" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg> Your wealth meets the Nisab threshold.</span>`;
    } else {
      zakatDue = 0;
      // Below / warning state (Al-Hawl Unconfirmed)
      resultBox.className = "calculation-box p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm animate-scale-in transition-all duration-300";
      dueValEl.className = "text-4xl font-extrabold tracking-tight text-amber-700 mt-1 mb-2";
      resultMessage.innerHTML = `<span class="text-amber-700 text-sm font-medium">Al-Hawl (lunar year possession) must be confirmed to make Zakat obligatory.</span>`;
    }
  } else {
    zakatDue = 0;
    // Below Nisab state (Blue/Slate layout)
    resultBox.className = "calculation-box p-6 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 shadow-sm animate-scale-in transition-all duration-300";
    dueValEl.className = "text-4xl font-extrabold tracking-tight text-sky-700 mt-1 mb-2";
    resultMessage.innerHTML = `<span class="text-sky-700 text-sm font-medium">Your wealth does not meet the Nisab threshold this year. No Zakat is due, but voluntary charity (Sadaqah) is highly rewarded.</span>`;
  }

  dueValEl.textContent = formatMoney(zakatDue);

  // Sync value overlays inside print report forms
  const printDate = document.getElementById('print-date');
  if (printDate) {
    printDate.textContent = new Date().toLocaleDateString(undefined, { dateStyle: 'long' });
  }

  // Update report overlays in state
  document.getElementById('print-nisab-standard').textContent = `${standardName} Nisab Standard (${formatMoney(activeNisab)})`;
  document.getElementById('print-gold-rate').textContent = formatMoney(STATE.goldPrice);
  document.getElementById('print-silver-rate').textContent = formatMoney(STATE.silverPrice);
  document.getElementById('print-total-assets').textContent = formatMoney(totalAssets);
  document.getElementById('print-total-liabilities').textContent = `-${formatMoney(totalLiabilities)}`;
  document.getElementById('print-net-wealth').textContent = formatMoney(netWealth);
  document.getElementById('print-zakat-due').textContent = formatMoney(zakatDue);
}

// Carousel Functionality
function initCarousel() {
  const track = document.querySelector('.carousel-track');
  const slides = Array.from(document.querySelectorAll('.carousel-slide'));
  const dotsContainer = document.querySelector('.carousel-dots');
  
  if (!track || slides.length === 0) return;

  let currentIndex = 0;
  let timer = null;

  // Render Dots
  dotsContainer.innerHTML = slides.map((_, index) => 
    `<button class="w-2 h-2 rounded-full transition-all duration-300 ${index === 0 ? 'bg-emerald-600 scale-125' : 'bg-slate-300 hover:bg-slate-400'}" data-slide="${index}"></button>`
  ).join('');

  const dots = Array.from(dotsContainer.querySelectorAll('button'));

  function updateCarousel() {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    dots.forEach((dot, index) => {
      if (index === currentIndex) {
        dot.className = "w-2.5 h-2.5 rounded-full bg-emerald-600 scale-125 transition-all duration-300";
      } else {
        dot.className = "w-2 h-2 rounded-full bg-slate-300 hover:bg-slate-400 transition-all duration-300";
      }
    });
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % slides.length;
    updateCarousel();
  }

  function startTimer() {
    stopTimer();
    timer = setInterval(nextSlide, 8000);
  }

  function stopTimer() {
    if (timer) clearInterval(timer);
  }

  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      currentIndex = parseInt(e.target.dataset.slide);
      updateCarousel();
      startTimer();
    });
  });

  track.addEventListener('mouseenter', stopTimer);
  track.addEventListener('mouseleave', startTimer);

  startTimer();
}

// Event Listeners for miscellaneous toggles
function setupEventListeners() {
  // Al-Hawl checkbox
  const hawlCheckbox = document.getElementById('hawl-checkbox');
  if (hawlCheckbox) {
    hawlCheckbox.checked = STATE.alHawlConfirmed;
    hawlCheckbox.addEventListener('change', (e) => {
      STATE.alHawlConfirmed = e.target.checked;
      calculateAll();
    });
  }

  // Smooth scroll links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// Toast System
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-5 right-5 flex flex-col gap-2 z-50';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const colors = {
    success: 'bg-emerald-600 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-slate-700 text-white',
    error: 'bg-rose-600 text-white'
  };

  toast.className = `${colors[type] || colors.success} px-4 py-3 rounded-lg shadow-lg text-sm font-semibold flex items-center gap-2 animate-scale-in transition-all duration-300`;
  toast.innerHTML = `
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'scale-95');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Draft/History Operations
window.saveDraft = function() {
  const timestamp = new Date().toISOString();
  const draftName = `Draft - ${new Date().toLocaleTimeString()} (${new Date().toLocaleDateString()})`;
  
  const draft = {
    id: generateId(),
    name: draftName,
    timestamp,
    state: JSON.parse(JSON.stringify(STATE))
  };

  STATE.history.unshift(draft);
  localStorage.setItem('zakat_calculator_history', JSON.stringify(STATE.history));
  
  showToast('Draft successfully saved to history!');
  loadHistory();
};

function loadHistory() {
  const rawHistory = localStorage.getItem('zakat_calculator_history');
  if (rawHistory) {
    try {
      STATE.history = JSON.parse(rawHistory);
    } catch(e) {
      STATE.history = [];
    }
  } else {
    STATE.history = [];
  }
  renderHistoryModal();
}

window.loadDraftState = function(draftId) {
  const draft = STATE.history.find(h => h.id === draftId);
  if (!draft) return;

  // Load state
  STATE.currency = draft.state.currency;
  STATE.nisabStandard = draft.state.nisabStandard;
  STATE.goldPrice = draft.state.goldPrice;
  STATE.silverPrice = draft.state.silverPrice;
  STATE.assets = JSON.parse(JSON.stringify(draft.state.assets));
  STATE.liabilities = JSON.parse(JSON.stringify(draft.state.liabilities));
  STATE.alHawlConfirmed = draft.state.alHawlConfirmed;

  // Refresh inputs
  document.getElementById('currency-select').value = STATE.currency;
  document.getElementById('gold-price-input').value = STATE.goldPrice;
  document.getElementById('silver-price-input').value = STATE.silverPrice;
  document.getElementById('hawl-checkbox').checked = STATE.alHawlConfirmed;

  // Toggle active tabs
  const goldToggle = document.getElementById('nisab-gold-toggle');
  const silverToggle = document.getElementById('nisab-silver-toggle');
  if (STATE.nisabStandard === 'gold') {
    goldToggle.classList.add('bg-emerald-600', 'text-white');
    goldToggle.classList.remove('bg-slate-100', 'text-slate-700');
    silverToggle.classList.remove('bg-emerald-600', 'text-white');
    silverToggle.classList.add('bg-slate-100', 'text-slate-700');
  } else {
    silverToggle.classList.add('bg-emerald-600', 'text-white');
    silverToggle.classList.remove('bg-slate-100', 'text-slate-700');
    goldToggle.classList.remove('bg-emerald-600', 'text-white');
    goldToggle.classList.add('bg-slate-100', 'text-slate-700');
  }

  renderAssets();
  renderLiabilities();
  calculateAll();
  closeModal('history-modal');
  showToast('Draft loaded successfully!');
};

window.deleteDraft = function(draftId, event) {
  if (event) event.stopPropagation();
  STATE.history = STATE.history.filter(h => h.id !== draftId);
  localStorage.setItem('zakat_calculator_history', JSON.stringify(STATE.history));
  renderHistoryModal();
  showToast('Draft removed.', 'info');
};

function renderHistoryModal() {
  const container = document.getElementById('history-list');
  if (!container) return;

  if (STATE.history.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-slate-400">
        <svg class="w-12 h-12 mx-auto mb-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <p class="text-sm font-medium">No saved drafts found.</p>
        <p class="text-xs mt-1">Calculations you save will appear here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = STATE.history.map(draft => {
    // calculate total assets inside draft
    const totalAssets = draft.state.assets.reduce((sum, a) => sum + (a.total || 0), 0);
    const totalLiabs = draft.state.liabilities.reduce((sum, l) => sum + (l.amount || 0), 0);
    const net = totalAssets - totalLiabs;
    const symbol = CURRENCIES[draft.state.currency].symbol;
    const formattedNet = `${symbol} ${parseFloat(net).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    return `
      <div 
        onclick="loadDraftState('${draft.id}')"
        class="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-emerald-50/50 border border-slate-100 hover:border-emerald-200 rounded-xl cursor-pointer transition-all-300 group"
      >
        <div class="flex-1">
          <h4 class="font-semibold text-slate-800 text-sm group-hover:text-emerald-800 transition-colors">${draft.name}</h4>
          <div class="flex gap-4 mt-1 text-xs text-slate-400">
            <span>Net Wealth: <strong class="text-slate-600">${formattedNet}</strong></span>
            <span>Currency: <strong>${draft.state.currency}</strong></span>
          </div>
        </div>
        <button 
          onclick="deleteDraft('${draft.id}', event)"
          class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all-300"
          title="Delete draft"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    `;
  }).join('');
}

// Modal handling
window.openModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }
};

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
};

// Export Report
window.exportReport = function() {
  // Set printable table rows dynamically before opening print window
  const printAssetsContainer = document.getElementById('print-assets-table-body');
  const printLiabilitiesContainer = document.getElementById('print-liabilities-table-body');

  if (printAssetsContainer) {
    printAssetsContainer.innerHTML = STATE.assets.map(asset => {
      let unitText = '';
      if (asset.unit !== 'Currency') {
        unitText = ` (${asset.amount} ${asset.unit === 'Tolas' ? 'Tolas' : 'g'})`;
      }
      return `
        <tr class="border-b border-slate-100">
          <td class="py-2.5 font-medium text-slate-800">${asset.type}${unitText}</td>
          <td class="py-2.5 text-right font-semibold text-slate-900">${formatMoney(asset.total)}</td>
        </tr>
      `;
    }).join('');
  }

  if (printLiabilitiesContainer) {
    if (STATE.liabilities.length === 0) {
      printLiabilitiesContainer.innerHTML = `
        <tr>
          <td colspan="2" class="py-2.5 text-slate-400 italic text-sm">No deductible liabilities reported.</td>
        </tr>
      `;
    } else {
      printLiabilitiesContainer.innerHTML = STATE.liabilities.map(lib => {
        return `
          <tr class="border-b border-slate-100">
            <td class="py-2.5 text-slate-700">${lib.description || 'Unspecified Debt'}</td>
            <td class="py-2.5 text-right font-semibold text-slate-900">-${formatMoney(lib.amount)}</td>
          </tr>
        `;
      }).join('');
    }
  }

  // Trigger Print Dialog
  window.print();
};
