import { buildPremiumStatsCards } from "./premium-stats";

export function PremiumStatsCards({
  campaignsCount,
  repliedCount,
  avgOpenRate,
  meetingsCount,
}: {
  campaignsCount: number;
  repliedCount: number;
  avgOpenRate: number;
  meetingsCount: number;
}) {
  const cards = buildPremiumStatsCards({
    campaignsCount,
    repliedCount,
    avgOpenRate,
    meetingsCount,
  });

  return (
    <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.label}
            className="group relative overflow-hidden rounded-[28px] border border-[var(--dashboard-border)] bg-[color:var(--dashboard-card-bg)]/80 px-6 py-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--dashboard-border-strong)] hover:shadow-[0_24px_70px_rgba(0,0,0,0.34)]"
          >
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-[#FFB300] via-[#FF6D00] to-[#F538A0] opacity-95" />
            <div className="pointer-events-none absolute -right-10 top-6 h-24 w-24 rounded-full bg-[#FF6D00]/10 blur-3xl transition-opacity duration-300 group-hover:opacity-90" />

            <div className="mb-8 flex items-start justify-between gap-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--dashboard-text-secondary)]">
                {card.label}
              </p>

              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--dashboard-border)] bg-white/[0.03] text-[var(--dashboard-text-secondary)] transition-all duration-300 group-hover:border-[var(--dashboard-border-strong)] group-hover:text-[var(--dashboard-text-primary)]">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[42px] font-semibold leading-none tracking-[-0.05em] text-[var(--dashboard-text-primary)]">
                {card.value}
              </p>
              <p className="text-sm text-[var(--dashboard-text-secondary)]">
                {card.sublabel}
              </p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
