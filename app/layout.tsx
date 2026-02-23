import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Qualifier — Kames AI",
  description: "Dashboard de qualification de leads B2B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased" style={{ background: '#0a0a0a', color: '#ffffff' }}>
        {children}
      </body>
    </html>
  );
}
