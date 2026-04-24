import { describe, expect, it } from "vitest";
import { getMeetingCountTextClass } from "./UpcomingMeetingsCarousel";

describe("UpcomingMeetingsCarousel helpers", () => {
  it("garde le compteur blanc quand aucun rendez-vous n'est prevu", () => {
    expect(getMeetingCountTextClass(0)).toBe("text-white");
  });

  it("passe le compteur en orange quand au moins un rendez-vous existe", () => {
    expect(getMeetingCountTextClass(1)).toBe("text-[#006596]");
    expect(getMeetingCountTextClass(4)).toBe("text-[#006596]");
  });
});
