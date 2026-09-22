import {enemyDeck} from './enemy-decks.mjs';
import {describe,effectAmount,specialAmount} from './catalog.mjs?v=20260922-street-cards-1';
import {PERKS} from './progression.mjs';
export const limit = s => Math.min(3 + s.turn - 1 + (s.handBonus||0)+(s.perk==='reserve'&&s.turn===1?1:0), s.cap);
function shuffle(cards, random) { for(let i=cards.length-1;i>0;i--) {const j=Math.floor(random()*(i+1)); [cards[i],cards[j]]=[cards[j],cards[i]];} return cards; }
function log(s, message) { s.log.unshift(message); }
function drawCards(actor,count,random){
 let drawn=0;
 while(drawn<count){
  if(!actor.deck.length){if(!actor.discard.length)break;actor.deck=shuffle(actor.discard.splice(0),random);log(actor,`${actor.name}: сброс перемешан и возвращён в колоду.`);}
  actor.hand.push(actor.deck.pop());drawn++;
 }
 return drawn;
}
function draw(s,random){
 const bonus=s.vigor||0;s.vigor=0;s.activeVigor=bonus;
 const count=drawCards(s,Math.max(0,limit(s)-s.hand.length)+bonus,random);
 log(s,`${s.name}: добор ${count}, в руке ${s.hand.length} из ${limit(s)}.${bonus?` Бодрость духа: добор увеличен на ${bonus}.`:''}`);
}
export function createGame(level=0, cap=4+level, random=Math.random, catalog, opponent=null, collection=null, handBonus=0, perk=null) {
  if(!catalog)throw Error('Не загружен файл cards.md.');
  const messages=[];
  function actor(name, collection){
    const cards=Object.fromEntries(Object.entries(catalog).map(([key,c])=>[key,{...c}]));
    const keys=collection??Object.keys(cards).flatMap(key=>Array(cards[key].copies??1).fill(key));
    if(keys.some(key=>!cards[key]))throw Error('В колоде есть неизвестная карта.');
    const deck=keys.map((key,i)=>({id:`${name}-${key}-${i}`,key}));
    return {name,cards,level,cap,turn:1,hp:10,maxHp:10,armor:0,ward:0,dodge:0,dodgeLayers:[],stunLayers:[],confusion:0,blind:0,vigor:0,activeConfusion:0,activeVigor:0,stance:0,hand:[],deck:shuffle(deck,random),discard:[],log:messages};
  }
  const s=actor('Игрок',collection);s.handBonus=handBonus?1:0;s.cap+=s.handBonus;s.status='playing';s.events=[];s.random=random;s.transferId=0;s.enemy=actor(opponent?.name || 'Страж',opponent?enemyDeck(catalog,opponent.type):null);
  if(opponent)Object.assign(s.enemy,{level:opponent.level,cap:opponent.cap,hp:opponent.hp,maxHp:opponent.hp,type:opponent.type});
  s.perk=perk;
  if(perk==='veteran'){s.enemy.maxHp=Math.floor(s.enemy.maxHp*.9);s.enemy.hp=s.enemy.maxHp;}
  draw(s,random);draw(s.enemy,random);return s;
}
export function cardInHand(s, instance) {
  const card=s.cards[instance.key];
  return {...card,cost:Math.max(0,card.cost-(instance.discount||0))};
}
export function paidEffect(s, cardId, paymentIds) {
  const instance=s.hand.find(c=>c.id===cardId);
  if(!instance)throw Error('Карта отсутствует в руке.');
  const card=cardInHand(s,instance);
  const payment=paymentIds.map(id=>s.hand.find(c=>c.id===id));
  const valid=card.cost>0&&payment.length===card.cost&&new Set(paymentIds).size===card.cost&&payment.every(c=>c&&c.id!==cardId);
  const allSame=valid&&card.color!=='gray'&&payment.every(c=>s.cards[c.key].color===card.color);
  const perkColor=PERKS.find(p=>p.id===s.perk)?.color;
  const perkMatch=valid&&card.cost>=2&&perkColor===card.color&&payment.some(c=>s.cards[c.key].color===card.color);
  const boosted=!['none','dodge'].includes(card.effect)&&(allSame||perkMatch);
  const amount=Math.floor(effectAmount(card)*(boosted?1.5:1));
  const specialBoosted=allSame&&['rob','draw','haste','surprise','confuse','leftHook','combo','jab','series'].includes(card.special)&&specialAmount(card)>0;
  const special=specialAmount(card)*(specialBoosted?2:1);
  return {amount,special,primaryBoosted:boosted,specialBoosted,boosted:boosted||specialBoosted,text:describe({...card,displayAmount:amount,paymentAmount:specialAmount(card),specialAmount:special})};
}
export const isStunned=actor=>(actor.confusion||0)+(actor.activeConfusion||0)>0;
export const isBlinded=actor=>(actor.blind||0)>0;
function damageTarget(game,target,amount,kind){
 const side=target===game?'hero':'foe';
 if(target.dodge>0&&kind!=='shot'){
  target.dodge--;const layer=target.dodgeLayers?.find(x=>x.amount>0);if(layer)layer.amount--;
  game.events.push({target:side,kind:'dodge',amount:0});return;
 }
 let remaining=amount,blocked=0;
 for(const shield of kind==='shot'?['ward','armor']:[kind==='magic'?'ward':'armor']){
  const absorbed=Math.min(target[shield],remaining);target[shield]-=absorbed;remaining-=absorbed;blocked+=absorbed;
 }
 const dealt=Math.min(target.hp,remaining);target.hp-=dealt;
 if(blocked)game.events.push({target:side,kind:'block',amount:blocked});
 if(dealt)game.events.push({target:side,kind:'damage',amount:dealt});
}
function addStun(game,source,target,amount){
 if(!amount)return;
 target.confusion=(target.confusion||0)+amount;
 (target.stunLayers??=[]).push({amount,applied:false,source:source===game?'hero':'foe',expires:source.turn+1});
}
function finishActorTurn(game,actor){
 actor.lastPlayedKey=null;
 actor.activeVigor=0;
 const source=actor===game?'hero':'foe',target=actor===game?game.enemy:game;
 target.stunLayers=(target.stunLayers||[]).filter(layer=>{
  if(layer.source!==source||layer.expires>actor.turn)return true;
  const field=layer.applied?'activeConfusion':'confusion';target[field]=Math.max(0,(target[field]||0)-layer.amount);return false;
 });
 const expired=(actor.dodgeLayers||[]).filter(x=>x.expires<=actor.turn).reduce((n,x)=>n+x.amount,0);
  actor.dodge=Math.max(0,actor.dodge-expired);
  actor.dodgeLayers=(actor.dodgeLayers||[]).filter(x=>x.expires>actor.turn&&x.amount>0);
  actor.blind=Math.max(0,(actor.blind||0)-1);
}
function startActorTurn(game,actor,random){
 if(!actor.stance)actor.armor=0;
 actor.ward=0;
 const stun=actor.confusion||0;
 // Also normalize directly supplied combat fixtures into source-bound layers.
 const represented=(actor.stunLayers||[]).filter(layer=>!layer.applied).reduce((sum,layer)=>sum+layer.amount,0);
 if(stun>represented){const source=actor===game?game.enemy:game;(actor.stunLayers??=[]).push({amount:stun-represented,applied:false,source:source===game?'hero':'foe',expires:source.turn});}
 actor.confusion=0;actor.activeConfusion=(actor.activeConfusion||0)+stun;
 for(const layer of actor.stunLayers||[])layer.applied=true;
 let discarded=0;
 while(discarded<stun&&actor.hand.length){
  const index=Math.floor(random()*actor.hand.length),[{id,key}]=actor.hand.splice(index,1);
  actor.discard.push({id,key});discarded++;
 }
 if(stun)log(actor,`${actor.name}: оглушение ${stun}, в начале хода сброшено случайных карт: ${discarded}.`);
}
function playFor(game, actor, target, cardId, paymentIds) {
  if(game.status!=='playing') throw Error('Бой уже завершён.');
  const instance=actor.hand.find(c=>c.id===cardId);
  if(!instance) throw Error('Карта отсутствует в руке.');
  const c=cardInHand(actor,instance), ids=new Set(paymentIds);
  if(isBlinded(actor)&&c.effect==='shot')throw Error('Ослепление не позволяет разыграть выстрел.');
  if(ids.size!==c.cost || paymentIds.length!==c.cost || ids.has(cardId) || [...ids].some(id=>!actor.hand.some(c=>c.id===id))) throw Error('Выберите нужное число других карт для оплаты.');
  const effect=paidEffect(actor,cardId,paymentIds);
  const comboReady=isStunned(target);
  const leftBonus=c.special==='leftHook'&&actor.lastPlayedKey==='hit'?effect.special:0;
  const seriesBonus=c.special==='series'&&actor.hand.some(x=>ids.has(x.id)&&x.key===instance.key)?effect.special:0;
  const paymentHooks=instance.key==='hit'?actor.hand.filter(x=>ids.has(x.id)&&actor.cards[x.key].special==='leftHook').map(x=>specialAmount(actor.cards[x.key])):[];
  const names=actor.hand.filter(c=>ids.has(c.id)).map(c=>actor.cards[c.key].name).join(', ');
  ids.add(cardId);
  actor.discard.push(...actor.hand.filter(c=>ids.has(c.id)).map(({id,key})=>({id,key}))); actor.hand=actor.hand.filter(c=>!ids.has(c.id));
  let outcome='';
  const surprise=c.special==='surprise'&&actor.dodge>0?effect.special:0;
  if(['physical','magic','shot'].includes(c.effect)) {
    damageTarget(game,target,effect.amount+surprise+leftBonus+seriesBonus,c.effect);
  }
  else if(c.effect==='heal') {const healed=Math.min(actor.maxHp-actor.hp,effect.amount);actor.hp+=healed;if(healed)game.events.push({target:actor===game?'hero':'foe',kind:'heal',amount:healed});outcome=`Восстановлено здоровья: ${healed}.`;}
  else if(c.effect==='haste') actor.hand.forEach(card=>{card.discount=(card.discount||0)+effect.amount;});
  else if(['armor','ward','dodge'].includes(c.effect)){
   actor[c.effect]+=effect.amount;
   if(c.effect==='dodge')(actor.dodgeLayers??=[]).push({amount:effect.amount,expires:actor.turn+1});
  }
  if(surprise&&!['physical','magic','shot'].includes(c.effect))damageTarget(game,target,surprise,'physical');
  if(c.special==='fortify'&&actor.dodge>0)actor.stance=1;
  if(c.special==='confuse')addStun(game,actor,target,effect.special);
  if(c.special==='haste')actor.hand.forEach(card=>{card.discount=(card.discount||0)+effect.special;});
  if(c.special==='jab'&&actor.stance)damageTarget(game,target,effect.special,'physical');
  if(c.special==='draw'||c.special==='combo'&&comboReady){
    const count=drawCards(actor,effect.special,game.random);outcome+=` Добрано карт: ${count}.`;
  }
  if(c.special==='rob'){
    if(!target.hand.length)outcome+=' Рука противника пуста: грабёж не дал карты.';
    for(let stolenCount=0;stolenCount<effect.special&&target.hand.length;stolenCount++){
      const index=Math.floor(game.random()*target.hand.length),[stolen]=target.hand.splice(index,1);
      actor.cards[stolen.key]={...target.cards[stolen.key]};
      actor.hand.push({...stolen,id:`stolen-${++game.transferId}`});
      outcome+=` Украдена карта «${actor.cards[stolen.key].name}».`;
    }
  }
  if(c.bonus==='vigor')actor.vigor=(actor.vigor||0)+c.bonusAmount;
  if(c.bonus==='stance')actor.stance=1;
  if(c.malus==='stun')addStun(game,actor,target,c.malusAmount);
  if(c.malus==='blind')target.blind=(target.blind||0)+c.malusAmount;
  for(const amount of paymentHooks){damageTarget(game,target,amount,'physical');outcome+=` Левый похоронный в оплате: отдельный удар ${amount} без усиления.`;}
  actor.lastPlayedKey=instance.key;
  log(game,`${actor.name} — ${c.name}${effect.primaryBoosted?' · основной эффект +50%':''}${effect.specialBoosted?' · спецэффект ×2':''}: ${effect.text} Оплата: ${names||'не требуется'}. ${outcome}`.trim());
  if(!target.hp) {game.status=target===game?'lost':'won';log(game,game.status==='won'?'Победа! Противник повержен.':'Поражение. Можно начать новый бой.');}
}
export function play(s,cardId,paymentIds){s.events=[];playFor(s,s,s.enemy,cardId,paymentIds);}
function chooseEnemyPlay(s){
  const actor=s.enemy;let best=null;
  for(const instance of actor.hand){
    const card=cardInHand(actor,instance);
    if(isBlinded(actor)&&card.effect==='shot')continue;
    const others=actor.hand.filter(c=>c.id!==instance.id);
    if(others.length<card.cost)continue;
    const value=c=>{const d=cardInHand(actor,c);return d.effect==='haste'?20:d.amount/(d.cost+1);};
    const sorted=[...others].sort((a,b)=>value(a)-value(b));
    const same=sorted.filter(c=>actor.cards[c.key].color===card.color);
    const options=[sorted.slice(0,card.cost)];
    if(card.cost>0&&same.length>=card.cost)options.push(same.slice(0,card.cost));
    for(const payment of options){
      const ids=payment.map(c=>c.id),effect=paidEffect(actor,instance.id,ids),n=effect.amount;
      let utility=0;
      if(['physical','magic','shot'].includes(card.effect)){
        const shield=card.effect==='shot'?s.ward+s.armor:card.effect==='magic'?s.ward:s.armor;
        const dodges=s.dodge&&card.effect!=='shot';
        const damage=dodges?0:Math.max(0,n-shield);
        utility=damage*3+(dodges?1:Math.min(shield,n)*.5)+(damage>=s.hp?100:0);
      }else if(card.effect==='heal')utility=Math.min(actor.maxHp-actor.hp,n)*2;
      else if(card.effect==='haste')utility=others.filter(c=>!ids.includes(c.id)).reduce((v,c)=>v+Math.min(cardInHand(actor,c).cost,n)*4,0);
      else if(card.effect==='dodge')utility=actor.dodge?0:3;
      else if(['armor','ward'].includes(card.effect))utility=Math.max(0,Math.min(n,4-actor[card.effect]));
      if(card.special==='draw')utility+=Math.min(effect.special,actor.deck.length+actor.discard.length+card.cost+1)*2;
      if(card.special==='combo'&&isStunned(s))utility+=effect.special*2;
      if(card.special==='leftHook'&&actor.lastPlayedKey==='hit')utility+=effect.special*3;
      if(card.special==='jab'&&actor.stance)utility+=effect.special*3;
      if(instance.key==='hit')utility+=payment.filter(x=>actor.cards[x.key].special==='leftHook').reduce((sum,x)=>sum+specialAmount(actor.cards[x.key])*3,0);
      if(card.special==='rob')utility+=Math.min(effect.special,s.hand.length)*3;
      if(card.special==='confuse')utility+=effect.special*1.5;
      if(card.special==='haste')utility+=others.filter(c=>!ids.includes(c.id)).reduce((v,c)=>v+Math.min(cardInHand(actor,c).cost,effect.special)*4,0);
      if(card.bonus==='vigor')utility+=card.bonusAmount*2;
      if(card.malus==='stun')utility+=card.malusAmount*1.5;
      if(card.malus==='blind')utility+=card.malusAmount*1.5;
      if(card.special==='surprise'&&actor.dodge>0)utility+=effect.special*3;
      if((card.special==='fortify'&&actor.dodge>0||card.bonus==='stance')&&!actor.stance)utility+=2;
      const score=utility/(card.cost+1)-payment.reduce((v,c)=>v+value(c)*.03,0);
      if(score>0&&(!best||score>best.score))best={cardId:instance.id,paymentIds:ids,score};
    }
  }
  return best;
}
export function* enemyTurn(s, random=Math.random) {
  s.events=[];
  if(s.status!=='playing') return;
  const enemy=s.enemy;
  finishActorTurn(s,s);
  s.turn++;draw(s,random);
  startActorTurn(s,enemy,random);
  log(s,`${enemy.name}, ход ${enemy.turn}. В руке: ${enemy.hand.length}.`);
  let actions=0,action=chooseEnemyPlay(s);
  while(action&&s.status==='playing'&&actions++<100){
    const instance=enemy.hand.find(card=>card.id===action.cardId);
    const card={...cardInHand(enemy,instance),key:instance.key};
    const effect=paidEffect(enemy,action.cardId,action.paymentIds);
    yield {phase:'reveal',card,effect};
    const eventStart=s.events.length;
    playFor(s,enemy,s,action.cardId,action.paymentIds);
    yield {phase:'effect',card,effect,events:s.events.slice(eventStart)};
    action=s.status==='playing'?chooseEnemyPlay(s):null;
  }
  if(s.status!=='playing')return;
  log(s,`${enemy.name} завершил ход. Сохранено карт: ${enemy.hand.length}.`);
  finishActorTurn(s,enemy);enemy.turn++;
  draw(enemy,random);startActorTurn(s,s,random);
}

// Synchronous consumer retained for simulations and engine tests.
export function endTurn(s,random=Math.random){for(const step of enemyTurn(s,random)){ /* consume each action */ }}
