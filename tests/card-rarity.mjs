import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCardsMarkdown,RARITIES} from '../catalog.mjs';
import {createGame,paidEffect,play} from '../engine.mjs';
import {cardFace} from '../card-face.mjs';
const source=readFileSync(new URL('../cards.md',import.meta.url),'utf8');
const catalog=parseCardsMarkdown(source);
assert.equal(Object.keys(catalog).length,30);
const legacy='## Карты\n| ID | Название | Цвет | Стоимость | Тип | Эффект | Сила | Копий |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n| hit | Удар | красный | 1 | Атака | Физическая атака | 2 | 3 |';
assert.equal(parseCardsMarkdown(legacy).hit.rarity,'bronze');
for(const [rarity,label] of Object.entries(RARITIES)){
 const c=parseCardsMarkdown(source.replaceAll(/(?:Бронза|Серебро|Золото|Фиолетовая|Алмазная) \|/g,label.toLowerCase()+' |'));
 assert.ok(Object.values(c).every(card=>card.rarity===rarity));
 const s=createGame(1,5,()=>.5,c);s.hand=[{id:'a',key:'hit'},{id:'b',key:'guard'},{id:'c',key:'strike'}];
 assert.equal(paidEffect(s,'a',['b']).amount,3);play(s,'a',['b']);assert.equal(s.enemy.hp,7);
 assert.ok(!cardFace(c.hit).includes('card-rarity'));
}
assert.throws(()=>parseCardsMarkdown(source.replace('Бронза |','мифическая |')),/редкость/);
assert.throws(()=>parseCardsMarkdown(source.replace('Бронза |',' |')),/редкость/);
assert.ok(cardFace({...catalog.hit,name:'<script>'}).includes('&lt;script&gt;'));
assert.ok(cardFace(catalog.hit,{amount:4}).includes('>4</span>'));
console.log('PASS: five rarities, legacy table, validation, safe labels, unchanged payment and damage');

assert.ok(!cardFace(catalog.hit).includes('card-type'));
