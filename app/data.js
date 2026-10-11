// DATOS DE EJEMPLO (paso 2). Se reemplazan por datos reales en los pasos 4 a 6.
export const grupos = [
  { id: 'cripto', nombre: 'Cripto', fuente: 'Fear & Greed y derivados', items: [
    { n: 'Bitcoin', s: 'BTC', v: 34 }, { n: 'Ethereum', s: 'ETH', v: 41 }, { n: 'Solana', s: 'SOL', v: 52 } ] },
  { id: 'acciones', nombre: 'Acciones', fuente: 'Fear & Greed de acciones', items: [
    { n: 'S&P 500', s: 'SPX', v: 63 }, { n: 'Nasdaq', s: 'NDX', v: 68 }, { n: 'Dow Jones', s: 'DJI', v: 57 } ] },
  { id: 'divisas', nombre: 'Divisas', fuente: 'COT (CFTC)', items: [
    { n: 'Euro', s: 'EUR', v: 58 }, { n: 'Libra', s: 'GBP', v: 47 }, { n: 'Yen', s: 'JPY', v: 22 },
    { n: 'Dólar australiano', s: 'AUD', v: 39 }, { n: 'Dólar canadiense', s: 'CAD', v: 44 }, { n: 'Franco suizo', s: 'CHF', v: 61 } ] },
  { id: 'materias', nombre: 'Materias primas', fuente: 'COT (CFTC)', items: [
    { n: 'Oro', s: 'XAU', v: 81 }, { n: 'Plata', s: 'XAG', v: 74 }, { n: 'Petróleo', s: 'WTI', v: 36 },
    { n: 'Gas natural', s: 'NG', v: 28 }, { n: 'Cobre', s: 'HG', v: 55 } ] },
];

export const etiqueta = (v) =>
  v < 25 ? 'Miedo extremo' : v < 45 ? 'Miedo' : v < 56 ? 'Neutral' : v < 76 ? 'Codicia' : 'Codicia extrema';

export const promedio = (items) => Math.round(items.reduce((a, i) => a + i.v, 0) / items.length);
