import {button,el} from './dom.js';
import {WorkoutSession,PHASE_KEYS,PHASE_INFO,formatDuration,type Phase} from '../shared/workout-session.js';

function action(text:string, doIt:()=>boolean, changed:()=>void,kind=''){
  const b=button(text,()=>{if(doIt())changed();},`move-button ${kind}`);return b;
}
function label(text:string,klass='move-overline'){return el('p',text,klass);}
function headline(text:string,klass='move-title'){return el('h2',text,klass);}
function copy(text:string,klass='move-body'){return el('p',text,klass);}
function group(klass:string,...children:HTMLElement[]){const n=el('div','',''+klass);n.append(...children);return n;}
function desc(s:WorkoutSession,p:Phase){return `${PHASE_INFO[p].name} · ${formatDuration(s.duration(p))}`;}
function plan(s:WorkoutSession){
 const wrap=group('move-plan-list');
 PHASE_KEYS.forEach((p,i)=>{
   const n=group('move-plan-item',el('span',String(i+1).padStart(2,'0'),'move-plan-number'),
     group('move-plan-copy',el('strong',PHASE_INFO[p].name),copy(PHASE_INFO[p].note,'move-small')),
     el('span',formatDuration(s.duration(p)),'move-plan-time'));
   if(s.activePhase===p)n.classList.add('is-current');
   if(s.records.some(r=>r.phase===p))n.classList.add('is-past');
   if(p==='flow_b'&&s.lightened)n.classList.add('is-adjusted');
   wrap.append(n);
 });
 return wrap;
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
 const root=el('article','','move-scene stage-'+s.stage);root.dataset.stage=s.stage;
 const brand=group('move-brand',el('span','a','move-mark'),el('span','aira','move-wordmark'),el('span','/ move','move-wordmark-suffix'));
 const badge=el('span','●  FICTIONAL SIMULATION','move-sim-badge');
 root.append(group('move-scene-top',brand,badge));
 const body=group('move-scene-body');root.append(body);
 const push=(...nodes:HTMLElement[])=>body.append(...nodes);

 if(s.stage==='welcome'){
   push(label('A DIFFERENT KIND OF WORKOUT COMPANION'),group('move-hero',
     el('div','✳','move-hero-symbol'),headline('A little movement.\nA lot less managing.','move-hero-title')),
     copy('A guided moment that adjusts when you do. No dashboards to decode, no pressure to keep up.','move-lead'),
     action('Make my session  ↗',()=>s.toSetup(),changed,'primary large'),
     action('How does this demo work?',()=>s.toggleHow(),changed,'text'));
   if(s.showHow)push(copy('You’ll try a short, fictional five-part session. Timers, changes and progress are simulated locally. No sensors, coaching prescriptions or audio.','move-explain'));
   push(group('move-welcome-bottom',el('span','01 — CHOOSE','move-small'),el('span','02 — MOVE','move-small'),el('span','03 — ADAPT','move-small')));
 }
 if(s.stage==='setup'){
   push(label('01 / MAKE IT YOURS'),headline('What kind of moment\ndo you have?'),copy('A couple of choices. We’ll handle the flow.','move-lead'));
   const time=group('move-choice-group',label('TIME AVAILABLE','move-field-label'));
   const timeButtons=group('move-choices');for(const [val,title,subtitle] of [['quick','Quick','1:15'],['unhurried','Unhurried','1:45']] as const){const b=action(`${title}  ·  ${subtitle}`,()=>s.choosePreset(val),changed,'choice');b.setAttribute('aria-pressed',String(s.preset===val));timeButtons.append(b);}time.append(timeButtons);
   const pacing=group('move-choice-group',label('YOUR PACE','move-field-label'));
   const paceButtons=group('move-choices');for(const [val,title,subtitle] of [['steady','Steady','Focused moments'],['gentle','Gentle','More recovery']] as const){const b=action(`${title}  ·  ${subtitle}`,()=>s.choosePace(val),changed,'choice');b.setAttribute('aria-pressed',String(s.pace===val));paceButtons.append(b);}pacing.append(paceButtons);
   push(time,pacing,group('move-setup-summary',el('span','YOUR PLAN','move-small'),el('strong',`5 phases  ·  ${formatDuration(s.totalPlanned)} simulated`)),
     group('move-actions',action('← Back',()=>s.toWelcome(),changed,'text'),action('See my plan  ↗',()=>s.toPreview(),changed,'primary large')));
 }
 if(s.stage==='preview'){
   push(label('02 / YOUR FLOW'),headline('Here’s your flow.'),copy('One step at a time. Pause, adjust, or finish whenever you want.','move-lead'),plan(s),
     group('move-preview-total',el('span','TOTAL SIMULATED TIME','move-small'),el('strong',formatDuration(s.totalPlanned))),
     group('move-actions',action('Adjust choices',()=>s.edit(),changed,'text'),action(`Start ${formatDuration(s.totalPlanned)} session  ↗`,()=>s.start(),changed,'primary large')));
 }
 if(s.activePhase){
   const phase=s.activePhase,info=PHASE_INFO[phase],idx=s.phaseIndex;
   root.classList.toggle('stage-recovery',phase==='recovery');
   push(group('move-between',label(`PHASE ${idx+1} OF 5  /  ${s.waiting?'COMPLETE':s.paused?'PAUSED':'IN PROGRESS'}`),el('span',`0${idx+1} / 05`,'move-index')),
      phaseProgress(idx),headline(info.name,'move-phase-title'),copy(info.note,'move-phase-note'));
   const t=s.timer();
   const dial=group('move-dial');dial.setAttribute('role','timer');dial.setAttribute('aria-label','Simulated countdown');
   const number=el('strong','', 'move-dial-number');const timerState=el('span','','move-dial-caption');
   dial.append(group('move-dial-inner',el('span',info.symbol,'move-dial-symbol'),number,timerState));
   const update=()=>{const item=s.timer();if(!item||item.id!==phase)return;number.textContent=formatDuration(item.remaining);timerState.textContent=s.waiting?'PHASE COMPLETE':s.paused?'PAUSED':'SIMULATED TIME';const progress=item.seconds>0?Math.min(100,Math.max(0,(item.seconds-item.remaining)/item.seconds*100)):0;dial.style.setProperty('--pct',`${progress}%`);};updates.push(update);update();
   push(group('move-timer-wrap',dial),copy(s.waiting?'This part is complete. Continue whenever you’re ready.':info.cue,'move-phase-cue'));
   const controls=group('move-phase-actions');
   if(s.waiting){const next=PHASE_KEYS[idx+1];controls.append(action(next?`Continue to ${PHASE_INFO[next].name}  ↗`:'See my summary  ↗',()=>s.next(),changed,'primary large'));}
   else if(s.paused&&t?.status==='stopped'){controls.append(action('Begin this phase  ↗',()=>s.beginReady(),changed,'primary large'));}
   else controls.append(action(s.paused?'Resume session  ▶':'Pause session  Ⅱ',()=>s.togglePause(),changed,'primary large'));
   if(phase==='recovery'&&!s.waiting){const extend=action(s.recoveryAdded>=30?'Maximum extra time added':'+ Give me 10 more seconds',()=>s.extendRecovery(),changed,'secondary');extend.disabled=s.recoveryAdded>=30;controls.append(extend);}
   if((phase==='flow_a'||phase==='recovery')&&!s.waiting){
     controls.append(s.lightened?action('Undo lighter next flow',()=>s.undoLighten(),changed,'secondary'):action('Make next flow lighter',()=>s.lightenNext(),changed,'secondary'));
   }
   push(controls);
   const next=PHASE_KEYS[idx+1];if(next)push(group('move-next',label('UP NEXT','move-small'),el('strong',desc(s,next))));
   push(group('move-bottom-actions',action('View plan',()=>s.togglePlan(),changed,'text'),
     action('Skip phase',()=>s.askSkip(),changed,'text'),action('End session',()=>s.askEnd(),changed,'text danger-link')));
   push(helperLine(s));
 }
 if(s.stage==='summary'){
   const count=s.completed,heading=s.endedEarly?'That’s a good place to stop.':'A thoughtful finish.';
   push(label('YOUR SESSION / COMPLETE'),el('span',s.endedEarly?'↗':'✺','move-summary-icon'),headline(heading),copy('This was a fictional guided session. Here’s exactly what happened.','move-lead'));
   const numbers=group('move-stats',group('move-stat',el('strong',`${count} / 5`),copy('phases completed','move-small')),
     group('move-stat',el('strong',formatDuration(s.elapsed)),copy('simulated phase time','move-small')),
     group('move-stat',el('strong',String(s.skipped)),copy('phases skipped','move-small')));
   push(numbers,label('THE WAY YOU MADE IT YOURS','move-field-label'));
   const changes=group('move-change-list');if(!s.changes.length)changes.append(copy('No adjustments needed.','move-small'));else s.changes.forEach(t=>changes.append(group('move-change',el('span','✓'),el('span',t))));push(changes);
   const details=group('move-summary-detail');s.records.forEach(r=>details.append(group('move-summary-row',el('span',PHASE_INFO[r.phase].name),el('strong',`${r.outcome==='completed'?'Finished':'Skipped'} · ${formatDuration(r.seconds)}`))));push(details);
   push(action('Try another session  ↗',()=>s.reset(),changed,'primary large'),copy('No heart rate, calories or physical activity were measured.','move-small'));
 }
 root.append(group('move-scene-footer',el('span','AIRA / MOVE EXPERIMENT','move-small'),el('span','LOCAL · TEXT ONLY','move-small')));
 root.append(shortPlan(s,changed));root.append(confirmation(s,changed));
 return root;
}