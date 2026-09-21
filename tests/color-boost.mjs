import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCardsMarkdown} from '../catalog.mjs';
import {createGame,paidEffect,play,enemyTurn} from '../engine.mjs';
const catalog=parseCardsMarkdown(readFileSync(new URL('../cards.md',import.meta.url),'utf8'));
function fixture(effect='physical',amount=2,cost=1){
 const s=createGame(1,5,()=>.5,catalog);
 s.cards.test={...catalog.hit,effect,amount,cost,special:'none',specialAmount:0};
 s.hand=[{id:'a',key:'test'},{id:'p',key:'guard'},{id:'q',key:'strike'}];
 return s;
}
for(const effect of ['physical','magic','shot','armor','ward','heal']){
 for(const [base,expected]of [[1,1],[2,3],[3,4],[4,6],[0,0]]){
  const s=fixture(effect,base);assert.equal(paidEffect(s,'a',['p']).amount,expected);
 }
}
let s=fixture();assert.equal(paidEffect(s,'a',[]).boosted,false);
s.hand[1].key='spark';assert.equal(paidEffect(s,'a',['p']).amount,2);
s=fixture('physical',4,2);assert.equal(paidEffect(s,'a',['p','q']).amount,6);
s.hand[2].key='spark';assert.equal(paidEffect(s,'a',['p','q']).amount,4);
s=fixture('physical',4,0);assert.equal(paidEffect(s,'a',[]).boosted,false);
s=fixture('dodge',3);assert.equal(paidEffect(s,'a',['p']).amount,3);assert.equal(paidEffect(s,'a',['p']).boosted,false);
s=fixture();Object.assign(s.cards.test,{bonus:'vigor',bonusAmount:2,malus:'stun',malusAmount:3,special:'draw',specialAmount:1});
const handBefore=s.hand.length;play(s,'a',['p']);assert.equal(s.enemy.hp,7);assert.equal(s.vigor,2);assert.equal(s.enemy.confusion,3);assert.equal(s.hand.length,handBefore-2+2);
assert.match(s.log[0],/\+50%/);
s=fixture();s.enemy.cards.test={...catalog.hit,cost:1};s.enemy.hand=[{id:'a',key:'test'},{id:'p',key:'guard'}];s.enemy.deck=[];s.enemy.discard=[];
const steps=[...enemyTurn(s,()=>.5)];assert.equal(steps.find(x=>x.phase==='reveal').effect.amount,3);assert.equal(s.hp,7);
console.log('PASS: +50%, floor, full/mixed/free payment, dodge exclusion, doubled specials and unboosted statuses and enemy symmetry');
