import '../styles/globals.css';
import { Providers } from '../components/shared/Providers';

export const metadata = {
  title: 'KIXORA — Collect. Verify. Trade.',
  description: "The world's most trusted sneaker marketplace. Every pair authenticated.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
