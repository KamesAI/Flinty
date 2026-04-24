import type { Metadata } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";

const flintyFont = M_PLUS_Rounded_1c({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-flinty",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Flinty",
  description: "Dashboard CRM interne — Flinty",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={flintyFont.variable}>
      <body>{children}</body>
    </html>
  );
}
