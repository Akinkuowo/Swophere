// src/lib/fonts.ts
import { Nunito } from 'next/font/google';

export const nunito = Nunito({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-nunito',
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
});