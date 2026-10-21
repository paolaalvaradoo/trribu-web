/* TRRIBÚ · FAQ — acordeón (una abierta a la vez) + filtro por categoría */
(function () {
  'use strict';

  function setHeight(item, open) {
    var panel = item.querySelector('.faq-acc__panel');
    if (!panel) return;
    panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '';
  }

  function toggle(root, item, force) {
    var willOpen = typeof force === 'boolean' ? force : !item.classList.contains('is-open');
    root.querySelectorAll('.faq-acc__item.is-open').forEach(function (it) {
      if (it !== item) {
        it.classList.remove('is-open');
        it.querySelector('.faq-acc__q').setAttribute('aria-expanded', 'false');
        setHeight(it, false);
      }
    });
    item.classList.toggle('is-open', willOpen);
    item.querySelector('.faq-acc__q').setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    setHeight(item, willOpen);
  }

  function init(root) {
    if (root.dataset.faqReady) return;
    root.dataset.faqReady = '1';
    root.classList.add('is-js');

    root.querySelectorAll('.faq-acc__item').forEach(function (item) {
      var open = item.classList.contains('is-open');
      item.querySelector('.faq-acc__q').setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) setHeight(item, true);
    });

    root.addEventListener('click', function (e) {
      var q = e.target.closest('.faq-acc__q');
      if (q && root.contains(q)) { toggle(root, q.closest('.faq-acc__item')); return; }

      var cat = e.target.closest('[data-faq-cat]');
      if (cat && root.contains(cat)) {
        var val = cat.getAttribute('data-faq-cat');
        root.querySelectorAll('[data-faq-cat]').forEach(function (b) {
          var on = b === cat;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        root.querySelectorAll('.faq-acc__item').forEach(function (it) {
          it.hidden = !(val === '' || it.getAttribute('data-cat') === val);
          if (it.hidden && it.classList.contains('is-open')) toggle(root, it, false);
        });
      }
    });

    /* Abre la pregunta enlazada con #faq-… */
    if (location.hash) {
      var target = root.querySelector(location.hash.replace(/[^#\w-]/g, ''));
      if (target && target.classList.contains('faq-acc__item')) toggle(root, target, true);
    }
  }

  function boot() { document.querySelectorAll('[data-faq]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  document.addEventListener('shopify:section:load', boot);
})();
