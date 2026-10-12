import {PHASE_KEYS,formatDuration,WorkoutSession} from './workout-session.js';

export type WorkoutIntentResult={intent:string;message:string;changed:boolean};
/** Detect a local control command without mutating the session. Model calls are for questions only. */
export function isLocalWorkoutCommand(input:string):boolean {
 const t=input.toLowerCase().replace(/[’]/g,"'").trim().replace(/[!?.,]+/g,' ').replace(/\s+/g,' ');
 return /\b(what(?:'s| is) next|next phase|up next|how much time|time left|how long|remaining|progress|where am i|undo|restore|original pace|go back to normal|more time|more rest|ten more|extra rest|extend|add (?:10|ten)|another (?:10|ten)|lighter|slower|slow down|less intense|easier|gentler|low energy|tired)\b/.test(t)||
 /^(pause|pause (?:the )?(?:timer|session|workout)|hold on|wait|resume|resume (?:the )?(?:timer|session|workout)|i(?:'m| am) ready|keep going|continue|next|continue to next|next phase please|skip|skip (?:this )?(?:phase|part|interval)|stop|stop workout|end|end session|end workout|finish early|i want to stop|show plan|view plan|my plan|quick|unhurried|steady|gentle)$/.test(t);
}

/**
 * Deterministic local Mock-mode commands. These are deliberately NOT called AI reasoning.
 * Only the trusted session's guarded methods can change timers or progress.
 */
export function handleWorkoutIntent(session:WorkoutSession,input:string):WorkoutIntentResult {
  const text=input.toLowerCase().replace(/[’]/g,"'").trim().replace(/[!?.,]+/g,' ').replace(/\s+/g,' ');
  let intent='help',changed=false;
  const answer=(message:string)=>session.respond(message);
  if(/\b(what(?:'s| is) next|next phase|up next)\b/.test(text)){
    intent='next-preview';const next=session.activePhase?PHASE_KEYS[session.phaseIndex+1]:undefined;
    changed=answer(next?`Up next: ${session.movement(next).title} (${formatDuration(session.duration(next))}).`:
      session.stage==='summary'?'The session has ended. Choose Try another session to start again.':'Your next phase appears in the plan preview.');
  }else if(/\b(how much time|time left|how long|remaining|progress|where am i)\b/.test(text)){
    intent='progress';const t=session.timer();
    changed=answer(t?`${session.activeMovement!.title}: ${formatDuration(t.remaining)} left. ${session.completed} of 5 phases completed.`:
      session.stage==='summary'?`${session.completed} completed, ${session.skipped} skipped; ${formatDuration(session.elapsed)} simulated time.`:
      `Your selected plan is ${formatDuration(session.totalPlanned)} across five phases.`);
  }else if(/\b(undo|restore|original pace|go back to normal)\b/.test(text)){
    intent='restore';changed=session.undoLighten();if(!changed)changed=answer('There is no shortened upcoming interval to restore right now.');
  }else if(/\b(more time|more rest|ten more|extra rest|extend|add (?:10|ten)|another (?:10|ten))\b/.test(text)){
    intent='extend';changed=session.extendRecovery();if(!changed)changed=answer(session.stage==='recovery'&&session.recoveryAdded>=30?
      'You have added the maximum 30 seconds of recovery. You can pause the session instead.':
      'Extra time is available while the recovery countdown is active. You can pause at any moment.');
  }else if(/\b(lighter|slower|slow down|less intense|easier|gentler|low energy|tired)\b/.test(text)){
    intent='lighten';changed=session.lightenNext();if(!changed)changed=answer(session.lightened?
      'Your next flow is already shortened. You can undo that change before it starts.':
      'You can choose an easier next movement during the first flow or recovery. To stop now, choose Pause.');
  }else if(/^(?:pause|pause (?:the )?(?:timer|session|workout)|hold on|wait)$/i.test(text)){
    intent='pause';changed=!session.paused&&session.togglePause();if(!changed)changed=answer(session.paused?'Already paused. Resume when you are ready.':'Pause is available during a running phase.');
  }else if(/^(?:resume|resume (?:the )?(?:timer|session|workout)|i(?:'m| am) ready|keep going)$/i.test(text)){
    intent='resume';changed=session.beginReady()||session.paused&&session.togglePause();if(!changed)changed=answer('When the timer is paused, use Resume. If a phase is complete, use Continue.');
  }else if(/^(?:continue|next|continue to next|next phase please)$/i.test(text)){
    intent='continue';changed=session.next()||session.beginReady()||session.paused&&session.togglePause();if(!changed)changed=answer('The session will advance only when the current phase is complete.');
  }else if(/^(?:skip|skip (?:this )?(?:phase|part|interval))$/i.test(text)){
    intent='skip';changed=session.askSkip();if(!changed)changed=answer(session.waiting?'This phase is already complete. Continue instead.':'You can skip while a phase is active.');
  }else if(/^(?:stop|stop workout|end|end session|end workout|finish early|i want to stop)$/i.test(text)){
    intent='end';changed=session.askEnd();if(!changed)changed=answer('End session is available during the workout.');
  }else if(/^(?:show plan|view plan|my plan)$/i.test(text)){
    intent='plan';changed=session.togglePlan();
  }else if(session.stage==='setup'&&/^(?:quick|unhurried|steady|gentle)$/.test(text)){
    intent='choose';changed=text==='quick'||text==='unhurried'?session.choosePreset(text):session.choosePace(text as 'steady'|'gentle');
  }else {
    intent='help';changed=answer(session.activePhase?
      'Try “more rest”, “slower”, “pause”, “what’s next”, or “end session”. These are local demo commands.':
      'This is a local text demo. Start with Make my session, then choose your time and pace.');
  }
  return {intent,message:session.message,changed};
}