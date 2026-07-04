import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Flinty — Prospection autonome, du premier message au rendez-vous booké",
    template: "%s | Flinty",
  },
  description:
    "Flinty prospecte, relance, qualifie et book vos rendez-vous sur email et LinkedIn — sans que vous touchiez un message.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}
