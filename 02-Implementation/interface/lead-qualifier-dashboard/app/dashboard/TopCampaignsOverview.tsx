import Link from "next/link";
import { ArrowUpRight, BarChart3, ChevronRight, Sparkles, Target } from "lucide-react";
import type { Campaign } from "@/lib/sheets";
import { buildCampaignOverviewModel } from "./campaign-overview";

function FunnelMini({
  stats,
}: {
  stats: Array<{ label: string; value: number }>;
}) {
  const max = Math.max(...stats.map((stat) => stat.value), 1);

  return (
    <div className="rounded-[18px] border border-[var(--dashboard-border)] bg-[color:var(--dashboard-card-bg-muted)]/90 px-3 py-3">
      <div className="grid grid-cols-4 gap-2.5">
        {stats.map((stat, index) => {
          const colors = [
            "from-white/20 to-white/5",
            "from-blue-400/50 to-blue-400/10",
            "from-orange-400/50 to-orange-400/10",
            "from-emerald-400/50 to-emerald-400/10",
          ];

          return (
            <div key={stat.label} className="text-center">
              <p className="text-xs font-semibold text-[var(--dashboard-text-primary)]">
                {stat.value}
              </p>
              <div className="mx-auto mt-1.5 h-8 w-8 overflow-hidden rounded-lg bg-black/20 ring-1 ring-white/5">
                <div
                  className={`h-full w-full rounded-lg bg-gradient-to-t ${colors[index]} transition-all duration-300`}
                  style={{
                    transform: `translateY(${100 - Math.max((stat.value / max) * 100, stat.value > 0 ? 18 : 100)}%)`,
                  }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-[var(--dashboard-text-secondary)]">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getStatusBadgeClass(tone: "info" | "success" | "warning" | "muted") {
  if (tone === "success") return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/20";
  if (tone === "info") return "bg-blue-500/15 text-blue-300 ring-blue-500/20";
  if (tone === "warning") return "bg-amber-500/15 text-amber-300 ring-amber-500/20";
  return "bg-white/5 text-[var(--dashboard-text-secondary)] ring-white/10";
}

export function TopCampaignsOverview({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <div className="space-y-3">
      {campaigns.map((campaign) => {
        const model = buildCampaignOverviewModel(campaign);

        return (
          <Link
            key={campaign.campaign_id}
            href={`/dashboard/campaigns/${campaign.campaign_id}`}
            className="group relative block overflow-hidden rounded-[24px] border border-[var(--dashboard-border)] bg-[color:var(--dashboard-card-bg)]/88 px-5 py-4 shadow-[0_14px_45px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--dashboard-border-strong)] hover:shadow-[0_22px_70px_rgba(0,0,0,0.3)]"
          >
            <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[#FF6D00] to-transparent opacity-80" />

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 xl:w-[30%]">
                <div className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                    model.statusTone === "success"
                      ? "bg-emerald-400"
                      : model.statusTone === "info"
                      ? "bg-blue-400"
                      : model.statusTone === "warning"
                      ? "bg-amber-400"
                      : "bg-white/35"
                  }`} />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[22px] font-semibold leading-tight tracking-[-0.04em] text-[var(--dashboard-text-primary)]">
                        {campaign.nom}
                      </p>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[var(--dashboard-text-secondary)] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                    <p className="mt-1 max-w-md text-sm leading-snug text-[var(--dashboard-text-secondary)]">
                      {model.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              <div className="xl:w-[30%]">
                <FunnelMini stats={model.funnelStats} />
              </div>

              <div className="flex flex-1 flex-col gap-3 xl:min-w-[230px] xl:max-w-[290px]">
                <div className="grid grid-cols-2 gap-2.5">
                  {model.rateStats.map((stat, statIndex) => (
                    <div
                      key={stat.label}
                      className="rounded-[16px] border border-[var(--dashboard-border)] bg-[color:var(--dashboard-card-bg-muted)]/90 px-3 py-3"
                    >
                      <div className="mb-2 flex items-center gap-1.5">
                        {statIndex === 0 ? (
                          <BarChart3 className="h-3.5 w-3.5 text-[#FFB300]" strokeWidth={1.8} />
                        ) : (
                          <Target className="h-3.5 w-3.5 text-[#FFB300]" strokeWidth={1.8} />
                        )}
                        <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--dashboard-text-secondary)]">
                          {stat.label}
                        </span>
                      </div>
                      <p className="text-xl font-semibold tracking-[-0.03em] text-[var(--dashboard-text-primary)]">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${getStatusBadgeClass(
                      model.statusTone
                    )}`}
                  >
                    <Sparkles className="h-3 w-3" strokeWidth={1.8} />
                    {model.statusLabel}
                  </span>

                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--dashboard-text-secondary)] transition-colors duration-300 group-hover:text-[var(--dashboard-text-primary)]">
                    Ouvrir
                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
