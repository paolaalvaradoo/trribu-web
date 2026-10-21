/* ==========================================================================
   TRRIBÚ · qz.js — Quiz de diagnóstico (/pages/quiz)
   1) Motor de puntaje (puro, sin DOM): QZEngine.compute(config, answers)
      Puerto exacto del motor del prototipo "TRRIBÚ Quiz.dc.html", pero con
      preguntas, pesos, umbrales y textos leídos del JSON de configuración
      (snippets/qz-config.liquid o el ajuste "config_override" de la sección).
   2) Interfaz: intro → preguntas → resultado; carrito, Klaviyo, webhook,
      último resultado en localStorage.
   ========================================================================== */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------------
     MOTOR
     ------------------------------------------------------------------------ */
  function findQuestion(config, id) {
    var qs = config.questions || [];
    for (var i = 0; i < qs.length; i++) if (qs[i].id === id) return qs[i];
    return null;
  }

  function answerHas(answers, qid, v) {
    var a = answers[qid];
    var vals = Array.isArray(v) ? v : [v];
    if (Array.isArray(a)) return vals.some(function (x) { return a.indexOf(x) >= 0; });
    return a !== undefined && a !== null && vals.indexOf(a) >= 0;
  }

  /* Evalúa una condición del JSON ("when"). ctx = {answers, keys} */
  function test(cond, ctx) {
    if (!cond) return true;
    if (cond.any) return cond.any.some(function (c) { return test(c, ctx); });
    if (cond.all) return cond.all.every(function (c) { return test(c, ctx); });
    if (cond.not) return !test(cond.not, ctx);
    if (cond.product) return ctx.keys.indexOf(cond.product) >= 0;
    if (cond.q) return answerHas(ctx.answers, cond.q, cond.v);
    return !!cond.always;
  }

  /* Primera opción que cumple en una capa */
  function firstMatch(options, ctx) {
    options = options || [];
    for (var i = 0; i < options.length; i++) if (test(options[i].when, ctx)) return options[i];
    return null;
  }

  /* Selección de una opción (misma lógica que pick() del prototipo).
     Devuelve el nuevo valor de la respuesta. */
  function pick(question, current, v) {
    if (question.multi) {
      var arr = Array.isArray(current) ? current.slice() : [];
      var opt = question.options.filter(function (o) { return o.v === v; })[0];
      var i = arr.indexOf(v);
      if (i >= 0) arr.splice(i, 1);
      else if (opt && opt.solo) arr = [v];
      else {
        arr = arr.filter(function (x) {
          var o = question.options.filter(function (oo) { return oo.v === x; })[0];
          return !(o && o.solo);
        });
        arr.push(v);
      }
      return arr;
    }
    return v;
  }

  function compute(config, answers) {
    answers = answers || {};
    var ctx = { answers: answers, keys: (config.core || []).slice() };

    // Puntaje por producto · umbral (las señales decisivas llegan solas)
    var scores = {};
    (config.scoring || []).forEach(function (s) {
      var pts = 0;
      (s.rules || []).forEach(function (r) { if (test(r.when, ctx)) pts += Number(r.pts) || 0; });
      scores[s.product] = pts;
      if (pts >= (s.threshold || 0) && ctx.keys.indexOf(s.product) < 0) ctx.keys.push(s.product);
    });
    var keys = ctx.keys;
    var n = keys.length;

    var titles = config.titles || {};
    var t = titles[String(n)] || titles['default'] || { title: 'Tu ritual', sub: 'A tu medida.' };

    // Diagnóstico por capas
    var parts = [];
    var tags = {};
    (config.diagnosis || []).forEach(function (layer) {
      var m = firstMatch(layer.options, ctx);
      if (m) {
        parts.push(m.text);
        if (m.tag) tags[layer.id] = m.tag;
      }
    });

    // Señales a trabajar
    var sc = config.signals || {};
    var signals = [];
    if (sc.from_answer) {
      var given = answers[sc.from_answer.q];
      (Array.isArray(given) ? given : []).forEach(function (v) {
        var l = sc.from_answer.labels[v];
        if (l) signals.push(l);
      });
    }
    (sc.rules || []).forEach(function (layer) {
      var m = firstMatch(layer.options, ctx);
      if (m) signals.push.apply(signals, m.add || []);
    });
    if (!signals.length) signals = (sc.fallback || []).slice();
    signals = signals.filter(function (s, i) { return signals.indexOf(s) === i; });

    // Herramientas (máx. 3)
    var tc = config.tools || {};
    var tools = [];
    (tc.items || []).forEach(function (it) {
      if (test(it.when, ctx) && !tools.some(function (x) { return x.key === it.key; })) {
        tools.push({ key: it.key, bg: it.bg, why: it.why });
      }
    });
    if (!tools.length && tc.fallback) tools.push({ key: tc.fallback.key, bg: tc.fallback.bg, why: tc.fallback.why });
    tools = tools.slice(0, tc.max || 3);

    // Kit que coincide exactamente con los productos (si existe)
    var kit = null;
    var kits = config.kits || {};
    Object.keys(kits).forEach(function (k) {
      var c = kits[k].contains || [];
      if (!kit && c.length === n && c.every(function (x) { return keys.indexOf(x) >= 0; })) kit = k;
    });

    var pt = config.product_tags || {};
    return {
      n: n,
      keys: keys,
      scores: scores,
      title: t.title,
      sub: t.sub,
      body: parts.join(' '),
      parts: parts,
      tags: tags,
      dominant: tags.dominante || null,
      signals: signals,
      tools: tools,
      kit: kit,
      productTags: keys.map(function (k) { return pt[k] || pt['default'] || ''; })
    };
  }

  var QZEngine = { compute: compute, pick: pick, test: test, findQuestion: findQuestion };

  if (typeof module === 'object' && module.exports) { module.exports = QZEngine; return; }
  root.QZEngine = QZEngine;
  if (typeof document === 'undefined') return;

  /* ------------------------------------------------------------------------
     INTERFAZ
     ------------------------------------------------------------------------ */
  var STORE_KEY = 'trribu_quiz_v1';

  function readJSON(el) {
    if (!el) return null;
    try { var txt = el.textContent.trim(); return txt ? JSON.parse(txt) : null; } catch (e) { console.warn('[quiz] JSON inválido', e); return null; }
  }
  function store(v) { try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch (e) {} }
  function load() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { return null; } }
  function fmt(tpl, vars) { return String(tpl || '').replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; }); }
  function money(c) { return window.TRRIBU && TRRIBU.money ? TRRIBU.money(c) : 'S/ ' + Math.round(c / 100); }

  function init(rootEl) {
    var config = readJSON(rootEl.querySelector('[data-qz-config-override]')) || readJSON(rootEl.querySelector('[data-qz-config]'));
    var catalog = readJSON(rootEl.querySelector('[data-qz-catalog]')) || {};
    var copy = readJSON(rootEl.querySelector('[data-qz-copy]')) || {};
    if (!config || !config.questions) return;

    var qs = config.questions;
    var state = { stage: 'intro', step: 0, answers: {} };
    var timer = null;
    var current = null; // último resultado calculado

    var $ = function (s) { return rootEl.querySelector(s); };
    var stages = rootEl.querySelectorAll('[data-qz-stage]');
    var fill = $('[data-qz-fill]');
    var bar = $('[data-qz-bar]');

    function show(stage) {
      state.stage = stage;
      stages.forEach(function (s) { s.hidden = s.getAttribute('data-qz-stage') !== stage; });
      var i = Math.min(state.step, qs.length - 1);
      var pct = stage === 'result' ? 100 : stage === 'intro' ? 0 : Math.round((i / qs.length) * 100);
      fill.style.width = pct + '%';
      if (bar) bar.setAttribute('aria-valuenow', pct);
    }

    function scrollTop() {
      var top = rootEl.getBoundingClientRect().top + window.pageYOffset - 80;
      if (window.pageYOffset > top) window.scrollTo(0, Math.max(0, top));
    }

    /* ---------- Pregunta ---------- */
    var optsEl = $('[data-qz-opts]');
    var nextBtn = $('[data-qz-next]');
    var hintEl = $('[data-qz-hint]');
    var titleEl = $('[data-qz-title]');

    function answerOf(q) {
      var a = state.answers[q.id];
      return a === undefined ? (q.multi ? [] : null) : a;
    }

    function renderQuestion(focus) {
      var i = Math.min(state.step, qs.length - 1);
      var q = qs[i];
      var ans = answerOf(q);
      var answered = q.multi ? ans.length > 0 : !!ans;

      $('[data-qz-step]').textContent = fmt(copy.step_label || 'PREGUNTA {i} DE {n}', { i: i + 1, n: qs.length });
      titleEl.textContent = q.title;
      $('[data-qz-help]').textContent = q.help || '';

      optsEl.className = 'qz__opts qz__opts--' + (q.cols || 2);
      optsEl.setAttribute('role', q.multi ? 'group' : 'radiogroup');
      optsEl.innerHTML = '';
      q.options.forEach(function (o) {
        var on = q.multi ? ans.indexOf(o.v) >= 0 : ans === o.v;
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'qz__opt' + (on ? ' is-on' : '') + (q.multi ? '' : ' qz__opt--radio');
        if (q.multi) b.setAttribute('aria-pressed', on ? 'true' : 'false');
        else { b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', on ? 'true' : 'false'); }
        b.setAttribute('data-v', o.v);
        b.innerHTML = '<span class="qz__mark" aria-hidden="true"></span><span class="qz__otxt"><span class="qz__olabel"></span><span class="qz__osub"></span></span>';
        b.querySelector('.qz__mark').textContent = on ? '✓' : '';
        b.querySelector('.qz__olabel').textContent = o.label;
        var sub = b.querySelector('.qz__osub');
        if (o.sub) sub.textContent = o.sub; else sub.remove();
        optsEl.appendChild(b);
      });

      nextBtn.hidden = !q.multi;
      hintEl.hidden = !q.multi;
      nextBtn.textContent = i === qs.length - 1 ? (copy.next_last || 'VER MI RITUAL') : (copy.next || 'CONTINUAR');
      nextBtn.setAttribute('aria-disabled', answered ? 'false' : 'true');
      nextBtn.classList.toggle('is-ready', answered);
      if (focus) titleEl.focus({ preventScroll: true });
    }

    optsEl.addEventListener('click', function (e) {
      var b = e.target.closest('.qz__opt');
      if (!b) return;
      var q = qs[Math.min(state.step, qs.length - 1)];
      var v = b.getAttribute('data-v');
      state.answers[q.id] = pick(q, state.answers[q.id], v);
      renderQuestion(false);
      var again = optsEl.querySelector('[data-v="' + v + '"]');
      if (again) again.focus({ preventScroll: true });
      if (!q.multi) { clearTimeout(timer); timer = setTimeout(advance, 240); }
    });

    function advance() {
      clearTimeout(timer);
      if (state.step >= qs.length - 1) { finish(); return; }
      state.step += 1;
      show('quiz');
      renderQuestion(true);
      scrollTop();
    }

    nextBtn.addEventListener('click', function () {
      var q = qs[Math.min(state.step, qs.length - 1)];
      var ans = answerOf(q);
      if (q.multi ? ans.length > 0 : !!ans) advance();
    });

    $('[data-qz-back]').addEventListener('click', function () {
      clearTimeout(timer);
      if (state.step === 0) { show('intro'); $('[data-qz-start]').focus(); return; }
      state.step -= 1;
      show('quiz');
      renderQuestion(true);
    });

    $('[data-qz-start]').addEventListener('click', function () {
      state.step = 0;
      show('quiz');
      renderQuestion(true);
      scrollTop();
    });

    /* ---------- Resultado ---------- */
    function handleOf(key) { return (config.products || {})[key] || (config.tools_handles || {})[key]; }

    function pricing(r) {
      var lines = [];
      var gross = 0;
      r.keys.forEach(function (k) {
        var p = catalog[handleOf(k)];
        if (p && p.variant) { gross += p.price; lines.push({ id: p.variant, quantity: 1, available: p.available }); }
      });
      var kitInfo = r.kit && config.kits[r.kit] ? catalog[config.kits[r.kit].handle] : null;
      if (copy.use_kits && kitInfo && kitInfo.variant && kitInfo.available) {
        var was = kitInfo.compare > kitInfo.price ? kitInfo.compare : gross;
        return { total: kitInfo.price, was: was, items: [{ id: kitInfo.variant, quantity: 1 }], count: r.n };
      }
      var tier = window.TRRIBU && TRRIBU.tierFor ? TRRIBU.tierFor(lines.length) : null;
      var total = tier ? Math.round(gross * (1 - tier.pct / 100)) : gross;
      return { total: total, was: gross, items: lines.map(function (l) { return { id: l.id, quantity: 1 }; }), count: r.n, unavailable: lines.some(function (l) { return !l.available; }) };
    }

    function cloneTpl(sel) {
      var tpl = rootEl.querySelector(sel);
      return tpl ? tpl.content.firstElementChild.cloneNode(true) : null;
    }

    function renderResult(r) {
      current = r;
      $('[data-qz-r-title]').textContent = r.title;
      $('[data-qz-r-sub]').textContent = r.sub;
      $('[data-qz-r-body]').textContent = r.body;

      var sig = $('[data-qz-r-signals]');
      sig.innerHTML = '';
      r.signals.forEach(function (s) {
        var li = document.createElement('li');
        li.className = 'qz__signal';
        li.textContent = s;
        sig.appendChild(li);
      });

      var grid = $('[data-qz-r-products]');
      grid.innerHTML = '';
      grid.style.setProperty('--qz-cols', Math.min(r.n, 4));
      grid.setAttribute('data-n', Math.min(r.n, 4));
      r.keys.forEach(function (k, i) {
        var el = cloneTpl('template[data-qz-product="' + handleOf(k) + '"]');
        if (!el) return;
        var tag = el.querySelector('[data-qz-tag]');
        if (tag) tag.textContent = r.productTags[i];
        grid.appendChild(el);
      });

      var tg = $('[data-qz-r-tools]');
      tg.innerHTML = '';
      r.tools.forEach(function (t) {
        var el = cloneTpl('template[data-qz-tool="' + handleOf(t.key) + '"]');
        if (!el) return;
        var why = el.querySelector('[data-qz-why]');
        if (why) why.textContent = t.why;
        var shot = el.querySelector('.qz__tshot');
        if (shot && t.bg) shot.style.background = t.bg;
        tg.appendChild(el);
      });
      $('[data-qz-r-toolswrap]').hidden = !tg.children.length;

      var pr = pricing(r);
      var save = Math.max(0, pr.was - pr.total);
      var pct = pr.was > 0 ? Math.round((save / pr.was) * 100) : 0;
      $('[data-qz-r-label]').textContent = fmt(save > 0 ? copy.price_label : copy.price_label_plain, { n: r.n, pct: pct });
      $('[data-qz-r-total]').textContent = money(pr.total);
      var wasEl = $('[data-qz-r-was]');
      var saveEl = $('[data-qz-r-save]');
      wasEl.hidden = saveEl.hidden = !(save > 0);
      wasEl.textContent = money(pr.was);
      saveEl.textContent = '−' + money(save);

      var addBtn = $('[data-qz-add]');
      addBtn.disabled = !pr.items.length || !!pr.unavailable;
      addBtn._items = pr.items;

      var adj = $('[data-qz-adjust]');
      if (adj) {
        var base = adj.getAttribute('data-base') || adj.getAttribute('href');
        adj.setAttribute('data-base', base);
        adj.href = base + (base.indexOf('?') >= 0 ? '&' : '?') + 'desde=quiz&productos=' + encodeURIComponent(r.keys.map(handleOf).join(','));
      }
    }

    $('[data-qz-add]').addEventListener('click', function () {
      var btn = this;
      var items = (btn._items || []).map(function (it) { return { id: it.id, quantity: it.quantity, properties: { _origen: 'quiz' } }; });
      if (!items.length || !window.TRRIBU) return;
      var label = btn.textContent;
      btn.classList.add('is-loading');
      TRRIBU.cart.add(items, { open: true }).then(function () {
        btn.classList.remove('is-loading');
        btn.textContent = copy.added || 'Añadido ✓';
        setTimeout(function () { btn.textContent = label; }, 1800);
        if (TRRIBU.cart.updateAttributes && current) {
          TRRIBU.cart.updateAttributes({ 'Quiz · ritual': current.title }).catch(function () {});
        }
      }).catch(function (err) {
        btn.classList.remove('is-loading');
        alert(err.message);
      });
    });

    /* Resumen que va a Klaviyo / webhook */
    function summary(r) {
      var a = state.answers;
      return {
        quiz_kit: r.title,
        quiz_senal_dominante: r.dominant,
        quiz_tipo_pelo: a.tipo || null,
        quiz_tratamientos: Array.isArray(a.tratamientos) ? a.tratamientos : [],
        quiz_fase2_senales: Array.isArray(a.futuros) ? a.futuros : [],
        quiz_productos: r.keys.map(handleOf),
        quiz_herramientas: r.tools.map(function (t) { return handleOf(t.key); }),
        quiz_senales: r.signals,
        quiz_etapa: a.momento || null
      };
    }

    function finish() {
      var r = compute(config, state.answers);
      show('result');
      renderResult(r);
      scrollTop();
      $('[data-qz-r-title]').focus({ preventScroll: true });
      store({ at: new Date().toISOString(), answers: state.answers, version: config.version || 1 });
      updateResume();

      var s = summary(r);
      var cfg = (window.TRRIBU && TRRIBU.config) || window.TRRIBU_CONFIG || {};
      if (window.klaviyo && typeof window.klaviyo.push === 'function') {
        try { window.klaviyo.push(['track', 'Quiz completado', s]); } catch (e) {}
      }
      if (cfg.webhookUrl) {
        try {
          fetch(cfg.webhookUrl, {
            method: 'POST', mode: 'no-cors', keepalive: true,
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
              event: 'quiz_completado',
              timestamp: new Date().toISOString(),
              page: window.location.href,
              answers: state.answers,
              result: { kit: r.title, kit_handle: r.kit ? config.kits[r.kit].handle : null, products: s.quiz_productos, tools: s.quiz_herramientas, scores: r.scores, dominant: r.dominant, signals: r.signals, diagnosis: r.body },
              tags: s
            })
          }).catch(function () {});
        } catch (e) {}
      }
    }

    $('[data-qz-restart]').addEventListener('click', function () {
      state = { stage: 'intro', step: 0, answers: {} };
      show('intro');
      scrollTop();
      $('[data-qz-start]').focus();
    });

    /* ---------- Último resultado ---------- */
    var resume = $('[data-qz-resume]');
    function showSaved() {
      var saved = load();
      if (!saved || !saved.answers) return false;
      state.answers = saved.answers;
      state.step = qs.length - 1;
      show('result');
      renderResult(compute(config, state.answers));
      return true;
    }
    function updateResume() {
      var saved = load();
      if (resume) resume.hidden = !(saved && saved.answers);
    }
    var showLast = $('[data-qz-show-last]');
    if (showLast) showLast.addEventListener('click', function () { if (showSaved()) $('[data-qz-r-title]').focus(); });
    updateResume();

    /* ---------- Captura de correo ---------- */
    var form = $('[data-qz-form]');
    var msg = $('[data-qz-msg]');
    function say(t, isErr) { if (!msg) return; msg.textContent = t; msg.hidden = !t; msg.classList.toggle('is-err', !!isErr); }

    if (form) {
      form.addEventListener('submit', function (e) {
        var email = (form.querySelector('input[type="email"]').value || '').trim();
        if (!current) { e.preventDefault(); return; }
        var s = summary(current);
        var tagsInput = form.querySelector('[name="contact[tags]"]');
        if (tagsInput) {
          tagsInput.value = ['quiz', 'quiz-kit:' + s.quiz_kit, 'quiz-senal:' + s.quiz_senal_dominante, 'quiz-tipo:' + s.quiz_tipo_pelo]
            .concat(s.quiz_tratamientos.map(function (t) { return 'quiz-trat:' + t; }))
            .concat(s.quiz_fase2_senales.map(function (t) { return 'quiz-f2:' + t; })).join(', ');
        }
        var cfg = (window.TRRIBU && TRRIBU.config) || window.TRRIBU_CONFIG || {};
        var kl = cfg.klaviyo || {};
        if (window.klaviyo && typeof window.klaviyo.push === 'function') {
          try { window.klaviyo.push(['identify', Object.assign({ $email: email }, s)]); } catch (err) {}
        }
        if (!kl.publicKey || !kl.listId) return; // sin Klaviyo: envío nativo al formulario de clientes de Shopify
        e.preventDefault();
        var btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        say('');
        fetch('https://a.klaviyo.com/client/subscriptions?company_id=' + encodeURIComponent(kl.publicKey), {
          method: 'POST',
          headers: { revision: kl.revision, 'content-type': 'application/vnd.api+json', accept: 'application/vnd.api+json' },
          body: JSON.stringify({
            data: {
              type: 'subscription',
              attributes: {
                custom_source: 'Quiz TRRIBÚ',
                profile: { data: { type: 'profile', attributes: {
                  email: email,
                  subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } },
                  properties: s
                } } }
              },
              relationships: { list: { data: { type: 'list', id: kl.listId } } }
            }
          })
        }).then(function (res) {
          btn.disabled = false;
          if (!res.ok) throw new Error(res.status);
          form.reset();
          say(copy.thanks || '¡Listo! Revisa tu correo.');
        }).catch(function () {
          btn.disabled = false;
          say(copy.error || 'No pudimos enviarlo. Inténtalo de nuevo.', true);
        });
      });
    }

    /* Vuelta del formulario nativo de Shopify o enlace directo al resultado */
    var posted = !!rootEl.querySelector('[data-qz-posted]');
    if ((posted || /[#&?]resultado\b/.test(window.location.href)) && showSaved()) {
      if (posted) say(copy.thanks || '¡Listo! Revisa tu correo.');
      var cap = $('[data-qz-capture]');
      if (posted && cap) cap.scrollIntoView();
    } else {
      show('intro');
    }
  }

  function boot() { document.querySelectorAll('[data-qz]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  document.addEventListener('shopify:section:load', function (e) {
    var el = e.target.querySelector('[data-qz]');
    if (el) init(el);
  });
})(typeof window !== 'undefined' ? window : this);
