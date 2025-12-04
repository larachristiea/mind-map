// ============================================
// LAYOUT PRINCIPAL
// ============================================

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mind Map - Transforme documentos em mapas mentais',
  description: 'Crie mapas mentais interativos a partir de PDFs, apresentações e textos. Gratuito e sem necessidade de cadastro.',
  keywords: ['mind map', 'mapa mental', 'pdf para mind map', 'apresentação', 'markdown'],
  openGraph: {
    title: 'Mind Map',
    description: 'Transforme documentos em mapas mentais interativos',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
              borderRadius: '12px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
