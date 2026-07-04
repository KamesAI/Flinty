import { describe, expect, it } from "vitest";
import { validateLoginForm, validateSignupForm } from "./auth-form-model";

describe("auth-form-model", () => {
  describe("validateLoginForm", () => {
    it("accepte un email et un mot de passe valides", () => {
      const result = validateLoginForm({ email: "thomas@kames.fr", password: "motdepasse" });
      expect(result.success).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("rejette un email invalide avec un message en français", () => {
      const result = validateLoginForm({ email: "pas-un-email", password: "motdepasse" });
      expect(result.success).toBe(false);
      expect(result.errors.email).toBe("Adresse email invalide");
    });

    it("rejette un mot de passe trop court", () => {
      const result = validateLoginForm({ email: "thomas@kames.fr", password: "court" });
      expect(result.success).toBe(false);
      expect(result.errors.password).toBe("8 caractères minimum");
    });

    it("cumule les erreurs champ par champ", () => {
      const result = validateLoginForm({ email: "", password: "" });
      expect(result.success).toBe(false);
      expect(result.errors.email).toBeDefined();
      expect(result.errors.password).toBeDefined();
    });
  });

  describe("validateSignupForm", () => {
    it("accepte nom + email + mot de passe valides", () => {
      const result = validateSignupForm({
        name: "Thomas",
        email: "thomas@kames.fr",
        password: "motdepasse",
      });
      expect(result.success).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("exige un nom non vide", () => {
      const result = validateSignupForm({ name: "", email: "thomas@kames.fr", password: "motdepasse" });
      expect(result.success).toBe(false);
      expect(result.errors.name).toBe("Votre nom est requis");
    });
  });
});
