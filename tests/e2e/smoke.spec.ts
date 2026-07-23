import { expect, test } from "@playwright/test";

// Skip the first-run welcome modal so its overlay doesn't intercept clicks in these tests.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("pylearn-onboarded", "1"));
});

test("home renders the hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Learn Data/i })).toBeVisible();
  await expect(page.getByText(/Learning path/i)).toBeVisible();
});

test("runs SQL in the browser (boots PGlite end-to-end)", async ({ page }) => {
  await page.goto("/sql-playground");

  // The Run button is disabled until PGlite (Postgres WASM) finishes booting.
  const runBtn = page.getByRole("button", { name: /^Run$/ });
  await expect(runBtn).toBeEnabled({ timeout: 90_000 });
  await runBtn.click();

  // The default query returns a row per user — "Alice Smith" appears in the grid.
  await expect(page.getByText(/Alice Smith/)).toBeVisible({ timeout: 60_000 });
});

test("runs Python in a lesson (boots Pyodide end-to-end)", async ({ page }) => {
  await page.goto("/learn/basics/variables-and-types");

  // The first runnable block's Run button is disabled until Pyodide finishes booting.
  const runBtn = page.getByRole("button", { name: /^Run$/ }).first();
  await expect(runBtn).toBeEnabled({ timeout: 90_000 });
  await runBtn.click();

  // The snippet prints "Ada is 30 years old".
  await expect(page.getByText(/Ada is 30 years old/)).toBeVisible({ timeout: 60_000 });
});

test("challenge runner executes tests in the browser", async ({ page }) => {
  await page.goto("/learn/basics/variables-and-types");

  // The challenge's Submit button is disabled until Pyodide boots.
  const submit = page.getByRole("button", { name: /^Submit$/ });
  await expect(submit).toBeEnabled({ timeout: 90_000 });

  // Submitting the starter code (which returns None) runs the harness in Pyodide and
  // reports results — verifying buildHarness + execution + the results UI end-to-end.
  // (We avoid driving Monaco's editor here, which is flaky to type into in headless.)
  await submit.click();
  await expect(page.getByText(/\d \/ 3 tests passed/)).toBeVisible({ timeout: 60_000 });
});

test("roadmap shows the four-track learning path with progress", async ({ page }) => {
  await page.goto("/roadmap");

  await expect(page.getByRole("heading", { name: /Learning path/i })).toBeVisible();
  // All four stages render…
  await expect(page.getByRole("heading", { name: "Software Design" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Data Engineering" })).toBeVisible();
  // …and a fresh profile is placed at the first module.
  await expect(page.getByText(/You are here/i)).toBeVisible();
});

test("review queue serves flashcards and grades them", async ({ page }) => {
  await page.goto("/review");

  // Decks ship with the curriculum, so a fresh profile has due (new) cards.
  const card = page.getByRole("button", { name: /Reveal answer/i });
  await expect(card).toBeVisible();
  await card.click();

  // Flipping exposes the grading row; grading advances the session.
  const good = page.getByRole("button", { name: /Good/ });
  await expect(good).toBeVisible();
  await good.click();
  await expect(page.getByText(/1\/\d+ done/)).toBeVisible();
});

test("warehouse-seed lesson queries the star schema (seed switching end-to-end)", async ({
  page,
}) => {
  await page.goto("/learn/data-modeling/star-schemas");

  // The schema panel reflects the lesson's seed.
  await expect(page.getByText(/warehouse — \d+ tables/)).toBeVisible();

  // Run the star-join block: PGlite must load the warehouse seed and answer.
  const runBtn = page.getByRole("button", { name: /^Run$/ }).first();
  await expect(runBtn).toBeEnabled({ timeout: 90_000 });
  await runBtn.click();
  await expect(page.getByText(/Electronics/).first()).toBeVisible({ timeout: 60_000 });
});

test("user-driven visualizer records & animates frames", async ({ page }) => {
  await page.goto("/learn/dsa/sorting");

  // Scope to the user-viz card (the page also has several canned sorting widgets).
  const card = page.locator(".glass").filter({ hasText: "Animate your own sort" });
  const runBtn = card.getByRole("button", { name: /Run & animate/ });
  await expect(runBtn).toBeEnabled({ timeout: 90_000 });
  await runBtn.click();

  // After running, the recorded frames drive the bar animation + step controls.
  await expect(card.getByText(/Frame 1\//)).toBeVisible({ timeout: 60_000 });
});

test("reference page surfaces the PostgreSQL guide", async ({ page }) => {
  await page.goto("/reference");
  await expect(
    page.getByRole("heading", { name: /PostgreSQL — Complete Study Guide/ }),
  ).toBeVisible();
});

test("theme toggle switches to the light theme", async ({ page }) => {
  // Seed a known starting theme so the toggle's label is deterministic.
  await page.addInitScript(() => localStorage.setItem("pylearn-theme", "dark"));
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveClass(/light/);
  await page.getByRole("button", { name: /Switch to light theme/i }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
});
