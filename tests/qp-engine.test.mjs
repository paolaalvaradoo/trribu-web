// Pruebas del motor del quiz de prelanzamiento (assets/qp.js).
// Ejecutar: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const E = createRequire(import.meta.url)('../assets/qp.js');

const base = { signos: ['puntas'], porosidad: 'media', tratamientos: ['ninguno'], calor: 'natural', tipo: 'lacio', grosor: 'medio', cuero: 'equilibrado', prio: ['suave'], futuros: ['nada'] };
const opt = (q, v) => E.QS[q].options.some(o => o.v === v);

// Mismas pruebas que el paquete V25
test('V25 mantiene diez preguntas', () => assert.equal(E.QS.length, 10));
test('P8 sin opción reparación y con pelitos', () => { assert.equal(opt(7, 'reparacion'), false); assert.equal(opt(7, 'pelitos'), true); });
test('No existe me pasa de todo', () => assert.equal(opt(0, 'todo'), false));
test('P1 3+ signos dispara mensaje múltiple', () => assert.match(E.parrafo({ ...base, signos: ['puntas', 'opaco', 'frizz'] }), /varios cambios a la vez/));
test('P1 2 signos no dispara mensaje múltiple', () => assert.doesNotMatch(E.parrafo({ ...base, signos: ['puntas', 'opaco'] }), /varios cambios a la vez/));
test('Mechas activa La Mascarilla', () => assert.equal(E.motor({ ...base, tratamientos: ['mechas'], prio: ['prevenir'] }).needMask, true));
test('Frizz en P8 activa La Crema', () => assert.equal(E.motor({ ...base, prio: ['frizz'] }).needCrema, true));
test('P8 selección en orden distinto no cambia titular', () => {
  const a = { ...base, prio: ['frizz', 'brillo', 'suave'] }, b = { ...a, prio: ['suave', 'brillo', 'frizz'] };
  assert.equal(E.headline(a), E.headline(b));
});
test('Máximo tres explicaciones', () => {
  const a = { ...base, signos: ['quiebre', 'puntas', 'frizz', 'opaco', 'cuerpo', 'textura'], tratamientos: ['mechas'], calor: 'diario', prio: ['frizz', 'suave', 'brillo'] };
  assert.equal(E.why(a).length, 3);
});
test('Pelo en cepillo muestra nota educativa', () => { assert.equal(E.showBreakage({ ...base, prio: ['quiebre'] }), true); assert.match(E.BREAKAGE, /dermatólogo/); });
test('Sin señal de caída no muestra nota', () => assert.equal(E.showBreakage(base), false));
test('Sin tratamientos y buen estado no recomienda máscara', () => assert.equal(E.motor({ ...base, signos: ['bien'], porosidad: 'baja', prio: ['prevenir'] }).needMask, false));

// Selección y propiedades para Klaviyo
test('Opción excluyente reemplaza al resto', () => assert.deepEqual(E.pick(E.QS[0], ['puntas', 'frizz'], 'bien'), ['bien']));
test('P8 no acepta más de tres', () => assert.deepEqual(E.pick(E.QS[7], ['frizz', 'brillo', 'suave'], 'cuerpo'), ['frizz', 'brillo', 'suave']));
test('«Color» se quita de P8 si ya no lleva tinte', () => assert.deepEqual(E.clean({ tratamientos: ['ninguno'], prio: ['color', 'brillo'] }).prio, ['brillo']));
test('Barajado: las «hot» nunca abren la lista', () => {
  for (let i = 0; i < 200; i++) {
    const order = E.makeOrder(E.QS[0]);
    const first = E.visibleOptions(E.QS[0], {}, order).slice(0, 2);
    assert.ok(first.every(o => !o.hot));
    assert.equal(E.visibleOptions(E.QS[0], {}, order).at(-1).v, 'bien');
  }
});
test('Propiedades quiz_* completas', () => {
  const p = E.properties({ ...base, tratamientos: ['mechas'], signos: ['canas'] }, { panel: true, fecha: 'X' });
  assert.equal(p.quiz_version, 'prelanzamiento_v25');
  assert.deepEqual(p.quiz_recomendacion, ['shampoo', 'acond', 'masc']);
  assert.equal(p.quiz_canas, 'canas_natural');
  assert.ok(p.quiz_tags.includes('waitlist') && p.quiz_tags.includes('panel_si') && p.quiz_tags.includes('eje_reparacion'));
});

// Los ocho casos del simulador: resultados fijados para detectar cambios no aprobados.
// Idénticos al motor V25 original, salvo la mayúscula de «reparación» a mitad de frase.
const ESPERADO = {
  '01': ['Brillo, hidratación.', 'shampoo,acond,masc,crema'],
  '02': ['Hidratación, control del frizz, brillo.', 'shampoo,acond,masc,crema'],
  '03': ['Hidratación, reparación, control del frizz.', 'shampoo,acond,masc,crema'],
  '04': ['Hidratación.', 'shampoo,acond,masc'],
  '05': ['Control del frizz.', 'shampoo,acond,crema'],
  '06': ['Reparación, hidratación, protección.', 'shampoo,acond,masc'],
  '07': ['Hidratación, reparación, control del frizz.', 'shampoo,acond,masc,crema'],
  '08': ['Cuidado y mantenimiento.', 'shampoo,acond']
};
for (const c of E.SIM_CASES) {
  const [titular, rutina] = ESPERADO[c.name.slice(0, 2)];
  test('Simulador ' + c.name, () => {
    assert.equal(E.headline(c.a), titular);
    assert.equal(E.rutina(c.a).join(','), rutina);
  });
}

test('Propiedades llevan los textos del resultado para el correo', () => {
  const a = { ...base, signos: ['quiebre', 'puntas'], tratamientos: ['mechas'] };
  const p = E.properties(a, { fecha: 'X' });
  const w = E.why(a);
  assert.equal(p.quiz_porque_1_titulo, w[0].title);
  assert.equal(p.quiz_porque_2_texto, w[1].text);
  assert.equal(p.quiz_porque_3_titulo, '');
  assert.equal(p.quiz_resultado_parrafo, E.parrafo(a));
  assert.equal(p.quiz_notando, 'quiebre · puntas secas');
  assert.equal(p.quiz_nota_quiebre, true);
});
