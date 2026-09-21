import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCardsMarkdown} from '../catalog.mjs';
import {createReward,REWARD_WEIGHTS} from '../rewards.mjs';
const catalog=parseCardsMarkdown(readFileSync(new URL('../cards.md',import.meta.url),'utf8'));
assert.equal(REWARD_WEIGHTS.bronze/REWARD_WEIGHTS.silver,5);
// Boundary: one silver weight occupies [5,6) after one bronze weight.
const tiny={a:{rarity:'bronze',copies:0},b:{rarity:'silver',copies:0},c:{rarity:'bronze',copies:0}};
assert.equal(createReward(tiny,()=>4.99/11).choices[0],'a');
assert.equal(createReward(tiny,()=>5.01/11).choices[0],'b');
assert.equal(createReward(tiny,()=>6.01/11).choices[0],'c');
let seed=12345;const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
const counts={bronze:0,silver:0};
for(let i=0;i<20000;i++){
 const reward=createReward(catalog,random);assert.equal(new Set(reward.choices).size,3);
 for(const key of reward.choices)assert.equal(catalog[key].copies,0);
 counts[catalog[reward.choices[0]].rarity]++;
}
const n=rarity=>Object.values(catalog).filter(c=>c.rarity===rarity&&c.copies===0).length;
const ratio=(counts.silver/n('silver'))/(counts.bronze/n('bronze'));
assert.ok(ratio>.18&&ratio<.27,`Weighted inclusion ratio: ${ratio}`);
console.log(`PASS: weight ratio 1:5, weighted boundaries, unique choices; per-card silver first-pick rate ${(ratio*100).toFixed(1)}% of bronze`);
