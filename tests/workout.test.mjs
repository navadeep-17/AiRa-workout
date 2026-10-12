import test from 'node:test';
import assert from 'node:assert/strict';
import {WorkoutSession,PHASE_KEYS,formatDuration} from '../dist/shared/workout-session.js';
import {TimerLedger} from '../dist/shared/openui/timer-store.js';
import {validateProgram} from '../dist/shared/openui/validate.js';
import {STAGES} from '../dist/shared/workout-session.js';

const create=()=>{let now=0;const s=new WorkoutSession(()=>now);const clock={forward(seconds){now+=1000*seconds;}};return {s,clock};};
function begin(s){assert(s.toSetup());assert(s.toPreview());assert(s.start());assert.equal(s.stage,'settle');}
function finishPhase(s,clock){const phase=s.activePhase;const t=s.timer();clock.forward(t.remaining+0.1);assert(s.tick());assert.equal(s.waiting,true);assert.equal(s.timer().status,'done');assert.equal(s.tick(),false);assert(s.next());return phase;}

test('screen types register through OpenUI and validate stage allowlist',()=>{
 const program=STAGES.map(p=>`scene_${p} = Screen([work_${p}])\nwork_${p} = Workout("${p}")`).join('\n')+`\nroot = Screens([${STAGES.map(p=>`scene_${p}`).join(', ')}], scene_welcome)`;
 assert.equal(validateProgram(program).props.screens.length,9);
 assert.throws(()=>validateProgram('root = Screens([s])\ns = Screen([bad])\nbad = Workout("<script>")'));
});
test('quick and unhurried durations remain 75 and 105 seconds at either pace',()=>{
 const {s}=create();assert.equal(s.totalPlanned,75);s.toSetup();s.choosePace('gentle');assert.equal(s.totalPlanned,75);assert.equal(s.duration('flow_a'),16);s.choosePreset('unhurried');assert.equal(s.totalPlanned,105);assert.equal(s.duration('recovery'),32);
 assert.equal(formatDuration(75),'1:15');assert.equal(formatDuration(105),'1:45');
});
test('clock continues accurately through pause, resume, and waiting for explicit continue',()=>{
 const {s,clock}=create();begin(s);clock.forward(3);assert.equal(s.timer().remaining,7);
 assert(s.togglePause());clock.forward(12);assert.equal(s.timer().remaining,7);assert.equal(s.tick(),false);
 assert(s.togglePause());clock.forward(7);assert(s.tick());assert(s.waiting);assert.equal(s.records.length,0);
 assert(s.next());assert.equal(s.stage,'flow_a');assert.equal(s.records[0].seconds,10);
});
test('extension preserves remaining time, status, capped allowance and phase math',()=>{
 const {s,clock}=create();begin(s);finishPhase(s,clock);finishPhase(s,clock);assert.equal(s.stage,'recovery');
 clock.forward(8);assert.equal(s.timer().remaining,7);
 assert(s.extendRecovery());assert.equal(s.timer().remaining,17);assert.equal(s.timer().status,'running');assert.equal(s.totalPlanned,85);
 assert(s.togglePause());clock.forward(30);assert.equal(s.timer().remaining,17);
 assert(s.extendRecovery());assert.equal(s.timer().status,'paused');assert.equal(s.timer().remaining,27);
 assert(s.extendRecovery());assert.equal(s.recoveryAdded,30);assert.equal(s.extendRecovery(),false);
 assert(s.togglePause());clock.forward(37);assert(s.tick());assert.equal(s.extendRecovery(),false);
});
test('lightening next block affects future phase without changing active phase, allows undo',()=>{
 const {s,clock}=create();begin(s);finishPhase(s,clock);assert.equal(s.stage,'flow_a');
 clock.forward(3);assert(s.lightenNext());assert.equal(s.duration('flow_b'),12);assert.equal(s.timer().remaining,17);
 assert.equal(s.lightenNext(),false);assert(s.undoLighten());assert.equal(s.duration('flow_b'),20);
 assert(s.lightenNext());finishPhase(s,clock);finishPhase(s,clock);assert.equal(s.stage,'flow_b');assert.equal(s.timer().seconds,12);assert.equal(s.lightenNext(),false);
});
test('skip confirmation freezes timer, cancellation restores, confirm excludes completion',()=>{
 const {s,clock}=create();begin(s);clock.forward(4);assert(s.askSkip());clock.forward(50);assert.equal(s.timer().remaining,6);
 assert(s.dismissModal());clock.forward(2);assert.equal(s.timer().remaining,4);
 assert(s.askSkip());assert(s.confirmSkip());assert.equal(s.stage,'flow_a');assert.equal(s.records[0].outcome,'skipped');assert.equal(s.records[0].seconds,6);
 assert.equal(s.timer().status,'stopped');assert.equal(s.paused,true);assert(s.beginReady());assert.equal(s.timer().status,'running');
});
test('end early is user-controlled and summary never counts partial work as completed',()=>{
 const {s,clock}=create();begin(s);clock.forward(5);assert(s.askEnd());clock.forward(20);assert.equal(s.timer().remaining,5);
 assert(s.confirmEnd());assert.equal(s.stage,'summary');assert.equal(s.endedEarly,true);assert.equal(s.completed,0);assert.equal(s.skipped,1);assert.equal(s.elapsed,5);
 assert(s.reset());assert.equal(s.stage,'welcome');assert.equal(s.records.length,0);
});
test('complete adapted path produces 5 completed phases and actual simulated 77 seconds',()=>{
 const {s,clock}=create();begin(s);finishPhase(s,clock);finishPhase(s,clock);
 assert(s.extendRecovery());assert(s.lightenNext());assert.equal(s.totalPlanned,77);
 finishPhase(s,clock);finishPhase(s,clock);finishPhase(s,clock);
 assert.equal(s.stage,'summary');assert.equal(s.completed,5);assert.equal(s.skipped,0);assert.equal(s.elapsed,77);
 assert.equal(s.records.reduce((n,r)=>n+r.seconds,0),77);
 assert.equal(s.changes.length,2);assert.equal(s.next(),false);
});
test('TimerLedger.extend rejects unknown and done timers, retains paused progress',()=>{
 let now=0;const l=new TimerLedger(()=>now);l.ensure('r',{label:'Rest',seconds:10});l.start('r');now=4000;l.pause('r');
 assert(l.extend('r',10));assert.equal(l.list()[0].status,'paused');assert.equal(l.list()[0].seconds,20);assert.equal(l.list()[0].remaining,16);
 assert.equal(l.extend('missing',10),false);assert.equal(l.extend('r',0),false);l.finish('r');assert.equal(l.extend('r',10),false);
});

test('completed phase cannot be misreported as skipped; ending there preserves completion',()=>{
 const {s,clock}=create();begin(s);clock.forward(10);assert(s.tick());
 assert.equal(s.askSkip(),false);assert(s.askEnd());assert(s.confirmEnd());
 assert.equal(s.stage,'summary');assert.equal(s.completed,1);assert.equal(s.skipped,0);assert.equal(s.elapsed,10);
});

test('contextual coaching is consistent with selected pace and actual paused state',()=>{
 const {s,clock}=create();assert.match(s.coachCue,/simulated/i);
 s.toSetup();s.choosePace('gentle');s.toPreview();s.start();
 assert.match(s.coachCue,/gentle/i);assert(s.togglePause());assert.match(s.coachCue,/Paused/);
 assert(s.togglePause());clock.forward(10);assert(s.tick());assert.match(s.coachCue,/complete/i);
});

test('specific activities and lighter alternative change instructions and recorded movement',()=>{
 const {s,clock}=create();
 assert.equal(s.movement('settle').title,'Shoulder rolls');
 assert.equal(s.movement('flow_a').title,'March in place');
 assert.match(s.movement('flow_b').instruction,/Step to one side/);
 begin(s);finishPhase(s,clock);assert(s.lightenNext());
 assert.equal(s.movement('flow_b').title,'Gentle weight shifts');
 assert.match(s.movement('flow_b').instruction,/Shift your weight/);
 finishPhase(s,clock);finishPhase(s,clock);finishPhase(s,clock);
 assert.equal(s.records.at(-1).movementTitle,'Gentle weight shifts');
 assert.equal(s.records.at(-1).seconds,12);
});
test('restoration returns the original named movement and accurate session record',()=>{
 const {s,clock}=create();begin(s);finishPhase(s,clock);assert(s.lightenNext());assert(s.undoLighten());
 assert.equal(s.movement('flow_b').title,'Side steps');
 finishPhase(s,clock);finishPhase(s,clock);finishPhase(s,clock);
 assert.equal(s.records.at(-1).movementTitle,'Side steps');
});

test("movement snapshots match the user's chosen replacement after ending early",()=>{
 const {s,clock}=create();begin(s);finishPhase(s,clock);assert(s.lightenNext());
 finishPhase(s,clock);finishPhase(s,clock);assert.equal(s.activeMovement.title,'Gentle weight shifts');
 assert(s.askEnd());assert(s.confirmEnd());
 assert.equal(s.records.at(-1).movementTitle,'Gentle weight shifts');
 assert.equal(s.records.at(-1).outcome,'skipped');
});

test('hands-free flow is off by default and advances only after a three-second preview',()=>{
 const {s,clock}=create();assert.equal(s.autoFlow,false);begin(s);
 assert(s.setAutoFlow(true));clock.forward(10);assert(s.tick());assert(s.waiting);
 assert.equal(s.autoCountdown,3);assert.equal(s.records.length,0);
 clock.forward(2);assert.equal(s.tick(),false);assert.equal(s.stage,'settle');
 clock.forward(1);assert(s.tick());assert.equal(s.stage,'flow_a');assert.equal(s.records.length,1);
 assert.equal(s.timer().status,'running');assert.equal(s.records[0].movementTitle,'Shoulder rolls');
});

test('Stay here prevents automatic advance until manual Continue',()=>{
 const {s,clock}=create();begin(s);s.setAutoFlow(true);clock.forward(10);s.tick();
 assert(s.holdNext());clock.forward(120);assert.equal(s.tick(),false);assert.equal(s.stage,'settle');
 assert.equal(s.autoCountdown,null);assert(s.next());assert.equal(s.stage,'flow_a');
});

test('hands-free can be disabled while waiting without losing the completed phase',()=>{
 const {s,clock}=create();begin(s);s.setAutoFlow(true);clock.forward(10);s.tick();
 assert(s.setAutoFlow(false));clock.forward(5);assert.equal(s.tick(),false);
 assert.equal(s.completed,0);assert(s.next());assert.equal(s.completed,1);assert.equal(s.stage,'flow_a');
});

test('ending while countdown is pending cancels auto transition and preserves completion',()=>{
 const {s,clock}=create();begin(s);s.setAutoFlow(true);clock.forward(10);s.tick();
 assert(s.askEnd());clock.forward(60);assert.equal(s.tick(),false);assert(s.confirmEnd());
 assert.equal(s.stage,'summary');assert.equal(s.completed,1);assert.equal(s.skipped,0);
 assert.equal(s.autoCountdown,null);assert(s.reset());assert.equal(s.autoFlow,false);
});
