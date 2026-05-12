import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { KpiGrid } from "./KpiGrid";

describe("KpiGrid", () => {
  it("aligne les icones du dashboard sur la version Lovable", () => {
    const html = renderToStaticMarkup(
      <KpiGrid
        campaignsActive={2}
        qualifiedCount={14}
        avgOpenRate={38}
        meetingsCount={8}
        deltas={{
          campaignsActive: -1,
          qualifiedLeads: 2,
          openRate: 5.6,
          meetingsBooked: 1,
        }}
      />
    );

    expect(html).not.toContain('data-kpi-icon-variant="meetings"');
    expect(html).toContain("lucide-calendar-check");
    expect(html).toContain("size-8 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-inset ring-primary/20");
    expect(html).toContain("5.6%");
    expect(html).toContain("2");
  });
});
