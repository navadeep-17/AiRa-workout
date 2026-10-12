import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

for(const width of [390,1280])test(`Director OpenUI: intent, scene patch and timer events at ${width}px`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width,height:width===390?844:900});
 await page.goto('/');
 await expect(page.locator('#director-bar')).toBeVisible();
 await expect(page.locator('#director-provenance')).toContainText('SCRIPTED MOCK');
 await page.getByRole('button',{name:'Give me a quick energy boost'}).click();
 await expect(page.locator('[data-statement="movement_current"]')).toHaveAttribute('aria-label','March in place');
 await expect(page.locator('.director-cue')).toBeVisible();
 await mkdir('test-results/director-evidence',{recursive:true});
 await page.screenshot({path:`test-results/director-evidence/${width}-energy.png`,fullPage:true});
 await page.getByRole('button',{name:'Start this moment'}).click();
 await page.getByRole('button',{name:'Simulate finish'}).click();
 await expect(page.locator('[data-statement="movement_current"]')).toHaveAttribute('aria-label','A breathing break',{timeout:6000});
 await page.locator('#director-request').fill('No jumping; make it gentler');
 await page.locator('#director-submit').click();
 await expect(page.locator('[data-statement="movement_current"]')).toHaveAttribute('aria-label','A breathing break');
 await expect(page.locator('#screen')).toContainText('The next movement will be gentler');
 await page.getByRole('button',{name:'Simulate finish'}).click();
 await expect(page.locator('[data-statement="movement_current"]')).toHaveAttribute('aria-label','Gentle weight shifts',{timeout:6000});
 await expect(page.locator('[data-statement="timer_current"]')).toContainText('0:12');
 await page.screenshot({path:`test-results/director-evidence/${width}-adapted.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});

test('Director desk request shows a materially different authored scene',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:/at my desk with very little space/}).click();
 await expect(page.locator('[data-statement="movement_current"]')).toHaveAttribute('aria-label','Wrist and finger release');
 await expect(page.locator('#screen')).toContainText('Slowly open and close your hands');
 await expect(page.locator('#state-json')).toContainText('Movement(\\"wrist_release\\")');
});
