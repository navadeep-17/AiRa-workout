import test from 'node:test';
import assert from 'node:assert/strict';
import {WorkoutSession} from '../dist/shared/workout-session.js';
import {directScene} from '../dist/shared/scene-director.js';
const build=()=>{let clock=0;const s=new WorkoutSession(()=>clock);s.toSetup();s.toPreview();s.start();return {s,forward:(sec)=>{clock+=sec*1000;}};};
test('director introduces a movement then becomes quiet without mutating session',()=>{
 const {s,forward}=build();assert.equal(directScene(s).beat,'introduce');const before=s.revision;
 forward(5);assert.equal(directScene(s).beat,'quiet');assert.equal(s.revision,before);assert.equal(s.timer().remaining,5);
});
test('director responds to a pause and correctly handles a completed scene',()=>{
 const {s,forward}=build();s.togglePause();assert.equal(directScene(s).beat,'paused');s.togglePause();forward(10);s.tick();assert.equal(directScene(s).beat,'transition');assert.equal(s.stage,'settle');
});
test('director recovers gracefully and represents the gentler choice',()=>{
 const {s,forward}=build();forward(10);s.tick();s.next();assert(s.showChoices());assert(s.lightenNext());assert.equal(directScene(s).beat,'adapt');
 forward(20);s.tick();s.next();assert.equal(directScene(s).beat,'recover');assert(s.extendRecovery());assert.match(directScene(s).line,/more space/);
});
test('choice canvas can only open for appropriate scenes and closes safely',()=>{
 const {s,forward}=build();assert.equal(s.showChoices(),false);forward(10);s.tick();assert.equal(s.showChoices(),false);s.next();assert(s.showChoices());assert(s.choiceOpen);assert(s.hideChoices());assert.equal(s.choiceOpen,false);assert(s.showChoices());assert(s.lightenNext());assert.equal(s.duration('flow_b'),12);assert(s.undoLighten());assert.equal(s.duration('flow_b'),20);
});
test('recovery opens choice canvas automatically, but no choices can change an elapsed phase',()=>{
 const {s,forward}=build();forward(10);s.tick();s.next();forward(20);s.tick();s.next();assert.equal(s.stage,'recovery');assert.equal(s.choiceOpen,true);const remaining=s.timer().remaining;
 assert(s.lightenNext());assert.equal(s.timer().remaining,remaining);forward(15);s.tick();assert.equal(s.lightenNext(),false);assert.equal(s.undoLighten(),false);s.next();assert.equal(s.choiceOpen,false);assert.equal(s.movement('flow_b').title,'Gentle weight shifts');
});
