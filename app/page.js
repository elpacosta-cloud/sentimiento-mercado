import { datosCripto, datosAcciones } from './fuentes';
import { ejemplos, etiqueta, promedio } from './data';

export const revalidate = 1800;

function Barra({ v }) {
  return (
    <div className="barra" role="img" aria-label={`${v} de 100, ${etiqueta(v)}`}>
      <i style={{ left: `${v}%` }} />
    </div>
  );
}

export default async function Inicio() {
  const [cripto, acciones] = await Promise.all([datosCripto(), datosAcciones()]);
  const grupos = [
    { id: 'cripto', nombre: 'Cripto', fuente: 'Fear & Greed de Alternative.me', datos: cripto },
    { id: 'acciones', nombre: 'Acciones de EE. UU.', fuente: 'Fear & Greed de CNN', datos: acciones },
    ...ejemplos.map((g) => ({ ...g, ejemplo: true, datos: { bloques: g.bloques, valor: promedio(g.bloques[0].items) } })),
  ];
  const reales = grupos.filter((g) => !g.ejemplo && g.datos);
  const global = reales.length ? Math.round(reales.reduce((a, g) => a + g.datos.valor, 0) / reales.length) : null;

  return (
    <main>
      <header>
        <h1>Sentimiento del mercado</h1>
        <p className="sub">Miedo y codicia de todos tus instrumentos en una sola pantalla.</p>
        <p className="aviso">Cripto y acciones usan datos reales. Divisas y materias primas aún son de ejemplo.</p>
      </header>

      <section className="hero" aria-label="Resumen global">
        {global === null ? (
          <p className="estado">No pudimos obtener datos ahora. Se reintenta automáticamente.</p>
        ) : (
          <>
            <p className="grande">{global}<span> / 100</span></p>
            <p className="estado">
              {etiqueta(global)} según {reales.map((g) => g.nombre.toLowerCase()).join(' y ')}.
              Divisas y materias primas se suman en el paso 5.
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
          {grupos.filter((g) => g.datos).map((g) => (
            <li key={g.id}>{g.nombre} <strong>{g.datos.valor}</strong> {etiqueta(g.datos.valor)}{g.ejemplo ? ' (ejemplo)' : ''}</li>
          ))}
        </ul>
      </section>

      {grupos.map((g) => (
        <section key={g.id} className="grupo">
          <h2>{g.nombre}{g.ejemplo ? ' (datos de ejemplo)' : ''}</h2>
          <p className="fuente">{g.fuente}</p>
          {!g.datos ? (
            <p className="nodisp">No pudimos obtener estos datos ahora. Se reintenta automáticamente en unos minutos.</p>
          ) : (
            <>
              {g.datos.actualizado && <p className="act">Actualizado: {g.datos.actualizado} (hora de Chile)</p>}
              {g.datos.bloques.map((b, k) => (
                <div key={k}>
                  {b.titulo && <h3>{b.titulo}</h3>}
                  {b.items.map((i) => (
                    <div key={i.n} className="fila">
                      <div className="nom">{i.n} {i.s && <small>{i.s}</small>}</div>
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
