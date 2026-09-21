import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCardsMarkdown} from '../catalog.mjs';
import {createGame,play,paidEffect,endTurn,cardInHand} from '../engine.mjs';
import {starterDeck,createReward,claimReward,REWARD_WEIGHTS} from '../rewards.mjs';
const catalog=parseCardsMarkdown(readFileSync(new URL('../cards.md',import.meta.url),'utf8'));
assert.equal(Object.keys(catalog).length,25);
const initial=starterDeck(catalog);assert.equal(initial.length,10);assert.equal(new Set(initial).size,10);for(const color of ['red','green','blue'])assert.equal(initial.filter(id=>catalog[id].color===color).length,color==='green'?2:3);assert.equal(initial.filter(id=>catalog[id].color==='gray').length,2);
assert.equal(catalog.strike.amount,2);assert.equal(catalog.strike.rarity,'bronze');
assert.equal(catalog.dodge.amount,1);assert.equal(catalog.haste.cost,1);assert.equal(catalog.heal.cost,1);
function setup(key,payment=['heal','spark','shot']){
 const s=createGame(1,5,()=>.5,catalog);
 s.hand=[{id:'action',key},...payment.map((key,i)=>({id:`pay${i}`,key}))];
 s.enemy.hand=[];s.enemy.deck=[];s.enemy.discard=[];
 return s;
}
function use(s){const n=cardInHand(s,s.hand[0]).cost;play(s,'action',Array.from({length:n},(_,i)=>`pay${i}`));}
let s=setup('shot');s.enemy.dodge=2;s.enemy.armor=1;use(s);assert.equal(s.enemy.hp,9);assert.equal(s.enemy.dodge,2);assert.equal(s.enemy.armor,0);
s=setup('hit');s.enemy.dodge=1;use(s);assert.equal(s.enemy.hp,10);assert.equal(s.enemy.dodge,0);
s=setup('dodge',['shot']);assert.equal(paidEffect(s,'action',['pay0']).amount,1);use(s);assert.equal(s.dodge,1);
s=setup('dirty-bandages');s.hp=5;assert.equal(cardInHand(s,s.hand[0]).cost,0);assert.equal(paidEffect(s,'action',[]).boosted,false);use(s);assert.equal(s.hp,7);assert.equal(s.hand.length,3);
s=setup('dirty-trick');s.enemy.dodge=1;use(s);assert.equal(s.enemy.hp,10);assert.equal(s.enemy.confusion,1);
s.enemy.deck=Array.from({length:10},(_,i)=>({id:`e${i}`,key:'medkit'}));endTurn(s,()=>.5);assert.equal(s.enemy.hand.length,4);assert.equal(s.enemy.confusion,0);
endTurn(s,()=>.5);assert.equal(s.enemy.hand.length,5);
s=setup('dirty-trick');s.enemy.hand=[{id:'saved',key:'medkit'}];s.enemy.confusion=9;use(s);s.enemy.deck=[{id:'e',key:'medkit'}];endTurn(s,()=>.5);assert.equal(s.enemy.hand.length,2);assert.equal(s.enemy.confusion,0);
s=setup('rob');s.enemy.hand=[{id:'victim',key:'fireball',discount:1}];const old=s.hand.length;use(s);assert.equal(s.enemy.hand.length,0);assert.equal(s.hand.at(-1).discount,1);assert.equal(s.hand.length,old-3+1);assert.equal(s.hand.at(-1).key,'fireball');assert.equal(new Set([...s.hand,...s.discard].map(c=>c.id)).size,s.hand.length+s.discard.length);
s=setup('rob');s.enemy.discard=[{id:'victim',key:'fireball'}];s.enemy.deck=[{id:'untouched',key:'hit'}];use(s);assert.equal(s.enemy.discard.length,1);assert.equal(s.enemy.deck.length,1);assert.equal(s.hand.length,1);
// A stolen reward-only card is usable immediately but absent from the next battle.
const collection=starterDeck(catalog);s=createGame(1,5,()=>.5,catalog,null,collection);
s.hand=[{id:'rob',key:'rob'},{id:'pay',key:'hit'},{id:'pay2',key:'guard'}];s.enemy.hand=[{id:'victim',key:'dirty-bandages'}];s.hp=5;
play(s,'rob',['pay','pay2']);assert.equal(s.hand.length,1);assert.equal(s.enemy.hand.length,0);play(s,s.hand[0].id,[]);assert.equal(s.hp,7);
const next=createGame(1,5,()=>.5,catalog,null,collection);assert.equal(next.hand.length+next.deck.length,10);assert.ok(![...next.hand,...next.deck].some(c=>c.key==='dirty-bandages'));
// Enemy theft uses the same hand-to-hand transfer.
s=setup('hit');s.hand=[{id:'victim',key:'dirty-bandages'}];s.deck=[];s.discard=[];
s.enemy.cards.rob={...catalog.rob,cost:0};s.enemy.hand=[{id:'thief',key:'rob'}];endTurn(s,()=>.5);
assert.ok(!s.hand.some(c=>c.key==='dirty-bandages'));assert.ok([...s.enemy.hand,...s.enemy.discard].some(c=>c.key==='dirty-bandages'));

s=setup('maneuver');s.deck=[{id:'draw1',key:'hit'},{id:'draw2',key:'guard'}];use(s);assert.equal(s.hand.length,3);assert.equal(s.deck.length,0);
s=setup('maneuver',Array(8).fill('hit'));s.deck=[{id:'draw1',key:'hit'},{id:'draw2',key:'guard'}];use(s);assert.equal(s.hand.length,8);
s=setup('maneuver',['hit','guard']);s.deck=[];s.discard=[];use(s);assert.equal(s.hand.length,2); // just played/payment cards can be reshuffled
s=setup('haste',['shot','dodge','fireball']);use(s);assert.equal(cardInHand(s,s.hand[0]).cost,0);assert.equal(cardInHand(s,s.hand[1]).cost,1);
// Enemy stun discards from the already replenished player hand at turn start.
s=setup('hit');s.hand=[];s.deck=Array.from({length:8},(_,i)=>({id:`p${i}`,key:'medkit'}));s.enemy.cards.hit={...s.enemy.cards.hit,cost:0};s.enemy.hand=[{id:'a',key:'hit'}];endTurn(s,()=>.5);assert.equal(s.hand.length,3);assert.equal(s.confusion,0);
let deck=initial;let reward=createReward(catalog,()=>.5);assert.equal(new Set(reward.choices).size,3);assert.throws(()=>claimReward(deck,reward,'missing'));deck=claimReward(deck,reward,reward.choices[0]);assert.equal(deck.length,11);assert.throws(()=>claimReward(deck,reward,reward.choices[1]));
s=createGame(1,5,()=>.5,catalog,null,deck);assert.equal(s.hand.length+s.deck.length,11);assert.equal(s.enemy.hand.length+s.enemy.deck.length,10);
const pool=Object.values(catalog).filter(c=>!c.copies),total=pool.reduce((n,c)=>n+REWARD_WEIGHTS[c.rarity],0);
const seen=new Set();let offset=0;for(const card of pool){const weight=REWARD_WEIGHTS[card.rarity],ticket=(offset+weight/2)/total;seen.add(createReward(catalog,()=>ticket).choices[0]);offset+=weight;}assert.equal(seen.size,15);for(const key of initial)assert.ok(!seen.has(key));
console.log('PASS: 25 cards, starter deck, shooting, dodge, discounts, confusion on both sides, theft, draws, rewards and retained collection');
