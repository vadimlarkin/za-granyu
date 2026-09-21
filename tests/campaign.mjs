import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {opponents,createCampaign,currentOpponent,advanceCampaign} from '../campaign.mjs';
import {createGame} from '../engine.mjs';
import {parseCardsMarkdown} from '../catalog.mjs';
const cards=parseCardsMarkdown(readFileSync(new URL('../cards.md',import.meta.url),'utf8'));
const orders=new Set();
for(let run=0;run<100;run++){
 let campaign=createCampaign();orders.add(campaign.queue.join(','));
 assert.equal(campaign.queue.length,8);assert.equal(campaign.queue[0],'vagabond');assert.equal(campaign.queue.at(-1),'grandmaster');
 for(const enemy of opponents)assert.equal(campaign.queue.filter(id=>id===enemy.id).length,1);
 let lastLevel=0;
 for(let index=0;index<8;index++){
  const enemy=currentOpponent(campaign);assert.ok(enemy.level>=lastLevel);lastLevel=enemy.level;
  const game=createGame(1,5,Math.random,cards,enemy);
  assert.equal(game.enemy.hp,enemy.hp);assert.equal(game.enemy.cap,enemy.cap);assert.equal(game.enemy.level,enemy.level);assert.equal(game.hp,10);assert.equal(game.cap,5);
  assert.equal(advanceCampaign(campaign,'lost').index,0);
  assert.throws(()=>advanceCampaign(campaign,'playing'));
  campaign=advanceCampaign(campaign,'won');
 }
 assert.equal(campaign.index,0);
}
assert.equal(orders.size,1);assert.deepEqual(createCampaign().queue,['vagabond','robber','cultist','gangster','initiate','hybrid','deep-one','grandmaster']);
console.log('Campaign: counts, order, progression, retry, restart and independent enemy stats passed.');
