import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCardsMarkdown,describeParts} from '../catalog.mjs';
import {groupCatalogCards,RARITY_ORDER} from '../card-catalog.mjs';
import {createGame,play,paidEffect} from '../engine.mjs';
import {hasPlayableCard} from '../turn-flow.mjs';

const catalog=parseCardsMarkdown(readFileSync(new URL('../cards.md',import.meta.url),'utf8'));
assert.equal(Object.keys(catalog).length,30);
for(const key of ['sucker-punch','stash','spit','sidestep','poke'])assert.ok(catalog[key]);
assert.equal(catalog.spit.malus,'blind');
assert.equal(catalog.poke.special,'series');
assert.match(describeParts(catalog.spit).at(-1).text,/Выстрел/);

const groups=groupCatalogCards(catalog);
assert.deepEqual(groups.map(group=>group.color),['red','green','blue','gray']);
for(const group of groups){
 const rarityIndexes=group.cards.map(card=>RARITY_ORDER.indexOf(card.rarity));
 assert.deepEqual(rarityIndexes,[...rarityIndexes].sort((a,b)=>a-b));
}

let game=createGame(0,4,()=>.5,catalog);
game.hand=[{id:'spit',key:'spit'}];game.enemy.hand=[];game.enemy.deck=[];game.enemy.discard=[];
play(game,'spit',[]);assert.equal(game.enemy.blind,1);

game=createGame(0,4,()=>.5,catalog);
game.blind=1;game.hand=[{id:'shot',key:'shot'},{id:'pay',key:'hit'}];
assert.equal(hasPlayableCard(game),true); // «Правый коронный» всё ещё доступен.
assert.throws(()=>play(game,'shot',['pay']),/Ослепление/);

game=createGame(0,4,()=>.5,catalog);
game.hand=[{id:'poke',key:'poke'},{id:'pay',key:'poke'}];game.enemy.hand=[];game.enemy.deck=[];game.enemy.discard=[];
const effect=paidEffect(game,'poke',['pay']);assert.equal(effect.special,4);
play(game,'poke',['pay']);assert.equal(game.enemy.hp,3);
console.log('PASS: five street cards, blindness, series and catalogue ordering');
