import {positionCombatant} from './combat-layout.mjs?v=4';
import {characters} from './characters.mjs?v=4';
import {hasPlayableCard} from './turn-flow.mjs';
import {intro,encounterStory,ending,locations,encounterLocation} from './story.mjs?v=20260921-port-enemies-1';
import {starterDeck,createReward,previewReward,confirmReward,rewardResolved} from './rewards.mjs?v=progression-2';
import {createCampaign,currentOpponent,advanceCampaign} from './campaign.mjs?v=20260921-swing-5';
import {createGame,play,enemyTurn,limit,paidEffect,cardInHand} from './engine.mjs';
import {parseCardsMarkdown,RARITIES,describeParts,effectAmount} from './catalog.mjs?v=20260922-preview-1';
import {cardFace,applyCardAppearance} from './card-face.mjs?v=20260921-new-art-1';
import {createSound} from './audio.mjs';
import {renderStatuses} from './statuses.mjs';
import {PERKS,newProgress,creditVictory,needsPerk,choosePerk,perkChoices,XP_THRESHOLDS} from './progression.mjs';
const boostLabel=e=>[e.primaryBoosted?"Эффект +50%":"",e.specialBoosted?"Спецэффект ×2":""].filter(Boolean).join(" · ");
const sound=createSound();
document.addEventListener('pointerdown',()=>sound.unlock(),{capture:true});
document.addEventListener('keydown',()=>sound.unlock(),{capture:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)sound.stop();});
async function loadCatalog(){
 const response=await fetch('./cards.md',{cache:'no-store'});
 if(!response.ok)throw Error(`Файл cards.md недоступен (${response.status}).`);
 return parseCardsMarkdown(await response.text());
}
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
function renderSound(){const button=$('sound');button.textContent=sound.enabled?'Звук: вкл.':'Звук: выкл.';button.setAttribute('aria-pressed',String(sound.enabled));$('settings-sound').checked=sound.enabled;}
$('sound').onclick=()=>{sound.toggle();renderSound();};renderSound();
$('settings-sound').onchange=()=>{if($('settings-sound').checked!==sound.enabled)sound.toggle();renderSound();};
const settingsDrawer=$('settings-drawer');
$('settings-open').onclick=()=>{settingsDrawer.showModal();$('settings-open').setAttribute('aria-expanded','true');};
$('settings-close').onclick=()=>settingsDrawer.close();
settingsDrawer.addEventListener('close',()=>{$('settings-open').setAttribute('aria-expanded','false');$('settings-open').focus();});
settingsDrawer.addEventListener('click',event=>{if(event.target===settingsDrawer){const r=settingsDrawer.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)settingsDrawer.close();}});
function setCardSize(value){
 const size=Math.min(120,Math.max(80,Number(value)||100));
 document.documentElement.style.setProperty('--card-scale',size/100);
 $('card-size').value=size;$('card-size-value').value=size+'%';
 $('card-size').setAttribute('aria-valuetext',size+' процентов');
}
let savedCardSize=100;
try{savedCardSize=localStorage.getItem('cardgame.cardSize')||100;}catch{}
setCardSize(savedCardSize);
$('card-size').addEventListener('input',event=>{setCardSize(event.target.value);try{localStorage.setItem('cardgame.cardSize',event.target.value);}catch{}});

function soundAction(card,events){
 sound.play(card.effect==='shot'?'physical':card.effect);
 events.forEach((event,index)=>{if(event.kind!==card.effect)sound.play(event.kind,.12+index*.35);});
 if(state.status!=='playing')sound.play(state.status,.4+events.length*.35);
}
let selectedCharacter=characters[0];
let campaign=null, loading=false, catalog=null, collection=[], reward=null;
let progress=newProgress(),pendingPerk=null,lastGain=null;
let state=null, selected=null, payment=new Set(), enemyBusy=false;
let autoEndTimer=null;
let touchPreviewId=null,lastPointerType='mouse';
const cardBannerByColor={
 red:'./assets/card-banners/strength-v1.png',
 green:'./assets/card-banners/agility-v1.png',
 blue:'./assets/card-banners/intellect-v2.png',
 gray:'./assets/card-banners/universal-v1.png'
};
function showCardPreview(instance,card,effect){
 if(enemyBusy)return;
 const host=$('card-preview-card'),face=document.createElement('div'),banner=document.createElement('img');
 face.className=`card-preview-art material-card ${card.color}`;applyCardAppearance(face,card);
 const artIndex=artKeys.includes(instance.key)?artKeys.indexOf(instance.key):effectArt[card.effect];
 face.style.setProperty('--art-x',`${artIndex%5*25}%`);face.style.setProperty('--art-y',artIndex<5?'0%':'100%');
 face.innerHTML='<span class="card-art" aria-hidden="true"></span>';
 banner.className='card-preview-banner';banner.src=cardBannerByColor[card.color]??cardBannerByColor.gray;banner.alt='';banner.setAttribute('aria-hidden','true');
 host.replaceChildren(face,banner);
 $('card-preview-name').textContent=card.name;
 $('card-preview-meta').textContent=`${colors[card.color]} · ${RARITIES[card.rarity]}`;
 $('card-preview-price').textContent=`Стоимость: ${card.cost}`;
 const described={...card,displayAmount:effect?.amount??effectAmount(card),specialAmount:effect?.special??card.specialAmount};
 $('card-preview-description').replaceChildren(...describeParts(described).map(part=>{
  const row=document.createElement('section');row.className=`card-preview-effect ${part.kind}`;
  const title=document.createElement('h3');title.textContent=part.title;
  const body=document.createElement('p');body.textContent=part.text;
  row.append(title,body);return row;
 }));
 $('card-preview').hidden=false;
}
function hideCardPreview(force=false){if(touchPreviewId&&!force)return;$('card-preview').hidden=true;$('card-preview-card').replaceChildren();}
$('card-preview-close').onclick=()=>{touchPreviewId=null;hideCardPreview(true);};

const TUTORIAL_KEY='cardgame.tutorial.v1';
const tutorialSteps={
 select:{title:'Выберите карту',text:'Нажмите карту в руке. На телефоне первое касание откроет её описание, второе — выберет.',target:'hand'},
 payment:{title:'Оплатите розыгрыш',text:'Стоимость в левом верхнем углу — сколько других карт нужно выбрать в оплату.',target:'hand'},
 boost:{title:'Усиление цветом',text:'Если вся оплата того же цвета, основной эффект станет сильнее. Светлое свечение показывает усиленную карту.',target:'payment-status'},
 play:{title:'Разыграйте',text:'Когда оплата собрана, нажмите «Разыграть». Сыгранная карта и оплата уйдут в сброс.',target:'play'},
 end:{title:'Передайте ход',text:'Когда закончите разыгрывать карты, передайте ход. Противник ответит, затем вы доберёте руку.',target:'end'},
 reward:{title:'Награда за победу',text:'Выберите одну карту и подтвердите выбор. Она сразу войдёт в колоду, а история продолжится без лишней кнопки.',target:'reward'}
};
const tutorialOrder=['select','payment','boost','play','end','reward'];
let tutorialActive=true,tutorialStep='select';
try{tutorialActive=localStorage.getItem(TUTORIAL_KEY)!=='done';}catch{}
function finishTutorial(){tutorialActive=false;document.querySelectorAll('.tutorial-target').forEach(node=>node.classList.remove('tutorial-target'));$('tutorial').hidden=true;try{localStorage.setItem(TUTORIAL_KEY,'done');}catch{}}
function renderTutorial(){
 document.querySelectorAll('.tutorial-target').forEach(node=>node.classList.remove('tutorial-target'));
 const step=tutorialSteps[tutorialStep],target=step?$(step.target):null;
 if(!tutorialActive||document.body.dataset.screen!=='combat'||!step||!target||target.hidden){$('tutorial').hidden=true;return;}
 target.classList.add('tutorial-target');$('tutorial-progress').textContent=`Обучение · ${tutorialOrder.indexOf(tutorialStep)+1} / ${tutorialOrder.length}`;
 $('tutorial-title').textContent=step.title;$('tutorial-text').textContent=step.text;$('tutorial-next').textContent=tutorialStep==='reward'?'Готово':'Дальше';$('tutorial').hidden=false;
}
function tutorialAdvance(next){if(!tutorialActive)return;tutorialStep=next;if(next==='reward-wait'){$('tutorial').hidden=true;return;}renderTutorial();}
$('tutorial-skip').onclick=finishTutorial;
$('tutorial-next').onclick=()=>{const index=tutorialOrder.indexOf(tutorialStep);if(index<0||tutorialStep==='reward')finishTutorial();else tutorialAdvance(tutorialOrder[index+1]);};
$('tutorial-start').onclick=()=>{tutorialActive=true;tutorialStep='select';try{localStorage.removeItem(TUTORIAL_KEY);}catch{}settingsDrawer.close();renderTutorial();};
function cancelAutoEnd(){clearTimeout(autoEndTimer);autoEndTimer=null;}
function scheduleAutoEnd(){
 cancelAutoEnd();
 if(state.status!=='playing'||enemyBusy||hasPlayableCard(state))return;
 const currentState=state;
 $('hint').textContent='Нет доступных карт. Ход завершается…';
 autoEndTimer=setTimeout(()=>{autoEndTimer=null;if(state===currentState&&state.status==='playing'&&!enemyBusy&&!hasPlayableCard(state))runEnemyTurn();},1000);
}
const artKeys=['hit','guard','strike','dodge','shot','haste','spark','ward','fireball','heal'];
const effectArt={none:5,shot:4,physical:0,armor:1,dodge:3,haste:5,magic:6,ward:7,heal:9};
const effectIcons={physical:'✷',armor:'⛨',dodge:'➶',haste:'»',magic:'✧',ward:'◈',heal:'✚'};
const colors={red:'Сила',green:'Ловкость',blue:'Интеллект',gray:'Универсальная'};
function applyEncounterVisuals(){
 const opponent=currentOpponent(campaign);
 const location=encounterLocation(campaign);
 document.querySelector('.fighters').style.setProperty('--scene-image',`url("${location.art}")`);
 document.querySelector('.table').style.setProperty('--scene-image',`url("${location.art}")`);
 $('foe-caption').textContent=opponent.name;
 $('hero-caption').textContent=selectedCharacter.name;
 $('debug-hero-name').textContent=selectedCharacter.name;
 document.querySelector('.hero-id').setAttribute('aria-label',`Показатели: ${selectedCharacter.name}`);
 $('hero-health-track').setAttribute('aria-label',`Здоровье: ${selectedCharacter.name}`);
 $('hero-statuses').setAttribute('aria-label',`Защита: ${selectedCharacter.name}`);
 $('scene-name').textContent=`${location.name} · ${campaign.index+1} / ${campaign.queue.length}`;
 positionCombatant($('hero-art'),selectedCharacter.id);
 positionCombatant($('enemy-art'),opponent.id);
 $('hero-art').src=selectedCharacter.art;$('hero-art').alt=selectedCharacter.name;
 $('enemy-art').style.visibility='hidden';
 $('enemy-art').onload=()=>{$('enemy-art').style.visibility='visible';};
 $('enemy-art').onerror=()=>{$('enemy-art').style.visibility='hidden';};
 $('enemy-art').src=opponent.art;$('enemy-art').alt=opponent.description;
 $('enemy-name').textContent=opponent.name;
 document.querySelector('.foe-id').setAttribute('aria-label',`Показатели: ${opponent.name}`);
 $('foe-health-track').setAttribute('aria-label',`Здоровье: ${opponent.name}`);
 $('foe-statuses').setAttribute('aria-label',`Защита: ${opponent.name}`);
 $('opponent-info').textContent=`Бой ${campaign.index+1}/${campaign.queue.length} · ${opponent.name} · ${opponent.type} · Уровень ${opponent.level} · Макс. рука ${opponent.cap} · Колода: ${state.enemy.deck.length+state.enemy.hand.length+state.enemy.discard.length} карт`;
 $('opponent-info').title=opponent.description;
}
let viewMode='player';
try {if(localStorage.getItem('cardgame.view')==='debug')viewMode='debug';}catch{}
function setView(mode){
  viewMode=mode;document.body.dataset.view=mode;
  $('view-player').setAttribute('aria-pressed',String(mode==='player'));
  $('view-debug').setAttribute('aria-pressed',String(mode==='debug'));
  try {localStorage.setItem('cardgame.view',mode);}catch{}
}
$('view-player').onclick=()=>{setView('player');render();sound.play('click');};
$('view-debug').onclick=()=>{setView('debug');render();sound.play('click');};
setView(viewMode);

function clear(){selected=null;payment.clear();}
const statusIcon=(key,side)=>key==='confusion'?'<span aria-hidden="true">?</span>':key==='armor'?`<svg viewBox="0 0 28 30" aria-hidden="true"><defs><linearGradient id="steel-${side}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f0f1ed"/><stop offset=".38" stop-color="#aab4ba"/><stop offset=".58" stop-color="#dde1de"/><stop offset="1" stop-color="#596771"/></linearGradient></defs><path d="M14 2 25 6v8c0 7-6 12-11 14C9 26 3 21 3 14V6Z" fill="url(#steel-${side})" stroke="#d5dddc"/><path d="m14 5 8 3v6c0 5-4 9-8 11-4-2-8-6-8-11V8Z" fill="none" stroke="#586772"/><path d="M14 5v20" stroke="#eef3ee" opacity=".6"/></svg>`:key==='ward'?`<svg viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="13" stroke="#abcdda"/><path d="m15 4 6.5 20L4.5 11.5h21L8.5 24Z" fill="none" stroke="#cee8f1" stroke-width="1.5"/></svg>`:'<span aria-hidden="true">➶</span>';
const statusNames={armor:'Физическая защита',ward:'Магическая защита',dodge:'Уклонение',confusion:'Оглушение'};
function renderHud(){
 const foeHand=$('foe-hand');
 const handCount=state.enemy.hand.length;
 foeHand.setAttribute('aria-label',`Карт в руке противника: ${handCount}`);
 foeHand.title=`Карт в руке противника: ${handCount}`;
 foeHand.replaceChildren(...Array.from({length:handCount},()=>{
  const back=document.createElement('span');
  back.className='foe-hand-card';back.setAttribute('aria-hidden','true');
  return back;
 }));
 for(const [side,actor] of [['hero',state],['foe',state.enemy]]){
  const conditions=$(side+'-conditions');
  const health=$(side+'-health');
  health.innerHTML=`<i aria-hidden="true">♥</i><span>${actor.hp}</span><span class="hp-max">/ ${actor.maxHp}</span>`;
  const track=$(side+'-health-track');
  track.setAttribute('aria-valuemax',String(actor.maxHp));track.setAttribute('aria-valuenow',String(actor.hp));
  track.querySelector('.health-fill').style.width=`${Math.max(0,Math.min(100,actor.hp/actor.maxHp*100))}%`;
  health.setAttribute('aria-label',`${side==='hero'?'Ваше здоровье':'Здоровье противника'}: ${actor.hp} из ${actor.maxHp}`);

  $(side+'-statuses').replaceChildren(...['armor','ward','dodge'].filter(key=>['armor','ward'].includes(key)||actor[key]>0).map(key=>{
   const badge=document.createElement('span');badge.className=`stat ${key}${actor[key]===0?' is-zero':''}`;
   badge.tabIndex=0;badge.setAttribute('role','img');badge.setAttribute('aria-label',`${statusNames[key]}: ${actor[key]}`);
   badge.dataset.tooltip=`${statusNames[key]}: ${actor[key]}`;
   badge.innerHTML=`${statusIcon(key,side)}<b aria-hidden="true">${actor[key]}</b>`;
   return badge;
  }));
  renderStatuses(conditions,actor);
  $(side+'-statuses').append(conditions);
 }
}
function showCombatEffects(events=state.events||[]){
 $('combat-announcement').textContent=events.map(e=>`${e.target==='hero'?'Вы':'Противник'}: ${e.kind==='damage'?'урон':e.kind==='heal'?'лечение':e.kind==='block'?'блок':'уклонение'} ${e.amount||''}`).join('. ');
 events.forEach((event,index)=>{
  const item=document.createElement('span');item.className=`combat-float ${event.target}-effect effect-${event.kind}`;
  item.textContent=event.kind==='damage'?`−${event.amount}`:event.kind==='heal'?`+${event.amount}`:event.kind==='block'?`Блок · ${event.amount}`:'Уклонение';
  item.style.animationDelay=`${index*350}ms`;
  item.addEventListener('animationend',()=>item.remove(),{once:true});
  $('combat-effects').append(item);
 });
}
function renderReward(){
 const visible=state.status==='won'&&!enemyBusy;
 if(visible&&!reward){
  lastGain=creditVictory(progress,campaign.index,currentOpponent(campaign).xp);
  state.level=progress.level;state.cap=4+state.level+(state.handBonus||0);
  reward=createReward(catalog);
 }
 $('reward').hidden=!visible;
 if(!visible){$('result').after($('replay'));return;}
 if(tutorialActive&&tutorialStep==='reward-wait')tutorialStep='reward';
 $('reward').append($('replay'));
 $('reward-progress').textContent=`+${lastGain?.gained||0} опыта · Всего ${progress.xp} · Уровень ${progress.level}${lastGain?.levelUp?' — новый уровень!':''}`;
 $('confirm-reward').hidden=rewardResolved(reward);
 $('confirm-reward').disabled=!reward.pending;
 $('confirm-reward').textContent=reward.pending==='skip'?'Подтвердить отказ':'Подтвердить выбор';
 $('skip-reward').setAttribute('aria-pressed',String(reward.pending==='skip'));
 const last=campaign.index===campaign.queue.length-1;
 $('skip-reward').hidden=rewardResolved(reward);
 $('skip-reward').textContent=last?'Отказаться от награды':'Отказаться · +1 к размеру руки на следующий бой';
 $('reward-title').textContent=reward.skipped?(last?'Приключение завершено. Награда пропущена.':'Награда пропущена. Размер руки увеличен на 1 на весь следующий бой.') : reward.selected?`Карта «${catalog[reward.selected].name}» добавлена. В колоде ${collection.length} карт.`:(campaign.index===campaign.queue.length-1?`Все ${campaign.queue.length} боёв пройдены! Выберите последнюю награду`:'Победа! Выберите одну карту в колоду');
 $('reward-cards').replaceChildren(...reward.choices.map(key=>{
  const card=catalog[key],button=document.createElement('button');
  button.className=`card ${card.color}`;applyCardAppearance(button,card);
  button.disabled=rewardResolved(reward);
  button.classList.toggle('pending-reward',reward.pending===key&&!rewardResolved(reward));
  button.setAttribute('aria-pressed',String(reward.pending===key));
  button.setAttribute('aria-label',`${card.name}. ${card.text}. Добавить в колоду`);
  button.title=card.text;
  const index=artKeys.includes(key)?artKeys.indexOf(key):(effectArt[card.effect]??0);
  button.style.setProperty('--art-x',`${index%5*25}%`);button.style.setProperty('--art-y',index<5?'0%':'100%');
  button.innerHTML=cardFace(card,{state:reward.selected===key?'Добавлена в колоду':reward.pending===key?'Выбрана · подтвердите':'Выбрать награду'});
  button.onclick=()=>{previewReward(reward,key);sound.play('select');render();};
  return button;
 }));
 renderPerks();
 renderTutorial();
}
function renderPerks(){
 $('perk-choice').hidden=!needsPerk(progress);
 if(!needsPerk(progress))return;
 $('perk-options').replaceChildren(...perkChoices(progress).map(perk=>{
  const button=document.createElement('button');button.type='button';button.className='perk-option';
  button.setAttribute('aria-pressed',String(pendingPerk===perk.id));
  const name=document.createElement('strong'),description=document.createElement('span');name.textContent=perk.name;description.textContent=perk.description;
  button.append(name,description);button.onclick=()=>{pendingPerk=perk.id;renderPerks();};return button;
 }));
 $('confirm-perk').disabled=!pendingPerk;
}
function render(){
  document.querySelector('.table').hidden=!state;
  if(!state)return;
  if(state.status==='lost'&&!enemyBusy){cancelAutoEnd();if(storyPhase!=='defeat')showStory({label:'Приключение окончено',title:'Расследование прервано',text:'След обрывается здесь. Начните новое расследование с первого противника и стартовой колоды.',button:'Начать заново'},'defeat');return;}
  renderReward();renderHud();
  const next=XP_THRESHOLDS[progress.level+1];
  $('adventure-progress').textContent=`Уровень ${progress.level} · Опыт ${progress.xp}${next?` / ${next}`:''}${progress.perk?' · '+PERKS.find(p=>p.id===progress.perk).name:''}`;
  document.querySelector('.table').classList.toggle('has-selection',Boolean(selected));
  $('turn').textContent=`Ход ${state.turn}`;
  $('turn-phase').textContent=state.status!=='playing'?'Бой завершён':enemyBusy?'Ход противника':'Ваш ход';
  $('player-deck-count').textContent=state.deck.length;$('player-discard-count').textContent=state.discard.length;$('level-label').textContent=`Уровень ${state.level}`;
  $('hp').textContent=`${state.hp} / ${state.maxHp}`;$('hp-meter').max=state.maxHp;$('hp-meter').value=state.hp;
  $('enemy-hp').textContent=`${state.enemy.hp} / ${state.enemy.maxHp}`;$('enemy-meter').max=state.enemy.maxHp;$('enemy-meter').value=state.enemy.hp;
  $('defenses').textContent=`Физ. защита ${state.armor} · Маг. защита ${state.ward} · Уклонение ${state.dodge} · Оглушение ${state.confusion}`;
  $('intent').textContent=state.status==='playing'?`Физ. защита ${state.enemy.armor} · Маг. защита ${state.enemy.ward} · Уклонение ${state.enemy.dodge} · Оглушение ${state.enemy.confusion}`:'Бой завершён';
  $('enemy-piles').textContent=`Рука: ${state.enemy.hand.length} · Колода: ${state.enemy.deck.length} · Сброс: ${state.enemy.discard.length}`;
  $('hand-count').textContent=`${state.hand.length} / ${limit(state)}`;$('deck-count').textContent=`Колода: ${state.deck.length}`;$('discard-count').textContent=`Сброс: ${state.discard.length}`;
  const card=selected?cardInHand(state,state.hand.find(c=>c.id===selected)):null;
  $('hint').textContent=card?(card.cost===0?'Бесплатная карта':`Выберите ${card.cost} ${card.cost===1?'карту':'карты'} для оплаты`):enemyBusy?'Ход противника':'Выберите карту';
  const effect=card?paidEffect(state,selected,[...payment]):null;
  $('hand').dataset.count=String(Math.min(state.hand.length,5));
  $('hand').style.setProperty('--hand-count',String(state.hand.length));
  $('hand').replaceChildren(...state.hand.map(instance=>{
    const c=cardInHand(state,instance), button=document.createElement('button');
    button.className=`card ${c.color}${selected===instance.id?' selected':''}${payment.has(instance.id)?' paying':''}`;
    button.disabled=enemyBusy||state.status!=='playing'||(!selected&&state.hand.length<c.cost+1);
    button.setAttribute('aria-pressed',String(selected===instance.id||payment.has(instance.id)));
    button.setAttribute('aria-label',`${c.name}, ${colors[c.color]}, стоимость ${c.cost}. ${selected===instance.id?effect.text:c.text}${payment.has(instance.id)?', в оплату':''}`);
    const artIndex=artKeys.includes(instance.key)?artKeys.indexOf(instance.key):effectArt[c.effect];
    button.style.setProperty('--art-x',`${artIndex%5*25}%`);
    button.style.setProperty('--art-y',artIndex<5?'0%':'100%');
    button.title=selected===instance.id?effect.text:c.text;
    const badge=selected===instance.id?'Разыграть':payment.has(instance.id)?'✓ В оплату':selected?'Выбрать в оплату':state.hand.length<c.cost+1?'Не хватает карт':'Выбрать карту';
    applyCardAppearance(button,c);
    button.classList.toggle('empowered',selected===instance.id&&effect.boosted);
    button.innerHTML=cardFace(c,{amount:selected===instance.id?effect.amount:effectAmount(c),special:selected===instance.id?effect.special:undefined,state:badge==='Выбрать карту'?'':badge,discount:instance.discount,compact:true});
    const previewEffect=()=>selected===instance.id?paidEffect(state,selected,[...payment]):null;
    button.onpointerdown=event=>{lastPointerType=event.pointerType;};
    button.onmouseenter=()=>{if(lastPointerType!=='touch')showCardPreview(instance,c,previewEffect());};
    button.onmouseleave=()=>{if(lastPointerType!=='touch')hideCardPreview();};
    button.onfocus=()=>showCardPreview(instance,c,previewEffect());
    button.onblur=()=>{if(lastPointerType!=='touch')hideCardPreview();};
    button.onclick=()=>{
     if(lastPointerType==='touch'&&touchPreviewId!==instance.id){touchPreviewId=instance.id;showCardPreview(instance,c,previewEffect());return;}
     touchPreviewId=null;hideCardPreview(true);
     if(selected===instance.id){clear();sound.play('cancel');}
     else if(selected){if(payment.has(instance.id)){payment.delete(instance.id);sound.play('cancel');}else if(payment.size<card.cost){payment.add(instance.id);sound.play(paidEffect(state,selected,[...payment]).boosted?'boost':'pay');if(tutorialStep==='payment')tutorialAdvance('boost');}else sound.play('error');}
     else {selected=instance.id;sound.play('select');if(tutorialStep==='select')tutorialAdvance(c.cost===0?'play':'payment');}
     render();
    };return button;
  }));
  $('payment-status').textContent=card?`Оплата: ${payment.size} из ${card.cost}${effect.boosted?' · '+boostLabel(effect):payment.size===card.cost?' · Обычный эффект':''}`:'Карты в руке — ваш ресурс';
  $('payment-status').classList.toggle('boosted',Boolean(effect?.boosted));
  $('cancel').hidden=!selected;$('play').disabled=enemyBusy||!card||payment.size!==card.cost||state.status!=='playing';
  $('replay').hidden=enemyBusy||state.status==='playing'||(state.status==='won'&&(!rewardResolved(reward)||needsPerk(progress)));
  $('end').disabled=enemyBusy||state.status!=='playing';$('result').hidden=enemyBusy||state.status!=='lost';
  const last=campaign.index===campaign.queue.length-1;
  $('replay').textContent=state.status==='lost'?'Начать заново':last?'Завершить расследование':'Продолжить расследование';
  $('result').textContent=state.status==='won'?(last?`Магистр ордена повержен. Все ${campaign.queue.length} боёв пройдены!`:reward?.selected?'Награда получена. Можно перейти к следующему противнику.':'Выберите награду, чтобы продолжить.'):'Расследование прервано. Начните приключение заново.';
  $('log').replaceChildren(...state.log.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
  renderTutorial();
}
async function reset(mode='restart'){
 if(enemyBusy||loading)return;
 if(mode==='continue'&&state?.status==='won'&&(!rewardResolved(reward)||needsPerk(progress)))return;
 cancelAutoEnd();loading=true;$('replay').disabled=true;
 $('settings-error').textContent='';$('reset').disabled=true;$('apply').disabled=true;
 try {const restart=mode!=='continue'||state?.status==='lost'||(state.status==='won'&&campaign.index===campaign.queue.length-1);const nextCampaign=restart?createCampaign():advanceCampaign(campaign,state.status);const nextCatalog=restart?await loadCatalog():catalog;const nextCollection=restart?starterDeck(nextCatalog):collection;const nextBonus=restart?0:reward.skipped?1:0;const nextProgress=restart?newProgress():progress;const next=createGame(nextProgress.level,4+nextProgress.level,Math.random,nextCatalog,currentOpponent(nextCampaign),nextCollection,nextBonus,nextProgress.perk);sound.stop();catalog=nextCatalog;collection=nextCollection;reward=null;campaign=nextCampaign;progress=nextProgress;pendingPerk=null;lastGain=null;state=next;applyEncounterVisuals();sound.play('draw');$('combat-effects').replaceChildren();$('combat-announcement').textContent='';clear();$('catalog-warning').textContent='';render();showStory(restart?{...intro,text:intro.text.replace('Вы — Искатель, частный следователь.',selectedCharacter.intro)}:encounterStory(campaign),restart?'intro':'encounter');}
 catch(error){sound.play('error');$('story-error').textContent='Не удалось загрузить игру. Попробуйте ещё раз.';$('character-error').textContent='Не удалось начать игру: '+error.message;$('catalog-warning').textContent='Не удалось начать бой: '+error.message+' Исправьте cards.md и нажмите «Новый бой».';}
 finally {loading=false;$('replay').disabled=false;$('reset').disabled=false;$('apply').disabled=false;}
}
$('skip-reward').onclick=()=>{if(state?.status!=='won'||rewardResolved(reward))return;previewReward(reward,'skip');sound.play('select');render();};
async function continueAfterProgression(){
 if(needsPerk(progress)){$('perk-options').querySelector('button')?.focus();return;}
 if(tutorialStep==='reward')finishTutorial();
 if(campaign.index===campaign.queue.length-1)showStory(ending,'ending');else await reset('continue');
}
$('confirm-reward').onclick=async()=>{if(state?.status!=='won'||rewardResolved(reward)||!reward.pending)return;collection=confirmReward(collection,reward);sound.play('select');render();await continueAfterProgression();};
$('confirm-perk').onclick=async()=>{if(!pendingPerk||!needsPerk(progress))return;choosePerk(progress,pendingPerk);pendingPerk=null;render();if(rewardResolved(reward))await continueAfterProgression();};
$('replay').onclick=()=>{if(state?.status==='won'&&campaign.index===campaign.queue.length-1)showStory(ending,'ending');else reset('continue');};$('apply').onclick=()=>reset();$('reset').onclick=()=>showCharacterSelect();$('cancel').onclick=()=>{clear();sound.play('cancel');render();};
$('play').onclick=()=>{const card=cardInHand(state,state.hand.find(c=>c.id===selected));play(state,selected,[...payment]);soundAction(card,state.events);clear();if(['select','payment','boost','play'].includes(tutorialStep))tutorialAdvance('end');render();showCombatEffects();scheduleAutoEnd();};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function revealEnemyCard(card,effect){
 const face=document.createElement('article');face.className=`card ${card.color} enemy-showcase`;
 face.setAttribute('aria-label',`${card.name}. ${effect.text}`);
 const artIndex=artKeys.includes(card.key)?artKeys.indexOf(card.key):effectArt[card.effect];
 face.style.setProperty('--art-x',`${artIndex%5*25}%`);face.style.setProperty('--art-y',artIndex<5?'0%':'100%');
 applyCardAppearance(face,card);
 face.classList.toggle('empowered',effect.boosted);
 face.innerHTML=cardFace(card,{amount:effect.amount,special:effect.special,state:effect.boosted?boostLabel(effect):'Карта противника'});
 $('enemy-card-slot').replaceChildren(face);
 $('enemy-effect-label').textContent='';
}
async function runEnemyTurn(){
 if(enemyBusy||!state||state.status!=='playing')return;
 cancelAutoEnd();touchPreviewId=null;hideCardPreview(true);enemyBusy=true;sound.play('turn');clear();if(tutorialStep==='end')tutorialAdvance('reward-wait');$('combat-effects').replaceChildren();
 $('reset').disabled=true;$('apply').disabled=true;
 $('enemy-turn-label').textContent=`Ходит ${$('enemy-name').textContent}`;
 $('enemy-play').hidden=false;render();
 try{
  let played=false;
  for(const step of enemyTurn(state)){
   if(step.phase==='reveal'){
    played=true;sound.play('select');revealEnemyCard(step.card,step.effect);render();
    await pause(1100);
   }else{
    render();showCombatEffects(step.events);soundAction(step.card,step.events);
    $('enemy-effect-label').textContent=step.events.length?step.events.map(e=>e.kind==='damage'?`Вам −${e.amount} здоровья`:e.kind==='heal'?`Противнику +${e.amount} здоровья`:e.kind==='block'?`Заблокировано: ${e.amount}`:'Вы уклонились').join(' · '):step.effect.text;
    await pause(1800+Math.max(0,step.events.length-1)*350);
    $('enemy-card-slot').replaceChildren();$('enemy-effect-label').textContent='';
    await pause(200);
   }
  }
  if(!played){$('enemy-effect-label').textContent='Противник завершает ход';await pause(900);}
 }finally{
  if(state.status==='playing'){sound.play('ready');sound.play('draw',.2);}
  enemyBusy=false;$('enemy-play').hidden=true;$('enemy-card-slot').replaceChildren();
  $('reset').disabled=false;$('apply').disabled=false;render();
 }
}
let storyPhase='title';
function setScreen(screen){
 document.body.dataset.screen=screen;
 $('story-screen').hidden=screen==='combat'||screen==='characters';
 $('character-screen').hidden=screen!=='characters';
 document.querySelector('main').inert=screen!=='combat';
 document.querySelector('header').inert=screen!=='combat';
 renderTutorial();
}
function showStory(scene,phase){
 storyPhase=phase;setScreen(phase==='defeat'?'defeat':'story');
 const location=phase==='defeat'?{name:'Расследование прервано',art:'./assets/hero-defeated.png'}:phase==='encounter'?encounterLocation(campaign):locations.docks;
 $('story-screen').style.setProperty('--story-image',`url("${location.art}")`);
 document.querySelector('.story-footer').textContent=phase==='title'?'ПРИКЛЮЧЕНИЯ ПО ТУ СТОРОНУ ПРИВЫЧНОГО':location.name;

 $('story-label').textContent=scene.label;$('story-title').textContent=scene.title;
 $('story-text').textContent=scene.text;$('story-next').textContent=scene.button;
 $('story-error').textContent='';$('story-title').focus();
}
function showTitle(){
 showStory({label:'КАРТОЧНЫЕ ПРИКЛЮЧЕНИЯ',title:'За гранью',text:'Разные миры. Новые противники. Ваша колода.\nПервое приключение: Дело № 13 — Тихая гавань.',button:'Начать игру'},'title');
 setScreen('title');
}
$('story-next').onclick=async()=>{
 if(loading)return;
 sound.play('click');
 if(storyPhase==='title'||storyPhase==='defeat'){
  showCharacterSelect();
 }else if(storyPhase==='intro')showStory(encounterStory(campaign),'encounter');
 else if(storyPhase==='ending')showTitle();
 else {setScreen('combat');sound.play('draw');$('end').focus();}
};
function renderCharacters(){
 $('character-options').replaceChildren(...characters.map(character=>{
  const button=document.createElement('button');button.type='button';button.className='character-option '+character.color;
  button.disabled=Boolean(character.locked);
  button.setAttribute('aria-pressed',String(character.id===selectedCharacter.id));
  if(character.locked)button.setAttribute('aria-label',character.name+' — скоро, пока недоступен');
  button.innerHTML=`<img src="./assets/characters/${character.id}-cutout-v2.png" alt=""/><span class="character-copy"><strong>${character.name}</strong><span class="character-affinity">${character.locked?'Скоро':character.affinity}</span></span>`;
  button.onclick=()=>{if(character.locked)return;selectedCharacter=character;renderCharacters();$('character-options').children[characters.indexOf(character)].focus();sound.play('select');};return button;
 }));
 const names={investigator:'Искателя',thief:'Воровку',professor:'Профессора'};
 $('character-start').textContent='Начать за '+names[selectedCharacter.id];
}
function showCharacterSelect(){
 if(enemyBusy||loading)return;
 cancelAutoEnd();sound.stop();clear();renderCharacters();setScreen('characters');$('character-error').textContent='';$('character-title').focus();
}
$('character-back').onclick=showTitle;
$('character-start').onclick=async()=>{
 if(loading||selectedCharacter.locked)return;
 $('character-start').disabled=true;$('character-back').disabled=true;$('character-options').inert=true;
 try{await reset();}finally{$('character-start').disabled=false;$('character-back').disabled=false;$('character-options').inert=false;}
};
$('end').onclick=runEnemyTurn;render();setScreen('title');
