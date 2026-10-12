import {test,expect} from '@playwright/test';

test('natural-language energy request shapes a moving two-minute plan',async({page})=>{
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await page.setViewportSize({width:1280,height:900});await page.goto('/');
 await expect(page.getByLabel('WHAT DOES YOUR MOMENT LOOK LIKE?')).toBeVisible();
 await page.getByLabel('WHAT DOES YOUR MOMENT LOOK LIKE?').fill('I need an energy boost, I have 2 minutes and plenty of room.');
 await page.getByRole('button',{name:/Shape my session/}).click();
 await expect(page.locator('.aira-plan-provenance')).toContainText('ENERGIZE');
 await expect(page.locator('.move-plan-list')).toContainText('March in place');
 await expect(page.locator('.move-plan-list')).toContainText('Side steps');
 await expect(page.locator('.move-preview-total')).toContainText('2:00');
 await page.getByRole('button',{name:/Start 2:00 session/}).click();
 await expect(page.locator('.move-phase-title')).toHaveText('Shoulder rolls');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});

test('desk reset makes a visibly different compact plan and maintains offline provenance',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await page.getByRole('button',{name:/Desk reset/}).click();
 await page.getByRole('button',{name:/Shape my session/}).click();
 await expect(page.locator('.aira-plan-provenance')).toContainText('SMALL SPACE');
 await expect(page.locator('.move-plan-list')).toContainText('Wrist and finger release');
 await expect(page.locator('.move-plan-list')).not.toContainText('Side steps');
 await expect(page.locator('.move-preview-total')).toContainText('2:00');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('unsupported medical symptom does not create a plan',async({page})=>{
 await page.goto('/');
 await page.getByLabel('WHAT DOES YOUR MOMENT LOOK LIKE?').fill('I am dizzy and feeling unwell');
 await page.getByRole('button',{name:/Shape my session/}).click();
 await expect(page.locator('.move-scene')).toHaveAttribute('data-stage','welcome');
 await expect(page.locator('.move-feedback')).toContainText('cannot assess symptoms');
});
