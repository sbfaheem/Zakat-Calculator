// ZakatFlow Core Logic with Trilingual and RTL Support

// Helper to generate unique IDs
function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

// State Management
const STATE = {
  language: 'en',
  currency: 'USD',
  nisabStandard: 'silver', // 'silver' is preferred by contemporary scholars as default
  goldPrice: 65.50,
  silverPrice: 0.75,
  assets: [
    { id: generateId(), type: 'Cash', unit: 'Currency', amount: 0, price: 1, total: 0, isPriceCustom: false }
  ],
  liabilities: [
    { id: generateId(), description: '', amount: 0 }
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

// Translation Dictionary
const TRANSLATIONS = {
  en: {
    brand_name: 'Zakat<span class="text-emerald-600">Flow</span>',
    brand_name_footer: 'Zakat<span class="text-emerald-500">Flow</span>',
    nav_calculator: 'Calculator',
    nav_principles: 'Principles',
    nav_nisab: 'Nisab Info',
    nav_history: 'History',
    nav_drafts_badge: 'Drafts',
    hero_title: 'Purify Your Wealth with Precision',
    hero_subtitle: 'A serene, accurate, and dignified calculation experience honoring the spiritual obligation of Zakat. Clear your debts to society and purify your remaining wealth.',
    hero_badge: 'Based on authentic scholarly consensus',
    nisab_card_title: 'Nisab Threshold',
    nisab_card_subtitle: 'Determine the minimum wealth required for Zakat obligation.',
    nisab_toggle_gold: 'Gold (87.48g)',
    nisab_toggle_silver: 'Silver (612.36g)',
    gold_price_label: 'Current Gold Price (per gram)',
    silver_price_label: 'Current Silver Price (per gram)',
    threshold_val_label: 'Threshold Value:',
    active_nisab_text: 'Active Threshold: <strong>{standard}</strong>. Your wealth must exceed <strong>{val}</strong> ({weight}) to be eligible for Zakat.',
    assets_card_title: 'Zakatable Assets',
    assets_card_subtitle: 'Declare eligible assets you possess (gold, silver, cash, shares, etc.).',
    btn_add_asset: 'Add Asset',
    col_asset_category: 'Asset Category',
    col_unit: 'Unit',
    col_weight: 'Weight / Amount',
    col_price: 'Price per Unit',
    col_total: 'Total Value',
    unit_currency: 'Currency',
    unit_grams: 'Grams (g)',
    unit_tolas: 'Tolas',
    'asset_Cash': 'Cash in Hand/Bank',
    'asset_Gold': 'Gold',
    'asset_Silver': 'Silver',
    'asset_Shares/Investments': 'Shares/Investments',
    'asset_Business Merchandise': 'Business Merchandise',
    'asset_Agricultural Produce': 'Agricultural Produce',
    'asset_Livestock': 'Livestock',
    liabs_card_title: 'Deductible Liabilities',
    liabs_card_subtitle: 'Declare short-term loans, bills, or immediate essential expenses to exclude.',
    btn_add_liability: 'Add Liability',
    liabs_description: 'Description',
    liabs_amount: 'Amount Due',
    liabs_placeholder: 'e.g. Credit Card Bills, Rent Due',
    liabs_note: '<strong>Advisory Note:</strong> According to Islamic jurisprudence, only outstanding debts due immediately or within the current lunar year can be deducted from your zakatable assets.',
    hawl_title: 'I confirm Al-Hawl (Lunar Year Completion)',
    hawl_subtitle: 'I attest that I have possessed this minimum amount of wealth (Nisab) for one complete lunar year.',
    citation_ibn_majah: 'Sunan Ibn Majah',
    citation_tawbah: 'Surah At-Tawbah 9:60',
    tooltip_ibn_majah: '"No Zakat is due on wealth until a year has passed over it." (Sunan Ibn Majah, Hadith 1792)',
    tooltip_tawbah: 'Ordinance describing the eight categories of eligible Zakat recipients.',
    summary_title: 'Calculation Summary',
    summary_assets: 'Total Assets',
    summary_liabilities: 'Total Liabilities',
    summary_net_wealth: 'Net Zakatable Wealth',
    zakat_box_header: 'Total Zakat Due (2.5%)',
    zakat_msg_met: 'Your wealth meets the Nisab threshold.',
    zakat_msg_below: 'Your wealth does not meet the Nisab threshold this year. No Zakat is due, but voluntary charity (Sadaqah) is highly rewarded.',
    zakat_msg_hawl: 'Al-Hawl (lunar year possession) must be confirmed to make Zakat obligatory.',
    btn_export: 'Export Report PDF',
    btn_save: 'Save Draft',
    btn_close: 'Close',
    btn_understood: 'Understood',
    btn_close_guide: 'Close Guide',
    insights_title: 'Zakat Insights',
    insight_1_quote: '"Islam is based on (the following) five (principles)... to establish the (daily) prayers, to pay the Zakat..."',
    insight_1_source: '— Sahih al-Bukhari 8',
    insight_2_quote: '"Take, [O Muhammad], from their wealth a charity by which you purify them and cause them increase..."',
    insight_2_source: '— Surah At-Tawbah 9:103',
    insight_3_quote: '"Zakat expenditures are only for the poor and for the needy and for those employed to collect it..."',
    insight_3_source: '— Surah At-Tawbah 9:60',
    insight_4_quote: '"No Zakat is due on wealth until a year has passed over it."',
    insight_4_source: '— Sunan Ibn Majah',
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
    print_declaration: '"Purify your wealth through the calculation and timely payment of Zakat. This report has been verified under standard Islamic calculations and is correct to the best of user knowledge."',
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
    modal_nisab_f_gold: 'Gold standard Nisab: 87.48 grams (7.5 Tolas)',
    modal_nisab_f_silver: 'Silver standard Nisab: 612.36 grams (52.5 Tolas)',
    modal_nisab_rec: 'Scholarly Recommendation: While both thresholds are religiously valid, contemporary scholars strongly recommend calculating Zakat using the Silver Nisab standard. Since silver price is lower, it reduces the threshold, allowing more individuals to contribute and maximizing the assistance provided to the poor and needy.',
    modal_history_title: 'Saved Calculation Drafts',
    history_empty_title: 'No saved drafts found.',
    history_empty_body: 'Calculations you save will appear here.',
    history_net: 'Net Wealth',
    history_curr: 'Currency'
  },
  ar: {
    brand_name: 'زكاة<span class="text-emerald-600"> فلو</span>',
    brand_name_footer: 'زكاة<span class="text-emerald-500"> فلو</span>',
    nav_calculator: 'الحاسبة',
    nav_principles: 'المبادئ الشرعية',
    nav_nisab: 'نصاب الزكاة',
    nav_history: 'المسودات المحفوظة',
    nav_drafts_badge: 'مسودات',
    hero_title: 'طهّر مالك بدقة وإخلاص',
    hero_subtitle: 'تجربة حسابية هادئة، دقيقة ومحترمة تلتزم بفرائض الزكاة الشرعية. قم بتصفية ديونك للمجتمع وتطهير ما تبقى من ثروتك.',
    hero_badge: 'بناءً على الإجماع الفقهي المعتمد',
    nisab_card_title: 'حد النصاب الشرعي',
    nisab_card_subtitle: 'تحديد الحد الأدنى من المال الذي تجب فيه الزكاة.',
    nisab_toggle_gold: 'الذهب (87.48 جرام)',
    nisab_toggle_silver: 'الفضة (612.36 جرام)',
    gold_price_label: 'سعر الذهب الحالي (للجرام الواحدة)',
    silver_price_label: 'سعر الفضة الحالي (للجرام الواحدة)',
    threshold_val_label: 'قيمة النصاب الحالية:',
    active_nisab_text: 'النصاب المعتمد حالياً: <strong>{standard}</strong>. يجب أن يتجاوز صافي ثروتك <strong>{val}</strong> ({weight}) لتجب عليك الزكاة.',
    assets_card_title: 'الأصول والأموال الزكوية',
    assets_card_subtitle: 'الإقرار بالأموال والأصول المؤهلة للزكاة (الذهب، الفضة، السيولة النقدية، الأسهم، إلخ).',
    btn_add_asset: 'إضافة أصل',
    col_asset_category: 'فئة الأصول',
    col_unit: 'الوحدة',
    col_weight: 'الوزن / القيمة',
    col_price: 'السعر للوحدة',
    col_total: 'القيمة الإجمالية',
    unit_currency: 'عملة نقدية',
    unit_grams: 'جرام (g)',
    unit_tolas: 'تولة',
    'asset_Cash': 'سيولة نقدية في اليد/البنك',
    'asset_Gold': 'ذهب',
    'asset_Silver': 'فضة',
    'asset_Shares/Investments': 'الأسهم والاستثمارات',
    'asset_Business Merchandise': 'بضائع تجارية',
    'asset_Agricultural Produce': 'المحاصيل الزراعية',
    'asset_Livestock': 'الماشية والأنعام',
    liabs_card_title: 'الخصومات والالتزامات المالية',
    liabs_card_subtitle: 'الإقرار بالديون قصيرة الأجل، الفواتير، أو النفقات الأساسية الحالية لاستبعادها.',
    btn_add_liability: 'إضافة دين',
    liabs_description: 'الوصف أو بيان الدين',
    liabs_amount: 'المبلغ المستحق',
    liabs_placeholder: 'مثال: فواتير البطاقة الائتمانية، إيجار مستحق',
    liabs_note: '<strong>ملاحظة فقهية:</strong> وفقاً للشريعة الإسلامية، يجوز فقط خصم الديون العاجلة المستحقة حالاً أو خلال العام الهجري الحالي من الأموال الخاضعة للزكاة.',
    hawl_title: 'أؤكد مرور حول كامل (سنة هجرية)',
    hawl_subtitle: 'أقر بأنني ملكت هذا الحد الأدنى من الثروة (النصاب) لمدة عام هجري كامل دون انقطاع.',
    citation_ibn_majah: 'سنن ابن ماجه',
    citation_tawbah: 'سورة التوبة 9:60',
    tooltip_ibn_majah: '"لَيْسَ فِي مَالٍ زَكَاةٌ حَتَّى يَحُولَ عَلَيْهِ الْحَوْلُ" (سنن ابن ماجه، حديث 1792)',
    tooltip_tawbah: 'الفريضة الإلهية التي تبين الأصناف الثمانية لمستحقي الزكاة.',
    summary_title: 'ملخص العملية الحسابية',
    summary_assets: 'إجمالي الأصول',
    summary_liabilities: 'إجمالي الخصومات والديون',
    summary_net_wealth: 'صافي الوعاء الزكوي',
    zakat_box_header: 'إجمالي الزكاة الواجبة (2.5%)',
    zakat_msg_met: 'لقد بلغت ثروتك حد النصاب الشرعي وتجب عليها الزكاة.',
    zakat_msg_below: 'لم تبلغ ثروتك حد النصاب الشرعي هذا العام. لا تجب عليك الزكاة، ولكن الصدقة الطوعية عظيمة الأجر عند الله.',
    zakat_msg_hawl: 'يجب تأكيد مرور الحول (ملك المال لسنة كاملة) لتصبح الزكاة فرضاً واجباً.',
    btn_export: 'تصدير التقرير كـ PDF',
    btn_save: 'حفظ كمسودة',
    btn_close: 'إغلاق',
    btn_understood: 'فهمت',
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
    print_declaration: '"طهّر ثروتك من خلال الحساب الدقيق والدفع الفوري للزكاة. تم إعداد هذا التقرير وتدقيقه وفقاً للمعايير الحسابية الشرعية المعتمدة."',
    modal_principles_title: 'المبادئ والأحكام الفقهية للزكاة',
    modal_principles_p1_title: '١. مبدأ النصاب (حد الوجوب الشرعي)',
    modal_principles_p1_body: 'لا تجب الزكاة في مال إلا إذا بلغ حد النصاب الشرعي. ويُقدر النصاب بوزن 87.48 جراماً من الذهب الخالص أو 612.36 جراماً من الفضة الخالصة. إذا كان صافي مالك أقل من هذا النصاب، فلا تجب الزكاة عليك، وتُستحب الصدقة الطوعية.',
    modal_principles_p2_title: '٢. مبدأ الحول (ملك المال سنة هجرية)',
    modal_principles_p2_body: 'يشترط لوجوب الزكاة في الأصول أن تمكث في حوزتك وتحت ملكك لعام قمري كامل (حول). وإذا تذبذبت الثروة لكنها ظلت فوق النصاب طوال العام، تجب الزكاة كاملة في تاريخ حسابها. لقوله ﷺ: "لا زكاة في مال حتى يحول عليه الحول".',
    modal_principles_p3_title: '٣. مقدار الزكاة (النسبة المفروضة 2.5%)',
    modal_principles_p3_body: 'تُحسب الزكاة بنسبة ثابتة تبلغ 2.5% (ربع العشر) من إجمالي وعائك الزكوي الصافي. تسري هذه النسبة على السيولة النقدية، السندات والأسهم، السلع التجارية، والذهب والفضة.',
    modal_principles_p4_title: '٤. الخصومات المستبعدة (الديون العاجلة)',
    modal_principles_p4_body: 'وفقاً للإجماع الفقهي، يُسمح بطرح وخصم الديون قصيرة الأجل والمستحقة فوراً من أصولك قبل حساب الزكاة. أما الأجزاء الآجلة من القروض طويلة الأمد (كالتمويل العقاري) فلا تُخصم بالكامل عادةً.',
    modal_principles_p5_title: '٥. مصارف الزكاة الثمانية (سورة التوبة 9:60)',
    modal_principles_p5_body: 'لا يصح صرف الزكاة في إعمار المساجد أو المشاريع العامة، بل يجب دفعها حصراً للأصناف الثمانية المذكورة في القرآن الكريم: الفقراء، المساكين، العاملين عليها، المؤلفة قلوبهم، في الرقاب (عتق العبيد)، الغارمين (المدينين العاجزين)، في سبيل الله، وابن السبيل (المسافر المنقطع).',
    modal_nisab_title: 'تفاصيل حد النصاب الشرعي',
    modal_nisab_p1: 'النصاب هو المقدار الذي إذا ملكه الشخص وجبت عليه الزكاة إذا استوفى بقية الشروط الشرعية كمرور الحول.',
    modal_nisab_f1: 'معادلة حساب حد النصاب',
    modal_nisab_f_gold: '• نصاب الذهب: 87.48 جراماً (ما يعادل 7.5 تولة)',
    modal_nisab_f_silver: '• نصاب الفضة: 612.36 جراماً (ما يعادل 52.5 تولة)',
    modal_nisab_rec: 'توصية العلماء: على الرغم من أن كلا النصابين صحيحان شرعاً، إلا أن المجامع الفقهية المعاصرة توصي بشدة بحساب الزكاة بناءً على نصاب الفضة. لأن سعر الفضة منخفض، مما يجعل حد النصاب متيسراً لعدد أكبر من المزكين، وهو ما يصب في مصلحة الفقراء والمساكين ويعظم نفعهم.',
    modal_history_title: 'المسودات المحفوظة محلياً',
    history_empty_title: 'لا توجد مسودات محفوظة.',
    history_empty_body: 'المسودات الحسابية التي تقوم بحفظها ستظهر هنا.',
    history_net: 'صافي الوعاء',
    history_curr: 'العملة'
  },
  ur: {
    brand_name: 'زکوٰۃ<span class="text-emerald-600"> فلو</span>',
    brand_name_footer: 'زکوٰۃ<span class="text-emerald-500"> فلو</span>',
    nav_calculator: 'کیلکولیٹر',
    nav_principles: 'شرعی اصول',
    nav_nisab: 'نصاب کی معلومات',
    nav_history: 'محفوظ مسودات',
    nav_drafts_badge: 'ڈرافٹس',
    hero_title: 'اپنے مال کو درستگی کے ساتھ پاک کریں',
    hero_subtitle: 'زکوٰۃ کے شرعی فریضے کی ادائیگی کے لیے ایک پرسکون، درست اور باوقار کیلکولیٹر۔ معاشرے کے تئیں اپنے واجبات کو ادا کریں اور اپنے باقی مال کو پاک کریں۔',
    hero_badge: 'معتبر شرعی اتفاقِ رائے کی بنیاد پر',
    nisab_card_title: 'حدِ نصاب',
    nisab_card_subtitle: 'زکوٰۃ کی فرضیت کے لیے مطلوبہ کم از کم دولت کا تعین کریں۔',
    nisab_toggle_gold: 'سونا (87.48 گرام)',
    nisab_toggle_silver: 'چاندی (612.36 گرام)',
    gold_price_label: 'سونے کی موجودہ قیمت (فی گرام)',
    silver_price_label: 'چاندی کی موجودہ قیمت (فی گرام)',
    threshold_val_label: 'نصاب کی موجودہ مالیت:',
    active_nisab_text: 'فعال نصاب: <strong>{standard}</strong>۔ زکوٰۃ کے اہل ہونے کے لیے آپ کی خالص دولت کا <strong>{val}</strong> ({weight}) سے زیادہ ہونا ضروری ہے۔',
    assets_card_title: 'زکوٰۃ کے قابل اثاثے',
    assets_card_subtitle: 'اپنے زیرِ ملکیت زکوٰۃ کے قابل اثاثوں کا اعلان کریں (سونا، چاندی، نقدی، شیئرز وغیرہ)۔',
    btn_add_asset: 'اثاثہ شامل کریں',
    col_asset_category: 'اثاثہ کی قسم',
    col_unit: 'اکائی',
    col_weight: 'وزن / رقم',
    col_price: 'فی اکائی قیمت',
    col_total: 'کل مالیت',
    unit_currency: 'کرنسی',
    unit_grams: 'گرام (g)',
    unit_tolas: 'تولہ',
    'asset_Cash': 'نقد رقم پاس یا بینک میں',
    'asset_Gold': 'سونا',
    'asset_Silver': 'چاندی',
    'asset_Shares/Investments': 'شیئرز اور سرمایہ کاری',
    'asset_Business Merchandise': 'تجاری سامانِ تجارت',
    'asset_Agricultural Produce': 'زرعی پیداوار (عشر)',
    'asset_Livestock': 'مویشی / مالِ مویشی',
    liabs_card_title: 'منہا ہونے والے واجبات',
    liabs_card_subtitle: 'اپنے قلیل مدتی قرضے، واجب الادا بل، یا ضروری اخراجات درج کریں تاکہ انہیں منہا کیا جا سکے۔',
    btn_add_liability: 'واجبات شامل کریں',
    liabs_description: 'تفصیل',
    liabs_amount: 'واجب الادا رقم',
    liabs_placeholder: 'مثال: کریڈٹ کارڈ بلز، گھر کا کرایہ',
    liabs_note: '<strong>شرعی وضاحت:</strong> اسلامی فقہ کے مطابق، صرف وہی قرضے منہا کیے جا سکتے ہیں جو فوری طور پر یا موجودہ قمری سال کے اندر واجب الادا ہوں۔',
    hawl_title: 'میں سال گزرنے (الحول) کی تصدیق کرتا ہوں',
    hawl_subtitle: 'میں تصدیق کرتا ہوں کہ یہ دولت (نصاب کے برابر یا زائد) ایک مکمل قمری سال سے میری ملکیت میں رہی ہے۔',
    citation_ibn_majah: 'سنن ابن ماجہ',
    citation_tawbah: 'سورہ التوبہ 9:60',
    tooltip_ibn_majah: '"کسی مال پر زکوٰۃ فرض نہیں جب تک کہ اس پر ایک سال نہ گزر جائے۔" (سنن ابن ماجہ، حدیث 1792)',
    tooltip_tawbah: 'قرآن مجید کا وہ حکم جس میں زکوٰۃ کے آٹھ حقدار مصارف بیان کیے گئے ہیں۔',
    summary_title: 'حساب کتاب کا خلاصہ',
    summary_assets: 'کل اثاثے',
    summary_liabilities: 'کل منہا واجبات',
    summary_net_wealth: 'خالص مالِ زکوٰۃ',
    zakat_box_header: 'کل واجب الادا زکوٰۃ (2.5%)',
    zakat_msg_met: 'آپ کی دولت نصاب کی حد تک پہنچ چکی ہے اور زکوٰۃ فرض ہے۔',
    zakat_msg_below: 'آپ کی دولت اس سال نصاب کی حد تک نہیں پہنچی۔ زکوٰۃ واجب الادا نہیں ہے، لیکن نفلی صدقہ و خیرات اللہ کے ہاں بہت اجر کا باعث ہے۔',
    zakat_msg_hawl: 'زکوٰۃ کی فرضیت کے لیے مال پر ایک سال گزرنے (الحول) کی تصدیق لازمی ہے۔',
    btn_export: 'رپورٹ PDF ڈاؤن لوڈ کریں',
    btn_save: 'ڈرافٹ محفوظ کریں',
    btn_close: 'بند کریں',
    btn_understood: 'سمجھ گیا',
    btn_close_guide: 'گائیڈ بند کریں',
    insights_title: 'زکوٰۃ کی فضیلت و حکمت',
    insight_1_quote: '"اسلام کی بنیاد پانچ چیزوں پر ہے... نماز قائم کرنا اور زکوٰۃ ادا کرنا..."',
    insight_1_source: '— صحیح البخاری 8',
    insight_2_quote: '"آپ ان کے اموال میں سے صدقہ (زکوٰۃ) لے لیجئے جس کے ذریعے آپ انہیں پاک اور صاف کر دیں..."',
    insight_2_source: '— سورہ التوبہ 9:103',
    insight_3_quote: '"صدقات (زکوٰۃ) تو صرف فقراء، مساکین اور اس پر مقرر عاملین کے لیے ہیں..."',
    insight_3_source: '— سورہ التوبہ 9:60',
    insight_4_quote: '"کسی مال پر زکوٰۃ فرض نہیں جب تک اس پر ایک سال نہ گزر جائے"',
    insight_4_source: '— سنن ابن ماجہ',
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
    print_declaration: '"اپنی دولت کو زکوٰۃ کے درست حساب اور بروقت ادائیگی کے ذریعے پاک کریں۔ یہ رپورٹ شرعی معیار اور کیلکولیشنز کے مطابق تیار کی گئی ہے۔"',
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
    modal_history_title: 'محفوظ کردہ ڈرافٹس کی تفصیل',
    history_empty_title: 'کوئی ڈرافٹ محفوظ نہیں ملا۔',
    history_empty_body: 'جو ڈرافٹس آپ کیلکولیٹر میں محفوظ کریں گے وہ یہاں نظر آئیں گے۔',
    history_net: 'خالص دولت',
    history_curr: 'کرنسی'
  }
};

// Helper to format money
function formatMoney(amount) {
  const symbol = CURRENCIES[STATE.currency].symbol;
  return `${symbol} ${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Initialize the Application
document.addEventListener('DOMContentLoaded', () => {
  loadHistory();
  initLanguageSelector();
  initCurrencySelector();
  initNisabPrices();
  initCarousel();
  setupEventListeners();
  renderAssets();
  renderLiabilities();
  calculateAll();
});

// Setup Language Selector
function initLanguageSelector() {
  const selector = document.getElementById('language-select');
  if (!selector) return;

  selector.addEventListener('change', (e) => {
    STATE.language = e.target.value;
    translateUI();
    renderAssets();
    renderLiabilities();
    calculateAll();
  });

  // Set default language
  selector.value = STATE.language;
  translateUI();
}

// Translate UI Elements
function translateUI() {
  const lang = STATE.language;
  
  // Set html document attributes for language and direction
  document.documentElement.lang = lang;
  if (lang === 'ar' || lang === 'ur') {
    document.documentElement.dir = 'rtl';
  } else {
    document.documentElement.dir = 'ltr';
  }

  // Update translatable elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
      el.innerHTML = TRANSLATIONS[lang][key];
    }
  });

  // Update translatable placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
      el.placeholder = TRANSLATIONS[lang][key];
    }
  });

  // Update currency labels
  updateCurrencyLabels();
}

// Setup Currency Dropdown
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
    
    const prevDefaults = CURRENCIES[prevCurrency];
    const newDefaults = CURRENCIES[STATE.currency];
    
    // Auto-update prices to new currency defaults if user hadn't edited
    if (STATE.goldPrice === prevDefaults.gold) {
      STATE.goldPrice = newDefaults.gold;
      document.getElementById('gold-price-input').value = STATE.goldPrice;
    }
    if (STATE.silverPrice === prevDefaults.silver) {
      STATE.silverPrice = newDefaults.silver;
      document.getElementById('silver-price-input').value = STATE.silverPrice;
    }

    updateCurrencyLabels();
    
    // Sync assets list prices
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
  STATE.assets.forEach((asset, index) => {
    if (!asset.isPriceCustom) {
      if (asset.type === 'Gold') {
        asset.price = asset.unit === 'Tolas' ? STATE.goldPrice * TOLA_TO_GRAMS : STATE.goldPrice;
        const input = document.getElementById(`asset-price-input-${index}`);
        if (input) input.value = asset.price.toFixed(2);
      } else if (asset.type === 'Silver') {
        asset.price = asset.unit === 'Tolas' ? STATE.silverPrice * TOLA_TO_GRAMS : STATE.silverPrice;
        const input = document.getElementById(`asset-price-input-${index}`);
        if (input) input.value = asset.price.toFixed(2);
      }
    }
  });
}

// Render dynamic assets
function renderAssets() {
  const container = document.getElementById('assets-container');
  if (!container) return;

  const lang = STATE.language;

  container.innerHTML = STATE.assets.map((asset, index) => {
    const isCurrency = asset.unit === 'Currency';
    
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
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">${TRANSLATIONS[lang].col_asset_category}</label>
          <select 
            onchange="updateAsset(${index}, 'type', this.value)" 
            class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium input-focus-ring transition-all-300 animate-scale-in"
          >
            ${ASSET_TYPES.map(type => {
              const transKey = `asset_${type}`;
              const displayName = TRANSLATIONS[lang][transKey] || type;
              return `<option value="${type}" ${asset.type === type ? 'selected' : ''}>${displayName}</option>`;
            }).join('')}
          </select>
        </div>

        <!-- Unit Selector Toggle -->
        <div class="md:col-span-2">
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">${TRANSLATIONS[lang].col_unit}</label>
          <select 
            onchange="updateAsset(${index}, 'unit', this.value)" 
            class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium input-focus-ring transition-all-300"
          >
            <option value="Currency" ${asset.unit === 'Currency' ? 'selected' : ''}>${TRANSLATIONS[lang].unit_currency}</option>
            <option value="Grams" ${asset.unit === 'Grams' ? 'selected' : ''}>${TRANSLATIONS[lang].unit_grams}</option>
            <option value="Tolas" ${asset.unit === 'Tolas' ? 'selected' : ''}>${TRANSLATIONS[lang].unit_tolas}</option>
          </select>
        </div>

        <!-- Amount Input -->
        <div class="md:col-span-2">
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            ${isCurrency ? TRANSLATIONS[lang].col_total : TRANSLATIONS[lang].col_weight}
          </label>
          <div class="relative">
            ${isCurrency ? `<span class="absolute start-3.5 top-2 text-sm font-medium text-slate-400 currency-symbol">${CURRENCIES[STATE.currency].symbol}</span>` : ''}
            <input 
              type="number" 
              value="${asset.amount || ''}" 
              placeholder="0.00" 
              min="0"
              oninput="updateAsset(${index}, 'amount', this.value)" 
              class="w-full bg-white border border-slate-200 rounded-lg ${isCurrency ? 'ps-8' : 'px-3'} pe-3 py-2 text-sm text-slate-700 font-medium input-focus-ring transition-all-300"
            />
          </div>
        </div>

        <!-- Price per Unit Input -->
        <div class="md:col-span-2">
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            ${TRANSLATIONS[lang].col_price}
          </label>
          <div class="relative">
            <span class="absolute start-3.5 top-2 text-sm font-medium text-slate-400 currency-symbol">${CURRENCIES[STATE.currency].symbol}</span>
            <input 
              type="number" 
              id="asset-price-input-${index}"
              value="${isCurrency ? '1.00' : asset.price.toFixed(2)}" 
              placeholder="1.00" 
              min="0"
              ${isCurrency ? 'disabled' : ''}
              oninput="updateAsset(${index}, 'price', this.value)" 
              class="w-full bg-white border border-slate-200 rounded-lg ps-8 pe-3 py-2 text-sm text-slate-700 font-medium input-focus-ring transition-all-300 ${isCurrency ? 'opacity-50 bg-slate-100 cursor-not-allowed' : ''}"
            />
          </div>
        </div>

        <!-- Total Value Readonly Display -->
        <div class="md:col-span-2">
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">${TRANSLATIONS[lang].col_total}</label>
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
    asset.isPriceCustom = false;
    
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
    asset.isPriceCustom = false;
    
    if (value === 'Currency') {
      asset.price = 1;
    } else if (value === 'Grams' || value === 'Tolas') {
      if (asset.type === 'Gold') {
        asset.price = value === 'Tolas' ? STATE.goldPrice * TOLA_TO_GRAMS : STATE.goldPrice;
      } else if (asset.type === 'Silver') {
        asset.price = value === 'Tolas' ? STATE.silverPrice * TOLA_TO_GRAMS : STATE.silverPrice;
      } else {
        asset.price = 100;
      }
    }
    renderAssets();
  } else if (field === 'price') {
    asset.price = parseFloat(value) || 0;
    asset.isPriceCustom = true;
  } else if (field === 'amount') {
    asset.amount = parseFloat(value) || 0;
  }

  calculateAssetTotal(asset);
  
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

window.removeAsset = function(id) {
  if (STATE.assets.length <= 1) {
    showToast(STATE.language === 'ur' ? 'کم از کم ایک قطار لازمی ہے' : (STATE.language === 'ar' ? 'يجب الاحتفاظ بصف واحد على الأقل.' : 'You must keep at least one asset row.'), 'warning');
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

  const lang = STATE.language;

  container.innerHTML = STATE.liabilities.map((lib, index) => {
    return `
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50/50 p-4 rounded-xl border border-slate-100 transition-all duration-200 animate-scale-in">
        
        <!-- Description -->
        <div class="md:col-span-7">
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">${TRANSLATIONS[lang].liabs_description}</label>
          <input 
            type="text" 
            value="${lib.description || ''}" 
            placeholder="${TRANSLATIONS[lang].liabs_placeholder}" 
            oninput="updateLiability(${index}, 'description', this.value)" 
            class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium input-focus-ring transition-all-300"
          />
        </div>

        <!-- Amount Due -->
        <div class="md:col-span-4">
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">${TRANSLATIONS[lang].liabs_amount}</label>
          <div class="relative">
            <span class="absolute start-3.5 top-2 text-sm font-medium text-slate-400 currency-symbol">${CURRENCIES[STATE.currency].symbol}</span>
            <input 
              type="number" 
              value="${lib.amount || ''}" 
              placeholder="0.00" 
              min="0"
              oninput="updateLiability(${index}, 'amount', this.value)" 
              class="w-full bg-white border border-slate-200 rounded-lg ps-8 pe-3 py-2 text-sm text-slate-700 font-medium input-focus-ring transition-all-300"
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

// Math calculations
function calculateAll() {
  const lang = STATE.language;

  // Update Nisab Values
  const goldNisab = 87.48 * STATE.goldPrice;
  const silverNisab = 612.36 * STATE.silverPrice;

  document.getElementById('nisab-gold-value').textContent = formatMoney(goldNisab);
  document.getElementById('nisab-silver-value').textContent = formatMoney(silverNisab);

  // Active Nisab Threshold
  const activeNisab = STATE.nisabStandard === 'gold' ? goldNisab : silverNisab;
  const standardName = STATE.nisabStandard === 'gold' ? (lang === 'ur' ? 'سونا' : (lang === 'ar' ? 'الذهب' : 'Gold')) : (lang === 'ur' ? 'چاندی' : (lang === 'ar' ? 'الفضة' : 'Silver'));
  const thresholdWeight = STATE.nisabStandard === 'gold' ? '87.48g' : '612.36g';

  // Update Active Banner details
  const activeBanner = document.getElementById('active-nisab-banner-text');
  if (activeBanner) {
    const formattedNisab = formatMoney(activeNisab);
    let bannerText = TRANSLATIONS[lang].active_nisab_text
      .replace('{standard}', standardName)
      .replace('{val}', formattedNisab)
      .replace('{weight}', thresholdWeight);
    activeBanner.innerHTML = bannerText;
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
      resultMessage.innerHTML = `<span class="flex items-center gap-1.5 text-emerald-100 text-sm font-semibold"><svg class="w-4 h-4 text-emerald-200" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg> ${TRANSLATIONS[lang].zakat_msg_met}</span>`;
    } else {
      zakatDue = 0;
      // Below / warning state (Al-Hawl Unconfirmed)
      resultBox.className = "calculation-box p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm animate-scale-in transition-all duration-300";
      dueValEl.className = "text-4xl font-extrabold tracking-tight text-amber-700 mt-1 mb-2";
      resultMessage.innerHTML = `<span class="text-amber-700 text-sm font-semibold">${TRANSLATIONS[lang].zakat_msg_hawl}</span>`;
    }
  } else {
    zakatDue = 0;
    // Below Nisab state (Blue/Slate layout)
    resultBox.className = "calculation-box p-6 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 shadow-sm animate-scale-in transition-all duration-300";
    dueValEl.className = "text-4xl font-extrabold tracking-tight text-sky-700 mt-1 mb-2";
    resultMessage.innerHTML = `<span class="text-sky-700 text-sm font-semibold">${TRANSLATIONS[lang].zakat_msg_below}</span>`;
  }

  dueValEl.textContent = formatMoney(zakatDue);

  // Sync value overlays inside print report forms
  const printDate = document.getElementById('print-date');
  if (printDate) {
    printDate.textContent = new Date().toLocaleDateString(undefined, { dateStyle: 'long' });
  }

  // Update report overlays in state
  document.getElementById('print-nisab-standard').textContent = `${standardName} Standard (${formatMoney(activeNisab)})`;
  document.getElementById('print-gold-rate').textContent = formatMoney(STATE.goldPrice);
  document.getElementById('print-silver-rate').textContent = formatMoney(STATE.silverPrice);
  document.getElementById('print-total-assets').textContent = formatMoney(totalAssets);
  document.getElementById('print-total-liabilities').textContent = `-${formatMoney(totalLiabilities)}`;
  document.getElementById('print-net-wealth').textContent = formatMoney(netWealth);
  document.getElementById('print-zakat-due').textContent = formatMoney(zakatDue);
}

// Carousel Functionality
let carouselTimer = null;
function initCarousel() {
  const track = document.querySelector('.carousel-track');
  const slides = Array.from(document.querySelectorAll('.carousel-slide'));
  const dotsContainer = document.querySelector('.carousel-dots');
  
  if (!track || slides.length === 0) return;

  let currentIndex = 0;

  // Render Dots
  dotsContainer.innerHTML = slides.map((_, index) => 
    `<button class="w-2 h-2 rounded-full transition-all duration-300 ${index === 0 ? 'bg-emerald-600 scale-125' : 'bg-slate-300 hover:bg-slate-400'}" data-slide="${index}"></button>`
  ).join('');

  const dots = Array.from(dotsContainer.querySelectorAll('button'));

  function updateCarousel() {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    // For RTL layout support (translateX has direction reversed)
    if (document.documentElement.dir === 'rtl') {
      track.style.transform = `translateX(${currentIndex * 100}%)`;
    }

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
    carouselTimer = setInterval(nextSlide, 15000); // Cycles every 15 seconds as requested
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

  track.addEventListener('mouseenter', stopTimer);
  track.addEventListener('mouseleave', startTimer);

  startTimer();

  // Re-sync carousel alignment on window resize or layout dir shift
  window.addEventListener('resize', updateCarousel);
  document.getElementById('language-select').addEventListener('change', () => {
    setTimeout(updateCarousel, 50); // slight delay to wait for direction changes
  });
}

// Event Listeners for miscellaneous toggles
function setupEventListeners() {
  const hawlCheckbox = document.getElementById('hawl-checkbox');
  if (hawlCheckbox) {
    hawlCheckbox.checked = STATE.alHawlConfirmed;
    hawlCheckbox.addEventListener('change', (e) => {
      STATE.alHawlConfirmed = e.target.checked;
      calculateAll();
    });
  }

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
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'scale-95');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Draft/History Operations
window.saveDraft = function() {
  const timestamp = new Date().toISOString();
  const lang = STATE.language;
  const draftName = lang === 'ur' ? `ڈرافٹ - ${new Date().toLocaleTimeString()} (${new Date().toLocaleDateString()})` : (lang === 'ar' ? `مسودة - ${new Date().toLocaleTimeString()} (${new Date().toLocaleDateString()})` : `Draft - ${new Date().toLocaleTimeString()} (${new Date().toLocaleDateString()})`);
  
  const draft = {
    id: generateId(),
    name: draftName,
    timestamp,
    state: JSON.parse(JSON.stringify(STATE))
  };

  STATE.history.unshift(draft);
  localStorage.setItem('zakat_calculator_history', JSON.stringify(STATE.history));
  
  showToast(lang === 'ur' ? 'ڈرافٹ کامیابی سے محفوظ ہو گیا!' : (lang === 'ar' ? 'تم حفظ المسودة بنجاح!' : 'Draft successfully saved to history!'));
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

  STATE.language = draft.state.language || 'en';
  STATE.currency = draft.state.currency;
  STATE.nisabStandard = draft.state.nisabStandard;
  STATE.goldPrice = draft.state.goldPrice;
  STATE.silverPrice = draft.state.silverPrice;
  STATE.assets = JSON.parse(JSON.stringify(draft.state.assets));
  STATE.liabilities = JSON.parse(JSON.stringify(draft.state.liabilities));
  STATE.alHawlConfirmed = draft.state.alHawlConfirmed;

  // Refresh inputs
  document.getElementById('language-select').value = STATE.language;
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

  translateUI();
  renderAssets();
  renderLiabilities();
  calculateAll();
  closeModal('history-modal');
  showToast(STATE.language === 'ur' ? 'ڈرافٹ لوڈ ہو گیا!' : (STATE.language === 'ar' ? 'تم تحميل المسودة!' : 'Draft loaded successfully!'));
};

window.deleteDraft = function(draftId, event) {
  if (event) event.stopPropagation();
  STATE.history = STATE.history.filter(h => h.id !== draftId);
  localStorage.setItem('zakat_calculator_history', JSON.stringify(STATE.history));
  renderHistoryModal();
  showToast(STATE.language === 'ur' ? 'ڈرافٹ خارج کر دیا گیا' : (STATE.language === 'ar' ? 'تم حذف المسودة' : 'Draft removed.'), 'info');
};

function renderHistoryModal() {
  const container = document.getElementById('history-list');
  if (!container) return;

  const lang = STATE.language;

  if (STATE.history.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-slate-400">
        <svg class="w-12 h-12 mx-auto mb-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <p class="text-sm font-semibold">${TRANSLATIONS[lang].history_empty_title}</p>
        <p class="text-xs mt-1">${TRANSLATIONS[lang].history_empty_body}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = STATE.history.map(draft => {
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
            <span>${TRANSLATIONS[lang].history_net}: <strong class="text-slate-600">${formattedNet}</strong></span>
            <span>${TRANSLATIONS[lang].history_curr}: <strong>${draft.state.currency}</strong></span>
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

// Modal actions
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

// Export PDF Report
window.exportReport = function() {
  const printAssetsContainer = document.getElementById('print-assets-table-body');
  const printLiabilitiesContainer = document.getElementById('print-liabilities-table-body');
  const lang = STATE.language;

  if (printAssetsContainer) {
    printAssetsContainer.innerHTML = STATE.assets.map(asset => {
      let unitText = '';
      if (asset.unit !== 'Currency') {
        const localizedUnit = asset.unit === 'Tolas' ? TRANSLATIONS[lang].unit_tolas : TRANSLATIONS[lang].unit_grams;
        unitText = ` (${asset.amount} ${localizedUnit})`;
      }
      const transKey = `asset_${asset.type}`;
      const assetName = TRANSLATIONS[lang][transKey] || asset.type;
      
      return `
        <tr class="border-b border-slate-100">
          <td class="py-2.5 font-medium text-slate-800 text-start">${assetName}${unitText}</td>
          <td class="py-2.5 text-end font-semibold text-slate-900">${formatMoney(asset.total)}</td>
        </tr>
      `;
    }).join('');
  }

  if (printLiabilitiesContainer) {
    if (STATE.liabilities.length === 0 || (STATE.liabilities.length === 1 && !STATE.liabilities[0].description && STATE.liabilities[0].amount === 0)) {
      printLiabilitiesContainer.innerHTML = `
        <tr>
          <td colspan="2" class="py-2.5 text-slate-400 italic text-sm text-start">No deductible liabilities reported.</td>
        </tr>
      `;
    } else {
      printLiabilitiesContainer.innerHTML = STATE.liabilities.map(lib => {
        return `
          <tr class="border-b border-slate-100">
            <td class="py-2.5 text-slate-700 text-start">${lib.description || 'Debt'}</td>
            <td class="py-2.5 text-end font-semibold text-slate-900">-${formatMoney(lib.amount)}</td>
          </tr>
        `;
      }).join('');
    }
  }

  window.print();
};
