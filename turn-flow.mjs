import {cardInHand} from './engine.mjs';
export function hasPlayableCard(state){
 return state.hand.some(instance=>cardInHand(state,instance).cost<=state.hand.length-1);
}
