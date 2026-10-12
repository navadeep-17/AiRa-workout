import {test,expect} from '@playwright/test';

test('new visitor sees meaningful movement plan while developer tools remain optional',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await expect(page.locator('#studio')).not.toHaveAttribute('open','');
 await page.getByRole('button',{name:/Make my session/}).click();
 await page.getByRole('button',{name:/See my plan/}).click();
 for(const name of ['Shoulder rolls','March in place','A breathing break','Side steps','Slow arm reach'])
  await expect(page.locator('.move-plan-list')).toContainText(name);
 await expect(page.locator('.move-plan-list')).toContainText('Lift one foot, then the other');
 await page.getByRole('button',{name:/Start .*session/}).click();
 await expect(page.locator('.move-scene')).toHaveAttribute('data-stage','settle');
 await expect(page.locator('.move-phase-title')).toHaveText('Shoulder rolls');
 await expect(page.getByRole('img',{name:'Line illustration for Shoulder rolls'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});

test('a lighter next move changes title, illustration, instructions and actual session summary',async({page})=>{
 await page.clock.install();await page.goto('/');
 await page.getByRole('button',{name:/Make my session/}).click();
 await page.getByRole('button',{name:/See my plan/}).click();
 await page.getByRole('button',{name:/Start .*session/}).click();
 await page.clock.fastForward(10_500);
 await page.getByRole('button',{name:/Continue to March in place/}).click();
 await page.getByRole('button',{name:'Make next flow lighter'}).click();
 await page.getByRole('button',{name:'View plan'}).click();
 await expect(page.locator('.move-overlay-panel')).toContainText('Gentle weight shifts');
 await page.getByRole('button',{name:'Close'}).click();
 await page.clock.fastForward(20_500);
 await page.getByRole('button',{name:/Continue to A breathing break/}).click();
 await page.getByRole('button',{name:/Give me 10 more seconds/}).click();
 await page.clock.fastForward(25_500);
 await page.getByRole('button',{name:/Continue to Gentle weight shifts/}).click();
 await expect(page.locator('.move-phase-title')).toHaveText('Gentle weight shifts');
 await expect(page.locator('.move-phase-note')).toContainText('Shift your weight softly');
 await expect(page.getByRole('img',{name:'Line illustration for Gentle weight shifts'})).toBeVisible();
 await page.clock.fastForward(12_500);
 await page.getByRole('button',{name:/Continue to Slow arm reach/}).click();
 await page.clock.fastForward(10_500);
 await page.getByRole('button',{name:/See my summary/}).click();
 await expect(page.locator('.move-scene')).toHaveAttribute('data-stage','summary');
 await expect(page.locator('.move-summary-detail')).toContainText('Gentle weight shifts');
 await expect(page.locator('.move-stats')).toContainText('1:17');
});