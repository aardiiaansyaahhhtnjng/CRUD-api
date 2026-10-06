import { test, expect } from '@playwright/test';

const TESTING_URL = 'http://localhost:3000/testing';
const PHOTOS_API_URL = 'https://jsonplaceholder.typicode.com/photos';

const createPhotos = (count) =>
  Array.from({ length: count }, (_, index) => {
    const id = index + 1;

    return {
      albumId: 1,
      id,
      title: `Photo ${id}`,
      url: `https://example.com/photo-${id}.jpg`,
      thumbnailUrl: `https://example.com/thumbnail-${id}.jpg`,
    };
  });

async function mockPhotosApi(page) {
  const apiCalls = [];

  await page.route(`${PHOTOS_API_URL}**`, async (route) => {
    const requestUrl = new URL(route.request().url());
    const limit = Number(requestUrl.searchParams.get('_limit') || 20);

    apiCalls.push({ method: route.request().method(), limit });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createPhotos(limit)),
    });
  });

  return apiCalls;
}

async function openTestingPage(page) {
  const apiCalls = await mockPhotosApi(page);
  const initialResponsePromise = page.waitForResponse((response) => {
    if (!response.url().startsWith(PHOTOS_API_URL)) return false;
    return new URL(response.url()).searchParams.get('_limit') === '20';
  });

  await page.goto(TESTING_URL);
  const initialResponse = await initialResponsePromise;

  await expect(page.getByRole('heading', { name: 'TESTING' })).toBeVisible();
  await expect(page.getByRole('row', { name: /Photo 1/ })).toBeVisible();

  return { apiCalls, initialResponse };
}

test.describe('Halaman TESTING', () => {
  test('API JSONPlaceholder mengembalikan data foto', async ({ request }) => {
    const response = await request.get(PHOTOS_API_URL, {
      params: { _limit: '1' },
      timeout: 15000,
    });

    expect(response.status()).toBe(200);

    const photos = await response.json();
    expect(photos).toHaveLength(1);
    expect(photos[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        title: expect.any(String),
        url: expect.any(String),
        thumbnailUrl: expect.any(String),
      })
    );
  });

  test('memuat halaman dan mengambil 20 foto dari API', async ({ page }) => {
    const { apiCalls, initialResponse } = await openTestingPage(page);
    const photos = await initialResponse.json();

    expect(initialResponse.status()).toBe(200);
    expect(apiCalls[0]).toEqual({ method: 'GET', limit: 20 });
    expect(photos).toHaveLength(20);
    await expect(page.getByRole('row')).toHaveCount(6);
    await expect(page.locator('.page-info')).toHaveText('Page 1 / 4');
  });

  test('menambahkan item baru melalui form', async ({ page }) => {
    await openTestingPage(page);

    await page.getByPlaceholder('Judul item').fill('Item baru');
    await page.getByPlaceholder('URL gambar').fill('https://example.com/new-image.jpg');
    await page.getByRole('button', { name: 'Add item' }).click();

    await expect(page.getByText('Item baru', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Judul item')).toHaveValue('');
  });

  test('mengedit item yang dipilih', async ({ page }) => {
    await openTestingPage(page);

    const photoRow = page.getByRole('row').filter({
      has: page.getByText('Photo 1', { exact: true }),
    });
    await photoRow.getByRole('button', { name: 'Edit' }).click();

    await expect(page.getByRole('heading', { name: 'Edit item' })).toBeVisible();
    await page.getByPlaceholder('Judul item').fill('Photo 1 diperbarui');
    await page.getByPlaceholder('URL gambar').fill('https://example.com/updated.jpg');
    await page.getByPlaceholder('URL thumbnail (opsional)').fill('https://example.com/updated-thumb.jpg');
    await page.getByRole('button', { name: 'Update item' }).click();

    await expect(page.getByText('Photo 1 diperbarui', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tambah item baru' })).toBeVisible();
  });

  test('menghapus item dari daftar', async ({ page }) => {
    await openTestingPage(page);

    const photoRow = page.getByRole('row').filter({
      has: page.getByText('Photo 1', { exact: true }),
    });
    await photoRow.getByRole('button', { name: 'Delete' }).click();

    await expect(
      page.getByRole('row').filter({ has: page.getByText('Photo 1', { exact: true }) })
    ).toHaveCount(0);
  });

  test('tidak menambahkan item jika field wajib kosong', async ({ page }) => {
    await openTestingPage(page);

    await page.getByRole('button', { name: 'Add item' }).click();

    await expect(page.getByText('Photo 1', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tambah item baru' })).toBeVisible();
  });

  test('mencari item dan menampilkan empty state untuk hasil kosong', async ({ page }) => {
    await openTestingPage(page);
    const searchInput = page.getByRole('searchbox', { name: 'Cari post' });

    await searchInput.fill('Photo 18');
    await expect(page.getByText('Photo 18', { exact: true })).toBeVisible();
    await expect(page.locator('.page-info')).toHaveText('Page 1 / 1');

    await searchInput.fill('tidak-ada-hasil');
    await expect(page.getByText('Tidak ada post yang cocok dengan pencarian.')).toBeVisible();
    await expect(page.locator('.page-info')).toHaveText('Page 1 / 1');
  });

  test('pagination berpindah halaman dan pencarian mereset halaman', async ({ page }) => {
    await openTestingPage(page);

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.locator('.page-info')).toHaveText('Page 2 / 4');
    await expect(page.getByText('Photo 6', { exact: true })).toBeVisible();

    await page.getByRole('searchbox', { name: 'Cari post' }).fill('Photo 18');
    await expect(page.locator('.page-info')).toHaveText('Page 1 / 1');
    await expect(page.getByText('Photo 18', { exact: true })).toBeVisible();
  });

  test('Clear all mengosongkan daftar', async ({ page }) => {
    await openTestingPage(page);

    await page.getByRole('button', { name: 'Clear all' }).click();

    await expect(page.getByText('Belum ada data post.')).toBeVisible();
    await expect(page.locator('.page-info')).toHaveText('Page 1 / 1');
  });

  test('Refresh meminta 30 foto dan memperbarui daftar', async ({ page }) => {
    const apiCalls = await mockPhotosApi(page);
    await page.goto(TESTING_URL);
    await expect(page.getByRole('row', { name: /Photo 1/ })).toBeVisible();

    await page.getByRole('button', { name: 'Refresh' }).click();

    await expect.poll(() => apiCalls.some((call) => call.limit === 30)).toBe(true);
    await expect(page.getByRole('cell', { name: 'Photo 30' })).toHaveCount(0);
    await expect(page.locator('.page-info')).toHaveText('Page 1 / 6');
  });
});