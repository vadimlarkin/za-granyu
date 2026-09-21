// Landmarks measured in the source artwork, as fractions of image height.
// Ignore hats, raised weapons and empty margins: eyes and weight-bearing soles
// determine the projected body scale and common ground plane.
export const combatLandmarks=Object.freeze({
 investigator:{eye:.075,sole:.936},thief:{eye:.090,sole:.960},professor:{eye:.073,sole:.955},
 vagabond:{eye:.135,sole:.952},robber:{eye:.095,sole:.973},
 cultist:{eye:.093,sole:.951},gangster:{eye:.132,sole:.958},
 initiate:{eye:.082,sole:.980},hybrid:{eye:.126,sole:.917},
 'deep-one':{eye:.105,sole:.974},grandmaster:{eye:.067,sole:.944}
});
export function combatPlacement(id){
 const landmark=combatLandmarks[id];
 if(!landmark)throw Error('Нет точек привязки для '+id);
 const eyeLine=30,groundLine=130;
 const height=(groundLine-eyeLine)/(landmark.sole-landmark.eye);
 return {height,top:groundLine-landmark.sole*height};
}
export function positionCombatant(element,id){
 const {height,top}=combatPlacement(id);
 element.style.setProperty('--portrait-height',height+'%');
 element.style.setProperty('--portrait-top',top+'%');
}
