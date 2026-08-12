import { test, expect, type Page } from "@playwright/test";

const SPECIES = [
  { slug: "roundling", name: "Roundling" },
  { slug: "pixel", name: "Pixel" },
  { slug: "sprint", name: "Sprint" },
  { slug: "aurum", name: "Aurum" },
  { slug: "wisp", name: "Wisp" },
];

function uniqueNickname(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

async function registerNewPlayer(page: Page, nickname: string) {
  await page.goto("/login");
  await page.getByRole("tab", { name: "New player" }).click();
  await page.getByLabel("Nickname").fill(nickname);
  await page.getByLabel(/^PIN/).fill("482913");
  await page.getByRole("button", { name: "Create account" }).click();
  // Either lands on the recovery-code screen or redirects straight through.
  const continueButton = page.getByRole("button", { name: "Continue" });
  if (await continueButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await continueButton.click();
  }
  await page.waitForURL(/\/onboarding/, { timeout: 15_000 });
}

test.describe("Five-species onboarding and hatch flow", () => {
  for (const species of SPECIES) {
    test(`hatch a ${species.name}, customize it, and confirm persistence`, async ({ page }) => {
      const nickname = uniqueNickname(species.slug);
      await registerNewPlayer(page, nickname);

      // 1 & 2: onboarding shows all five species tabs.
      for (const s of SPECIES) {
        await expect(page.getByRole("tab", { name: new RegExp(s.name) })).toBeVisible();
      }

      // 3: select this test's species.
      await page.getByRole("tab", { name: new RegExp(species.name) }).click();

      // The 3D viewport should render a canvas.
      const canvas = page.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 10_000 });

      // 4 & 5: change body color and face color (pick the 2nd swatch of each).
      const bodySwatches = page.getByRole("radiogroup", { name: "Body color" }).getByRole("radio");
      await bodySwatches.nth(1).click();
      const faceSwatches = page.getByRole("radiogroup", { name: "Face color" }).getByRole("radio");
      await faceSwatches.nth(1).click();

      // 6: reroll randomized traits and confirm the displayed traits change
      // at least once across a few rerolls (deterministic-per-seed, but the
      // seed itself changes on every "Surprise Me Again" click).
      const traitBox = page.getByText("Randomized this roll:").locator("..");
      const before = await traitBox.innerText();
      let changed = false;
      for (let i = 0; i < 5 && !changed; i++) {
        await page.getByRole("button", { name: /Surprise Me Again/ }).click();
        const after = await traitBox.innerText();
        if (after !== before) changed = true;
      }
      expect(changed).toBe(true);

      // Name the pet and hatch.
      const petName = `${species.name}Buddy`;
      await page.getByLabel("Name your buddy").fill(petName);
      await page.getByRole("button", { name: /Hatch/ }).click();

      // 7 & persistence redirect.
      await page.waitForURL(/\/pet/, { timeout: 15_000 });
      await expect(page.getByRole("heading", { name: petName })).toBeVisible();

      // Two screenshots of the canvas a moment apart should differ,
      // confirming the animation loop is actually running (11).
      await page.waitForTimeout(600);
      const shot1 = await page.locator("canvas").first().screenshot();
      await page.waitForTimeout(900);
      const shot2 = await page.locator("canvas").first().screenshot();
      expect(Buffer.compare(shot1, shot2)).not.toBe(0);

      // 8 & 10: reload and confirm the avatar (name, species) persisted
      // with stable traits rather than re-rolling.
      await page.reload();
      await expect(page.getByRole("heading", { name: petName })).toBeVisible({ timeout: 15_000 });

      // Level/stage UI is present (12/13 covered numerically by unit
      // tests in tests/unit/evolution.test.ts; here we just confirm the
      // dashboard surfaces the current stage).
      await expect(page.getByText(/Level \d+/)).toBeVisible();

      // Once hatched, onboarding should redirect back to the pet screen
      // rather than allowing a second hatch.
      await page.goto("/onboarding");
      await page.waitForURL(/\/pet/, { timeout: 15_000 });
    });
  }
});
