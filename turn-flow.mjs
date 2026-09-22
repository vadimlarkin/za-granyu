import {cardInHand,isBlinded} from './engine.mjs?v=20260922-street-cards-1';
export function hasPlayableCard(state){
 return state.hand.some(instance=>{
  const card=cardInHand(state,instance);
  return card.cost<=state.hand.length-1&&!(isBlinded(state)&&card.effect==='shot');
 });
}
