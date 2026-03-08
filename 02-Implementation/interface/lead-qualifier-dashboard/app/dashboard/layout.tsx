import Link from "next/link";
import { getSheetData, parseCampaigns, parseLeads } from "@/lib/sheets";
import { SidebarCampaignsGroup } from "./SidebarCampaignsGroup";


export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let campaigns: Awaited<ReturnType<typeof parseCampaigns>> = [];
  let hotLeadsCount = 0;
  try {
    const [campRows, leadRows] = await Promise.all([
      getSheetData("Campagnes!A:L"),
      getSheetData("Leads_Qualified!A:N"),
    ]);
    campaigns = parseCampaigns(campRows);
    const allLeads = parseLeads(leadRows);
    hotLeadsCount = allLeads.filter(
      (l) => l.statut_email === "replied" || l.statut_email === "clicked"
    ).length;
  } catch {
    // silently fail if no credentials configured yet
  }

  const activeCampaigns = campaigns.filter((c) => c.statut === "active" || c.statut === "generating");
  const otherCampaigns  = campaigns.filter((c) => c.statut !== "active" && c.statut !== "generating");

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="w-56 border-r border-zinc-800 flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
              K
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-none">Kames AI</p>
              <p className="text-zinc-500 text-xs mt-0.5">CRM Dashboard</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-1 border-b border-zinc-800">
          <Link
            href="/dashboard"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 text-sm transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0 bg-orange-500" />
              Dashboard
            </span>
            {hotLeadsCount > 0 && (
              <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold min-w-[18px] text-center leading-none">
                {hotLeadsCount}
              </span>
            )}
          </Link>
          <Link
            href="/dashboard/templates"
            className="flex items-center px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 text-sm transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0 bg-orange-500" />
              Templates
            </span>
          </Link>
        </nav>

        {/* Campaign list */}
        {campaigns.length > 0 && (
          <SidebarCampaignsGroup
            activeCampaigns={activeCampaigns}
            otherCampaigns={otherCampaigns}
          />
        )}

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 mt-auto">
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Google Sheets
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
