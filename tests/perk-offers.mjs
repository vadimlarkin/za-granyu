import assert from 'node:assert/strict';
import {PERKS,newProgress,perkChoices,choosePerk} from '../progression.mjs';
const p=newProgress();assert.deepEqual(perkChoices(p),[]);assert.equal(p.perkChoices,null);
p.level=1;assert.deepEqual(perkChoices(p),[]);p.level=2;
const offered=perkChoices(p,()=>0).map(p=>p.id);
assert.equal(offered.length,3);assert.equal(new Set(offered).size,3);
assert.deepEqual(perkChoices(p,()=>{throw Error('Must not reroll');}).map(p=>p.id),offered);
assert.throws(()=>choosePerk(p,PERKS.find(p=>!offered.includes(p.id)).id));
choosePerk(p,offered[1]);assert.equal(p.perk,offered[1]);assert.deepEqual(perkChoices(p),[]);assert.throws(()=>choosePerk(p,offered[0]));
assert.equal(newProgress().perkChoices,null);
let seed=81;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const seen=new Set(),sets=new Set();
for(let i=0;i<200;i++){
 const progress={...newProgress(),level:2},choices=perkChoices(progress,random);
 assert.equal(choices.length,3);assert.equal(new Set(choices.map(p=>p.id)).size,3);
 assert.ok(choices.every(p=>p.level===progress.level));choices.forEach(p=>seen.add(p.id));sets.add(choices.map(p=>p.id).sort().join(','));
}
assert.equal(seen.size,5);assert.equal(sets.size,10);
assert.deepEqual(perkChoices({...newProgress(),level:3}),[]);
console.log('PASS: three unique random level-specific perks, stable offers, restricted confirmation, fresh adventure, all ten combinations.');
