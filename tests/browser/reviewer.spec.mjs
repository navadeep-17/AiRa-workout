import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

for(const width of [390,1280]){
 test(`reviewer tour ${width}px: meaningful choices, recovery and honest postcard`,async({page})=>{
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.setViewportSize({width,height:width<500?844:900});
  await page.goto('/');await page.locator('#studio').evaluate(e=>e.open=true);await page.getByRole('button',{name:'Open legacy v7 workout'}).click();
  await expect(page.getByRole('button',{name:/Explore the interactive preview/})).toBeVisible();
  await page.getByRole('button',{name:/Explore the interactive preview/}).click();
  await expect(page.getByLabel('Choose the next movement')).toBeVisible();
  await page.getByRole('button',{name:/Gentler path: Gentle weight shifts/}).click();
  await expect(page.locator('.move-next')).toContainText('Gentle weight shifts');
  await expect(page.locator('.move-scene')).toHaveClass(/has-adaptation/);
  const dir='test-results/reviewer-evidence';await mkdir(dir,{recursive:true});
  await page.screenshot({path:`${dir}/${width}-choice.png`,fullPage:true});
  await page.getByRole('button',{name:/Next: Explore recovery/}).click();
  await expect(page.locator('.move-scene')).toHaveAttribute('data-stage','recovery');
  await page.getByRole('button',{name:/Give me 10 more seconds/}).click();
  await page.screenshot({path:`${dir}/${width}-recovery.png`,fullPage:true});
  await page.getByRole('button',{name:/See your preview postcard/}).click();
  await expect(page.locator('.move-scene')).toHaveAttribute('data-stage','summary');
  await expect(page.locator('.move-stats')).toContainText('0 / 5');
  await expect(page.locator('.aira-postcard')).toContainText('preview');
  await page.screenshot({path:`${dir}/${width}-postcard.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}
