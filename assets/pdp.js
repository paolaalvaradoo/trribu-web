/* ==========================================================================
   TRRIBÚ · pdp.js — Ficha de producto
   Galería (vistas), desplegables, cantidad, variante, añadir al carrito y
   "Completa tu ritual" con total en vivo y descuento por cantidad.
   ========================================================================== */
(function () {
  'use strict';

  function money(cents) {
    return window.TRRIBU ? window.TRRIBU.money(cents) : 'S/ ' + Math.round(cents / 100);
  }

  /* ---------- Desplegables genéricos ---------- */
  function setOpen(btn, open) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (panel) panel.classList.toggle('is-open', open);
    var group = btn.closest('.pdp-up__group');
    if (group) group.classList.toggle('is-open', open);
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    var tog = t.closest('[data-pdp-toggle]');
    if (tog) {
      var open = tog.getAttribute('aria-expanded') !== 'true';
      var g = tog.getAttribute('data-pdp-group');
      if (open && g) {
        document.querySelectorAll('[data-pdp-group="' + g + '"][aria-expanded="true"]').forEach(function (b) {
          if (b !== tog) setOpen(b, false);
        });
      }
      setOpen(tog, open);
      return;
    }

    var root = t.closest('[data-pdp]');
    if (!root) return;
    var st = state(root);

    var thumb = t.closest('[data-pdp-thumb]');
    if (thumb) {
      var v = thumb.getAttribute('data-pdp-thumb');
      root.querySelectorAll('[data-pdp-view]').forEach(function (el) {
        el.classList.toggle('is-active', el.getAttribute('data-pdp-view') === v);
      });
      root.querySelectorAll('[data-pdp-thumb]').forEach(function (b) {
        var on = b === thumb;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      return;
    }

    var q = t.closest('[data-pdp-qty]');
    if (q) {
      st.qty = Math.max(1, st.qty + parseInt(q.getAttribute('data-pdp-qty'), 10));
      root.querySelector('[data-pdp-qty-val]').textContent = st.qty;
      recalc(root);
      return;
    }

    var add = t.closest('[data-pdp-add]');
    if (add) {
      addItems(add, [{ id: st.variant.id, quantity: st.qty }]);
      return;
    }

    var all = t.closest('[data-pdp-addall]');
    if (all) {
      var items = [{ id: st.variant.id, quantity: st.qty }];
      picked(root).forEach(function (cb) { items.push({ id: Number(cb.value), quantity: 1 }); });
      addItems(all, items);
    }
  });

  document.addEventListener('change', function (e) {
    var root = e.target.closest('[data-pdp]');
    if (!root) return;
    if (e.target.matches('[data-pdp-pick]')) { recalc(root); return; }
    if (e.target.matches('[data-pdp-variant]')) {
      var st = state(root);
      var id = Number(e.target.value);
      st.variants.forEach(function (v) { if (v.id === id) st.variant = v; });
      root.querySelector('[data-pdp-price]').textContent = st.variant.price_label;
      var btn = root.querySelector('[data-pdp-add]');
      btn.disabled = !st.variant.available;
      btn.textContent = st.variant.available ? st.addLabel : 'Agotado';
      root.querySelector('[data-pdp-addall]').disabled = !st.variant.available;
      var url = new URL(window.location.href);
      url.searchParams.set('variant', id);
      window.history.replaceState({}, '', url.toString());
      recalc(root);
    }
  });

  /* ---------- Estado por ficha ---------- */
  function state(root) {
    if (root._pdp) return root._pdp;
    var data = {};
    try { data = JSON.parse(root.querySelector('[data-pdp-json]').textContent); } catch (err) { data = { variants: [] }; }
    var cur = data.variants[0] || { id: 0, price: 0, available: false };
    data.variants.forEach(function (v) { if (v.id === data.current) cur = v; });
    root._pdp = { qty: 1, variants: data.variants, variant: cur, addLabel: data.add_label || 'Añadir al ritual' };
    return root._pdp;
  }

  function picked(root) {
    return Array.prototype.slice.call(root.querySelectorAll('[data-pdp-pick]:checked'));
  }

  function recalc(root) {
    var st = state(root);
    var chosen = picked(root);
    var base = st.variant.price * st.qty;
    var addSum = chosen.reduce(function (s, cb) { return s + Number(cb.getAttribute('data-price') || 0); }, 0);
    var n = chosen.length;
    var gross = base + addSum;
    var count = st.qty + n;
    var tier = window.TRRIBU && window.TRRIBU.tierFor ? window.TRRIBU.tierFor(count) : null;
    var total = tier ? Math.round(gross * (100 - tier.pct) / 100) : gross;

    var cEl = root.querySelector('[data-pdp-count]');
    cEl.textContent = n ? cEl.getAttribute('data-label').replace('[n]', count) : cEl.getAttribute('data-empty');
    root.querySelector('[data-pdp-bar]').classList.toggle('is-on', n > 0);
    root.querySelector('[data-pdp-total]').textContent = money(total);

    var grossEl = root.querySelector('[data-pdp-gross]');
    var saveEl = root.querySelector('[data-pdp-save]');
    if (tier && total < gross) {
      grossEl.textContent = money(gross);
      grossEl.hidden = false;
      saveEl.textContent = saveEl.getAttribute('data-label').replace('[monto]', money(gross - total)).replace('[pct]', tier.pct);
      saveEl.hidden = false;
    } else {
      grossEl.hidden = true;
      saveEl.hidden = true;
    }
  }

  function addItems(btn, items) {
    if (!window.TRRIBU || btn.disabled) return;
    var original = btn.innerHTML;
    btn.classList.add('is-loading');
    window.TRRIBU.cart.add(items).then(function () {
      btn.classList.remove('is-loading');
      btn.textContent = btn.getAttribute('data-added-label') || 'Añadido ✓';
      setTimeout(function () { btn.innerHTML = original; }, 1800);
    }).catch(function (err) {
      btn.classList.remove('is-loading');
      alert(err.message);
    });
  }

  function init() {
    document.querySelectorAll('[data-pdp]').forEach(function (root) { root._pdp = null; recalc(root); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  document.addEventListener('shopify:section:load', init);
})();
