// src/app/layout.tsx
import { nunito } from '../lib/font';  // Correct import path from src/app to src/lib
import './globals.css';

export const metadata = {
  title: 'LetSwap',
  description: 'Trade and exchange skills without cash',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="font-nunito">
        {children}
      </body>
    </html>
  );
}