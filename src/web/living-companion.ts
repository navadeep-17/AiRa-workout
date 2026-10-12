import {el} from './dom.js';
import type {WorkoutSession} from '../shared/workout-session.js';

export type CompanionMood='hello'|'focus'|'recover'|'adapt'|'pause'|'celebrate';
export function companionMood(s:WorkoutSession):CompanionMood {
 if(s.stage==='summary')return 'celebrate';
 if(s.paused||s.waiting)return 'pause';
 if(s.lightened&&(s.stage==='flow_a'||s.stage==='recovery'||s.stage==='flow_b'))return 'adapt';
 if(s.stage==='recovery')return 'recover';
 if(s.activePhase)return 'focus';
 return 'hello';
}
/** AiRA's original, locally rendered sketch character. No remote image or model-produced markup. */
export function livingCompanion(mood:CompanionMood,small=false):HTMLElement {
 const wrap=el('div','','aira-companion mood-'+mood+(small?' is-small':''));
 wrap.setAttribute('role','img');
 const descriptions:Record<CompanionMood,string>={hello:'AiRA waves hello',focus:'AiRA follows along',recover:'AiRA takes a slow breath',adapt:'AiRA acknowledges your gentler choice',pause:'AiRA quietly waits',celebrate:'AiRA celebrates the session you chose'};
 wrap.setAttribute('aria-label',descriptions[mood]);
 const ns='http://www.w3.org/2000/svg';
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 220 190');svg.setAttribute('aria-hidden','true');
 const shape=(type:string,attrs:Record<string,string>,parent:SVGElement=svg)=>{const n=document.createElementNS(ns,type);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);parent.append(n);return n;};
 shape('ellipse',{cx:'111',cy:'175',rx:'62',ry:'7',fill:'#9fbb9f',opacity:'.24'});
 const arms=shape('g',{class:'aira-limbs',fill:'none',stroke:'#426e54','stroke-width':'6','stroke-linecap':'round'});
 shape('path',{d:'M60 97 Q29 80 22 48',class:'aira-arm-left'},arms);
 shape('path',{d:'M157 97 Q184 91 193 56',class:'aira-arm-right'},arms);
 shape('path',{d:'M88 147 Q77 164 72 174'},arms);shape('path',{d:'M133 147 Q144 164 150 174'},arms);
 shape('path',{d:'M110 18 C144 8 172 37 171 77 C175 117 158 150 112 153 C62 156 46 119 48 82 C48 46 72 22 110 18 Z',fill:'#c8e4bf',stroke:'#426e54','stroke-width':'3.5','stroke-linejoin':'round',class:'aira-body'});
 shape('path',{d:'M79 27 Q90 14 111 19 M157 38 Q173 63 170 76',fill:'none',stroke:'#f1f8d9','stroke-width':'5',opacity:'.7','stroke-linecap':'round'});
 if(mood==='recover'||mood==='pause'){
  shape('path',{d:'M82 84 Q92 91 101 83 M125 83 Q134 91 145 83',fill:'none',stroke:'#335c45','stroke-width':'4','stroke-linecap':'round'});
 }else{
  shape('ellipse',{cx:'92',cy:'85',rx:'4',ry:'6',fill:'#335c45'});
  shape('ellipse',{cx:'135',cy:'84',rx:'4',ry:'6',fill:'#335c45'});
 }
 shape('ellipse',{cx:'78',cy:'101',rx:'10',ry:'5',fill:'#ed9c98',opacity:'.28'});
 shape('ellipse',{cx:'148',cy:'100',rx:'10',ry:'5',fill:'#ed9c98',opacity:'.28'});
 const mouth=mood==='recover'||mood==='pause'?'M106 111 Q113 115 121 110':mood==='adapt'||mood==='celebrate'?'M101 108 Q114 125 128 106':'M104 108 Q114 117 124 108';
 shape('path',{d:mouth,stroke:'#335c45','stroke-width':'3.5',fill:'none','stroke-linecap':'round'});
 if(mood==='adapt'||mood==='celebrate'){
  shape('path',{d:'M178 26 l4 11 11 4 -11 4 -4 11 -4 -11 -11 -4 11 -4 Z',fill:'#e6bf6e',class:'aira-spark'});
 }
 wrap.append(svg);return wrap;
}
