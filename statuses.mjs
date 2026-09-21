export const statusDefinitions = {
 vigor:{name:'Бодрость духа',kind:'bonus',image:'./assets/statuses/vigor-v1.png'},
 confusion:{name:'Оглушение',kind:'malus',image:'./assets/statuses/stun-v1.png'},
 stance:{name:'Оборонительная стойка',kind:'bonus',image:'./assets/statuses/stance-v1.png'}
};
export function activeStatuses(actor){
 return Object.entries(statusDefinitions).flatMap(([key,definition])=>{
  const pending=actor[key]||0,applied=actor[key==='vigor'?'activeVigor':key==='confusion'?'activeConfusion':'unused']||0;
  if(!pending&&!applied)return [];
  const description=key==='stance'?'Физическая защита сохраняется между ходами до конца боя и расходуется при получении урона.':key==='confusion'?`${pending?`В начале следующего своего хода сбросить до ${pending} случайных карт из руки. `:''}${applied?`Сброс от оглушения ${applied} уже применён. Статус действует до конца следующего хода наложившего его персонажа. Повторного сброса нет.`:''}`:`${pending?`Добор в конце своего хода больше на ${pending}. `:''}${applied?`При доборе уже применено: ${applied}. Значок сохраняется до конца следующего своего хода. `:''}Сохранённые карты остаются в руке.`;
  return [{key,...definition,amount:pending+applied,tooltip:`${definition.name} · ${pending+applied}. ${description}`}];
 });
}
export function renderStatuses(container,actor){
 container.replaceChildren(...activeStatuses(actor).map(status=>{
  const badge=document.createElement('button');badge.type='button';badge.className=`actor-status ${status.kind}`;
  badge.setAttribute('aria-label',`${actor.name}: ${status.tooltip}`);
  const img=document.createElement('img');img.src=status.image;img.alt='';
  const amount=document.createElement('b');amount.textContent=status.amount;amount.setAttribute('aria-hidden','true');
  const tooltip=document.createElement('span');tooltip.className='actor-status-tooltip';tooltip.setAttribute('role','tooltip');tooltip.id=`${container.id}-${status.key}-tip`;tooltip.textContent=status.tooltip;
  badge.setAttribute('aria-describedby',tooltip.id);badge.append(img,amount,tooltip);
  badge.addEventListener('keydown',event=>{if(event.key==='Escape'){badge.blur();badge.classList.add('tooltip-dismissed');}});
  badge.addEventListener('pointerleave',()=>badge.classList.remove('tooltip-dismissed'));
  badge.addEventListener('focus',()=>badge.classList.remove('tooltip-dismissed'));
  return badge;
 }));
}
