import {serializeStatement as statement} from './openui/serialize.js';
const fenced=(s:string)=>'```openui\n'+s+'\n```';
export function directorWelcome():string {
 return fenced([
  statement('title_current','Text',['What kind of movement moment do you need?','title']),
  statement('note_current','Text',["Tell AiRA what you need. The next screen will be built as an OpenUI response.",'description']),
  statement('cue_current','Cue',["We can begin with something energizing or a quiet desk reset."]),
  statement('choices_current','FollowUps',[['Give me a quick energy boost','I am at my desk with very little space']]),
  'screen_current = Screen([title_current, note_current, cue_current, choices_current])',
  'root = Screens([screen_current], screen_current)',
 ].join('\n'));
}
