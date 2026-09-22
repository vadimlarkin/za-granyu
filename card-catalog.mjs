export const COLOR_ORDER=Object.freeze(['red','green','blue','gray']);
export const RARITY_ORDER=Object.freeze(['bronze','silver','gold','purple','diamond']);
export const COLOR_LABELS=Object.freeze({red:'Красные карты',green:'Зелёные карты',blue:'Синие карты',gray:'Серые карты'});

const rank=(order,value)=>{
 const index=order.indexOf(value);
 return index<0?order.length:index;
};

export function sortCatalogCards(catalog){
 return Object.values(catalog).sort((left,right)=>
  rank(COLOR_ORDER,left.color)-rank(COLOR_ORDER,right.color)
  ||rank(RARITY_ORDER,left.rarity)-rank(RARITY_ORDER,right.rarity)
  ||left.name.localeCompare(right.name,'ru')
 );
}

export function groupCatalogCards(catalog){
 const cards=sortCatalogCards(catalog);
 return COLOR_ORDER.flatMap(color=>{
  const grouped=cards.filter(card=>card.color===color);
  return grouped.length?[{color,label:COLOR_LABELS[color],cards:grouped}]:[];
 });
}
