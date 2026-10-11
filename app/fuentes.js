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

// Paso 5: COT de la CFTC (informe Legacy, solo futuros). Posición neta de los especuladores
// (no comerciales) comparada con sus últimos 3 años: 0 = muy vendidos, 100 = muy comprados.
const COT_URL = 'https://publicreporting.cftc.gov/resource/6dca-aqww.json';
const MERCADOS = {
  divisas: [
    ['099741', 'Euro', 'EUR'], ['096742', 'Libra esterlina', 'GBP'], ['097741', 'Yen japonés', 'JPY'],
    ['232741', 'Dólar australiano', 'AUD'], ['090741', 'Dólar canadiense', 'CAD'],
    ['092741', 'Franco suizo', 'CHF'], ['098662', 'Índice dólar', 'DXY'],
  ],
  materias: [
    ['088691', 'Oro', 'XAU'], ['084691', 'Plata', 'XAG'], ['067651', 'Petróleo WTI', 'WTI'],
    ['023651', 'Gas natural', 'NG'], ['085692', 'Cobre', 'HG'],
  ],
};
const fechaCorta = (t) => {
  const f = new Date(t);
  return isNaN(f) ? null : 'reporte del ' + new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: 'UTC' }).format(f);
};

export async function datosCOT() {
  const todos = [...MERCADOS.divisas, ...MERCADOS.materias];
  const desde = new Date(Date.now() - 3 * 365 * 864e5).toISOString().slice(0, 10);
  const params = new URLSearchParams({
    $select: 'cftc_contract_market_code,report_date_as_yyyy_mm_dd,noncomm_positions_long_all,noncomm_positions_short_all',
    $where: `cftc_contract_market_code in(${todos.map((m) => `'${m[0]}'`).join(',')}) AND report_date_as_yyyy_mm_dd >= '${desde}T00:00:00.000'`,
    $order: 'report_date_as_yyyy_mm_dd DESC',
    $limit: '5000',
  });
  let filas;
  try {
    const r = await fetch(`${COT_URL}?${params}`, { next: { revalidate: 21600 }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) return { error: `la CFTC respondió con el código ${r.status}` };
    filas = await r.json();
  } catch (e) {
    return { error: 'no hubo conexión con la CFTC' };
  }
  if (!Array.isArray(filas) || filas.length === 0) return { error: 'la CFTC no devolvió datos' };

  const porCodigo = {};
  for (const f of filas) {
    const neto = Number(f.noncomm_positions_long_all) - Number(f.noncomm_positions_short_all);
    if (!Number.isFinite(neto)) continue;
    (porCodigo[f.cftc_contract_market_code] ||= []).push({ neto, fecha: f.report_date_as_yyyy_mm_dd });
  }
  const armar = (lista) => {
    const items = [];
    let fecha = null;
    for (const [codigo, n, s] of lista) {
      const h = porCodigo[codigo];
      if (!h || h.length < 20) continue;
      const netos = h.map((x) => x.neto);
      const min = Math.min(...netos), max = Math.max(...netos);
      const v = max === min ? 50 : Math.round(((netos[0] - min) / (max - min)) * 100);
      items.push({ n, s, v });
      if (!fecha || h[0].fecha > fecha) fecha = h[0].fecha;
    }
    if (!items.length) return null;
    return { bloques: [{ titulo: null, items }], valor: Math.round(items.reduce((a, i) => a + i.v, 0) / items.length), actualizado: fechaCorta(fecha) };
  };
  const divisas = armar(MERCADOS.divisas), materias = armar(MERCADOS.materias);
  if (!divisas && !materias) return { error: 'no se encontraron los mercados esperados en la respuesta' };
  return { divisas, materias };
}

// Paso 6: derivados cripto (API pública de OKX, sin clave).
const OKX = 'https://www.okx.com/api/v5';
const MONEDAS = [['BTC', 'Bitcoin'], ['ETH', 'Ethereum'], ['SOL', 'Solana']];
const acotar = (x) => Math.max(0, Math.min(100, Math.round(x)));
const fmt = (x, d) => new Intl.NumberFormat('es-CL', { minimumFractionDigits: d, maximumFractionDigits: d }).format(x);

async function okx(ruta) {
  try {
    const r = await fetch(`${OKX}${ruta}`, { next: { revalidate: 900 }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return { error: `código ${r.status}` };
    const j = await r.json();
    if (j.code !== '0' || !Array.isArray(j.data)) return { error: j.msg || 'respuesta inesperada' };
    return { data: j.data };
  } catch {
    return { error: 'sin conexión' };
  }
}

async function derivadosMoneda([ccy, nombre]) {
  const [f, l, o] = await Promise.all([
    okx(`/public/funding-rate?instId=${ccy}-USDT-SWAP`),
    okx(`/rubik/stat/contracts/long-short-account-ratio?ccy=${ccy}&period=1H`),
    okx(`/rubik/stat/contracts/open-interest-volume?ccy=${ccy}&period=1D`),
  ]);
  const items = [];
  const errores = [];
  // Funding: 0,01 % por período = neutral (50); 0,05 % o más = 100; -0,03 % o menos = 0.
  const fr = f.data && Number(f.data[0] && f.data[0].fundingRate);
  if (Number.isFinite(fr)) {
    const pct = fr * 100;
    items.push({ n: 'Funding', v: acotar(50 + (pct - 0.01) * 1250), d: `${fmt(pct, 4)} % por período` });
  } else errores.push(f.error || 'sin dato de funding');
  // Largos vs cortos: 50 % de cuentas largas = 50; 70 % o más = 100; 30 % o menos = 0.
  const ratio = l.data && Number(l.data[0] && l.data[0][1]);
  if (Number.isFinite(ratio) && ratio > 0) {
    const parte = ratio / (1 + ratio);
    items.push({ n: 'Largos vs cortos', v: acotar(50 + (parte - 0.5) * 250), d: `${fmt(ratio, 2)} largos por cada corto` });
  } else errores.push(l.error || 'sin dato de largos y cortos');
  // Interés abierto: posición del valor actual dentro de los últimos 30 días (0 = el más bajo, 100 = el más alto).
  const oi = o.data && o.data.slice(0, 30).map((r) => Number(r[1])).filter(Number.isFinite);
  if (oi && oi.length >= 7) {
    items.push({ n: 'Interés abierto', v: acotar((oi.filter((x) => x <= oi[0]).length / oi.length) * 100), d: 'frente a los últimos 30 días' });
  } else errores.push(o.error || 'sin dato de interés abierto');
  return { bloque: items.length ? { titulo: `${nombre} (${ccy})`, items } : null, errores };
}

export async function datosDerivados() {
  const res = await Promise.all(MONEDAS.map(derivadosMoneda));
  const bloques = res.map((r) => r.bloque).filter(Boolean);
  if (!bloques.length) return { error: 'OKX: ' + (res.flatMap((r) => r.errores)[0] || 'sin datos') };
  return { bloques };
}
