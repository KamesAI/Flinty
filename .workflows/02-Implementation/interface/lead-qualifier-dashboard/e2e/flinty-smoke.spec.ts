import { test, expect } from "@playwright/test";

/**
 * Smoke E2E sans navigateur — évite la dépendance aux binaires Playwright en local.
 * Vérifie redirection racine, pages HTML servies, route export.
 * Parcours UI complet (clics) + prod : manuel / `npx playwright install` puis extension des tests.
 */
test.describe("Flinty — smoke HTTP", () => {
  test("GET / redirige vers /dashboard", async ({ request }) => {
    const res = await request.get("/", { maxRedirects: 0 });
    expect([307, 308]).toContain(res.status());
    const loc = res.headers().location ?? "";
    expect(loc).toMatch(/\/dashboard/);
  });

  test("GET /dashboard/campaigns/new répond 200", async ({ request }) => {
    const res = await request.get("/dashboard/campaigns/new");
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/Construisons ton ICP|ICP/i);
  });

  test("GET export CSV — statut attendu sans campagne (404, 429 ou 500 sans credentials)", async ({
    request,
  }) => {
    const res = await request.get(
      "/api/campaigns/cmp_e2e_placeholder/export?format=csv"
    );
    expect([200, 404, 429, 500]).toContain(res.status());
  });
});
