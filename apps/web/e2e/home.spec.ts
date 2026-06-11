import { test, expect } from '@playwright/test';

test('digest preview renders the tracked-bid red-line', async ({ page }) => {
  await page.goto('/');

  // Masthead and the fixed digest section order.
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByRole('heading', { name: /deadline & amendment changes/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /new matches/i })).toBeVisible();

  // The W912DY amendment red-line: crimson deletion and green insertion.
  await expect(page.locator('del').first()).toBeVisible();
  await expect(page.locator('ins').first()).toBeVisible();

  // Invariant 3 surfaced: degraded monitoring is stated, never hidden.
  await expect(page.getByText(/monitoring degraded/i).first()).toBeVisible();
});
