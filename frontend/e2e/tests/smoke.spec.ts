import { test, expect } from '@playwright/test';

test('smoke', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.waitForURL('/app');

  await page.getByRole('link', { name: 'Open Socket demo' }).click();
  await page.waitForURL('/socket-demo');

  await expect(
    page.getByRole('heading', { name: 'Socket.IO demo' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Public lobby' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Private room' }),
  ).toBeVisible();
});
