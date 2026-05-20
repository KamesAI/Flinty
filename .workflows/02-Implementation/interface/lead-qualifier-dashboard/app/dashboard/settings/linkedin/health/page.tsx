import Link from "next/link";
import { AlertTriangle, ArrowLeft, ShieldCheck } from "lucide-react";
import {
  getLatestLinkedInHealth,
  getLinkedInHealthHistory,
  type LinkedInHealthHistoryRow,
  type LinkedInHealthRow,
} from "@/lib/sheets";
import { isLinkedInAcceptRateWarning } from "@/lib/li-health";

export const dynamic = "force-dynamic";

function toRate(value: string) {
  const raw = Number(value);
  if (!Number.isFinite(raw)) return 0;
  return raw > 1 ? raw / 100 : raw;
}

function buildFallbackHistory(latest: LinkedInHealthRow | null): LinkedInHealthHistoryRow[] {
  if (!latest) return [];
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(latest.last_check_at || Date.now());
    date.setDate(date.getDate() - (6 - index));
    return {
      ...latest,
      last_check_at: date.toISOString(),
      invites_sent_7d: index === 6 ? "0" : "",
      invites_accepted_7d: index === 6 ? "0" : "",
    };
  });
}

function statusTone(status: string) {
  if (status === "active") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  return "border-red-200 bg-red-50 text-red-950";
}

const STATUS_MESSAGES: Record<string, { message: string; ttlDays: number }> = {
  paused_captcha: { message: "Captcha LinkedIn détecté", ttlDays: 1 },
  paused_warning: { message: "Alerte LinkedIn activité inhabituelle", ttlDays: 14 },
  paused_low_accept: { message: "Taux d'acceptation <20%", ttlDays: 7 },
  paused_follow_mode: { message: "Mode Suivre détecté", ttlDays: 7 },
};

function getStatusLabel(status: string) {
  return STATUS_MESSAGES[status]?.message ?? "Compte LinkedIn en pause";
}

function formatEta(status: string, pauseStartedAt?: string) {
  const info = STATUS_MESSAGES[status];
  if (!info || !pauseStartedAt) return "reprise en attente";
  const start = new Date(pauseStartedAt).getTime();
  if (!Number.isFinite(start)) return "reprise en attente";
  const hours = Math.ceil(Math.max(0, start + info.ttlDays * 86_400_000 - Date.now()) / 3_600_000);
  if (hours <= 0) return "reprise imminente";
  if (hours < 48) return `reprise dans ${hours}h`;
  return `reprise dans ${Math.ceil(hours / 24)} jours`;
}

function AcceptRateChart({ rows }: { rows: LinkedInHealthHistoryRow[] }) {
  return (
    <div className="flex h-40 items-end gap-1 border-b border-slate-200 pt-4">
      {rows.map((row, index) => {
        const rate = toRate(row.acceptance_rate_7d);
        const height = Math.max(6, Math.round(rate * 140));
        const color = rate >= 0.35 ? "bg-emerald-500" : rate >= 0.2 ? "bg-amber-400" : "bg-red-500";
        return (
          <div key={`${row.last_check_at}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div
              className={`w-full rounded-t ${color}`}
              style={{ height }}
              title={`${Math.round(rate * 100)}% - ${new Date(row.last_check_at).toLocaleDateString("fr-FR")}`}
            />
          </div>
        );
      })}
    </div>
  );
}

function InvitesChart({ rows }: { rows: LinkedInHealthHistoryRow[] }) {
  const max = Math.max(1, ...rows.map((row) => Number(row.invites_sent_7d) || 0));
  return (
    <div className="flex h-32 items-end gap-1 border-b border-slate-200 pt-4">
      {rows.map((row, index) => {
        const sent = Number(row.invites_sent_7d) || 0;
        const height = Math.max(4, Math.round((sent / max) * 110));
        return (
          <div key={`${row.last_check_at}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t bg-[#006596]"
              style={{ height }}
              title={`${sent} invitations - ${new Date(row.last_check_at).toLocaleDateString("fr-FR")}`}
            />
          </div>
        );
      })}
    </div>
  );
}

export default async function LinkedInHealthPage() {
  const latest = await getLatestLinkedInHealth().catch(() => null);
  const historyFromSheets = await getLinkedInHealthHistory(latest?.account_id).catch(() => []);
  const history = historyFromSheets.length ? historyFromSheets : buildFallbackHistory(latest);
  const latestRate = toRate(latest?.acceptance_rate_7d ?? "");
  const warning = latest?.status === "active" && isLinkedInAcceptRateWarning(latestRate);

  return (
    <div className="max-w-5xl px-1 py-2 sm:px-2 sm:py-3">
      <Link
        href="/dashboard/settings/linkedin/connect"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#006596] hover:underline"
      >
        <ArrowLeft className="size-4" />
        Connexion LinkedIn
      </Link>

      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#006596]">
            Santé LinkedIn
          </p>
          <h1 className="font-flinty text-3xl font-extrabold tracking-tight text-black">
            Historique LI_Health
          </h1>
        </div>
        <div className={`rounded-lg border px-4 py-3 text-sm ${statusTone(latest?.status ?? "active")}`}>
          <p className="font-semibold">
            {latest?.status === "active" ? "Compte actif" : "Compte en pause"}
          </p>
          <p className="mt-1">
            {latest?.status && latest.status !== "active"
              ? `${latest.reason || getStatusLabel(latest.status)} - ${formatEta(latest.status, latest.pause_started_at)}`
              : "Dernier check prêt pour WF12"}
          </p>
        </div>
      </div>

      {warning ? (
        <div className="mb-5 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">Accept rate en zone orange</p>
            <p className="mt-1">Le taux 7j est à {Math.round(latestRate * 100)}%. Garder le pacing mais resserrer l'ICP avant de scaler.</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-950">Accept rate 7j</h2>
            <ShieldCheck className="size-5 text-[#006596]" />
          </div>
          {history.length ? <AcceptRateChart rows={history} /> : <EmptyChart />}
          <p className="mt-3 text-xs text-muted-foreground">
            Vert ≥35%, orange 20-35%, rouge &lt;20%.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-950">Invitations 7j</h2>
            <span className="text-xs font-semibold text-muted-foreground">30 derniers points</span>
          </div>
          {history.length ? <InvitesChart rows={history} /> : <EmptyChart />}
          <p className="mt-3 text-xs text-muted-foreground">
            WF12 remplira `LI_Health_History` à chaque run réel.
          </p>
        </section>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-40 items-center justify-center border-b border-dashed border-slate-200 text-sm text-muted-foreground">
      En attente des premiers runs WF12.
    </div>
  );
}
