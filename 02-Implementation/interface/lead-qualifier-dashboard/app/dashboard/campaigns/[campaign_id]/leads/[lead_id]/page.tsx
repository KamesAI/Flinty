import Link from "next/link";
import { getSheetData, parseCampaigns, parseLeads } from "@/lib/sheets";
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

  const score = parseInt(lead.score);
  const scoreColor = score >= 70 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-zinc-400";

  return (
    <div className="p-8 max-w-3xl">
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

        <div className="grid grid-cols-2 gap-4">
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

      {/* Analyse Claude */}
      {lead.raison_score && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-6">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-3">Analyse Claude</p>
          <p className="text-white text-sm leading-relaxed">{lead.raison_score}</p>
          <p className="text-zinc-600 text-xs mt-3">
            Score : <span className={`font-bold ${scoreColor}`}>{lead.score}/100</span>
          </p>
        </div>
      )}

      {/* Email history */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">Historique emails</p>
        <p className="text-zinc-600 text-sm">Statut actuel : <span className="text-white">{lead.statut_email}</span></p>
        {lead.last_email_sent_at && (
          <p className="text-zinc-600 text-sm mt-1">Dernier email : <span className="text-white">{lead.last_email_sent_at}</span></p>
        )}
        <p className="text-zinc-700 text-xs mt-4">Timeline complète disponible après intégration de l&apos;onglet Email_Events.</p>
      </div>
    </div>
  );
}
