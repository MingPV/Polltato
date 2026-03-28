import { test, expect } from '@playwright/test';

test('smoke', async ({ page }) => {
  await page.goto('/socket-demo');

  await expect(
    page.getByRole('heading', { name: 'Socket.IO demo' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Public lobby' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Private room' }),
  ).toBeVisible();
});
