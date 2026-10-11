// Paso 4: datos reales de cripto (Alternative.me) y acciones (CNN).
// Si una fuente falla, devuelve null y la pantalla muestra un aviso en vez de romperse.
const FORMATO = { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Santiago' };
const hora = (ms) => {
  const f = new Date(ms);
  return isNaN(f) ? null : new Intl.DateTimeFormat('es-CL', FORMATO).format(f);
};
const num = (x) => {
  if (x === null || x === undefined || x === '') return null;
  const n = Math.round(Number(x));
  return Number.isFinite(n) ? n : null;
};
const fila = (n, x) => {
  const v = num(x);
  return v === null ? null : { n, v };
};
const limpio = (a) => a.filter(Boolean);

async function pedir(url, headers = {}) {
  try {
    const r = await fetch(url, { headers, next: { revalidate: 1800 }, signal: AbortSignal.timeout(8000) });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

export async function datosCripto() {
  const j = await pedir('https://api.alternative.me/fng/?limit=31');
  const d = j && j.data;
  if (!Array.isArray(d) || num(d[0] && d[0].value) === null) return null;
  const items = limpio([
    fila('Hoy', d[0].value),
    fila('Ayer', d[1] && d[1].value),
    fila('Hace 1 semana', d[7] && d[7].value),
    fila('Hace 1 mes', d[30] && d[30].value),
  ]);
  return { bloques: [{ titulo: null, items }], valor: items[0].v, actualizado: hora(Number(d[0].timestamp) * 1000) };
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const COMPONENTES = [
  ['market_momentum_sp500', 'Momentum del S&P 500'],
  ['stock_price_strength', 'Fortaleza de precios'],
  ['stock_price_breadth', 'Amplitud del mercado'],
  ['put_call_options', 'Opciones put/call'],
  ['market_volatility_vix', 'Volatilidad (VIX)'],
  ['junk_bond_demand', 'Demanda de bonos basura'],
  ['safe_haven_demand', 'Demanda de refugio seguro'],
];

export async function datosAcciones() {
  const j = await pedir('https://production.dataviz.cnn.io/index/fearandgreed/graphdata', {
    'User-Agent': UA, Accept: 'application/json', Origin: 'https://edition.cnn.com', Referer: 'https://edition.cnn.com/',
  });
  const fg = j && j.fear_and_greed;
  if (!fg || num(fg.score) === null) return null;
  const general = limpio([
    fila('Hoy', fg.score),
    fila('Cierre anterior', fg.previous_close),
    fila('Hace 1 semana', fg.previous_1_week),
    fila('Hace 1 mes', fg.previous_1_month),
    fila('Hace 1 año', fg.previous_1_year),
  ]);
  const comps = limpio(COMPONENTES.map(([k, n]) => fila(n, j[k] && j[k].score)));
  const bloques = [{ titulo: 'Índice general', items: general }];
  if (comps.length) bloques.push({ titulo: 'Los 7 componentes', items: comps });
  return { bloques, valor: general[0].v, actualizado: hora(fg.timestamp) };
}
