import { grupos, etiqueta, promedio } from './data';

const resumen = grupos.map((g) => ({ ...g, v: promedio(g.items) }));
const global = promedio(resumen);

function Barra({ v }) {
  return (
    <div className="barra" role="img" aria-label={`${v} de 100, ${etiqueta(v)}`}>
      <i style={{ left: `${v}%` }} />
    </div>
  );
}

export default function Inicio() {
  return (
    <main>
      <header>
        <h1>Sentimiento del mercado</h1>
        <p className="sub">Miedo y codicia de todos tus instrumentos en una sola pantalla.</p>
        <p className="aviso">Datos de ejemplo. Los datos reales se conectan en los siguientes pasos.</p>
      </header>

      <section className="hero" aria-label="Resumen global">
        <p className="grande">{global}<span> / 100</span></p>
        <p className="estado">{etiqueta(global)} en el conjunto del mercado</p>
        <div className="espectro">
          {resumen.map((g) => (
            <b key={g.id} className="punto" style={{ left: `${g.v}%` }} title={`${g.nombre}: ${g.v}`} />
          ))}
        </div>
        <div className="escala"><span>Miedo extremo</span><span>Neutral</span><span>Codicia extrema</span></div>
        <ul className="chips">
          {resumen.map((g) => (
            <li key={g.id}>{g.nombre} <strong>{g.v}</strong> {etiqueta(g.v)}</li>
          ))}
        </ul>
      </section>

      {grupos.map((g) => (
        <section key={g.id} className="grupo">
          <h2>{g.nombre}</h2>
          <p className="fuente">{g.fuente}</p>
          {g.items.map((i) => (
            <div key={i.s} className="fila">
              <div className="nom">{i.n} <small>{i.s}</small></div>
              <Barra v={i.v} />
              <div className="val"><strong>{i.v}</strong> {etiqueta(i.v)}</div>
            </div>
          ))}
        </section>
      ))}

      <footer>Información con fines informativos. No es asesoría financiera.</footer>
    </main>
  );
}
