/* ==========================================================================
   TRRIBÚ · qp.js — Quiz de prelanzamiento V25 (/pages/quiz-prelanzamiento)
   1) Motor (puro, sin DOM): QPEngine — puerto literal de
      TRRIBU_Quiz_V25_ClaudeCode_Flama (preguntas, motor(), segmento(),
      headlineV25, parrafoV25, whyV25, renderBreakageV25, propiedades quiz_*).
      No cambiar puntos ni umbrales aquí sin la aprobación de Pao.
   2) Interfaz: intro → 10 preguntas → resultado → lista de espera.
   3) Klaviyo con la API pública (company_id), sin clave privada:
      perfil + propiedades siempre (con consentimiento de datos),
      suscripción a la lista solo con consentimiento de correo,
      evento «Quiz completado».
   ========================================================================== */
(function (root) {
  'use strict';

  var VERSION = 'prelanzamiento_v25';

  /* ── Ilustraciones temporales (P5/P6). Reemplazar por fotos reales. ── */
  var SV = {
    lacio: '<svg viewBox="0 0 80 88" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M28 6v76M36 6v76M44 6v76M52 6v76"/></g></svg>',
    suaves: '<svg viewBox="0 0 80 88" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M28 6c3 20-3 36 0 56s-2 14 0 20M36 6c3 20-3 36 0 56s-2 14 0 20M44 6c3 20-3 36 0 56s-2 14 0 20M52 6c3 20-3 36 0 56s-2 14 0 20"/></g></svg>',
    ondas: '<svg viewBox="0 0 80 88" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M28 6c6 14-6 26 0 40s-6 26 0 36M36 6c6 14-6 26 0 40s-6 26 0 36M44 6c6 14-6 26 0 40s-6 26 0 36M52 6c6 14-6 26 0 40s-6 26 0 36"/></g></svg>',
    rizado: '<svg viewBox="0 0 80 88" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M28 6c10 8-10 16 0 24s-10 16 0 24-10 16 0 24M40 6c10 8-10 16 0 24s-10 16 0 24-10 16 0 24M52 6c10 8-10 16 0 24s-10 16 0 24-10 16 0 24"/></g></svg>',
    crespo: '<svg viewBox="0 0 80 88" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M26 6c8 4-8 8 0 12s-8 8 0 12-8 8 0 12-8 8 0 12-8 8 0 12-8 8 0 12M40 6c8 4-8 8 0 12s-8 8 0 12-8 8 0 12-8 8 0 12-8 8 0 12-8 8 0 12M54 6c8 4-8 8 0 12s-8 8 0 12-8 8 0 12-8 8 0 12-8 8 0 12-8 8 0 12"/></g></svg>',
    hebra: function (w) { return '<svg viewBox="0 0 80 88" aria-hidden="true"><path d="M40 4v60" stroke="currentColor" stroke-width="' + w + '" stroke-linecap="round"/><path d="M10 72h60" stroke="#8C887E" stroke-width="5" stroke-linecap="round"/><ellipse cx="40" cy="72" rx="7" ry="3.2" fill="#F7F5F1" stroke="#8C887E" stroke-width="1.5"/></svg>'; },
    nose: '<svg viewBox="0 0 80 88" aria-hidden="true"><text x="40" y="52" text-anchor="middle" font-family="Georgia,serif" font-size="40" fill="#8C887E">?</text></svg>'
  };

  /* ── PREGUNTAS (V25) ── */
  var QS = [
    { id: 'signos', sec: 'TU PELO', multi: true, cols: 2, shuffle: true,
      title: '¿Qué has notado en tu pelo últimamente?', help: 'Elige todo lo que aplique.',
      options: [
        { v: 'enredo', l: 'Difícil de desenredar', s: 'Se enreda más, cuesta peinar' },
        { v: 'quiebre', l: 'Se quiebra y veo más pelo en el cepillo', s: 'Noto hebras partidas, no solo pelo que se desprende de raíz' },
        { v: 'puntas', l: 'Puntas secas', s: 'El largo está bien, las puntas no' },
        { v: 'cuerpo', l: 'Con menos volumen', s: 'Lo noto más plano o con menos cuerpo' },
        { v: 'opaco', hot: true, l: 'Opaco o sin brillo', s: 'Apagado, sin luminosidad' },
        { v: 'secoTodo', hot: true, l: 'Seco en todo el largo', s: 'Áspero, rígido, sin flexibilidad' },
        { v: 'textura', hot: true, l: 'Con otra textura', s: 'Más ondulado, o más lacio, que antes' },
        { v: 'canas', hot: true, l: 'Con canas' },
        { v: 'frizz', hot: true, l: 'Con frizz', s: 'Se esponja o se levantan pelitos cortos' },
        { v: 'bien', l: 'Está bastante bien', s: 'Quiero cuidarlo y prevenir', solo: true }
      ] },
    { id: 'porosidad', sec: 'TU PELO', multi: false, cols: 3,
      title: 'Si solo usaras shampoo y nada más, ¿cómo quedaría tu pelo?', help: 'Sin acondicionador ni otros productos. Esto nos orienta sobre cómo se siente tu pelo; no mide su porosidad.',
      options: [
        { v: 'alta', l: 'Muy reseco y áspero', s: 'Casi imposible de peinar' },
        { v: 'media', l: 'Algo seco pero manejable', s: 'Necesita acondicionador' },
        { v: 'baja', l: 'Bastante bien', s: 'Suave, no le hace falta mucho' }
      ] },
    { id: 'tratamientos', sec: 'TUS TRATAMIENTOS', multi: true, cols: 2,
      title: '¿Llevas color o algún tratamiento?', help: 'Puedes marcar más de uno.',
      options: [
        { v: 'ninguno', l: 'Ninguno', solo: true },
        { v: 'tinteRaices', l: 'Tinte en las raíces', s: 'Para cubrir canas' },
        { v: 'tinteTodo', l: 'Tinte en todo el largo' },
        { v: 'mechas', l: 'Mechas, balayage o decoloración' },
        { v: 'keratina', l: 'Alisado o keratina' }
      ] },
    { id: 'calor', sec: 'TU RUTINA', multi: false, cols: 2,
      title: '¿Cómo secas y peinas tu pelo?', help: 'Piensa en una semana normal.',
      options: [
        { v: 'natural', l: 'Al aire', s: 'Calor casi nunca' },
        { v: 'secadora', l: 'Secadora, ocasional', s: 'Sin plancha' },
        { v: 'plancha', l: 'Plancha o rizador', s: 'Algunas veces por semana' },
        { v: 'diario', l: 'Calor casi a diario', s: 'Secadora, plancha o ambas' }
      ] },
    { id: 'tipo', sec: 'TU PELO', multi: false, cols: 5, img: true,
      title: '¿Cómo es tu pelo de forma natural?', help: 'Si tienes alisado, piensa en cómo era antes. · Imágenes ilustrativas provisionales.',
      options: [
        { v: 'lacio', l: 'Lacio', pic: SV.lacio },
        { v: 'suaves', l: 'Ondas suaves', pic: SV.suaves },
        { v: 'ondas', l: 'Ondulado', pic: SV.ondas },
        { v: 'rizado', l: 'Rizado', pic: SV.rizado },
        { v: 'crespo', l: 'Crespo', pic: SV.crespo }
      ] },
    { id: 'grosor', sec: 'TU PELO', multi: false, cols: 4, img: true,
      title: '¿Cómo sientes el grosor de una hebra?', help: 'Una sola hebra, no cuánto pelo tienes.',
      options: [
        { v: 'fino', l: 'Fina', s: 'Casi no la siento', pic: SV.hebra(1) },
        { v: 'medio', l: 'Media', s: 'La siento entre los dedos', pic: SV.hebra(2.6) },
        { v: 'grueso', l: 'Gruesa', s: 'Con peso propio', pic: SV.hebra(5) },
        { v: 'nose', l: 'No estoy segura', pic: SV.nose }
      ] },
    { id: 'cuero', sec: 'TU CUERO CABELLUDO', multi: false, cols: 2,
      title: 'Al día siguiente de lavarlo, ¿cómo sientes tu cuero cabelludo?', help: '',
      options: [
        { v: 'graso', l: 'Ya con grasa', s: 'Necesita lavado casi a diario' },
        { v: 'equilibrado', l: 'Equilibrado', s: 'Aguanta dos o tres días' },
        { v: 'seco', l: 'Seco o tirante' },
        { v: 'varia', l: 'Variable', s: 'Cambia de un día a otro' }
      ] },
    { id: 'prio', sec: 'TUS PRIORIDADES', multi: true, max: 3, cols: 2, shuffle: true,
      title: '¿Qué te gustaría trabajar primero?', help: 'Elige hasta tres.',
      options: [
        { v: 'enredo', l: 'Desenredado fácil' },
        { v: 'quiebre', l: 'Menos pelo en el cepillo', s: 'Que se quiebre menos' },
        { v: 'cuerpo', l: 'Cuerpo y volumen' },
        { v: 'pelitos', l: 'Pelitos cortos que no se levanten', s: 'En la raíz y la coronilla' },
        { v: 'canas', l: 'Canas más suaves', s: 'Con o sin tinte' },
        { v: 'ondas', hot: true, l: 'Realzar mi textura natural', s: 'Con su forma, sin frizz y sin fijar' },
        { v: 'frizz', hot: true, l: 'Control del frizz' },
        { v: 'suave', hot: true, l: 'Hidratación y suavidad' },
        { v: 'brillo', hot: true, l: 'Brillo' },
        { v: 'color', hot: true, l: 'Color protegido, que dure más', showIf: function (a) { return has(a, 'tinteTodo') || has(a, 'tinteRaices') || has(a, 'mechas'); } },
        { v: 'prevenir', l: 'Prevención', s: 'Cuidarlo antes de que cambie más', solo: true }
      ] },
    { id: 'futuros', sec: 'TU PELO', multi: true, cols: 2,
      title: '¿Algo de esto te está pasando también?', help: 'Marca lo que reconozcas. No cambia tu recomendación actual; nos ayuda a conocer otras necesidades.',
      options: [
        { v: 'cejas', l: 'Mis pestañas y cejas están más ralas', s: 'Se ven más cortas, más finas o con menos pelo que antes' },
        { v: 'densidad', l: 'Veo menos densidad en la coronilla o las entradas', s: 'Se ve más el cuero cabelludo al peinarme o con cierta luz' },
        { v: 'puntasDia', l: 'Al final del día mis puntas se ven secas', s: 'Y no quiero lavarme otra vez para que vuelva el brillo' },
        { v: 'cueroPica', l: 'Me pica o se me descama el cuero', s: 'Molestia, tirantez o escamas cada cierto tiempo' },
        { v: 'nada', l: 'Nada de esto por ahora', solo: true }
      ] },
    { id: 'edad', sec: 'TU TRIBU', multi: false, cols: 4, optional: true,
      title: '¿En qué rango de edad estás?', help: 'Opcional. Solo nos ayuda a entender mejor a nuestra tribu.',
      options: [
        { v: 'm35', l: 'Menos de 35' }, { v: '35', l: '35 a 39' }, { v: '40', l: '40 a 44' }, { v: '45', l: '45 a 49' },
        { v: '50', l: '50 a 54' }, { v: '55', l: '55 a 59' }, { v: '60', l: '60 a 64' }, { v: '65', l: '65 o más' }
      ] }
  ];

  /* ── Ayudantes ── */
  function inArr(arr, v) { return (arr || []).indexOf(v) >= 0; }
  function has(a, v) { return inArr(a.tratamientos, v); }
  function sig(a, v) { return inArr(a.signos, v); }
  function pri(a, v) { return inArr(a.prio, v); }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function lista(arr) { return arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' y ' + arr[arr.length - 1]; }

  /* ══ MOTOR · puntos por eje, umbral 6 (V25 sin cambios) ══ */
  function motor(a) {
    var m = 0;                                       // REPARACIÓN PROFUNDA → La Mascarilla
    if (pri(a, 'quiebre') || pri(a, 'suave')) m += 6; // decisiva: lo que ella pidió
    if (sig(a, 'quiebre')) m += 6;                    // decisiva
    if (has(a, 'mechas')) m += 6;                     // decisiva
    if (a.porosidad === 'alta') m += 6;               // decisiva
    if (sig(a, 'secoTodo')) m += 3;
    if (sig(a, 'puntas')) m += 1;
    if (sig(a, 'opaco')) m += 1;
    if (has(a, 'tinteTodo')) m += 2;
    if (has(a, 'tinteRaices')) m += 1;
    if (has(a, 'keratina')) m += 2;
    if (sig(a, 'canas')) m += 1;
    if (a.tipo === 'crespo') m += 3; else if (a.tipo === 'rizado') m += 1;

    var c = 0;                                       // PROTECCIÓN DIARIA → La Crema
    if (['frizz', 'pelitos', 'ondas', 'enredo', 'brillo', 'color', 'canas'].some(function (x) { return pri(a, x); })) c += 6;
    if (sig(a, 'frizz')) c += 6;
    if (a.calor === 'diario') c += 4; else if (a.calor === 'plancha') c += 2;
    if (sig(a, 'enredo')) c += 2;
    if (sig(a, 'textura')) c += 2;
    if (sig(a, 'cuerpo')) c += 1;
    if (a.porosidad === 'alta') c += 1;
    if (a.grosor === 'fino') c += 1;
    if (a.tipo === 'rizado' || a.tipo === 'crespo') c += 2;
    return { m: m, c: c, needMask: m >= 6, needCrema: c >= 6 };
  }

  /* Solo identificadores internos; no se muestran en pantalla. */
  var P = ['shampoo', 'acond', 'masc', 'crema'];
  function rutina(a) {
    var r = motor(a), out = [P[0], P[1]];
    if (r.needMask) out.push(P[2]);
    if (r.needCrema) out.push(P[3]);
    return out;
  }

  /* ── Pills «Lo que estás notando» ── */
  var SIG = { frizz: 'frizz / pelitos que se levantan', secoTodo: 'sequedad', puntas: 'puntas secas', opaco: 'menos brillo', cuerpo: 'menos cuerpo',
    quiebre: 'quiebre', enredo: 'enredo', textura: 'cambio de textura', canas: 'canas' };
  function senales(a) {
    var x = (a.signos || []).map(function (v) { return SIG[v]; }).filter(Boolean);
    if (a.porosidad === 'alta') x.push('muy reseco sin acondicionador');
    x = x.filter(function (s, i) { return x.indexOf(s) === i; });
    return x.length ? x : ['está bastante bien'];
  }

  /* ══ V25 · resultado dinámico ══ El orden de selección de P8 no afecta los textos. */
  var WHY = [
    { id: 'reparacion', title: 'La fibra puede necesitar cuidado reparador', when: function (a) { return sig(a, 'quiebre') || has(a, 'mechas') || has(a, 'tinteTodo') || has(a, 'keratina'); }, text: 'La decoloración, algunos tratamientos y las hebras partidas pueden ser señales de mayor desgaste. Un cuidado reparador puede ayudar a fortalecer la fibra y reducir el quiebre.' },
    { id: 'hidratacion', title: 'La sequedad puede dificultar el peinado', when: function (a) { return a.porosidad === 'alta' || ['secoTodo', 'puntas', 'enredo'].some(function (x) { return sig(a, x); }) || pri(a, 'suave'); }, text: 'Cuando el pelo se siente seco o áspero, puede enredarse más. Conviene priorizar acondicionamiento, suavidad y manejabilidad.' },
    { id: 'frizz', title: 'El frizz puede hacerse más visible', when: function (a) { return sig(a, 'frizz') || pri(a, 'frizz') || pri(a, 'pelitos'); }, text: 'La textura, la fricción y las condiciones de humedad pueden influir en el frizz. El cuidado de la superficie de la fibra ayuda a mejorar su manejabilidad.' },
    { id: 'proteccion', title: 'Tus hábitos pueden sumar desgaste', when: function (a) { return a.calor === 'diario' || a.calor === 'plancha'; }, text: 'El uso repetido de herramientas de calor puede contribuir al desgaste de la fibra. Conviene acompañarlo de cuidados que ayuden a proteger el pelo.' },
    { id: 'textura', title: 'Tu textura natural necesita un cuidado adecuado', when: function (a) { return sig(a, 'textura') || pri(a, 'ondas'); }, text: 'Cuando la forma del pelo cambia o quieres realzar tus ondas o rizos, conviene priorizar suavidad, movimiento y manejabilidad.' },
    { id: 'brillo', title: 'La superficie influye en cómo se ve el brillo', when: function (a) { return sig(a, 'opaco') || pri(a, 'brillo'); }, text: 'El brillo visible depende, entre otros factores, de cómo refleja la luz la superficie del pelo. El acondicionamiento puede mejorar su apariencia.' },
    { id: 'volumen', title: 'La ligereza puede ser importante', when: function (a) { return sig(a, 'cuerpo') || pri(a, 'cuerpo'); }, text: 'Si notas menos cuerpo, conviene adaptar el acondicionamiento al grosor de tu hebra para evitar una sensación pesada.' },
    { id: 'canas', title: 'Las canas pueden sentirse diferentes', when: function (a) { return sig(a, 'canas') || pri(a, 'canas'); }, text: 'Las canas pueden presentar una textura distinta. Si lo notas, priorizar suavidad y facilidad de peinado puede ayudarte a cuidarlas.' },
    { id: 'color', title: 'El color también influye en tu cuidado', when: function (a) { return pri(a, 'color'); }, text: 'Si llevas coloración, conviene tener en cuenta los procesos de tinte y tus hábitos de lavado al elegir el cuidado.' },
    { id: 'mantenimiento', title: 'Mantener el buen estado también es cuidar', when: function (a) { return sig(a, 'bien') || pri(a, 'prevenir'); }, text: 'Si hoy sientes tu pelo bastante bien, puedes priorizar un cuidado constante que se adapte a su textura y a tus hábitos.' }
  ];
  function ranked(a) {
    var w = { reparacion: 0, hidratacion: 0, frizz: 0, proteccion: 0, textura: 0, brillo: 0, volumen: 0, canas: 0, color: 0, mantenimiento: 0 };
    if (has(a, 'mechas')) w.reparacion += 6;
    if (has(a, 'tinteTodo')) w.reparacion += 3;
    if (has(a, 'keratina')) w.reparacion += 3;
    if (has(a, 'tinteRaices')) w.reparacion += 1;
    if (sig(a, 'quiebre')) w.reparacion += 6;
    if (a.porosidad === 'alta') w.hidratacion += 6;
    if (sig(a, 'secoTodo')) w.hidratacion += 5;
    if (sig(a, 'puntas')) w.hidratacion += 3;
    if (sig(a, 'enredo')) w.hidratacion += 2;
    if (pri(a, 'suave')) w.hidratacion += 6;
    if (sig(a, 'frizz')) w.frizz += 6;
    if (pri(a, 'frizz')) w.frizz += 6;
    if (pri(a, 'pelitos')) w.frizz += 5;
    if (a.calor === 'diario') w.proteccion += 6;
    if (a.calor === 'plancha') w.proteccion += 4;
    if (sig(a, 'textura')) w.textura += 4;
    if (pri(a, 'ondas')) w.textura += 6;
    if (sig(a, 'opaco')) w.brillo += 4;
    if (pri(a, 'brillo')) w.brillo += 6;
    if (sig(a, 'cuerpo')) w.volumen += 4;
    if (pri(a, 'cuerpo')) w.volumen += 6;
    if (sig(a, 'canas')) w.canas += 3;
    if (pri(a, 'canas')) w.canas += 6;
    if (pri(a, 'color')) w.color += 6;
    if (sig(a, 'bien')) w.mantenimiento += 6;
    if (pri(a, 'prevenir')) w.mantenimiento += 6;
    // P8 «quiebre» no prueba caída desde la raíz; no activa reparación en este ranking.
    return WHY.map(function (r, i) { return { id: r.id, title: r.title, text: r.text, score: w[r.id], i: i, on: r.when(a) }; })
      .filter(function (r) { return r.on; })
      .sort(function (x, y) { return (y.score - x.score) || (x.i - y.i); });
  }
  function nSignos(a) { return (a.signos || []).filter(function (x) { return x !== 'bien'; }).length; }
  function why(a) { return ranked(a).slice(0, Math.min(3, Math.max(1, nSignos(a) || 1))); }
  var LABELS = { reparacion: 'reparación', hidratacion: 'hidratación', frizz: 'control del frizz', proteccion: 'protección', textura: 'textura natural', brillo: 'brillo', volumen: 'cuerpo y ligereza', canas: 'suavidad para las canas', color: 'cuidado del color', mantenimiento: 'cuidado y mantenimiento' };
  function headline(a) {
    var items = why(a).map(function (r) { return LABELS[r.id]; });
    if (!items.length) return 'Cuidado y mantenimiento.';
    return items.map(function (x, i) { return i ? x : cap(x); }).join(', ') + '.';
  }
  function parrafo(a) {
    if (sig(a, 'bien')) return 'Nos cuentas que tu pelo se siente bastante bien. Según tus hábitos y prioridades, identificamos cómo acompañar su cuidado.';
    if (nSignos(a) >= 3) return 'Nos cuentas que tu pelo está mostrando varios cambios a la vez. Por eso priorizamos las necesidades que más destacan al cruzar tus señales, tus hábitos y lo que quieres mejorar.';
    return 'Según lo que nos cuentas sobre tu pelo, tus hábitos y lo que quieres mejorar, estas son las necesidades que conviene priorizar.';
  }
  function showBreakage(a) { return pri(a, 'quiebre') || sig(a, 'quiebre'); }
  var BREAKAGE = '¿Ves más pelo en el cepillo? Puede tratarse de hebras que se quiebran o de pelo que se desprende desde la raíz; no son lo mismo. El cuidado reparador puede ayudar con el quiebre de la fibra, pero no sustituye una evaluación de la caída desde la raíz. Si la caída es abundante, repentina o persistente, consulta con un dermatólogo.';

  /* ══ TAGS ══ */
  function canas(a) { return sig(a, 'canas') ? (has(a, 'tinteRaices') || has(a, 'tinteTodo') ? 'canas_cubre' : 'canas_natural') : ''; }
  function segmento(a) {
    var t = [], r = motor(a);
    if (r.needMask) t.push('eje_reparacion');
    if (r.needCrema) t.push('eje_proteccion');
    (a.signos || []).forEach(function (s) { t.push('signo_' + s); });
    (a.tratamientos || []).forEach(function (s) { t.push('quim_' + s); });
    if (sig(a, 'canas')) t.push(canas(a));
    if (a.porosidad) t.push('poros_' + a.porosidad);
    (a.futuros || []).forEach(function (f) { if (f !== 'nada') t.push('futuro_' + f); });
    if (a.calor) t.push('calor_' + a.calor);
    if (a.tipo) t.push('tipo_' + a.tipo);
    if (a.grosor && a.grosor !== 'nose') t.push('grosor_' + a.grosor);
    if (a.cuero) t.push('cuero_' + a.cuero);
    (a.prio || []).forEach(function (p) { t.push('prio_' + p); });
    if (pri(a, 'prevenir') || sig(a, 'bien')) t.push('buyer_A');
    if (a.edad) t.push('edad_' + a.edad);
    return t;
  }

  /* Propiedades quiz_* del perfil (mismas claves que V25). */
  function properties(a, opts) {
    opts = opts || {};
    var r = motor(a);
    var tags = segmento(a).concat(['waitlist', 'socia_fundadora']);
    if (opts.panel) tags.push('panel_si');
    // Textos del resultado tal como se ven en pantalla, para el correo de Klaviyo.
    var w = why(a), texts = {};
    for (var i = 0; i < 3; i++) {
      texts['quiz_porque_' + (i + 1) + '_titulo'] = w[i] ? w[i].title : '';
      texts['quiz_porque_' + (i + 1) + '_texto'] = w[i] ? w[i].text : '';
    }
    texts.quiz_resultado_parrafo = parrafo(a);
    texts.quiz_notando = senales(a).join(' · ');
    texts.quiz_nota_quiebre = showBreakage(a);
    return Object.assign(texts, {
      quiz_version: VERSION, quiz_fecha: opts.fecha || new Date().toISOString(),
      quiz_senales: a.signos || [], quiz_porosidad: a.porosidad || '', quiz_tratamientos: a.tratamientos || [],
      quiz_calor: a.calor || '', quiz_tipo: a.tipo || '', quiz_grosor: a.grosor || '', quiz_cuero: a.cuero || '',
      quiz_prioridades: a.prio || [], quiz_futuros: a.futuros || [], quiz_edad: a.edad || '', quiz_canas: canas(a),
      quiz_eje: [r.needMask ? 'eje_reparacion' : null, r.needCrema ? 'eje_proteccion' : null].filter(Boolean),
      quiz_buyer: (pri(a, 'prevenir') || sig(a, 'bien')) ? 'buyer_A' : '', quiz_recomendacion: rutina(a),
      quiz_panel: !!opts.panel, quiz_tags: tags, quiz_resultado_titular: headline(a),
      quiz_resultado_explicaciones: w.map(function (x) { return x.id; }), quiz_signos_multiples: nSignos(a) >= 3
    });
  }

  /* Selección: «solo» es excluyente, «max» limita (igual que pick() de V25). */
  function pick(q, current, v) {
    if (!q.multi) return v;
    var arr = Array.isArray(current) ? current.slice() : [];
    var opt = q.options.filter(function (o) { return o.v === v; })[0];
    var i = arr.indexOf(v);
    if (i >= 0) { arr.splice(i, 1); return arr; }
    if (opt && opt.solo) return [v];
    arr = arr.filter(function (x) { var o = q.options.filter(function (oo) { return oo.v === x; })[0]; return !(o && o.solo); });
    if (q.max && arr.length >= q.max) return arr;
    return arr.concat(v);
  }

  /* Orden barajado por sesión: las más marcadas (hot) nunca abren la lista; excluyentes al final. */
  function shuffle(arr) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
  function makeOrder(q) {
    var frias = shuffle(q.options.filter(function (o) { return !o.solo && !o.hot; }).map(function (o) { return o.v; }));
    var calientes = q.options.filter(function (o) { return !o.solo && o.hot; }).map(function (o) { return o.v; });
    return frias.slice(0, 2).concat(shuffle(frias.slice(2).concat(calientes)));
  }
  function visibleOptions(q, a, order) {
    var opts = q.options.filter(function (o) { return !o.showIf || o.showIf(a); });
    if (!q.shuffle || !order) return opts;
    var pos = function (v) { var i = order.indexOf(v); return i < 0 ? 999 : i; };
    return opts.slice().sort(function (x, y) { return ((x.solo ? 1 : 0) - (y.solo ? 1 : 0)) || (pos(x.v) - pos(y.v)); });
  }
  /* Si cambia P3 y «color» deja de mostrarse, se quita de P8. */
  function clean(a) {
    var p = QS[7];
    if (Array.isArray(a.prio)) a.prio = a.prio.filter(function (v) { var o = p.options.filter(function (x) { return x.v === v; })[0]; return o && (!o.showIf || o.showIf(a)); });
    return a;
  }

  var SIM_CASES = [
    { name: '01 · Mechas y pelo fino', a: { signos: ['puntas', 'opaco'], porosidad: 'media', tratamientos: ['mechas'], calor: 'natural', tipo: 'suaves', grosor: 'fino', cuero: 'equilibrado', prio: ['suave', 'brillo'], futuros: ['nada'], edad: '45' } },
    { name: '02 · Mechas, alisado, calor y frizz', a: { signos: ['frizz', 'secoTodo', 'enredo', 'opaco'], porosidad: 'alta', tratamientos: ['mechas', 'keratina'], calor: 'diario', tipo: 'suaves', grosor: 'medio', cuero: 'equilibrado', prio: ['brillo', 'frizz', 'suave'], futuros: ['nada'], edad: '50' } },
    { name: '03 · Rizos, tinte y sequedad', a: { signos: ['secoTodo', 'frizz', 'puntas'], porosidad: 'alta', tratamientos: ['mechas', 'tinteTodo'], calor: 'natural', tipo: 'rizado', grosor: 'medio', cuero: 'equilibrado', prio: ['suave', 'ondas'], futuros: ['nada'], edad: '55' } },
    { name: '04 · Sin procesos, algo seco', a: { signos: ['puntas'], porosidad: 'media', tratamientos: ['ninguno'], calor: 'natural', tipo: 'lacio', grosor: 'medio', cuero: 'equilibrado', prio: ['suave'], futuros: ['nada'], edad: '40' } },
    { name: '05 · Alisado y frizz, buen estado', a: { signos: ['bien'], porosidad: 'baja', tratamientos: ['keratina'], calor: 'secadora', tipo: 'suaves', grosor: 'medio', cuero: 'equilibrado', prio: ['frizz'], futuros: ['nada'], edad: '35' } },
    { name: '06 · Mechas y pelo en cepillo', a: { signos: ['enredo', 'puntas', 'quiebre'], porosidad: 'media', tratamientos: ['mechas'], calor: 'plancha', tipo: 'suaves', grosor: 'fino', cuero: 'equilibrado', prio: ['quiebre', 'suave'], futuros: ['nada'], edad: '50' } },
    { name: '07 · Diez signos', a: { signos: ['enredo', 'quiebre', 'puntas', 'cuerpo', 'opaco', 'secoTodo', 'textura', 'canas', 'frizz'], porosidad: 'alta', tratamientos: ['mechas', 'tinteTodo'], calor: 'diario', tipo: 'rizado', grosor: 'fino', cuero: 'varia', prio: ['frizz', 'suave', 'brillo'], futuros: ['nada'], edad: '55' } },
    { name: '08 · Prevención sin señales', a: { signos: ['bien'], porosidad: 'baja', tratamientos: ['ninguno'], calor: 'natural', tipo: 'lacio', grosor: 'grueso', cuero: 'equilibrado', prio: ['prevenir'], futuros: ['nada'], edad: '45' } }
  ];

  var QPEngine = {
    VERSION: VERSION, QS: QS, SIM_CASES: SIM_CASES, BREAKAGE: BREAKAGE,
    motor: motor, rutina: rutina, senales: senales, ranked: ranked, why: why, headline: headline, parrafo: parrafo,
    showBreakage: showBreakage, segmento: segmento, properties: properties, pick: pick, clean: clean,
    makeOrder: makeOrder, visibleOptions: visibleOptions
  };
  root.QPEngine = QPEngine;
  if (typeof module !== 'undefined' && module.exports) module.exports = QPEngine;
  if (typeof document === 'undefined') return;

  /* ------------------------------------------------------------------------
     KLAVIYO · API pública (client). Nunca usar la clave privada en el tema.
     ------------------------------------------------------------------------ */
  function klaviyoPost(kl, path, data) {
    return fetch('https://a.klaviyo.com/client/' + path + '/?company_id=' + encodeURIComponent(kl.publicKey), {
      method: 'POST',
      headers: { revision: kl.revision || '2025-10-15', 'content-type': 'application/vnd.api+json', accept: 'application/vnd.api+json' },
      body: JSON.stringify({ data: data })
    }).then(function (res) { if (!res.ok) throw new Error('Klaviyo ' + path + ' ' + res.status); return res; });
  }
  function sendToKlaviyo(kl, p) {
    var profile = { email: p.email, first_name: p.nombre, properties: p.properties };
    // 1) Perfil + propiedades del quiz (consentimiento de datos, obligatorio).
    return klaviyoPost(kl, 'profiles', { type: 'profile', attributes: profile }).then(function () {
      // 2) Suscripción de marketing por correo SOLO si la marcó. Con doble opt-in, Klaviyo
      //    envía el correo de confirmación: esto no confirma aún la pertenencia a la lista.
      if (!p.consent.correo) return null;
      return klaviyoPost(kl, 'subscriptions', {
        type: 'subscription',
        attributes: {
          custom_source: 'TRRIBU quiz prelanzamiento',
          profile: { data: { type: 'profile', attributes: { email: p.email, subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } } } } }
        },
        relationships: { list: { data: { type: 'list', id: kl.listId } } }
      });
    }).then(function () {
      // 3) Evento para disparar flujos. Si falla, la inscripción ya quedó guardada.
      return klaviyoPost(kl, 'events', {
        type: 'event',
        attributes: {
          properties: p.properties,
          metric: { data: { type: 'metric', attributes: { name: 'Quiz completado' } } },
          profile: { data: { type: 'profile', attributes: { email: p.email } } }
        }
      }).catch(function () {});
    });
  }

  /* ------------------------------------------------------------------------
     INTERFAZ
     ------------------------------------------------------------------------ */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function init(rootEl) {
    if (rootEl._qp) return;
    rootEl._qp = true;
    var $ = function (s) { return rootEl.querySelector(s); };
    var copy = {};
    try { copy = JSON.parse($('[data-qp-copy]').textContent); } catch (e) {}
    var step = 0, answers = {}, order = {};
    var simulate = /[?&]simulador=1\b/.test(window.location.search) && rootEl.hasAttribute('data-qp-sim');

    function show(stage) {
      rootEl.querySelectorAll('[data-qp-stage]').forEach(function (s) { s.hidden = s.getAttribute('data-qp-stage') !== stage; });
      window.scrollTo({ top: rootEl.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth' });
    }
    function bar(p) {
      $('[data-qp-fill]').style.width = p + '%';
      $('[data-qp-bar]').setAttribute('aria-valuenow', p);
    }

    function render() {
      var q = QS[step], a = answers[q.id];
      if (q.shuffle && !order[q.id]) order[q.id] = makeOrder(q);
      bar(Math.round(step / QS.length * 100));
      $('[data-qp-step]').textContent = (step + 1) + ' / ' + QS.length;
      $('[data-qp-sec]').textContent = q.sec || '';
      $('[data-qp-title]').textContent = q.title;
      $('[data-qp-help]').textContent = q.help || '';
      $('[data-qp-hint]').textContent = q.multi ? (q.max ? (copy.max_hint || 'Hasta {n}').replace('{n}', q.max) : (copy.multi_hint || 'Puedes elegir varias')) : '';
      $('[data-qp-next]').textContent = step === QS.length - 1 ? (copy.next_last || 'VER MI RESULTADO') : (copy.next || 'CONTINUAR');
      $('[data-qp-skip]').hidden = !q.optional;
      var box = $('[data-qp-opts]');
      box.className = 'qp__opts qp__opts--' + q.cols + (q.img ? ' qp__opts--img' : '');
      box.setAttribute('role', q.multi ? 'group' : 'radiogroup');
      box.innerHTML = visibleOptions(q, answers, order[q.id]).map(function (o) {
        var on = q.multi ? (Array.isArray(a) && a.indexOf(o.v) >= 0) : a === o.v;
        return '<button type="button" class="qp__opt' + (on ? ' is-on' : '') + (q.img ? ' qp__opt--img' : '') + (q.multi ? '' : ' qp__opt--radio') + '"'
          + ' role="' + (q.multi ? 'checkbox' : 'radio') + '" aria-checked="' + on + '" data-v="' + esc(o.v) + '">'
          + (q.img ? '<span class="qp__pic">' + o.pic + '</span>' : '<span class="qp__mark" aria-hidden="true">' + (on ? '✓' : '') + '</span>')
          + '<span class="qp__otxt"><span class="qp__olabel">' + esc(o.l) + '</span>' + (o.s ? '<span class="qp__osub">' + esc(o.s) + '</span>' : '') + '</span></button>';
      }).join('');
      var ok = q.multi ? !!(a && a.length) : !!a;
      var next = $('[data-qp-next]');
      next.disabled = !ok;
    }

    box().addEventListener('click', function (e) {
      var b = e.target.closest('.qp__opt');
      if (!b) return;
      var q = QS[step];
      answers[q.id] = pick(q, answers[q.id], b.getAttribute('data-v'));
      clean(answers);
      render();
      var again = rootEl.querySelector('.qp__opt[data-v="' + b.getAttribute('data-v') + '"]');
      if (again) again.focus();
    });
    function box() { return $('[data-qp-opts]'); }

    function advance() { if (step >= QS.length - 1) { result(); return; } step++; render(); $('[data-qp-title]').focus({ preventScroll: true }); }
    $('[data-qp-next]').addEventListener('click', function () {
      var q = QS[step], a = answers[q.id];
      if (q.multi ? !(a && a.length) : !a) return;
      advance();
    });
    $('[data-qp-skip]').addEventListener('click', function () { delete answers[QS[step].id]; advance(); });
    $('[data-qp-back]').addEventListener('click', function () {
      if (step === 0) { show('intro'); bar(0); return; }
      step--; render();
    });
    $('[data-qp-start]').addEventListener('click', function () { step = 0; show('quiz'); render(); $('[data-qp-title]').focus({ preventScroll: true }); });

    function result() {
      $('[data-qp-r-sub]').textContent = headline(answers);
      $('[data-qp-r-par]').textContent = parrafo(answers);
      $('[data-qp-r-why]').innerHTML = why(answers).map(function (r, i) {
        return '<div class="qp__why-item"><strong>' + (i + 1) + '. ' + esc(r.title) + '</strong><p>' + esc(r.text) + '</p></div>';
      }).join('');
      var br = $('[data-qp-r-breakage]');
      br.hidden = !showBreakage(answers);
      $('[data-qp-r-signals]').innerHTML = senales(answers).map(function (x) { return '<li class="qp__pill">' + esc(x) + '</li>'; }).join('');
      show('result'); bar(100);
      $('[data-qp-r-title]').focus({ preventScroll: true });
    }

    $('[data-qp-to-list]').addEventListener('click', function () { $('[data-qp-capture]').scrollIntoView({ behavior: 'smooth' }); });

    var form = $('[data-qp-form]');
    var msg = $('[data-qp-msg]');
    function say(t, kind) { msg.textContent = t; msg.hidden = !t; msg.className = 'qp__msg' + (kind ? ' is-' + kind : ''); }
    function resetForm() { form.reset(); Array.prototype.forEach.call(form.elements, function (el) { el.disabled = false; }); say(''); }

    $('[data-qp-restart]').addEventListener('click', function () {
      step = 0; answers = {}; order = {}; resetForm();
      show('intro'); bar(0);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements;
      var nombre = f.nombre.value.trim();
      var mail = f.email.value.trim();
      var wa = f.whatsapp.value.replace(/\s+/g, '');
      if (!nombre) return say(copy.err_name || 'Cuéntanos tu nombre.', 'err');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) return say(copy.err_email || 'Revisa el correo. Parece que falta algo.', 'err');
      if (wa && !/^9\d{8}$/.test(wa)) return say(copy.err_wa || 'El WhatsApp debe tener 9 dígitos y empezar en 9.', 'err');
      if (!f.c_datos.checked) return say(copy.err_consent || 'Necesitamos tu permiso para guardar tus datos.', 'err');
      if (f.c_whatsapp.checked && !wa) return say(copy.err_wa_needed || 'Para escribirte por WhatsApp necesitamos tu número.', 'err');

      var consent = { datos: true, correo: f.c_correo.checked, whatsapp: f.c_whatsapp.checked };
      var props = properties(answers, { panel: f.c_panel.checked });
      // WhatsApp: solo preferencia; no es una suscripción a SMS/WhatsApp en Klaviyo.
      props.quiz_whatsapp = wa ? '+51' + wa : '';
      props.quiz_consent_correo = consent.correo;
      props.quiz_consent_whatsapp = consent.whatsapp;
      var payload = { nombre: nombre, email: mail, consent: consent, properties: props };
      window.__TRRIBU_LAST_PAYLOAD__ = payload;

      var cfg = (window.TRRIBU && TRRIBU.config) || window.TRRIBU_CONFIG || {};
      var kl = Object.assign({}, cfg.klaviyo || {});
      if (rootEl.getAttribute('data-qp-list')) kl.listId = rootEl.getAttribute('data-qp-list');

      var btn = form.querySelector('button[type="submit"]');
      if (simulate || !kl.publicKey || !kl.listId) {
        if (window.console) console.info('[TRRIBÚ · quiz] Simulación, no se envió a Klaviyo:', payload);
        return say(copy.mock || 'Simulación: los datos NO se enviaron a Klaviyo.', 'ok');
      }
      btn.disabled = true;
      say(copy.saving || 'Estamos guardando tu inscripción…');
      sendToKlaviyo(kl, payload).then(function () {
        Array.prototype.forEach.call(form.elements, function (el) { el.disabled = true; });
        say(copy.thanks || 'Tu solicitud fue recibida. Te escribiremos cuando tengamos novedades.', 'ok');
      }).catch(function () {
        btn.disabled = false;
        say(copy.error || 'No pudimos guardar tu inscripción. Intenta nuevamente.', 'err');
      });
    });

    /* Simulador interno: solo con ?simulador=1 y si la sección lo permite. */
    var sim = $('[data-qp-sim]');
    if (simulate && sim) {
      sim.hidden = false;
      var sel = sim.querySelector('select');
      sel.innerHTML = SIM_CASES.map(function (c, i) { return '<option value="' + i + '">' + esc(c.name) + '</option>'; }).join('');
      sim.querySelector('[data-qp-sim-run]').addEventListener('click', function () {
        answers = JSON.parse(JSON.stringify(SIM_CASES[Number(sel.value)].a));
        result();
        sim.querySelector('pre').textContent = JSON.stringify({
          puntos: motor(answers), productos: rutina(answers), titular: headline(answers),
          explicaciones: why(answers).map(function (x) { return { id: x.id, puntos: x.score }; }), tags: segmento(answers)
        }, null, 2);
      });
      sim.querySelector('[data-qp-sim-close]').addEventListener('click', function () { sim.hidden = true; });
    }

    rootEl.querySelectorAll('[data-qp-stage]').forEach(function (s) { s.hidden = s.getAttribute('data-qp-stage') !== 'intro'; });
  }

  function boot() { document.querySelectorAll('[data-qp]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  document.addEventListener('shopify:section:load', function (e) {
    var el = e.target.querySelector('[data-qp]');
    if (el) init(el);
  });
})(typeof window !== 'undefined' ? window : globalThis);
