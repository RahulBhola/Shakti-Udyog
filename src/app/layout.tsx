import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shakti Udyog | Precision Cast Iron & Industrial Metal Casting',
  description: 'A world-class industrial casting manufacturer engineered for precision, high-pressure fluid dynamics, and demanding mechanical applications. From molten iron to precision components.',
  keywords: ['cast iron', 'foundry', 'metal casting', 'DN25 valve', 'PN25', 'GG25', 'ductile iron', 'Shakti Udyog', 'sand casting', 'industrial manufacturing'],
  authors: [{ name: 'Shakti Udyog Engineering' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#050505',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-[#050505] text-[#F5F5F7] antialiased selection:bg-orange-600 selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
