import Link from "next/link";
import {
  buildMeetingWeekDays,
  getMeetingSourceLabel,
  getMeetingStatusClasses,
  getMeetingStatusLabel,
  getWeekWindow,
  isMeetingWithinWindow,
  type Meeting,
} from "@/lib/meetings";
import {
  getMeetings,
  readIndex,
  parseIndexCampaigns,
  getAllLeadsV3,
  indexCampaignToCampaign,
  type Campaign,
  type Lead,
} from "@/lib/sheets";

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

  let campaigns: Campaign[] = [];
  let leads: Lead[] = [];
  let meetings: Meeting[] = [];
  let error = false;

  try {
    const [indexRows, allMeetings] = await Promise.all([
      readIndex(),
      getMeetings(),
    ]);
    const indexCampaigns = parseIndexCampaigns(indexRows);
    campaigns = indexCampaigns.map(indexCampaignToCampaign);
    leads = await getAllLeadsV3(indexCampaigns);
    meetings = allMeetings;
  } catch {
    error = true;
  }

  const weekWindow = getWeekWindow(week_start ? new Date(week_start) : new Date());
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
    <div className="space-y-8 px-1 py-2 sm:px-2 sm:py-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-2xl flex-1">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Meetings
          </p>
          <h1 className="font-flinty text-3xl font-extrabold tracking-tight text-black">
            Rendez-vous à venir
          </h1>
          <div className="mt-3">
            <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
              Vue commerciale en lecture seule des rendez-vous Calendly reliés aux leads et campagnes.
            </p>
          </div>
        </div>
        <div className="rounded-[28px] border border-slate-200/70 bg-white/90 px-4 py-3 shadow-[0_2px_12px_rgba(15,23,42,0.05)] backdrop-blur-sm">
          <div className="flex items-center gap-2">
            {weekDays.map((day) => (
              <div key={day.isoDate} className="flex flex-col items-center gap-1">
                <span
                  className={`flex h-11 w-11 flex-col items-center justify-center rounded-full border transition-colors ${
                    day.isCurrentDay
                      ? "border-primary/25 bg-primary/8 text-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.08)]"
                      : "border-slate-200 bg-slate-50/80 text-slate-700"
                  }`}
                >
                  <span
                    className={`text-[9px] font-semibold uppercase leading-none ${
                      day.isCurrentDay ? "text-primary" : "text-slate-500"
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
        <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-5 shadow-[0_2px_12px_rgba(15,23,42,0.05)] backdrop-blur-sm">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">
            Cette semaine
          </p>
          <p className="text-3xl font-bold text-slate-900">{filteredMeetings.length}</p>
          <p className="mt-1 text-sm text-slate-500">rendez-vous visibles dans la vue</p>
        </div>
        <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-5 shadow-[0_2px_12px_rgba(15,23,42,0.05)] backdrop-blur-sm">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">
            Planifiés
          </p>
          <p className="text-3xl font-bold text-slate-900">
            {filteredMeetings.filter((meeting) => meeting.status === "scheduled").length}
          </p>
          <p className="mt-1 text-sm text-slate-500">source prioritaire pour le suivi commercial</p>
        </div>
        <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-5 shadow-[0_2px_12px_rgba(15,23,42,0.05)] backdrop-blur-sm">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">
            Campagnes reliées
          </p>
          <p className="text-3xl font-bold text-slate-900">
            {new Set(filteredMeetings.map((meeting) => meeting.campaign_id).filter(Boolean)).size}
          </p>
          <p className="mt-1 text-sm text-slate-500">campagnes avec au moins un rendez-vous</p>
        </div>
      </section>

      {error ? (
        <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_2px_12px_rgba(15,23,42,0.05)] backdrop-blur-sm">
          <p className="text-sm text-slate-500">
            Impossible de lire Google Sheets pour le moment. Le module ne bloque pas l&apos;UI,
            mais aucun rendez-vous ne peut être affiché.
          </p>
        </div>
      ) : (
        <>
          <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_2px_12px_rgba(15,23,42,0.05)] backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-primary">Agenda hebdo</p>
                <p className="mt-1 text-sm text-slate-500">
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
                    className="min-h-[180px] rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3"
                  >
                    <p className="text-[11px] uppercase tracking-widest text-slate-500">
                      {new Intl.DateTimeFormat("fr-FR", {
                        weekday: "short",
                      }).format(day)}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
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
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
                            >
                              <p className="text-xs font-medium text-slate-900">
                                {new Intl.DateTimeFormat("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  timeZone: meeting.timezone || "Europe/Paris",
                                }).format(new Date(meeting.start_at))}
                              </p>
                              <p className="mt-1 truncate text-xs text-slate-500">
                                {lead?.nom || meeting.attendee_name || "Prospect inconnu"}
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-400">Aucun RDV</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_2px_12px_rgba(15,23,42,0.05)] backdrop-blur-sm">
            <div className="mb-5">
              <p className="text-xs font-semibold tracking-widest uppercase text-primary">Liste des rendez-vous</p>
              <p className="mt-1 text-sm text-slate-500">
                Vue détaillée avec contexte lead, campagne, statut et lien rapide.
              </p>
            </div>

            {filteredMeetings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8">
                <p className="text-sm text-slate-500">
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
                      className="rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
                    >
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-slate-900">
                              {meeting.title || "Meeting Calendly"}
                            </p>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
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
                          <p className="mt-2 text-sm text-slate-500">
                            {formatDateTime(meeting.start_at, meeting.timezone)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
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
                              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
                            >
                              Ouvrir le booking
                            </a>
                          ) : null}
                          {meeting.lead_id ? (
                            <Link
                              href={`/dashboard/campaigns/${meeting.campaign_id}/leads/${meeting.lead_id}`}
                              className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-pink-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
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
