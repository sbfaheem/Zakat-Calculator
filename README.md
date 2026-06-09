# ZakatFlow Calculator

A premium, modern, and spiritually precise single-page Zakat Calculator application built with HTML5, Tailwind CSS, and vanilla JavaScript. The UI features a premium SaaS-style dashboard that is fully responsive and interactive, styled with calming mint/emerald green accents and a slate gray color scheme.

---

## Key Features

1. **Nisab threshold calculations:**
   - Real-time gold and silver Nisab calculations based on user-defined prices per gram.
   - Toggle to choose Gold (87.48 grams) or Silver (612.36 grams) standard for active Zakat obligation status.
   - Live banner indicating status based on chosen Nisab standards.
2. **Dynamic Asset Inputs:**
   - Multi-asset entry with options for Cash, Gold, Silver, Shares/Investments, Business Merchandise, Agricultural Produce, and Livestock.
   - Unit selection support: Grams (g), Tolas, or direct Currency values.
   - Automatic unit price calculation and conversion (e.g. 1 Tola = 11.6638 grams).
3. **Liabilities Section:**
   - Dynamic short-term liability subtraction to compute net wealth.
4. **Calculations Summary & Zakat Due Box:**
   - Dynamic state transitions. Meets Nisab (premium emerald green) vs. Below Nisab (sky blue suggesting voluntary Sadaqah) or Unconfirmed Al-Hawl (warning layout).
5. **Interactive Spiritual Insights:**
   - Smooth carousel detailing Hadiths and Quranic references regarding purification of wealth and Zakat distribution categories.
6. **Local Storage Draft saving:**
   - History logs and draft serialization for reloading previous calculations.
7. **Report Exports:**
   - Custom print CSS stylesheet to export calculated summary reports cleanly to PDF.

---

## Islamic Principles Incorporated

1. **The Principle of Nisab (Threshold):**
   - Zakat is only due if Net Wealth meets or exceeds the Nisab threshold.
   - Gold threshold: 87.48g.
   - Silver threshold: 612.36g.
2. **The Principle of Al-Hawl (Lunar Year Completion):**
   - Confirming possession of wealth for one full lunar year (354 days) as cited in Hadith (Sunan Ibn Majah).
3. **Zakat Rate (2.5%):**
   - Zakat is calculated at exactly 2.5% of net wealth if Nisab is met and Al-Hawl is confirmed.
4. **Immediate Liabilities:**
   - Deduction of immediately due debts in accordance with Islamic jurisprudence.
5. **Eight Categories of Zakat Recipients:**
   - Details the ordained distribution groups from Surah At-Tawbah 9:60 in the footer.

---

## Technical Details

- **Tailwind CSS:** Integrated via Tailwind Play CDN with theme extensions inside index.html config.
- **Vanilla JavaScript:** Handle real-time DOM manipulation, calculation events, serialization, history logs, and modal overlays.
- **Custom CSS:** Found in `styles.css` containing custom animations, scrollbars, tooltip hover logic, and printable media styles.
- **Run Locally:** Open `index.html` directly in any web browser.
