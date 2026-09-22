import {effectAmount,SPECIALS,BONUSES,MALUSES,specialAmount} from './catalog.mjs';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colors={red:'Красная',green:'Зелёная',blue:'Синяя',gray:'Нейтральная'};
const symbols={red:'◆',green:'▲',blue:'✦',gray:'●'};
const labels={none:'',shot:'физического урона',physical:'физического урона',magic:'магического урона',armor:'физической защиты',ward:'магической защиты',heal:'здоровья',haste:'к стоимости',dodge:'атак избежать'};
const compactEffects={shot:'Выстрел',physical:'Урон',magic:'Магия',armor:'Защита',ward:'Барьер',heal:'Лечение',haste:'Скидка',dodge:'Уклонение'};
const compactSpecials={rob:'Грабёж',draw:'Добор',haste:'Скидка',surprise:'Сюрприз',fortify:'Укрепление',leftHook:'Комбо',combo:'Добор',jab:'Джеб'};
const uniqueArt=new Set(['rob','cheap-shot','maneuver','dirty-bandages','medkit','dirty-trick','tommy-gun','oblivion','ritual-circle','disarm']);
const renamedArt={hit:'right-cross',strike:'bee-sting',dodge:'butterfly-step'};
for(const id of ['left-hook','clever-feint','tight-guard','brass-knuckles','best-defense'])uniqueArt.add(id);
export function applyCardAppearance(element,card){
 element.classList.add('material-card');
 element.dataset.rarity=card.rarity??'bronze';
 const key=card.id??card.key;
 const id=renamedArt[key]??key;
 const hasArt=uniqueArt.has(id)||Object.hasOwn(renamedArt,key);
 element.classList.toggle('unique-art',hasArt);
 if(hasArt)element.style.setProperty('--unique-art',`url("./assets/cards/${id}-v1.png")`);
 else element.style.removeProperty('--unique-art');
}
export function compactCardLabels(card,{amount=effectAmount(card),special=specialAmount(card)}={}){
 const result=[];
 if(card.effect!=='none')result.push(`${compactEffects[card.effect]??'Эффект'} ${amount}`);
 if(card.special&&card.special!=='none'&&card.special!=='fortify')result.push(`${compactSpecials[card.special]??SPECIALS[card.special]}${special?` ${special}`:''}`);
 if(card.special==='fortify')result.push(compactSpecials.fortify);
 if(card.bonus==='vigor')result.push(`Бодрость ${card.bonusAmount}`);
 if(card.bonus==='stance')result.push('Стойка');
 if(card.malus==='stun')result.push(`Оглушение ${card.malusAmount}`);
 return result.length?result:['Без эффекта'];
}
export function cardFace(card,{amount=effectAmount(card),special=specialAmount(card),state='',discount=false,compact=false}={}){
 const x=special;
 const specialText=[card.special&&card.special!=='none'?`${SPECIALS[card.special]}${card.special==='fortify'?'':' '+x}`:'',card.bonus&&card.bonus!=='none'?`${BONUSES[card.bonus]}${card.bonus==='stance'?'':' '+card.bonusAmount}`:'',card.malus&&card.malus!=='none'?`${MALUSES[card.malus]} ${card.malusAmount}`:''].filter(Boolean).join(' · ');
 const compactText=compactCardLabels(card,{amount,special}).map(label=>`<span class="card-chip">${escape(label)}</span>`).join('');
 const sign=amount<0?'−':card.effect==='heal'?'+':card.effect==='haste'?'−':'';
 const digits=String(Math.abs(amount));
 const value=`<span class="card-sign">${sign}</span><span class="card-number">${digits}</span>`;
 const detail=card.effect==='none'?'':card.effect==='shot'?'мимо уклонения':card.effect==='heal'?'до максимума':card.effect==='haste'?'остальных карт руки':card.effect==='armor'||card.effect==='ward'?'до своего хода':card.effect==='dodge'?'кроме выстрелов':'противнику';
 return `<span class="card-art" aria-hidden="true"></span><span class="card-top"><span class="cost">${card.cost}${discount?'<small class="discount" aria-label="Скидка">↓</small>':''}</span><span class="card-color" role="img" aria-label="${colors[card.color]}">${symbols[card.color]}</span></span><strong class="card-name">${escape(card.name)}</strong><span class="card-text${compact?' card-text-compact':''}">${compact?compactText:`<b class="card-value" data-digits="${digits.length}">${card.effect==='none'?'✦':value}</b><span>${card.effect==='none'?(card.special==='draw'?'Добрать '+x+' карт':card.special==='rob'?'Забрать '+x+' карт':card.special==='haste'?'Стоимость руки −'+x:card.bonus==='vigor'?'Бодрость духа':card.malus==='stun'?'Оглушение':'Без эффекта'):labels[card.effect]}<small>${card.effect==='none'&&card.special==='rob'?'из руки врага':detail}</small></span>`}</span><span class="card-special">${compact?'':escape(specialText)}</span><span class="card-state">${escape(state)}</span>`;
}
