export const PERKS=Object.freeze([
 {level:2,id:'warrior',name:'Воин',color:'red',description:'Красная карта стоимостью от 2 получает +50% к основному эффекту, если в оплате есть хотя бы одна красная карта.'},
 {level:2,id:'thief',name:'Вор',color:'green',description:'Зелёная карта стоимостью от 2 получает +50% к основному эффекту, если в оплате есть хотя бы одна зелёная карта.'},
 {level:2,id:'mage',name:'Маг',color:'blue',description:'Синяя карта стоимостью от 2 получает +50% к основному эффекту, если в оплате есть хотя бы одна синяя карта.'},
 {level:2,id:'reserve',name:'Неприкосновенный запас',description:'В начале каждого боя первый добор — 4 карты вместо 3.'},
 {level:2,id:'veteran',name:'Бывалый',description:'Максимальное здоровье противников уменьшается на 10%. Результат округляется вниз.'}
]);
export const XP_THRESHOLDS=Object.freeze([0,60,150]);
export function levelForExperience(xp){return xp>=XP_THRESHOLDS[2]?2:xp>=XP_THRESHOLDS[1]?1:0;}
export function newProgress(){return {xp:0,level:0,perk:null,perkChoices:null,credited:[]};}
export function creditVictory(progress,index,xp){
 if(progress.credited.includes(index))return {gained:0,levelUp:false};
 const previous=progress.level;progress.xp+=xp;progress.level=levelForExperience(progress.xp);progress.credited.push(index);
 return {gained:xp,levelUp:progress.level>previous};
}
export const needsPerk=progress=>!progress.perk&&PERKS.some(perk=>perk.level===progress.level);
export function perkChoices(progress,random=Math.random){
 if(!needsPerk(progress))return [];
 if(!progress.perkChoices){
  const pool=PERKS.filter(perk=>perk.level===progress.level).map(perk=>perk.id);
  progress.perkChoices=[];
  while(pool.length&&progress.perkChoices.length<3){
   const index=Math.floor(random()*pool.length);
   progress.perkChoices.push(pool.splice(index,1)[0]);
  }
 }
 return progress.perkChoices.map(id=>PERKS.find(perk=>perk.id===id));
}
export function choosePerk(progress,id){
 if(!needsPerk(progress)||!progress.perkChoices?.includes(id)||!PERKS.some(p=>p.id===id&&p.level===progress.level))throw Error('Перк недоступен или уже выбран.');
 progress.perk=id;
}
