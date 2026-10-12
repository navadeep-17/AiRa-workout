import type {Movement,Phase} from './workout-session.js';

/** The catalog is deliberately constrained. Neither AI nor user strings become HTML or executable code. */
export const CATALOG = {
  shoulder_rolls:{title:'Shoulder rolls',instruction:'Roll your shoulders gently back, then forward.',detail:'An easy beginning. Take your time.',cue:'Begin with a small, easy movement.',kind:'shoulders',rhythm:'ROLL · RELEASE'},
  marching:{title:'March in place',instruction:'Lift one foot, then the other, at a comfortable pace.',detail:'Find a rhythm that feels comfortable for you.',cue:'Find your own steady rhythm.',kind:'march',rhythm:'LEFT · RIGHT'},
  recovery:{title:'A breathing break',instruction:'Rest comfortably and breathe naturally.',detail:'Let the next movement wait while you recover.',cue:'Take your time. There is no hurry.',kind:'breath',rhythm:'REST · BREATHE'},
  side_steps:{title:'Side steps',instruction:'Step to one side, bring your feet together, then switch.',detail:'Small steps are enough.',cue:'Take one comfortable step at a time.',kind:'steps',rhythm:'SIDE · SIDE'},
  weight_shifts:{title:'Gentle weight shifts',instruction:'Shift your weight softly from one foot to the other.',detail:'A simple, small-space alternative.',cue:'Keep the movement small and comfortable.',kind:'shifts',rhythm:'SHIFT · SETTLE'},
  arm_reach:{title:'Slow arm reach',instruction:'Gently raise and lower your arms in your own time.',detail:'Move slowly, or simply rest if you prefer.',cue:'Reach gently, without rushing.',kind:'reach',rhythm:'REACH · LOWER'},
  desk_release:{title:'Desk-side shoulder release',instruction:'Gently lift your shoulders, then let them settle.',detail:'A subtle option for a limited workspace.',cue:'Make a little room around your shoulders.',kind:'desk',rhythm:'LIFT · RELEASE'},
  wrist_release:{title:'Wrist and finger release',instruction:'Slowly open and close your hands; gently circle your wrists.',detail:'A quiet, low-space movement.',cue:'Easy does it. Small movements are enough.',kind:'wrist',rhythm:'OPEN · RELEASE'},
  toe_taps:{title:'Easy toe taps',instruction:'Gently tap one foot forward, then switch sides.',detail:'A small movement that needs little floor space.',cue:'A little movement, your own rhythm.',kind:'taps',rhythm:'TAP · SWITCH'},
} as const satisfies Record<string,Movement>;
export type MovementId=keyof typeof CATALOG;
export type Goal='energize'|'reset'|'unwind';
export type Space='room'|'compact';
export type PlannerInput={request:string;goal?:Goal;space?:Space;durationSeconds?:number};
export type PlannedStep={id:MovementId;seconds:number};
export type SessionPlan={goal:Goal;space:Space;durationSeconds:number;source:'offline'|'openai-api';request:string;rationale:string;steps:Record<Phase,PlannedStep>};
export const PLAN_PHASES=['settle','flow_a','recovery','flow_b','wind_down'] as const satisfies readonly Phase[];
const idSet=new Set<string>(Object.keys(CATALOG));
const compactOnly=new Set<MovementId>(['shoulder_rolls','recovery','weight_shifts','arm_reach','desk_release','wrist_release','toe_taps']);
const compactRationale='Small-space movements with a generous recovery interval.';
const goalRationale:Record<Goal,string>={energize:'A little variety and steady movement to lift the moment.',reset:'A grounded sequence with gentle, practical movements.',unwind:'A quiet rhythm with extra time to settle.'};
function goalFromText(s:string):Goal{
 if(/\b(relax|unwind|calm|wind down|stress|sleep|quiet)\b/i.test(s))return 'unwind';
 if(/\b(energy|energize|boost|wake|active|sweat|fast|focus|lively)\b/i.test(s))return 'energize';
 return 'reset';
}
function spaceFromText(s:string):Space{return /\b(desk|seated|sitting|chair|office|small|tiny|limited|little space|no space|compact|indoors)\b/i.test(s)?'compact':'room';}
function durationFromText(s:string):number|undefined{
 const match=s.match(/\b(\d{1,3})\s*(seconds?|secs?|minutes?|mins?)\b/i);
 if(match)return Math.round(Number(match[1]) * (/^(m)/i.test(match[2])?60:1));
 if(/\b(two minutes?|couple of minutes?)\b/i.test(s))return 120;
 if(/\b(one minute|a minute)\b/i.test(s))return 60;
 if(/\b(three minutes?)\b/i.test(s))return 180;
 return undefined;
}
function clampDuration(value:number|undefined){return Number.isFinite(value)?Math.max(60,Math.min(180,Math.round(value!))):90;}
export function inferRequest(input:PlannerInput){const request=input.request.trim().slice(0,280);
 return {request,goal:input.goal??goalFromText(request),space:input.space??spaceFromText(request),durationSeconds:clampDuration(input.durationSeconds??durationFromText(request))};
}
/** All five phases have at least ten seconds; remaining time is distributed with exact sum. */
export function allocateDuration(total:number,weights:readonly number[]):number[]{
 const minimum=10,remaining=total-weights.length*minimum;
 const weightSum=weights.reduce((n,x)=>n+x,0);
 const counts=weights.map(w=>minimum+Math.floor(remaining*w/weightSum));
 let difference=total-counts.reduce((n,x)=>n+x,0);
 for(let i=0;difference>0;i=(i+1)%counts.length,difference--)counts[i]++;
 return counts;
}
export function buildOfflinePlan(input:PlannerInput):SessionPlan{
 const p=inferRequest(input);
 const ids:Record<Goal,Record<Space,[MovementId,MovementId,MovementId,MovementId,MovementId]>>={
  energize:{room:['shoulder_rolls','marching','recovery','side_steps','arm_reach'],compact:['desk_release','toe_taps','recovery','weight_shifts','arm_reach']},
  reset:{room:['shoulder_rolls','weight_shifts','recovery','toe_taps','arm_reach'],compact:['desk_release','wrist_release','recovery','weight_shifts','arm_reach']},
  unwind:{room:['arm_reach','weight_shifts','recovery','shoulder_rolls','wrist_release'],compact:['wrist_release','desk_release','recovery','weight_shifts','arm_reach']},
 };
 const weights=p.goal==='energize'?[1,3,2,3,1]:p.goal==='unwind'?[2,2,3,2,2]:[2,2,3,2,1];
 const seconds=allocateDuration(p.durationSeconds,weights);
 const steps={} as Record<Phase,PlannedStep>;
 PLAN_PHASES.forEach((phase,i)=>steps[phase]={id:ids[p.goal][p.space][i],seconds:seconds[i]});
 return {...p,source:'offline',rationale:(p.space==='compact'?compactRationale+' ':'')+goalRationale[p.goal],steps};
}
/** Validate and normalize a model proposal before it reaches the trusted session state. */
export function validatePlan(raw:unknown,input:PlannerInput):SessionPlan|null{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 const o=raw as Record<string,unknown>;
 const p=inferRequest(input);
 if(o.goal!==p.goal||o.space!==p.space||o.durationSeconds!==p.durationSeconds)return null;
 if(!Array.isArray(o.steps)||o.steps.length!==5)return null;
 const seen=new Set<string>(),steps={} as Record<Phase,PlannedStep>;
 let sum=0;
 for(let i=0;i<5;i++){
  const row=o.steps[i];if(!row||typeof row!=='object'||Array.isArray(row))return null;
  const s=row as Record<string,unknown>,phase=PLAN_PHASES[i];
  if(s.phase!==phase||typeof s.id!=='string'||!idSet.has(s.id)||!Number.isInteger(s.seconds)||Number(s.seconds)<10||Number(s.seconds)>95)return null;
  if(p.space==='compact'&&!compactOnly.has(s.id as MovementId))return null;
  if(phase==='recovery'&&s.id!=='recovery'||phase!=='recovery'&&s.id==='recovery')return null;
  if(seen.has(s.id)&&phase!=='wind_down')return null;
  seen.add(s.id);
  steps[phase]={id:s.id as MovementId,seconds:Number(s.seconds)};sum+=Number(s.seconds);
 }
 if(sum!==p.durationSeconds)return null;
 const rationale=typeof o.rationale==='string'?o.rationale.trim().slice(0,180):'';
 if(!rationale)return null;
 return {...p,source:'openai-api',rationale,steps};
}
export function alternativeFor(plan:SessionPlan):MovementId{
 const id=plan.steps.flow_b.id;
 if(id==='side_steps'||id==='marching'||id==='toe_taps')return 'weight_shifts';
 if(id==='weight_shifts')return 'wrist_release';
 if(id==='shoulder_rolls'||id==='desk_release')return 'wrist_release';
 return 'weight_shifts';
}
export function stepMovement(id:MovementId):Movement {return CATALOG[id];}
