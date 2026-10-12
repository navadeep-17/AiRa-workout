import {button,el} from './dom.js';
import {WorkoutSession,PHASE_KEYS,PHASE_INFO,formatDuration,type Phase,type Movement} from '../shared/workout-session.js';
import {directScene} from '../shared/scene-director.js';
import {MOVEMENTS,LIGHT_MOVEMENT} from '../shared/workout-session.js';
import {livingCompanion,companionMood} from './living-companion.js';

function action(text:string, doIt:()=>boolean, changed:()=>void,kind=''){
  const b=button(text,()=>{if(doIt())changed();},`move-button ${kind}`);return b;
}
function label(text:string,klass='move-overline'){return el('p',text,klass);}
function headline(text:string,klass='move-title'){return el('h2',text,klass);}
function copy(text:string,klass='move-body'){return el('p',text,klass);}
function group(klass:string,...children:HTMLElement[]){const n=el('div','',''+klass);n.append(...children);return n;}
function desc(s:WorkoutSession,p:Phase){return `${s.movement(p).title} · ${formatDuration(s.duration(p))}`;}
/** Trusted, local vector gesture. No images, user content or generated code are rendered. */
function movementArt(m:Movement,compact=false):HTMLElement {
 const outer=group('move-art'+(compact?' is-compact':'')+' motion-'+m.kind);
 outer.setAttribute('role','img');outer.setAttribute('aria-label',`Line illustration for ${m.title}`);
 const ns='http://www.w3.org/2000/svg';
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 320 230');svg.setAttribute('aria-hidden','true');
 function shape(tag:string,attrs:Record<string,string>,parent:SVGElement=svg){const node=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,v);parent.append(node);return node;}
 shape('circle',{cx:'160',cy:'115',r:'101',fill:'none',stroke:'#cce0d0','stroke-dasharray':'2 11','stroke-width':'2'});
 shape('ellipse',{cx:'160',cy:'213',rx:'65',ry:'5',fill:'#bfd7c5',opacity:'.6'});
 const figure=shape('g',{fill:'none',stroke:'#315b48','stroke-width':'9','stroke-linecap':'round','stroke-linejoin':'round',class:'move-figure'});
 shape('circle',{cx:'160',cy:'47',r:'20',fill:'#f4d4b7',stroke:'#315b48','stroke-width':'5'},figure);
 shape('path',{d:'M160 68 L160 137',},figure);
 const poses:Record<Movement['kind'],[string,string,string,string]>={
   shoulders:['M160 87 Q131 76 113 99','M160 87 Q189 76 207 99','M160 137 L133 199','M160 137 L187 199'],
   march:['M160 86 L118 127','M160 86 L206 116','M160 137 L124 177 L99 182','M160 137 L183 174 L198 201'],
   breath:['M160 86 L116 112','M160 86 L204 112','M160 137 L135 200','M160 137 L185 200'],
   steps:['M160 86 L129 114','M160 86 L190 116','M160 137 L113 190','M160 137 L213 195'],
   shifts:['M160 87 L138 112','M160 87 L190 107','M160 137 L142 200','M160 137 L185 198'],
   reach:['M160 86 L134 41','M160 86 L189 39','M160 137 L137 200','M160 137 L186 199'],
 };
 const [leftArm,rightArm,leftLeg,rightLeg]=poses[m.kind];
 for(const [d,cls] of [[leftArm,'left-arm'],[rightArm,'right-arm'],[leftLeg,'left-leg'],[rightLeg,'right-leg']])shape('path',{d,class:cls},figure);
 const hint=shape('g',{fill:'none',stroke:'#72ad88','stroke-width':'3','stroke-linecap':'round','stroke-dasharray':'6 8'});
 if(m.kind==='march'||m.kind==='steps'||m.kind==='shifts')shape('path',{d:'M72 172 Q78 142 103 133 M248 172 Q242 142 217 133'},hint);
 if(m.kind==='reach'||m.kind==='shoulders')shape('path',{d:'M115 46 Q100 82 116 102 M205 46 Q220 82 204 102'},hint);
 if(m.kind==='breath'){shape('circle',{cx:'160',cy:'114',r:'72'},hint);}
 outer.append(svg,el('span',m.rhythm,'move-art-rhythm'));
 return outer;
}
function plan(s:WorkoutSession){
 const wrap=group('move-plan-list');
 PHASE_KEYS.forEach((p,i)=>{
   const n=group('move-plan-item',el('span',String(i+1).padStart(2,'0'),'move-plan-number'),
     group('move-plan-copy',el('strong',s.movement(p).title),copy(s.movement(p).instruction,'move-small')),
     el('span',formatDuration(s.duration(p)),'move-plan-time'));
   if(s.activePhase===p)n.classList.add('is-current');
   if(s.records.some(r=>r.phase===p))n.classList.add('is-past');
   if(p==='flow_b'&&s.lightened)n.classList.add('is-adjusted');
   n.dataset.movement=s.movement(p).kind;wrap.append(n);
 });
 return wrap;
}
/** Two genuine, reversible futures for the next movement. Cards are trusted controls, not model-created HTML. */
function choiceCanvas(s:WorkoutSession,changed:()=>void):HTMLElement {
 const box=group('aira-choice-canvas');box.setAttribute('aria-label','Choose the next movement');
 box.append(group('move-between',group('aira-choice-heading',label('A FORK IN YOUR STORY'),headline('Two ways forward.','move-panel-title')),
  action('Close choices',()=>s.hideChoices(),changed,'text')),
  copy('What feels right for the next movement? The current countdown keeps its place.','move-small'));
 const cards=group('aira-choice-grid');
 for(const option of ['steady','soft'] as const){
  const selected=option==='soft'?s.lightened:!s.lightened;
  const movement=option==='soft'?LIGHT_MOVEMENT:MOVEMENTS.flow_b;
  const base=s.originalSecondMovementSeconds;
  const seconds=option==='soft'?Math.max(10,Math.floor(base*.6)):base;
  const card=action('',()=>option==='soft'?s.lightenNext():s.undoLighten(),changed,'aira-choice-card'+(selected?' is-selected':''));
  card.setAttribute('aria-pressed',String(selected));card.setAttribute('aria-label',`${option==='soft'?'Gentler path':'Steady path'}: ${movement.title}, ${seconds} seconds${selected?', selected':''}`);
  card.append(el('span',option==='soft'?'02 / THE GENTLER PATH':'01 / KEEP YOUR RHYTHM','aira-choice-kicker'),movementArt(movement,true),
   el('strong',movement.title,'aira-choice-name'),copy(movement.instruction,'aira-choice-description'),
   el('span',`${formatDuration(seconds)} · ${selected?'YOUR CURRENT CHOICE':'CHOOSE THIS PATH'}`,'aira-choice-duration'));
  cards.append(card);
 }
 box.append(cards,copy('You can change your mind before the next activity begins. Only the upcoming scene changes.','aira-choice-footnote'));
 return box;
}
function shortPlan(s:WorkoutSession,changed:()=>void){
 if(!s.showPlan)return document.createDocumentFragment();
 const box=group('move-overlay-panel',group('move-between',headline('Your flow','move-panel-title'),action('Close',()=>s.togglePlan(),changed,'text')),
  copy('This is a fictional session. Timings update when you adjust them.','move-small'),plan(s));
 return box;
}
function confirmation(s:WorkoutSession,changed:()=>void){
 if(!s.modal)return document.createDocumentFragment();
 const panel=group('move-modal');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',s.modal==='skip'?'Skip phase confirmation':'End session confirmation');
 panel.append(label('JUST CHECKING'),headline(s.modal==='end'?'Finish here?':'Skip this part?','move-modal-title'),
   copy(s.modal==='end'?'You can stop whenever you like. We’ll only count what you actually completed.':'This phase won’t count as completed. You can continue with the next one.'));
 panel.append(group('move-actions',action('Keep going',()=>s.dismissModal(),changed,'primary'),
   action(s.modal==='end'?'End session':'Skip phase',()=>s.modal==='end'?s.confirmEnd():s.confirmSkip(),changed,'danger')));
 return group('move-modal-backdrop',panel);
}
function phaseProgress(index:number){const prog=group('move-phase-progress');PHASE_KEYS.forEach((p,i)=>{const dot=el('span','','move-phase-dot');if(i<=index)dot.classList.add('is-filled');dot.title=PHASE_INFO[p].name;prog.append(dot);});return prog;}
function helperLine(s:WorkoutSession){const n=el('p',s.message||'You’re in control of this session.','move-feedback');n.setAttribute('role','status');n.setAttribute('aria-live','polite');return n;}

export function renderWorkout(s:WorkoutSession,changed:()=>void,updates:(()=>void)[]):HTMLElement {
 const root=el('article','','move-scene stage-'+s.stage+(s.lightened?' has-adaptation':''));root.dataset.stage=s.stage;
 const brand=group('move-brand',el('span','a','move-mark'),el('span','aira','move-wordmark'),el('span','/ move','move-wordmark-suffix'));
 const badge=el('span','●  FICTIONAL SIMULATION','move-sim-badge');
 root.append(group('move-scene-top',brand,badge));
 const body=group('move-scene-body');root.append(body);
 const push=(...nodes:HTMLElement[])=>body.append(...nodes);

 if(s.stage==='welcome'){
   push(label('A DIFFERENT KIND OF WORKOUT COMPANION'),group('move-hero',
     livingCompanion('hello'),headline('Movement that\nmoves with you.','move-hero-title')),
     copy('A little movement, thoughtful guidance, and a plan that changes when you do.','move-lead'),
     action('Make my session  ↗',()=>s.toSetup(),changed,'primary large'),
     action('How does this demo work?',()=>s.toggleHow(),changed,'text'));
   if(s.showHow)push(copy('Preview five gentle movement ideas, then simulate each interval. You can pause, add rest or choose a lighter next activity. No movement or sensors are tracked.','move-explain'));
   push(group('move-welcome-bottom',el('span','01 — CHOOSE','move-small'),el('span','02 — MOVE','move-small'),el('span','03 — ADAPT','move-small')));
 }
 if(s.stage==='setup'){
   push(group('aira-intro-companion',livingCompanion('hello',true),label('AiRA is here to make this moment yours.')),label('01 / MAKE IT YOURS'),headline('What kind of moment\ndo you have?'),copy('Choose your time and energy. AiRA will shape the next few movements around you.','move-lead'));
   const time=group('move-choice-group',label('TIME AVAILABLE','move-field-label'));
   const timeButtons=group('move-choices');for(const [val,title,subtitle] of [['quick','Quick','1:15'],['unhurried','Unhurried','1:45']] as const){const b=action(`${title}  ·  ${subtitle}`,()=>s.choosePreset(val),changed,'choice');b.setAttribute('aria-pressed',String(s.preset===val));timeButtons.append(b);}time.append(timeButtons);
   const pacing=group('move-choice-group',label('YOUR PACE','move-field-label'));
   const paceButtons=group('move-choices');for(const [val,title,subtitle] of [['steady','Steady','Focused moments'],['gentle','Gentle','More recovery']] as const){const b=action(`${title}  ·  ${subtitle}`,()=>s.choosePace(val),changed,'choice');b.setAttribute('aria-pressed',String(s.pace===val));paceButtons.append(b);}pacing.append(paceButtons);
   push(time,pacing,group('move-setup-summary',el('span','YOUR PLAN','move-small'),el('strong',`5 phases  ·  ${formatDuration(s.totalPlanned)} simulated`)),
     group('move-actions',action('← Back',()=>s.toWelcome(),changed,'text'),action('See my plan  ↗',()=>s.toPreview(),changed,'primary large')));
 }
 if(s.stage==='preview'){
   push(group('aira-intro-companion',livingCompanion('focus',true),label('A little guidance, not another dashboard.')),label('02 / YOUR FLOW'),headline('Here’s your flow.'),copy('Here are the actual movements. Nothing starts before you choose Start.','move-lead'),plan(s),
     group('move-preview-total',el('span','TOTAL SIMULATED TIME','move-small'),el('strong',formatDuration(s.totalPlanned))),
     group('aira-autoflow-choice',copy('HANDS-FREE FLOW · Move to the next activity after a three-second preview.','move-small'),action(s.autoFlow?'On · Turn off':'Off · Turn on',()=>s.setAutoFlow(!s.autoFlow),changed,'secondary')),
     group('move-actions',action('Adjust choices',()=>s.edit(),changed,'text'),action(`Start ${formatDuration(s.totalPlanned)} session  ↗`,()=>s.start(),changed,'primary large')));
 }
 if(s.activePhase){
   const phase=s.activePhase,idx=s.phaseIndex;
   root.classList.toggle('stage-recovery',phase==='recovery');
   const movement=s.movement(phase);
   push(group('move-between',label(`MOVEMENT ${idx+1} OF 5  /  ${s.waiting?'COMPLETE':s.paused?'PAUSED':'IN PROGRESS'}`),el('span',`0${idx+1} / 05`,'move-index')),
      phaseProgress(idx),group('aira-movement-heading',group('aira-movement-copy',headline(movement.title,'move-phase-title'),copy(movement.instruction,'move-phase-note')),livingCompanion(companionMood(s),true)));
   const t=s.timer();
   const dial=group('move-dial');dial.setAttribute('role','timer');dial.setAttribute('aria-label','Simulated countdown');
   const number=el('strong','', 'move-dial-number');const timerState=el('span','','move-dial-caption');
   dial.append(group('move-dial-inner',number,timerState));
   const update=()=>{const item=s.timer();if(!item||item.id!==phase)return;number.textContent=formatDuration(item.remaining);timerState.textContent=s.waiting?'PHASE COMPLETE':s.paused?'PAUSED':'SIMULATED TIME';const progress=item.seconds>0?Math.min(100,Math.max(0,(item.seconds-item.remaining)/item.seconds*100)):0;dial.style.setProperty('--pct',`${progress}%`);};updates.push(update);update();
   push(group('move-stage-center',movementArt(movement),group('move-stage-timing',dial)));
   const director=group('aira-director');director.setAttribute('aria-label','AiRA scene direction');
   const beatLabel=el('span','','aira-director-chapter'),beatLine=el('strong','','aira-director-line'),beatHint=el('span','','aira-director-hint');
   director.append(el('span','✳','aira-director-mark'),group('aira-director-copy',beatLabel,beatLine,beatHint));
   const direct=()=>{const shot=directScene(s);if(root.dataset.beat!==shot.beat)root.dataset.beat=shot.beat;beatLabel.textContent=shot.chapter;beatLine.textContent=shot.line;beatHint.textContent=shot.hint;};
   updates.push(direct);direct();push(director);
   push(group('move-context-note',el('span','AIRA SAYS','move-context-label'),copy(s.lightened&&['flow_a','recovery'].includes(phase)?'You asked for something gentler. I changed what comes next, not just the countdown.':movement.detail,'move-small')));
   const controls=group('move-phase-actions');
   if(s.waiting){const next=PHASE_KEYS[idx+1];controls.append(action(next?`Continue to ${s.movement(next).title}  ↗`:'See my summary  ↗',()=>s.next(),changed,'primary large'));
     if(s.autoCountdown!==null){const countdown=copy('', 'aira-next-countdown');const updateCountdown=()=>{countdown.textContent=`Next scene in ${s.autoCountdown??0}s · you can stay here`;};updates.push(updateCountdown);updateCountdown();controls.append(countdown,action('Stay here',()=>s.holdNext(),changed,'secondary'));}
   }
   else if(s.paused&&t?.status==='stopped'){controls.append(action('Begin this phase  ↗',()=>s.beginReady(),changed,'primary large'));}
   else controls.append(action(s.paused?'Resume session  ▶':'Pause session  Ⅱ',()=>s.togglePause(),changed,'primary large'));
   if(phase==='recovery'&&!s.waiting){const extend=action(s.recoveryAdded>=30?'Maximum extra time added':'+ Give me 10 more seconds',()=>s.extendRecovery(),changed,'secondary');extend.disabled=s.recoveryAdded>=30;controls.append(extend);}
   if((phase==='flow_a'||phase==='recovery')&&!s.waiting&&!s.choiceOpen){
     controls.append(action('Explore two paths for what comes next  ↗',()=>s.showChoices(),changed,'secondary'));
   }
   push(controls);
   if((phase==='flow_a'||phase==='recovery')&&s.choiceOpen&&!s.waiting)push(choiceCanvas(s,changed));
   if(!s.waiting)push(group('aira-autoflow-mini',copy(s.autoFlow?'HANDS-FREE FLOW · ON':'HANDS-FREE FLOW · OFF','move-small'),action(s.autoFlow?'Turn off':'Turn on',()=>s.setAutoFlow(!s.autoFlow),changed,'text')));
   const next=PHASE_KEYS[idx+1];if(next)push(group('move-next'+(s.lightened&&next==='flow_b'?' is-adapted':''),label('UP NEXT','move-small'),el('strong',desc(s,next)),...(s.lightened&&next==='flow_b'?[el('span','✦  UPDATED TO MATCH YOUR ENERGY','aira-adapt-label')]:[])));
   push(group('move-bottom-actions',action('View plan',()=>s.togglePlan(),changed,'text'),
     ...(s.waiting?[]:[action('Skip phase',()=>s.askSkip(),changed,'text')]),action('End session',()=>s.askEnd(),changed,'text danger-link')));
   push(helperLine(s));
 }
 if(s.stage==='summary'){
   const count=s.completed,heading=s.endedEarly?'You chose when to stop.':'You moved through it.';
   const personalLine=s.lightened&&s.recoveryAdded?'You made room to breathe and chose the gentler route. This session followed your lead.':s.lightened?'You chose the gentler route. Your next movement changed with you.':s.recoveryAdded?'You asked for more breathing room. The session made space for it.':s.endedEarly?'You chose to finish here. Your session respects that choice.':'You found a rhythm that felt right for this short moment.';
   push(group('aira-postcard',label('A SMALL NOTE FROM AIRA'),livingCompanion('celebrate'),headline('You found your own pace.'),copy(personalLine,'aira-postcard-note')),label('YOUR SESSION / COMPLETE'),headline(heading),copy('Here’s your simulated session, including every change you made along the way.','move-lead'));
   const numbers=group('move-stats',group('move-stat',el('strong',`${count} / 5`),copy('phases completed','move-small')),
     group('move-stat',el('strong',formatDuration(s.elapsed)),copy('simulated phase time','move-small')),
     group('move-stat',el('strong',String(s.skipped)),copy('phases skipped','move-small')));
   push(numbers,label('THE WAY YOU MADE IT YOURS','move-field-label'));
   const changes=group('move-change-list');if(!s.changes.length)changes.append(copy('No adjustments needed.','move-small'));else s.changes.forEach(t=>changes.append(group('move-change',el('span','✓'),el('span',t))));push(changes);
   const details=group('move-summary-detail');s.records.forEach(r=>details.append(group('move-summary-row',el('span',r.movementTitle),el('strong',`${r.outcome==='completed'?'Finished':'Skipped'} · ${formatDuration(r.seconds)}`))));push(details);
   push(action('Try another session  ↗',()=>s.reset(),changed,'primary large'),copy('No heart rate, calories or physical activity were measured.','move-small'));
 }
 root.append(group('move-scene-footer',el('span','AIRA / MOVE EXPERIMENT','move-small'),el('span','LOCAL · TEXT ONLY','move-small')));
 root.append(shortPlan(s,changed));root.append(confirmation(s,changed));
 return root;
}
