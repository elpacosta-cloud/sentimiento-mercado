// Divisas y materias primas siguen con DATOS DE EJEMPLO hasta el paso 5 (COT).
export const ejemplos = [
  { id: 'divisas', nombre: 'Divisas', fuente: 'COT (CFTC)', bloques: [{ titulo: null, items: [
    { n: 'Euro', s: 'EUR', v: 58 }, { n: 'Libra', s: 'GBP', v: 47 }, { n: 'Yen', s: 'JPY', v: 22 },
    { n: 'Dólar australiano', s: 'AUD', v: 39 }, { n: 'Dólar canadiense', s: 'CAD', v: 44 }, { n: 'Franco suizo', s: 'CHF', v: 61 } ] }] },
  { id: 'materias', nombre: 'Materias primas', fuente: 'COT (CFTC)', bloques: [{ titulo: null, items: [
    { n: 'Oro', s: 'XAU', v: 81 }, { n: 'Plata', s: 'XAG', v: 74 }, { n: 'Petróleo', s: 'WTI', v: 36 },
    { n: 'Gas natural', s: 'NG', v: 28 }, { n: 'Cobre', s: 'HG', v: 55 } ] }] },
];

export const etiqueta = (v) =>
  v < 25 ? 'Miedo extremo' : v < 45 ? 'Miedo' : v < 56 ? 'Neutral' : v < 76 ? 'Codicia' : 'Codicia extrema';

export const promedio = (items) => Math.round(items.reduce((a, i) => a + i.v, 0) / items.length);
