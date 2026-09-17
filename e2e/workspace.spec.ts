import { expect, test } from '@playwright/test'

const routes = [
  ['/overview', 'Overview'],
  ['/contracts', 'Contracts'],
  ['/clause-search', 'Clause Search'],
  ['/version-analysis', 'Version Analysis'],
  ['/similarity-clustering', 'Similarity'],
  ['/compliance-coverage', 'Compliance Coverage'],
  ['/reviewer-assignment', 'Reviewer Assignment'],
  ['/review-queue', 'Review Queue'],
  ['/audit-trail', 'Audit Trail'],
  ['/settings', 'Settings'],
] as const

test('all primary workspace routes render without an application error', async ({ page }) => {
  for (const [route, heading] of routes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: new RegExp(heading, 'i'), level: 1 })).toBeVisible()
    await expect(page.getByText('This view could not be displayed')).toHaveCount(0)
  }
})

test('contract register pagination opens a persisted contract record', async ({ page }) => {
  await page.goto('/contracts', { waitUntil: 'domcontentloaded' })
  const firstContract = page.locator('.contract-link').first()
  await expect(firstContract).toBeVisible()
  const name = (await firstContract.locator('strong').textContent())?.trim()
  await firstContract.click()
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: /download summary/i })).toBeEnabled()
})

test('contract creation dialog is usable and keyboard dismissible', async ({ page }) => {
  await page.goto('/contracts', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /add contract/i }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByLabel('Contract name')).toBeEditable()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
