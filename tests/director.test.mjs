import test from 'node:test';
import assert from 'node:assert/strict';
import {directorWelcome} from '../dist/shared/director-welcome.js';
import {directorMockTurn} from '../dist/server/director-mock.js';
import {validateDirectorScreen} from '../dist/shared/director-validation.js';
import {ScreenDocument} from '../dist/shared/openui/document.js';
import {Conversation} from '../dist/shared/controller.js';

const fence=code=>'```openui\n'+code+'\n```';
const req=(content,doc,events=[])=>({provider:'mock',consent:false,fault:'none',messages:[{role:'user',content}],state:{ui_state:doc.echo(),client_events:['AiRA Director mode enabled',...events]}});
const begin=content=>{const doc=new ScreenDocument();doc.apply(directorWelcome());doc.apply(directorMockTurn(req(content,doc)).reply);validateDirectorScreen(doc);return doc;};
const child=(doc,name)=>doc.current.props.children.find(n=>n.name===name);

test('OpenUI Director renders different real screens from contrasting intentions',()=>{
 const energy=begin('Give me a quick energy boost and room to move');
 const desk=begin('I am at my desk and have very little space');
 assert.equal(child(energy,'Movement').props.id,'marching');
 assert.equal(child(desk,'Movement').props.id,'wrist_release');
 assert.equal(child(energy,'Timer').props.seconds,14);
 assert.notEqual(energy.echo(),desk.echo());
 assert(energy.echo().includes('root = Screens([screen_current]'));
});

test('OpenUI Director reacts to a timer event and interrupts current activity without fake completion',()=>{
 const d=begin('energy please');
 d.apply(directorMockTurn(req('The simulated timer finished. Please decide what to show next.',d,['The timer for March in place finished.'])).reply);
 assert.equal(child(d,'Movement').props.id,'recovery');
 assert.equal(child(d,'Timer').props.seconds,10);
 d.apply(directorMockTurn(req('no jumping, make it gentler',d)).reply);
 assert.equal(child(d,'Movement').props.id,'recovery');
 assert.equal(child(d,'Timer').props.seconds,10);
 d.apply(directorMockTurn(req('The simulated timer finished. Please decide what to show next.',d,['The timer for A breathing break finished.'])).reply);
 assert.equal(child(d,'Movement').props.id,'weight_shifts');
 assert.equal(child(d,'Timer').props.seconds,12);
 d.apply(directorMockTurn(req('end this session',d)).reply);
 assert.equal(child(d,'Movement'),undefined);
 assert.equal(child(d,'Timer'),undefined);
 assert.match(child(d,'Text').props.text,/moment/);
});

test('director rejects unknown movements, duplicate timers, excessively long timers and legacy Workout',()=>{
 const d=begin('energy please'),last=d.echo();
 const invalid=[
  'movement_current = Movement("imaginary_jump")',
  'timer_current = Timer("too long", 120)',
  'screen_current = Screen([title_current, timer_current, timer_current])',
  'scene_bad = Workout("welcome")\nscreen_current = Screen([scene_bad])',
 ];
 for(const patch of invalid){
  const copy=new ScreenDocument();copy.apply(fence(last));
  assert.throws(()=>{copy.apply(fence(patch));validateDirectorScreen(copy);});
 }
});

test('Conversation sends current OpenUI and timer events on the next turn and keeps last patch',async()=>{
 const reqs=[],clientEvents=['AiRA Director mode enabled'];
 const c=new Conversation(async request=>{reqs.push(request);return{turn:directorMockTurn(request),versions:{mode:'mock'}};},()=>{},()=>clientEvents);
 c.document.apply(directorWelcome());
 await c.send('Energy please');
 assert.equal(child(c.document,'Movement').props.id,'marching');
 c.localEvent('The timer for March in place finished.');
 await c.send('The simulated timer finished. Please decide what to show next.');
 assert.equal(child(c.document,'Movement').props.id,'recovery');
 assert(reqs[1].state.ui_state.includes('Movement("marching")'));
 assert(reqs[1].state.client_events.includes('The timer for March in place finished.'));
 assert.equal(c.document.screens.length,1);
});
