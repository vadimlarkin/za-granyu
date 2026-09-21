// Base: Колода.xlsx, Враги!I2:M19. 0: unavailable, 1: bronze, 2: bronze and silver.
// Game override: gray cards are disabled for every enemy class except Специалист (Гангстер).
export const enemyClasses=Object.freeze({
  "Бродяга": {
    "red": 1,
    "green": 0,
    "blue": 0,
    "gray": 0
  },
  "Грабитель": {
    "red": 0,
    "green": 1,
    "blue": 0,
    "gray": 0
  },
  "Неофит": {
    "red": 0,
    "green": 0,
    "blue": 1,
    "gray": 0
  },
  "Специалист": {
    "red": 1,
    "green": 1,
    "blue": 0,
    "gray": 1
  },
  "Асассин": {
    "red": 0,
    "green": 1,
    "blue": 1,
    "gray": 0
  },
  "Культист": {
    "red": 1,
    "green": 0,
    "blue": 1,
    "gray": 0
  },
  "Бродяга 2": {
    "red": 2,
    "green": 0,
    "blue": 0,
    "gray": 0
  },
  "Грабитель 2": {
    "red": 0,
    "green": 2,
    "blue": 0,
    "gray": 0
  },
  "Громила 2": {
    "red": 0,
    "green": 0,
    "blue": 2,
    "gray": 0
  },
  "Асассин 2 МАГ": {
    "red": 0,
    "green": 1,
    "blue": 2,
    "gray": 0
  },
  "Культист 2 СИЛА": {
    "red": 2,
    "green": 0,
    "blue": 1,
    "gray": 0
  },
  "Мастер": {
    "red": 1,
    "green": 1,
    "blue": 1,
    "gray": 0
  },
  "Специалист 2 СИЛА": {
    "red": 2,
    "green": 1,
    "blue": 0,
    "gray": 0
  },
  "Специалист 2 ЛОВКОСТЬ": {
    "red": 1,
    "green": 2,
    "blue": 0,
    "gray": 0
  },
  "Асассин 2 ЛОВКОСТЬ": {
    "red": 0,
    "green": 2,
    "blue": 1,
    "gray": 0
  },
  "Культист 2 МАГ": {
    "red": 1,
    "green": 0,
    "blue": 2,
    "gray": 0
  },
  "Мастер 2 СИЛА": {
    "red": 2,
    "green": 1,
    "blue": 1,
    "gray": 0
  },
  "Мастер 2 МАГ": {
    "red": 1,
    "green": 1,
    "blue": 2,
    "gray": 0
  }
});
export function enemyDeck(catalog,type){
 const access=enemyClasses[type];
 if(!access)throw Error(`Неизвестный класс противника: ${type}.`);
 const keys=Object.values(catalog).filter(card=>{
  const tier=access[card.color]??0;
  return tier>=1&&((card.rarity??'bronze')==='bronze'||tier>=2&&card.rarity==='silver');
 }).map(card=>card.id);
 if(!keys.length)throw Error(`У класса «${type}» нет доступных карт в каталоге.`);
 return keys;
}
