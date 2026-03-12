import Link from "next/link";
import {
  buildMeetingWeekDays,
  getIsoWeekNumber,
  getMeetingSourceLabel,
  getMeetingStatusClasses,
  getMeetingStatusLabel,
  getWeekWindow,
  isMeetingWithinWindow,
  type Meeting,
} from "@/lib/meetings";
import { getMeetings, getSheetData, parseCampaigns, parseLeads } from "@/lib/sheets";

function formatDateTime(dateString: string, timeZone?: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timeZone || "Europe/Paris",
  }).format(date);
}

function getDayKey(dateString: string) {
  return new Date(dateString).toISOString().slice(0, 10);
}

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ campaign_id?: string; status?: string; week_start?: string }>;
}) {
  const { campaign_id, status, week_start } = await searchParams;

  let campaigns: Awaited<ReturnType<typeof parseCampaigns>> = [];
  let leads: Awaited<ReturnType<typeof parseLeads>> = [];
  let meetings: Meeting[] = [];
  let error = false;

  try {
    const [campaignRows, leadRows, allMeetings] = await Promise.all([
      getSheetData("Campagnes!A:L"),
      getSheetData("Leads_Qualified!A:P"),
      getMeetings(),
    ]);

    campaigns = parseCampaigns(campaignRows);
    leads = parseLeads(leadRows);
    meetings = allMeetings;
  } catch {
    error = true;
  }

  const weekWindow = getWeekWindow(week_start ? new Date(week_start) : new Date());
  const weekNumber = getIsoWeekNumber(week_start ? new Date(week_start) : new Date());
  const weekDays = buildMeetingWeekDays(week_start ? new Date(week_start) : new Date());
  const filteredMeetings = meetings
    .filter((meeting) => isMeetingWithinWindow(meeting, weekWindow))
    .filter((meeting) => (campaign_id ? meeting.campaign_id === campaign_id : true))
    .filter((meeting) => (status ? meeting.status === status : true))
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  const leadsById = new Map(leads.map((lead) => [lead.lead_id, lead]));
  const campaignsById = new Map(campaigns.map((campaign) => [campaign.campaign_id, campaign]));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekWindow.start);
    date.setUTCDate(weekWindow.start.getUTCDate() + index);
    return date;
  });

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-orange-500 mb-2">
            Meetings
          </p>
          <h1 className="text-3xl font-bold text-white">Rendez-vous à venir</h1>
          <p className="text-sm text-zinc-500 mt-2 max-w-3xl">
            Vue commerciale en lecture seule des rendez-vous Calendly reliés aux leads et campagnes.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3">
          <div className="mb-3">
            <span className="inline-flex h-8 items-center gap-2 rounded-full border border-amber-200/55 bg-[linear-gradient(180deg,#f9ca55_0%,#f0aa1f_60%,#da8200_100%)] px-3.5 text-[11px] font-medium text-amber-950 shadow-[inset_0_2px_0_rgba(255,246,202,0.65),inset_0_-2px_0_rgba(156,84,0,0.18),0_8px_18px_rgba(218,130,0,0.18)]">
              <span>Semaine {weekNumber}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {weekDays.map((day) => (
              <div key={day.isoDate} className="flex flex-col items-center gap-1">
                <span
                  className={`flex h-11 w-11 flex-col items-center justify-center rounded-full border text-white transition-colors ${
                    day.isCurrentDay
                      ? "border-orange-400/70 bg-gradient-to-b from-orange-400/25 to-orange-500/10 shadow-[0_0_0_4px_rgba(251,146,60,0.08)]"
                      : "border-zinc-800 bg-black"
                  }`}
                >
                  <span
                    className={`text-[9px] font-semibold uppercase leading-none ${
                      day.isCurrentDay ? "text-orange-300" : "text-zinc-500"
                    }`}
                  >
                    {day.weekdayInitial}
                  </span>
                  <span className="text-sm font-semibold leading-none mt-0.5">{day.dayNumber}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

<section className="grid gap-4 md:grid-cols-3">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
          <p className="text-xs font-semibold tracking-widest uppercase text-orange-400 mb-3">
            Cette semaine
          </p>
          <p className="text-3xl font-bold text-white">{filteredMeetings.length}</p>
          <p className="text-sm text-zinc-500 mt-1">rendez-vous visibles dans la vue</p>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
          <p className="text-xs font-semibold tracking-widest uppercase text-orange-400 mb-3">
            Planifiés
          </p>
          <p className="text-3xl font-bold text-white">
            {filteredMeetings.filter((meeting) => meeting.status === "scheduled").length}
          </p>
          <p className="text-sm text-zinc-500 mt-1">source prioritaire pour le suivi commercial</p>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
          <p className="text-xs font-semibold tracking-widest uppercase text-orange-400 mb-3">
            Campagnes reliées
          </p>
          <p className="text-3xl font-bold text-white">
            {new Set(filteredMeetings.map((meeting) => meeting.campaign_id).filter(Boolean)).size}
          </p>
          <p className="text-sm text-zinc-500 mt-1">campagnes avec au moins un rendez-vous</p>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm text-zinc-400">
            Impossible de lire Google Sheets pour le moment. Le module ne bloque pas l&apos;UI,
            mais aucun rendez-vous ne peut être affiché.
          </p>
        </div>
      ) : (
        <>
          <section className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-orange-400">Agenda hebdo</p>
                <p className="text-sm text-zinc-500 mt-1">
                  Pseudo-calendrier simple pour visualiser les rendez-vous de la semaine.
                </p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-7">
              {days.map((day) => {
                const dayKey = getDayKey(day.toISOString());
                const dayMeetings = filteredMeetings.filter(
                  (meeting) => getDayKey(meeting.start_at) === dayKey
                );

                return (
                  <div
                    key={day.toISOString()}
                    className="rounded-xl border border-zinc-800 bg-black p-3 min-h-[180px]"
                  >
                    <p className="text-[11px] uppercase tracking-widest text-zinc-500">
                      {new Intl.DateTimeFormat("fr-FR", {
                        weekday: "short",
                      }).format(day)}
                    </p>
                    <p className="text-sm font-semibold text-white mt-1">
                      {new Intl.DateTimeFormat("fr-FR", {
                        day: "2-digit",
                        month: "short",
                      }).format(day)}
                    </p>
                    <div className="mt-3 space-y-2">
                      {dayMeetings.length > 0 ? (
                        dayMeetings.map((meeting) => {
                          const lead = leadsById.get(meeting.lead_id);
                          return (
                            <div
                              key={meeting.meeting_id}
                              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2"
                            >
                              <p className="text-xs font-medium text-white">
                                {new Intl.DateTimeFormat("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  timeZone: meeting.timezone || "Europe/Paris",
                                }).format(new Date(meeting.start_at))}
                              </p>
                              <p className="text-xs text-zinc-300 mt-1 truncate">
                                {lead?.nom || meeting.attendee_name || "Prospect inconnu"}
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-zinc-600">Aucun RDV</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold tracking-widest uppercase text-orange-400">Liste des rendez-vous</p>
              <p className="text-sm text-zinc-500 mt-1">
                Vue détaillée avec contexte lead, campagne, statut et lien rapide.
              </p>
            </div>

            {filteredMeetings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-black px-5 py-8">
                <p className="text-sm text-zinc-400">
                  Aucun rendez-vous trouvé pour cette semaine. Le sheet `Meetings` a été prévu pour
                  accueillir les webhooks Calendly dès que l&apos;ingestion n8n sera branchée.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMeetings.map((meeting) => {
                  const lead = leadsById.get(meeting.lead_id);
                  const campaign = campaignsById.get(meeting.campaign_id);

                  return (
                    <div
                      key={meeting.meeting_id}
                      className="rounded-xl border border-zinc-800 bg-black px-5 py-4"
                    >
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-white">
                              {meeting.title || "Meeting Calendly"}
                            </p>
                            <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-300">
                              {getMeetingSourceLabel(meeting.source)}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] ${getMeetingStatusClasses(
                                meeting.status
                              )}`}
                            >
                              {getMeetingStatusLabel(meeting.status)}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-400 mt-2">
                            {formatDateTime(meeting.start_at, meeting.timezone)}
                          </p>
                          <p className="text-sm text-zinc-500 mt-1">
                            Prospect: {lead?.nom || meeting.attendee_name || "Inconnu"} · Campagne:{" "}
                            {campaign?.nom || meeting.campaign_id || "Non reliée"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          {meeting.booking_url ? (
                            <a
                              href={meeting.booking_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:text-white hover:border-zinc-500 transition-colors"
                            >
                              Ouvrir le booking
                            </a>
                          ) : null}
                          {meeting.lead_id ? (
                            <Link
                              href={`/dashboard/campaigns/${meeting.campaign_id}/leads/${meeting.lead_id}`}
                              className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                              Voir la fiche lead
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
