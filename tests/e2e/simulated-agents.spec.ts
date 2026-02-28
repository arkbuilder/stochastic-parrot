import { expect, test } from '@playwright/test';

test.setTimeout(90_000);

test('random tap agent does not crash runtime', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
  await page.waitForFunction(() => (window as { __dr_scene?: string }).__dr_scene === 'menu');

  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  if (!box) {
    throw new Error('Canvas bounding box unavailable');
  }

  const toScreen = (gx: number, gy: number) => ({
    x: box.x + (gx / 240) * box.width,
    y: box.y + (gy / 400) * box.height,
  });

  const start = toScreen(120, 297);
  await page.mouse.click(start.x, start.y);
  await page.waitForFunction(() => (window as { __dr_scene?: string }).__dr_scene === 'overworld');

  for (let index = 0; index < 300; index += 1) {
    const point = toScreen(Math.random() * 240, Math.random() * 400);
    await page.mouse.click(point.x, point.y);
    await page.waitForTimeout(20);
  }

  expect(pageErrors).toHaveLength(0);
  const scene = await page.evaluate(() => (window as { __dr_scene?: string }).__dr_scene);
  expect(scene).toBeTruthy();
});

test('idle agent remains stable without interaction', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
  await page.waitForFunction(() => (window as { __dr_scene?: string }).__dr_scene === 'menu');
  await page.waitForTimeout(6_000);

  expect(pageErrors).toHaveLength(0);
  const scene = await page.evaluate(() => (window as { __dr_scene?: string }).__dr_scene);
  expect(scene).toBe('menu');
});

test('perfect play debug path yields expert bonus reward', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as { __dr_scene?: string }).__dr_scene === 'menu');

  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  if (!box) {
    throw new Error('Canvas bounding box unavailable');
  }

  const toScreen = (gx: number, gy: number) => ({
    x: box.x + (gx / 240) * box.width,
    y: box.y + (gy / 400) * box.height,
  });

  const start = toScreen(120, 297);
  await page.mouse.click(start.x, start.y);
  await page.waitForFunction(() => (window as { __dr_scene?: string }).__dr_scene === 'overworld');

  await page.evaluate(() => {
    (window as { __dr_debug?: { sailToIsland: (id: string) => void } }).__dr_debug?.sailToIsland('island_01');
  });
  await page.waitForFunction(() => (window as { __dr_scene?: string }).__dr_scene === 'island');

  await page.evaluate(() => {
    (window as { __dr_debug?: { completeEncoding: () => void } }).__dr_debug?.completeEncoding();
  });
  await page.waitForFunction(() => (window as { __dr_scene?: string }).__dr_scene === 'encounter');

  await page.evaluate(() => {
    (window as { __dr_debug?: { winEncounter: () => void } }).__dr_debug?.winEncounter();
  });
  await page.waitForFunction(() => (window as { __dr_scene?: string }).__dr_scene === 'reward');

  const reward = await page.evaluate(() => (window as { __dr_lastReward?: { expertBonus: boolean; islandScore: number } }).__dr_lastReward);
  expect(reward?.expertBonus).toBe(true);
  expect((reward?.islandScore ?? 0) > 0).toBe(true);
});

test('always-wrong interaction pattern stays recoverable in encounter', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as { __dr_scene?: string }).__dr_scene === 'menu');

  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  if (!box) {
    throw new Error('Canvas bounding box unavailable');
  }

  const toScreen = (gx: number, gy: number) => ({
    x: box.x + (gx / 240) * box.width,
    y: box.y + (gy / 400) * box.height,
  });

  await page.mouse.click(toScreen(120, 297).x, toScreen(120, 297).y);
  await page.waitForFunction(() => (window as { __dr_scene?: string }).__dr_scene === 'overworld');

  await page.evaluate(() => {
    (window as { __dr_debug?: { sailToIsland: (id: string) => void } }).__dr_debug?.sailToIsland('island_01');
  });
  await page.waitForFunction(() => (window as { __dr_scene?: string }).__dr_scene === 'island');

  await page.evaluate(() => {
    (window as { __dr_debug?: { completeEncoding: () => void } }).__dr_debug?.completeEncoding();
  });
  await page.waitForFunction(() => (window as { __dr_scene?: string }).__dr_scene === 'encounter');

  const wrongTarget = toScreen(180, 260);
  for (let index = 0; index < 18; index += 1) {
    await page.mouse.click(wrongTarget.x, wrongTarget.y);
    await page.waitForTimeout(180);
  }

  const scene = await page.evaluate(() => (window as { __dr_scene?: string }).__dr_scene);
  expect(scene === 'encounter' || scene === 'reward').toBe(true);
});
