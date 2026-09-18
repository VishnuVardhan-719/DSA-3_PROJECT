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

test('mobile navigation starts on the visible menu control and restores focus when closed', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/overview', { waitUntil: 'domcontentloaded' })

  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused()
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await expect(page.getByRole('button', { name: 'Close navigation' })).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused()
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toHaveCount(0)
})

test('records review evidence and restores an archived clause', async ({ page }) => {
  await page.goto('/review-queue', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Approve' }).first().click()
  await page.getByLabel('Decision notes').fill('Approved after verifying the supporting clause evidence.')
  await page.getByLabel('Decided by').fill('Anita Rao')
  await page.getByRole('button', { name: 'Record decision' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await page.goto('/contracts/CTR-001', { waitUntil: 'domcontentloaded' })
  await page.getByRole('tab', { name: 'Clauses' }).click()
  await page.getByRole('button', { name: 'Archive clause' }).first().click()
  await page.getByRole('dialog').getByRole('button', { name: 'Archive clause' }).click()
  await expect(page.getByRole('button', { name: 'Restore clause' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Restore clause' }).first().click()
  await page.getByRole('dialog').getByRole('button', { name: 'Restore clause' }).click()
  await expect(page.getByRole('button', { name: 'Archive clause' }).first()).toBeVisible()
})

test('creates, versions, imports, archives, and restores a contract', async ({ page }) => {
  const name = 'Playwright Infrastructure Agreement'
  await page.goto('/contracts', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /add contract/i }).click()
  await page.getByLabel('Contract name').fill(name)
  await page.getByLabel('Counterparty').fill('Northwind Infrastructure')
  await page.getByLabel('Owner').fill('Legal Operations')
  await page.getByLabel('Effective date').fill('2026-10-01')
  await page.getByLabel('Expiry date').fill('2027-10-01')
  await page.getByRole('button', { name: 'Create contract' }).click()
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible()

  await page.getByRole('button', { name: 'Create version' }).click()
  await page.getByLabel('Version label').fill('v1.0')
  await page.getByLabel('Effective date').fill('2026-10-01')
  await page.getByLabel('Author').fill('Legal Operations')
  await page.getByLabel('Title').fill('Service Scope')
  await page.getByLabel('Text').fill('The supplier will provide managed infrastructure services.')
  await page.getByRole('dialog').getByRole('button', { name: 'Create version' }).click()
  await expect(page.getByText('v1.0').first()).toBeVisible()

  await page.getByRole('button', { name: 'Import document' }).click()
  await page.getByLabel('Version label').fill('v2.0')
  await page.getByLabel('Effective date').fill('2026-11-01')
  await page.getByLabel('Author').fill('Legal Operations')
  await page.getByLabel('Source document').setInputFiles('e2e/fixtures/agreement.txt')
  await page.getByRole('dialog').getByRole('button', { name: 'Import version' }).click()
  await expect(page.getByText('v2.0').first()).toBeVisible()

  await page.getByRole('button', { name: 'Archive' }).click()
  await expect(page.getByRole('dialog')).toContainText('can be restored')
  await page.getByRole('dialog').getByRole('button', { name: 'Archive contract' }).click()
  await expect(page.getByRole('heading', { name: 'Contracts', level: 1 })).toBeVisible()
  await page.getByText('Show archived').click()
  await page.getByLabel('Search contracts').fill(name)
  await expect(page.getByText(name)).toBeVisible()
  await page.getByLabel(`Select ${name}`).check()
  await page.getByLabel('Bulk action').selectOption('restore')
  await page.getByRole('button', { name: 'Apply' }).click()
  await expect(page.getByText(name)).toBeVisible()
})
