import type { Metadata } from "next";
import "./globals.css";
import MixpanelProvider from "@/components/analytics/MixpanelProvider";
import HeaderWrapper from "@/components/HeaderWrapper";
import SimpleFooter from "@/components/homepage/SimpleFooter";

export const metadata: Metadata = {
  title: "Reclaim - Campus Marketplace",
  description: "Buy and sell items safely within your university community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.cdnfonts.com/css/marianina-fy-black" rel="stylesheet" />
      </head>
      <body style={{ isolation: 'isolate' }} suppressHydrationWarning>
        <MixpanelProvider />
        <HeaderWrapper />
        {children}
        <SimpleFooter />
      </body>
    </html>
  );
}
