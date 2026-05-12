import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CalendarCheck } from "lucide-react";
import { KpiCard } from "./KpiCard";

describe("KpiCard", () => {
  it("utilise le badge icone compact de la version Lovable", () => {
    const html = renderToStaticMarkup(
      <KpiCard
        label="Meetings bookés"
        value={8}
        delta={3}
        sublabel="sur la semaine"
        icon={CalendarCheck}
      />
    );

    expect(html).toContain('data-kpi-icon-variant="default"');
    expect(html).toContain("size-8 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-inset ring-primary/20");
  });

  it("rend une sparkline en ligne seule sans aplat de fond", () => {
    const html = renderToStaticMarkup(
      <KpiCard
        label="Meetings bookés"
        value={8}
        delta={3}
        sublabel="sur la semaine"
        icon={CalendarCheck}
        spark={[2, 2, 3, 4, 5, 8]}
      />
    );

    expect(html).toContain("<polyline");
    expect(html).not.toContain("<polygon");
  });
});
