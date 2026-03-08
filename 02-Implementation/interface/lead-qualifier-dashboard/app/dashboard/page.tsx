import Link from "next/link";
import { getSheetData, parseCampaigns, parseLeads } from "@/lib/sheets";

function FunnelBar({ raw, qualified, contacted, replied }: {
  raw: number; qualified: number; contacted: number; replied: number;
}) {
  const max = Math.max(raw, 1);
  const steps = [
    { label: "Raw",       value: raw,       color: "bg-zinc-600" },
    { label: "Qualifiés", value: qualified,  color: "bg-blue-500" },
    { label: "Contactés", value: contacted,  color: "bg-orange-500" },
    { label: "Réponses",  value: replied,    color: "bg-emerald-500" },
  ];
  return (
    <div className="flex items-end gap-1.5">
      {steps.map((step) => (
        <div key={step.label} className="flex flex-col items-center gap-1">
          <span className="text-xs text-zinc-500">{step.value}</span>
          <div className="w-8 bg-zinc-800 rounded-sm overflow-hidden" style={{ height: "24px" }}>
            <div
              className={`${step.color} rounded-sm`}
              style={{ height: `${Math.max((step.value / max) * 100, step.value > 0 ? 10 : 0)}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-600">{step.label}</span>
        </div>
      ))}
    </div>
  );
}

const STATUS_CONFIG = {
  active:     { label: "Actif",        dot: "bg-green-500" },
  generating: { label: "Génération...", dot: "bg-blue-500" },
  scheduled:  { label: "Planifié",     dot: "bg-yellow-500" },
  paused:     { label: "Pausé",        dot: "bg-zinc-500" },
} as const;

export default async function DashboardPage() {
  let campaigns: Awaited<ReturnType<typeof parseCampaigns>> = [];
  let hotLeads: Awaited<ReturnType<typeof parseLeads>> = [];
  let repliedCount = 0;
  let error = false;
  try {
    const [campRows, leadRows] = await Promise.all([
      getSheetData("Campagnes!A:L"),
      getSheetData("Leads_Qualified!A:O"),
    ]);
    campaigns = parseCampaigns(campRows);
    const allLeads = parseLeads(leadRows);
    hotLeads = allLeads.filter(
      (l) => l.statut_email === "replied" || l.statut_email === "clicked"
    );
    repliedCount = allLeads.filter((l) => l.statut_email === "replied").length;
  } catch {
    error = true;
  }
  const avgOpen = campaigns.length
    ? Math.round(campaigns.reduce((s, c) => s + parseFloat(c.taux_ouverture || "0"), 0) / campaigns.length)
    : 0;
  const topCampaigns = [...campaigns]
    .sort((a, b) => parseInt(b.total_leads_qualified || "0") - parseInt(a.total_leads_qualified || "0"))
    .slice(0, 3);

  return (
    <div className="p-8">
      {/* Eyebrow + Title */}
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-orange-500 mb-1">Accueil</p>
        <h1 className="text-3xl font-bold text-white">Dashboard principal</h1>
        <p className="text-zinc-500 text-sm mt-1">Pipeline de prospection automatisé Kames AI</p>
      </div>

      {/* Leads chauds */}
      {hotLeads.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-orange-500 mb-3">
            🔥 À traiter maintenant — {hotLeads.length} lead{hotLeads.length > 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {hotLeads.map((lead) => (
              <Link
                key={lead.lead_id}
                href={`/dashboard/campaigns/${lead.campaign_id}/leads/${lead.lead_id}`}
                className="flex items-center justify-between bg-zinc-950 border border-orange-500/30 rounded-xl px-5 py-3 hover:border-orange-500/60 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    lead.statut_email === "replied"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-green-400/20 text-green-300"
                  }`}>
                    {lead.statut_email === "replied" ? "✅ Répondu" : "🖱 Cliqué"}
                  </span>
                  <span className="text-white text-sm font-medium group-hover:text-orange-400 transition-colors">
                    {lead.nom}
                  </span>
                  <span className="text-zinc-500 text-xs">{lead.ville} · {lead.poste}</span>
                </div>
                <span className="text-zinc-600 text-xs group-hover:text-zinc-400 transition-colors">→ Voir la fiche</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Google Sheets not configured */}
      {error && (
        <div className="mb-6 border border-zinc-700 bg-zinc-900/50 rounded-lg px-4 py-3">
          <p className="text-zinc-400 text-sm">⚠️ Google Sheets non configuré — renseigner les credentials dans <code className="text-orange-400 text-xs">.env.local</code></p>
        </div>
      )}

      {/* Top action */}
      <div className="flex items-center justify-between mb-6">
        <div />
        <Link
          href="/dashboard/campaigns/new"
          className="group relative inline-flex items-center justify-center"
        >
          <span className="pointer-events-none absolute inset-x-5 inset-y-1.5 rounded-full bg-orange-500/30 blur-xl transition-opacity duration-300 group-hover:opacity-90" />
          <span className="relative inline-flex rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-white p-[1px]">
            <span className="inline-flex min-w-[170px] items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors duration-300 group-hover:text-zinc-100">
              Nouvelle campagne
            </span>
          </span>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Campagnes",    value: campaigns.length, sub: "au total" },
          { label: "Emails reçus", value: repliedCount,     sub: `${repliedCount} à répondre` },
          { label: "Taux ouverture", value: `${avgOpen}%`,  sub: "moyenne globale" },
          { label: "RDV obtenus",  value: 0,                sub: "Google Calendar — bientôt" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
            <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-3">{kpi.label}</p>
            <p className="text-3xl font-bold text-white">{kpi.value}</p>
            <p className="text-zinc-600 text-xs mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Campaign list — top 3 */}
      {campaigns.length === 0 ? (
        <div className="text-center py-24 text-zinc-600">
          <p className="text-base mb-4">Aucune campagne créée</p>
          <Link
            href="/dashboard/campaigns/new"
            className="group relative inline-flex items-center justify-center"
          >
            <span className="pointer-events-none absolute inset-x-5 inset-y-1.5 rounded-full bg-orange-500/30 blur-xl transition-opacity duration-300 group-hover:opacity-90" />
            <span className="relative inline-flex rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-white p-[1px]">
              <span className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors duration-300 group-hover:text-zinc-100">
                Créer votre première campagne
              </span>
            </span>
          </Link>
        </div>
      ) : (
        <>
        <div className="space-y-2">
          {topCampaigns.map((c) => {
            const status = STATUS_CONFIG[c.statut] ?? STATUS_CONFIG.paused;
            return (
              <Link
                key={c.campaign_id}
                href={`/dashboard/campaigns/${c.campaign_id}`}
                className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-4 hover:border-zinc-600 transition-colors group"
              >
                {/* Left: status dot + name */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${status.dot}`} />
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm group-hover:text-orange-400 transition-colors">{c.nom}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      Automatisation IA · {c.secteur} · {c.localisation}
                    </p>
                  </div>
                </div>

                {/* Right: funnel + rate stats + status tag */}
                <div className="flex items-center gap-6 shrink-0 ml-4">
                  <FunnelBar
                    raw={parseInt(c.total_leads_raw) || 0}
                    qualified={parseInt(c.total_leads_qualified) || 0}
                    contacted={parseInt(c.emails_envoyés) || 0}
                    replied={Math.round(parseFloat(c.taux_réponse) * parseInt(c.emails_envoyés) / 100) || 0}
                  />
                  {[
                    { label: "Ouverture", value: `${c.taux_ouverture}%` },
                    { label: "Réponse",   value: `${c.taux_réponse}%` },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <p className="text-white font-semibold text-sm">{stat.value}</p>
                      <p className="text-zinc-500 text-xs">{stat.label}</p>
                    </div>
                  ))}
                  <span className={`ml-2 text-xs px-2.5 py-1 rounded-full font-medium ${
                    c.statut === "generating"
                      ? "bg-blue-500/20 text-blue-400"
                      : c.statut === "active"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {status.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}
