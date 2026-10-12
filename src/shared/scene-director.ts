import {type WorkoutSession} from './workout-session.js';

/** Presentation-only choreography derived from trusted session facts; never controls the timer. */
export type SceneBeat = 'introduce'|'quiet'|'recover'|'adapt'|'paused'|'transition';
export type SceneDirection = {beat:SceneBeat;chapter:string;line:string;hint:string};
export function directScene(session:WorkoutSession):SceneDirection {
 const phase=session.activePhase;
 if(!phase)return {beat:'introduce',chapter:'A LITTLE MOMENT',line:'Move your way.',hint:'This is a fictional experience.'};
 const next=session.movement(phase).title;
 if(session.waiting)return {beat:'transition',chapter:'SCENE COMPLETE',line:`${next} is complete.`,hint:session.autoCountdown!==null?'A new scene is approaching. You can choose to stay.':'Continue whenever you are ready.'};
 if(session.paused||session.modal)return {beat:'paused',chapter:'A MOMENT OF STILLNESS',line:'We can stay right here.',hint:'Your place and remaining time are saved.'};
 if(phase==='recovery')return {beat:'recover',chapter:'ROOM TO BREATHE',line:session.recoveryAdded?'You made more space for yourself.':'There is no hurry.',hint:'Let the next scene wait while you choose your way forward.'};
 if(session.lightened&&phase==='flow_a')return {beat:'adapt',chapter:'THE STORY CHANGES',line:'We will take the gentler path.',hint:'The next illustration and duration now match your choice.'};
 const elapsed=session.duration(phase)-(session.timer()?.remaining??session.duration(phase));
 if(elapsed<4)return {beat:'introduce',chapter:'HERE IS YOUR MOMENT',line:session.movement(phase).cue,hint:'Just follow this movement at your own pace.'};
 return {beat:'quiet',chapter:'A QUIET MOMENT',line:'Nothing to manage. Just your own rhythm.',hint:'AiRA will be here when the scene changes.'};
}
