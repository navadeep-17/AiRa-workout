import {test,expect} from '@playwright/test';

test('model coaching is optional, attributed, and cannot replace or advance the workout',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/config',async route=>{
  const response=await route.fetch();const cfg=await response.json();cfg.providers.find(p=>p.id==='openai-api').enabled=true;await route.fulfill({json:cfg});
 });
 let calls=0;
 await page.route('**/api/coach',route=>{calls++;return route.fulfill({json:{cue:'You set the pace. A little progress is enough.',model:'synthetic-openai',source:'openai-api'}});});
 await page.goto('/');await page.locator('#studio').evaluate(e=>e.open=true);await page.getByRole('button',{name:'Open legacy v7 workout'}).click();
 await page.getByRole('button',{name:/Make my session/}).click();
 await expect(page.locator('.move-scene')).toHaveAttribute('data-stage','setup');
 await page.locator('#studio').evaluate(el=>el.open=true);
 await page.locator('#provider').selectOption('openai-api');
 await expect(page.locator('#consent-wrap')).toBeVisible();
 await page.locator('#consent').check();
 await page.locator('#message').fill('How can I stay encouraged?');await page.locator('#send').click();
 await expect(page.locator('#spoken')).toContainText('You set the pace.');
 await expect(page.locator('#coach-origin')).toContainText('AI-GENERATED TEXT');
 await expect(page.locator('.move-scene')).toHaveAttribute('data-stage','setup');
 await page.locator('#message').fill('Gentle');await page.locator('#send').click();
 await expect(page.locator('#spoken')).toContainText('Pick a duration');
 await expect(page.locator('#coach-origin')).toContainText('LOCAL SESSION GUIDANCE');
 expect(calls).toBe(1);expect(errors).toEqual([]);
});

test('mobile session remains usable without provider credentials',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.locator('#studio').evaluate(e=>e.open=true);await page.getByRole('button',{name:'Open legacy v7 workout'}).click();
 await page.getByRole('button',{name:/Make my session/}).click();
 await page.getByRole('button',{name:/See my plan/}).click();
 await page.getByRole('button',{name:/Start .*session/}).click();
 await expect(page.locator('.move-scene')).toHaveAttribute('data-stage','settle');
 await page.locator('#studio').evaluate(el=>el.open=true);
 await page.locator('#message').fill('pause');await page.locator('#send').click();
 await expect(page.locator('.move-scene')).toContainText('PAUSED');
 await page.locator('#message').fill('resume');await page.locator('#send').click();
 await expect(page.locator('.move-scene')).toContainText('IN PROGRESS');
 await page.getByRole('button',{name:'End session',exact:true}).first().click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByRole('dialog').getByRole('button',{name:'End session'}).click();
 await expect(page.locator('.move-scene')).toHaveAttribute('data-stage','summary');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
