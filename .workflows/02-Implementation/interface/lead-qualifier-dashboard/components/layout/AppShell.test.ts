import { describe, expect, it } from "vitest";
import { resolveShellMeta } from "./AppShell";

describe("resolveShellMeta", () => {
  it("retourne le bon titre pour la page campagnes", () => {
    expect(resolveShellMeta("/dashboard/campaigns")).toEqual({
      title: "Campagnes",
      eyebrow: "Campagnes",
      showPageHeader: false,
    });
  });

  it("masque l'en-tete shell sur la sous-page overview (header dans la page)", () => {
    expect(resolveShellMeta("/dashboard/campaigns/overview")).toEqual({
      title: "Campagnes",
      eyebrow: "Campagnes",
      showPageHeader: false,
    });
  });

  it("masque l'en-tete shell sur la sous-page suivi-detaille (header dans la page)", () => {
    expect(resolveShellMeta("/dashboard/campaigns/suivi-detaille")).toEqual({
      title: "Suivi détaillé",
      eyebrow: "Campagnes",
      showPageHeader: false,
    });
  });

  it("priorise les props explicites si elles sont fournies", () => {
    expect(
      resolveShellMeta("/dashboard/campaigns", "Titre custom", "Eyebrow custom"),
    ).toEqual({
      title: "Titre custom",
      eyebrow: "Eyebrow custom",
      showPageHeader: true,
    });
  });

  it("masque l'en-tete shell sur Configuration comme sur Campagnes", () => {
    expect(resolveShellMeta("/dashboard/templates")).toEqual({
      title: "Studio emailing",
      eyebrow: "Configuration",
      showPageHeader: false,
    });
  });

  it("masque l'en-tete shell sur les settings Calendly", () => {
    expect(resolveShellMeta("/dashboard/settings/calendly/connect")).toEqual({
      title: "Calendly",
      eyebrow: "Configuration",
      showPageHeader: false,
    });
  });

  it("masque l'en-tete shell sur Messagerie (en-tete dans la page)", () => {
    expect(resolveShellMeta("/dashboard/inbox")).toEqual({
      title: "Conversations",
      eyebrow: "Messagerie",
      showPageHeader: false,
    });
  });

  it("masque l'en-tete shell sur Calendrier", () => {
    expect(resolveShellMeta("/dashboard/meetings")).toEqual({
      title: "Rendez-vous à venir",
      eyebrow: "Calendrier",
      showPageHeader: false,
    });
  });

  it("masque l'en-tete shell sur Data", () => {
    expect(resolveShellMeta("/dashboard/data")).toEqual({
      title: "Tour de contrôle analytique",
      eyebrow: "Data",
      showPageHeader: false,
    });
  });
});
