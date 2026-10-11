import { datosCripto, datosAcciones, datosCOT, datosDerivados } from './fuentes';
import { etiqueta } from './data';

// Se genera en cada visita; las fuentes se guardan en caché por separado (ver fuentes.js).
export const dynamic = 'force-dynamic';

function Barra({ v }) {
  return (
    <div className="barra" role="img" aria-label={`${v} de 100, ${etiqueta(v)}`}>
      <i style={{ left: `${v}%` }} />
    </div>
  );
}

export default async function Inicio() {
  const [cripto, acciones, cot, deriv] = await Promise.all([datosCripto(), datosAcciones(), datosCOT(), datosDerivados()]);
  if (cripto && deriv.bloques) cripto.bloques.push(...deriv.bloques);
  const explicaCripto = 'Derivados (OKX): funding alto, más cuentas largas que cortas e interés abierto alto frente a lo normal apuntan a codicia; lo contrario, a miedo.';
  const explicaCOT = 'Posición neta de los especuladores frente a sus últimos 3 años. 0 = muy vendidos (miedo), 100 = muy comprados (codicia). Se actualiza una vez por semana.';
  const grupos = [
    { id: 'cripto', nombre: 'Cripto', fuente: 'Fear & Greed de Alternative.me y derivados de OKX', explica: explicaCripto, nota: deriv.error ? `Derivados no disponibles ahora (${deriv.error}).` : null, datos: cripto },
    { id: 'acciones', nombre: 'Acciones de EE. UU.', fuente: 'Fear & Greed de CNN', datos: acciones },
    { id: 'divisas', nombre: 'Divisas', fuente: 'COT de la CFTC', explica: explicaCOT, cot: true, datos: cot.divisas, error: cot.error },
    { id: 'materias', nombre: 'Materias primas', fuente: 'COT de la CFTC', explica: explicaCOT, cot: true, datos: cot.materias, error: cot.error },
  ];
  const reales = grupos.filter((g) => g.datos);
  const global = reales.length ? Math.round(reales.reduce((a, g) => a + g.datos.valor, 0) / reales.length) : null;

  return (
    <main>
      <header>
        <h1>Sentimiento del mercado</h1>
        <p className="sub">Miedo y codicia de todos tus instrumentos en una sola pantalla.</p>
        <p className="aviso">Datos reales de cripto, acciones, divisas y materias primas.</p>
      </header>

      <section className="hero" aria-label="Resumen global">
        {global === null ? (
          <p className="estado">No pudimos obtener datos ahora. Se reintenta automáticamente.</p>
        ) : (
          <>
            <p className="grande">{global}<span> / 100</span></p>
            <p className="estado">
              {etiqueta(global)} en el conjunto del mercado ({reales.length} de {grupos.length} grupos con datos).
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
      </section>

      {grupos.map((g) => (
        <section key={g.id} className="grupo">
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
                    <div key={i.n} className="fila">
                      <div className="nom">{i.n} {i.s && <small>{i.s}</small>}{i.d && <small className="d">{i.d}</small>}</div>
                      <Barra v={i.v} />
                      <div className="val"><strong>{i.v}</strong> {etiqueta(i.v)}</div>
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
