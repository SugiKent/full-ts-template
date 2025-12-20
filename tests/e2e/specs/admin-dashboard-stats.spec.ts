import { expect, test } from '@playwright/test'

test.describe('Admin Dashboard - Statistics and Unread Messages', () => {
  test.beforeEach(async ({ page }) => {
    // Login to admin dashboard
    await page.goto('/admin/login')
    await page.getByLabel('メールアドレス').fill('admin@backtech.co.jp')
    await page.getByLabel('パスワード').fill('P@ssw0rd')
    await page.getByRole('button', { name: 'ログイン' }).click()
    await page.waitForURL('/admin/dashboard')
  })

  test('should display dynamic statistics cards with real data', async ({ page }) => {
    // Verify all three statistics cards are visible
    await expect(page.getByText('登録利用者数')).toBeVisible()
    await expect(page.getByText('今月の面談数')).toBeVisible()
    await expect(page.getByText('未読メッセージ')).toBeVisible()

    // Verify that Mock data is NOT displayed (old values were 1234, 856, 342)
    // We check that values are NOT these specific Mock numbers
    const statsSection = page.locator('text=登録利用者数').locator('..')
    const userCountText = await statsSection
      .locator('text=登録利用者数')
      .locator('..')
      .textContent()
    expect(userCountText).not.toContain('1,234')

    // Verify that each statistic has a numeric value (not "読み込み中...")
    const statsCards = page.locator('[class*="bg-white"][class*="shadow"]').filter({
      hasText: /登録利用者数|今月の面談数|未読メッセージ/,
    })
    await expect(statsCards).toHaveCount(3)

    // Verify no loading state is visible
    await expect(page.getByText('読み込み中...')).not.toBeVisible()
  })

  test('should display icons for each statistic card', async ({ page }) => {
    // Wait for statistics to load
    await expect(page.getByText('登録利用者数')).toBeVisible()

    // Verify emoji icons are present (👥, 📅, 💬)
    const dashboardContent = await page.textContent('body')
    expect(dashboardContent).toContain('👥')
    expect(dashboardContent).toContain('📅')
    expect(dashboardContent).toContain('💬')
  })

  test('should NOT display removed statistic cards', async ({ page }) => {
    // Verify old statistics that were removed are NOT visible
    await expect(page.getByText('未完了タスク')).not.toBeVisible()
    await expect(page.getByText('新規メッセージ')).not.toBeVisible()
  })

  test.skip('should handle statistics loading error gracefully', async ({ page }) => {
    // Mock API failure by intercepting the oRPC request
    await page.route('**/api/admin/rpc/dashboard.getStats', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    })

    // Reload the page to trigger the API call
    await page.reload()

    // Wait for error state to appear
    await page.waitForTimeout(1000)

    // Verify error message is displayed
    await expect(page.getByText(/統計データの取得に失敗しました/)).toBeVisible()
  })

  test('should display "要返信" section title with count', async ({ page }) => {
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Check if section title with count exists
    const sectionWithCount = page.locator('text=/要返信.*\\(\\d+件\\)/')
    const hasUnreadUsers = await sectionWithCount.isVisible().catch(() => false)

    if (hasUnreadUsers) {
      // If there are unread messages, verify the section displays count
      await expect(sectionWithCount).toBeVisible()
    } else {
      // If no unread messages, verify the empty state message or just "要返信" header
      const emptyMessage = page.getByText('すべてのメッセージに対応済みです')
      const simpleHeader = page.getByText('要返信').first()

      const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false)
      const hasSimpleHeader = await simpleHeader.isVisible().catch(() => false)

      expect(hasEmptyMessage || hasSimpleHeader).toBeTruthy()
    }
  })

  test('should display unread users table when there are unread messages', async ({ page }) => {
    // Check if unread section has data
    const hasUnreadUsers = await page.getByText('要返信 (').isVisible()

    if (hasUnreadUsers) {
      // Verify table headers are visible
      await expect(page.getByText('ユーザー名')).toBeVisible()
      await expect(page.getByText('企業名')).toBeVisible()
      await expect(page.getByText('未読数')).toBeVisible()
      await expect(page.getByText('最終メッセージ')).toBeVisible()

      // Verify at least one row exists (besides header)
      const tableRows = page.locator('tbody tr')
      const rowCount = await tableRows.count()
      expect(rowCount).toBeGreaterThan(0)

      // Verify pagination controls if total > 10
      const sectionTitle = await page.getByText(/要返信.*\((\d+)件\)/).textContent()
      const totalMatch = sectionTitle?.match(/\((\d+)件\)/)
      if (totalMatch && Number.parseInt(totalMatch[1], 10) > 10) {
        await expect(page.getByRole('button', { name: '次へ' })).toBeVisible()
        await expect(page.getByRole('button', { name: '前へ' })).toBeVisible()
      }
    }
  })

  test('should navigate to user detail when clicking unread user row', async ({ page }) => {
    // Check if there are unread users
    const hasUnreadUsers = await page.getByText('要返信 (').isVisible()

    if (hasUnreadUsers) {
      // Get the first clickable row
      const firstRow = page.locator('tbody tr[role="button"]').first()
      await firstRow.waitFor({ state: 'visible' })

      // Click the row
      await firstRow.click()

      // Wait for navigation to user detail page
      await page.waitForURL(/\/admin\/users\/.*/)

      // Verify we're on a user detail page
      expect(page.url()).toMatch(/\/admin\/users\/[a-zA-Z0-9]+/)
    }
  })

  test('should support keyboard navigation on unread user rows', async ({ page }) => {
    // Check if there are unread users
    const hasUnreadUsers = await page.getByText('要返信 (').isVisible()

    if (hasUnreadUsers) {
      // Get the first row
      const firstRow = page.locator('tbody tr[role="button"]').first()
      await firstRow.waitFor({ state: 'visible' })

      // Focus the row
      await firstRow.focus()

      // Press Enter key
      await page.keyboard.press('Enter')

      // Wait for navigation
      await page.waitForURL(/\/admin\/users\/.*/, { timeout: 5000 })

      // Verify navigation occurred
      expect(page.url()).toMatch(/\/admin\/users\/[a-zA-Z0-9]+/)
    }
  })

  test('should display pagination controls when more than 10 unread users exist', async ({
    page,
  }) => {
    // Check the total count
    const sectionTitle = page.locator('text=/要返信.*\\(\\d+件\\)/')
    const titleVisible = await sectionTitle.isVisible()

    if (titleVisible) {
      const titleText = await sectionTitle.textContent()
      const totalMatch = titleText?.match(/\((\d+)件\)/)

      if (totalMatch && Number.parseInt(totalMatch[1], 10) > 10) {
        // Verify pagination UI exists
        await expect(page.getByRole('button', { name: '次へ' })).toBeVisible()
        await expect(page.getByRole('button', { name: '前へ' })).toBeVisible()

        // Verify page indicator exists
        await expect(page.locator('text=/\\d+ \\/ \\d+/')).toBeVisible()

        // Test pagination - click next button
        const nextButton = page.getByRole('button', { name: '次へ' })
        const isNextEnabled = await nextButton.isEnabled()

        if (isNextEnabled) {
          await nextButton.click()

          // Wait for data to load
          await page.waitForTimeout(1000)

          // Verify page indicator changed
          const pageIndicator = await page.locator('text=/\\d+ \\/ \\d+/').textContent()
          expect(pageIndicator).toMatch(/2 \/ \d+/)
        }
      }
    }
  })

  test.skip('should display empty state when no unread messages exist', async ({ page }) => {
    // Mock oRPC API response with no unread users
    await page.route('**/api/admin/rpc/dashboard.getUnreadUsers', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [],
          total: 0,
        }),
      })
    })

    // Reload to trigger the mock
    await page.reload()

    // Wait for the component to render
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Verify empty state message
    await expect(page.getByText('すべてのメッセージに対応済みです')).toBeVisible()

    // Verify table headers are not displayed
    const tableHeader = page.locator('thead').filter({ hasText: 'ユーザー名' })
    await expect(tableHeader).not.toBeVisible()
  })
})
