// Original procedural effects: no downloads or third-party recordings.
export function createSound(){
 let context, master, enabled=true;
 const voices=new Set();
 try {enabled=localStorage.getItem('cardgame.sound')!=='off';}catch{}
 function unlock(){
  if(!enabled)return;
  try{
   if(!context){
    const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!Audio)return;
    context=new Audio();master=context.createGain();master.gain.value=.24;master.connect(context.destination);
   }
   if(context.state==='suspended')context.resume().catch(()=>{});
  }catch{/* Sound must never interrupt a game. */}
 }
 function stop(){for(const source of voices){try{source.stop();}catch{}}voices.clear();}
 function tone(time,freq,end,duration,volume=.2,type='sine'){
  const source=context.createOscillator(),gain=context.createGain();source.type=type;
  source.frequency.setValueAtTime(freq,time);source.frequency.exponentialRampToValueAtTime(end,time+duration);
  gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.008);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
  source.connect(gain);gain.connect(master);voices.add(source);
  source.onended=()=>{voices.delete(source);source.disconnect();gain.disconnect();};source.start(time);source.stop(time+duration+.01);
 }
 function noise(time,duration,freq=1600,volume=.25){
  const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
  const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*duration),context.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  source.buffer=buffer;filter.type='bandpass';filter.frequency.value=freq;filter.Q.value=.7;
  gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.005);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
  source.connect(filter);filter.connect(gain);gain.connect(master);voices.add(source);
  source.onended=()=>{voices.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};source.start(time);source.stop(time+duration+.01);
 }
 function play(name,delay=0){
  if(!enabled||globalThis.document?.hidden)return;unlock();if(!context||context.state!=='running')return;
  try{
   const t=context.currentTime+delay;
   const notes=(frequencies,step=.09)=>frequencies.forEach((f,i)=>tone(t+i*step,f,f,.24,.15,'sine'));
   switch(name){
    case 'select':noise(t,.08,1900,.25);tone(t,440,330,.07,.08);break;
    case 'cancel':noise(t,.08,900,.16);break;
    case 'pay':noise(t,.06,2300,.23);tone(t,620,750,.1,.12);break;
    case 'boost':notes([440,660,880],.055);break;
    case 'draw':for(let i=0;i<3;i++)noise(t+i*.07,.1,1400+i*300,.22);break;
    case 'turn':notes([330,220],.1);break;
    case 'ready':notes([330,440],.1);break;
    case 'physical':noise(t,.16,650,.5);tone(t,145,45,.18,.5);break;
    case 'magic':tone(t,240,1100,.3,.18,'triangle');noise(t,.3,2800,.16);break;
    case 'damage':tone(t,95,38,.15,.3);break;
    case 'armor':case 'block':noise(t,.12,2400,.3);tone(t,780,390,.22,.2,'triangle');break;
    case 'ward':notes([440,660,990],.04);break;
    case 'dodge':case 'haste':noise(t,.24,3200,.25);tone(t,380,850,.16,.09);break;
    case 'heal':notes([523,659,784],.09);break;
    case 'won':notes([392,494,587,784],.13);break;
    case 'lost':notes([294,247,196,147],.16);break;
    case 'error':tone(t,160,120,.15,.13,'triangle');break;
    default:tone(t,480,420,.06,.08);
   }
  }catch{/* Audio is optional, including on unsupported browsers. */}
 }
 return {get enabled(){return enabled;},unlock,play,stop,toggle(){enabled=!enabled;stop();try{localStorage.setItem('cardgame.sound',enabled?'on':'off');}catch{}if(enabled){unlock();play('select');}return enabled;}};
}
