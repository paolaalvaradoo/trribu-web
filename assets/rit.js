/* ==========================================================================
   TRRIBÚ · Arma tu ritual · builder libre
   Cantidades por producto, resumen en vivo con el descuento por cantidad
   (TRRIBU.tierFor / TRRIBU.tiers, leídos de Configuración del tema) y
   "añadir todo" con TRRIBU.cart.add. El cobro real lo hace el descuento
   automático configurado en Shopify.
   ========================================================================== */
(function () {
  'use strict';

  function fill(tpl, vals) {
    return String(tpl || '').replace(/\[(\w+)\]/g, function (m, k) {
      return Object.prototype.hasOwnProperty.call(vals, k) ? vals[k] : m;
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function init(root) {
    if (root.__rit) return;
    root.__rit = true;
    var T = window.TRRIBU;
    var dataEl = root.querySelector('[data-rit-data]');
    if (!T || !dataEl) return;
    var data;
    try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
    var items = data.items || [];
    var tx = data.text || {};
    var qty = items.map(function () { return 0; });
    var money = T.money;

    var $ = function (sel) { return root.querySelector(sel); };
    var el = {
      count: $('[data-rit-count]'), empty: $('[data-rit-empty]'), lines: $('[data-rit-lines]'),
      totals: $('[data-rit-totals]'), subtotal: $('[data-rit-subtotal]'), discRow: $('[data-rit-disc-row]'),
      discLabel: $('[data-rit-disc-label]'), disc: $('[data-rit-disc]'), total: $('[data-rit-total]'),
      nudge: $('[data-rit-nudge]'), nudgeTxt: $('[data-rit-nudge-txt]'), meter: $('[data-rit-meter]'),
      cta: $('[data-rit-cta]'), err: $('[data-rit-err]'), bar: $('[data-rit-bar]'),
      barCount: $('[data-rit-bar-count]'), barTotal: $('[data-rit-bar-total]'), sum: $('.rit-sum')
    };
    var cards = root.querySelectorAll('[data-rit-card]');

    function word(n) { return n === 1 ? tx.itemOne : tx.itemMany; }
    function pctLabel(t) { return '−' + t.pct + '%'; }
    function sortedTiers() {
      return (T.tiers || []).filter(function (t) { return t && t.min > 0 && t.pct > 0; })
        .slice().sort(function (a, b) { return a.min - b.min; });
    }
    function qtyByNum(n) {
      var q = 0;
      items.forEach(function (it, i) { if (it.num === n) q += qty[i]; });
      return q;
    }
    function hasNum(n) { return items.some(function (it) { return it.num === n; }); }

    var barVisible = false, sumInView = false;

    function render() {
      var units = 0, subtotal = 0, linesHtml = '';
      items.forEach(function (it, i) {
        var q = qty[i];
        var card = cards[i];
        if (card) {
          card.classList.toggle('is-on', q > 0);
          card.querySelector('[data-rit-n]').textContent = q;
          card.querySelector('[data-rit-dec]').disabled = q === 0;
        }
        if (q > 0) {
          units += q;
          subtotal += it.price * q;
          linesHtml += '<li><span>' + q + '× ' + esc(it.title) + '</span><span>' + esc(money(it.price * q)) + '</span></li>';
        }
      });

      var tier = T.tierFor(units);
      var discount = tier ? Math.round(subtotal * tier.pct / 100) : 0;
      var total = subtotal - discount;
      var has = units > 0;

      el.count.textContent = has ? fill(units === 1 ? tx.countOne : tx.countMany, { n: units }) : tx.countZero;
      el.empty.hidden = has;
      el.lines.hidden = !has;
      el.totals.hidden = !has;
      el.lines.innerHTML = linesHtml;
      el.subtotal.textContent = money(subtotal);
      el.discRow.hidden = !tier;
      if (tier) {
        el.discLabel.textContent = fill(tx.discLabel, { pct: pctLabel(tier) });
        el.disc.textContent = '− ' + money(discount);
      }
      el.total.textContent = money(total);

      /* Aviso + progreso al siguiente tramo */
      var tiers = sortedTiers();
      var next = null;
      for (var k = 0; k < tiers.length; k++) { if (tiers[k].min > units) { next = tiers[k]; break; } }
      var nudge = '', progress = 1;
      if (has) {
        if (next) {
          var left = next.min - units;
          nudge = fill(tier ? tx.nudgeNext : tx.nudgeFirst, { n: left, items: word(left), pct: pctLabel(next) });
          progress = units / next.min;
        } else if (tier) {
          nudge = fill(tx.nudgeMax, { pct: pctLabel(tier) });
        }
        if (tx.nudgeMasc && hasNum('03') && qtyByNum('01') > 0 && qtyByNum('02') > 0 && qtyByNum('03') === 0) {
          nudge = tx.nudgeMasc;
        }
      }
      el.nudge.hidden = !(has && nudge);
      el.nudgeTxt.textContent = nudge;
      if (el.meter) el.meter.style.width = Math.min(100, Math.round(progress * 100)) + '%';

      el.cta.disabled = !has;
      el.cta.textContent = has ? fill(tx.cta, { total: money(total) }) : tx.ctaEmpty;

      if (el.bar) {
        el.barCount.textContent = has ? fill(units === 1 ? tx.countOne : tx.countMany, { n: units }) : '';
        el.barTotal.textContent = money(total);
        barVisible = has;
        syncBar();
      }
    }

    function syncBar() {
      if (!el.bar) return;
      var on = barVisible && !sumInView;
      el.bar.classList.toggle('is-on', on);
      el.bar.setAttribute('aria-hidden', on ? 'false' : 'true');
      var a = el.bar.querySelector('a');
      if (a) a.tabIndex = on ? 0 : -1;
    }

    if (el.bar && el.sum && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        sumInView = entries[0].isIntersecting;
        syncBar();
      }, { threshold: 0.15 }).observe(el.sum);
    }

    root.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-rit-inc], [data-rit-dec]');
      if (!btn || btn.disabled) return;
      var card = btn.closest('[data-rit-card]');
      var i = parseInt(card.getAttribute('data-rit-card'), 10);
      if (!items[i]) return;
      qty[i] = Math.max(0, qty[i] + (btn.hasAttribute('data-rit-inc') ? 1 : -1));
      el.err.hidden = true;
      render();
    });

    el.cta.addEventListener('click', function () {
      var lines = [];
      items.forEach(function (it, i) { if (qty[i] > 0) lines.push({ id: it.id, quantity: qty[i] }); });
      if (!lines.length) return;
      el.cta.classList.add('is-loading');
      el.err.hidden = true;
      T.cart.add(lines, { open: true }).then(function () {
        el.cta.classList.remove('is-loading');
        qty = qty.map(function () { return 0; });
        render();
        el.cta.textContent = tx.added;
        setTimeout(render, 1800);
      }).catch(function (err) {
        el.cta.classList.remove('is-loading');
        el.err.textContent = (err && err.message) || 'Error';
        el.err.hidden = false;
      });
    });

    render();
  }

  function boot() { document.querySelectorAll('[data-rit]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  document.addEventListener('shopify:section:load', boot);
})();
