import Link from "next/link";
import { getCampaignById } from "@/lib/campaigns";
import {
  getLeadEmailEvents,
  getLeadMeetings,
  readChildQualifiedLeads,
  QUALIFIED_SHEET_RANGE_DATA_ROWS,
} from "@/lib/sheets";
import { parseQualifiedLeads } from "@/lib/qualified-leads";
import { buildTimeline, getTimelineIcon, getTimelineChannelBadge } from "@/lib/timeline";
import { notFound } from "next/navigation";
import CopyButton from "./CopyButton";

const GROWTH_BADGE: Record<string, string> = {
  seed:        "bg-blue-50 text-blue-700 border border-blue-200",
  startup:     "bg-blue-50 text-blue-700 border border-blue-200",
  series_a:    "bg-purple-50 text-purple-700 border border-purple-200",
  series_b:    "bg-purple-50 text-purple-700 border border-purple-200",
  established: "bg-green-50 text-green-700 border border-green-200",
  mature:      "bg-green-50 text-green-700 border border-green-200",
  scale:       "bg-[#006596]/10 text-[#006596] border border-[#006596]/20",
};

function growthBadgeClass(stage: string): string {
  return GROWTH_BADGE[stage.toLowerCase()] ?? "bg-zinc-100 text-zinc-600 border border-zinc-200";
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-zinc-500";
}

function scoreBgColor(score: number): string {
  if (score >= 70) return "bg-green-50 border-green-200";
  if (score >= 50) return "bg-yellow-50 border-yellow-200";
  return "bg-zinc-100 border-zinc-200";
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
    readChildQualifiedLeads(sheetId, campaign_id, QUALIFIED_SHEET_RANGE_DATA_ROWS),
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
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/dashboard" className="hover:text-zinc-900 transition-colors">Campagnes</Link>
        <span>/</span>
        <Link href={`/dashboard/campaigns/${campaign_id}`} className="hover:text-zinc-900 transition-colors">
          {campaign.nom}
        </Link>
        <span>/</span>
        <span className="text-zinc-900">{lead.societe}</span>
      </div>

      {/* Header card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {lead.secteur && (
              <p className="text-xs font-semibold tracking-widest uppercase text-[#006596] mb-1">
                {lead.secteur}
              </p>
            )}
            <h1 className="text-2xl font-bold text-zinc-900 truncate">{lead.societe}</h1>
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
                <span className="text-zinc-400 text-sm">{lead.ville}</span>
              )}
            </div>
          </div>
          <div className={`shrink-0 text-center px-4 py-2 rounded-xl border ${scoreBgColor(score)}`}>
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-0.5">Score IA</p>
            <p className={`text-3xl font-bold ${scoreColor(score)}`}>
              {lead.score}
              <span className="text-sm text-zinc-400">/100</span>
            </p>
          </div>
        </div>
      </div>

      {/* Hook personnalisé */}
      {lead.personalized_hook && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-3">
            Hook personnalisé
          </p>
          <div className="flex items-start gap-3">
            <p className="text-zinc-900 text-sm leading-relaxed flex-1 italic">
              &ldquo;{lead.personalized_hook}&rdquo;
            </p>
            <CopyButton text={lead.personalized_hook} />
          </div>
        </div>
      )}

      {/* Signaux d'achat */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-4">
          Signaux d&apos;achat
        </p>
        <div className="space-y-3">
          {lead.growth_stage && (
            <div className="flex items-start gap-3">
              <span className="text-xs text-zinc-400 uppercase tracking-widest w-28 shrink-0 pt-0.5">
                Maturité
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${growthBadgeClass(lead.growth_stage)}`}>
                {lead.growth_stage}
              </span>
            </div>
          )}
          {lead.buying_signal && (
            <div className="flex items-start gap-3">
              <span className="text-xs text-zinc-400 uppercase tracking-widest w-28 shrink-0 pt-0.5">
                Achat
              </span>
              <p className="text-zinc-900 text-sm">{lead.buying_signal}</p>
            </div>
          )}
          {lead.hiring_signals && (
            <div className="flex items-start gap-3">
              <span className="text-xs text-zinc-400 uppercase tracking-widest w-28 shrink-0 pt-0.5">
                Recrutement
              </span>
              <p className="text-zinc-700 text-sm">{lead.hiring_signals}</p>
            </div>
          )}
          {lead.web_quality_signals && (
            <div className="flex items-start gap-3">
              <span className="text-xs text-zinc-400 uppercase tracking-widest w-28 shrink-0 pt-0.5">
                Autres
              </span>
              <p className="text-zinc-500 text-sm">{lead.web_quality_signals}</p>
            </div>
          )}
        </div>
      </div>

      {/* Qualité web */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400">
            Qualité web
          </p>
          <span className={`text-lg font-bold ${scoreColor(webQScore)}`}>
            {webQScore}<span className="text-xs text-zinc-400">/100</span>
          </span>
        </div>
        <div className="w-full bg-zinc-200 rounded-full h-1.5 mb-4">
          <div
            className={`h-1.5 rounded-full transition-all ${
              webQScore >= 70 ? "bg-green-500" : webQScore >= 50 ? "bg-yellow-500" : "bg-zinc-400"
            }`}
            style={{ width: `${webQScore}%` }}
          />
        </div>
        {webSignals.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {webSignals.map((signal) => (
              <span
                key={signal}
                className="text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-600"
              >
                {signal}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Raison du score */}
      {lead.score_reason && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-2">
            Analyse IA
          </p>
          <p className="text-zinc-700 text-sm leading-relaxed">{lead.score_reason}</p>
        </div>
      )}

      {/* Infos contact */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-4">
          Infos contact
        </p>
        <div className="space-y-4">

          {/* Gérant */}
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Gérant</p>
            {(lead.prenom_gerant || lead.nom_gerant) ? (
              <p className="text-zinc-900 text-sm font-medium">
                {[lead.prenom_gerant, lead.nom_gerant].filter(Boolean).join(" ")}
              </p>
            ) : (
              <p className="text-zinc-400 text-sm">—</p>
            )}
            {lead.poste && (
              <p className="text-zinc-400 text-xs mt-0.5">{lead.poste}</p>
            )}
          </div>

          {/* Email gérant */}
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Email</p>
            {lead.email_gerant ? (
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-zinc-900 text-sm">{lead.email_gerant}</p>
                {lead.email_type === "nominatif_gerant" && lead.email_confidence === "high" && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                    Nominatif ✓
                  </span>
                )}
                {lead.email_type === "nominatif_gerant" && lead.email_confidence !== "high" && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[#006596]/10 text-[#006596] border border-[#006596]/20">
                    Nominatif
                  </span>
                )}
                {lead.email_type === "generic_contact" && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200">
                    Générique
                  </span>
                )}
                {lead.email_confidence === "low" && lead.email_type !== "generic_contact" && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-200">
                    À vérifier
                  </span>
                )}
                <CopyButton text={lead.email_gerant} />
              </div>
            ) : (
              <p className="text-zinc-400 text-sm">—</p>
            )}
          </div>

          {/* Téléphone */}
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Téléphone</p>
            {lead.téléphone ? (
              <div>
                <p className="text-zinc-900 text-sm">{lead.téléphone}</p>
                <p className="text-xs text-zinc-400 mt-0.5">Source : Google Maps — numéro général de l&apos;entreprise</p>
              </div>
            ) : (
              <p className="text-zinc-400 text-sm">—</p>
            )}
          </div>

          {/* Infos secondaires */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-zinc-100">
            {[
              { label: "Taille équipe", value: lead.taille_equipe },
              { label: "Services IA", value: lead.has_ia_services === "true" ? "Oui" : "Non" },
              { label: "Secteur", value: lead.secteur },
              { label: "Statut email", value: lead.statut_email },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-zinc-900 text-sm">{value || "—"}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400">
            Timeline interactions
          </p>
          <span className="text-xs text-zinc-400">
            {timeline.length} événement{timeline.length !== 1 ? "s" : ""}
          </span>
        </div>
        {timeline.length === 0 ? (
          <p className="text-zinc-400 text-sm">Aucune interaction enregistrée.</p>
        ) : (
          <ol className="relative border-l border-zinc-200 ml-2 space-y-5">
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
                  <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-zinc-300 border border-zinc-200" />
                  <div className="flex items-start gap-3">
                    <span className="text-base leading-none mt-0.5">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-zinc-900 text-sm font-medium">{item.title}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${badge.classes}`}>
                          {badge.label}
                        </span>
                        {item.subtitle && (
                          <span className="text-xs bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">
                            {item.subtitle}
                          </span>
                        )}
                        {item.status && (
                          <span className="text-xs bg-zinc-100 text-zinc-400 px-1.5 py-0.5 rounded">
                            {item.status}
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-400 text-xs mt-0.5">
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
