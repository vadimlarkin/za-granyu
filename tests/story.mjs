import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {createCampaign} from '../campaign.mjs';
import {encounterStory,encounterLocation} from '../story.mjs';
for(let run=0;run<100;run++){
 const campaign=createCampaign(),titles=new Set();
 for(campaign.index=0;campaign.index<campaign.queue.length;campaign.index++){
  const scene=encounterStory(campaign),location=encounterLocation(campaign);
  assert.ok(scene.text.length>0&&scene.text.length<300);
  assert.ok(!titles.has(scene.title));titles.add(scene.title);
  assert.ok(existsSync(new URL('../'+location.art,import.meta.url)));
  assert.deepEqual(encounterStory({...campaign}),scene);
 }
 assert.equal(titles.size,8);
}
console.log('PASS: all 8 unique brief scenes across 100 shuffled campaigns, stable retries and existing location assets');
