import { datosCripto, datosAcciones, datosCOT, datosDerivados, datosExpectativas } from './fuentes';
import { etiqueta } from './data';

// Se genera en cada visita; las fuentes se guardan en caché por separado (ver fuentes.js).
export const dynamic = 'force-dynamic';

function Barra({ v, prob }) {
  return (
    <div className={prob ? 'barra prob' : 'barra'} role="img" aria-label={prob ? `${v} % de probabilidad` : `${v} de 100, ${etiqueta(v)}`}>
      <i style={prob ? { width: `${v}%` } : { left: `${v}%` }} />
    </div>
  );
}

const HISTORIAL = new Set(['Ayer', 'Hace 1 semana', 'Hace 1 mes', 'Cierre anterior', 'Hace 1 año']);
const GENERICOS = new Set(['Índice general', 'Los 7 componentes']);
const MENU = { cripto: 'Cripto', acciones: 'Acciones', divisas: 'Divisas', materias: 'Materias primas', expectativas: 'Expectativas' };

export default async function Inicio() {
  const [cripto, acciones, cot, deriv, exp] = await Promise.all([datosCripto(), datosAcciones(), datosCOT(), datosDerivados(), datosExpectativas()]);
  if (cripto && deriv.bloques) cripto.bloques.push(...deriv.bloques);
  const explicaCripto = 'Derivados (OKX): funding alto, más cuentas largas que cortas e interés abierto alto frente a lo normal apuntan a codicia; lo contrario, a miedo.';
  const explicaCOT = 'Posición neta de los especuladores frente a sus últimos 3 años. 0 = muy vendidos (miedo), 100 = muy comprados (codicia). Se actualiza una vez por semana.';
  const grupos = [
    { id: 'cripto', nombre: 'Cripto', fuente: 'Fear & Greed de Alternative.me y derivados de OKX', explica: explicaCripto, nota: deriv.error ? `Derivados no disponibles ahora (${deriv.error}).` : null, datos: cripto },
    { id: 'acciones', nombre: 'Acciones de EE. UU.', fuente: 'Fear & Greed de CNN', datos: acciones },
    { id: 'divisas', nombre: 'Divisas', fuente: 'COT de la CFTC', explica: explicaCOT, cot: true, datos: cot.divisas, error: cot.error },
    { id: 'materias', nombre: 'Materias primas', fuente: 'COT de la CFTC', explica: explicaCOT, cot: true, datos: cot.materias, error: cot.error },
    {
      id: 'expectativas', nombre: 'Expectativas del mercado', fuente: 'Mercados de predicción de Polymarket', sinPuntaje: true,
      explica: 'Probabilidad que los participantes de Polymarket asignan a cada evento, con dinero real. No son garantías, solo existen para eventos con mercado y los textos están en inglés, como en la fuente. No entran en el resumen global.',
      datos: exp.bloques ? { bloques: exp.bloques, valor: null } : null, error: exp.error,
    },
  ];
  const reales = grupos.filter((g) => g.datos && !g.sinPuntaje);
  const global = reales.length ? Math.round(reales.reduce((a, g) => a + g.datos.valor, 0) / reales.length) : null;

  const extremos = reales
    .flatMap((g) => g.datos.bloques.flatMap((b) => b.items
      .filter((i) => !HISTORIAL.has(i.n) && (i.v <= 10 || i.v >= 90))
      .map((i) => ({ v: i.v, texto: b.titulo && !GENERICOS.has(b.titulo) ? `${b.titulo} · ${i.n}` : `${g.nombre} · ${i.n === 'Hoy' ? 'índice general' : i.n}` }))))
    .sort((a, b) => Math.abs(b.v - 50) - Math.abs(a.v - 50));

  return (
    <main>
      <header>
        <h1>Sentimiento del mercado</h1>
        <p className="sub">Miedo y codicia de todos tus instrumentos en una sola pantalla.</p>
        <p className="aviso">Datos reales de cripto, acciones, divisas y materias primas.</p>
      </header>

      <nav className="menu" aria-label="Secciones">
        {grupos.map((g) => <a key={g.id} href={`#${g.id}`}>{MENU[g.id]}</a>)}
      </nav>

      <section className="hero" aria-label="Resumen global">
        {global === null ? (
          <p className="estado">No pudimos obtener datos ahora. Se reintenta automáticamente.</p>
        ) : (
          <>
            <p className="grande">{global}<span> / 100</span></p>
            <p className="estado">
              {etiqueta(global)} en el conjunto del mercado ({reales.length} de {grupos.filter((g) => !g.sinPuntaje).length} grupos con datos).
            </p>
            <div className="espectro">
              {reales.map((g) => (
                <b key={g.id} className="punto" style={{ left: `${g.datos.valor}%` }} title={`${g.nombre}: ${g.datos.valor}`} />
              ))}
            </div>
            <div className="escala"><span>Miedo extremo</span><span>Neutral</span><span>Codicia extrema</span></div>
          </>
        )}
        <ul className="chips">
          {reales.map((g) => (
            <li key={g.id}>{g.nombre} <strong>{g.datos.valor}</strong> {etiqueta(g.datos.valor)}</li>
          ))}
        </ul>
        <details className="como">
          <summary>¿Cómo se calcula el resumen global?</summary>
          <p>
            Es el promedio simple de cuatro grupos. Cripto y Acciones usan su índice Fear & Greed de hoy; Divisas y Materias primas
            usan el promedio de la posición de los especuladores (COT) de sus instrumentos. Los derivados cripto y las expectativas de
            Polymarket se muestran aparte y no entran en este número. Es un resumen orientativo, no una señal de compra o venta.
          </p>
        </details>
      </section>

      <section className="extremos" aria-label="Extremos de hoy">
        <h2>Extremos de hoy</h2>
        {extremos.length === 0 ? (
          <p className="act">Ninguna lectura está hoy por debajo de 10 ni por encima de 90.</p>
        ) : (
          <>
            <ul>
              {extremos.map((e) => (
                <li key={e.texto}><span>{e.texto}</span><strong className={e.v >= 50 ? 'alto' : 'bajo'}>{e.v}</strong><em>{etiqueta(e.v)}</em></li>
              ))}
            </ul>
            <p className="act">Lecturas por debajo de 10 o por encima de 90. En divisas y materias primas, 0 significa especuladores muy vendidos y 100, muy comprados.</p>
          </>
        )}
      </section>

      {grupos.map((g) => (
        <section key={g.id} id={g.id} className="grupo">
          <h2>{g.nombre}</h2>
          <p className="fuente">{g.fuente}</p>
          {!g.datos ? (
            <p className="nodisp">No pudimos obtener estos datos ahora{g.error ? ` (${g.error})` : ''}. Se reintenta automáticamente en unos minutos.</p>
          ) : (
            <>
              {g.datos.actualizado && <p className="act">Actualizado: {g.datos.actualizado}{g.cot ? '' : ' (hora de Chile)'}</p>}
              {g.explica && <p className="act">{g.explica}</p>}
              {g.nota && <p className="act">{g.nota}</p>}
              {g.datos.bloques.map((b, k) => (
                <div key={k}>
                  {b.titulo && <h3>{b.titulo}</h3>}
                  {b.items.map((i) => (
                    <div key={i.n} className={g.sinPuntaje ? 'fila exp' : 'fila'}>
                      <div className="nom">{i.n} {i.s && <small>{i.s}</small>}{i.d && <small className="d">{i.d}</small>}</div>
                      <Barra v={i.v} prob={g.sinPuntaje} />
                      <div className="val"><strong>{i.v}{g.sinPuntaje ? ' %' : ''}</strong> {g.sinPuntaje ? 'probabilidad' : etiqueta(i.v)}</div>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </section>
      ))}

      <footer>Información con fines informativos. No es asesoría financiera.</footer>
    </main>
  );
}
