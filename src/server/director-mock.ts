import type {RequestData,Turn} from '../shared/contracts.js';
import {ScreenDocument} from '../shared/openui/document.js';
import {serializeStatement as statement} from '../shared/openui/serialize.js';
import {CATALOG,type MovementId} from '../shared/session-planner.js';

const fenced=(s:string)=>'```openui\n'+s+'\n```';
/** A short, truthful offline fixture authored in exactly the same OpenUI format as model turns. */


type Direction={track:'energy'|'desk';step:number;id:MovementId;seconds:number;line:string;cue:string;gentle:boolean};
function direction(track:'energy'|'desk',step:number,gentle:boolean):Direction{
 const candidates:Record<typeof track,MovementId[]>={energy:['marching','recovery','side_steps'],desk:['wrist_release','recovery','weight_shifts']};
 const id=gentle&&step!==2?'weight_shifts':candidates[track][Math.min(step-1,2)];
 const secs=[14,10,12];
 return {track,step,id,gentle,seconds:gentle&&step!==2?12:secs[step-1],
 line:step===2?(gentle?'The next movement will be gentler. This recovery time is yours.':'Here is a small, quiet pause.'):
   gentle?'Of course. We can take the gentler path.':step===1?(track==='desk'?'We will keep this small and calm.':'Let us find a little energy.'):'One more moment, then we are done.',
 cue:step===2?'Take the time you need. The next step can wait.':gentle?'A smaller movement, at your pace.':CATALOG[id].cue};
}
function scene(d:Direction):string {
 return fenced([
  statement('title_current','Text',[CATALOG[d.id].title,'title']),
  statement('note_current','Text',[d.line,'description']),
  statement('movement_current','Movement',[d.id]),
  statement('timer_current','Timer',[CATALOG[d.id].title,d.seconds]),
  statement('cue_current','Cue',[d.cue]),
  statement('choices_current','FollowUps',[["Make it gentler","No jumping or limited space","End this session"]]),
  statement('state_current','Keyword',[`${d.step}/3`,d.track+(d.gentle?'|gentle':'')]),
  'screen_current = Screen([state_current, title_current, note_current, movement_current, timer_current, cue_current, choices_current])',
  'root = Screens([screen_current], screen_current)',
 ].join('\n'));
}
function finish():string {
 return fenced([
  statement('title_current','Text',["That is our moment.",'title']),
  statement('note_current','Text',["You chose how the experience unfolded. No actual exercise or biometric performance was measured.",'description']),
  statement('cue_current','Cue',["Thank you for sharing this small moment with AiRA."]),
  statement('choices_current','FollowUps',[["Try an energy boost","Try a desk reset"]]),
  statement('state_current','Keyword',["COMPLETE",'simulated']),
  'screen_current = Screen([state_current, title_current, note_current, cue_current, choices_current])',
  'root = Screens([screen_current], screen_current)',
 ].join('\n'));
}
/** Stateless mock: previous named statements and timer events determine the next screen. */
export function directorMockTurn(request:RequestData):Turn {
 const message=request.messages.at(-1)?.content.toLowerCase()??'';
 const doc=new ScreenDocument();
 if(request.state.ui_state)doc.apply(fenced(request.state.ui_state));
 const current=doc.current?.props.children as {name:string;props:Record<string,unknown>}[]|undefined;
 const state=current?.find(x=>x.name==='Keyword');
 const marker=typeof state?.props.text==='string'?state.props.text:'';
 const currentStep=Number(marker.match(/^([1-3])\/3$/)?.[1]??0);
 const caption=String(state?.props.caption??'');
 const track=caption.startsWith('desk')||(!currentStep&&/desk|chair|sit|seated|small space|little space|office|compact/i.test(message))?'desk' as const:'energy' as const;
 const ending=/\b(end|stop|finish|quit)\b/.test(message);
 if(ending)return {reply:'AiRA ended the simulated session when you asked.\n'+finish()};
 if(marker==='COMPLETE'||/\btry (an? )?(energy boost|desk reset)\b/.test(message))return {reply:'A new simulated moment begins.\n'+scene(direction(/desk/i.test(message)?'desk':'energy',1,false))};
 const adapting=/\b(gentle|easier|slower|no jumping|little space|no space|quiet|smaller)\b/.test(message)&&currentStep>0&&!/timer finished/i.test(message);
 const gentle=caption.includes('|gentle')||adapting;
 if(adapting)return {reply:'AiRA revised the visible movement and its timer; nothing was falsely marked completed.\n'+scene(direction(track,currentStep,gentle))};
 const elapsed=request.state.client_events.some(x=>/timer for .* finished/i.test(x));
 const nextStep=currentStep===0?1:elapsed||/\b(next|continue|finished|done)\b/.test(message)?currentStep+1:currentStep;
 if(nextStep>3)return {reply:'The fictional session is complete.\n'+finish()};
 return {reply:'AiRA selected the next on-screen moment.\n'+scene(direction(track,nextStep,gentle))};
}
