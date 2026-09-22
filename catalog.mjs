export const RARITIES={bronze:'Бронзовая',silver:'Серебряная',gold:'Золотая',purple:'Фиолетовая',diamond:'Алмазная'};
export const EFFECTS={physical:'Физическая атака',magic:'Магическая атака',armor:'Физическая защита',ward:'Магическая защита',heal:'Лечение',dodge:'Уклонение',haste:'Снижение стоимости',shot:'Выстрел',none:'Нет'};
export const SPECIALS={none:'Нет',rob:'Грабёж',confuse:'Оглушение',cheap:'Пониженная стоимость',draw:'Добор',haste:'Снижение стоимости',surprise:'Неожиданный удар',fortify:'Укрепление',leftHook:'Левый похоронный',combo:'Комбинация',jab:'Джеб',series:'Серия'};
export const BONUSES={none:'Нет',vigor:'Бодрость духа',stance:'Оборонительная стойка'};
export const MALUSES={none:'Нет',stun:'Оглушение',blind:'Ослепление'};
export const specialAmount=c=>c.specialAmount??(c.special==='draw'?2:c.special==='none'?0:1);
export function effectAmount(c){return c.amount;}
export function describeParts(c){
 const n=c.displayAmount??effectAmount(c);
 const primary={none:'',shot:`Наносит ${n} физического урона. Сначала расходует магическую, затем физическую защиту. Игнорирует уклонение.`,physical:`Наносит ${n} физического урона. Урон уменьшает физическая защита; уклонение предотвращает весь удар.`,magic:`Наносит ${n} магического урона. Урон уменьшает магическая защита; уклонение предотвращает весь удар.`,armor:`Даёт ${n} физической защиты. Она расходуется, поглощая физический урон, и исчезает в начале следующего своего хода. Оборонительная стойка сохраняет остаток до конца боя.`,ward:`Даёт ${n} магической защиты. Она расходуется, поглощая магический урон и урон выстрелов, и исчезает в начале следующего своего хода.`,heal:`Восстанавливает ${n} здоровья, но не выше максимума.`,haste:`Уменьшает стоимость всех остальных карт в текущей руке на ${n}, но не ниже 0. Скидка исчезает, когда карта сыграна или сброшена.`,dodge:n===1?'Предотвращает следующую атаку целиком, кроме выстрела. Неиспользованное уклонение исчезает в конце следующего своего хода.':`Предотвращает следующие ${n} атаки целиком, кроме выстрелов. Неиспользованное уклонение исчезает в конце следующего своего хода.`}[c.effect];
 const x=specialAmount(c);
 const special={none:'',rob:`Переносит до ${x} случайных карт из руки противника в вашу руку на текущий бой. Если карт меньше, переносит все.`,confuse:`В начале следующего хода противник сбрасывает до ${x} случайных карт из руки.`,cheap:'Пониженная стоимость уже учтена в цене карты.',draw:`Немедленно добирает ${x} карт, даже сверх предела руки. Если колода пуста, сначала перемешивает сброс.`,haste:`Уменьшает стоимость остальных карт в текущей руке на ${x}, но не ниже 0. Скидка исчезает, когда карта сыграна или сброшена.`,surprise:`Если у атакующего действует уклонение, добавляет ${x} урона к основному удару до применения защиты. Уклонение при этом не расходуется.`,fortify:'Если у владельца действует уклонение, включает оборонительную стойку: остаток физической защиты сохраняется между ходами до конца боя.',leftHook:`Если разыграна сразу после «Правого коронного» в том же ходу, добавляет ${x} урона к основному удару. Если сброшена в оплату «Правого коронного», наносит отдельный удар ${c.paymentAmount??c.specialAmount??4} без усиления — это физический урон.`,combo:`Если противник уже оглушён до розыгрыша карты, немедленно добирает ${x} карт.`,jab:`Если действует оборонительная стойка, наносит ${x} физического урона.`,series:`Если в оплату сброшена ещё одна копия «${c.name}», наносит ещё ${x} физического урона. Дополнительный удар получает усиление одноцветной оплаты.`}[c.special??'none'];
 const parts=[];
 if(primary)parts.push({kind:'effect',title:`${EFFECTS[c.effect]} ${n}`,text:primary});
 if(special)parts.push({kind:'special',title:`${SPECIALS[c.special]}${['fortify','cheap'].includes(c.special)?'':` ${x}`}`,text:special});
 if(c.bonus==='vigor')parts.push({kind:'bonus',title:`Бодрость духа ${c.bonusAmount}`,text:`Увеличивает добор в конце текущего хода на ${c.bonusAmount}. После срабатывания бонус расходуется.`});
 if(c.bonus==='stance')parts.push({kind:'bonus',title:'Оборонительная стойка',text:'Сохраняет остаток физической защиты между ходами до конца боя. Повторное получение стойки её не усиливает.'});
 if(c.malus==='stun')parts.push({kind:'malus',title:`Оглушение ${c.malusAmount}`,text:`В начале следующего хода противник сбрасывает до ${c.malusAmount} случайных карт из руки. Если карт меньше, сбрасывает все; повторного добора нет.`});
 if(c.malus==='blind')parts.push({kind:'malus',title:`Ослепление ${c.malusAmount}`,text:`Противник не может разыгрывать карты с эффектом «Выстрел» следующие ${c.malusAmount} своих ходов.`});
 return parts;
}
export function describe(c){
 return describeParts(c).map(part=>`${part.title}: ${part.text}`).join(' ');
}
export function validateCatalog(data){
 if(!Array.isArray(data)||!data.length||data.length>200)throw Error('В наборе должно быть от 1 до 200 видов карт.');
 const ids=new Set();
 const result=data.map((c,i)=>{
  const fail=msg=>{throw Error(`Карта ${i+1}: ${msg}`);};
  if(!c||typeof c!=='object')fail('неверная запись.');
  if(typeof c.id!=='string'||!/^[-a-zA-Z0-9_]{1,80}$/.test(c.id)||ids.has(c.id)||['__proto__','constructor','prototype'].includes(c.id))fail('неверный или повторяющийся идентификатор.');ids.add(c.id);
  if(typeof c.name!=='string'||!c.name.trim()||c.name.length>80)fail('название должно содержать от 1 до 80 символов.');
  if(typeof c.kind!=='string'||!c.kind.trim()||c.kind.length>60)fail('тип должен содержать от 1 до 60 символов.');
  if(!['red','green','blue','gray'].includes(c.color))fail('неизвестный цвет.');
  if(c.rarity!==undefined&&!Object.hasOwn(RARITIES,c.rarity))fail('неизвестная редкость.');
  if(!Object.hasOwn(EFFECTS,c.effect))fail('неизвестный эффект.');
  for(const [field,max] of [['cost',19],['amount',999],['copies',30]])if(!Number.isInteger(c[field])||c[field]<0||c[field]>max)fail(`${{cost:'Стоимость',amount:'Сила эффекта',copies:'Количество копий'}[field]}: целое число от 0 до ${max}.`);
  if(c.special!==undefined&&!Object.hasOwn(SPECIALS,c.special))fail('неизвестный спецэффект.');
  if(c.coefficient!==undefined&&(!Number.isInteger(c.coefficient)||c.coefficient<0))fail('неверный коэффициент.');
  if(c.bonus!==undefined&&!Object.hasOwn(BONUSES,c.bonus))fail('неизвестный бонус.');
  if(c.malus!==undefined&&!Object.hasOwn(MALUSES,c.malus))fail('неизвестный малус.');
  for(const field of ['specialAmount','bonusAmount','malusAmount'])if(c[field]!==undefined&&(!Number.isInteger(c[field])||c[field]<0||c[field]>999))fail('сила статуса или спецэффекта должна быть целым числом от 0 до 999.');
  const clean={id:c.id,name:c.name.trim(),kind:c.kind.trim(),color:c.color,rarity:c.rarity??'bronze',cost:c.cost,effect:c.effect,amount:c.amount,copies:c.copies,special:c.special??'none',specialAmount:specialAmount(c),bonus:c.bonus??'none',bonusAmount:c.bonusAmount??0,malus:c.malus??'none',malusAmount:c.malusAmount??0,coefficient:c.coefficient??1};
  return {...clean,text:describe(clean)};
 });
 const total=result.reduce((s,c)=>s+c.copies,0);if(total<3||total>600)throw Error('В колоде должно быть от 3 до 600 карт с учётом копий.');
 return result;
}
export function parseCardsMarkdown(markdown){
 const colors={'красный':'red','зелёный':'green','зеленый':'green','синий':'blue','серый':'gray'};
 const effects=Object.fromEntries(Object.entries(EFFECTS).map(([key,value])=>[value.toLowerCase(),key]));
 const lines=markdown.replace(/^\uFEFF/,'').split(/\r?\n/);
 const start=lines.findIndex(line=>line.trim()==='## Карты');
 if(start<0)throw Error('В cards.md не найден раздел «## Карты».');
 const rarities=Object.fromEntries(Object.entries(RARITIES).map(([k,v])=>[v.toLowerCase(),k]));
 const rows=[];let header=false,separator=false,columnCount=8;
 const modern='ID|Название|Цвет|Стартовая колода|Стоимость|Эффект|Коэффициент эффекта|Сила|Спецэффект|Редкость';
 const statusHeader='ID|Название|Цвет|Стартовая колода|Стоимость|Эффект|Сила|Спецэффект|Сила спецэффекта|Бонус|Сила бонуса|Малус|Сила малуса|Редкость';
 const typedStatusHeader='ID|Название|Цвет|Тип|Стартовая колода|Стоимость|Эффект|Сила|Спецэффект|Сила спецэффекта|Бонус|Сила бонуса|Малус|Сила малуса|Редкость';
 const specialLabels=Object.fromEntries(Object.entries(SPECIALS).map(([k,v])=>[v.toLowerCase(),k]));
 Object.assign(specialLabels,{'смятение':'confuse','добрать карту':'draw'});
 Object.assign(rarities,{'бронза':'bronze','серебро':'silver','золото':'gold'});
 const split=line=>line.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(x=>x.trim());
 for(let i=start+1;i<lines.length;i++){
  const line=lines[i].trim();if(/^##\s/.test(line))break;if(!line)continue;
  if(!line.startsWith('|'))throw Error(`cards.md, строка ${i+1}: ожидается строка таблицы, начинающаяся с |.`);
  const cells=split(line);
  if(!header){if(![modern,statusHeader,typedStatusHeader,'ID|Название|Цвет|Стоимость|Тип|Эффект|Сила|Копий','ID|Название|Цвет|Стоимость|Тип|Эффект|Сила|Копий|Редкость'].includes(cells.join('|')))throw Error(`cards.md, строка ${i+1}: сохраните исходные названия и порядок столбцов.`);columnCount=cells.length;header=true;continue;}
  if(!separator){if(cells.length!==columnCount||!cells.every(c=>/^:?-{3,}:?$/.test(c)))throw Error(`cards.md, строка ${i+1}: неверная строка разделителя таблицы.`);separator=true;continue;}
  if(cells.length!==columnCount)throw Error(`cards.md, строка ${i+1}: нужно ${columnCount} столбцов. Не используйте символ | внутри значений.`);
  if(columnCount===14||columnCount===15){
   const [id,name,color,cardType,starter,cost,effect,amount,special,strength,bonus,bonusStrength,malus,malusStrength,rarity]=columnCount===15?cells:[...cells.slice(0,3),'',...cells.slice(3)];
   if(!['да','нет'].includes(starter.toLowerCase()))throw Error(`Карта ${name}: стартовая колода — да или нет.`);
   if(![cost,amount,strength,bonusStrength,malusStrength].every(v=>/^\d+$/.test(v)))throw Error(`Карта ${name}: нужны целые неотрицательные числа.`);
   const bonusId=Object.keys(BONUSES).find(k=>BONUSES[k].toLowerCase()===bonus.toLowerCase()),malusId=Object.keys(MALUSES).find(k=>MALUSES[k].toLowerCase()===malus.toLowerCase());
   if(!bonusId||!malusId)throw Error(`Карта ${name}: неизвестный бонус или малус.`);
   if(!Object.hasOwn(rarities,rarity.toLowerCase()))throw Error(`Карта ${name}: неизвестная редкость.`);
   if(!Object.hasOwn(specialLabels,special.toLowerCase()))throw Error(`Карта ${name}: неизвестный спецэффект.`);
   rows.push({id,name,color:colors[color.toLowerCase()],cost:Number(cost),kind:cardType||(effect==='Нет'?special:effect),effect:effects[effect.toLowerCase()],amount:Number(amount),special:specialLabels[special.toLowerCase()],specialAmount:Number(strength),bonus:bonusId,bonusAmount:Number(bonusStrength),malus:malusId,malusAmount:Number(malusStrength),rarity:rarities[rarity.toLowerCase()],copies:starter.toLowerCase()==='да'?1:0});continue;
  }
  if(columnCount===10){
   const [id,name,color,starter,cost,effect,coefficient,amount,special,rarity]=cells;
   if(!['да','нет'].includes(starter.toLowerCase()))throw Error(`Карта ${name}: стартовая колода — да или нет.`);
   if(![cost,coefficient,amount].every(v=>/^\d+$/.test(v)))throw Error(`Карта ${name}: нужны целые неотрицательные числа.`);
   if(!Object.hasOwn(rarities,rarity.toLowerCase()))throw Error(`Карта ${name}: неизвестная редкость.`);
   if(!Object.hasOwn(specialLabels,special.toLowerCase()))throw Error(`Карта ${name}: неизвестный спецэффект.`);
   rows.push({id,name,color:colors[color.toLowerCase()],cost:Number(cost),kind:effect==='Нет'?special:effect,effect:effects[effect.toLowerCase()],coefficient:Number(coefficient),amount:effects[effect.toLowerCase()]==='dodge'&&Number(amount)===0?1:Number(amount),special:specialLabels[special.toLowerCase()],rarity:rarities[rarity.toLowerCase()],copies:starter.toLowerCase()==='да'?1:0});
   continue;
  }
  const [id,name,color,cost,kind,effect,amount,copies,rarity]=cells;
  if(![cost,amount,copies].every(v=>/^\d+$/.test(v)))throw Error(`cards.md, строка ${i+1}: стоимость, сила и число копий должны быть целыми неотрицательными числами.`);
  if(columnCount===9&&!Object.hasOwn(rarities,rarity.toLowerCase()))throw Error(`cards.md, строка ${i+1}: неизвестная редкость.`);
  rows.push({id,name,rarity:columnCount===9?rarities[rarity.toLowerCase()]:'bronze',color:colors[color.toLowerCase()],cost:Number(cost),kind,effect:effects[effect.toLowerCase()],amount:Number(amount),copies:Number(copies)});
 }
 return Object.fromEntries(validateCatalog(rows).map(c=>[c.id,c]));
}
