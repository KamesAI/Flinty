import Link from "next/link";
import { getSheetData, parseCampaigns, parseLeads, getLeadEmailEvents, getLeadMeetings } from "@/lib/sheets";
import { buildTimeline, getTimelineIcon, getTimelineChannelBadge } from "@/lib/timeline";
import { notFound } from "next/navigation";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ campaign_id: string; lead_id: string }>;
}) {
  const { campaign_id, lead_id } = await params;

  const [campRows, leadRows] = await Promise.all([
    getSheetData("Campagnes!A:L"),
    getSheetData("Leads_Qualified!A:P"),
  ]);

  const campaign = parseCampaigns(campRows).find((c) => c.campaign_id === campaign_id);
  const lead = parseLeads(leadRows).find((l) => l.lead_id === lead_id);
  if (!lead || !campaign) notFound();

  const [emailEvents, meetings] = await Promise.all([
    getLeadEmailEvents(lead_id),
    getLeadMeetings(lead_id),
  ]);

  const timeline = buildTimeline(emailEvents, meetings);

  const score = parseInt(lead.score);
  const scoreColor = score >= 70 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-zinc-400";

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
        <Link href="/dashboard" className="hover:text-white">Campagnes</Link>
        <span>/</span>
        <Link href={`/dashboard/campaigns/${campaign_id}`} className="hover:text-white">{campaign.nom}</Link>
        <span>/</span>
        <span className="text-white">{lead.nom}</span>
      </div>

      {/* Lead card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-orange-400 mb-1">{lead.secteur}</p>
            <h1 className="text-2xl font-bold text-white">{lead.nom}</h1>
            <p className="text-zinc-500 text-sm">{lead.secteur} · {lead.ville}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Score IA</p>
            <p className={`text-4xl font-bold ${scoreColor}`}>{lead.score}<span className="text-xl text-zinc-500">/100</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Contact", value: lead.prénom },
            { label: "Poste", value: lead.poste },
            { label: "Email", value: lead.email },
            { label: "Téléphone", value: lead.téléphone },
            { label: "Taille équipe", value: lead.taille_equipe },
            { label: "Services IA déjà", value: lead.has_ia_services === "true" ? "Oui" : "Non" },
            { label: "Statut email", value: lead.statut_email },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
              <p className="text-white text-sm">{value || "—"}</p>
            </div>
          ))}
          {lead.site && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Site web</p>
              <a href={lead.site} target="_blank" rel="noopener noreferrer" className="text-orange-400 text-sm hover:underline truncate block">
                {lead.site}
              </a>
            </div>
          )}
        </div>
      </div>


      {/* Timeline unifiée */}
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
              const formattedDate = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
              const formattedTime = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
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
                      <p className="text-zinc-500 text-xs mt-0.5">{formattedDate} à {formattedTime}</p>
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
