export const opponents = [
 {id:'vagabond',name:'Бродяга',type:'Бродяга',level:2,cap:6,hp:9,count:1,description:'Мужик-оборванец в вязаной шапке с дубинкой типа блэкджек.'},
 {id:'robber',name:'Грабитель',type:'Грабитель',level:2,cap:6,hp:9,count:1,description:'Мрачный тип в балаклаве с ножом-бабочкой.'},
 {id:'cultist',name:'Культист',type:'Неофит',level:2,cap:6,hp:9,count:1,description:'Худосочный, бледный мужичок в самодельном балахоне плохого качества.'},
 {id:'gangster',name:'Гангстер',type:'Специалист',level:3,cap:7,hp:11,count:1,description:'Толстый мужик с томми-ганом.'},
 {id:'initiate',name:'Посвящённый',type:'Асассин',level:3,cap:7,hp:11,count:1,description:'Высокий статный мужчина в чёрном балахоне отличного качества. По кайме тёмно-фиолетовые светящиеся руны.'},
 {id:'hybrid',name:'Гибрид',type:'Громила 2',level:3,cap:7,hp:11,count:1,description:'Толстый мужик в одежде рабочего доков со странно выпученными рыбьими глазами.'},
 {id:'deep-one',name:'Глубоководный',type:'Асассин 2 МАГ',level:4,cap:8,hp:13,count:1,description:'Глубоководный лавкрафтовский житель, без одежды. Амфибия: выпученные глаза, перепончатые лапы, страшный.'},
 {id:'grandmaster',name:'Магистр ордена',type:'Мастер 2 МАГ',level:5,cap:9,hp:15,count:1,description:'Высокий статный мужчина в золотом балахоне отличного качества с белой каймой, в шляпе фараона, с посохом со змеёй.'}
].map(enemy=>Object.freeze({...enemy,xp:enemy.level*10,art:enemy.id==='vagabond'?'./assets/enemy-vagabond-swing-v5.png':['robber'].includes(enemy.id)?`./assets/enemy-${enemy.id}-standing-v4.png`:enemy.id==='deep-one'?'./assets/enemy-deep-one-full.png':`./assets/enemy-${enemy.id}-left-v3.png`}));
export function createCampaign(random=Math.random){
 const queue=opponents.flatMap(enemy=>Array(enemy.count).fill(enemy.id));
 return {queue,index:0};
}
export function currentOpponent(campaign){return opponents.find(enemy=>enemy.id===campaign.queue[campaign.index]);}
export function advanceCampaign(campaign,status){
 if(status==='lost')return createCampaign();
 if(status!=='won')throw Error('Сначала завершите текущий бой.');
 if(campaign.index===campaign.queue.length-1)return createCampaign();
 return {...campaign,index:campaign.index+1};
}
