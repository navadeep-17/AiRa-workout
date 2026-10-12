import { TimerLedger } from './openui/timer-store.js';

export const PHASE_KEYS = ['settle', 'flow_a', 'recovery', 'flow_b', 'wind_down'] as const;
export const STAGES = ['welcome', 'setup', 'preview', ...PHASE_KEYS, 'summary'] as const;
export type Phase = typeof PHASE_KEYS[number];
export type Stage = typeof STAGES[number];
export type Preset = 'quick'|'unhurried';
export type Pace = 'steady'|'gentle';
export type Modal = 'skip'|'end'|null;
export type Outcome = 'completed'|'skipped';
export const PHASE_INFO: Record<Phase,{name:string;note:string;cue:string;symbol:string}> = {
  settle:{name:'Shoulder rolls',note:'Ease into the moment',cue:'A small beginning. Everything here is simulated.',symbol:'✳'},
  flow_a:{name:'March in place',note:'A focused interval',cue:'Just this moment. The next step can wait.',symbol:'↗'},
  recovery:{name:'A breathing break',note:'Room to recover',cue:'No rush. Need another moment? Add ten seconds.',symbol:'◌'},
  flow_b:{name:'Side steps',note:'One more focused interval',cue:'You set the pace. We follow your lead.',symbol:'↗'},
  wind_down:{name:'Slow arm reach',note:'Bring it to a close',cue:'Nearly there. Finish when you feel ready.',symbol:'✺'},
};
/** Short, legible simulated movement content, not clinical exercise advice. */
export type MovementKind = 'shoulders'|'march'|'breath'|'steps'|'shifts'|'reach';
export type Movement = {title:string; instruction:string; detail:string; cue:string; kind:MovementKind; rhythm:string};
export const MOVEMENTS:Record<Phase,Movement> = {
  settle:{title:'Shoulder rolls',instruction:'Roll your shoulders gently back, then forward.',detail:'Start small, with space to settle into the session.',cue:'Ease in. There is no perfect pace to keep.',kind:'shoulders',rhythm:'ROLL · RELEASE'},
  flow_a:{title:'March in place',instruction:'Lift one foot, then the other, at a comfortable pace.',detail:'A simple, steady movement; pause whenever you need.',cue:'Find a rhythm that feels comfortable for you.',kind:'march',rhythm:'LEFT · RIGHT'},
  recovery:{title:'A breathing break',instruction:'Rest, stand or sit comfortably, and breathe naturally.',detail:'Take the time you need. The next move can wait.',cue:'This time belongs to you. Add ten seconds if you like.',kind:'breath',rhythm:'IN · OUT'},
  flow_b:{title:'Side steps',instruction:'Step to one side, bring your feet together, then switch.',detail:'Small steps are enough. The demo counts time, not reps.',cue:'Just one easy step at a time.',kind:'steps',rhythm:'SIDE · SIDE'},
  wind_down:{title:'Slow arm reach',instruction:'Gently raise and lower your arms in your own time.',detail:'A quiet end to the sequence; no need to rush.',cue:'Finish gently. You choose when you are done.',kind:'reach',rhythm:'REACH · LOWER'},
};
export const LIGHT_MOVEMENT:Movement = {title:'Gentle weight shifts',instruction:'Shift your weight softly from one foot to the other.',detail:'A quieter alternative to side steps, with a shorter interval.',cue:'You asked for an easier option. Small shifts are enough.',kind:'shifts',rhythm:'SHIFT · SETTLE'};

const ALLOCATIONS: Record<Preset,Record<Pace,number[]>> = {
  quick: {steady:[10,20,15,20,10],gentle:[10,16,23,16,10]},
  unhurried:{steady:[10,30,20,30,15],gentle:[10,24,32,24,15]},
};
export function formatDuration(seconds:number):string {
  const x=Math.max(0,Math.ceil(seconds));return `${Math.floor(x/60)}:${String(x%60).padStart(2,'0')}`;
}
export type SessionRecord={phase:Phase;outcome:Outcome;seconds:number;plannedSeconds:number;movementTitle:string};

/** Local, explicitly simulated experience. All behavior is trusted browser state, not model-issued JS. */
export class WorkoutSession {
  readonly timers:TimerLedger;
  stage:Stage='welcome';preset:Preset='quick';pace:Pace='steady';modal:Modal=null;
  paused=false;waiting=false;endedEarly=false;showPlan=false;showHow=false;
  recoveryAdded=0;lightened=false;message='';revision=0;
  readonly records:SessionRecord[]=[];readonly changes:string[]=[];
  private activeSeconds:Record<Phase,number>={settle:10,flow_a:20,recovery:15,flow_b:20,wind_down:10};
  private modalWasRunning=false;
  constructor(clock?:()=>number){this.timers=new TimerLedger(clock);this.rebuildPlan();}
  get activePhase(): Phase|null {return PHASE_KEYS.includes(this.stage as Phase)?this.stage as Phase:null;}
  get phaseIndex(){return this.activePhase?PHASE_KEYS.indexOf(this.activePhase):-1;}
  get totalPlanned(){return PHASE_KEYS.reduce((n,p)=>n+this.activeSeconds[p],0);}
  duration(p:Phase){return this.activeSeconds[p];}
  movement(p:Phase):Movement{return p==='flow_b'&&this.lightened?LIGHT_MOVEMENT:MOVEMENTS[p];}
  get activeMovement():Movement|null{return this.activePhase?this.movement(this.activePhase):null;}
  timer(){const phase=this.activePhase;return phase?this.timers.list().find(t=>t.id===phase):undefined;}
  get elapsed(){const previous=this.records.reduce((n,r)=>n+r.seconds,0);const active=this.timer();return previous+(active?active.seconds-active.remaining:0);}
  get completed(){return this.records.filter(r=>r.outcome==='completed').length;}
  get skipped(){return this.records.filter(r=>r.outcome==='skipped').length;}
  private mark(msg:string){this.message=msg;this.revision++;return true;}
  /** Visible local text response; never pretends that a model or sensor did anything. */
  respond(msg:string){return this.mark(msg);}
  get coachCue():string {
    if(this.stage==='welcome')return 'Choose a short, simulated movement session. No tracking or equipment needed.';
    if(this.stage==='setup')return 'Pick a duration and a pace; the plan updates before you start.';
    if(this.stage==='preview')return 'Review each movement before you start. All intervals are simulated.';
    if(this.stage==='summary')return this.endedEarly?'You ended when it felt right. Only finished phases are counted.':'Only completed phases are counted. This was a simulation.';
    const phase=this.activePhase;
    if(!phase)return 'You are in control of this session.';
    if(this.waiting)return `Phase complete: ${this.movement(phase).title}. Continue when you are ready.`;
    if(this.paused)return 'Paused. Nothing moves forward until you choose to resume.';
    if(phase==='recovery')return this.recoveryAdded?'You have extra recovery time. The next move will wait.':this.movement(phase).cue;
    if(phase==='flow_b'&&this.lightened)return LIGHT_MOVEMENT.cue;
    if(this.pace==='gentle')return `Gentle pace: ${this.movement(phase).cue}`;
    return this.movement(phase).cue;
  }
  private rebuildPlan(){const base=ALLOCATIONS[this.preset][this.pace];PHASE_KEYS.forEach((k,i)=>{this.activeSeconds[k]=base[i];});}
  toSetup(){if(this.stage!=='welcome')return false;this.stage='setup';return this.mark('Choose the kind of moment you have.');}
  toWelcome(){if(this.stage!=='setup')return false;this.stage='welcome';return this.mark('Welcome back.');}
  choosePreset(p:Preset){if(this.stage!=='setup'||!['quick','unhurried'].includes(p))return false;this.preset=p;this.rebuildPlan();return this.mark(`${p==='quick'?'Quick':'Unhurried'} session selected.`);}
  choosePace(p:Pace){if(this.stage!=='setup'||!['steady','gentle'].includes(p))return false;this.pace=p;this.rebuildPlan();return this.mark(`${p==='gentle'?'Gentle':'Steady'} pace selected.`);}
  toPreview(){if(this.stage!=='setup')return false;this.stage='preview';return this.mark('Your simulated plan is ready.');}
  edit(){if(this.stage!=='preview')return false;this.stage='setup';return this.mark('Make it yours.');}
  start(){if(this.stage!=='preview')return false;this.records.length=0;this.changes.length=0;this.endedEarly=false;this.timers.forget();this.enter('settle');return this.mark('Session started · simulated only.');}
  private enter(phase:Phase){this.stage=phase;this.modal=null;this.paused=false;this.waiting=false;this.timers.ensure(phase,{label:this.movement(phase).title,seconds:this.duration(phase)});this.timers.start(phase);}
  tick(){if(!this.activePhase||this.waiting||this.modal)return false;const t=this.timer();if(t?.status==='done'){
    this.waiting=true;this.paused=false;return this.mark(`${this.movement(this.activePhase).title} complete. Continue when you are ready.`);
  }return false;}
  togglePause(){if(!this.activePhase||this.waiting||this.modal)return false;const t=this.timer();if(!t)return false;
    if(t.status==='running'){this.timers.pause(t.id);this.paused=true;return this.mark('Paused. Your place is kept.');}
    if(t.status==='paused'){this.timers.start(t.id);this.paused=false;return this.mark('Resumed with the same remaining time.');}return false;}
  extendRecovery(){if(this.stage!=='recovery'||this.waiting||this.modal||this.recoveryAdded>=30)return false;
    const t=this.timer();if(!t||!['running','paused'].includes(t.status))return false;
    if(!this.timers.extend('recovery',10))return false;
    this.activeSeconds.recovery+=10;this.recoveryAdded+=10;this.changes.push('+10 seconds to recovery');
    return this.mark(`Added 10 seconds. ${formatDuration(this.timer()!.remaining)} remaining.`);}
  lightenNext(){if(!['flow_a','recovery'].includes(this.stage)||this.modal||this.lightened)return false;
    const old=this.activeSeconds.flow_b,next=Math.max(10,Math.floor(old*.6));this.activeSeconds.flow_b=next;this.lightened=true;
    this.changes.push(`Side steps changed to Gentle weight shifts (${old}s → ${next}s)`);return this.mark(`Switched to Gentle weight shifts for ${next} seconds.`);}
  undoLighten(){if(!this.lightened||!['flow_a','recovery'].includes(this.stage)||this.modal)return false;
    const old=this.activeSeconds.flow_b;this.activeSeconds.flow_b=ALLOCATIONS[this.preset][this.pace][3];this.lightened=false;
    this.changes.push(`Side steps restored (${old}s → ${this.activeSeconds.flow_b}s)`);return this.mark('Side steps are back in your plan.');}
  next(){if(!this.activePhase||!this.waiting||this.modal)return false;const phase=this.activePhase;
    this.records.push({phase,outcome:'completed',seconds:this.duration(phase),plannedSeconds:this.duration(phase),movementTitle:this.movement(phase).title});
    this.timers.forget(phase);const next=PHASE_KEYS[this.phaseIndex+1];if(next)this.enter(next);else this.stage='summary';
    return this.mark(next?`Next: ${this.movement(next).title}.`:'Your simulated session is complete.');}
  askSkip(){if(!this.activePhase||this.modal||this.waiting)return false;this.modalWasRunning=this.timer()?.status==='running';if(this.modalWasRunning)this.timers.pause(this.activePhase);this.modal='skip';return this.mark('Skip this phase? It will not count as completed.');}
  askEnd(){if(!this.activePhase||this.modal)return false;this.modalWasRunning=this.timer()?.status==='running';if(this.modalWasRunning)this.timers.pause(this.activePhase);this.modal='end';return this.mark('End this simulated session early?');}
  dismissModal(){if(!this.modal||!this.activePhase)return false;this.modal=null;if(this.modalWasRunning&&!this.waiting)this.timers.start(this.activePhase);this.paused=this.timer()?.status==='paused';return this.mark('Back to your session.');}
  confirmSkip(){if(this.modal!=='skip'||!this.activePhase)return false;const phase=this.activePhase,t=this.timer()!;
    const spent=Math.max(0,t.seconds-t.remaining);this.records.push({phase,outcome:'skipped',seconds:spent,plannedSeconds:this.duration(phase),movementTitle:this.movement(phase).title});
    this.timers.forget(phase);const next=PHASE_KEYS[this.phaseIndex+1];this.modal=null;this.paused=false;
    if(next){this.stage=next;this.waiting=false;this.timers.ensure(next,{label:PHASE_INFO[next].name,seconds:this.duration(next)});this.paused=true;}else this.stage='summary';
    return this.mark(next?`Skipped. ${this.movement(next).title} is ready when you are.`:'Session reached its end with a skipped phase.');}
  beginReady(){if(!this.activePhase||!this.paused||this.modal||this.waiting)return false;const t=this.timer();if(t?.status!=='stopped')return false;
    this.paused=false;this.timers.start(t.id);return this.mark(`Starting ${this.movement(this.activePhase).title}.`);}
  confirmEnd(){if(this.modal!=='end'||!this.activePhase)return false;const phase=this.activePhase,t=this.timer()!;
    this.records.push({phase,outcome:this.waiting?'completed':'skipped',seconds:this.waiting?this.duration(phase):Math.max(0,t.seconds-t.remaining),plannedSeconds:this.duration(phase),movementTitle:this.movement(phase).title});
    this.timers.forget(phase);this.modal=null;this.stage='summary';this.paused=false;this.waiting=false;this.endedEarly=true;
    return this.mark('Session ended early. You chose when to stop.');}
  togglePlan(){this.showPlan=!this.showPlan;return this.mark(this.showPlan?'Your session plan is visible.':'Plan closed.');}
  toggleHow(){this.showHow=!this.showHow;return this.mark(this.showHow?'How this simulation works.':'');}
  reset(){this.stage='welcome';this.preset='quick';this.pace='steady';this.modal=null;this.paused=false;this.waiting=false;this.endedEarly=false;this.showPlan=false;this.showHow=false;
    this.recoveryAdded=0;this.lightened=false;this.records.length=0;this.changes.length=0;this.timers.forget();this.rebuildPlan();return this.mark('Ready for another little moment.');}
}
