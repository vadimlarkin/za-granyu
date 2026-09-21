export const PERKS=Object.freeze([
 {id:'warrior',name:'Воин',color:'red',description:'Красная карта стоимостью от 2 получает +50% к основному эффекту, если в оплате есть хотя бы одна красная карта.'},
 {id:'thief',name:'Вор',color:'green',description:'Зелёная карта стоимостью от 2 получает +50% к основному эффекту, если в оплате есть хотя бы одна зелёная карта.'},
 {id:'mage',name:'Маг',color:'blue',description:'Синяя карта стоимостью от 2 получает +50% к основному эффекту, если в оплате есть хотя бы одна синяя карта.'},
 {id:'reserve',name:'Неприкосновенный запас',description:'В начале каждого боя первый добор — 4 карты вместо 3.'},
 {id:'veteran',name:'Бывалый',description:'Максимальное здоровье противников уменьшается на 10%. Результат округляется вниз.'}
]);
export const XP_THRESHOLDS=Object.freeze([0,60,150]);
export function levelForExperience(xp){return xp>=XP_THRESHOLDS[2]?2:xp>=XP_THRESHOLDS[1]?1:0;}
export function newProgress(){return {xp:0,level:0,perk:null,credited:[]};}
export function creditVictory(progress,index,xp){
 if(progress.credited.includes(index))return {gained:0,levelUp:false};
 const previous=progress.level;progress.xp+=xp;progress.level=levelForExperience(progress.xp);progress.credited.push(index);
 return {gained:xp,levelUp:progress.level>previous};
}
export const needsPerk=progress=>progress.level>=2&&!progress.perk;
export function choosePerk(progress,id){
 if(!needsPerk(progress)||!PERKS.some(p=>p.id===id))throw Error('Перк недоступен или уже выбран.');
 progress.perk=id;
}
