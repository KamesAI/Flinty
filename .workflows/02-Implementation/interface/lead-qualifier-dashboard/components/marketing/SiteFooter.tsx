import Link from "next/link";
import Image from "next/image";

const PRODUCT_LINKS = [
  { href: "/#fonctionnalites", label: "Fonctionnalités" },
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/#faq", label: "FAQ" },
  { href: "/login", label: "Connexion" },
  { href: "/signup", label: "Créer un compte" },
];

const LEGAL_LINKS = [
  { href: "/legal/mentions-legales", label: "Mentions légales" },
  { href: "/legal/cgu", label: "Conditions générales" },
  { href: "/legal/confidentialite", label: "Politique de confidentialité" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="container grid gap-10 py-14 md:grid-cols-3">
        <div className="space-y-3">
          <Image
            src="/logo-flinty-cropped.png"
            alt="Flinty"
            width={73}
            height={32}
            className="h-8 w-auto"
          />
          <p className="max-w-xs text-sm text-muted-foreground">
            La prospection autonome multi-canal qui sélectionne, contacte, qualifie et book vos
            rendez-vous.
          </p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Produit</h3>
          <ul className="space-y-2">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Légal</h3>
          <ul className="space-y-2">
            {LEGAL_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6">
        <p className="container text-sm text-muted-foreground">
          © 2026 Flinty · Kames — Fait en France 🇫🇷
        </p>
      </div>
    </footer>
  );
}
