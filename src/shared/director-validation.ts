import type {ScreenDocument} from './openui/document.js';
import type {StatementNode} from './openui/openui-model.js';
/** Extra bounds for model-authored workout scenes; all JS/timing remains trusted. */
export function validateDirectorScreen(document:ScreenDocument):void {
 const screens=document.screens;
 if(screens.length!==1)throw new Error('Director must present one scene at a time.');
 const children=screens[0].props.children as StatementNode[];
 const allowed=new Set(['Movement','Text','Timer','Cue','FollowUps','Keyword','Alert']);
 if(children.some(node=>!allowed.has(node.name)))throw new Error('Director used an unsupported scene element.');
 if(children.filter(node=>node.name==='Movement').length>1 || children.filter(node=>node.name==='Timer').length>1)throw new Error('Only one movement and timer at a time.');
 const timer=children.find(node=>node.name==='Timer');
 if(timer&&(Number(timer.props.seconds)>45||!children.some(node=>node.name==='Movement')))throw new Error('Director timer exceeds the bounded scene allowance.');
 if(children.filter(node=>node.name==='FollowUps').length>1)throw new Error('Too many decision panels.');
}
