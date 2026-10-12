import {test,expect} from '@playwright/test';

test('one scene voice and visible check-in adapt the future without resetting the current movement',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.clock.install();
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');await page.locator('#studio').evaluate(e=>e.open=true);await page.getByRole('button',{name:'Open legacy v7 workout'}).click();
 await page.getByRole('button',{name:/Make my session/}).click();
 await page.getByRole('button',{name:/See my plan/}).click();
 await page.getByRole('button',{name:/Start .*session/}).click();
 await page.clock.fastForward(10_500);
 await page.getByRole('button',{name:/Continue to March in place/}).click();
 await expect(page.locator('.aira-director')).toBeVisible();
 await expect(page.locator('.spoken')).toBeHidden();
 await expect(page.locator('.move-context-note')).toHaveCount(0);
 await expect(page.locator('.aira-checkin')).toContainText('Need something gentler?');
 const before=await page.locator('.move-dial-number').innerText();
 await page.locator('.aira-checkin').getByRole('button',{name:/Explore two paths/}).click();
 await expect(page.getByLabel('Choose the next movement')).toBeVisible();
 await page.getByRole('button',{name:/Gentler path: Gentle weight shifts/}).click();
 await expect(page.locator('.move-next')).toContainText('Gentle weight shifts');
 expect(await page.locator('.move-dial-number').innerText()).toBe(before);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});

test('optional model cue appears inside the Scene Director without changing the local workout',async({page})=>{
 await page.route('**/api/config',async route=>{
  const response=await route.fetch();const cfg=await response.json();
  cfg.providers.find(p=>p.id==='openai-api').enabled=true;
  await route.fulfill({json:cfg});
 });
 await page.route('**/api/coach',route=>route.fulfill({json:{cue:'Take this next moment at your own pace.',model:'synthetic-provider'}}));
 await page.goto('/');await page.locator('#studio').evaluate(e=>e.open=true);await page.getByRole('button',{name:'Open legacy v7 workout'}).click();
 await page.getByRole('button',{name:/Explore the interactive preview/}).click();
 await page.locator('#studio').evaluate(el=>el.open=true);
 await page.locator('#provider').selectOption('openai-api');
 await page.locator('#consent').check();
 await page.locator('#message').fill('Can you give me a reassuring thought?');
 await page.locator('#send').click();
 await expect(page.locator('.aira-director-line')).toHaveText('Take this next moment at your own pace.');
 await expect(page.locator('.aira-director-chapter')).toHaveText('AI COACH · OPTIONAL RESPONSE');
 await expect(page.locator('.aira-director-hint')).toContainText('does not change the workout');
 await expect(page.locator('.spoken')).toBeHidden();
 await expect(page.locator('.move-scene')).toHaveAttribute('data-stage','flow_a');
 await page.getByRole('button',{name:/Gentler path: Gentle weight shifts/}).click();
 await expect(page.locator('.aira-director-chapter')).not.toHaveText('AI COACH · OPTIONAL RESPONSE');
});
