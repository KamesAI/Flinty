import { CampaignRow, type CampaignRowProps } from "./CampaignRow";
import { getCampaignRowThemeTokens } from "./campaign-row-theme";

const demoCampaigns: CampaignRowProps[] = [
  {
    href: "/dashboard/campaigns/demo-1",
    name: "Outbound SaaS Bordeaux",
    subtitle: "SaaS B2B · Fondateur · Bordeaux",
    status: "active",
    stats: {
      raw: 240,
      qualified: 86,
      contacted: 41,
      replies: 9,
    },
    openRate: 61,
    replyRate: 8.7,
    isGenerating: true,
  },
  {
    href: "/dashboard/campaigns/demo-2",
    name: "Cabinets RH Paris",
    subtitle: "Ressources humaines · Dirigeant · Paris",
    status: "active",
    stats: {
      raw: 180,
      qualified: 64,
      contacted: 28,
      replies: 6,
    },
    openRate: 48,
    replyRate: 5.2,
    isGenerating: false,
  },
  {
    href: "/dashboard/campaigns/demo-3",
    name: "Studios créa Lille",
    subtitle: "Agences créatives · Founder · Lille",
    status: "inactive",
    stats: {
      raw: 95,
      qualified: 24,
      contacted: 11,
      replies: 2,
    },
    openRate: 39,
    replyRate: 2.1,
    isGenerating: false,
  },
];

export function CampaignList({ campaigns = demoCampaigns }: { campaigns?: CampaignRowProps[] }) {
  const tokens = getCampaignRowThemeTokens();

  return (
    <section
      className="overflow-hidden rounded-3xl border"
      style={{
        borderColor: tokens.border,
        backgroundColor: tokens.surface,
      }}
    >
      <div>
        {campaigns.map((campaign) => (
          <CampaignRow key={campaign.href} {...campaign} />
        ))}
      </div>
    </section>
  );
}
