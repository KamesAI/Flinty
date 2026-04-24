import Link from "next/link";
import { getCampaignById } from "@/lib/campaigns";
import { readChildSheet, getLeadEmailEvents, getLeadMeetings } from "@/lib/sheets";
import { buildTimeline, getTimelineIcon, getTimelineChannelBadge } from "@/lib/timeline";
import { notFound } from "next/navigation";
import CopyButton from "./CopyButton";

interface QualifiedLead {
  lead_id: string;
  campaign_id: string;
  nom: string;
  site: string;
  ville: string;
  score: string;
  score_reason: string;
  email: string;
  téléphone: string;
  prénom: string;
  poste: string;
  taille_equipe: string;
  has_ia_services: string;
  hiring_signals: string;
  growth_stage: string;
  buying_signal: string;
  personalized_hook: string;
  rejection_reason: string;
  secteur_détecté: string;
  signaux_supplémentaires: string;
  web_quality_score: string;
  web_quality_signals: string;
  statut_email: string;
}

function parseQualifiedLeads(rows: string[][]): QualifiedLead[] {
  return rows.map((r) => ({
    lead_id: r[0] ?? "",
    campaign_id: r[1] ?? "",
    nom: r[2] ?? "",
    site: r[3] ?? "",
    ville: r[4] ?? "",
    score: r[5] ?? "0",
    score_reason: r[6] ?? "",
    email: r[7] ?? "",
    téléphone: r[8] ?? "",
    prénom: r[9] ?? "",
    poste: r[10] ?? "",
    taille_equipe: r[11] ?? "",
    has_ia_services: r[12] ?? "",
    hiring_signals: r[13] ?? "",
    growth_stage: r[14] ?? "",
    buying_signal: r[15] ?? "",
    personalized_hook: r[16] ?? "",
    rejection_reason: r[17] ?? "",
    "secteur_détecté": r[18] ?? "",
    signaux_supplémentaires: r[19] ?? "",
    web_quality_score: r[20] ?? "",
    web_quality_signals: r[21] ?? "",
    statut_email: r[22] ?? "new",
  }));
}

const GROWTH_BADGE: Record<string, string> = {
  seed:        "bg-blue-500/20 text-blue-400 border border-blue-500/20",
  startup:     "bg-blue-500/20 text-blue-400 border border-blue-500/20",
  series_a:    "bg-purple-500/20 text-purple-400 border border-purple-500/20",
  series_b:    "bg-purple-500/20 text-purple-400 border border-purple-500/20",
  established: "bg-green-500/20 text-green-400 border border-green-500/20",
  mature:      "bg-green-500/20 text-green-400 border border-green-500/20",
  scale:       "bg-[#006596]/20 text-[#006596] border border-[#006596]/20",
};

function growthBadgeClass(stage: string): string {
  return GROWTH_BADGE[stage.toLowerCase()] ?? "bg-zinc-800 text-zinc-400 border border-zinc-700";
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  return "text-zinc-400";
}

function scoreBgColor(score: number): string {
  if (score >= 70) return "bg-green-500/10 border-green-500/20";
  if (score >= 50) return "bg-yellow-500/10 border-yellow-500/20";
  return "bg-zinc-800/50 border-zinc-700";
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ campaign_id: string; lead_id: string }>;
}) {
  const { campaign_id, lead_id } = await params;

  const resolved = await getCampaignById(campaign_id);
  if (!resolved) notFound();

  const { campaign, sheetId } = resolved;

  const [leadRows, emailEvents, meetings] = await Promise.all([
    readChildSheet(sheetId, "Leads_Qualified!A2:W"),
    getLeadEmailEvents(lead_id).catch(() => []),
    getLeadMeetings(lead_id).catch(() => []),
  ]);

  const leads = parseQualifiedLeads(leadRows);
  const lead = leads.find((l) => l.lead_id === lead_id);
  if (!lead) notFound();

  const timeline = buildTimeline(emailEvents, meetings);
  const score = parseInt(lead.score) || 0;
  const webQScore = parseInt(lead.web_quality_score) || 0;
  const webSignals = lead.web_quality_signals
    ? lead.web_quality_signals.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="p-4 sm:p-8 max-w-3xl space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/dashboard" className="hover:text-white transition-colors">Campagnes</Link>
        <span>/</span>
        <Link href={`/dashboard/campaigns/${campaign_id}`} className="hover:text-white transition-colors">
          {campaign.nom}
        </Link>
        <span>/</span>
        <span className="text-white">{lead.nom}</span>
      </div>

      {/* Header card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {lead["secteur_détecté"] && (
              <p className="text-xs font-semibold tracking-widest uppercase text-[#006596] mb-1">
                {lead["secteur_détecté"]}
              </p>
            )}
            <h1 className="text-2xl font-bold text-white truncate">{lead.nom}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {lead.site && (
                <a
                  href={lead.site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#006596] text-sm hover:underline truncate max-w-xs"
                >
                  {lead.site.replace(/^https?:\/\//, "")}
                </a>
              )}
              {lead.ville && (
                <span className="text-zinc-500 text-sm">{lead.ville}</span>
              )}
            </div>
          </div>
          <div className={`shrink-0 text-center px-4 py-2 rounded-xl border ${scoreBgColor(score)}`}>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-0.5">Score IA</p>
            <p className={`text-3xl font-bold ${scoreColor(score)}`}>
              {lead.score}
              <span className="text-sm text-zinc-500">/100</span>
            </p>
          </div>
        </div>
      </div>

      {/* Hook personnalisé */}
      {lead.personalized_hook && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-3">
            Hook personnalisé
          </p>
          <div className="flex items-start gap-3">
            <p className="text-white text-sm leading-relaxed flex-1 italic">
              &ldquo;{lead.personalized_hook}&rdquo;
            </p>
            <CopyButton text={lead.personalized_hook} />
          </div>
        </div>
      )}

      {/* Signaux d'achat */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">
          Signaux d&apos;achat
        </p>
        <div className="space-y-3">
          {lead.growth_stage && (
            <div className="flex items-start gap-3">
              <span className="text-xs text-zinc-500 uppercase tracking-widest w-28 shrink-0 pt-0.5">
                Maturité
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${growthBadgeClass(lead.growth_stage)}`}>
                {lead.growth_stage}
              </span>
            </div>
          )}
          {lead.buying_signal && (
            <div className="flex items-start gap-3">
              <span className="text-xs text-zinc-500 uppercase tracking-widest w-28 shrink-0 pt-0.5">
                Achat
              </span>
              <p className="text-white text-sm">{lead.buying_signal}</p>
            </div>
          )}
          {lead.hiring_signals && (
            <div className="flex items-start gap-3">
              <span className="text-xs text-zinc-500 uppercase tracking-widest w-28 shrink-0 pt-0.5">
                Recrutement
              </span>
              <p className="text-zinc-300 text-sm">{lead.hiring_signals}</p>
            </div>
          )}
          {lead.signaux_supplémentaires && (
            <div className="flex items-start gap-3">
              <span className="text-xs text-zinc-500 uppercase tracking-widest w-28 shrink-0 pt-0.5">
                Autres
              </span>
              <p className="text-zinc-400 text-sm">{lead.signaux_supplémentaires}</p>
            </div>
          )}
        </div>
      </div>

      {/* Qualité web */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500">
            Qualité web
          </p>
          <span className={`text-lg font-bold ${scoreColor(webQScore)}`}>
            {webQScore}<span className="text-xs text-zinc-500">/100</span>
          </span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-4">
          <div
            className={`h-1.5 rounded-full transition-all ${
              webQScore >= 70 ? "bg-green-500" : webQScore >= 50 ? "bg-yellow-500" : "bg-zinc-600"
            }`}
            style={{ width: `${webQScore}%` }}
          />
        </div>
        {webSignals.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {webSignals.map((signal) => (
              <span
                key={signal}
                className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400"
              >
                {signal}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Raison du score */}
      {lead.score_reason && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-2">
            Analyse IA
          </p>
          <p className="text-zinc-300 text-sm leading-relaxed">{lead.score_reason}</p>
        </div>
      )}

      {/* Infos contact */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">
          Infos contact
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Contact", value: lead.prénom },
            { label: "Poste", value: lead.poste },
            { label: "Email", value: lead.email },
            { label: "Téléphone", value: lead.téléphone },
            { label: "Taille équipe", value: lead.taille_equipe },
            { label: "Services IA", value: lead.has_ia_services === "true" ? "Oui" : "Non" },
            { label: "Statut email", value: lead.statut_email },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
              <p className="text-white text-sm">{value || "—"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500">
            Timeline interactions
          </p>
          <span className="text-xs text-zinc-600">
            {timeline.length} événement{timeline.length !== 1 ? "s" : ""}
          </span>
        </div>
        {timeline.length === 0 ? (
          <p className="text-zinc-600 text-sm">Aucune interaction enregistrée.</p>
        ) : (
          <ol className="relative border-l border-zinc-800 ml-2 space-y-5">
            {timeline.map((item) => {
              const date = new Date(item.timestamp);
              const formattedDate = date.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              const formattedTime = date.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const icon = getTimelineIcon(item);
              const badge = getTimelineChannelBadge(item);
              return (
                <li key={item.id} className="ml-4">
                  <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-zinc-700 border border-zinc-600" />
                  <div className="flex items-start gap-3">
                    <span className="text-base leading-none mt-0.5">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white text-sm font-medium">{item.title}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${badge.classes}`}>
                          {badge.label}
                        </span>
                        {item.subtitle && (
                          <span className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                            {item.subtitle}
                          </span>
                        )}
                        {item.status && (
                          <span className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">
                            {item.status}
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {formattedDate} à {formattedTime}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
