/* ==========================================================================
   TRRIBÚ · theme.js
   Menú móvil, búsqueda, carrito (Ajax API + drawer) y utilidades
   compartidas que usan las secciones: window.TRRIBU.
   ========================================================================== */
(function () {
  'use strict';

  var cfg = window.TRRIBU_CONFIG || {};
  var routes = cfg.routes || {};

  /* ---------- Utilidades ---------- */
  function money(cents) {
    var v = (cents || 0) / 100;
    var fmt = cfg.moneyFormat || 'S/ {{amount_no_decimals}}';
    var noDec = Math.round(v).toLocaleString('es-PE');
    var dec = v.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    var out = fmt
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/, noDec)
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/, dec)
      .replace(/\{\{\s*amount\s*\}\}/, Number.isInteger(v) ? noDec : dec);
    return out.replace(/<[^>]*>/g, '');
  }

  /* Descuento por cantidad de "Arma tu ritual" (−10 % desde 3, −15 % desde 5).
     El cobro real lo hace el descuento automático configurado en Shopify;
     esto solo lo muestra en vivo. */
  function tierFor(count) {
    var tiers = cfg.tiers || [];
    var best = null;
    tiers.forEach(function (t) { if (count >= t.min && (!best || t.min > best.min)) best = t; });
    return best;
  }

  function fetchJSON(url, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ 'Content-Type': 'application/json', Accept: 'application/json' }, opts.headers || {});
    return fetch(url, opts).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok) { var e = new Error(data.description || data.message || 'Error'); e.data = data; throw e; }
        return data;
      });
    });
  }

  /* ---------- Carrito ---------- */
  var drawer = document.getElementById('CartDrawer');

  function sectionsParam() { return 'cart-drawer'; }

  function renderSections(sections) {
    if (!sections) return;
    var html = sections['cart-drawer'];
    if (html && drawer) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var fresh = doc.querySelector('[data-cart-inner]');
      var cur = drawer.querySelector('[data-cart-inner]');
      if (fresh && cur) cur.replaceWith(fresh);
    }
  }

  function updateCount(count) {
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = count > 0 ? count : '';
      el.setAttribute('data-count', count);
    });
  }

  function refresh() {
    return fetch(routes.root + '?sections=' + sectionsParam())
      .then(function (r) { return r.json(); })
      .then(function (s) { renderSections(s); return fetchJSON(routes.cart + '.js'); })
      .then(function (cart) { updateCount(cart.item_count); document.dispatchEvent(new CustomEvent('trribu:cart', { detail: cart })); return cart; });
  }

  /* items: [{id, quantity, properties}] */
  function add(items, opts) {
    opts = opts || {};
    if (!Array.isArray(items)) items = [items];
    return fetchJSON(routes.cartAdd + '.js', {
      method: 'POST',
      body: JSON.stringify({ items: items, sections: sectionsParam(), sections_url: window.location.pathname })
    }).then(function (res) {
      renderSections(res.sections);
      return fetchJSON(routes.cart + '.js');
    }).then(function (cart) {
      updateCount(cart.item_count);
      document.dispatchEvent(new CustomEvent('trribu:cart', { detail: cart }));
      if (opts.open !== false) openDrawer();
      return cart;
    });
  }

  function change(key, quantity) {
    return fetchJSON(routes.cartChange + '.js', {
      method: 'POST',
      body: JSON.stringify({ id: key, quantity: quantity, sections: sectionsParam(), sections_url: window.location.pathname })
    }).then(function (cart) {
      renderSections(cart.sections);
      updateCount(cart.item_count);
      document.dispatchEvent(new CustomEvent('trribu:cart', { detail: cart }));
      return cart;
    });
  }

  function updateAttributes(attributes) {
    return fetchJSON(routes.cartUpdate + '.js', { method: 'POST', body: JSON.stringify({ attributes: attributes }) });
  }

  function openDrawer() {
    if (!drawer) { window.location.href = routes.cart; return; }
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    var close = drawer.querySelector('[data-cart-close]');
    if (close) close.focus();
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
  }

  /* ---------- Delegación de eventos ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target;

    var addBtn = t.closest('[data-add-to-cart]');
    if (addBtn) {
      e.preventDefault();
      var id = addBtn.getAttribute('data-add-to-cart');
      var qty = parseInt(addBtn.getAttribute('data-quantity') || '1', 10);
      var original = addBtn.innerHTML;
      addBtn.classList.add('is-loading');
      add([{ id: Number(id), quantity: qty }], { open: addBtn.hasAttribute('data-open-drawer') })
        .then(function () {
          addBtn.classList.remove('is-loading');
          addBtn.classList.add('is-added');
          addBtn.textContent = addBtn.getAttribute('data-added-label') || 'Añadido ✓';
          setTimeout(function () { addBtn.classList.remove('is-added'); addBtn.innerHTML = original; }, 1800);
        })
        .catch(function (err) {
          addBtn.classList.remove('is-loading');
          alert(err.message);
        });
      return;
    }

    if (t.closest('[data-cart-open]')) { e.preventDefault(); openDrawer(); return; }
    if (t.closest('[data-cart-close]')) { e.preventDefault(); closeDrawer(); return; }

    var qtyBtn = t.closest('[data-cart-qty]');
    if (qtyBtn) {
      e.preventDefault();
      change(qtyBtn.getAttribute('data-key'), parseInt(qtyBtn.getAttribute('data-cart-qty'), 10));
      return;
    }

    var mm = t.closest('.mm-btn');
    if (mm) {
      var header = mm.closest('.site-header');
      var open = header.classList.toggle('mm-open');
      mm.setAttribute('aria-expanded', open ? 'true' : 'false');
      mm.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      return;
    }
    if (t.closest('.nav-link')) {
      var h = t.closest('.site-header');
      if (h) h.classList.remove('mm-open');
    }

    var sb = t.closest('[data-search-toggle]');
    if (sb) {
      e.preventDefault();
      var bar = document.getElementById('SearchBar');
      if (bar) {
        bar.hidden = !bar.hidden;
        if (!bar.hidden) bar.querySelector('input').focus();
      }
    }
  });

  document.addEventListener('change', function (e) {
    var sel = e.target.closest('[data-cart-attribute]');
    if (sel) updateAttributes(Object.fromEntries([[sel.getAttribute('data-cart-attribute'), sel.value]]));
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawer();
  });

  /* ---------- API pública ---------- */
  window.TRRIBU = {
    money: money,
    tierFor: tierFor,
    tiers: cfg.tiers || [],
    cart: { add: add, change: change, refresh: refresh, open: openDrawer, close: closeDrawer, updateAttributes: updateAttributes },
    fetchJSON: fetchJSON,
    config: cfg
  };
})();
