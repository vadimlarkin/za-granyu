import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCardsMarkdown} from '../catalog.mjs';
import {createGame,play,endTurn,isStunned} from '../engine.mjs';
const cards=parseCardsMarkdown(readFileSync(new URL('../cards.md',import.meta.url),'utf8'));
// Isolated fixtures for the original surprise/stun rules, independent of authored card balance.
cards.hit={...cards.hit,special:'surprise',specialAmount:1,malus:'none',malusAmount:0};
cards.strike={...cards.strike,special:'none',specialAmount:0,malus:'stun',malusAmount:1};
let s=createGame(0,4,()=>.5,cards);
s.enemy.hand=[];s.enemy.deck=[];s.enemy.discard=[];
s.hand=[{id:'stun',key:'strike'},{id:'a',key:'heal'},{id:'b',key:'haste'}];
play(s,'stun',['a','b']);assert.equal(s.enemy.hp,8);
endTurn(s,()=>.5);assert.ok(isStunned(s.enemy));assert.equal(s.enemy.confusion,0);
s.hand=[{id:'combo',key:'hit'},{id:'pay',key:'guard'}];play(s,'combo',['pay']);assert.equal(s.enemy.hp,5);
assert.ok(isStunned(s.enemy));endTurn(s,()=>.5);assert.equal(isStunned(s.enemy),false);
assert.equal(s.log.filter(x=>x.includes('в начале хода сброшено')).length,1);
// A second application has its own lifetime, without repeating the first discard.
s=createGame(0,4,()=>.5,cards);s.enemy.hand=[];s.enemy.deck=[];s.enemy.discard=[];
s.cards.mark={...cards.strike,effect:'none',amount:0,cost:0};s.hand=[{id:'first',key:'mark'}];
play(s,'first',[]);endTurn(s,()=>.5);assert.ok(isStunned(s.enemy));
s.hand=[{id:'second',key:'mark'}];play(s,'second',[]);endTurn(s,()=>.5);assert.ok(isStunned(s.enemy));assert.equal(s.enemy.activeConfusion,1);
assert.equal(s.log.filter(x=>x.includes('в начале хода сброшено')).length,2);
endTurn(s,()=>.5);assert.equal(isStunned(s.enemy),false);
// Enemy casts stun, its next attack leaves the malus active until the end of its next turn.
s=createGame(0,4,()=>.5,cards);s.enemy.cards.mark={...cards.strike,effect:'none',amount:0,cost:0};
s.enemy.hand=[{id:'mark',key:'mark'}];s.enemy.deck=[];s.enemy.discard=[];
endTurn(s,()=>.5);assert.ok(isStunned(s));assert.equal(s.hp,10);
s.enemy.hand=[{id:'combo',key:'hit'},{id:'pay',key:'guard'}];s.enemy.deck=[];s.enemy.discard=[];
endTurn(s,()=>.5);assert.equal(s.hp,7);assert.equal(isStunned(s),false);
console.log('PASS: malus lasts through caster next turn, combos work on both sides, one discard per application, independently expiring stacks.');
