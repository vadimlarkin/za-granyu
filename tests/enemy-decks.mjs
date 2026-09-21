import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {enemyDeck,enemyClasses} from '../enemy-decks.mjs';
import {opponents} from '../campaign.mjs';
import {parseCardsMarkdown} from '../catalog.mjs';
import {createGame,endTurn} from '../engine.mjs';
const cards=parseCardsMarkdown(readFileSync(new URL('../cards.md',import.meta.url),'utf8'));
const expected={
 vagabond:['hit','strike','clever-feint','tight-guard','guard'],
 robber:['dodge','shot','rob','maneuver'],
 cultist:['spark','ward'],
 gangster:['hit','strike','clever-feint','tight-guard','guard','dodge','shot','haste','rob','maneuver','heal','dirty-bandages'],
 initiate:['dodge','shot','rob','maneuver','spark','ward'],
 hybrid:['spark','ward','fireball','oblivion'],
 'deep-one':['dodge','shot','rob','maneuver','spark','ward','fireball','oblivion'],
 grandmaster:['hit','strike','clever-feint','tight-guard','guard','dodge','shot','rob','maneuver','spark','ward','fireball','oblivion']
};
for(const enemy of opponents){
 const wanted=expected[enemy.id].sort();
 assert.deepEqual(enemyDeck(cards,enemy.type).sort(),wanted,enemy.name);
 const s=createGame(1,5,()=>.5,cards,enemy);
 assert.deepEqual([...s.enemy.deck,...s.enemy.hand].map(c=>c.key).sort(),wanted);
 assert.equal(s.hand.length+s.deck.length,10);
 // After several enemy turns, cards are still conserved except explicit theft.
 endTurn(s,()=>.5);
 const all=[...s.enemy.deck,...s.enemy.hand,...s.enemy.discard];
 assert.equal(new Set(all.map(c=>c.id)).size,all.length);
 console.log(`${enemy.name}: ${wanted.length} cards`);
}
assert.equal(Object.keys(enemyClasses).length,18);
for(const type of Object.keys(enemyClasses)){
 const gray=enemyDeck(cards,type).filter(key=>cards[key].color==='gray');
 assert.deepEqual(gray.sort(),type==='Специалист'?['dirty-bandages','haste','heal']:[],type);
}
// Starter flags and copies never filter an enemy's complete class catalogue.
const expanded={...cards,extra:{...cards.hit,id:'extra',copies:0,rarity:'bronze'},gold:{...cards.hit,id:'gold',rarity:'gold'}};
assert.ok(enemyDeck(expanded,'Бродяга').includes('extra'));
assert.ok(!enemyDeck(expanded,'Бродяга 2').includes('gold'));
assert.ok(!enemyDeck(cards,'Бродяга 2').includes('disarm'));
assert.ok(!enemyDeck(cards,'Бродяга').includes('left-hook'));
assert.throws(()=>enemyDeck(cards,'Missing'),/Неизвестный класс/);
assert.throws(()=>enemyDeck({},'Бродяга'),/нет доступных карт/);
console.log('PASS: exact decks for all 8 enemies, all 18 classes, tiers, complete pool, unknown/empty class guards');
