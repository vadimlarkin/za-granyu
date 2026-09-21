import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCardsMarkdown} from '../catalog.mjs';
import {createGame,play,enemyTurn,endTurn} from '../engine.mjs';
const cards=parseCardsMarkdown(readFileSync(new URL('../cards.md',import.meta.url),'utf8'));
let s=createGame(0,4,()=>.5,cards);
assert.equal(s.hand.length,3);assert.equal(s.enemy.hand.length,3);
s.hand=[{id:'rob',key:'rob'},{id:'p1',key:'shot'},{id:'p2',key:'dodge'}];
play(s,'rob',['p1','p2']);assert.equal(s.hand.length,2);assert.equal(s.enemy.hand.length,1);
// End-player refill occurs before the enemy action, not after it.
s=createGame(0,4,()=>.5,cards);s.hand=[];s.deck=Array.from({length:10},(_,i)=>({id:'h'+i,key:'ward'}));s.discard=[];
s.enemy.cards.shot={...cards.shot,cost:99};s.enemy.cards.dodge={...cards.dodge,cost:99};
s.enemy.hand=[{id:'a',key:'rob'},{id:'b',key:'shot'},{id:'c',key:'dodge'}];s.enemy.deck=[];s.enemy.discard=[];
const turn=enemyTurn(s,()=>.5);const first=turn.next().value;
assert.equal(first.phase,'reveal');assert.equal(first.card.key,'rob');assert.equal(s.hand.length,4);assert.equal(s.enemy.hand.length,3);
const hit=turn.next().value;assert.equal(hit.phase,'effect');assert.equal(s.hand.length,2);
for(const step of turn){} // The player's stolen cards are not replaced at start of their turn.
assert.ok(s.hand.length<=2);assert.ok(s.enemy.hand.length>0);
// Start-of-turn random discard consumes pending stun once, strips discounts,
// and does not remove cards from deck or cause an immediate replacement draw.
s=createGame(0,4,()=>.5,cards);s.enemy.hand=[];s.enemy.deck=[];s.enemy.discard=[];
s.hand=[{id:'kept0',key:'ward'},{id:'kept1',key:'ward'},{id:'drop',key:'ward',discount:1},{id:'kept3',key:'ward'}];s.confusion=1;
endTurn(s,()=>.5);assert.equal(s.hand.length,3);assert.equal(s.confusion,0);assert.equal(s.activeConfusion,1);
assert.deepEqual(s.discard.find(c=>c.id==='drop'),{id:'drop',key:'ward'});
endTurn(s,()=>.5);assert.equal(s.hand.length,4);assert.equal(s.activeConfusion,0);
s=createGame(0,4,()=>.5,cards);s.hand=[{id:'only',key:'ward'}];s.deck=[];s.discard=[];s.confusion=9;s.enemy.hand=[];s.enemy.deck=[];s.enemy.discard=[];
endTurn(s,()=>.5);assert.equal(s.hand.length,0);assert.equal(s.discard.length,1);endTurn(s,()=>.5);assert.equal(s.hand.length,1);
// A stunned enemy loses its ready hand before acting, then refills at end.
s=createGame(0,4,()=>.5,cards);s.enemy.confusion=1;s.enemy.cards.ward={...cards.ward,cost:99};
s.enemy.hand=[{id:'e0',key:'ward'},{id:'e1',key:'ward'},{id:'e2',key:'ward'}];s.enemy.deck=Array.from({length:8},(_,i)=>({id:'ed'+i,key:'ward'}));s.enemy.discard=[];
endTurn(s,()=>.5);assert.equal(s.enemy.hand.length,4);assert.deepEqual(s.enemy.discard,[{id:'e1',key:'ward'}]);
assert.equal(s.enemy.confusion,0);assert.equal(s.enemy.activeConfusion,1);endTurn(s,()=>.5);assert.equal(s.enemy.activeConfusion,0);
console.log('PASS: two starting hands, theft on first turn, end-of-turn refill, no refill after theft/stun, random discard, expiry and empty hands.');
