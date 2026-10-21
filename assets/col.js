/* TRRIBÚ · Productos — filtro por categoría en el navegador */
(function () {
  'use strict';

  function apply(list, key) {
    var sec = list.querySelector('[data-f]');
    var grid = list.querySelector('[data-col-grid]');
    var none = list.querySelector('[data-col-none]');
    if (sec) sec.setAttribute('data-f', key);
    list.querySelectorAll('[data-col-filter]').forEach(function (b) {
      var on = b.getAttribute('data-col-filter') === key;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (!grid) return;
    var shown = 0;
    grid.querySelectorAll('.col-card').forEach(function (card) {
      var cats = ' ' + (card.getAttribute('data-cats') || '') + ' ';
      var ok = key === 'todo' || cats.indexOf(' ' + key + ' ') !== -1;
      card.hidden = !ok;
      if (ok) shown++;
    });
    grid.classList.toggle('is-filtered', key !== 'todo');
    if (none) none.hidden = shown > 0;
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-col-filter]');
    if (!btn) return;
    var list = btn.closest('[data-col-list]');
    if (list) apply(list, btn.getAttribute('data-col-filter'));
  });
})();
