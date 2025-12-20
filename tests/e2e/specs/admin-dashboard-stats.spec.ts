import { expect, test } from '@playwright/test'

test.describe('Admin Dashboard - Statistics and Unread Messages', () => {
  test.beforeEach(async ({ page }) => {
    // Login to admin dashboard
    await page.goto('/admin/login')
    await page.getByLabel('メールアドレス').fill('admin@backtech.co.jp')
    await page.getByLabel('パスワード').fill('password')
    await page.getByRole('button', { name: 'ログイン' }).click()
    await page.waitForURL('/admin/dashboard')
  })
})
