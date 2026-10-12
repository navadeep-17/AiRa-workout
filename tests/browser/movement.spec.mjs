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
 await page.getByRole('button',{name:/Explore two paths/}).click();
 await page.getByRole('button',{name:/Gentler path: Gentle weight shifts/}).click();
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

test('living companion appears and hands-free option remains user-controlled',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/make my session/i}).click();
 await page.getByRole('button',{name:/see my plan/i}).click();
 await expect(page.locator('.aira-companion')).toBeVisible();
 await expect(page.getByText(/HANDS-FREE FLOW/i)).toBeVisible();
 await page.getByRole('button',{name:/Off · Turn on/i}).click();
 await expect(page.getByRole('button',{name:/On · Turn off/i})).toBeVisible();
 await page.getByRole('button',{name:/Start 1:15 session/i}).click();
 await expect(page.locator('.aira-movement-heading .aira-companion')).toBeVisible();
});


test('Choice Canvas exposes both illustrated futures and a reversible selection',async({page})=>{
 await page.clock.install();await page.goto('/');
 await page.getByRole('button',{name:/Make my session/}).click();
 await page.getByRole('button',{name:/See my plan/}).click();
 await page.getByRole('button',{name:/Start .*session/}).click();
 await page.clock.fastForward(10_500);
 await page.getByRole('button',{name:/Continue to March in place/}).click();
 await page.getByRole('button',{name:/Explore two paths/}).click();
 const panel=page.getByLabel('Choose the next movement');
 await expect(panel).toContainText('Two ways forward');
 await expect(panel.getByRole('button',{name:/Steady path: Side steps/})).toHaveAttribute('aria-pressed','true');
 await panel.getByRole('button',{name:/Gentler path: Gentle weight shifts/}).click();
 await expect(panel.getByRole('button',{name:/Gentler path: Gentle weight shifts/})).toHaveAttribute('aria-pressed','true');
 await expect(panel).toContainText('Gentle weight shifts');
 await page.getByRole('button',{name:'View plan'}).click();
 await expect(page.locator('.move-overlay-panel')).toContainText('Gentle weight shifts');
 await page.getByRole('button',{name:'Close',exact:true}).click();
 await panel.getByRole('button',{name:/Steady path: Side steps/}).click();
 await expect(panel.getByRole('button',{name:/Steady path: Side steps/})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.move-scene')).toHaveAttribute('data-beat','introduce');
});

test('Scene Director visibly reflects quiet time, pause, and recovery',async({page})=>{
 await page.clock.install();await page.goto('/');
 await page.getByRole('button',{name:/Make my session/}).click();
 await page.getByRole('button',{name:/See my plan/}).click();
 await page.getByRole('button',{name:/Start .*session/}).click();
 await expect(page.locator('.move-scene')).toHaveAttribute('data-beat','introduce');
 await page.clock.fastForward(5_000);
 await expect(page.locator('.move-scene')).toHaveAttribute('data-beat','quiet');
 await page.getByRole('button',{name:/Pause session/}).click();
 await expect(page.locator('.move-scene')).toHaveAttribute('data-beat','paused');
 await page.getByRole('button',{name:/Resume session/}).click();
 await page.clock.fastForward(5_500);
 await page.getByRole('button',{name:/Continue to March in place/}).click();
 await page.clock.fastForward(20_500);
 await page.getByRole('button',{name:/Continue to A breathing break/}).click();
 await expect(page.locator('.move-scene')).toHaveAttribute('data-beat','recover');
 await expect(page.getByLabel('Choose the next movement')).toBeVisible();
});

test('reviewer preview demonstrates choices and rest without fabricating completed movement',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Explore the interactive preview/}).click();
 await expect(page.locator('.move-scene')).toHaveAttribute('data-stage','flow_a');
 await expect(page.locator('.aira-tour-progress')).toContainText('01 / 03');
 await expect(page.getByLabel('Choose the next movement')).toBeVisible();
 await page.getByRole('button',{name:/Gentler path: Gentle weight shifts/}).click();
 await expect(page.locator('.move-next')).toContainText('Gentle weight shifts');
 await page.getByRole('button',{name:/Next: Explore recovery/}).click();
 await expect(page.locator('.aira-tour-progress')).toContainText('02 / 03');
 await page.getByRole('button',{name:/Give me 10 more seconds/}).click();
 await page.getByRole('button',{name:/See your preview postcard/}).click();
 await expect(page.locator('.move-scene')).toHaveAttribute('data-stage','summary');
 await expect(page.locator('.aira-postcard')).toContainText('preview');
 await expect(page.locator('.move-stats')).toContainText('0 / 5');
 await expect(page.locator('.move-change-list')).toContainText('Gentle weight shifts');
 await expect(page.locator('.move-change-list')).toContainText('recovery');
 await page.getByRole('button',{name:/Start a full workout/}).click();
 await expect(page.locator('.move-scene')).toHaveAttribute('data-stage','welcome');
});
