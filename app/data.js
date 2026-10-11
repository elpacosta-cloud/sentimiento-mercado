export const etiqueta = (v) =>
  v < 25 ? 'Miedo extremo' : v < 45 ? 'Miedo' : v < 56 ? 'Neutral' : v < 76 ? 'Codicia' : 'Codicia extrema';
