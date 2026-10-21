/* TRRIBÚ · Transparencia — acordeones de una sola fila abierta (sello y FAQ). */
(function () {
  'use strict';

  function setOpen(item, open) {
    var btn = item.querySelector('[data-tr-acc-btn]');
    var panel = item.querySelector('[data-tr-acc-panel]');
    if (!btn || !panel) return;
    var isOpen = item.classList.contains('is-open');
    if (open === isOpen) return;
    if (open) {
      item.classList.add('is-open');
      panel.removeAttribute('inert');
      panel.style.maxHeight = panel.scrollHeight + 'px';
    } else {
      panel.style.maxHeight = panel.scrollHeight + 'px';
      void panel.offsetHeight; // fuerza el reflow para que la transición corra
      panel.style.maxHeight = '0px';
      item.classList.remove('is-open');
      panel.setAttribute('inert', '');
    }
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function fit(group) {
    group.querySelectorAll('[data-tr-acc-item].is-open [data-tr-acc-panel]').forEach(function (p) {
      p.style.maxHeight = p.scrollHeight + 'px';
    });
  }

  function init(root) {
    (root || document).querySelectorAll('[data-tr-acc]').forEach(function (group) {
      if (group.hasAttribute('data-tr-ready')) return;
      group.setAttribute('data-tr-ready', '');
      fit(group);
      group.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-tr-acc-btn]');
        if (!btn || !group.contains(btn)) return;
        var item = btn.closest('[data-tr-acc-item]');
        var willOpen = !item.classList.contains('is-open');
        group.querySelectorAll('[data-tr-acc-item]').forEach(function (it) {
          setOpen(it, it === item && willOpen);
        });
      });
    });
  }

  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(function () { document.querySelectorAll('[data-tr-acc]').forEach(fit); }, 150);
  });

  /* Editor de temas */
  document.addEventListener('shopify:section:load', function (e) { init(e.target); });
  document.addEventListener('shopify:block:select', function (e) {
    var item = e.target.closest && e.target.closest('[data-tr-acc-item]');
    if (!item) return;
    var group = item.closest('[data-tr-acc]');
    group.querySelectorAll('[data-tr-acc-item]').forEach(function (it) { setOpen(it, it === item); });
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
})();
