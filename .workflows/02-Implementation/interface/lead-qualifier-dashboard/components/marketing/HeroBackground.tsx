/**
 * Background animé du hero : blobs émeraude en dérive lente + trame pointillée,
 * fondu vers le blanc en bas pour raccorder à la suite de la page.
 * Purement CSS (classes .hero-aurora-blob--* dans globals.css), aucun JS d'animation.
 */
export function HeroBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="hero-aurora-blob hero-aurora-blob--a -top-48 left-[6%] h-[34rem] w-[34rem]" />
      <div className="hero-aurora-blob hero-aurora-blob--b -top-24 right-[2%] h-[28rem] w-[28rem]" />
      <div className="hero-aurora-blob hero-aurora-blob--c left-[32%] top-40 h-[30rem] w-[30rem]" />
      <div className="absolute inset-0 bg-dot-grid [mask-image:radial-gradient(75%_65%_at_50%_0%,black,transparent)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
    </div>
  );
}
