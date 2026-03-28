import { test as setup } from '@playwright/test';
import { createUser } from '../../src/testing/data-generators';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  const user = createUser();

  await page.goto('/');
  await page.getByRole('button', { name: 'Create Poll' }).click();
  await page.waitForURL('/signin');
  await page.getByRole('link', { name: 'Sign up' }).click();

  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByLabel('Re-password').fill(user.password);
  await page.getByRole('button', { name: "Let's go" }).click();
  await page.waitForURL('/my-poll');

  await page.goto('/app/profile');
  await page.getByRole('button', { name: 'Open user menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await page.waitForURL(/\/signin/);

  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/my-poll');

  await page.context().storageState({ path: authFile });
});
