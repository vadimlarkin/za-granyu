import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCardsMarkdown,describe,effectAmount} from '../catalog.mjs';
import {createGame,play,endTurn} from '../engine.mjs';
import {activeStatuses} from '../statuses.mjs';
const catalog=parseCardsMarkdown(readFileSync(new URL('../cards.md',import.meta.url),'utf8'));
function fixture(){
 const s=createGame(1,5,()=>.5,catalog);
 s.cards.status={...catalog.hit,effect:'none',amount:0,cost:0,special:'none',bonus:'vigor',bonusAmount:2,malus:'stun',malusAmount:3};
 s.hand=[{id:'a',key:'status'},{id:'b',key:'status'}];
 s.deck=Array.from({length:20},(_,i)=>({id:'d'+i,key:'guard'}));
 s.enemy.hand=[{id:'saved',key:'guard'}];s.enemy.cards.guard={...catalog.guard,cost:99};
 s.enemy.deck=Array.from({length:10},(_,i)=>({id:'e'+i,key:'guard'}));
 return s;
}
let s=fixture();play(s,'a',[]);play(s,'b',[]);
assert.equal(s.vigor,4);assert.equal(s.enemy.confusion,6);assert.equal(s.confusion,0);
assert.match(activeStatuses(s)[0].tooltip,/больше на 4/);assert.match(activeStatuses(s.enemy)[0].tooltip,/сбросить до 6/);
endTurn(s,()=>.5);assert.equal(s.hand.length,8);assert.equal(s.enemy.hand.length,4);
assert.equal(activeStatuses(s)[0].amount,4);assert.match(activeStatuses(s)[0].tooltip,/уже применено/);assert.equal(activeStatuses(s.enemy)[0].amount,6);
endTurn(s,()=>.5);assert.equal(s.hand.length,8);assert.deepEqual(activeStatuses(s),[]); // ordinary draw never discards an overfull hand
s=fixture();s.hand=Array.from({length:7},(_,i)=>({id:'saved'+i,key:'guard'}));s.vigor=2;s.confusion=1;
endTurn(s,()=>.5);assert.equal(s.hand.length,8); // +2 and -1 apply to actual next draw, even over cap
s=fixture();s.cards.status={...s.cards.status,bonus:'none',malus:'none',special:'draw',specialAmount:1};s.vigor=2;
play(s,'a',[]);assert.equal(s.vigor,2); // immediate special draw does not consume next-turn status
s=fixture();s.enemy.cards.status={...s.cards.status,bonusAmount:1,malusAmount:2};s.enemy.hand=[{id:'enemy',key:'status'}];s.enemy.deck=[];s.enemy.discard=[];
endTurn(s,()=>.5);assert.equal(s.enemy.vigor,0);assert.equal(s.enemy.activeVigor,1);assert.equal(s.vigor,0);assert.equal(s.confusion,0);assert.equal(s.hand.length,2);
assert.match(describe(catalog.hit),/Оглушение 1/);
assert.equal(catalog.hit.malus,'stun');assert.equal(catalog.hit.special,'none');
assert.equal(effectAmount({...catalog.dodge,amount:0}),0);
assert.equal(effectAmount({...catalog.dodge,amount:3}),3);
assert.throws(()=>parseCardsMarkdown(readFileSync(new URL('../cards.md',import.meta.url),'utf8').replace('Оглушение | 1','Оглушение | -1')),/целые/);
console.log('PASS: stacking, correct target, both sides, end-of-turn expiry, saved hand, over-cap draw, parameterized statuses and parser validation');
