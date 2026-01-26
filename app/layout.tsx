import type { Metadata } from "next";
import { Archivo_Black, Work_Sans } from "next/font/google";
import "./fonts.css";
import "./globals.css";
import MixpanelProvider from "@/components/analytics/MixpanelProvider";
import HeaderWrapper from "@/components/HeaderWrapper";
import MobileHeaderWrapper from "@/components/MobileHeaderWrapper";
import SimpleFooter from "@/components/homepage/SimpleFooter";
import MobileFooter from "@/components/MobileFooter";

// Load Google Fonts using next/font (prevents CORB issues)
// Using Work Sans as a free alternative to BR Shape (geometric sans-serif)
const workSans = Work_Sans({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  variable: '--font-work-sans',
  display: 'swap',
});

const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-archivo-black',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "UME - University Market Exchange",
  description: "Buy and sell items safely within your university community",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${workSans.variable} ${archivoBlack.variable}`}>
      <body className={`${workSans.className} bg-ume-bg`} style={{ isolation: 'isolate', fontWeight: 300 }} suppressHydrationWarning>
        <MixpanelProvider />
        <HeaderWrapper />
        <MobileHeaderWrapper />
        {children}
        <SimpleFooter />
        <MobileFooter />
      </body>
    </html>
  );
}
