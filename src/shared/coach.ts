import {PHASE_KEYS,STAGES,MOVEMENTS,LIGHT_MOVEMENT,type Pace,type Phase,type Preset,type Stage} from './workout-session.js';

/** Only these bounded, non-identifying facts may be sent for an opted-in coaching reply. */
export type CoachContext={stage:Stage;pace:Pace;preset:Preset;paused:boolean;waiting:boolean;remainingSeconds:number;completed:number;skipped:number;lightened:boolean;recoveryAdded:number;movement:string};
export type CoachRequest={provider:'openai-api';consent:true;question:string;context:CoachContext};
const isRecord=(v:unknown):v is Record<string,unknown>=>Boolean(v)&&typeof v==='object'&&!Array.isArray(v);
const inSet=(v:unknown,set:readonly string[])=>typeof v==='string'&&set.includes(v);
const int=(v:unknown,min:number,max:number)=>Number.isInteger(v)&&typeof v==='number'&&v>=min&&v<=max;
export function isCoachRequest(v:unknown):v is CoachRequest {
 if(!isRecord(v)||Object.keys(v).sort().join(',')!=='consent,context,provider,question'||v.provider!=='openai-api'||v.consent!==true||typeof v.question!=='string'||v.question.trim().length<2||v.question.length>320)return false;
 const s=v.context;
 return isRecord(s)&&Object.keys(s).sort().join(',')==='completed,lightened,movement,pace,paused,preset,recoveryAdded,remainingSeconds,skipped,stage,waiting'&&
 inSet(s.stage,STAGES)&&inSet(s.movement,['Not started','Session complete',...Object.values(MOVEMENTS).map(m=>m.title),LIGHT_MOVEMENT.title])&&inSet(s.pace,['steady','gentle'])&&inSet(s.preset,['quick','unhurried'])&&
 ['paused','waiting','lightened'].every(k=>typeof s[k]==='boolean')&&int(s.remainingSeconds,0,600)&&int(s.completed,0,5)&&int(s.skipped,0,5)&&int(s.recoveryAdded,0,30);
}
export function coachContext(s:{stage:Stage;pace:Pace;preset:Preset;paused:boolean;waiting:boolean;timer():{remaining:number}|undefined;completed:number;skipped:number;lightened:boolean;recoveryAdded:number;activeMovement:{title:string}|null}):CoachContext {
 return {stage:s.stage,pace:s.pace,preset:s.preset,paused:s.paused,waiting:s.waiting,remainingSeconds:Math.max(0,Math.min(600,Math.ceil(s.timer()?.remaining??0))),completed:s.completed,skipped:s.skipped,lightened:s.lightened,recoveryAdded:s.recoveryAdded,movement:s.activeMovement?.title??(s.stage==='summary'?'Session complete':'Not started')};
}
export function isActivePhase(stage:Stage):stage is Phase{return (PHASE_KEYS as readonly string[]).includes(stage);}
