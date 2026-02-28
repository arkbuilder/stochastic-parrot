import { expect, test } from '@playwright/test';

test('Two-island flow unlocks island 3 on overworld', async ({ page }) => {
  await page.goto('/');

  await page.waitForFunction(() => (window as { __dr_scene?: string }).__dr_scene === 'menu');

  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  if (!box) {
    throw new Error('Canvas bounding box is unavailable');
  }

  const toScreen = (gx: number, gy: number) => ({
    x: box.x + (gx / 240) * box.width,
    y: box.y + (gy / 400) * box.height,
  });

  const clickGame = async (gx: number, gy: number): Promise<void> => {
    const point = toScreen(gx, gy);
    await page.mouse.click(point.x, point.y);
  };

  await clickGame(120, 297);
  await page.waitForFunction(() => (window as { __dr_scene?: string }).__dr_scene === 'overworld');

  await clickGame(120, 367);
  await page.waitForFunction(() => (window as { __dr_scene?: string }).__dr_scene === 'island');

  await page.evaluate(() => {
    (window as { __dr_debug?: { completeEncoding: () => void } }).__dr_debug?.completeEncoding();
  });
  await page.waitForFunction(() => (window as { __dr_scene?: string }).__dr_scene === 'encounter');

  await page.evaluate(() => {
    (window as { __dr_debug?: { winEncounter: () => void } }).__dr_debug?.winEncounter();
  });
  await page.waitForFunction(() => (window as { __dr_scene?: string }).__dr_scene === 'reward');

  await clickGame(120, 336);
  await page.waitForFunction(() => (window as { __dr_scene?: string }).__dr_scene === 'overworld');

  await page.evaluate(() => {
    (window as { __dr_debug?: { sailToIsland: (islandId: string) => void } }).__dr_debug?.sailToIsland('island_02');
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

  await clickGame(120, 336);
  await page.waitForFunction(() => (window as { __dr_scene?: string }).__dr_scene === 'overworld');

  await page.evaluate(() => {
    (window as { __dr_debug?: { sailToIsland: (islandId: string) => void } }).__dr_debug?.sailToIsland('island_03');
  });
  await page.waitForFunction(() => (window as { __dr_scene?: string }).__dr_scene === 'island');
});
