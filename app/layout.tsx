import type { Metadata } from "next";
import "./globals.css";
import MixpanelProvider from "@/components/analytics/MixpanelProvider";

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
      <body style={{ isolation: 'isolate' }} suppressHydrationWarning>
        <MixpanelProvider />
        {children}
      </body>
    </html>
  );
}
