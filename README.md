# Quotation Builder

A fast, reliable, WYSIWYG quotation and proposal generator designed for agencies and freelancers. Runs entirely client-side in your web browser with pixel-accurate A4 PDF generation.

---

## Getting Started

### Development
```bash
npm install
npm run dev
```
The dev server starts at `http://127.0.0.1:5173`.

### Production Build & Preview
```bash
npm run build
npm run preview
```
The production preview server runs at `http://127.0.0.1:4173`.

---

## Assets & Customization

### Logos
- Default and prebuilt logos are stored in [`src/assets/logos/`](file:///home/faiz/Desktop/build-quotation/src/assets/logos).
- Users can upload custom logos (PNG, JPG, WebP, SVG up to 2 MB) via the **Settings** panel (⚙️).
- Uploaded SVGs are strictly sanitized to reject any embedded `<script>` tags or inline `on*=` event handlers.

### Typography & Fonts
- The document canvas and exported PDF use **Montserrat** (SIL Open Font License - OFL).
- Four font files are embedded directly: `Montserrat-Regular.ttf`, `Montserrat-Bold.ttf`, `Montserrat-Italic.ttf`, and `Montserrat-BoldItalic.ttf` in [`src/assets/fonts/`](file:///home/faiz/Desktop/build-quotation/src/assets/fonts).
- Sizing is centrally defined in [`src/config/typography.ts`](file:///home/faiz/Desktop/build-quotation/src/config/typography.ts):
  - Section headings: `13px` bold (`9.75pt` in PDF)
  - Content & items: `11px` (`8.25pt` in PDF)
  - Agency header: label `12px`, name `15px`, address `12px`
  - Page footer: `9px`
- The Indian Rupee symbol (`₹` / U+20B9) is fully supported natively by Montserrat across all weights and styles.

---

## Data Storage & Backups

### Storage Location
- All data (quotations, settings, and active document state) is saved in the browser's **`localStorage`**.
- **Per-Origin Isolation**: `localStorage` is scoped per origin and port.
  - `http://localhost:5173` (dev) and `http://localhost:4173` (preview) have completely **separate** storage.
  - To transfer quotations between environments or browsers, use **Export backup** and **Import backup**.

### Safety Nets & Multi-Tab Protection
- **Multi-Tab Safeguard**: If another browser tab updates quotations or settings, the active tab pauses autosave immediately and displays a non-blocking warning: *"Your data was changed in another tab. Reload to continue."*
- **Error Boundary**: If a rendering error ever occurs, the screen displays *"Something went wrong. Your data is safe."* with an emergency **Download backup** button and a **Reload** button.
- **Shortcuts**: `Ctrl+S` (or `Cmd+S` on macOS) triggers an immediate state flush to disk and confirms with `Saved ✓`. Native undo/redo (`Ctrl+Z` / `Ctrl+Y`) operates uninhibited within input fields.

### JSON Backup & Restore
In the **Settings (⚙️) > Backup** section:
- **Export backup**: Generates a standardized, timestamped backup file: `quotation-backup-YYYY-MM-DD.json` containing schema version 1, all quotations, and agency settings.
- **Import backup**: Accepts valid JSON files up to 10 MB. Strictly validates schema version, quotation/section/block structures, allowed block types, string length caps, array caps (500 quotations max), and image data URLs.
  - **Merge**: Adds imported quotations alongside current quotations, automatically appending `(imported)` and reassigning unique IDs if collisions occur.
  - **Replace all**: Replaces existing quotations and settings with imported data (with an optional one-click *"Export current data first"* safeguard).

---

## PDF Export Architecture

- Clicking **Export PDF** dynamically loads the `@react-pdf/renderer` chunk to keep initial page load lightweight.
- **Pre-check**: If any section has a heading with no non-empty content blocks, an inline notice appears: *"N sections are empty and will print as headings only."* with options to **Export anyway** or **Cancel** (dismissible via `Esc`).
- Heading bars are pinned to their first content block (`minPresenceAhead`) to eliminate orphan headers.
- Multi-page documents automatically distribute content across pages, with the agency logo appearing on Page 1 and the UPI payment QR code appearing on the final page.
- Bottom-right page numbers (`Page X of Y`) are dynamically computed across all pages.

---

## Known Limits

1. **Character Support**: Optimized for English alphanumeric characters, punctuation, and the Indian Rupee symbol (`₹`). Non-Latin Indic scripts and emojis are not rendered in PDF generation.
2. **Storage Quota**: Browser `localStorage` is typically capped at 5 MB to 10 MB per origin. Use JSON Backup exports for long-term archiving and large portfolios.
