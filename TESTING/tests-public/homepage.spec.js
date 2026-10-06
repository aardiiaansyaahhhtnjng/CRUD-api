import { test, expect } from '@playwright/test'

test ('cek heading', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page.getByRole('heading', { name: 'Buka halaman testing'})).toBeVisible();

    await page.getByRole('link', { name: 'Buka halaman testing'}).click();
    
    await page.route('/testing');

    await expect(page.getByRole('heading', { name: 'TESTING'})).toBeVisible();
})

test ('fetching API', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await page.getByRole('link', { name: 'Buka halaman testing'}).click();

    const jsonResponsePromise = page.waitForResponse((resp) =>
      resp.url().includes("/testing"),
    )

    await Promise.all([page.goto("/testing"), jsonResponsePromise])

    expect(await page.locator(".user-table-place").count()).toBeGreaterThan(90)



    // await page.route('/testing', async route => {
    //     await route.fulfill({
    //         json: {
    //             data: [{

    //             }]
    //         }
    //     })
    // })
})