import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {parseCardsMarkdown} from '../catalog.mjs';
import {createGame,play,paidEffect,endTurn,enemyTurn} from '../engine.mjs';
const cards=parseCardsMarkdown(readFileSync(new URL('../cards.md',import.meta.url),'utf8'));
function game(keys){
 const s=createGame(0,4,()=>.5,cards);s.hand=keys.map((key,i)=>({key,id:String(i)}));
 s.enemy.hp=s.enemy.maxHp=50;s.enemy.hand=[];s.enemy.deck=[];s.enemy.discard=[];return s;
}
// Red payment strengthens the right cross; the payment hook remains a separate unboosted 4.
let s=game(['hit','left-hook']);assert.equal(paidEffect(s,'0',['1']).amount,3);play(s,'0',['1']);
assert.equal(s.enemy.hp,43);assert.deepEqual(s.events.filter(x=>x.kind==='damage').map(x=>x.amount),[3,4]);
s=game(['hit','left-hook']);s.enemy.dodge=1;play(s,'0',['1']);assert.equal(s.enemy.hp,46);
s=game(['hit','left-hook']);s.enemy.dodge=2;play(s,'0',['1']);assert.equal(s.enemy.hp,50);
s=game(['hit','left-hook']);s.enemy.armor=5;play(s,'0',['1']);assert.equal(s.enemy.hp,48);
// Paying another card with a hook does not activate the exception.
s=game(['guard','left-hook']);play(s,'0',['1']);assert.equal(s.enemy.hp,50);
// Immediate following hook joins primary damage; full same-colour payment gives 3 + 8.
s=game(['hit','heal','left-hook','guard']);play(s,'0',['1']);
assert.match(paidEffect(s,'2',['3']).text,/отдельный удар 4 без усиления/);
play(s,'2',['3']);assert.equal(s.enemy.hp,37);assert.deepEqual(s.events.filter(x=>x.kind==='damage').map(x=>x.amount),[11]);
s=game(['hit','heal','left-hook','ward']);play(s,'0',['1']);play(s,'2',['3']);assert.equal(s.enemy.hp,42);
s=game(['hit','heal','left-hook','guard']);play(s,'0',['1']);s.enemy.dodge=1;play(s,'2',['3']);assert.equal(s.enemy.hp,48);
// Intervening free play and end of turn each break the sequence.
s=game(['hit','heal','dirty-bandages','left-hook','guard']);play(s,'0',['1']);play(s,'2',[]);play(s,'3',['4']);assert.equal(s.enemy.hp,45);
s=game(['hit','heal']);play(s,'0',['1']);endTurn(s,()=>.5);s.hand=[{id:'a',key:'left-hook'},{id:'b',key:'guard'}];play(s,'a',['b']);assert.equal(s.enemy.hp,45);
// Own stun does not enable combination; pre-existing stun enables doubled draw.
for(const stunned of [false,true]){
 s=game(['brass-knuckles','guard','hit']);s.deck=Array.from({length:6},(_,i)=>({id:'d'+i,key:'heal'}));s.discard=[];s.enemy.confusion=stunned?1:0;
 play(s,'0',['1','2']);assert.equal(s.hand.length,stunned?2:0);assert.equal(s.enemy.confusion,stunned?2:1);
}
for(const stance of [false,true]){
 s=game(['best-defense','guard','hit']);s.stance=stance?1:0;play(s,'0',['1','2']);assert.equal(s.armor,3);assert.equal(s.enemy.hp,stance?46:50);
}
s=game(['clever-feint','guard']);play(s,'0',['1']);assert.equal(s.vigor,1);assert.equal(s.enemy.hp,49);
// The payment exception works symmetrically for enemies.
s=game([]);s.enemy.hand=[{id:'r',key:'hit'},{id:'l',key:'left-hook'}];[...enemyTurn(s,()=>.5)];assert.equal(s.hp,3);
for(const id of ['right-cross','bee-sting','butterfly-step','left-hook','clever-feint','tight-guard','brass-knuckles','best-defense'])assert.ok(existsSync(new URL(`../assets/cards/${id}-v1.png`,import.meta.url)));
assert.equal(cards.hit.name,'Правый коронный');assert.equal(cards.strike.name,'Жаль как пчела');assert.equal(cards.dodge.name,'Порхай как бабочка');
console.log('PASS: boxing payment exception, handed art assets, sequential combo/reset, combined vs separate attacks, shields/dodges, conditional draw, stance jab, vigor and enemy symmetry.');
