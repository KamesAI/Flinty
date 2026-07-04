import { CalendarCheck, Linkedin, Mail, Sparkles } from "lucide-react";
import type { Feature } from "@/lib/marketing-content";

function MockupFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="card-premium w-full p-4 sm:p-5" aria-hidden="true">
      {children}
    </div>
  );
}

function SetterMockup() {
  return (
    <MockupFrame>
      <div className="space-y-3 text-sm">
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-muted px-3.5 py-2.5 text-foreground">
          Intéressant, mais on a déjà un outil de prospection…
          <span className="mt-1 block text-[10px] text-muted-foreground">Marc · 14:02</span>
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-primary px-3.5 py-2.5 text-primary-foreground">
          Vous avez déjà un outil, donc changer maintenant n&apos;aurait aucun sens ?
          <span className="mt-1 block text-[10px] text-primary-foreground/70">Flinty · 14:04</span>
        </div>
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-muted px-3.5 py-2.5 text-foreground">
          Si, justement… il ne gère pas les réponses. Vous faites ça comment ?
          <span className="mt-1 block text-[10px] text-muted-foreground">Marc · 14:11</span>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          L&apos;AI Setter est en train d&apos;écrire…
        </p>
      </div>
    </MockupFrame>
  );
}

const INBOX_THREADS = [
  { icon: Linkedin, name: "Marc Lefèvre", preview: "Vous faites ça comment ?", badge: "En discussion", tone: "bg-primary/10 text-primary" },
  { icon: Mail, name: "Sophie Durand", preview: "Jeudi 10h me va très bien 👍", badge: "Créneau proposé", tone: "bg-warning/15 text-warning" },
  { icon: Mail, name: "Jules Renault", preview: "Invitation acceptée — à jeudi !", badge: "RDV booké", tone: "bg-success/15 text-success" },
];

function InboxMockup() {
  return (
    <MockupFrame>
      <div className="divide-y divide-border">
        {INBOX_THREADS.map((thread) => (
          <div key={thread.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <thread.icon className="h-4 w-4 text-muted-foreground" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{thread.name}</p>
              <p className="truncate text-xs text-muted-foreground">{thread.preview}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${thread.tone}`}>
              {thread.badge}
            </span>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

const SCORING_FIELDS = [
  { label: "Secteur", value: "Agence marketing B2B" },
  { label: "Effectif", value: "8 personnes" },
  { label: "Signal d'achat", value: "Recrute un SDR" },
  { label: "Décideur", value: "Fondatrice identifiée" },
];

function ScoringMockup() {
  return (
    <MockupFrame>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Studio Nova</p>
          <p className="text-xs text-muted-foreground">studionova.fr</p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-primary/20 bg-primary/5">
          <span className="text-base font-bold text-primary">87</span>
        </div>
      </div>
      <div className="space-y-2">
        {SCORING_FIELDS.map((field) => (
          <div key={field.label} className="flex items-center justify-between rounded-md bg-muted/60 px-3 py-2 text-xs">
            <span className="text-muted-foreground">{field.label}</span>
            <span className="font-medium text-foreground">{field.value}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">+ 10 autres champs enrichis par IA</p>
    </MockupFrame>
  );
}

const SEQUENCE_STEPS = [
  { day: "J0", icon: Mail, label: "Email d'ouverture personnalisé", status: "Envoyé", tone: "text-success" },
  { day: "J+3", icon: Linkedin, label: "Message LinkedIn de relance", status: "Envoyé", tone: "text-success" },
  { day: "J+7", icon: Mail, label: "Dernière relance email", status: "Planifié", tone: "text-muted-foreground" },
];

function SequencesMockup() {
  return (
    <MockupFrame>
      <div className="space-y-4">
        {SEQUENCE_STEPS.map((step, index) => (
          <div key={step.day} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                {step.day}
              </span>
              {index < SEQUENCE_STEPS.length - 1 && <span className="mt-1 h-6 w-px bg-border" />}
            </div>
            <div className="flex flex-1 items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-foreground">
                <step.icon className="h-3.5 w-3.5 text-muted-foreground" />
                {step.label}
              </div>
              <span className={`text-[10px] font-semibold ${step.tone}`}>{step.status}</span>
            </div>
          </div>
        ))}
        <p className="text-[11px] text-muted-foreground">
          Cadence humaine — la séquence s&apos;arrête dès qu&apos;une réponse arrive.
        </p>
      </div>
    </MockupFrame>
  );
}

function BookingMockup() {
  return (
    <MockupFrame>
      <div className="space-y-3 text-sm">
        <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-primary px-3.5 py-2.5 text-primary-foreground">
          Parfait ! Voici trois créneaux cette semaine, lequel vous arrange ?
        </div>
        <div className="flex flex-wrap gap-2">
          {["Mar. 14h00", "Jeu. 10h00", "Ven. 16h30"].map((slot, index) => (
            <span
              key={slot}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                index === 1
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {slot}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2.5 text-xs font-medium text-foreground">
          <CalendarCheck className="h-4 w-4 shrink-0 text-success" />
          RDV confirmé — jeudi 10h00, ajouté à votre agenda Calendly
        </div>
      </div>
    </MockupFrame>
  );
}

const KANBAN_COLUMNS = [
  { title: "Qualifié", count: 24, cards: ["Studio Nova · 87", "Cabinet Ry · 81"] },
  { title: "Contacté", count: 18, cards: ["Agence Lumo · 79"] },
  { title: "RDV booké", count: 6, cards: ["SaaS RH+ · 91", "Formalis · 84"] },
];

function KanbanMockup() {
  return (
    <MockupFrame>
      <div className="grid grid-cols-3 gap-3">
        {KANBAN_COLUMNS.map((col) => (
          <div key={col.title} className="rounded-lg bg-muted/60 p-2.5">
            <p className="mb-2 flex items-center justify-between text-[11px] font-semibold text-foreground">
              {col.title}
              <span className="rounded-full bg-card px-1.5 text-[10px] text-muted-foreground">{col.count}</span>
            </p>
            <div className="space-y-2">
              {col.cards.map((card) => (
                <div key={card} className="rounded-md border border-border bg-card p-2 text-[11px] text-foreground shadow-sm">
                  {card}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-xs">
        <span className="text-muted-foreground">Coût par RDV</span>
        <span className="font-bold tabular-nums text-primary">11,40 €</span>
      </div>
    </MockupFrame>
  );
}

const MOCKUPS: Record<Feature["mockup"], () => React.ReactNode> = {
  setter: SetterMockup,
  inbox: InboxMockup,
  scoring: ScoringMockup,
  sequences: SequencesMockup,
  booking: BookingMockup,
  kanban: KanbanMockup,
};

export function FeatureMockup({ kind }: { kind: Feature["mockup"] }) {
  const Mockup = MOCKUPS[kind];
  return <Mockup />;
}
