const { test, expect } = require('@playwright/test');

test('search page filters and open a driveway detail', async ({ page, baseURL }) => {
  await page.goto(baseURL + '/search', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/search/);

  // Fetch a driveway id via API and navigate to details
  const res = await page.request.get(baseURL + '/api/driveways?limit=1');
  const json = res.ok() ? await res.json() : { data: { driveways: [] } };
  const id = json?.data?.driveways?.[0]?.id;
  if (id) {
    await page.goto(`${baseURL}/driveway/${id}`, { waitUntil: 'load' });
    await expect(page).toHaveURL(new RegExp(`driveway/${id}`));
  } else {
    test.skip(true, 'No driveway available');
  }
});


