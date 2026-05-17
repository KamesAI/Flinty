import { NextResponse } from "next/server";
import { getAvailableSlots, formatSlotsNatural } from "@/lib/calendly";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventTypeUri =
    searchParams.get("event_type_uri") ?? process.env.CALENDLY_EVENT_TYPE_URI ?? "";
  const format = searchParams.get("format"); // "natural" → texte; sinon JSON
  const count = parseInt(searchParams.get("count") ?? "3", 10);

  if (!eventTypeUri) {
    return NextResponse.json(
      { error: "event_type_uri requis ou CALENDLY_EVENT_TYPE_URI non configuré" },
      { status: 400 }
    );
  }

  try {
    const slots = await getAvailableSlots(eventTypeUri, count);

    if (format === "natural") {
      const text = formatSlotsNatural(slots);
      return NextResponse.json({ text, slots });
    }

    return NextResponse.json({ slots });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
