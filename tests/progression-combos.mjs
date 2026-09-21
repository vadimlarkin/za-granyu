import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCardsMarkdown} from '../catalog.mjs';
import {createGame,paidEffect,play,endTurn,isStunned,limit} from '../engine.mjs';
import {newProgress,creditVictory,choosePerk,needsPerk,PERKS} from '../progression.mjs';
import {opponents,createCampaign} from '../campaign.mjs';
import {encounterLocation} from '../story.mjs';
import {createReward,previewReward,confirmReward,rewardResolved,starterDeck} from '../rewards.mjs';
const cards=parseCardsMarkdown(readFileSync(new URL('../cards.md',import.meta.url),'utf8'));
const p=newProgress();assert.throws(()=>choosePerk(p,'warrior'));
const levels=[0,0,1,1,1,2,2,2],xp=[20,40,60,90,120,150,190,240];
opponents.forEach((o,i)=>{creditVictory(p,i,o.xp);assert.equal(p.level,levels[i]);assert.equal(p.xp,xp[i]);creditVictory(p,i,o.xp);assert.equal(p.xp,xp[i]);});
assert.equal(needsPerk(p),true);assert.throws(()=>choosePerk(p,'unknown'));choosePerk(p,'mage');assert.equal(needsPerk(p),false);assert.throws(()=>choosePerk(p,'thief'));
const c=createCampaign(),locations=c.queue.map((_,index)=>encounterLocation({...c,index}).name);
assert.equal(locations[0],locations[2]);assert.notEqual(locations[2],locations[3]);assert.equal(locations[3],locations[5]);assert.notEqual(locations[5],locations[6]);assert.equal(locations[6],locations[7]);
function fixture(key='hit',payment=['guard']){
 const s=createGame(0,4,()=>.5,cards);s.hand=[{id:'a',key},...payment.map((key,i)=>({id:'p'+i,key}))];
 s.enemy.hand=[];s.enemy.deck=[];s.enemy.discard=[];return s;
}
for(const perk of PERKS.filter(x=>x.color)){
 const s=fixture();s.perk=perk.id;s.cards.hit={...cards.hit,color:perk.color,cost:2,special:'rob',specialAmount:1};
 s.cards.guard={...cards.guard,color:perk.color};s.hand.push({id:'p1',key:'heal'});
 const effect=paidEffect(s,'a',['p0','p1']);assert.equal(effect.amount,3);assert.equal(effect.special,1);assert.equal(effect.specialBoosted,false);
}
let s=createGame(2,6,()=>.5,cards,opponents[6],null,0,'reserve');assert.equal(s.hand.length,4);s.turn=2;assert.equal(limit(s),4);
s=createGame(2,6,()=>.5,cards,opponents[6],null,1,'reserve');assert.equal(s.hand.length,5);assert.equal(s.cap,7);
s=createGame(2,6,()=>.5,cards,opponents[6],null,0,'veteran');assert.equal(s.enemy.hp,11);assert.equal(s.enemy.maxHp,11);assert.equal(s.hp,10);
// Exactly two stolen cards, and real payment/target depletion.
s=fixture('rob',['shot','dodge']);s.enemy.hand=[{id:'v1',key:'hit'},{id:'v2',key:'guard'},{id:'v3',key:'ward'}];
assert.equal(paidEffect(s,'a',['p0','p1']).special,2);play(s,'a',['p0','p1']);assert.equal(s.hand.length,2);assert.equal(s.enemy.hand.length,1);
s=fixture('rob',['shot','heal']);assert.equal(paidEffect(s,'a',['p0','p1']).special,1);
s=fixture('haste',['heal','fireball']);assert.equal(cards.haste.color,'gray');assert.equal(paidEffect(s,'a',['p0']).boosted,false);play(s,'a',['p0']);assert.equal(s.hand[0].discount,1);
s=fixture('heal',['haste']);s.hp=1;assert.equal(paidEffect(s,'a',['p0']).amount,2);play(s,'a',['p0']);assert.equal(s.hp,3);
s=fixture('maneuver',['shot','dodge']);s.deck=Array.from({length:8},(_,i)=>({id:'d'+i,key:'guard'}));play(s,'a',['p0','p1']);assert.equal(s.hand.length,4);
// Surprise joins the primary hit, before defense. One dodge prevents both.
s=fixture();s.enemy.confusion=1;s.enemy.armor=1;play(s,'a',['p0']);assert.equal(s.enemy.hp,6);
s=fixture();s.enemy.activeConfusion=1;s.enemy.dodge=1;play(s,'a',['p0']);assert.equal(s.enemy.hp,10);assert.equal(s.enemy.dodge,0);
s=fixture('shot',['heal']);s.enemy.ward=1;s.enemy.armor=2;s.enemy.dodge=1;play(s,'a',['p0']);assert.equal(s.enemy.ward,0);assert.equal(s.enemy.armor,1);assert.equal(s.enemy.hp,10);assert.equal(s.enemy.dodge,1);
// Dodge survives the next draw, permits fortify, then expires at turn end.
s=fixture('dodge',['heal']);play(s,'a',['p0']);endTurn(s,()=>.5);assert.equal(s.dodge,1);
s.hand=[{id:'a',key:'guard'},{id:'p0',key:'heal'}];play(s,'a',['p0']);assert.equal(s.stance,1);assert.equal(s.armor,2);
endTurn(s,()=>.5);assert.equal(s.dodge,0);assert.equal(s.armor,2);assert.equal(s.stance,1);
s=fixture('guard',['heal']);play(s,'a',['p0']);assert.equal(s.stance,0);endTurn(s,()=>.5);assert.equal(s.armor,0);
s=fixture();s.confusion=1;endTurn(s,()=>.5);assert.equal(isStunned(s),true);assert.equal(s.confusion,0);endTurn(s,()=>.5);assert.equal(isStunned(s),false);
// Tentative card/skip selection must never mutate collection or grant the skip benefit.
const deck=starterDeck(cards),r=createReward(cards,()=>.5),[a,b]=r.choices;
assert.throws(()=>confirmReward(deck,r));previewReward(r,a);previewReward(r,b);assert.equal(deck.length,10);assert.equal(rewardResolved(r),false);
previewReward(r,'skip');assert.equal(r.skipped,false);previewReward(r,b);const updated=confirmReward(deck,r);assert.equal(updated.length,11);assert.equal(updated.at(-1),b);assert.throws(()=>confirmReward(updated,r));assert.throws(()=>previewReward(r,a));
const skip=createReward(cards,()=>.5);previewReward(skip,a);previewReward(skip,'skip');assert.equal(confirmReward(deck,skip),deck);assert.equal(skip.skipped,true);
console.log('PASS: XP milestones/idempotency, fixed scenes, all five perks, gray exclusion, double specials, combos, shields, expiry and reversible reward confirmation.');
