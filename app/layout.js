import './globals.css';

export const metadata = {
  title: 'Sentimiento del mercado',
  description: 'Miedo y codicia de cripto, acciones, divisas y materias primas en una sola pantalla.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
