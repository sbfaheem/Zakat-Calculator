// ZakatFlow Core Logic - SaaS Quality Interactive Experience
// Single source of truth: NisabModule (nisab.js)
// Default audience: Pakistan (Hanafi), default currency PKR, default language Urdu (ur)

const NisabModule = (typeof Nisab !== 'undefined') ? Nisab : (typeof require !== 'undefined' ? require('./nisab.js') : null);

// Unique ID helper
function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

// Canonical Constants
const TOLA_TO_GRAMS = NisabModule ? NisabModule.CONSTANTS.TOLA_TO_GRAMS : 11.664;
const SILVER_NISAB_GRAMS = NisabModule ? NisabModule.CONSTANTS.SILVER_NISAB_GRAMS : 612.36;
const GOLD_NISAB_GRAMS = NisabModule ? NisabModule.CONSTANTS.GOLD_NISAB_GRAMS : 87.48;
const ZAKAT_RATE = NisabModule ? NisabModule.CONSTANTS.ZAKAT_RATE : 0.025;

// Supported Currencies with localized symbols and fallback rates (18 Nov 2026 baseline)
const CURRENCIES = {
  PKR: { symbol: 'Rs', name: 'Pakistani Rupee', gold: 35322.0, silver: 432.8, locale: 'ur-PK' },
  USD: { symbol: '$', name: 'US Dollar', gold: 120.0, silver: 1.44, locale: 'en-US' },
  SAR: { symbol: 'SR', name: 'Saudi Riyal', gold: 450.0, silver: 5.40, locale: 'ar-SA' },
  AED: { symbol: 'AED', name: 'UAE Dirham', gold: 440.0, silver: 5.28, locale: 'ar-AE' },
  GBP: { symbol: '£', name: 'British Pound', gold: 94.0, silver: 1.13, locale: 'en-GB' }
};

// Storage Key for seamless auto-save
const AUTOSAVE_KEY = 'zakatflow_wizard_v2';

// Global Application State
const STATE = {
  language: 'ur',          // Urdu is default
  currency: 'PKR',         // PKR is default
  nisabStandard: 'silver', // Hanafi silver standard default
  goldPrice: CURRENCIES.PKR.gold,
  silverPrice: CURRENCIES.PKR.silver,
  isLivePrice: false,
  pricesLastUpdated: '18 Nov 2026',
  isUserCustomPrices: false,
  currentStep: 1,
  wizard: {
    cashInHand: '',
    bankAccounts: '',
    otherSavings: '',
    moneyOwedToMe: '',
    goldWeight: '',
    goldUnit: 'tola',
    goldCarat: '22',
    silverWeight: '',
    silverUnit: 'tola',
    shopStock: '',
    businessCash: '',
    sharesFunds: '',
    propertyForSale: '',
    debtsDueNow: '',
    unpaidBills: '',
    installmentsThisYear: '',
    hawlAnswer: 'yes' // 'yes' | 'no' | 'notsure'
  },
  history: []
};

// Trilingual Translations Dictionary
const TRANSLATIONS = {
  ur: {
    brand_name: 'زکوٰۃ<span class="text-emerald-600"> فلو</span>',
    brand_name_footer: 'زکوٰۃ<span class="text-emerald-500"> فلو</span>',
    nav_calculator: 'کیلکولیٹر',
    nav_principles: 'شرعی اصول',
    nav_nisab: 'نصاب کی معلومات',
    nav_recipients: 'مصارفِ زکوٰۃ',
    nav_recipients_text: 'زکوٰۃ کس کو مل سکتی ہے؟',
    nav_history: 'محفوظ ڈرافٹس',
    nav_drafts_badge: 'آٹو سیو فعال ہے',
    hero_title: 'اپنے مال کو درستگی اور آسانی کے ساتھ پاک کریں',
    hero_subtitle: 'ایک پرسکون اور آسان زکوٰۃ کیلکولیٹر۔ ہر مرحلے پر آسان عام فہم الفاظ میں رہنمائی، تاکہ بزرگ اور بچے بھی آسانی سے سمجھ سکیں۔',
    hero_badge: 'بنیادی طور پر حنفی چاندی کے نصاب کے مطابق حساب شدہ',
    badge_autosaved: 'خودکار محفوظ (Auto-saved)',
    step_1_tab: 'تعارف',
    step_2_tab: 'نقد رقم',
    step_3_tab: 'سونا چاندی',
    step_4_tab: 'کاروبار',
    step_5_tab: 'قرضے',
    step_6_tab: 'نتیجہ',
    welcome_title: 'خوش آمدید — زکوٰۃ فلو',
    welcome_desc: 'ایک آسان اور پرسکون زکوٰۃ کیلکولیٹر۔ ہم آپ سے ایک وقت میں صرف ایک سوال پوچھیں گے اور آسان الفاظ میں رہنمائی کریں گے۔',
    choose_language_label: '1. زبان منتخب کریں / Choose Language',
    choose_currency_label: '2. اپنی کرنسی منتخب کریں',
    price_banner_fallback: 'لائیو مارکیٹ ریٹ دستیاب نہیں ہے۔ نیچے دیے گئے ریٹس چیک کر لیں۔',
    price_banner_fallback_sub: '18 نومبر 2026 کے تصدیق شدہ ریٹس استعمال کیے جا رہے ہیں۔ آپ اپنے مقامی صرافہ بازار کے مطابق قیمت تبدیل کر سکتے ہیں۔',
    price_last_updated: 'ریٹس کی تاریخ:',
    active_standard_label: 'فعال معیار:',
    active_standard_silver: 'چاندی (حنفی / پاکستان)',
    active_standard_gold: 'سونے کا معیار',
    silver_price_label: 'چاندی کی موجودہ قیمت (فی گرام)',
    gold_price_label: 'خالص 24K سونے کی قیمت (فی گرام)',
    silver_price_hint: 'تبدیل کیا جا سکتا ہے۔ چاندی کا نصاب: 52.5 تولہ = 612.36 گرام',
    gold_price_hint: 'تبدیل کیا جا سکتا ہے۔ سونے کا نصاب: 7.5 تولہ = 87.48 گرام',
    threshold_silver_label: 'چاندی کے نصاب کی حد:',
    threshold_gold_label: 'سونے کے نصاب کی حد:',
    advanced_nisab_title: '⚙️ ایڈوانسڈ: نصاب کا معیار تبدیل کریں (سونا / چاندی)',
    advanced_show: 'تفصیل دیکھیں',
    advanced_hide: 'چھپائیں',
    nisab_switch_explanation: '<strong>چاندی کا نصاب کیوں بنیادی ہے؟</strong> چاندی کا نصاب (612.36 گرام) کم مالیت پر بنتا ہے (تقریباً 2 لاکھ 65 ہزار روپے بمقابلہ سونے کے 30 لاکھ روپے)۔ پاکستان کے علماء چاندی کے نصاب کی پرزور سفارش کرتے ہیں تاکہ زیادہ ضرورت مندوں کی مدد ہو سکے۔ اگر آپ کے پاس صرف سونا ہو تو بعض علماء سونے کے نصاب کی اجازت دیتے ہیں۔',
    choose_standard_prompt: 'معیار منتخب کریں:',
    nisab_toggle_silver: 'چاندی (سفارش شدہ)',
    nisab_toggle_gold: 'سونے کا معیار',
    btn_start_wizard: 'حساب شروع کریں: نقد رقم اور بینک ←',
    cash_step_title: 'گھر اور بینک میں موجود نقد رقم',
    cash_step_subtitle: 'وہ تمام نقدی، بینک بیلنس اور یقینی ملنے والی رقم درج کریں جو آپ کے پاس ہے۔',
    label_cash_in_hand: 'گھر پر یا بٹوے میں موجود نقد رقم',
    hint_cash_in_hand: 'جیب، گھر کی الماری، تجوری یا دراز میں پڑی کل رقم۔',
    label_bank_accounts: 'بینک اکاؤنٹس (کرنٹ اور سیونگز)',
    hint_bank_accounts: 'تمام بینک کھاتوں میں آج کی تاریخ کا موجودہ بیلنس۔',
    label_other_savings: 'دیگر بچت، کمیٹیاں، پرائز بانڈز',
    hint_other_savings: 'بی سی/کمیٹیوں کی جمع رقم، قومی بچت اسکیم کے سرٹیفکیٹ، یا غیر ملکی کرنسی۔',
    label_money_owed_to_me: 'وہ رقم جو دوسروں سے مجھے واپس ملنی ہے',
    hint_money_owed_to_me: 'صرف وہ قرض جو آپ کو واپس ملنے کی پکی امید ہے۔ ڈوبے ہوئے قرضے شامل نہ کریں۔',
    subtotal_cash_label: 'کل نقد رقم اور بچت:',
    btn_back: '→ واپسی',
    btn_next_gold: 'اگلا مرحلہ: سونا اور چاندی ←',
    gold_step_title: 'سونا اور چاندی',
    gold_step_subtitle: 'تولہ، گرام یا اونس میں وزن درج کریں اور کیرٹ (خالص پن) منتخب کریں۔',
    note_jewelry_title: 'زیورات کے متعلق شرعی رہنمائی:',
    note_jewelry_body: 'حنفی مسلک (جو پاکستان میں عام ہے) کے مطابق پہننے والے زیورات پر بھی زکوٰۃ فرض ہے۔ دیگر بعض فقہاء کے نزدیک صرف سرمایہ کاری والے سونے پر ہے۔ اگر آپ کے پاس صرف استعمالی زیور ہے اور آپ دوسرا موقف اختیار کرنا چاہتے ہیں تو آپ آزاد ہیں۔',
    section_gold_title: 'سونے کی ملکیت',
    section_silver_title: 'چاندی کی ملکیت',
    label_weight: 'وزن',
    col_unit: 'اکائی',
    label_carat: 'کیرٹ / خالص پن',
    pure_gold_equiv: 'خالص 24K سونے کے برابر:',
    assessed_value: 'معینہ مالیت:',
    subtotal_precious_label: 'کل سونا اور چاندی:',
    btn_next_business: 'اگلا مرحلہ: کاروبار اور سرمایہ کاری ←',
    business_step_title: 'کاروباری سامان اور سرمایہ کاری',
    business_step_subtitle: 'دکان کا تجارتی مال، شیئرز، اور فروخت کی نیت سے خریدی گئی جائیداد۔',
    note_exempt_title: '✓ زکوٰۃ سے مستثنیٰ اشیاء (ان کو شامل نہ کریں):',
    note_exempt_body: 'جس مکان میں آپ رہتے ہیں، آپ کی ذاتی گاڑی، گھر کا فرنیچر، برتن، کپڑے اور کام کے اوزار زکوٰۃ سے بالکل معاف ہیں۔',
    label_shop_stock: 'دکان یا گودام میں برائے فروخت تجارتی مال',
    hint_shop_stock: 'حساب کے دن ہول سیل لاگت پر تخمینہ لگائیں۔ دکان کے فرنیچر یا الماریوں پر زکوٰۃ نہیں ہے۔',
    label_business_cash: 'کاروباری نقد رقم اور کاروباری بینک اکاؤنٹس',
    hint_business_cash: 'کاروباری اخراجات، مال خریدنے یا تنخواہوں کے لیے رکھی گئی نقدی۔',
    label_shares_funds: 'کمپنیوں کے شیئرز اور میوچل فنڈز',
    hint_shares_funds: 'ٹریڈنگ والے شیئرز کی موجودہ مارکیٹ قیمت؛ طویل مدتی شیئرز کے نقد و مال تجارت کا تناسب۔',
    label_property_for_sale: 'فروخت کے ارادے سے خریدے گئے پلاٹ یا جائیداد',
    hint_property_for_sale: 'صرف وہ پلاٹ یا مکان جو خالصتاً آگے منافع پر بیچنے کی نیت سے خریدے گئے ہوں۔',
    subtotal_business_label: 'کل کاروبار اور سرمایہ کاری:',
    btn_next_debts: 'اگلا مرحلہ: واجب الادا قرضے ←',
    debts_step_title: 'وہ رقم جو آپ نے دوسروں کو دینی ہے',
    debts_step_subtitle: 'صرف وہ قرضے اور بل منہا کریں جو فوری طور پر یا موجودہ سال میں واجب الادا ہیں۔',
    note_debts_title: 'قرضوں کے متعلق شرعی اصول:',
    note_debts_body: 'صرف وہ قرضے منہا کیے جا سکتے ہیں جو فوری طور پر یا موجودہ قمری سال (12 ماہ) میں دینے ہوں۔ لمبی مدت والے قرضوں کی کل رقم منہا نہیں کی جا سکتی۔',
    label_debts_due_now: 'ذاتی قرضے جو ابھی واپس کرنے ہیں',
    hint_debts_due_now: 'رشتہ داروں، دوستوں یا اداروں سے لیا گیا وہ قرض جو ابھی ادا کرنا لازم ہے۔',
    label_unpaid_bills: 'واجب الادا گھر کا کرایہ، بجلی گیس کے بل یا تنخواہیں',
    hint_unpaid_bills: 'پچھلے مہینے کا باقی کرایہ، واجب الادا بلز یا ملازمین کی تنخواہ۔',
    label_installments_this_year: 'قرضے کی وہ قسطیں جو اس قمری سال کے اندر دینی ہیں',
    hint_installments_this_year: 'صرف اگلے 12 ماہ کے اندر ادا ہونے والی قسطوں کا مجموعہ درج کریں۔',
    subtotal_debts_label: 'کل منہا ہونے والے قرضے:',
    btn_view_result: 'زکوٰۃ کا حتمی نتیجہ دیکھیں ←',
    result_step_title: 'آپ کا حتمی زکوٰۃ نتیجہ',
    result_step_subtitle: 'آپ کی دولت کی تطہیر کا مکمل اور شفاف حساب۔',
    hawl_question: 'کیا آپ کے پاس یہ رقم یا سونا پورے ایک اسلامی قمری سال سے موجود ہے؟',
    hawl_question_sub: 'زکوٰۃ صرف اسی مال پر فرض ہوتی ہے جس پر نصاب کی مقدار مکمل ہونے کے بعد ایک قمری سال (354 دن) گزر چکا ہو۔',
    hawl_yes: 'ہاں (پورا سال گزرا ہے)',
    hawl_no: 'نہیں (سال نہیں گزرا)',
    hawl_notsure: 'یقین نہیں ہے (?)',
    hawl_notsure_guide_title: 'اگر سال گزرنے کا یقین نہ ہو تو کیا کریں؟',
    hawl_notsure_guide_body: 'اگر آپ کو صحیح دن یاد نہیں جب آپ کی بچت پہلی بار نصاب تک پہنچی تھی، تو فقہاء کا مشورہ ہے کہ آپ سال کا کوئی ایک بابرکت اسلامی دن (جیسے یکم رمضان یا یکم محرم) اپنی زکوٰۃ کا سالانہ دن مقرر کر لیں۔ اس دن جتنا مال موجود ہو اس کی زکوٰۃ ادا کر دیں۔ اس طرح آپ کا فریضہ ادا ہو جائے گا اور آئندہ کے لیے ہر سال وہی مستقل تاریخ رہے گی۔',
    btn_choose_pay_now: 'میں ابھی زکوٰۃ ادا کروں گا (ہاں شمار کریں)',
    btn_choose_wait: 'میں سال مکمل ہونے کا انتظار کروں گا (نہیں شمار کریں)',
    result_headline: 'کل واجب الادا زکوٰۃ (2.5%)',
    story_title: 'آپ کے حساب کی آسان کہانی',
    breakdown_heading: 'مال اور اخراجات کی تفصیل',
    recipients_banner_title: 'میری زکوٰۃ کن لوگوں کو مل سکتی ہے؟',
    recipients_banner_subtitle: 'قرآن مجید کے بتائے ہوئے 8 شرعی مصارف اور ان رشتہ داروں کی تفصیل جنہیں زکوٰۃ نہیں دی جا سکتی۔',
    btn_view_recipients: '8 شرعی مصارف دیکھیں',
    recipients_modal_title: 'زکوٰۃ کن لوگوں کو دی جا سکتی ہے؟',
    recipients_modal_subtitle: 'قرآن مجید کے بیان کردہ آٹھ مستحقین (سورہ التوبہ 9:60)',
    recipients_verse_quote: '\"زکوٰۃ تو بس فقیروں اور مسکینوں اور زکوٰۃ کے کام پر مقرر لوگوں کا حق ہے اور ان کا جن کی تالیفِ قلب مقصود ہو اور غلاموں کے آزاد کرانے میں اور قرض داروں کے قرضے میں اور اللہ کی راہ میں اور مسافروں کے لیے — یہ اللہ کی طرف سے مقرر کردہ فریضہ ہے، اور اللہ سب کچھ جاننے والا، بڑی حکمت والا ہے۔\"',
    recipients_verse_source: '— سورہ التوبہ 9:60',
    cat_1_title: '۱۔ فقراء (غریب و نادار لوگ)',
    cat_1_desc: 'وہ مجبور افراد جن کے پاس کوئی ذریعہ معاش یا دولت نہیں ہے اور وہ بنیادی ضروریات (روٹی، کپڑا، مکان) پوری کرنے سے قاصر ہیں۔',
    cat_2_title: '۲۔ مساکین (ضرورت مند محنت کش)',
    cat_2_desc: 'وہ محنت کش افراد جن کی معمولی آمدنی ہے لیکن وہ گھریلو اخراجات کے لیے ناکافی ہے اور ان کی ملکیت نصاب سے کم ہے۔',
    cat_3_title: '۳۔ عاملین (زکوٰۃ جمع اور تقسیم کرنے والے)',
    cat_3_desc: 'وہ امانت دار افراد جنہیں حکومت یا اسلامی ادارے زکوٰۃ کی وصولی، حساب اور تقسیم کی ذمہ داری سونپتے ہیں۔',
    cat_4_title: '۴۔ مؤلفۃ القلوب (دلجوئی کے مستحق افراد)',
    cat_4_desc: 'وہ نو مسلم جنہیں مالی پریشانی کا سامنا ہو اور ان کی دلجوئی اور اسلام پر استقامت کے لیے مدد ضروری ہو۔',
    cat_5_title: '۵۔ فی الرقاب (قیدیوں اور غلاموں کی رہائی)',
    cat_5_desc: 'مجبور قیدیوں، جبری مشقت یا انسانی اسمگلنگ کے شکار افراد کو تاوان ادا کر کے آزاد کرانا۔',
    cat_6_title: '۶۔ غارمین (قرض کے بوجھ تلے دبے افراد)',
    cat_6_desc: 'وہ افراد جو علاج معالجے، ناگہانی آفت یا بنیادی ضرورت کے باعث قرض کے نیچے دب گئے ہوں اور ادائیگی کی کوئی صورت نہ ہو۔',
    cat_7_title: '۷۔ فی سبیل اللہ (اللہ کی راہ میں)',
    cat_7_desc: 'دینِ اسلام کی خدمت، اشاعتِ علم، دینی طلباء اور رفاہی کاموں میں مخلصانہ جدوجہد کرنے والے۔',
    cat_8_title: '۸۔ ابن السبیل (مسافر جو بے یار و مددگار ہو)',
    cat_8_desc: 'وہ مسافر جو سفر کے دوران رقم ختم ہو جانے یا لٹ جانے کے باعث پھنس گیا ہو، چاہے وہ اپنے وطن میں صاحبِ حیثیت ہی کیوں نہ ہو۔',
    recipients_ineligible_title: 'وہ افراد جنہیں آپ اپنی زکوٰۃ نہیں دے سکتے:',
    ineligible_1: '<strong>اپنے اصول:</strong> والدین، دادا، دادی، نانا، نانی (ان کی مالی دیکھ بھال آپ کا براہِ راست ذاتی فرض ہے)۔',
    ineligible_2: '<strong>اپنی فروع:</strong> بیٹا، بیٹی، پوتا، پوتی، نواسہ، نواسی۔',
    ineligible_3: '<strong>شریکِ حیات:</strong> شوہر اپنی بیوی کو یا بیوی اپنے شوہر کو زکوٰۃ نہیں دے سکتی۔',
    ineligible_4: '<strong>صاحبِ نصاب لوگ:</strong> جس شخص کے پاس نصاب کی مقدار رقم یا سونا چاندی موجود ہو۔',
    ineligible_5: '<strong>تعمیراتی کام:</strong> مسجد کی تعمیر، قبرستان، سڑکیں یا رفاہی ادارے جہاں کسی مستحق غریب کو مال کا بلا شرکت غیرے مالک نہ بنایا جائے۔',
    btn_export: 'رپورٹ PDF ڈاؤن لوڈ کریں',
    btn_share_whatsapp: 'واٹس ایپ پر شیئر کریں',
    btn_start_again: 'دوبارہ شروع کریں',
    live_zakat_bar_title: 'اب تک آپ کی زکوٰۃ',
    btn_jump_result: 'نتیجہ دیکھیں',
    help_link: 'رہنمائی',
    btn_understood: 'سمجھ گیا',
    btn_close: 'بند کریں',
    btn_close_guide: 'گائیڈ بند کریں',
    insights_title: 'زکوٰۃ ادا کرنے کے فضائل و برکات',
    insight_1_quote: '"بے شک جو لوگ ایمان لائے اور انہوں نے نیک اعمال کیے اور نماز قائم کی اور زکوٰۃ دی، ان کا اجر ان کے رب کے پاس ہے، اور ان پر نہ کوئی خوف ہوگا اور نہ وہ غمگین ہوں گے۔"',
    insight_1_source: '— سورہ البقرة 2:277',
    insight_2_quote: '"کوئی دن ایسا نہیں جاتا جس میں بندے صبح کو اٹھتے ہوں مگر دو فرشتے آسمان سے نازل ہوتے ہیں۔ ان میں سے ایک کہتا ہے: اے اللہ! خرچ کرنے والے کو اس کا نعم البدل عطا فرما۔"',
    insight_2_source: '— صحیح البخاری 1442',
    insight_3_quote: '"آپ ان کے اموال میں سے صدقہ (زکوٰۃ) لے لیجئے جس کے ذریعے آپ انہیں پاک اور صاف کر دیں، اور ان کے حق میں دعا کیجیے۔"',
    insight_3_source: '— سورہ التوبہ 9:103',
    insight_4_quote: '"اور صدقہ (گناہوں کی) آگ کو ایسے بجھا دیتا ہے جیسے پانی آگ کو بجھاتا ہے۔"',
    insight_4_source: '— سنن الترمذی 614',
    footer_desc: 'درست حساب کتاب اور دولت کی پاکیزگی کے لیے ایک جدید ڈیجیٹل پلیٹ فارم۔ جو روحانی درستگی اور باہمی ترقی کے لیے وقف ہے۔',
    footer_categories_title: 'زکوٰۃ کے آٹھ مصارف',
    footer_categories_text: '"زکوٰۃ تو بس فقیروں اور مسکینوں اور زکوٰۃ کے کام پر مقرر لوگوں کا حق ہے اور ان کا جن کی تالیفِ قلب مقصود ہو اور غلاموں کے آزاد کرانے میں اور قرض داروں کے قرضے میں اور اللہ کی راہ میں اور مسافروں کے لیے..."',
    footer_categories_source: '— سورہ التوبہ 9:60',
    footer_resources: 'وسائل و مراجع',
    footer_terms: 'شرائطِ سروس',
    footer_privacy: 'رازداری کی پالیسی',
    footer_contact: 'سپورٹ سے رابطہ',
    footer_copyright: '&copy; 2026 زکوٰۃ فلو۔ روحانی درستگی اور باہمی ترقی کے لیے وقف ہے۔',
    print_title: 'شرعی زکوٰۃ کیلکولیشن رپورٹ',
    print_subtitle: 'روحانی درستگی اور مالی شفافیت۔ حساب کی تاریخ: ',
    print_heading_summary: 'رپورٹ کا خلاصہ',
    print_heading_assets: 'اثاثوں کی تفصیل',
    print_heading_liabs: 'منہا واجبات کی تفصیل',
    print_asset_item: 'اثاثہ کا نام',
    print_val_assessed: 'معینہ مالیت',
    print_liab_desc: 'واجبات کی تفصیل',
    print_amount_deducted: 'منہا شدہ رقم',
    print_total_eligible: 'کل قابلِ زکوٰۃ اثاثے:',
    print_final_due: 'کل واجب الادا زکوٰۃ (2.5%):',
    print_declaration: 'یہ تخمینہ صرف رہنمائی کے لیے ہے۔ اپنے مخصوص حالات کے لیے براہِ کرم مستند مفتی یا عالمِ دین سے رجوع فرمائیں۔',
    modal_principles_title: 'اسلامی زکوٰۃ کے شرعی اصول',
    modal_principles_p1_title: '۱۔ نصاب کا اصول (فرضیت کی حد)',
    modal_principles_p1_body: 'زکوٰۃ صرف اسی صورت میں فرض ہوتی ہے جب آپ کی کل خالص دولت نصاب کی حد سے زیادہ ہو۔ نصاب کا معیار 87.48 گرام خالص سونا یا 612.36 گرام خالص چاندی کی مارکیٹ قیمت کے برابر ہے۔ اگر آپ کی دولت نصاب سے کم ہو تو زکوٰۃ فرض نہیں ہوتی، تاہم نفلی صدقات کی ترغیب دی گئی ہے۔',
    modal_principles_p2_title: '۲۔ الحول کا اصول (سال بھر ملکیت ہونا)',
    modal_principles_p2_body: 'زکوٰۃ کے واجب ہونے کے لیے اثاثوں کا ایک مکمل قمری سال (354 دن) تک آپ کے قبضے اور ملکیت میں رہنا ضروری ہے۔ اگر سال کے دوران رقم کم زیادہ ہو لیکن حدِ نصاب سے اوپر رہے، تو حساب کے دن زکوٰۃ فرض ہوگی۔ سنن ابن ماجہ کی حدیث ہے: "کسی مال پر زکوٰۃ فرض نہیں جب تک اس پر ایک سال نہ گزر جائے"۔',
    modal_principles_p3_title: '۳۔ زکوٰۃ کی شرح (2.5%)',
    modal_principles_p3_body: 'زکوٰۃ کی فرض رقم کل خالص اثاثوں کے ٹھیک 2.5 فیصد (چالیسواں حصہ) کے حساب سے لگائی جاتی ہے۔ یہ شرح نقد رقم، تجارتی سامان، حصص (شیئرز) اور سونے چاندی پر نافذ ہوتی ہے۔',
    modal_principles_p4_title: '۴۔ منہا ہونے والے واجبات (قرضے)',
    modal_principles_p4_body: 'اسلامی اصولوں کے مطابق، آپ اپنے اثاثوں میں سے ایسے قرضے منہا کر سکتے ہیں جو فوری طور پر یا موجودہ سال کے اندر واجب الادا ہوں۔ طویل مدتی قرضے (جیسے ہاؤسنگ فنانس کی بقایا قسطیں) منہا نہیں کی جاتیں۔',
    modal_principles_p5_title: '۵۔ آٹھ مصارف (سورہ التوبہ 9:60)',
    modal_principles_p5_body: 'زکوٰۃ کی رقم مساجد کی تعمیر یا عوامی فلاحی کاموں میں خرچ نہیں کی جا سکتی۔ یہ صرف قرآن مجید کے طے کردہ آٹھ مصارف پر خرچ ہونی چاہیے: یعنی فقراء، مساکین، زکوٰۃ وصول کرنے والے ملازمین، تالیفِ قلب، غلاموں کو آزاد کرانا، قرض داروں کی مدد، اللہ کی راہ میں (مجاہدین/طلباء)، اور مسافروں کے لیے۔',
    modal_nisab_title: 'حدِ نصاب کی شرعی تفصیل',
    modal_nisab_p1: 'نصاب سے مراد وہ کم سے کم رقم یا مال ہے جس کا مالک ہونے پر مسلمان پر زکوٰۃ فرض ہوتی ہے، بشرطیکہ اس پر ایک قمری سال گزر چکا ہو۔',
    modal_nisab_f1: 'نصاب کی مقدار کا فارمولا',
    modal_nisab_f_gold: '• سونے کا نصاب: 87.48 گرام (تقریباً 7.5 تولہ)',
    modal_nisab_f_silver: '• چاندی کا نصاب: 612.36 گرام (تقریباً 52.5 تولہ)',
    modal_nisab_rec: 'علماء کی سفارش: اگرچہ دونوں نصاب شرعی طور پر جائز ہیں، لیکن موجودہ دور کے نامور فقہاء اور مجالسِ افتاء چاندی کے نصاب کو بنیاد بنانے کی پرزور سفارش کرتے ہیں۔ چونکہ چاندی کی قیمت سونے کے مقابلے میں بہت کم ہے، اس لیے چاندی کا نصاب زکوٰۃ کی فرضیت کی حد کو نیچے لاتا ہے، جس سے زیادہ لوگ زکوٰۃ دینے کے قابل ہوتے ہیں اور غریبوں و محتاجوں کا زیادہ سے زیادہ فائدہ ہوتا ہے۔',
    btn_start_over: 'دوبارہ شروع کریں / ری سیٹ',
    summary_net_wealth: 'خالص قابلِ زکوٰۃ دولت',
    threshold_val_label: 'نصاب کی حد',
    nisab_card_title: 'نصاب کا معیار',
    summary_liabilities: 'منہا واجبات و قرضے',
    modal_history_title: 'حسابات کی تاریخ',
    btn_read_aloud: 'سنیں (آواز میں)',
    btn_stop_reading: 'آواز بند کریں',
    text_size_label: 'تحریر کا سائز',
    text_size_sm: 'چھوٹا',
    text_size_md: 'عام',
    text_size_lg: 'بڑا',
    voice_unavailable_toast: 'آپ کے ڈیوائس پر اس زبان کے لیے آواز دستیاب نہیں ہے۔ آپ اسکرین پر موجود رہنمائی پڑھ سکتے ہیں۔',
    voice_speaking_toast: 'آواز میں پڑھا جا رہا ہے...',
    privacy_line: 'آپ کا مالی ڈیٹا صرف آپ کے ڈیوائس پر رہتا ہے۔ ہم آپ کا ڈیٹا محفوظ نہیں کرتے۔',
    print_prices_date_label: 'قیمتوں کی تاریخ و صورتحال',
    modal_terms_title: 'شرائطِ استعمال (Terms of Service)',
    modal_privacy_title: 'رازداری کی پالیسی (Privacy Policy)',
    modal_support_title: 'مدد اور رابطہ (Support & Guidance)',
    terms_body_1: 'زکوٰۃ فلو ایک غیر تجارتی، مفت اور جدید ڈیجیٹل کیلکولیشن ٹول ہے جو عام فہم اور پرسکون انداز میں آپ کے مالی اثاثوں اور زکوٰۃ کی شرح کا تخمینہ فراہم کرتا ہے۔',
    terms_body_2: 'یہ حساب حنفی فقہی اصولوں اور چاندی کے بنیادی نصاب پر مبنی ہے۔ یہ عمومی رہنمائی کے لیے ہے اور کسی مخصوص پیچیدہ قانونی یا وراثتی معاملے میں انفرادی شرعی فتوے کا نعم البدل نہیں ہے۔',
    privacy_body_1: '<strong>رازداری کی مکمل ضمانت:</strong> آپ کے تمام مالی اعداد و شمار، کیش، سونا، چاندی، بینک بیلنس اور کاروباری معلومات مکمل طور پر صرف آپ کے براؤزر میں پروسیس ہوتی ہیں۔',
    privacy_body_2: 'ہم آپ کے کسی بھی مالی ڈیٹا کو اپنے کسی سرور یا ڈیٹا بیس میں محفوظ یا منتقل نہیں کرتے۔ سونا اور چاندی کی قیمتیں ایک گمنام پبلک سرور روٹ کے ذریعے حاصل کی جاتی ہیں جس میں صارف کی کوئی ذاتی معلومات شامل نہیں ہوتیں۔',
    support_body_1: 'اگر آپ کو حساب کتاب میں کوئی ابہام ہو یا آپ کوئی مشورہ دینا چاہتے ہیں تو آپ گٹ ہب (GitHub) کے ذریعے ہم سے رابطہ کر سکتے ہیں۔',
    support_body_2: 'پیچیدہ یا غیر معمولی شرعی مسائل کے لیے براہِ کرم اپنے مقامی دار الافتاء یا مستند عالمِ دین سے رجوع فرمائیں۔'
  },
  en: {
    brand_name: 'Zakat<span class="text-emerald-600">Flow</span>',
    brand_name_footer: 'Zakat<span class="text-emerald-500">Flow</span>',
    nav_calculator: 'Calculator',
    nav_principles: 'Principles',
    nav_nisab: 'Nisab Info',
    nav_history: 'Saved Drafts',
    nav_drafts_badge: 'Auto-save Active',
    hero_title: 'Purify Your Wealth with Precision & Peace of Mind',
    hero_subtitle: 'A serene, simple, SaaS-quality Zakat calculator designed for everyone: beginners, elders, and families.',
    hero_badge: 'Calculated using the Hanafi silver nisab by default.',
    badge_autosaved: 'Saved Automatically',
    step_1_tab: 'Welcome',
    step_2_tab: 'Cash',
    step_3_tab: 'Gold/Silver',
    step_4_tab: 'Business',
    step_5_tab: 'Debts',
    step_6_tab: 'Result',
    welcome_title: 'Welcome to ZakatFlow',
    welcome_desc: 'A serene, simple, and spiritually precise calculator. We guide you step by step with plain everyday words.',
    choose_language_label: '1. Choose Language / زبان منتخب کریں',
    choose_currency_label: '2. Choose Currency / اپنی کرنسی منتخب کریں',
    price_banner_fallback: 'Live price unavailable. Please check the price below.',
    price_banner_fallback_sub: 'Using verified seed rates from 18 Nov 2026. You can edit the prices to match your local market.',
    price_last_updated: 'Prices last updated:',
    active_standard_label: 'Active Standard:',
    active_standard_silver: 'Silver (Hanafi / Pakistan)',
    active_standard_gold: 'Gold Standard',
    silver_price_label: 'Silver Price (per gram)',
    gold_price_label: '24K Gold Price (per gram)',
    silver_price_hint: 'Editable. Silver Nisab: 52.5 tolas = 612.36 grams',
    gold_price_hint: 'Editable. Gold Nisab: 7.5 tolas = 87.48 grams',
    threshold_silver_label: 'Silver Nisab Threshold:',
    threshold_gold_label: 'Gold Nisab Threshold:',
    advanced_nisab_title: '⚙️ Advanced: Change Nisab Standard (Gold / Silver)',
    advanced_show: 'Show details',
    advanced_hide: 'Hide',
    nisab_switch_explanation: '<strong>Why Silver is default:</strong> The Silver standard (612.36g) gives a lower threshold (about Rs 265,000 vs Rs 3,000,000 for gold). Most scholars in Pakistan advise using Silver so more families in need can receive help. If you own only gold and no cash or silver, some scholars allow using the Gold standard.',
    choose_standard_prompt: 'Choose Standard:',
    nisab_toggle_silver: 'Silver (Recommended)',
    nisab_toggle_gold: 'Gold Standard',
    btn_start_wizard: 'Start Calculation: Cash & Bank →',
    cash_step_title: 'Cash at home and in the bank',
    cash_step_subtitle: 'Enter all paper currency, bank balances, and reliable money owed to you.',
    label_cash_in_hand: 'Cash at home or in wallet',
    hint_cash_in_hand: 'All cash in pockets, safe, wallet, or drawers.',
    label_bank_accounts: 'Bank accounts (Current and Savings)',
    hint_bank_accounts: 'Total current balance across all checking and savings accounts.',
    label_other_savings: 'Other savings, committees, prize bonds',
    hint_other_savings: 'BC/committees saved, National Savings certificates, or foreign currency cash.',
    label_money_owed_to_me: 'Money others owe me (expected to receive)',
    hint_money_owed_to_me: 'Only count good loans you expect to be repaid. Doubtful bad debts are not counted.',
    subtotal_cash_label: 'Total Cash & Savings:',
    btn_back: '← Back',
    btn_next_gold: 'Next: Gold & Silver →',
    gold_step_title: 'Gold and Silver',
    gold_step_subtitle: 'Enter gold and silver in any weight (tolas, grams, or ounces) and select its carat purity.',
    note_jewelry_title: 'Scholarly Note on Jewelry:',
    note_jewelry_body: 'In the Hanafi school (practiced widely in Pakistan), Zakat is due on all gold and silver, including worn personal jewelry. Some other schools exempt personal use jewelry. If you follow that view, you may enter only investment gold/silver.',
    section_gold_title: 'Gold Holdings',
    section_silver_title: 'Silver Holdings',
    label_weight: 'Weight',
    col_unit: 'Unit',
    label_carat: 'Carat / Purity',
    pure_gold_equiv: 'Pure Gold Equivalent:',
    assessed_value: 'Assessed Value:',
    subtotal_precious_label: 'Total Gold & Silver:',
    btn_next_business: 'Next: Business & Investments →',
    business_step_title: 'Business goods and investments',
    business_step_subtitle: 'Enter trade inventory, business cash, shares, and real estate purchased for resale.',
    note_exempt_title: '✓ Exempt from Zakat (Do NOT include):',
    note_exempt_body: 'The house you live in, your personal family car, household furniture, personal appliances, and tools of trade are completely exempt from Zakat.',
    label_shop_stock: 'Shop merchandise and inventory for sale',
    hint_shop_stock: 'Valued at wholesale cost on calculation date. Do not count store fixtures or shelves.',
    label_business_cash: 'Business cash and business bank accounts',
    hint_business_cash: 'Cash held for operating expenses, payroll, or supplier payments.',
    label_shares_funds: 'Shares, stocks, and mutual funds',
    hint_shares_funds: 'Active trading shares at current market value; long-term dividend shares on their zakatable liquid assets proportion.',
    label_property_for_sale: 'Plots or property purchased to resell',
    hint_property_for_sale: 'Only property purchased with active intention to resell for commercial profit.',
    subtotal_business_label: 'Total Business & Investments:',
    btn_next_debts: 'Next: Money You Owe →',
    debts_step_title: 'Money you owe others',
    debts_step_subtitle: 'Only subtract debts and bills due right now or within the current lunar year.',
    note_debts_title: 'Important Islamic Rule on Debts:',
    note_debts_body: 'You may only deduct debts due immediately or within the current 12-month lunar year. Long-term loans (like a 20-year mortgage balance) cannot be deducted in full.',
    label_debts_due_now: 'Personal loans and debts due immediately',
    hint_debts_due_now: 'Money you borrowed from relatives, friends, or lenders that must be paid back now.',
    label_unpaid_bills: 'Unpaid rent, utility bills, or staff salaries due now',
    hint_unpaid_bills: 'Overdue house rent, pending electricity/gas bills, or due salaries of home/office staff.',
    label_installments_this_year: 'Loan installments due within this lunar year (next 12 months)',
    hint_installments_this_year: 'Only the sum of installments falling due in the next 12 months.',
    subtotal_debts_label: 'Total Deductible Debts:',
    btn_view_result: 'View Zakat Result →',
    result_step_title: 'Your Zakat Calculation Result',
    result_step_subtitle: 'Complete spiritual assessment of your wealth purification obligation.',
    hawl_question: 'Have you owned this much wealth for a full Islamic lunar year?',
    hawl_question_sub: 'Zakat only becomes obligatory after 1 full lunar year (354 days) has passed over wealth above Nisab.',
    hawl_yes: 'Yes (Full year completed)',
    hawl_no: 'No (Not a full year yet)',
    hawl_notsure: 'Not Sure (?)',
    hawl_notsure_guide_title: 'What to do if you are not sure:',
    hawl_notsure_guide_body: 'If you do not know the exact day your savings first reached the nisab, scholars advise picking one Islamic date (such as 1st of Ramadan or 1st of Muharram) as your personal Zakat day every year. If you have this much wealth on that day, calculate and pay your Zakat. This fixes your date for all future years.',
    btn_choose_pay_now: 'I will pay my Zakat now (Count as Yes)',
    btn_choose_wait: 'I will wait to complete my year (Count as No)',
    result_headline: 'Total Zakat Obligation (2.5%)',
    story_title: 'The Short Story of Your Calculation',
    breakdown_heading: 'Wealth & Deductions Breakdown',
    recipients_banner_title: 'Who can receive your Zakat?',
    recipients_banner_subtitle: 'Learn about the 8 Quranic categories of eligible recipients and who is exempt.',
    btn_view_recipients: 'View 8 Categories',
    recipients_modal_title: 'Who Can Receive My Zakat?',
    recipients_modal_subtitle: 'The 8 Quranic Categories (Surah At-Tawbah 9:60)',
    recipients_verse_quote: '"Zakat expenditures are only for the poor and for the needy and for those employed to collect it and for bringing hearts together and for freeing captives and for those in debt and for the cause of Allah and for the [stranded] traveler — an obligation ordained by Allah. And Allah is Knowing and Wise."',
    recipients_verse_source: '— Surah At-Tawbah 9:60',
    cat_1_title: '1. The Poor (Al-Fuqara)',
    cat_1_desc: 'Families who have virtually no income or wealth, and cannot afford basic food, clothing, or shelter.',
    cat_2_title: '2. The Needy (Al-Masakin)',
    cat_2_desc: 'People who work or have a small income, but it does not meet basic essential family costs and they possess less than Nisab.',
    cat_3_title: '3. Zakat Collectors (Al-Amilina Alayha)',
    cat_3_desc: 'Trustworthy workers authorized by official or community bodies to collect, account for, and distribute Zakat funds.',
    cat_4_title: '4. Reconciling Hearts (Al-Mu\'allafatu Qulubuhum)',
    cat_4_desc: 'New Muslims in need of community welcome, encouragement, and relief from economic hardship.',
    cat_5_title: '5. Freeing Captives (Fir-Riqab)',
    cat_5_desc: 'Freeing people from human trafficking, bonded labor exploitation, or unjust captivity.',
    cat_6_title: '6. Burdened Debtors (Al-Gharimin)',
    cat_6_desc: 'People burdened by overwhelming debts incurred for basic survival, medical emergencies, or disasters, with no means to repay.',
    cat_7_title: '7. In Allah\'s Cause (Fi Sabilillah)',
    cat_7_desc: 'Those engaged in the advancement of religious knowledge, Islamic scholars/students, and community welfare striving in faith.',
    cat_8_title: '8. The Stranded Traveler (Ibn As-Sabil)',
    cat_8_desc: 'Anyone stranded on a lawful journey without access to their funds to safely return home, even if wealthy in their home country.',
    recipients_ineligible_title: 'Who CANNOT Receive Your Zakat:',
    ineligible_1: '<strong>Direct ascendants:</strong> Your parents, grandparents, and great-grandparents (you must care for them directly).',
    ineligible_2: '<strong>Direct descendants:</strong> Your children, grandchildren, and great-grandchildren.',
    ineligible_3: '<strong>Your spouse:</strong> Husband or wife cannot pay Zakat to one another.',
    ineligible_4: '<strong>Wealthy individuals:</strong> Anyone whose net wealth equals or exceeds the Nisab threshold.',
    ineligible_5: '<strong>Public infrastructure:</strong> Building mosques, digging wells for public roads, or general charities where ownership is not transferred directly to an eligible person.',
    nav_recipients: 'Recipients Guide',
    nav_recipients_text: 'Who Can Receive Zakat?',
    btn_export: 'Download PDF',
    btn_share_whatsapp: 'Share on WhatsApp',
    btn_start_again: 'Start again',
    live_zakat_bar_title: 'Your Zakat so far',
    btn_jump_result: 'View Result',
    help_link: 'Help',
    btn_understood: 'Understood',
    btn_close: 'Close',
    btn_close_guide: 'Close Guide',
    insights_title: 'Benefits of Paying Zakat',
    insight_1_quote: '"Indeed, those who believe and do righteous deeds and establish prayer and give Zakat will have their reward with their Lord, and there will be no fear concerning them, nor will they grieve."',
    insight_1_source: '— Surah Al-Baqarah 2:277',
    insight_2_quote: '"There is not a day upon which the servants wake up except that two angels descend. One of them says: \'O Allah, give recompense to the one who spends!\'"',
    insight_2_source: '— Sahih al-Bukhari 1442',
    insight_3_quote: '"Take, [O Muhammad], from their wealth a charity by which you purify them and cause them increase, and invoke [Allah\'s blessings] upon them."',
    insight_3_source: '— Surah At-Tawbah 9:103',
    insight_4_quote: '"Charity extinguishes sin as water extinguishes fire."',
    insight_4_source: '— Sunan at-Tirmidhi 614',
    footer_desc: 'A modern digital experience supporting the accurate distribution and purification of wealth. Dedicated to spiritual precision and communal growth.',
    footer_categories_title: 'Eight Categories of Zakat',
    footer_categories_text: '"Zakat expenditures are only for the poor and for the needy and for those employed to collect it and for bringing hearts together and for freeing captives and for those in debt and for the cause of Allah and for the [stranded] traveler..."',
    footer_categories_source: '— Surah At-Tawbah 9:60',
    footer_resources: 'Resources',
    footer_terms: 'Terms of Service',
    footer_privacy: 'Privacy Policy',
    footer_contact: 'Contact Support',
    footer_copyright: '&copy; 2026 ZakatFlow. Dedicated to spiritual precision and communal growth.',
    print_title: 'ZakatFlow Calculation Report',
    print_subtitle: 'Spiritual precision, financial clarity. Computed on ',
    print_heading_summary: 'Report Summary',
    print_heading_assets: 'Reportable Assets',
    print_heading_liabs: 'Deductible Liabilities',
    print_asset_item: 'Asset Item',
    print_val_assessed: 'Value Assessed',
    print_liab_desc: 'Liability Description',
    print_amount_deducted: 'Amount Deducted',
    print_total_eligible: 'Total Eligible Assets:',
    print_final_due: 'Final Zakat Obligation (2.5%):',
    print_declaration: 'This is an estimate for guidance. Please consult a qualified scholar for your situation.',
    modal_principles_title: 'Islamic Zakat Principles',
    modal_principles_p1_title: '1. The Principle of Nisab (Obligation Threshold)',
    modal_principles_p1_body: 'Zakat is only due if your total net wealth exceeds the Nisab threshold. The standard is calculated as the market price of either 87.48 grams of pure Gold or 612.36 grams of pure Silver. If your net wealth is below the threshold, no Zakat is due, but voluntary charity (Sadaqah) is highly encouraged.',
    modal_principles_p2_title: '2. The Principle of Al-Hawl (Lunar Year Possession)',
    modal_principles_p2_body: 'The assets must remain in your possession for one complete lunar year (354 days) to qualify for Zakat. If your wealth fluctuates but stays above the Nisab standard during the year, Zakat is due at your calculation date. Citing Sunan Ibn Majah: "No Zakat is due on wealth until a year has passed over it."',
    modal_principles_p3_title: '3. Rate of Zakat (2.5%)',
    modal_principles_p3_body: 'The Zakat due is calculated at exactly 2.5% (1/40th) of your total net assets. This rate applies specifically to monetary wealth, business merchandise, shares, and gold/silver.',
    modal_principles_p4_title: '4. Deductible Liabilities',
    modal_principles_p4_body: 'According to Islamic jurisprudence, you may subtract outstanding debts due immediately or within the current lunar year from your assets. Long-term parts of mortgage payments or future interest are typically not deductible.',
    modal_principles_p5_title: '5. The Eight Recipients (Surah At-Tawbah 9:60)',
    modal_principles_p5_body: 'Zakat cannot be spent on building mosques or public infrastructure. It must be paid to the eight groups of people ordained in the Quran: the poor, the needy, those employed to collect it, those whose hearts are to be reconciled, for freeing captives, those in debt, in the cause of Allah, and for the stranded traveler.',
    modal_nisab_title: 'Nisab Threshold Details',
    modal_nisab_p1: 'The term Nisab defines the minimum wealth a Muslim must own for a full lunar year before Zakat becomes obligatory.',
    modal_nisab_f1: 'Formula Calculations',
    modal_nisab_f_gold: '• Gold standard Nisab: 87.48 grams (7.5 Tolas)',
    modal_nisab_f_silver: '• Silver standard Nisab: 612.36 grams (52.5 Tolas)',
    modal_nisab_rec: 'Scholarly Recommendation: While both thresholds are religiously valid, contemporary scholars strongly recommend calculating Zakat using the Silver Nisab standard. Since silver price is lower, it reduces the threshold, allowing more individuals to contribute and maximizing the assistance provided to the poor and needy.',
    btn_start_over: 'Reset / Start Again',
    summary_net_wealth: 'Net Zakatable Wealth',
    threshold_val_label: 'Nisab Threshold',
    nisab_card_title: 'Nisab Standard',
    summary_liabilities: 'Deductible Debts',
    modal_history_title: 'Calculation History',
    btn_read_aloud: 'Listen (Read aloud)',
    btn_stop_reading: 'Stop reading',
    text_size_label: 'Text size',
    text_size_sm: 'Small',
    text_size_md: 'Normal',
    text_size_lg: 'Large',
    voice_unavailable_toast: 'Speech voice is not available on this device. You can read the guidance on screen.',
    voice_speaking_toast: 'Reading aloud...',
    privacy_line: 'Your numbers stay on your device. We do not store your data.',
    print_prices_date_label: 'Prices Date & Status',
    modal_terms_title: 'Terms of Service',
    modal_privacy_title: 'Privacy Policy',
    modal_support_title: 'Support & Guidance',
    terms_body_1: 'ZakatFlow is a free, modern digital calculator designed to provide an accurate and calm estimate of your Zakat obligations according to classical Islamic standards.',
    terms_body_2: 'Calculated using the Hanafi silver nisab standard by default. This tool is provided for educational and guidance purposes and does not substitute for personalized legal fatwas from qualified scholars.',
    privacy_body_1: '<strong>Strict Local Privacy Guarantee:</strong> Your numbers stay on your device. We do not store your data.',
    privacy_body_2: 'All asset values, debt numbers, and calculations are computed locally inside your browser and cached purely on your local machine using standard browser storage. We never collect, transmit, or log your personal financial information on external servers.',
    support_body_1: 'For technical feedback, source code, and improvements, visit our open-source repository on GitHub.',
    support_body_2: 'For complex estate or inheritance jurisprudence questions, please consult a qualified local Islamic scholar or Mufti.'
  },
  ar: {
    brand_name: 'زكاة<span class="text-emerald-600"> فلو</span>',
    brand_name_footer: 'زكاة<span class="text-emerald-500"> فلو</span>',
    nav_calculator: 'الحاسبة',
    nav_principles: 'المبادئ الشرعية',
    nav_nisab: 'نصاب الزكاة',
    nav_history: 'المسودات المحفوظة',
    nav_drafts_badge: 'الحفظ التلقائي مفعّل',
    hero_title: 'طهّر مالك بدقة وسكينة واطمئنان',
    hero_subtitle: 'حاسبة زكاة حديثة وبسيطة ترشدك خطوة بخطوة بلغة سهلة ومفهومة للجميع.',
    hero_badge: 'محسوب وفقاً لنصاب الفضة المعتمد في المذهب الحنفي',
    badge_autosaved: 'تم الحفظ تلقائياً',
    step_1_tab: 'مقدمة',
    step_2_tab: 'السيولة',
    step_3_tab: 'الذهب والفضة',
    step_4_tab: 'التجارة',
    step_5_tab: 'الديون',
    step_6_tab: 'النتيجة',
    welcome_title: 'مرحباً بكم في زكاة فلو',
    welcome_desc: 'حاسبة هادئة ودقيقة شرعاً ترشدك خطوة بخطوة بالكلمات الواضحة.',
    choose_language_label: '١. اختر اللغة / Choose Language',
    choose_currency_label: '٢. اختر العملة المعتمدة',
    price_banner_fallback: 'الأسعار الحية غير متوفرة حالياً. يرجى مراجعة الأسعار أدناه.',
    price_banner_fallback_sub: 'باستخدام الأسعار المعيارية لشهر نوفمبر 2026. يمكنك تعديل الأسعار لتناسب السوق المحلي.',
    price_last_updated: 'آخر تحديث للأسعار:',
    active_standard_label: 'المعيار المعتمد:',
    active_standard_silver: 'الفضة (المذهب الحنفي)',
    active_standard_gold: 'معيار الذهب',
    silver_price_label: 'سعر الفضة الحالي (للجرام الواحدة)',
    gold_price_label: 'سعر الذهب 24K (للجرام الواحدة)',
    silver_price_hint: 'قابل للتعديل. نصاب الفضة: 52.5 تولة = 612.36 جرام',
    gold_price_hint: 'قابل للتعديل. نصاب الذهب: 7.5 تولة = 87.48 جرام',
    threshold_silver_label: 'قيمة نصاب الفضة:',
    threshold_gold_label: 'قيمة نصاب الذهب:',
    advanced_nisab_title: '⚙️ خيارات متقدمة: تغيير معيار النصاب (ذهب / فضة)',
    advanced_show: 'عرض التفاصيل',
    advanced_hide: 'إخفاء',
    nisab_switch_explanation: '<strong>لماذا الفضة هي المعيار الافتراضي:</strong> معيار الفضة يعطي حداً أدنى أقل لوجوب الزكاة مقارنة بالذهب. يوصي معظم علماء العصر باعتماد الفضة لأن ذلك يعود بالنفع الأكبر على الفقراء والمحتاجين.',
    choose_standard_prompt: 'اختر المعيار:',
    nisab_toggle_silver: 'الفضة (الموصى به)',
    nisab_toggle_gold: 'معيار الذهب',
    btn_start_wizard: 'بدء الحساب: النقد والسيولة ←',
    cash_step_title: 'السيولة النقدية في اليد والحسابات البنكية',
    cash_step_subtitle: 'أدخل جميع العملات الورقية وأرصدة الحسابات والديون الجيدة المرجو سدادها.',
    label_cash_in_hand: 'السيولة في البيت أو المحفظة',
    hint_cash_in_hand: 'جميع النقود الموجودة في المحفظة، الخزنة، أو المنزل.',
    label_bank_accounts: 'الحسابات البنكية (الجارية والتوفير)',
    hint_bank_accounts: 'إجمالي الرصيد الحالي في جميع الحسابات المصرفية.',
    label_other_savings: 'المدخرات الأخرى وصناديق التوفير',
    hint_other_savings: 'شهادات الاستثمار، الجمعيات المالية، والعملات الأجنبية.',
    label_money_owed_to_me: 'الديون التي لي عند الآخرين (المرجو أداؤها)',
    hint_money_owed_to_me: 'فقط الديون التي ترجو استردادها من المقتدرين. الديون الميؤوس منها لا تحسب.',
    subtotal_cash_label: 'إجمالي النقد والمدخرات:',
    btn_back: '→ رجوع',
    btn_next_gold: 'التالي: الذهب والفضة ←',
    gold_step_title: 'الذهب والفضة',
    gold_step_subtitle: 'أدخل الوزن بالتولة أو الجرام أو الأونصة وحدد عيار الذهب.',
    note_jewelry_title: 'ملاحظة فقهية حول الحلي والذهب الملبوس:',
    note_jewelry_body: 'وفقاً للمذهب الحنفي تجب الزكاة في مطلق الذهب والفضة بما في ذلك الحلي الملبوس، بينما يرى جمهور الفقهاء إعفاء الحلي المعد للاستعمال الشخصي.',
    section_gold_title: 'حيازة الذهب',
    section_silver_title: 'حيازة الفضة',
    label_weight: 'الوزن',
    col_unit: 'الوحدة',
    label_carat: 'العيار / درجة النقاء',
    pure_gold_equiv: 'ما يعادله من الذهب الخالص (24K):',
    assessed_value: 'القيمة المقدرة:',
    subtotal_precious_label: 'إجمالي الذهب والفضة:',
    btn_next_business: 'التالي: التجارة والاستثمار ←',
    business_step_title: 'البضائع التجارية والاستثمارات',
    business_step_subtitle: 'بضائع المحل المعدة للبيع، نقد التجارة، الأسهم، والعقارات المشتراة لإعادة البيع.',
    note_exempt_title: '✓ المعفى من الزكاة (لا تدخله هنا):',
    note_exempt_body: 'المنزل الذي تسكنه، سيارتك الخاصة، الأثاث المنزلي، والأدوات المهنية معفاة تماماً من الزكاة.',
    label_shop_stock: 'بضائع وسلع التجارة المعدة للبيع',
    hint_shop_stock: 'تُقدر بسعر الجملة في تاريخ الحساب. لا تشمل أرفف وديكورات المحل.',
    label_business_cash: 'السيولة النقدية للتجارة وأرصدة حسابات العمل',
    hint_business_cash: 'الأموال النقدية المخصصة للمصاريف التشغيلية وشراء البضائع.',
    label_shares_funds: 'الأسهم وصناديق الاستثمار',
    hint_shares_funds: 'الأسهم المضارب بها تُحسب بقيمتها السوقية؛ أما الأسهم الاستثمارية فتحسب بنسبة أصولها الزكوية.',
    label_property_for_sale: 'العقارات والأراضي المشتراة بنية التجارة والبيع',
    hint_property_for_sale: 'فقط الأراضي أو العقارات المشتراة بنية واضحة للبيع والربح التجاري.',
    subtotal_business_label: 'إجمالي التجارة والاستثمار:',
    btn_next_debts: 'التالي: الديون والالتزامات ←',
    debts_step_title: 'الأموال والديون المستحقة عليك للآخرين',
    debts_step_subtitle: 'اخصم فقط الديون والفواتير الحالة الواجبة فوراً أو خلال العام الهجري الحالي.',
    note_debts_title: 'القاعدة الشرعية في خصم الديون:',
    note_debts_body: 'يجوز خصم الديون العاجلة المستحقة حالاً أو خلال السنة الهجرية (12 شهراً). أما الديون طويلة الأجل (كالتمويل العقاري الكامل) فلا يخصم منها إلا قسط العام الحالي.',
    label_debts_due_now: 'الديون الشخصية المستحقة السداد فوراً',
    hint_debts_due_now: 'أموال اقترضتها من الأقارب أو الأصدقاء وحان موعد سدادها الآن.',
    label_unpaid_bills: 'فواتير متأخرة، إيجار البيت، أو رواتب العمال المستحقة',
    hint_unpaid_bills: 'إيجار المنزل المستحق، فواتير الكهرباء المتأخرة، أو مستحقات العاملين.',
    label_installments_this_year: 'أقساط القروض المستحقة خلال العام الهجري (12 شهراً قادمة)',
    hint_installments_this_year: 'فقط مجموع الأقساط التي يحل سدادها خلال الأشهر الاثني عشر القادمة.',
    subtotal_debts_label: 'إجمالي الديون القابلة للخصم:',
    btn_view_result: 'عرض نتيجة الزكاة النهائية ←',
    result_step_title: 'نتيجة حساب الزكاة الشرعية',
    result_step_subtitle: 'التقييم الشامل والواضح لفريضة تطهير أموالك.',
    hawl_question: 'هل ملكت هذا القدر من المال أو الذهب لعام هجري كامل؟',
    hawl_question_sub: 'تشترط الشريعة لوجوب الزكاة مضي حول كامل (354 يوماً) على المال الزائد عن النصاب.',
    hawl_yes: 'نعم (اكتمل الحول)',
    hawl_no: 'لا (لم يكتمل الحول بعد)',
    hawl_notsure: 'لست متأكداً (?)',
    hawl_notsure_guide_title: 'ماذا تفعل إذا لم تكن متأكداً من الحول؟',
    hawl_notsure_guide_body: 'إذا كنت لا تذكر اليوم المحدد الذي بلغت فيه أموالك النصاب، فينصح العلماء باختيار موعد هجري سنوي مبارك (مثل الأول من رمضان أو الأول من محرم) ليكون موعد زكاتك الثابت، وتزكي عن أموالك في ذلك اليوم، وتثبت هذا الموعد سنوياً.',
    btn_choose_pay_now: 'سأدفع زكاتي الآن (اعتماد نعم)',
    btn_choose_wait: 'سأنتظر اكتمال العام (اعتماد لا)',
    result_headline: 'إجمالي الزكاة الواجبة (2.5%)',
    story_title: 'ملخص الحساب بكلمات بسيطة',
    breakdown_heading: 'بيان الأصول والخصومات',
    recipients_banner_title: 'من هم المستحقون لصرف زكاتك؟',
    recipients_banner_subtitle: 'تعرف على مصارف الزكاة الثمانية الشرعية ومن لا تجوز الزكاة لهم.',
    btn_view_recipients: 'عرض المصارف الثمانية',
    recipients_modal_title: 'مصارف الزكاة الشرعية (لمن تصرف الزكاة؟)',
    recipients_modal_subtitle: 'الأصناف الثمانية المنصوص عليها في القرآن الكريم (سورة التوبة ٩:٦٠)',
    recipients_verse_quote: '\"إِنَّمَا الصَّدَقَاتُ لِلْفُقَرَاءِ وَالْمَسَاكِينِ وَالْعَامِلِينَ عَلَيْهَا وَالْمُؤَلَّفَةِ قُلُوبُهُمْ وَفِي الرِّقَابِ وَالْغَارِمِينَ وَفِي سَبِيلِ اللَّهِ وَابْنِ السَّبِيلِ فَرِيضَةً مِّنَ اللَّهِ وَاللَّهُ عَلِيمٌ حَكِيمٌ\"',
    recipients_verse_source: '— سورة التوبة ٩:٦٠',
    cat_1_title: '١. الفقراء',
    cat_1_desc: 'الذين لا يملكون شيئاً يكفيهم من قوت وكساء ومأوى، أو يجدون أقل من نصف كفايتهم الأساسية.',
    cat_2_title: '٢. المساكين',
    cat_2_desc: 'الذين يملكون مالاً أو كسباً لكنه لا يفي باحتياجاتهم ونفقاتهم الأساسية وهم دون حد النصاب.',
    cat_3_title: '٣. العاملين عليها',
    cat_3_desc: 'الجباة والأمناء المكلفون رسمياً بجمع الزكاة وحفظها وتوزيعها على مستحقيها.',
    cat_4_title: '٤. المؤلفة قلوبهم',
    cat_4_desc: 'المسلمون الجدد المحتاجون إلى الدعم والتثبيت، أو من يُرجى إسلامهم ودفع أذاهم.',
    cat_5_title: '٥. في الرقاب',
    cat_5_desc: 'تحرير الأرقاء، وفك الأسرى، ومساعدة ضحايا الاتجار بالبشر والعمل القسري المستعبد.',
    cat_6_title: '٦. الغارمين',
    cat_6_desc: 'المدينون الذين تراكمت عليهم الديون المباحة لعلاج أو حادث أو حاجة أساسية وعجزوا عن سدادها.',
    cat_7_title: '٧. في سبيل الله',
    cat_7_desc: 'الجهاد المشروع في سبيل الله، وطلاب العلم الشرعي، والمشاريع الدعوية الخالصة.',
    cat_8_title: '٨. ابن السبيل',
    cat_8_desc: 'المسافر المنقطع عن بلده ونفقته في سفر مباح، فيُعطى ما يوصله إلى وجهته وإن كان غنياً في بلده.',
    recipients_ineligible_title: 'الأصناف الذين لا يجوز دفع الزكاة إليهم شرعاً:',
    ineligible_1: '<strong>الأصول:</strong> الآباء والأمهات والأجداد والجدات (فنفقتهم واجبة على المزكي من ماله الخاص).',
    ineligible_2: '<strong>الفروع:</strong> الأبناء والبنات وأولادهم.',
    ineligible_3: '<strong>الزوجان:</strong> لا يجوز للزوج أن يدفع زكاته لزوجته، وكذلك الزوجة لزوجها الموسر.',
    ineligible_4: '<strong>الأغنياء:</strong> كل من يملك كفايته أو يملك نصاباً زكوياً فائضاً عن حاجته الأصلية.',
    ineligible_5: '<strong>بناء المساجد والمشاريع العامة:</strong> لا تصرف الزكاة في بناء المساجد أو الطرق لأن الزكاة تمليك للمستحق الفقير.',
    nav_recipients: 'دليل المستحقين',
    nav_recipients_text: 'مصارف الزكاة الثمانية',
    btn_export: 'تحميل التقرير PDF',
    btn_share_whatsapp: 'مشاركة عبر واتساب',
    btn_start_again: 'بدء الحساب من جديد',
    live_zakat_bar_title: 'زكاتك حتى الآن',
    btn_jump_result: 'عرض النتيجة',
    help_link: 'مساعدة',
    btn_understood: 'فهمت',
    btn_close: 'إغلاق',
    btn_close_guide: 'إغلاق الدليل',
    insights_title: 'إشراقات وحكم الزكاة',
    insight_1_quote: '"بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ... وَإِقَامِ الصَّلاَةِ، وَإِيتَاءِ الزَّكَاةِ..."',
    insight_1_source: '— صحيح البخاري ٨',
    insight_2_quote: '"خُذْ مِنْ أَمْوَالِهِمْ صَدَقَةً تُطَهِّرُهُمْ وَتُزَكِّيهِم بِهَا..."',
    insight_2_source: '— سورة التوبة ٩:١٠٣',
    insight_3_quote: '"إِنَّمَا الصَّدَقَاتُ لِلْفُقَرَاءِ وَالْمَسَاكِينِ وَالْعَامِلِينَ عَلَيْهَا..."',
    insight_3_source: '— سورة التوبة ٩:٦٠',
    insight_4_quote: '"لَا زَكَاةَ فِي مَالٍ حَتَّى يَحُولَ عَلَيْهِ الْحَوْلُ"',
    insight_4_source: '— سنن ابن ماجه',
    footer_desc: 'منصة رقمية حديثة تهدف إلى تسهيل التوزيع الدقيق وتطهير الثروات. مكرسة للدقة الروحية والتنمية المجتمعية.',
    footer_categories_title: 'مصارف الزكاة الثمانية',
    footer_categories_text: '"إِنَّمَا الصَّدَقَاتُ لِلْفُقَرَاءِ وَالْمَسَاكِينِ وَالْعَامِلِينَ عَلَيْهَا وَالْمُؤَلَّفَةِ قُلُوبُهُمْ وَفِي الرِّقَابِ وَالْغَارِمِينَ وَفِي سَبِيلِ اللَّهِ وَابْنِ السَّبِيلِ فَرِيضَةً مِّنَ اللَّهِ..."',
    footer_categories_source: '— سورة التوبة ٩:٦٠',
    footer_resources: 'مصادر ومراجع',
    footer_terms: 'شروط الخدمة',
    footer_privacy: 'سياسة الخصوصية',
    footer_contact: 'الدعم الفني',
    footer_copyright: '&copy; ٢٠٢٦ زكاة فلو. مكرس للدقة الروحية والتنمية المجتمعية.',
    print_title: 'تقرير حساب الزكاة الشرعي',
    print_subtitle: 'دقة روحية، ووضوح مالي. تم الحساب في تاريخ ',
    print_heading_summary: 'ملخص التقرير',
    print_heading_assets: 'بيان الأصول والأموال',
    print_heading_liabs: 'الخصومات والديون المستبعدة',
    print_asset_item: 'بند الأصول',
    print_val_assessed: 'القيمة المقدرة',
    print_liab_desc: 'بيان الالتزامات',
    print_amount_deducted: 'المبلغ المخصوم',
    print_total_eligible: 'إجمالي الأصول الخاضعة للزكاة:',
    print_final_due: 'مبلغ الزكاة النهائي المستحق (2.5%):',
    print_declaration: 'هذا الحساب تقديري للاسترشاد فقط. يرجى مراجعة عالم مؤهل أو دار إفتاء لحالتك الخاصة.',
    modal_principles_title: 'أحكام وأصول الزكاة الشرعية',
    modal_principles_p1_title: '١. أصل النصاب (حد وجوب الفريضة)',
    modal_principles_p1_body: 'لا تجب الزكاة إلا إذا بلغ صافي ثروتك حد النصاب. ويُقدر النصاب بقيمة 87.48 جراماً من الذهب الخالص أو 612.36 جراماً من الفضة الخالصة في السوق الحالية. وإذا كانت ثروتك دون النصاب فلا زكاة عليك وتستحب الصدقة التطوعية.',
    modal_principles_p2_title: '٢. أصل الحول (مرور عام قمري كامل)',
    modal_principles_p2_body: 'يشترط لوجوب الزكاة مضي عام قمري كامل (354 يوماً) على بقاء المال عند حد النصاب أو أكثر. كما جاء في الحديث الشريف: "لا زكاة في مال حتى يحول عليه الحول".',
    modal_principles_p3_title: '٣. نسبة الزكاة (2.5%)',
    modal_principles_p3_body: 'القدر الواجب إخراجه هو ربع العشر أي 2.5% من إجمالي الأصول الزكوية الصافية كالذهب والفضة والسيولة النقدية وعروض التجارة.',
    modal_principles_p4_title: '٤. خصم الديون والالتزامات الحالة',
    modal_principles_p4_body: 'وفقاً لجمهور الفقهاء، يجوز خصم الديون العاجلة المستحقة حالاً أو خلال العام الهجري الجاري من مجموع الأصول. أما الديون الآجلة طويلة المدى فلا يخصم منها إلا قسط العام.',
    modal_principles_p5_title: '٥. مصارف الزكاة الثمانية (سورة التوبة 9:60)',
    modal_principles_p5_body: 'لا يجوز صرف الزكاة في بناء المساجد أو المشاريع العامة، بل تصرف حصراً للمصارف الثمانية المنصوص عليها في القرآن الكريم: الفقراء، والمساكين، والعاملين عليها، والمؤلفة قلوبهم، وفي الرقاب، والغارمين، وفي سبيل الله، وابن السبيل.',
    modal_nisab_title: 'بيان حد النصاب الشرعي',
    modal_nisab_p1: 'النصاب هو الحد الأدنى من المال الذي إذا ملكه المسلم وحال عليه الحول وجبت عليه الزكاة.',
    modal_nisab_f1: 'معايير حساب النصاب',
    modal_nisab_f_gold: '• نصاب الذهب: 87.48 جراماً (ما يعادل 7.5 تولة)',
    modal_nisab_f_silver: '• نصاب الفضة: 612.36 جراماً (ما يعادل 52.5 تولة)',
    modal_nisab_rec: 'توصية العلماء المعاصرين: يوصي جمهور العلماء ومجامع الفقه باعتماد نصاب الفضة في عصرنا الحاضر؛ نظراً لانخفاض قيمته مقارنة بالذهب، مما يجعل حد الوجوب أيسر ويعود بأعظم النفع على الفقراء والمستحقين.',
    btn_start_over: 'إعادة البدء / تصفير',
    summary_net_wealth: 'صافي الأموال الخاضعة للزكاة',
    threshold_val_label: 'حد النصاب الشرعي',
    nisab_card_title: 'معيار النصاب',
    summary_liabilities: 'الديون المخصومة',
    modal_history_title: 'سجل الحسابات السابقة',
    btn_read_aloud: 'استمع (قراءة صوتية)',
    btn_stop_reading: 'إيقاف القراءة',
    text_size_label: 'حجم الخط',
    text_size_sm: 'صغير',
    text_size_md: 'عادي',
    text_size_lg: 'كبير',
    voice_unavailable_toast: 'خدمة القراءة الصوتية غير متوفرة على جهازك لهذه اللغة. يمكنك قراءة الإرشادات على الشاشة.',
    voice_speaking_toast: 'جارٍ القراءة بصوت عالٍ...',
    privacy_line: 'بياناتك المالية تبقى على جهازك فقط. نحن لا نحفظ أو نخزن بياناتك في أي خادم.',
    print_prices_date_label: 'تاريخ حالة الأسعار',
    modal_terms_title: 'شروط الاستخدام',
    modal_privacy_title: 'سياسة الخصوصية',
    modal_support_title: 'الدعم والمساعدة',
    terms_body_1: 'زكاة فلو هي أداة رقمية مجانية حديثة مصممة لتقديم تقدير دقيق وهادئ لالتزامات الزكاة الشرعية وفق الضوابط الفقهية المعتمدة.',
    terms_body_2: 'يتم الحساب وفق نصاب الفضة في المذهب الحنفي افتراضيًا. هذا الحساب تقديري للاسترشاد فقط، ولا يغني عن استشارة أهل العلم المؤهلين في المسائل المالية المعقدة.',
    privacy_body_1: '<strong>ضمان الخصوصية التامة:</strong> أرقامك وبياناتك المالية تبقى على جهازك فقط. نحن لا نخزن بياناتك مطلقاً.',
    privacy_body_2: 'تتم جميع العمليات الحسابية محليًا في متصفحك دون إرسال أي أرقام أو أصول إلى أي خادم خارجي. تحديث أسعار المعادن يتم بصورة مجهولة الهوية بالكامل.',
    support_body_1: 'للملاحظات التقنية والتطويرات، يمكنك زيارة مشروعنا المفتوح المصدر على GitHub.',
    support_body_2: 'للاستفسارات الفقهية الدقيقة، يُرجى الرجوع إلى دور الإفتاء والعلماء المعتمدين.'
  }
};

// Friendly Help Modal Database (plain language, no jargon)
const HELP_TOPICS = {
  'cash-in-hand': {
    title: { ur: 'گھر اور بٹوے میں موجود نقد رقم', en: 'Cash at Home or in Wallet', ar: 'السيولة النقدية في المنزل أو المحفظة' },
    body: {
      ur: '<p>اس میں وہ تمام نقد روپے شامل ہیں جو آپ کے بٹوے، جیب، گھر کی الماری، تجوری یا درازوں میں محفوظ ہیں۔ اگر آپ کے پاس غیر ملکی کرنسی (جیسے ڈالر یا ریال) موجود ہے تو اس کی پاکستانی روپے میں موجودہ قیمت بھی شامل کر لیں۔</p>',
      en: '<p>This includes all physical currency in your wallet, pockets, drawers, or home safe. If you keep foreign currencies (like USD, SAR, or AED), convert them to your chosen currency at today\'s exchange rate and add them here.</p>',
      ar: '<p>يشمل ذلك جميع الأموال النقدية الورقية الموجودة في محفظتك، جيوبك، أدراجك أو خزنتك المنزلية. وإذا كان لديك عملات أجنبية فتحول إلى عملتك المعتمدة وتضاف هنا.</p>'
    }
  },
  'bank-accounts': {
    title: { ur: 'بینک کھاتوں کی تفصیل', en: 'Bank Accounts', ar: 'الحسابات البنكية' },
    body: {
      ur: '<p>تمام بینک کھاتوں (کرنٹ، سیونگز یا آسان اکاؤنٹس) میں حساب کے دن موجود کل بیلنس درج کریں۔ اگر آپ کے کسی سیونگ اکاؤنٹ میں سود شامل ہے تو اس سودی رقم کو الگ کر کے کسی ضرورت مند کو بلا نیتِ ثواب دے دیں، اور اصل رقم پر زکوٰۃ کا حساب لگائیں۔</p>',
      en: '<p>Enter the total current balance across all your bank accounts (checking, savings, digital wallets like Nayapay/Sadapay). If any interest has accrued, scholars advise disposing of the interest without intention of reward, and calculating Zakat only on your principal wealth.</p>',
      ar: '<p>أدخل الرصيد الإجمالي الحالي في جميع حساباتك المصرفية (الجارية أو الاستثمارية أو التوفير). وإذا كانت هناك فوائد ربوية فيجب التخلص منها دون نية الأجر وحساب الزكاة على أصل المال فقط.</p>'
    }
  },
  'other-savings': {
    title: { ur: 'کمیٹیاں اور دیگر بچت اسکیمیں', en: 'Other Savings & Committees', ar: 'المدخرات والجمعيات المالية' },
    body: {
      ur: '<p><strong>کمیٹی / بی سی:</strong> اگر آپ نے کوئی کمیٹی ڈالی ہوئی ہے اور وہ ابھی تک آپ کو نہیں ملی، تو جتنی قسطیں آپ جمع کروا چکے ہیں وہ آپ کی ملکیت ہیں اور ان پر زکوٰۃ ہے۔ جو کمیٹی آپ کو مل چکی ہے اس میں سے جو رقم بچی ہے وہ کیش میں لکھیں۔</p><p class="mt-2"><strong>پرائز بانڈز:</strong> ان کی اصل قیمت پر زکوٰۃ ہے۔</p>',
      en: '<p><strong>Rotating Committees (BC):</strong> If you have contributed to an ongoing committee and haven\'t received the pot yet, the total installments you have paid in so far are your wealth and subject to Zakat. If you already received the pot, enter whatever remains of it under cash.</p><p class="mt-2"><strong>Prize Bonds / Certificates:</strong> Subject to Zakat on their face value.</p>',
      ar: '<p><strong>الجمعيات المالية الشهرية:</strong> الأقساط التي دفعتها ولم تستلم حصتك بعد تعتبر من مالك وتجب فيها الزكاة. أما إذا استلمت الجمعية فما بقي منها يحسب مع السيولة النقدية.</p>'
    }
  },
  'money-owed-to-me': {
    title: { ur: 'وہ رقم جو دوسروں سے واپس ملنی ہے', en: 'Money Others Owe Me', ar: 'الديون المرجوة عند الآخرين' },
    body: {
      ur: '<p>اگر آپ نے کسی دوست، رشتہ دار یا گاہک کو قرض دیا ہوا ہے اور آپ کو پکا یقین ہے کہ وہ واپس کر دے گا، تو اسے یہاں درج کریں۔ اگر کوئی قرض ڈوب چکا ہو یا ملنے کی کوئی امید نہ ہو، تو اسے شامل نہ کریں؛ جب وہ وصول ہو جائے تو اس وقت کا حکم دیکھیں۔</p>',
      en: '<p>Only include loans you gave to solvent friends, relatives, or clients that you genuinely expect to receive back. If a loan is doubtful, disputed, or likely uncollectible, do not count it until it is actually repaid.</p>',
      ar: '<p>أدخل فقط الديون التي أقرضتها لأشخاص مقتدرين وترجو استردادها منهم بيقين. أما الديون المشكوك فيها أو الميؤوس من استردادها فلا تحسب حتى تقبضها فعلياً.</p>'
    }
  },
  'gold-carat': {
    title: { ur: 'سونے کا کیرٹ اور خالص پن', en: 'Gold Carats & Pure Gold', ar: 'عيار الذهب والنقاء' },
    body: {
      ur: '<p>سونے کے زیورات میں دوسری دھاتیں بھی شامل ہوتی ہیں۔ 24 کیرٹ سونا 99.9٪ خالص ہوتا ہے۔ پاکستان میں عام زیورات 22 کیرٹ (91.6٪ خالص) ہوتے ہیں۔ خلیجی ممالک میں 21 کیرٹ اور نگینوں والے زیورات 18 کیرٹ کے ہوتے ہیں۔</p><p class="mt-2 text-emerald-800 font-bold">ہم خودکار طریقے سے آپ کے سونے کا خالص وزن نکالتے ہیں تاکہ آپ صرف حقیقی سونے پر ہی زکوٰۃ ادا کریں اور زائد بوجھ نہ پڑے۔</p>',
      en: '<p>Gold jewelry contains alloy metals for strength. 24K is 99.9% pure bullion. 22K (standard jewelry in Pakistan and South Asia) is 91.6% pure. 21K (popular in Arab regions) is 87.5% pure, and 18K is 75% pure.</p><p class="mt-2 text-emerald-800 font-bold">ZakatFlow automatically converts your weight to pure gold so you only pay Zakat on real gold, never on alloy metals.</p>',
      ar: '<p>يحتوي الذهب المشغول على معادن أخرى لتقويته. عيار 24 نقي بنسبة 99.9٪، وعيار 22 نقي بنسبة 91.6٪، وعيار 21 نقي بنسبة 87.5٪، وعيار 18 نقي بنسبة 75٪. يقوم البرنامج بحساب الوزن الصافي الخالص للذهب بدقة.</p>'
    }
  },
  'silver-nisab': {
    title: { ur: 'چاندی کا نصاب (52.5 تولہ)', en: 'Silver Nisab Standard', ar: 'نصاب الفضة (52.5 تولة)' },
    body: {
      ur: '<p>چاندی کا نصاب 52.5 تولہ (612.36 گرام) ہے۔ چونکہ چاندی کی قیمت مناسب ہے، اس لیے اس معیار کے تحت زکوٰۃ کا دائرہ کار وسیع ہو جاتا ہے اور معاشرے کے غریب، بیوہ اور یتیم افراد کو زیادہ مالی مدد ملتی ہے۔ اسی لیے پاکستان کے تمام بڑے دارالافتاء چاندی کے نصاب کی پرزور سفارش کرتے ہیں۔</p>',
      en: '<p>The Silver Nisab standard is 52.5 tolas (612.36 grams). Because silver has a lower market threshold, it allows more wealth owners to contribute, maximizing direct assistance to poor families, widows, and orphans. Islamic scholars in Pakistan consistently recommend this standard.</p>',
      ar: '<p>نصاب الفضة هو 52.5 تولة (612.36 جرام). ونظراً لانخفاض عتبة الفضة، يوصي العلماء المعاصرون باعتماده لأنه يحقق المصلحة الأكبر للفقراء والمساكين.</p>'
    }
  },
  'gold-nisab': {
    title: { ur: 'سونے کا نصاب (7.5 تولہ)', en: 'Gold Nisab Standard', ar: 'نصاب الذهب (7.5 تولة)' },
    body: {
      ur: '<p>سونے کا نصاب 7.5 تولہ (87.48 گرام) خالص سونا ہے۔ اگر کسی شخص کے پاس صرف سونا ہو اور کوئی نقد رقم یا چاندی بالکل نہ ہو تو بعض فقہاء سونے کے نصاب پر عمل کرنے کی اجازت دیتے ہیں۔</p>',
      en: '<p>The Gold Nisab standard is 7.5 tolas (87.48 grams) of pure 24K gold. If a person owns only gold and absolutely no cash, bank savings, or silver, some classical jurists allow evaluating against the gold threshold.</p>',
      ar: '<p>نصاب الذهب هو 7.5 تولة (87.48 جرام) من الذهب الخالص. إذا كان الشخص يملك الذهب فقط دون أي نقد أو فضة فيجوز له عند بعض الفقهاء اعتماد نصاب الذهب.</p>'
    }
  },
  'shop-stock': {
    title: { ur: 'دکان کا تجارتی مال', en: 'Shop Merchandise & Stock', ar: 'عروض التجارة وبضائع المحل' },
    body: {
      ur: '<p>اس سے مراد وہ تمام اشیاء ہیں جو آپ نے بیچنے کی نیت سے خریدی ہوئی ہیں۔ حساب کے دن ان اشیاء کی موجودہ ہول سیل لاگت (خریداری قیمت) لگائیں، ریٹیل یا منافع والی قیمت نہ لگائیں۔ دکان کا فرنیچر، لائٹس، کمپیوٹر اور عمارت زکوٰۃ سے مستثنیٰ ہیں۔</p>',
      en: '<p>This covers all finished goods, raw materials, and inventory held for resale. Value your stock at its current wholesale cost on your calculation date, not the retail selling price. Store shelves, counters, computers, and delivery vehicles are not subject to Zakat.</p>',
      ar: '<p>يشمل جميع البضائع والسلع المشتراة بقصد البيع والربح. تُقوم بسعر الجملة في يوم الحساب. أما أثاث المحل ووسائل النقل والديكورات فمعفاة من الزكاة.</p>'
    }
  },
  'business-cash': {
    title: { ur: 'کاروباری نقد رقم اور اکاؤنٹس', en: 'Business Cash & Accounts', ar: 'سيولة النشاط التجاري' },
    body: {
      ur: '<p>کاروبار کے بینک اکاؤنٹس، دراز یا تجوری میں موجود وہ نقد رقم جو آپریشنل اخراجات یا سپلائرز کو ادائیگی کے لیے رکھی گئی ہے۔ یہ رقم بھی قابلِ زکوٰۃ اثاثوں میں شمار ہوتی ہے۔</p>',
      en: '<p>All liquid cash kept in business checking accounts, petty cash, or registers. Even if allocated for upcoming inventory purchases, liquid cash in hand is part of your zakatable pool on calculation day.</p>',
      ar: '<p>السيولة النقدية المتوفرة في حسابات المؤسسة أو خزينة المحل المعدة لشراء البضائع أو المصاريف التشغيلية تخضع للزكاة.</p>'
    }
  },
  'shares-funds': {
    title: { ur: 'شیئرز اور میوچل فنڈز', en: 'Shares & Mutual Funds', ar: 'الأسهم والصناديق الاستثمارية' },
    body: {
      ur: '<p><strong>روزمرہ ٹریڈنگ (شارٹ ٹرم):</strong> شیئرز کی موجودہ مارکیٹ ویلیو پر پوری زکوٰۃ ہے۔</p><p class="mt-2"><strong>طویل مدتی ڈیویڈنڈ کے لیے:</strong> اگر شیئرز منافع کے لیے رکھے ہیں تو کمپنی کے قابلِ زکوٰۃ اثاثوں (کیش اور تجارتی مال) کا تناسب دیکھا جاتا ہے، جو عموماً 20٪ سے 30٪ کے قریب بنتا ہے۔</p>',
      en: '<p><strong>Short-Term Day Trading:</strong> Value shares at full market price on calculation day.</p><p class="mt-2"><strong>Long-Term Dividend Investing:</strong> Only the company\'s underlying liquid and trading assets are zakatable (often around 20% to 30% of market value depending on company balance sheet).</p>',
      ar: '<p><strong>أسهم المضاربة السريعة:</strong> تُزكى بقيمتها السوقية الكاملة في يوم الحساب.</p><p class="mt-2"><strong>أسهم الاستثمار طويل الأجل:</strong> تُزكى بنسبة الأصول الزكوية (السيولة والبضائع) في ميزانية الشركة.</p>'
    }
  },
  'property-for-sale': {
    title: { ur: 'فروخت کے لیے جائیداد / پلاٹ', en: 'Real Estate for Resale', ar: 'العقارات المعدة للتجارة' },
    body: {
      ur: '<p>صرف وہی پلاٹ، دکان یا مکان یہاں درج کریں جو آپ نے خالصتاً بیچ کر منافع کمانے کے ارادے سے خریدا تھا۔ جس مکان میں آپ خود رہتے ہیں یا جو پلاٹ مستقبل میں اپنا گھر بنانے کے لیے رکھا ہے، اس پر کوئی زکوٰۃ نہیں ہے۔ اگر جائیداد کرائے پر دی ہے تو صرف وصول شدہ کرائے پر زکوٰۃ ہے، جائیداد کی مالیت پر نہیں۔</p>',
      en: '<p>Only include land, plots, or housing units purchased with the clear commercial intent of reselling them for a trading profit. The house you reside in, or a plot kept to build your future family home, has zero Zakat. If you own rental property, Zakat is due on the saved rental income, not the property itself.</p>',
      ar: '<p>أدخل فقط الأراضي أو العقارات التي تم شراؤها بنية واضحة لإعادة بيعها والتربح منها. أما بيتك السكني، أو الأرض المخصصة لبناء سكنك، أو العقارات المؤجرة فلا زكاة في أصل قيمتها وإنما في الإيجار المحصل الفائض فقط.</p>'
    }
  },
  'debts-due-now': {
    title: { ur: 'ذاتی قرضے جو ابھی ادا کرنے ہیں', en: 'Debts Due Immediately', ar: 'الديون الشخصية الحالة' },
    body: {
      ur: '<p>وہ قرض جو آپ نے کسی عزیز، دوست یا بینک سے لیا ہوا ہے اور جس کی ادائیگی کا وقت آ چکا ہے، وہ آپ کی دولت سے منہا ہو جائے گا کیونکہ وہ حقیقت میں آپ کا مال نہیں بلکہ آپ کے ذمہ قرض ہے۔</p>',
      en: '<p>Debts you borrowed from friends, family, or lenders that have matured and must be paid back now can be deducted from your assets, as this money is encumbered by an immediate liability.</p>',
      ar: '<p>الديون التي اقترضتها من الأقارب أو الأصدقاء أو البنوك وحان موعد سدادها فوراً تُخصم من مجموع أموالك الزكوية.</p>'
    }
  },
  'unpaid-bills': {
    title: { ur: 'واجب الادا بلز، کرایہ اور تنخواہیں', en: 'Unpaid Bills, Rent & Salaries', ar: 'الفواتير والإيجارات المستحقة' },
    body: {
      ur: '<p>گزشتہ مہینے کا واجب الادا گھر یا دکان کا کرایہ، بجلی، پانی، گیس کے بل جو موصول ہو چکے ہوں لیکن ابھی ادا نہ کیے ہوں، اور گھر یا دفتر کے ملازمین کی وہ تنخواہیں جو واجب الادا ہو چکی ہوں، انہیں منہا کیا جا سکتا ہے۔</p>',
      en: '<p>Overdue or received rent notices, utility invoices (electricity, water, gas, internet) due immediately, and earned salaries of household or office staff that are due now can be deducted.</p>',
      ar: '<p>إيجار المسكن أو المحل المتأخر، فواتير الخدمات العامة الصادرة المستحقة، ورواتب الموظفين والعمال المستحقة السداد تُخصم من وعاء الزكاة.</p>'
    }
  },
  'installments-this-year': {
    title: { ur: 'قرضے کی قسطیں (ایک سال کی)', en: 'Upcoming 12-Month Loan Installments', ar: 'أقساط القروض للعام القادم' },
    body: {
      ur: '<p>اگر آپ پر کوئی بڑا قرض ہے (جیسے گاڑی یا ہاؤسنگ فنانس)، تو شریعت کے مطابق صرف وہی قسطیں منہا کی جا سکتی ہیں جو اگلے بارہ مہینوں (ایک قمری سال) کے اندر واجب الادا ہیں۔ پورے 10 یا 20 سال کے قرض کو ایک ساتھ منہا نہیں کیا جا سکتا۔</p>',
      en: '<p>Under classical Islamic jurisprudence, if you have a multi-year loan (e.g. car lease or home financing), you may only deduct the installments coming due within the next 12 lunar months. You cannot deduct the entire multi-decade principal at once.</p>',
      ar: '<p>وفقاً للضوابط الفقهية، إذا كان عليك قرض طويل الأجل (كالتمويل العقاري)، يجوز فقط خصم الأقساط التي يحل أجلها خلال الأشهر الاثني عشر القادمة (سنة الحول)، ولا يجوز خصم كامل أصل القرض المستقبلي دفعة واحدة.</p>'
    }
  },
  'hawl-ruling': {
    title: { ur: 'الحول (ایک سال گزرنے کی شرط)', en: 'The Principle of Al-Hawl (1 Lunar Year)', ar: 'شرط مرور الحول (سنة هجرية كاملة)' },
    body: {
      ur: '<p>رسول اللہ ﷺ کا فرمان ہے: <em>"کسی مال پر اس وقت تک زکوٰۃ نہیں جب تک کہ اس پر ایک سال نہ گزر جائے۔"</em> (سنن ابن ماجہ)</p><p class="mt-2">اس کا مطلب یہ ہے کہ جب پہلی بار آپ کی بچت نصاب کے برابر پہنچی تھی، اس دن سے لے کر 354 دن (ایک قمری سال) تک اگر وہ نصاب سے اوپر رہی ہے تو اس سال زکوٰۃ فرض ہوگی۔</p>',
      en: '<p>Prophet Muhammad (peace be upon him) said: <em>"No Zakat is due on wealth until a year has passed over it."</em> (Sunan Ibn Majah)</p><p class="mt-2">This means your net wealth must have equaled or exceeded the Nisab threshold for a full continuous lunar year (354 days). If your wealth fluctuates during the year but remains above Nisab at the start and end of your annual Zakat date, full Zakat is due on the closing balance.</p>',
      ar: '<p>قال رسول الله ﷺ: <em>"لَيْسَ فِي مَالٍ زَكَاةٌ حَتَّى يَحُولَ عَلَيْهِ الْحَوْلُ"</em> (سنن ابن ماجه).</p><p class="mt-2">يشترط لوجوب الزكاة مضي سنة قمرية (354 يوماً) على ملكية النصاب دون انقطاع.</p>'
    }
  },
  'hawl-notsure': {
    title: { ur: 'اگر سال گزرنے کا یقین نہ ہو؟', en: 'Not Sure About the Lunar Year?', ar: 'إذا لم تكن متأكداً من اكتمال الحول؟' },
    body: {
      ur: '<p>اگر آپ کو اپنی زکوٰۃ کی پرانی تاریخ یاد نہیں ہے، تو فقہاء کرام یہ مشورہ دیتے ہیں کہ آپ سال کا کوئی بھی ایک بابرکت اسلامی دن (مثلاً یکم رمضان یا یکم محرم) اپنے لیے زکوٰۃ کی سالانہ تاریخ مقرر کر لیں۔ اس دن آپ کے پاس جتنا مال موجود ہو، اس کی زکوٰۃ ادا کر دیں؛ اس سے آپ کا فریضہ ادا ہو جائے گا اور آئندہ کے لیے ایک مستقل تاریخ مقرر ہو جائے گی۔</p>',
      en: '<p>If you don\'t recall the exact historical date your wealth first reached Nisab, scholars advise fixing a convenient Islamic calendar date every year (such as the 1st of Ramadan or 1st of Muharram) as your personal Zakat assessment day. Calculate and pay Zakat on whatever net wealth you possess on that chosen day, which fulfills your obligation and fixes your future annual date.</p>',
      ar: '<p>إذا لم تكن تذكر التاريخ الدقيق لبلوغ مالك النصاب، فينصح العلماء بتحديد يوم هجري ثابت سنوياً (مثل الأول من رمضان أو الأول من محرم) ليكون موعداً لحساب زكاتك، وتزكي عن جميع ما تملكه في ذلك اليوم.</p>'
    }
  }
};

// Format currency cleanly with localized digits and symbol
function formatMoney(amount) {
  const curr = CURRENCIES[STATE.currency] || CURRENCIES.PKR;
  const num = parseFloat(amount) || 0;
  const formatted = num.toLocaleString(curr.locale || 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${curr.symbol} ${formatted}`;
}

// Convert plain number into thousands-separated string
function formatNumberWithCommas(num) {
  if (isNaN(num) || num === null || num === undefined || num === '') return '';
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

// ================= TEXT-SIZE CONTROLLER (A- / A / A+) =================
window.setTextSize = function(size) {
  const allowedSizes = ['sm', 'md', 'lg'];
  const targetSize = allowedSizes.includes(size) ? size : 'md';

  // Apply scaling class to <html>
  document.documentElement.classList.remove('text-size-sm', 'text-size-md', 'text-size-lg');
  document.documentElement.classList.add(`text-size-${targetSize}`);

  // Persist preference in localStorage
  STATE.textSize = targetSize;
  try {
    localStorage.setItem('zakatflow_text_size', targetSize);
  } catch (e) {
    console.warn('Unable to persist text size:', e);
  }

  // Update UI button active states
  ['sm', 'md', 'lg'].forEach(s => {
    const btn = document.getElementById(`text-size-${s}`);
    if (btn) {
      if (s === targetSize) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    }
  });
};

function initTextSize() {
  let savedSize = 'md';
  try {
    savedSize = localStorage.getItem('zakatflow_text_size') || 'md';
  } catch (e) {
    savedSize = 'md';
  }
  window.setTextSize(savedSize);
}

// ================= READ-ALOUD SPEECH SYNTHESIS =================
let currentSpeechUtterance = null;
let activeSpeakingStep = null;

window.stopSpeech = function() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('Speech cancellation error:', e);
    }
  }
  currentSpeechUtterance = null;
  activeSpeakingStep = null;
  resetAllReadAloudButtons();
};

function resetAllReadAloudButtons() {
  const lang = STATE.language || 'ur';
  const labelText = TRANSLATIONS[lang]?.btn_read_aloud || 'Listen (Read aloud)';
  document.querySelectorAll('.read-aloud-btn').forEach(btn => {
    btn.classList.remove('speaking');
    const iconSpan = btn.querySelector('.read-aloud-icon');
    const labelSpan = btn.querySelector('.read-aloud-label');
    if (iconSpan) iconSpan.textContent = '🔊';
    if (labelSpan) labelSpan.textContent = labelText;
    btn.setAttribute('aria-label', labelText);
  });
}

function showSpeechToast(message) {
  let toast = document.getElementById('speech-notification-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'speech-notification-toast';
    toast.className = 'fixed bottom-24 start-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 max-w-md w-[90%] sm:w-auto text-center border border-slate-700 transition-all duration-300 pointer-events-none opacity-0';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.remove('opacity-0');
  toast.classList.add('opacity-100');
  setTimeout(() => {
    toast.classList.remove('opacity-100');
    toast.classList.add('opacity-0');
  }, 4500);
}

function getStepSpeechContent(stepNum, lang) {
  if (stepNum === 1) {
    if (lang === 'ur') {
      return 'خوش آمدید۔ زکوٰۃ فلو میں آپ کا استقبال ہے۔ اپنی زبان اور کرنسی منتخب کریں۔ چاندی کا نصاب بنیادی معیار کے طور پر منتخب ہے۔ اپنا حساب شروع کرنے کے لیے نیچے دیے گئے بٹن پر کلک کریں۔';
    } else if (lang === 'ar') {
      return 'مرحبًا بكم في زكاة فلو. حدد لغتك وعملتك. تم تعيين معيار نصاب الفضة افتراضيًا. اضغط على الزر أدناه لبدء الحساب.';
    } else {
      return 'Welcome to ZakatFlow. Choose your language and currency. Silver nisab standard is selected by default for maximum benefit to those in need. Click below to start your calculation.';
    }
  }

  if (stepNum === 2) {
    if (lang === 'ur') {
      return 'مرحلہ نمبر دو: نقد رقم اور بینک۔ گھر اور بٹوے میں موجود نقد رقم، بینک کھاتوں کا بیلنس، کمیٹیاں اور دیگر بچت، اور وہ رقم جو آپ کو دوسروں سے واپس ملنی ہے، یہاں درج کریں۔';
    } else if (lang === 'ar') {
      return 'الخطوة الثانية: النقد والحسابات البنكية. أدخل النقد المتوفر في المنزل، وأرصدة البنوك، والمدخرات، والأموال المستحقة لك عند الآخرين.';
    } else {
      return 'Step 2: Cash and bank savings. Enter cash at home or in wallet, bank account balances, savings schemes, and money others owe you.';
    }
  }

  if (stepNum === 3) {
    if (lang === 'ur') {
      return 'مرحلہ نمبر تین: سونا اور چاندی۔ اپنے سونے اور چاندی کا وزن تولہ، گرام یا اونس میں درج کریں اور کیرٹ منتخب کریں۔ سسٹم خودکار طور پر خالص سونے کی مالیت کا حساب لگائے گا۔';
    } else if (lang === 'ar') {
      return 'الخطوة الثالثة: الذهب والفضة. أدخل وزن الذهب والفضة بالتولة أو الجرام أو الأونصة وحدد العيار. سيقوم النظام بحساب قيمة الذهب الخالص المقدرة.';
    } else {
      return 'Step 3: Gold and silver. Enter the weight of your gold and silver in tola, gram, or ounce and select the carat. The system will compute the pure gold equivalent and total value.';
    }
  }

  if (stepNum === 4) {
    if (lang === 'ur') {
      return 'مرحلہ نمبر چار: کاروبار اور سرمایہ کاری۔ دکان کا برائے فروخت تجارتی سامان، کاروباری نقد رقم، کمپنی کے شیئرز، اور فروخت کی نیت سے خریدی گئی جائیداد درج کریں۔ ذاتی رہائشی مکان اور گاڑی زکوٰۃ سے بالکل مستثنیٰ ہیں۔';
    } else if (lang === 'ar') {
      return 'الخطوة الرابعة: التجارة والاستثمار. أدخل بضائع المحل المعروضة للبيع، ونقد التجارة، والأسهم، والعقارات المعدة للتجارة. بيتك الشخصي وسيارتك الخاصة معفيان تمامًا من الزكاة.';
    } else {
      return 'Step 4: Business and investments. Enter shop stock, business cash, shares, and property held for sale. Your personal residence and vehicle are completely exempt.';
    }
  }

  if (stepNum === 5) {
    if (lang === 'ur') {
      return 'مرحلہ نمبر پانچ: وہ رقم جو آپ نے دوسروں کو دینی ہے۔ صرف وہ قرضے، غیر ادا شدہ بل اور قسطیں درج کریں جو فوری طور پر یا موجودہ قمری سال کے اندر واجب الادا ہیں۔';
    } else if (lang === 'ar') {
      return 'الخطوة الخامسة: الديون والالتزامات الواجبة عليك. أدخل فقط الديون والفواتير غير المدفوعة والأقساط المستحقة الآن أو خلال العام الهجري الحالي.';
    } else {
      return 'Step 5: Money you owe. Enter only debts, unpaid bills, and installments due now or within the current lunar year.';
    }
  }

  if (stepNum === 6) {
    const isHawlNotNo = STATE.wizard.hawlAnswer !== 'no';
    const totals = NisabModule ? NisabModule.calculateWizardTotals(STATE.wizard, {
      goldPricePerGram: STATE.goldPrice,
      silverPricePerGram: STATE.silverPrice,
      nisabStandard: STATE.nisabStandard
    }) : { zakatDue: 0, netWealth: 0, nisabThreshold: 0, meetsNisab: false };

    const currSym = CURRENCIES[STATE.currency] ? CURRENCIES[STATE.currency].symbol : 'Rs';
    const net = Math.round(totals.netWealth || 0);
    const nisab = Math.round(totals.nisabThreshold || 0);
    const zakatDue = totals.zakatResult ? totals.zakatResult.zakatDue : (totals.zakatDue || 0);
    const meetsNisab = totals.zakatResult ? totals.zakatResult.meetsNisab : (totals.meetsNisab || false);
    const zakat = Math.round(zakatDue || 0);

    if (STATE.wizard.hawlAnswer === 'no') {
      if (lang === 'ur') {
        return 'نتیجہ: ابھی آپ پر زکوٰۃ واجب نہیں ہے، کیونکہ اس مال پر مکمل ایک اسلامی قمری سال نہیں گزرا ہے۔ سال مکمل ہونے پر زکوٰۃ کا حساب دوبارہ کریں۔';
      } else if (lang === 'ar') {
        return 'النتيجة: لا تجب عليك الزكاة حاليًا لأنه لم يحل الحول القمري الكامل على هذا المال. تجب الزكاة عند اكتمال الحول.';
      } else {
        return 'Result: No zakat is due right now because a full Islamic year has not passed on this wealth. Check back once your lunar year completes.';
      }
    }

    if (meetsNisab && zakat > 0) {
      if (lang === 'ur') {
        return `نتیجہ: زکوٰۃ فرض ہے: ${zakat} ${currSym}۔ آپ کے پاس کل ${net} ${currSym} ہیں۔ نصاب کی حد ${nisab} ${currSym} ہے۔ آپ کی زکوٰۃ کل ڈھائی فیصد بنتی ہے۔`;
      } else if (lang === 'ar') {
        return `النتيجة: الزكاة واجبة: ${zakat} ${currSym}. إجمالي ثروتك ${net} ${currSym}. حد النصاب هو ${nisab} ${currSym}. مقدار الزكاة اثنان ونصف بالمائة.`;
      } else {
        return `Result: Zakat is due: ${currSym} ${zakat}. You have ${currSym} ${net}. The nisab is ${currSym} ${nisab}. Your zakat is 2.5% of ${currSym} ${net} which equals ${currSym} ${zakat}.`;
      }
    } else {
      if (lang === 'ur') {
        return `اس سال آپ پر زکوٰۃ واجب نہیں ہے کیونکہ آپ کی دولت نصاب سے کم ہے۔ آپ کے پاس کل ${net} ${currSym} ہیں، جبکہ نصاب کی حد ${nisab} ${currSym} ہے۔`;
      } else if (lang === 'ar') {
        return `لا تجب عليك الزكاة هذا العام لأن ثروتك أقل من حد النصاب. إجمالي ثروتك ${net} ${currSym}، وحد النصاب هو ${nisab} ${currSym}.`;
      } else {
        return `No zakat is due this year because your wealth is below the nisab threshold. You have ${currSym} ${net}, and the nisab is ${currSym} ${nisab}.`;
      }
    }
  }

  return '';
}

window.readStepAloud = function(stepNum) {
  // If user clicks the currently speaking step button, stop and toggle off
  if (activeSpeakingStep === stepNum) {
    window.stopSpeech();
    return;
  }

  // Stop previous speech instance
  window.stopSpeech();

  const lang = STATE.language || 'ur';

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    const msg = TRANSLATIONS[lang]?.voice_unavailable_toast || 'Speech synthesis is not supported on this device.';
    showSpeechToast(msg);
    return;
  }

  const textToRead = getStepSpeechContent(stepNum, lang);
  if (!textToRead) return;

  const utterance = new SpeechSynthesisUtterance(textToRead);
  utterance.rate = 0.92;
  utterance.pitch = 1.0;

  // Resolve best matching voice
  const voices = window.speechSynthesis.getVoices() || [];
  let matchedVoice = null;

  if (lang === 'ur') {
    matchedVoice = voices.find(v => v.lang && (v.lang.toLowerCase().startsWith('ur') || v.lang.toLowerCase().includes('pk')));
    if (!matchedVoice) {
      matchedVoice = voices.find(v => v.lang && (v.lang.toLowerCase().startsWith('ar') || v.lang.toLowerCase().startsWith('hi')));
    }
  } else if (lang === 'ar') {
    matchedVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('ar'));
  } else {
    matchedVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en'));
  }

  if (matchedVoice) {
    utterance.voice = matchedVoice;
    utterance.lang = matchedVoice.lang;
  } else {
    if (lang === 'ur' || lang === 'ar') {
      const msg = TRANSLATIONS[lang]?.voice_unavailable_toast || 'Speech voice is not available on this device.';
      showSpeechToast(msg);
    }
    utterance.lang = (lang === 'ur') ? 'ur-PK' : (lang === 'ar' ? 'ar-SA' : 'en-US');
  }

  activeSpeakingStep = stepNum;
  currentSpeechUtterance = utterance;

  // Highlight speaking button
  const btn = document.getElementById(`read-aloud-btn-${stepNum}`);
  if (btn) {
    btn.classList.add('speaking');
    const iconSpan = btn.querySelector('.read-aloud-icon');
    const labelSpan = btn.querySelector('.read-aloud-label');
    const stopText = TRANSLATIONS[lang]?.btn_stop_reading || 'Stop reading';
    if (iconSpan) iconSpan.textContent = '⏹️';
    if (labelSpan) labelSpan.textContent = stopText;
    btn.setAttribute('aria-label', stopText);
  }

  utterance.onend = function() {
    activeSpeakingStep = null;
    currentSpeechUtterance = null;
    resetAllReadAloudButtons();
  };

  utterance.onerror = function(e) {
    console.warn('Speech synthesis error:', e);
    activeSpeakingStep = null;
    currentSpeechUtterance = null;
    resetAllReadAloudButtons();
    const msg = TRANSLATIONS[lang]?.voice_unavailable_toast || 'Speech voice is not available on this device.';
    showSpeechToast(msg);
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech speak call failed:', err);
    resetAllReadAloudButtons();
  }
};

// Core Initialization
document.addEventListener('DOMContentLoaded', () => {
  initTextSize();
  loadWizardState();
  initStep1Controls();
  initWizardTypingListeners();
  initCarousel();
  translateUI();
  updateWizardCalculations();
  fetchLivePrices();
});

// Setup Step 1 Language & Currency Card Selectors
function initStep1Controls() {
  // Sync initial card states
  updateLanguageCards();
  updateCurrencyCards();
  initNisabPriceInputs();
}

function updateLanguageCards() {
  document.querySelectorAll('.lang-card').forEach(card => {
    const lang = card.getAttribute('data-lang');
    if (lang === STATE.language) {
      card.className = "lang-card tap-target-48 p-4 rounded-2xl border text-center transition-all duration-200 flex items-center justify-center gap-2 font-bold text-base bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm";
    } else {
      card.className = "lang-card tap-target-48 p-4 rounded-2xl border text-center transition-all duration-200 flex items-center justify-center gap-2 font-bold text-base bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100";
    }
  });

  const topSelect = document.getElementById('language-select');
  if (topSelect) topSelect.value = STATE.language;
}

function updateCurrencyCards() {
  document.querySelectorAll('.curr-card').forEach(card => {
    const curr = card.getAttribute('data-curr');
    if (curr === STATE.currency) {
      card.className = "curr-card tap-target-48 p-3 rounded-2xl border text-center transition-all duration-200 font-bold text-sm bg-emerald-700 text-white border-emerald-700 shadow-sm";
    } else {
      card.className = "curr-card tap-target-48 p-3 rounded-2xl border text-center transition-all duration-200 font-bold text-sm bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100";
    }
  });

  const topSelect = document.getElementById('currency-select');
  if (topSelect) topSelect.value = STATE.currency;

  updateCurrencySymbols();
}

function updateCurrencySymbols() {
  const sym = CURRENCIES[STATE.currency] ? CURRENCIES[STATE.currency].symbol : 'Rs';
  document.querySelectorAll('.currency-symbol').forEach(el => {
    // Preserve negative prefixes if present (e.g. -Rs)
    if (el.textContent.startsWith('-')) {
      el.textContent = `-${sym}`;
    } else {
      el.textContent = sym;
    }
  });
}

// User Action: Change Language
window.setLanguage = function(lang) {
  if (!TRANSLATIONS[lang]) return;
  if (typeof window !== 'undefined' && window.stopSpeech) window.stopSpeech();
  STATE.language = lang;
  updateLanguageCards();
  translateUI();
  updateWizardCalculations();
  saveWizardState();
};

// User Action: Change Currency
window.setCurrency = function(currCode) {
  if (!CURRENCIES[currCode]) return;
  const prevCode = STATE.currency;
  STATE.currency = currCode;

  // Auto-switch to standard rates for the new currency unless user explicitly customized prices
  if (!STATE.isUserCustomPrices) {
    STATE.goldPrice = CURRENCIES[currCode].gold;
    STATE.silverPrice = CURRENCIES[currCode].silver;
    const goldInput = document.getElementById('gold-price-input');
    const silverInput = document.getElementById('silver-price-input');
    if (goldInput) goldInput.value = STATE.goldPrice;
    if (silverInput) silverInput.value = STATE.silverPrice;
  }

  updateCurrencyCards();
  updateWizardCalculations();
  saveWizardState();
  fetchLivePrices();
};

// Translation Renderer
function translateUI() {
  const lang = STATE.language;
  document.documentElement.lang = lang;
  document.documentElement.dir = (lang === 'ur' || lang === 'ar') ? 'rtl' : 'ltr';

  // Translate all [data-i18n] nodes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
      el.innerHTML = TRANSLATIONS[lang][key];
    }
  });

  // Update dynamic banner and step titles
  updateStepHeader();
  if (typeof resetAllReadAloudButtons === 'function') resetAllReadAloudButtons();
}

// Nisab Price inputs and Standard Toggles
function initNisabPriceInputs() {
  const goldInput = document.getElementById('gold-price-input');
  const silverInput = document.getElementById('silver-price-input');

  if (goldInput && silverInput) {
    goldInput.value = STATE.goldPrice;
    silverInput.value = STATE.silverPrice;

    goldInput.addEventListener('input', (e) => {
      STATE.isUserCustomPrices = true;
      STATE.goldPrice = NisabModule ? NisabModule.parseLocalizedNumber(e.target.value) : (parseFloat(e.target.value) || 0);
      updateWizardCalculations();
      saveWizardState();
    });

    silverInput.addEventListener('input', (e) => {
      STATE.isUserCustomPrices = true;
      STATE.silverPrice = NisabModule ? NisabModule.parseLocalizedNumber(e.target.value) : (parseFloat(e.target.value) || 0);
      updateWizardCalculations();
      saveWizardState();
    });
  }

  const silverToggle = document.getElementById('nisab-silver-toggle');
  const goldToggle = document.getElementById('nisab-gold-toggle');

  if (silverToggle && goldToggle) {
    silverToggle.addEventListener('click', () => {
      STATE.nisabStandard = 'silver';
      silverToggle.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-sm';
      goldToggle.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 hover:text-slate-900';
      updateWizardCalculations();
      saveWizardState();
    });

    goldToggle.addEventListener('click', () => {
      STATE.nisabStandard = 'gold';
      goldToggle.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-sm';
      silverToggle.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 hover:text-slate-900';
      updateWizardCalculations();
      saveWizardState();
    });
  }
}

// Fetch live rates from /api/prices
async function fetchLivePrices() {
  const curr = STATE.currency;
  try {
    const res = await fetch(`/api/prices?currency=${curr}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();

    if (data && data.currencies && data.currencies[curr]) {
      const curRates = data.currencies[curr];
      STATE.isLivePrice = Boolean(data.isLive);
      STATE.pricesLastUpdated = data.updatedAtReadable || '18 Nov 2026';

      if (!STATE.isUserCustomPrices) {
        STATE.goldPrice = curRates.goldPricePerGram;
        STATE.silverPrice = curRates.silverPricePerGram;
        const goldInput = document.getElementById('gold-price-input');
        const silverInput = document.getElementById('silver-price-input');
        if (goldInput) goldInput.value = STATE.goldPrice;
        if (silverInput) silverInput.value = STATE.silverPrice;
      }

      updatePriceStatusUI(data.isLive, data.updatedAtReadable, data.notice);
      updateWizardCalculations();
      return;
    }
  } catch (err) {
    console.warn('Could not fetch live metal prices:', err.message);
  }

  // Graceful offline fallback
  STATE.isLivePrice = false;
  STATE.pricesLastUpdated = '18 Nov 2026';
  updatePriceStatusUI(false, '18 Nov 2026', 'Live price unavailable. Please check the price below.');
  updateWizardCalculations();
}

function updatePriceStatusUI(isLive, dateStr, notice) {
  const lang = STATE.language;
  const banner = document.getElementById('price-status-banner');
  const badge = document.getElementById('price-live-badge');
  const badgeText = document.getElementById('price-live-badge-text');
  const lastUpdatedEl = document.getElementById('price-last-updated-text');
  const messageEl = document.getElementById('price-status-message');

  if (lastUpdatedEl) {
    lastUpdatedEl.textContent = dateStr || '18 Nov 2026';
  }

  if (isLive) {
    if (banner) banner.classList.add('hidden');
    if (badge) {
      badge.className = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800';
    }
    if (badgeText) {
      badgeText.textContent = lang === 'ur' ? 'لائیو مارکیٹ ریٹس' : (lang === 'ar' ? 'أسعار السوق الحية' : 'Live Market Rates');
    }
  } else {
    if (banner) {
      banner.classList.remove('hidden');
      if (messageEl && notice) messageEl.textContent = notice;
    }
    if (badge) {
      badge.className = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800';
    }
    if (badgeText) {
      badgeText.textContent = lang === 'ur' ? '18 نومبر 2026 ریٹس (فال بیک)' : (lang === 'ar' ? 'أسعار احتياطية (18 نوفمبر 2026)' : '18 Nov 2026 Rates (Fallback)');
    }
  }
}

// Dynamic Typing Listeners for Wizard Fields
function initWizardTypingListeners() {
  document.querySelectorAll('[data-wizard-field]').forEach(input => {
    const fieldName = input.getAttribute('data-wizard-field');

    // Handle select dropdowns
    if (input.tagName === 'SELECT') {
      input.addEventListener('change', (e) => {
        STATE.wizard[fieldName] = e.target.value;
        updateWizardCalculations();
        saveWizardState();
      });
      return;
    }

    // Handle text inputs with numeric normalization
    input.addEventListener('input', (e) => {
      const raw = e.target.value;
      STATE.wizard[fieldName] = raw;
      updateWizardCalculations();
      saveWizardState();
    });

    // On blur, format cleanly with commas
    input.addEventListener('blur', (e) => {
      const parsed = NisabModule ? NisabModule.parseLocalizedNumber(e.target.value) : parseFloat(e.target.value);
      if (!isNaN(parsed) && parsed > 0) {
        e.target.value = formatNumberWithCommas(parsed);
      }
    });

    // On focus, select text for quick editing
    input.addEventListener('focus', (e) => {
      if (e.target.value === '0') e.target.value = '';
    });
  });
}

// Wizard Navigation Engine
window.goToStep = function(targetStep) {
  if (typeof window !== 'undefined' && window.stopSpeech) window.stopSpeech();
  const step = Math.max(1, Math.min(6, parseInt(targetStep) || 1));
  STATE.currentStep = step;

  // Toggle active wizard-step DOM element
  document.querySelectorAll('.wizard-step').forEach((el, index) => {
    if (index + 1 === step) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  // Update Progress Track
  const progressBar = document.getElementById('wizard-progress-bar');
  if (progressBar) {
    const percent = ((step / 6) * 100).toFixed(2);
    progressBar.style.width = `${percent}%`;
  }

  // Update Stepper Pill Buttons
  document.querySelectorAll('.stepper-tab').forEach(tab => {
    const tabStep = parseInt(tab.getAttribute('data-step'));
    if (tabStep === step) {
      tab.className = "stepper-tab py-2 px-1 rounded-xl text-xs font-bold transition-all duration-200 border bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm";
    } else if (tabStep < step) {
      tab.className = "stepper-tab py-2 px-1 rounded-xl text-xs font-bold transition-all duration-200 border bg-emerald-50/40 border-emerald-100 text-emerald-700 hover:bg-emerald-50";
    } else {
      tab.className = "stepper-tab py-2 px-1 rounded-xl text-xs font-bold transition-all duration-200 border bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100";
    }
  });

  updateStepHeader();
  updateWizardCalculations();
  saveWizardState();

  // Scroll to top of the calculator container smoothly
  const calcContainer = document.getElementById('calculator-section');
  if (calcContainer) {
    calcContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

function updateStepHeader() {
  const lang = STATE.language;
  const step = STATE.currentStep;

  const badgeEl = document.getElementById('wizard-step-badge');
  const titleEl = document.getElementById('wizard-step-title');

  const stepTitles = {
    ur: ['تعارف اور ترتیبات', 'نقد رقم اور بینک', 'سونا اور چاندی', 'کاروبار اور سرمایہ کاری', 'واجب الادا قرضے', 'حتمی زکوٰۃ کا نتیجہ'],
    en: ['Welcome & Settings', 'Cash & Bank Accounts', 'Gold & Silver Holdings', 'Business & Investments', 'Money You Owe Others', 'Final Zakat Calculation'],
    ar: ['المقدمة والإعدادات', 'السيولة والحسابات البنكية', 'حيازة الذهب والفضة', 'التجارة والاستثمارات', 'الديون والالتزامات', 'نتيجة الزكاة النهائية']
  };

  const badgeFormats = {
    ur: `مرحلہ ${step} از 6`,
    en: `Step ${step} of 6`,
    ar: `الخطوة ${step} من ٦`
  };

  if (badgeEl) badgeEl.textContent = (badgeFormats[lang] || badgeFormats.en);
  if (titleEl) {
    const titles = stepTitles[lang] || stepTitles.en;
    titleEl.textContent = titles[step - 1] || '';
  }
}

// Al-Hawl Answer Handler: supports 'yes', 'no', 'notsure'
window.setHawlAnswer = function(answer) {
  if (answer === true || answer === 'yes') {
    STATE.wizard.hawlAnswer = 'yes';
  } else if (answer === false || answer === 'no') {
    STATE.wizard.hawlAnswer = 'no';
  } else {
    STATE.wizard.hawlAnswer = 'notsure';
  }

  const btnYes = document.getElementById('hawl-btn-yes');
  const btnNo = document.getElementById('hawl-btn-no');
  const btnNotsure = document.getElementById('hawl-btn-notsure');
  const guideCard = document.getElementById('hawl-notsure-guide');

  if (btnYes && btnNo) {
    if (STATE.wizard.hawlAnswer === 'yes') {
      btnYes.className = "tap-target-48 p-3.5 rounded-xl border text-center font-bold text-base transition-all duration-200 bg-emerald-600 text-white border-emerald-600 shadow-sm";
      btnNo.className = "tap-target-48 p-3.5 rounded-xl border text-center font-bold text-base transition-all duration-200 bg-white border-slate-300 text-slate-700 hover:bg-slate-100";
      if (btnNotsure) btnNotsure.className = "tap-target-48 p-3.5 rounded-xl border text-center font-bold text-base transition-all duration-200 bg-white border-slate-300 text-slate-700 hover:bg-slate-100";
      if (guideCard) guideCard.classList.add('hidden');
    } else if (STATE.wizard.hawlAnswer === 'no') {
      btnNo.className = "tap-target-48 p-3.5 rounded-xl border text-center font-bold text-base transition-all duration-200 bg-rose-600 text-white border-rose-600 shadow-sm";
      btnYes.className = "tap-target-48 p-3.5 rounded-xl border text-center font-bold text-base transition-all duration-200 bg-white border-slate-300 text-slate-700 hover:bg-slate-100";
      if (btnNotsure) btnNotsure.className = "tap-target-48 p-3.5 rounded-xl border text-center font-bold text-base transition-all duration-200 bg-white border-slate-300 text-slate-700 hover:bg-slate-100";
      if (guideCard) guideCard.classList.add('hidden');
    } else {
      if (btnNotsure) btnNotsure.className = "tap-target-48 p-3.5 rounded-xl border text-center font-bold text-base transition-all duration-200 bg-amber-500 text-white border-amber-500 shadow-sm";
      btnYes.className = "tap-target-48 p-3.5 rounded-xl border text-center font-bold text-base transition-all duration-200 bg-white border-slate-300 text-slate-700 hover:bg-slate-100";
      btnNo.className = "tap-target-48 p-3.5 rounded-xl border text-center font-bold text-base transition-all duration-200 bg-white border-slate-300 text-slate-700 hover:bg-slate-100";
      if (guideCard) guideCard.classList.remove('hidden');
    }
  }

  updateWizardCalculations();
  saveWizardState();
};

// Main Live Calculation & Display Synchronizer
function updateWizardCalculations() {
  const lang = STATE.language;

  // 1. Calculate Nisab Thresholds
  const goldNisab = NisabModule 
    ? NisabModule.calculateNisabThreshold({ standard: 'gold', goldPricePerGram: STATE.goldPrice })
    : (87.48 * STATE.goldPrice);
  const silverNisab = NisabModule 
    ? NisabModule.calculateNisabThreshold({ standard: 'silver', silverPricePerGram: STATE.silverPrice })
    : (612.36 * STATE.silverPrice);

  const goldValEl = document.getElementById('nisab-gold-value');
  const silverValEl = document.getElementById('nisab-silver-value');
  if (goldValEl) goldValEl.textContent = formatMoney(goldNisab);
  if (silverValEl) silverValEl.textContent = formatMoney(silverNisab);

  const activeNisabThreshold = STATE.nisabStandard === 'gold' ? goldNisab : silverNisab;
  const standardName = STATE.nisabStandard === 'gold' 
    ? (TRANSLATIONS[lang].active_standard_gold || 'Gold Standard') 
    : (TRANSLATIONS[lang].active_standard_silver || 'Silver (Hanafi / Pakistan)');
  const thresholdWeight = STATE.nisabStandard === 'gold' ? '87.48g (7.5 tola)' : '612.36g (52.5 tola)';

  const activeStandardNameEl = document.getElementById('active-standard-name');
  if (activeStandardNameEl) activeStandardNameEl.textContent = standardName;

  const activeBanner = document.getElementById('active-nisab-banner-text');
  if (activeBanner) {
    const formattedNisab = formatMoney(activeNisabThreshold);
    let bannerText = (lang === 'ur')
      ? `فعال نصاب: <strong>${standardName}</strong>۔ زکوٰۃ کے واجب ہونے کے لیے آپ کی خالص دولت کا <strong>${formattedNisab}</strong> (${thresholdWeight}) سے زائد ہونا ضروری ہے۔`
      : (lang === 'ar'
        ? `المعيار المعتمد: <strong>${standardName}</strong>. يجب أن يتجاوز صافي ثروتك <strong>${formattedNisab}</strong> (${thresholdWeight}) لتجب عليك الزكاة.`
        : `Active Standard: <strong>${standardName}</strong>. Your net wealth must exceed <strong>${formattedNisab}</strong> (${thresholdWeight}) to be eligible for Zakat.`);
    activeBanner.innerHTML = bannerText;
  }

  // 2. Perform Comprehensive Wizard Math via Nisab Module
  const isHawlNotNo = STATE.wizard.hawlAnswer !== 'no';
  const totals = NisabModule ? NisabModule.calculateWizardTotals(STATE.wizard, {
    goldPricePerGram: STATE.goldPrice,
    silverPricePerGram: STATE.silverPrice,
    nisabStandard: STATE.nisabStandard
  }) : {
    cashTotal: 0,
    goldPureGrams: 0,
    goldValue: 0,
    silverGrams: 0,
    silverValue: 0,
    metalsTotal: 0,
    businessTotal: 0,
    debtsTotal: 0,
    grossAssets: 0,
    netWealth: 0,
    nisabThreshold: activeNisabThreshold,
    meetsNisab: false,
    hawlConfirmed: isHawlNotNo,
    isEligible: false,
    zakatDue: 0
  };

  // 3. Update Step Subtotals
  const subtotalCashEl = document.getElementById('wizard-subtotal-cash');
  const subtotalMetalsEl = document.getElementById('wizard-subtotal-metals');
  const subtotalBusinessEl = document.getElementById('wizard-subtotal-business');
  const subtotalDebtsEl = document.getElementById('wizard-subtotal-debts');

  if (subtotalCashEl) subtotalCashEl.textContent = formatMoney(totals.cashTotal);
  if (subtotalMetalsEl) subtotalMetalsEl.textContent = formatMoney(totals.metalsTotal);
  if (subtotalBusinessEl) subtotalBusinessEl.textContent = formatMoney(totals.businessTotal);
  if (subtotalDebtsEl) subtotalDebtsEl.textContent = `-${formatMoney(totals.debtsTotal)}`;

  // 4. Update Gold & Silver Live Math Displays
  const pureGoldDisplay = document.getElementById('wizard-pure-gold-display');
  const goldValDisplay = document.getElementById('wizard-gold-val-display');
  const silverValDisplay = document.getElementById('wizard-silver-val-display');

  if (pureGoldDisplay) {
    pureGoldDisplay.textContent = `${totals.goldPureGrams.toFixed(2)} grams`;
  }
  if (goldValDisplay) {
    goldValDisplay.textContent = formatMoney(totals.goldValue);
  }
  if (silverValDisplay) {
    silverValDisplay.textContent = formatMoney(totals.silverValue);
  }

  // 5. Update Live Bottom Bar
  const stickyZakatEl = document.getElementById('sticky-zakat-value');
  const liveNetWealthEl = document.getElementById('live-net-wealth-text');
  const liveNisabChipVal = document.getElementById('live-nisab-chip-val');

  if (stickyZakatEl) stickyZakatEl.textContent = formatMoney(totals.zakatDue);
  if (liveNetWealthEl) liveNetWealthEl.textContent = `(Net: ${formatMoney(totals.netWealth)})`;
  if (liveNisabChipVal) liveNisabChipVal.textContent = formatMoney(activeNisabThreshold);

  // 6. Update Step 6 Breakdown Cards (6 cards with small icons)
  const cardCash = document.getElementById('card-breakdown-cash');
  const cardMetals = document.getElementById('card-breakdown-metals');
  const cardBusiness = document.getElementById('card-breakdown-business');
  const cardDebts = document.getElementById('card-breakdown-debts');
  const cardNet = document.getElementById('card-breakdown-net');
  const cardNisab = document.getElementById('card-breakdown-nisab');

  if (cardCash) cardCash.textContent = formatMoney(totals.cashTotal);
  if (cardMetals) cardMetals.textContent = formatMoney(totals.metalsTotal);
  if (cardBusiness) cardBusiness.textContent = formatMoney(totals.businessTotal);
  if (cardDebts) cardDebts.textContent = `-${formatMoney(totals.debtsTotal)}`;
  if (cardNet) cardNet.textContent = formatMoney(totals.netWealth);
  if (cardNisab) cardNisab.textContent = formatMoney(activeNisabThreshold);

  // 7. Update Step 6 Main Result Card & Canonical Plain Headline
  const resultBox = document.getElementById('wizard-result-box');
  const resultDueDisplay = document.getElementById('wizard-zakat-due-display');
  const resultPlainMsg = document.getElementById('wizard-result-plain-message');
  const storyText = document.getElementById('wizard-story-text');
  const currSym = CURRENCIES[STATE.currency] ? CURRENCIES[STATE.currency].symbol : 'Rs';

  if (resultDueDisplay) resultDueDisplay.textContent = formatMoney(totals.zakatDue);

  if (!totals.meetsNisab) {
    // Wealth is below Nisab
    if (resultBox) {
      resultBox.className = "p-6 sm:p-8 rounded-3xl bg-sky-50 border border-sky-200 text-sky-950 shadow-sm space-y-3 text-center transition-all duration-300";
    }
    if (resultDueDisplay) resultDueDisplay.className = "text-4xl sm:text-5xl font-black tracking-tight text-sky-700 my-2";
  } else if (STATE.wizard.hawlAnswer === 'no') {
    // Meets Nisab but full lunar year has not completed
    if (resultBox) {
      resultBox.className = "p-6 sm:p-8 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 shadow-sm space-y-3 text-center transition-all duration-300";
    }
    if (resultDueDisplay) resultDueDisplay.className = "text-4xl sm:text-5xl font-black tracking-tight text-amber-700 my-2";
  } else {
    // Eligible: Meets Nisab and Hawl completed
    if (resultBox) {
      resultBox.className = "p-6 sm:p-8 rounded-3xl bg-emerald-600 text-white shadow-xl space-y-3 text-center transition-all duration-300";
    }
    if (resultDueDisplay) resultDueDisplay.className = "text-4xl sm:text-5xl font-black tracking-tight text-white my-2";
  }

  // Canonical plain headline: "Zakat is due: Rs X" OR "No zakat is due this year because your wealth is below the nisab."
  if (resultPlainMsg) {
    resultPlainMsg.textContent = NisabModule ? NisabModule.formatZakatHeadline({
      meetsNisab: totals.meetsNisab,
      hawlConfirmed: STATE.wizard.hawlAnswer !== 'no',
      zakatDue: totals.zakatDue,
      symbol: currSym,
      language: lang
    }) : `Zakat is due: ${formatMoney(totals.zakatDue)}`;
  }

  // 8. Canonical Short Story sentence: "You have Rs A. The nisab is Rs B. Your zakat is 2.5% of Rs C = Rs D."
  if (storyText) {
    storyText.innerHTML = NisabModule ? NisabModule.formatZakatStory({
      grossAssets: totals.grossAssets,
      netWealth: totals.netWealth,
      nisabThreshold: activeNisabThreshold,
      zakatDue: totals.zakatDue,
      symbol: currSym,
      language: lang
    }) : `You have ${formatMoney(totals.grossAssets)}. The nisab is ${formatMoney(activeNisabThreshold)}. Your zakat is 2.5% of ${formatMoney(totals.netWealth)} = ${formatMoney(totals.zakatDue)}.`;
  }

  // 9. Sync PDF Print Elements
  syncPrintReport(totals, standardName, activeNisabThreshold);
}

// Synchronize Wizard state into Print Report DOM for high-fidelity PDF export
function syncPrintReport(totals, standardName, activeNisab) {
  const printAssetsBody = document.getElementById('print-assets-table-body');
  const printLiabsBody = document.getElementById('print-liabilities-table-body');
  const lang = STATE.language;

  if (printAssetsBody) {
    const rows = [];
    if (totals.cashTotal > 0) {
      rows.push(`
        <tr class="border-b border-slate-100">
          <td class="py-2.5 font-medium text-slate-800 text-start">${lang === 'ur' ? 'نقد رقم اور بینک بچت' : (lang === 'ar' ? 'السيولة والحسابات البنكية' : 'Cash and Bank Savings')}</td>
          <td class="py-2.5 text-end font-semibold text-slate-900">${formatMoney(totals.cashTotal)}</td>
        </tr>
      `);
    }
    if (totals.goldValue > 0) {
      rows.push(`
        <tr class="border-b border-slate-100">
          <td class="py-2.5 font-medium text-slate-800 text-start">${lang === 'ur' ? 'سونا (خالص عیار شدہ)' : (lang === 'ar' ? 'الذهب المقوم' : 'Gold Holdings (Carat Adjusted)')} (${totals.goldPureGrams.toFixed(2)}g)</td>
          <td class="py-2.5 text-end font-semibold text-slate-900">${formatMoney(totals.goldValue)}</td>
        </tr>
      `);
    }
    if (totals.silverValue > 0) {
      rows.push(`
        <tr class="border-b border-slate-100">
          <td class="py-2.5 font-medium text-slate-800 text-start">${lang === 'ur' ? 'چاندی' : (lang === 'ar' ? 'الفضة' : 'Silver Holdings')} (${totals.silverGrams.toFixed(2)}g)</td>
          <td class="py-2.5 text-end font-semibold text-slate-900">${formatMoney(totals.silverValue)}</td>
        </tr>
      `);
    }
    if (totals.businessTotal > 0) {
      rows.push(`
        <tr class="border-b border-slate-100">
          <td class="py-2.5 font-medium text-slate-800 text-start">${lang === 'ur' ? 'کاروباری مال، حصص و سرمایہ کاری' : (lang === 'ar' ? 'عروض التجارة والاستثمارات' : 'Business Goods & Investments')}</td>
          <td class="py-2.5 text-end font-semibold text-slate-900">${formatMoney(totals.businessTotal)}</td>
        </tr>
      `);
    }

    if (rows.length === 0) {
      printAssetsBody.innerHTML = `<tr><td colspan="2" class="py-2.5 text-slate-400 italic text-sm text-start">No reportable assets declared.</td></tr>`;
    } else {
      printAssetsBody.innerHTML = rows.join('');
    }
  }

  if (printLiabsBody) {
    if (totals.debtsTotal > 0) {
      printLiabsBody.innerHTML = `
        <tr class="border-b border-slate-100">
          <td class="py-2.5 text-slate-700 text-start">${lang === 'ur' ? 'فوری اور سالانہ واجب الادا قرضے و بلز' : (lang === 'ar' ? 'الديون والفواتير الحالة' : 'Debts, Overdue Bills & Current-Year Installments')}</td>
          <td class="py-2.5 text-end font-semibold text-rose-700">-${formatMoney(totals.debtsTotal)}</td>
        </tr>
      `;
    } else {
      printLiabsBody.innerHTML = `<tr><td colspan="2" class="py-2.5 text-slate-400 italic text-sm text-start">No deductible liabilities reported.</td></tr>`;
    }
  }

  const printDate = document.getElementById('print-date');
  if (printDate) {
    const now = new Date();
    printDate.textContent = now.toLocaleDateString(undefined, { dateStyle: 'full' }) + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const printNisabStandard = document.getElementById('print-nisab-standard');
  if (printNisabStandard) printNisabStandard.textContent = `${standardName} (${formatMoney(activeNisab)})`;

  const printGoldRate = document.getElementById('print-gold-rate');
  if (printGoldRate) printGoldRate.textContent = `${formatMoney(STATE.goldPrice)} / gram`;

  const printSilverRate = document.getElementById('print-silver-rate');
  if (printSilverRate) printSilverRate.textContent = `${formatMoney(STATE.silverPrice)} / gram`;

  const printPricesDate = document.getElementById('print-prices-date');
  if (printPricesDate) {
    printPricesDate.textContent = `${STATE.pricesLastUpdated || '18 Nov 2026'} (${STATE.isLivePrice ? (lang === 'ur' ? 'لائیو مارکیٹ' : 'Live') : (lang === 'ur' ? 'مارکیٹ ریٹس' : 'Fallback Rates')})`;
  }

  const printTotalAssets = document.getElementById('print-total-assets');
  if (printTotalAssets) printTotalAssets.textContent = formatMoney(totals.grossAssets);

  const printTotalLiabs = document.getElementById('print-total-liabilities');
  if (printTotalLiabs) printTotalLiabs.textContent = `-${formatMoney(totals.debtsTotal)}`;

  const printNetWealth = document.getElementById('print-net-wealth');
  if (printNetWealth) printNetWealth.textContent = formatMoney(totals.netWealth);

  const printZakatDue = document.getElementById('print-zakat-due');
  if (printZakatDue) printZakatDue.textContent = formatMoney(totals.zakatDue);

  // Screen Reader Live Announcer
  const liveAnnouncer = document.getElementById('live-calculator-announcer');
  if (liveAnnouncer) {
    liveAnnouncer.textContent = totals.meetsNisab 
      ? `Zakat calculation updated: ${formatMoney(totals.zakatDue)} due on net wealth of ${formatMoney(totals.netWealth)}.`
      : `Zakat calculation updated: Net wealth is ${formatMoney(totals.netWealth)}, below nisab threshold.`;
  }
}

// Help Modal Controller
window.showHelp = function(topicId) {
  const helpData = HELP_TOPICS[topicId];
  if (!helpData) return;

  const lang = STATE.language;
  const title = (helpData.title && helpData.title[lang]) || helpData.title.en;
  const body = (helpData.body && helpData.body[lang]) || helpData.body.en;

  const modalTitle = document.getElementById('help-modal-title');
  const modalBody = document.getElementById('help-modal-body');

  if (modalTitle) modalTitle.textContent = title;
  if (modalBody) modalBody.innerHTML = body;

  openModal('help-modal');
};

// WhatsApp Sharing
window.shareOnWhatsApp = function() {
  const lang = STATE.language;
  const curr = CURRENCIES[STATE.currency] || CURRENCIES.PKR;
  const totals = NisabModule ? NisabModule.calculateWizardTotals(STATE.wizard, {
    goldPricePerGram: STATE.goldPrice,
    silverPricePerGram: STATE.silverPrice,
    nisabStandard: STATE.nisabStandard
  }) : { zakatDue: 0, netWealth: 0 };

  let text = '';
  if (lang === 'ur') {
    text = `*زکوٰۃ فلو کیلکولیشن رپورٹ*\n\n` +
      `خالص دولت: ${formatMoney(totals.netWealth)}\n` +
      `واجب الادا زکوٰۃ (2.5%): *${formatMoney(totals.zakatDue)}*\n\n` +
      `اپنے مال کی شرعی تطہیر کے لیے زکوٰۃ فلو استعمال کریں:\nhttps://zakat-calculator-dun-pi.vercel.app/`;
  } else if (lang === 'ar') {
    text = `*تقرير حساب الزكاة - زكاة فلو*\n\n` +
      `صافي الوعاء الزكوي: ${formatMoney(totals.netWealth)}\n` +
      `إجمالي الزكاة الواجبة: *${formatMoney(totals.zakatDue)}*\n\n` +
      `احسب زكاتك بدقة وسهولة عبر:\nhttps://zakat-calculator-dun-pi.vercel.app/`;
  } else {
    text = `*ZakatFlow Calculation Summary*\n\n` +
      `Net Zakatable Wealth: ${formatMoney(totals.netWealth)}\n` +
      `Zakat Obligation (2.5%): *${formatMoney(totals.zakatDue)}*\n\n` +
      `Calculate your Zakat with peace of mind:\nhttps://zakat-calculator-dun-pi.vercel.app/`;
  }

  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, '_blank');
};

// Reset Wizard Operation
window.resetWizard = function() {
  if (typeof window !== 'undefined' && window.stopSpeech) window.stopSpeech();
  const confirmMsg = STATE.language === 'ur'
    ? 'کیا آپ واقعی تمام اندراجات صاف کر کے شروع سے حساب کرنا چاہتے ہیں؟'
    : (STATE.language === 'ar' ? 'هل تريد حقاً مسح جميع البيانات والبدء من جديد؟' : 'Are you sure you want to reset all fields and start again?');

  if (!confirm(confirmMsg)) return;

  STATE.wizard = {
    cashInHand: '',
    bankAccounts: '',
    otherSavings: '',
    moneyOwedToMe: '',
    goldWeight: '',
    goldUnit: 'tola',
    goldCarat: '22',
    silverWeight: '',
    silverUnit: 'tola',
    shopStock: '',
    businessCash: '',
    sharesFunds: '',
    propertyForSale: '',
    debtsDueNow: '',
    unpaidBills: '',
    installmentsThisYear: '',
    hawlAnswer: 'yes'
  };

  // Clear inputs in DOM
  document.querySelectorAll('[data-wizard-field]').forEach(input => {
    if (input.tagName === 'SELECT') {
      if (input.id === 'wizard-gold-unit' || input.id === 'wizard-silver-unit') input.value = 'tola';
      if (input.id === 'wizard-gold-carat') input.value = '22';
    } else {
      input.value = '';
    }
  });

  setHawlAnswer(true);
  localStorage.removeItem(AUTOSAVE_KEY);
  goToStep(1);
  showToast(STATE.language === 'ur' ? 'حساب دوبارہ شروع ہو گیا' : 'Wizard reset to start.', 'info');
};

// Auto-Save Management
function saveWizardState() {
  try {
    const payload = {
      language: STATE.language,
      currency: STATE.currency,
      nisabStandard: STATE.nisabStandard,
      currentStep: STATE.currentStep,
      wizard: STATE.wizard,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));

    const statusEl = document.getElementById('wizard-autosave-status');
    if (statusEl) {
      statusEl.classList.add('text-emerald-700', 'font-bold');
      setTimeout(() => {
        statusEl.classList.remove('text-emerald-700', 'font-bold');
      }, 1000);
    }
  } catch (e) {
    console.warn('Auto-save unavailable:', e.message);
  }
}

function loadWizardState() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data) return;

    if (data.language && TRANSLATIONS[data.language]) STATE.language = data.language;
    if (data.currency && CURRENCIES[data.currency]) STATE.currency = data.currency;
    if (data.nisabStandard) STATE.nisabStandard = data.nisabStandard;
    if (data.wizard) {
      STATE.wizard = Object.assign(STATE.wizard, data.wizard);
    }
    if (data.currentStep && data.currentStep >= 1 && data.currentStep <= 6) {
      STATE.currentStep = data.currentStep;
    }

    // Hydrate DOM fields
    document.querySelectorAll('[data-wizard-field]').forEach(input => {
      const fieldName = input.getAttribute('data-wizard-field');
      if (STATE.wizard[fieldName] !== undefined && STATE.wizard[fieldName] !== '') {
        input.value = STATE.wizard[fieldName];
      }
    });

    // Restore Hawl state
    if (STATE.wizard.hawlAnswer) {
      setHawlAnswer(STATE.wizard.hawlAnswer === 'yes');
    }

    // Restore step view
    if (STATE.currentStep > 1) {
      goToStep(STATE.currentStep);
    }
  } catch (e) {
    console.warn('Failed to load auto-saved progress:', e.message);
  }
}

// Carousel Functionality for Hadith & Quranic Verses Banner
let carouselTimer = null;
function initCarousel() {
  const track = document.querySelector('.carousel-track');
  const slides = Array.from(document.querySelectorAll('.carousel-slide'));
  const dotsContainer = document.querySelector('.carousel-dots');
  const prevBtn = document.getElementById('carousel-prev-btn');
  const nextBtn = document.getElementById('carousel-next-btn');

  if (!track || slides.length === 0) return;

  let currentIndex = 0;

  // Render Dots
  if (dotsContainer) {
    dotsContainer.innerHTML = slides.map((_, index) =>
      `<button class="w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === 0 ? 'bg-emerald-600 scale-125' : 'bg-slate-300 hover:bg-slate-400'}" data-slide="${index}" aria-label="Go to slide ${index + 1}"></button>`
    ).join('');
  }

  const dots = dotsContainer ? Array.from(dotsContainer.querySelectorAll('button')) : [];

  function updateCarousel() {
    const isRtl = document.documentElement.dir === 'rtl';
    const offset = currentIndex * 100;
    track.style.transform = isRtl ? `translateX(${offset}%)` : `translateX(-${offset}%)`;

    dots.forEach((dot, index) => {
      if (index === currentIndex) {
        dot.className = "w-2.5 h-2.5 rounded-full bg-emerald-500 scale-125 transition-all duration-300";
      } else {
        dot.className = "w-2 h-2 rounded-full bg-slate-500 hover:bg-slate-400 transition-all duration-300";
      }
    });
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % slides.length;
    updateCarousel();
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateCarousel();
  }

  function startTimer() {
    stopTimer();
    carouselTimer = setInterval(nextSlide, 15000);
  }

  function stopTimer() {
    if (carouselTimer) clearInterval(carouselTimer);
  }

  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      currentIndex = parseInt(e.target.dataset.slide);
      updateCarousel();
      startTimer();
    });
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      startTimer();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      startTimer();
    });
  }

  track.addEventListener('mouseenter', stopTimer);
  track.addEventListener('mouseleave', startTimer);

  // Touch Swipe Support
  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const threshold = 40;
    const isRtl = document.documentElement.dir === 'rtl';

    if (touchEndX < touchStartX - threshold) {
      if (isRtl) prevSlide(); else nextSlide();
      startTimer();
    } else if (touchEndX > touchStartX + threshold) {
      if (isRtl) nextSlide(); else prevSlide();
      startTimer();
    }
  }, { passive: true });

  startTimer();
  window.addEventListener('resize', updateCarousel);
}

// Accessible Modal System: Focus Trapping, Esc Closing & Focus Restoration
const modalFocusStack = new Map();

window.openModal = function(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  // 1. Remember previously focused element
  if (typeof document !== 'undefined' && document.activeElement) {
    modalFocusStack.set(id, document.activeElement);
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('role', 'dialog');
  document.body.style.overflow = 'hidden';

  // 2. Discover focusable elements for trap
  const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const getFocusable = () => Array.from(modal.querySelectorAll(focusableSelector)).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
  const focusables = getFocusable();
  
  if (focusables.length > 0) {
    focusables[0].focus();
  }

  // 3. Keydown Listener: Esc and Focus Trap
  const keydownHandler = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal(id);
      return;
    }

    if (e.key === 'Tab') {
      const currentFocusables = getFocusable();
      if (currentFocusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = currentFocusables[0];
      const last = currentFocusables[currentFocusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first || !modal.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last || !modal.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  };

  modal._keydownHandler = keydownHandler;
  modal.addEventListener('keydown', keydownHandler);

  // Click outside to close
  modal.onclick = (e) => {
    if (e.target === modal) {
      closeModal(id);
    }
  };
};

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  if (modal._keydownHandler) {
    modal.removeEventListener('keydown', modal._keydownHandler);
    delete modal._keydownHandler;
  }

  modal.classList.remove('flex');
  modal.classList.add('hidden');
  modal.removeAttribute('aria-modal');
  document.body.style.overflow = '';

  // Return focus to the trigger element that opened this modal
  const previousElement = modalFocusStack.get(id);
  if (previousElement && typeof previousElement.focus === 'function') {
    try {
      previousElement.focus();
    } catch (e) {
      console.warn('Could not restore focus:', e);
    }
  }
  modalFocusStack.delete(id);
};

// Export PDF Report handler
window.exportReport = function() {
  window.print();
};

// Toast Notifications
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

  toast.className = `${colors[type] || colors.success} px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 animate-scale-in transition-all duration-300`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'scale-95');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
