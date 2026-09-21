// The adventure owns the collection; battle piles never change it.
export function starterDeck(catalog){
 return Object.values(catalog).filter(card=>(card.copies??1)>0).map(card=>card.id);
}
export const REWARD_WEIGHTS=Object.freeze({bronze:5,silver:1,gold:.4,purple:.15,diamond:.05});
export function createReward(catalog,random=Math.random){
 const pool=Object.keys(catalog).filter(key=>(catalog[key].copies??1)===0).map(key=>({key,weight:REWARD_WEIGHTS[catalog[key].rarity??'bronze']}));
 if(pool.length<3)throw Error('Для награды нужны минимум три вида карт вне стартовой колоды.');
 if(pool.some(item=>!item.weight))throw Error('Неизвестная редкость в пуле наград.');
 const choices=[];
 while(choices.length<3){
  const total=pool.reduce((sum,item)=>sum+item.weight,0);
  let ticket=random()*total,index=0;
  while(index<pool.length-1&&ticket>=pool[index].weight){ticket-=pool[index].weight;index++;}
  choices.push(pool.splice(index,1)[0].key);
 }
 return {choices,selected:null,skipped:false,pending:null};
}
export function previewReward(reward,key){
 if(!reward||rewardResolved(reward))throw Error('Награда уже подтверждена.');
 if(key!=='skip'&&!reward.choices.includes(key))throw Error('Неизвестная награда.');
 reward.pending=key;
}
export function confirmReward(deck,reward){
 if(!reward?.pending||rewardResolved(reward))throw Error('Сначала выберите награду.');
 if(reward.pending==='skip'){skipReward(reward);return deck;}
 return claimReward(deck,reward,reward.pending);
}
export function claimReward(deck,reward,key){
 if(!reward||reward.selected!==null||reward.skipped)throw Error('Награда уже выбрана или недоступна.');
 if(!reward.choices.includes(key))throw Error('Выберите одну из предложенных карт.');
 reward.selected=key;
 return [...deck,key];
}

export function rewardResolved(reward){return Boolean(reward&&(reward.selected!==null||reward.skipped));}
export function skipReward(reward){
 if(!reward||rewardResolved(reward))throw Error('Награда уже выбрана или недоступна.');
 reward.skipped=true;
}
