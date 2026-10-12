import test from 'node:test';import assert from 'node:assert/strict';import {request as rawRequest} from 'node:http';
import {createApp,readConfig} from '../dist/server/app.js';
async function app(config=readConfig({},process.cwd()),transport){const server=createApp(config,transport);await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;const cfg=await (await fetch(url+'/api/config')).json();return {server,url,cfg,close:()=>new Promise(r=>server.close(r))};}
const body=text=>({provider:'mock',consent:false,fault:'none',messages:[{role:'user',content:text}],state:{ui_state:'',client_events:[]}});
const post=(a,data,extra={})=>fetch(a.url+'/api/turn',{method:'POST',headers:{'Content-Type':'application/json','X-Local-Token':a.cfg.token,...extra},body:JSON.stringify(data)});
test('HTTP protects static files, origin and local token; model modes remain off',async()=>{const a=await app();try{assert.equal(a.cfg.defaultProvider,'mock');assert.equal(a.cfg.key,undefined);for(const path of ['/src/server/cli.ts','/.env','/skills/workout.md'])assert.equal((await fetch(a.url+path)).status,404);assert.equal((await post(a,body('/demo'),{'X-Local-Token':'wrong'})).status,403);assert.equal((await post(a,body('/demo'),{Origin:'https://example.org'})).status,403);const status=await new Promise(resolve=>rawRequest(a.url,{headers:{Host:'evil.example'}},r=>{r.resume();resolve(r.statusCode);}).end());assert.equal(status,403);assert.equal((await post(a,{...body('/demo'),provider:'claude-cli',consent:true})).status,403);assert.equal((await post(a,{...body('/demo'),provider:'codex-cli',consent:true})).status,503);}finally{await a.close();}});
test('HTTP mock provides protocol/hash metadata and validates faults and input',async()=>{const a=await app();try{const response=await post(a,body('/demo'));assert.equal(response.status,200);const data=await response.json();assert(data.turn.reply.includes('Timer("Sample timer", 10)'));assert.equal(data.versions.app,'2.0.0');assert.equal(data.versions.protocolHash.length,64);for(const fault of ['schema','request'])assert.equal((await post(a,{...body('/demo'),fault})).status,502);assert.equal((await post(a,{...body('x'),extra:true})).status,400);}finally{await a.close();}});
test('HTTP API errors redact raw provider bodies; valid envelope with invalid screen rejected',async()=>{for(const invalid of [false,true]){const config=readConfig({ALLOW_LIVE_API:'true',OPENAI_API_KEY:'fake-private'},process.cwd());const transport=async()=>invalid?new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({reply:'```openui\nroot = Bad()\n```'})}]}]})):new Response('fake-private',{status:500});const a=await app(config,transport);try{const response=await post(a,{...body('hello'),provider:'openai-api',consent:true});assert.equal(response.status,502);assert(!(await response.text()).includes('fake-private'));}finally{await a.close();}}});
test('disconnect aborts provider request',async()=>{let started,aborted;const seen=new Promise(r=>started=r),cancelled=new Promise(r=>aborted=r);const a=await app(readConfig({ALLOW_LIVE_API:'true',OPENAI_API_KEY:'fake'},process.cwd()),(_u,o)=>{started();return new Promise((resolve,reject)=>o.signal.addEventListener('abort',()=>{aborted();reject(new Error('abort'));}));});try{const controller=new AbortController();const task=fetch(a.url+'/api/turn',{method:'POST',headers:{'Content-Type':'application/json','X-Local-Token':a.cfg.token},body:JSON.stringify({...body('hi'),provider:'openai-api',consent:true}),signal:controller.signal}).catch(()=>{});await seen;controller.abort();await task;await Promise.race([cancelled,new Promise((_,reject)=>setTimeout(()=>reject(new Error('abort missing')),1500))]);}finally{await a.close();}});

test('opt-in coaching endpoint validates context and token without spending quota',async()=>{
 const a=await app();
 const input={provider:'openai-api',consent:true,question:'How can I stay focused?',context:{stage:'flow_a',pace:'steady',preset:'quick',paused:false,waiting:false,remainingSeconds:14,completed:1,skipped:0,lightened:false,recoveryAdded:0,movement:'March in place'}};
 const postCoach=(data,token=a.cfg.token)=>fetch(a.url+'/api/coach',{method:'POST',headers:{'Content-Type':'application/json','X-Local-Token':token},body:JSON.stringify(data)});
 try{
  assert.equal((await postCoach(input,'wrong')).status,403);
  assert.equal((await postCoach({...input,consent:false})).status,400);
  assert.equal((await postCoach({...input,context:{...input.context,stage:'HACK'}})).status,400);
  assert.equal((await postCoach({...input,question:'x'.repeat(321)})).status,400);
  assert.equal((await postCoach(input)).status,403);
 }finally{await a.close();}
});

test('coaching returns short generated text only; OpenUI and API keys never cross to client',async()=>{
 const config=readConfig({ALLOW_LIVE_API:'true',OPENAI_API_KEY:'fake-coach-secret',OPENAI_MODEL:'gpt-4.1-mini'},process.cwd());
 let called=0;
 const transport=async(_url,options)=>{called++;
  assert.equal(_url,'https://api.openai.com/v1/responses');
  const sent=JSON.parse(options.body);
  assert.equal(sent.model,'gpt-4.1-mini');assert.equal(sent.store,false);assert.equal(sent.text.format.name,'coaching_cue');
  assert.equal(sent.input.length,1);assert(!options.body.includes('fake-coach-secret'));
  return new Response(JSON.stringify({status:'completed',model:'gpt-4.1-mini',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({cue:'One moment at a time. Take it at your own pace.'})}]}]}),{status:200});
 };
 const a=await app(config,transport);
 const data={provider:'openai-api',consent:true,question:'How should I approach this moment?',context:{stage:'flow_b',pace:'gentle',preset:'quick',paused:false,waiting:false,remainingSeconds:10,completed:3,skipped:0,lightened:true,recoveryAdded:10,movement:'Gentle weight shifts'}};
 try{
  const r=await fetch(a.url+'/api/coach',{method:'POST',headers:{'Content-Type':'application/json','X-Local-Token':a.cfg.token},body:JSON.stringify(data)});
  assert.equal(r.status,200);const payload=await r.json();assert.equal(payload.cue,'One moment at a time. Take it at your own pace.');assert.equal(payload.source,'openai-api');assert.equal(payload.model,'gpt-4.1-mini');assert.equal(called,1);assert(!JSON.stringify(payload).includes('fake-coach-secret'));
 }finally{await a.close();}
});

test('coaching rejects malformed provider replies; session endpoint remains independent',async()=>{
 const config=readConfig({ALLOW_LIVE_API:'true',OPENAI_API_KEY:'fake-coach-secret'},process.cwd());
 const data={provider:'openai-api',consent:true,question:'Any encouraging words?',context:{stage:'recovery',pace:'steady',preset:'quick',paused:false,waiting:false,remainingSeconds:10,completed:2,skipped:0,lightened:false,recoveryAdded:0,movement:'March in place'}};
 for(const message of ['not JSON',JSON.stringify({cue:'bad'.repeat(100)})]){
  const a=await app(config,async()=>new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:message}]}]})));
  try{const r=await fetch(a.url+'/api/coach',{method:'POST',headers:{'Content-Type':'application/json','X-Local-Token':a.cfg.token},body:JSON.stringify(data)});assert.equal(r.status,502);assert(!(await r.text()).includes('fake-coach-secret'));}finally{await a.close();}
 }
});

test('AI plan endpoint requires consent, local token and explicit API opt-in',async()=>{
 const a=await app();
 const req=(input,token=a.cfg.token)=>fetch(a.url+'/api/plan',{method:'POST',headers:{'Content-Type':'application/json','X-Local-Token':token},body:JSON.stringify(input)});
 try{
  assert.equal((await req({request:'I want a two-minute desk reset',consent:true},'wrong')).status,403);
  assert.equal((await req({request:'I want a two-minute desk reset',consent:false})).status,400);
  assert.equal((await req({request:'I feel dizzy and need movement',consent:true})).status,400);
  assert.equal((await req({request:'I want a two-minute desk reset',consent:true})).status,403);
 }finally{await a.close();}
});

test('AI plan transport accepts a validated structured response and rejects imaginary movements',async()=>{
 const {buildOfflinePlan,PLAN_PHASES}=await import('../dist/shared/session-planner.js');
 const request='I need an energy boost, I have 2 minutes and room to move.';
 const p=buildOfflinePlan({request});
 const valid={goal:p.goal,space:p.space,durationSeconds:p.durationSeconds,rationale:'A timed sequence reflecting your energy and space.',steps:PLAN_PHASES.map(phase=>({phase,...p.steps[phase]}))};
 const config=readConfig({ALLOW_LIVE_API:'true',OPENAI_API_KEY:'fake-secret'},process.cwd());
 for(const invalid of [false,true]){
  let calls=0;
  const transport=async(url,options)=>{calls++;assert.equal(url,'https://api.openai.com/v1/responses');const data=JSON.parse(options.body);
   assert.equal(data.text.format.name,'movement_plan');assert.equal(data.store,false);assert(!options.body.includes('fake-secret'));
   const reply=invalid?{...valid,steps:valid.steps.map((x,i)=>i===1?{...x,id:'unsafe_not_real'}:x)}:valid;
   return new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(reply)}]}]}),{status:200});};
  const a=await app(config,transport);
  try{const r=await fetch(a.url+'/api/plan',{method:'POST',headers:{'Content-Type':'application/json','X-Local-Token':a.cfg.token},body:JSON.stringify({request,consent:true})});
   assert.equal(r.status,invalid?502:200);const data=await r.json();if(!invalid){assert.equal(data.plan.source,'openai-api');assert.equal(data.plan.steps.flow_a.id,'marching');assert.equal(data.plan.durationSeconds,120);}else assert(!JSON.stringify(data).includes('unsafe_not_real'));assert.equal(calls,1);
  }finally{await a.close();}
 }
});

test('Director /api/turn uses mock OpenUI patches and rejects unsafe live scene components',async()=>{
 const {directorWelcome}=await import('../dist/shared/director-welcome.js');
 const {ScreenDocument}=await import('../dist/shared/openui/document.js');
 const {validateDirectorScreen}=await import('../dist/shared/director-validation.js');
 const initial=new ScreenDocument();initial.apply(directorWelcome());
 const input={...body('Quick energy boost'),state:{ui_state:initial.echo(),client_events:['AiRA Director mode enabled']}};
 const a=await app();
 try{
  const response=await post(a,input);assert.equal(response.status,200);const data=await response.json();
  assert.match(data.turn.reply,/Movement\("marching"\)/);
  initial.apply(data.turn.reply);validateDirectorScreen(initial);
 }finally{await a.close();}
 const config=readConfig({ALLOW_LIVE_API:'true',OPENAI_API_KEY:'fake-only'},process.cwd());
 const invalidReplies=[
  '```openui\nmovement_current = Movement("imaginary_move")\n```',
  '```openui\nextra = Workout("welcome")\nscreen_current = Screen([extra])\n```',
  '```openui\ntimer_current = Timer("too long", 120)\n```',
 ];
 for(const reply of invalidReplies){
  const transport=async()=>new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({reply})}]}]}));
  const server=await app(config,transport);
  try{
   const complete=new ScreenDocument();complete.apply(directorWelcome());
   complete.apply('```openui\ntitle_current = Text("Move", "title")\nmovement_current = Movement("marching")\ntimer_current = Timer("March in place", 14)\nscreen_current = Screen([title_current, movement_current, timer_current])\n```');
   const r=await post(server,{...input,provider:'openai-api',consent:true,state:{ui_state:complete.echo(),client_events:['AiRA Director mode enabled']}});
   assert.equal(r.status,502);
  }finally{await server.close();}
 }
});

test('consented synthetic live provider may author a valid Director OpenUI scene',async()=>{
 const {directorWelcome}=await import('../dist/shared/director-welcome.js');
 const {ScreenDocument}=await import('../dist/shared/openui/document.js');
 const config=readConfig({ALLOW_LIVE_API:'true',OPENAI_API_KEY:'synthetic-only'},process.cwd());
 const scene=[
 '```openui',
 'title_current = Text("A new, AI-selected moment", "title")',
 'movement_current = Movement("wrist_release")',
 'timer_current = Timer("Wrist and finger release", 12)',
 'cue_current = Cue("A gentle desk reset.")',
 'choices_current = FollowUps(["Make it gentler", "End this session"])',
 'screen_current = Screen([title_current, movement_current, timer_current, cue_current, choices_current])',
 'root = Screens([screen_current], screen_current)',
 '```',
 ].join('\n');
 let sent;
 const transport=async(_url,opts)=>{sent=JSON.parse(opts.body);return new Response(JSON.stringify({status:'completed',model:'synthetic-model',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({reply:'Here is the next scene.\n'+scene})}]}]}));};
 const a=await app(config,transport);
 try{
  const d=new ScreenDocument();d.apply(directorWelcome());
  const response=await post(a,{...body('I am sitting at my desk'),provider:'openai-api',consent:true,state:{ui_state:d.echo(),client_events:['AiRA Director mode enabled']}});
  assert.equal(response.status,200);const result=await response.json();
  d.apply(result.turn.reply);assert.equal(d.current.props.children.find(n=>n.name==='Movement').props.id,'wrist_release');
  assert.equal(result.versions.returnedModel,'synthetic-model');
  assert(sent.input.at(-1).content.includes('AiRA Director mode enabled'));
  assert(sent.instructions.includes('SCENE DIRECTOR'));
 }finally{await a.close();}
});
