import Link from "next/link";
import { getSheetData, parseCampaigns, parseLeads } from "@/lib/sheets";
import { notFound } from "next/navigation";
import { ActionButtons } from "./ActionButtons";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  new:           { label: "Qualifié",     className: "bg-blue-500/20 text-blue-400" },
  contacted:     { label: "📨 J0 envoyé", className: "bg-zinc-700 text-zinc-300" },
  relance_1:     { label: "📨 J+3 envoyé",className: "bg-yellow-500/20 text-yellow-400" },
  relance_2:     { label: "📨 J+7 envoyé",className: "bg-orange-500/20 text-orange-400" },
  opened:        { label: "👁 Ouvert",    className: "bg-green-500/20 text-green-400" },
  clicked:       { label: "🖱 Cliqué",    className: "bg-green-400/20 text-green-300" },
  replied:       { label: "✅ Répondu",   className: "bg-emerald-500/20 text-emerald-400" },
  bounced:       { label: "❌ Rebond",    className: "bg-red-500/20 text-red-400" },
  disqualified:  { label: "Disqualifié",  className: "bg-zinc-800 text-zinc-500" },
};

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaign_id: string }>;
  searchParams: Promise<{ statut?: string; score?: string }>;
}) {
  const { campaign_id } = await params;
  const { statut: statutFilter = "all", score: scoreFilter = "all" } = await searchParams;

  const [campRows, leadRows] = await Promise.all([
    getSheetData("Campagnes!A:L"),
    getSheetData("Leads_Qualified!A:P"),
  ]);

  const campaigns = parseCampaigns(campRows);
  const campaign = campaigns.find((c) => c.campaign_id === campaign_id);
  if (!campaign) notFound();

  const allLeads = parseLeads(leadRows);
  const leads = allLeads.filter((l) => l.campaign_id === campaign_id);

  let filtered = leads;
  if (statutFilter !== "all") filtered = filtered.filter((l) => l.statut_email === statutFilter);
  if (scoreFilter === "70")   filtered = filtered.filter((l) => parseInt(l.score) >= 70);
  else if (scoreFilter === "50")  filtered = filtered.filter((l) => parseInt(l.score) >= 50);
  else if (scoreFilter === "low") filtered = filtered.filter((l) => parseInt(l.score) < 50);

  const contacted = leads.filter((l) => l.statut_email !== "new" && l.statut_email !== "disqualified").length;
  const opened = leads.filter((l) => ["opened", "clicked", "replied"].includes(l.statut_email)).length;
  const replied = leads.filter((l) => l.statut_email === "replied").length;
  const bounced = leads.filter((l) => l.statut_email === "bounced").length;

  return (
    <div className="p-4 sm:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
        <Link href="/dashboard" className="hover:text-white transition-colors">Campagnes</Link>
        <span>/</span>
        <span className="text-white">{campaign.nom}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">{campaign.nom}</h1>
          <p className="text-zinc-500 text-sm mt-1">{campaign.offre_kames} · {campaign.secteur} · {campaign.localisation}</p>
        </div>
        <ActionButtons campaignId={campaign_id} />
      </div>

      {/* Pipeline indicator */}
      {(() => {
        const hasRelance = leads.some(
          (l) => l.statut_email === "relance_1" || l.statut_email === "relance_2"
        );
        const steps = [
          { label: "Leads générés", done: parseInt(campaign.total_leads_raw) > 0 },
          { label: "Qualifiés",     done: parseInt(campaign.total_leads_qualified) > 0 },
          { label: "J0 envoyés",   done: parseInt(campaign.emails_envoyés) > 0 },
          { label: "Relances",     done: hasRelance },
        ];
        return (
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            {steps.map((step, i) => (
              <span key={step.label} className="flex items-center gap-2">
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                  step.done
                    ? "bg-green-500/20 text-green-400 border border-green-500/20"
                    : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                }`}>
                  {step.done ? "✅" : "⏳"} {step.label}
                </span>
                {i < steps.length - 1 && <span className="text-zinc-700 text-xs">→</span>}
              </span>
            ))}
          </div>
        );
      })()}

      {/* KPIs */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
        {[
          { label: "LEADS RAW",     value: campaign.total_leads_raw },
          { label: "QUALIFIÉS",     value: campaign.total_leads_qualified },
          { label: "CONTACTÉS",     value: contacted },
          { label: "OUVERTS",       value: opened },
          { label: "RÉPONSES",      value: replied },
          { label: "REBONDS",       value: bounced },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-1">{kpi.label}</p>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          {["all", "new", "contacted", "relance_1", "relance_2", "opened", "clicked", "replied", "bounced"].map((s) => (
            <a
              key={s}
              href={`?statut=${s}&score=${scoreFilter}`}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                statutFilter === s
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  : "bg-zinc-900 text-zinc-500 hover:text-white border border-transparent"
              }`}
            >
              {s === "all" ? "Tous" : s}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-zinc-600 text-xs mr-1">Score :</span>
          {[
            { value: "all", label: "Tous" },
            { value: "70",  label: "≥ 70" },
            { value: "50",  label: "≥ 50" },
            { value: "low", label: "< 50" },
          ].map((opt) => (
            <a
              key={opt.value}
              href={`?statut=${statutFilter}&score=${opt.value}`}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                scoreFilter === opt.value
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  : "bg-zinc-900 text-zinc-500 hover:text-white border border-transparent"
              }`}
            >
              {opt.label}
            </a>
          ))}
        </div>
        <span className="text-zinc-600 text-xs ml-auto">
          {filtered.length} lead{filtered.length > 1 ? "s" : ""}
          {filtered.length !== leads.length && ` sur ${leads.length}`}
        </span>
      </div>

      {/* Leads — mobile cards */}
      <div className="sm:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-8 text-center text-zinc-600 text-sm">
            Aucun lead pour ces filtres
          </div>
        ) : (
          filtered.map((lead) => {
            const badge = STATUS_BADGE[lead.statut_email] ?? STATUS_BADGE.new;
            const score = parseInt(lead.score);
            const scoreColor = score >= 70 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-zinc-400";
            return (
              <Link
                key={lead.lead_id}
                href={`/dashboard/campaigns/${campaign_id}/leads/${lead.lead_id}`}
                className="block bg-zinc-950 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-white font-medium text-sm">{lead.nom}</p>
                  <span className={`font-bold text-sm shrink-0 ${scoreColor}`}>{lead.score}/100</span>
                </div>
                <p className="text-zinc-500 text-xs mb-2">{lead.poste} · {lead.ville}</p>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${badge.className}`}>{badge.label}</span>
              </Link>
            );
          })
        )}
      </div>

      {/* Leads — desktop table */}
      <div className="hidden sm:block bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {["NOM", "VILLE", "POSTE", "TAILLE", "EMAIL", "SCORE", "STATUT"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-zinc-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-zinc-600">Aucun lead pour ces filtres</td>
              </tr>
            ) : (
              filtered.map((lead) => {
                const badge = STATUS_BADGE[lead.statut_email] ?? STATUS_BADGE.new;
                const score = parseInt(lead.score);
                const scoreColor = score >= 70 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-zinc-400";
                return (
                  <tr key={lead.lead_id} className="border-b border-zinc-900 hover:bg-zinc-900 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/campaigns/${campaign_id}/leads/${lead.lead_id}`} className="text-white hover:text-orange-400 transition-colors font-medium">
                        {lead.nom}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{lead.ville}</td>
                    <td className="px-4 py-3 text-zinc-400">{lead.poste}</td>
                    <td className="px-4 py-3 text-zinc-400">{lead.taille_equipe}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{lead.email}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${scoreColor}`}>{lead.score}/100</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.className}`}>{badge.label}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
