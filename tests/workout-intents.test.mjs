import test from 'node:test';
import assert from 'node:assert/strict';
import {WorkoutSession} from '../dist/shared/workout-session.js';
import {handleWorkoutIntent} from '../dist/shared/workout-intents.js';
const say=(s,text)=>handleWorkoutIntent(s,text);
const start=()=>{let now=0;const s=new WorkoutSession(()=>now);s.toSetup();s.toPreview();s.start();return {s,forward(secs){now+=secs*1000;assert(s.tick());s.next();}};};

test('mock text choices change setup and preview while retaining trusted workflow',()=>{
 const s=new WorkoutSession(()=>0);s.toSetup();
 assert.equal(say(s,'gentle').intent,'choose');assert.equal(s.pace,'gentle');
 assert.equal(say(s,'Unhurried').intent,'choose');assert.equal(s.totalPlanned,105);
 assert.match(say(s,'how much time').message,/1:45/);
 assert.equal(s.stage,'setup');
});

test('natural-language adaptation really changes an active recovery timer',()=>{
 const {s,forward}=start();forward(10);forward(20);assert.equal(s.stage,'recovery');
 assert.equal(say(s,'I need more rest').intent,'extend');
 assert.equal(s.recoveryAdded,10);assert.equal(s.timer().remaining,25);
 assert.equal(say(s,'slow down').intent,'lighten');assert.equal(s.duration('flow_b'),12);
 assert.match(say(s,"what’s next?").message,/Gentle weight shifts.*0:12/);
 assert.equal(say(s,'restore').intent,'restore');assert.equal(s.duration('flow_b'),20);
});

test('pause, resume, skip, and continue are guarded and require confirmation',()=>{
 const {s,forward}=start();assert.equal(say(s,'Pause').intent,'pause');assert.equal(s.paused,true);
 assert.equal(say(s,'I am ready').intent,'resume');assert.equal(s.paused,false);
 assert.equal(say(s,'skip phase').intent,'skip');assert.equal(s.modal,'skip');
 assert.equal(s.records.length,0);assert(s.dismissModal());assert.equal(s.modal,null);
 forward(10);assert.equal(s.stage,'flow_a');
 assert.match(say(s,'what is next').message,/A breathing break/);
});

test('unsupported text stays in local workout and offers explicit safe controls',()=>{
 const {s}=start();const stage=s.stage;
 const result=say(s,'write some JavaScript to modify my timer');
 assert.equal(result.intent,'help');assert.match(result.message,/local demo commands/i);
 assert.equal(s.stage,stage);assert.equal(s.timer().seconds,10);
});

test('invalid contexts do not claim timer extensions or simulated measurements',()=>{
 const {s}=start();const result=say(s,'give me another ten seconds');
 assert.equal(result.intent,'extend');assert.equal(s.recoveryAdded,0);
 assert.match(result.message,/recovery countdown/i);assert.equal(s.stage,'settle');
 assert.match(say(s,'progress').message,/0 of 5 phases completed/);
});

test('known local commands are distinguished from optional open-ended coaching questions',async()=>{
 const {isLocalWorkoutCommand}=await import('../dist/shared/workout-intents.js');
 for(const text of ['More rest','Pause','slow down','what’s next?','show plan','quick'])assert.equal(isLocalWorkoutCommand(text),true,text);
 for(const text of ['Give me a quick pep talk','How can I feel calmer?','Does this app understand my question?'])assert.equal(isLocalWorkoutCommand(text),false,text);
});