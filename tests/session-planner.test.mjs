import test from 'node:test';
import assert from 'node:assert/strict';
import {buildOfflinePlan,validatePlan,allocateDuration,PLAN_PHASES,CATALOG} from '../dist/shared/session-planner.js';
import {WorkoutSession} from '../dist/shared/workout-session.js';

const energetic='I have 2 minutes and room to move. I want an energy boost.';
const compact='I am sitting at my desk with very little space. A gentle reset for 2 minutes.';
const modelShape=p=>({goal:p.goal,space:p.space,durationSeconds:p.durationSeconds,rationale:'The movement sequence fits the available time and space.',steps:PLAN_PHASES.map(phase=>({phase,...p.steps[phase]}))});
test('request-driven plans differ in movement choice, space and rationale',()=>{
 const active=buildOfflinePlan({request:energetic}),desk=buildOfflinePlan({request:compact});
 assert.equal(active.goal,'energize');assert.equal(active.space,'room');assert.equal(active.durationSeconds,120);
 assert.equal(active.steps.flow_a.id,'marching');assert.equal(active.steps.flow_b.id,'side_steps');
 assert.equal(desk.goal,'reset');assert.equal(desk.space,'compact');assert.equal(desk.durationSeconds,120);
 assert.equal(desk.steps.flow_a.id,'wrist_release');assert.equal(desk.steps.flow_b.id,'weight_shifts');
 assert.notDeepEqual(active.steps,desk.steps);
 for(const p of [active,desk])assert.equal(PLAN_PHASES.reduce((n,phase)=>n+p.steps[phase].seconds,0),p.durationSeconds);
});
test('offline inference accepts three distinct intentions and bounded lengths',()=>{
 const unwind=buildOfflinePlan({request:'I want to unwind quietly for 90 seconds'});
 assert.equal(unwind.goal,'unwind');assert.equal(unwind.durationSeconds,90);
 assert.equal(unwind.steps.settle.id,'arm_reach');
 for(const prompt of ['I have 1 minute','I have 2 minutes','I have 3 minutes','I have 999 minutes']){
  const plan=buildOfflinePlan({request:prompt});assert(plan.durationSeconds>=60&&plan.durationSeconds<=180);
  assert.equal(PLAN_PHASES.reduce((n,p)=>n+plan.steps[p].seconds,0),plan.durationSeconds);
 }
 assert.equal(allocateDuration(75,[1,2,3,2,1]).reduce((n,x)=>n+x,0),75);
});
test('all offline movements come from catalog, recovery only occupies recovery phase',()=>{
 for(const request of [energetic,compact,'Calm and unwind for 3 minutes, standing in a small office']){
  const p=buildOfflinePlan({request});for(const phase of PLAN_PHASES){assert(CATALOG[p.steps[phase].id]);assert(p.steps[phase].seconds>=10);assert.equal(p.steps[phase].id==='recovery',phase==='recovery');}
 }
});
test('model proposals validate against known movement ids, phase order and duration',()=>{
 const input={request:energetic},fallback=buildOfflinePlan(input),valid=modelShape(fallback);
 assert.equal(validatePlan(valid,input)?.source,'openai-api');
 assert.equal(validatePlan({...valid,steps:[...valid.steps].reverse()},input),null);
 assert.equal(validatePlan({...valid,steps:valid.steps.map((s,i)=>i===1?{...s,id:'imaginary_sprint'}:s)},input),null);
 assert.equal(validatePlan({...valid,steps:valid.steps.map((s,i)=>i===1?{...s,seconds:s.seconds+2}:s)},input),null);
 assert.equal(validatePlan({...valid,goal:'unwind'},input),null);
});
test('compact model request rejects space-consuming activity even with correct duration',()=>{
 const input={request:compact},valid=modelShape(buildOfflinePlan(input));
 assert(validatePlan(valid,input));
 assert.equal(validatePlan({...valid,steps:valid.steps.map((step,i)=>i===1?{...step,id:'side_steps'}:step)},input),null);
});
test('request-driven plan renders as trusted session state and preserves pause, adaptation, records',()=>{
 let now=0;const s=new WorkoutSession(()=>now),plan=buildOfflinePlan({request:compact});
 assert(s.applyPlan(plan));assert.equal(s.stage,'preview');assert.equal(s.movement('flow_a').title,'Wrist and finger release');
 assert.equal(s.totalPlanned,120);assert(s.start());
 const advance=()=>{now+=s.timer().remaining*1000+100;s.tick();assert(s.waiting);s.next();};
 advance();assert.equal(s.stage,'flow_a');const left=s.timer().remaining;
 assert(s.lightenNext());assert.equal(s.movement('flow_b').title,'Wrist and finger release');assert.equal(s.timer().remaining,left);
 assert(s.undoLighten());assert.equal(s.movement('flow_b').title,'Gentle weight shifts');
 advance();assert.equal(s.stage,'recovery');now+=4000;assert(s.extendRecovery());
 advance();assert.equal(s.stage,'flow_b');advance();assert.equal(s.stage,'wind_down');advance();
 assert.equal(s.stage,'summary');assert.equal(s.completed,5);assert.equal(s.elapsed,130);
 assert.equal(s.records.find(r=>r.phase==='flow_a').movementTitle,'Wrist and finger release');
 assert(s.reset());assert.equal(s.selectedPlan,null);
});
test('empty or distress requests do not start a fictional workout',()=>{
 const s=new WorkoutSession();assert(s.makePlan({request:''}));assert.equal(s.stage,'welcome');
 assert(s.makePlan({request:'I feel dizzy and unwell'}));assert.equal(s.stage,'welcome');
 assert.match(s.message,/cannot assess symptoms/i);
});
