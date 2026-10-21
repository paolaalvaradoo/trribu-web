# TRRIBÚ theme · build conventions

Shopify Online Store 2.0 theme for TRRIBÚ (Spanish-only storefront, Peru, currency PEN `S/`).
The source of truth for every page is the prototype in
`project/Web TRRIBÚ/TRRIBÚ <Page>.dc.html` — recreate it **pixel-accurately**.
Copy text, sizes, colors, spacing and hover behaviour from the inline styles.

## What already exists (do not modify — ask the lead if you need a change)

- `layout/theme.liquid` — fonts (Jost 300/400/500, Hanken Grotesk 400/500/600, Playfair Display 400/500 + italics), `base.css`, `theme.js`, header & footer groups, cart drawer.
- `assets/base.css` — tokens + shared components. **Read it first** and reuse its classes:
  - tokens: `--ink --ink-2 --muted --muted-2 --muted-3 --line --line-2 --line-3 --paper-2 --paper-3 --sand --sand-2 --ac --ac-soft --ac-ink --veil --f-display --f-body --f-serif --gutter`
  - product colors: `--c-shampoo(-ink) --c-acond(-ink) --c-masc(-ink) --c-sinenj(-ink)`
  - containers: `.wrap` (max 1400 + `--gutter` side padding; 56px desktop, 20px ≤900, 16px ≤480) and widths `.wrap--1520/1320/1240/1180/1120/1000/920/900/820/760`; `.sec` (88px vertical), `.sec--sm`, `.sec--lg`; `.bt` `.bb` borders; `.bg-paper-2` etc.
  - type: `.eyebrow` (10.5px Jost .4em caps), `.h1`(52) `.h2`(42) `.h3`(36) `.h4`(30) Jost 300, `.serif-i`, `.lede-serif`, `.body-lg` `.body` `.body-sm` `.small`, `.num-serif`, `.rte`
  - buttons: `.btn` + `.btn--solid | --line | --white | --ghost-light`, `.btn--sm`, `.btn--block`; `.txt-link`, `.pill` (`.is-on`), `.tag-ac`
  - media: `.media`, `.veil`, `.bleed` + `.bleed__content`
  - commerce: `.pgrid` + `snippets/product-card.liquid`, `.tgrid` `.tile`, `.addbtn`, `.sec-head`
  - FAQ accordion: `.faq-list` > `details.faq` > `summary.faq-q` + `.faq-a`
  - forms: `.field`, `.check`
  - all mobile font scaling for `.h1–.h4` is done there.
- Snippets:
  - `{% render 'media', image: section.settings.image, label: 'Qué foto va acá', position: '50% 22%', sizes: '50vw', fallback: 'ref-xxx.png' %}` — image slot (shows label only in theme editor when empty). Put it inside a positioned box; it fills it.
  - `{% render 'product-card', product: p, button_label: 'Añadir al ritual', solid: false %}`
  - `{% render 'product-field', product: p, field: 'number|color|ink|tint|verbs|size|badge|style' %}` — brand data per product (metafield `trribu.*` with prototype fallbacks by handle). Use `field: 'style'` to get `--pc;--pc-ink;--pc-tint` vars on a wrapper.
  - `{% render 'bottle', product: p, size: 'sm|lg' %}` — the CSS-drawn bottle/jar from the prototype (white cap, beige label, product color square). Use it wherever the prototype draws a bottle and as the fallback when a product has no photo. `sm` = 250px-tall card stage size, `lg` = product page stage size. Wrap it in your own flex container to position it.
  - `{% render 'icon', name: 'search|cart|close|drop|no|leaf|paw|palette|peru|flask|check' %}`
  - `{% render 'wordmark', height: 22 %}` — the logo SVG (currentColor).
- `assets/theme.js` exposes `window.TRRIBU`:
  - `TRRIBU.cart.add([{id: variantId, quantity: 1, properties: {}}], {open: true})` → Promise<cart>; opens the drawer by default
  - `TRRIBU.cart.change(lineKey, qty)`, `TRRIBU.cart.open()`, `TRRIBU.cart.updateAttributes({...})`
  - `TRRIBU.money(cents)` → "S/ 79"; `TRRIBU.tierFor(count)` → `{min, pct}` or null (quantity discount: −10 % from 3 items, −15 % from 5; values in theme settings); `TRRIBU.config.klaviyo` `{publicKey, listId, revision}`; `TRRIBU.config.webhookUrl`
  - Any element with `data-add-to-cart="{{ variant.id }}"` adds 1 to cart (with "Añadido ✓" feedback). Add `data-open-drawer` to also open the drawer.
  - Event `trribu:cart` (detail = cart JSON) fires after every cart change.
- Settings available in Liquid: `settings.quiz_url`, `settings.ritual_url`, `settings.tier1_min/pct`, `settings.tier2_min/pct`, `settings.free_shipping_threshold`, `settings.show_tool_prices`, `settings.klaviyo_public_key`, `settings.klaviyo_list_id`, `settings.analytics_webhook_url`.

## Rules for new files

1. **One prefix per page**, so parallel work never collides. Sections `sections/<prefix>-*.liquid`, CSS `assets/<prefix>.css` (load it at the top of each of your sections with `{{ '<prefix>.css' | asset_url | stylesheet_tag }}` — duplicates are deduped by the browser cache; or put it only in the first section of the template), JS `assets/<prefix>.js` (`<script src="{{ '<prefix>.js' | asset_url }}" defer></script>`), templates as assigned. Shared snippets you create: `snippets/<prefix>-*.liquid`.
2. **No inline `style=""` soup**: translate the prototype's inline styles into BEM-ish classes in your CSS file (`.hm-hero__title`). Exact pixel values from the prototype. Inline style is OK only for per-instance dynamic values (colors from settings, CSS vars).
3. **Everything editable in the theme editor**: all copy as section settings / blocks with the prototype text as `default` (and in the template JSON). Repeating items (signals, FAQ items, steps, seal items, rows) = blocks. Images = `image_picker` + `render 'media'` with the prototype's placeholder text as `label`. Links = `url` settings (note: `url` defaults may only be `/collections` or `/collections/all`; for other defaults put the value in the template JSON instead, or use a `text` setting). Products = `product` / `product_list` / `collection` settings.
4. Internal links between prototype pages map to these URLs:
   Home `/` · Sistema `/pages/sistema` · Síntomas `/pages/sintomas` · Quiz `{{ settings.quiz_url }}` (`/pages/quiz`) · Productos `/collections/all` (or `routes.all_products_collection_url`) · Producto `product.url` · Kits `/pages/kits` · Arma tu ritual `{{ settings.ritual_url }}` (`/pages/arma-tu-ritual`) · Herramientas `/collections/herramientas` · Transparencia `/pages/transparencia` · Estudio `/pages/estudio` · FAQ `/pages/faq` · Nosotros `/pages/nosotros`.
5. Product handles (used for fallbacks): `el-shampoo`, `el-acondicionador`, `la-mascarilla`, `el-acondicionador-sin-enjuague`; tools `el-peine`, `la-toalla`, `el-gorro`, `las-pinzas`; kits `el-duo`, `kit-esencial`, `el-kit-completo`. When a section needs specific products, use a `product`/`product_list` setting and, if blank, fall back to `all_products['<handle>']`. Prices always come from Shopify (`money_without_trailing_zeros`), never hard-coded.
6. **Responsive**: reproduce the prototype's mobile rules in your CSS at `@media (max-width: 900px)`: multi-column grids → 1 column (4+ column grids → 2 columns, gap 16px); section vertical padding 52px; side padding comes from `.wrap`; big gaps (≥56px) → 32px; `white-space: nowrap` → normal; sticky → static; full-bleed photos with text on top become: photo block ~300px tall on top / text below growing with content (`padding: 280px 20px 44px` over the image is the prototype's approach — either is fine as long as text never overflows); photo-only blocks 300px tall; buttons min-height 44px. Also `@media (max-width:480px)` where the prototype has rules.
7. Accessibility: real `<button>`s for actions, `<a>` for navigation, labels on inputs, `aria-expanded` on toggles, visible focus (base.css handles `:focus-visible`), `alt` text.
8. Brand / claim rules (INDECOPI) — keep the prototype copy verbatim; never introduce: "anticaída", "crecimiento", "folículo", "reconstruye", "keratina" as a claim; "100 % natural"; "cancer-free"; ™; °F. Product names exactly: El Shampoo · El Acondicionador · La Mascarilla · El Acondicionador Sin Enjuague.
9. Valid Liquid & JSON. Every section needs a `{% schema %}` with `"name"` (Spanish), and `"presets"` only if it should be addable to any page. Template JSON must reference existing section types and use setting ids that exist. Don't use `{% include %}`. No external JS libraries.
10. Don't edit files you don't own. If you need something global (a new token, a change to theme.js), describe it in your final report instead.
