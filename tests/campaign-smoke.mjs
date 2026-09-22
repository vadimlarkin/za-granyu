import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCardsMarkdown} from '../catalog.mjs';
import {createGame,play,endTurn,cardInHand} from '../engine.mjs';
import {opponents} from '../campaign.mjs';
import {PERKS} from '../progression.mjs';
const cards=parseCardsMarkdown(readFileSync(new URL('../cards.md',import.meta.url),'utf8'));
let seed=1747;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
let actions=0,battles=0,completed=0;
for(const opponent of opponents)for(const perk of [null,...PERKS.map(p=>p.id)])for(let run=0;run<4;run++){
 const s=createGame(2,6,random,cards,opponent,Object.keys(cards),run%2,perk);
 const count=()=>[s,s.enemy].flatMap(a=>[...a.hand,...a.deck,...a.discard]);const total=count().length;
 for(let turn=0;turn<30&&s.status==='playing';turn++){
  for(let move=0;move<50&&s.status==='playing';move++){
   const available=s.hand.filter(c=>{const card=cardInHand(s,c);return card.cost<s.hand.length&&!(s.blind>0&&card.effect==='shot');});
   if(!available.length)break;
   const chosen=available[Math.floor(random()*available.length)],card=cardInHand(s,chosen);
   const others=s.hand.filter(c=>c!==chosen).sort((a,b)=>(s.cards[b.key].color===card.color)-(s.cards[a.key].color===card.color));
   play(s,chosen.id,others.slice(0,card.cost).map(c=>c.id));actions++;
   assert.equal(count().length,total);assert.equal(new Set(count().map(c=>c.id)).size,total);
  }
  endTurn(s,random);
  assert.equal(count().length,total);assert.equal(new Set(count().map(c=>c.id)).size,total);
  for(const actor of [s,s.enemy])for(const key of ['hp','armor','ward','dodge','confusion','blind','vigor'])assert.ok(Number.isFinite(actor[key])&&actor[key]>=0,`${opponent.id}: ${key}`);
 }
 battles++;if(s.status!=='playing')completed++;
}
assert.ok(actions>500);console.log(`PASS: ${battles} seeded battles, ${actions} player actions, ${completed} resolved within 30 turns; card conservation and nonnegative stats. Random policy is not a difficulty estimate.`);
