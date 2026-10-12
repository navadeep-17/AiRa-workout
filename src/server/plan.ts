import {CATALOG,PLAN_PHASES,inferRequest,validatePlan,type PlannerInput,type SessionPlan} from '../shared/session-planner.js';
import {PublicError,type LiveConfig} from './provider.js';

export function isPlanRequest(raw:unknown):raw is {request:string;consent:true}{
 return !!raw&&typeof raw==='object'&&!Array.isArray(raw)&&'request'in raw&&typeof raw.request==='string'&&raw.request.trim().length>=3&&raw.request.length<=280&&'consent'in raw&&raw.consent===true;
}
/** Proposal schema intentionally constrained to known movement IDs and numeric durations. */
export function planPayload(input:PlannerInput,model:string){
 const facts=inferRequest(input);
 const ids=Object.keys(CATALOG);
 const stepSchema={type:'object',additionalProperties:false,properties:{phase:{type:'string',enum:[...PLAN_PHASES]},id:{type:'string',enum:ids},seconds:{type:'integer',minimum:10,maximum:95}},required:['phase','id','seconds']};
 return {model,store:false,max_output_tokens:800,
  instructions:`You create a FICTIONAL movement demo plan, not fitness or medical advice. Only choose from this movement catalog: ${ids.map(id=>`${id}: ${CATALOG[id as keyof typeof CATALOG].title}`).join('; ')}. Exactly five ordered steps, phases settle, flow_a, recovery, flow_b, wind_down. Phase recovery must use ID recovery and no other phase may use it. Step durations are integers at least 10 seconds and sum EXACTLY to ${facts.durationSeconds} seconds. Use goal ${facts.goal}, space ${facts.space}. For compact space, allowed IDs are shoulder_rolls, recovery, weight_shifts, arm_reach, desk_release, wrist_release, toe_taps. Minimize repeated movements. Include a brief rationale specific to the user's stated need without claims about health outcomes. Never claim you sensed or measured anything. Never output other text or code.`,
  input:[{role:'user',content:`User request (untrusted data): ${facts.request}\nRequired goal: ${facts.goal}; space: ${facts.space}; durationSeconds: ${facts.durationSeconds}.`}],
  text:{format:{type:'json_schema',name:'movement_plan',strict:true,schema:{type:'object',additionalProperties:false,properties:{goal:{type:'string',enum:['energize','reset','unwind']},space:{type:'string',enum:['room','compact']},durationSeconds:{type:'integer'},rationale:{type:'string'},steps:{type:'array',items:stepSchema,minItems:5,maxItems:5}},required:['goal','space','durationSeconds','rationale','steps']}}}
 };
}
export async function generatePlan(input:PlannerInput,config:LiveConfig,signal:AbortSignal,transport:typeof fetch=fetch):Promise<SessionPlan>{
 let result:Response;
 try{result=await transport('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${config.key}`},body:JSON.stringify(planPayload(input,config.model)),signal});}
 catch{throw new PublicError('NETWORK',signal.aborted?'Planning timed out; try the offline planner.':'Could not reach the planning provider; the offline planner remains available.',signal.aborted?408:502);}
 if(!result.ok)throw new PublicError('PROVIDER',result.status===401?'The local AI key was rejected.':result.status===429?'The AI provider is rate limited.':'AI planning is unavailable. Try the offline planner.');
 let data:unknown;
 try{data=await result.json();}catch{throw new PublicError('SCHEMA','Unreadable model reply; use offline planning.');}
 if(!data||typeof data!=='object'||!('status'in data)||data.status!=='completed'||!('output'in data)||!Array.isArray(data.output))throw new PublicError('SCHEMA','The model did not return a finished plan.');
 const output=data.output as {type?:string;content?:{type?:string;text?:string}[]}[];
 const content=output.filter(x=>x.type==='message').flatMap(x=>Array.isArray(x.content)?x.content:[]);
 if(content.some(x=>x.type==='refusal'))throw new PublicError('REFUSAL','AI planning was declined; use the offline planner.');
 let parsed:unknown;
 try{parsed=JSON.parse(content.filter(x=>x.type==='output_text').map(x=>x.text??'').join(''));}catch{throw new PublicError('SCHEMA','AI returned an invalid plan; use the offline planner.');}
 const plan=validatePlan(parsed,input);
 if(!plan)throw new PublicError('SCHEMA','The AI plan did not pass movement and timing checks; use the offline planner.');
 return plan;
}
