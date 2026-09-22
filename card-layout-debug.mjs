const STORAGE_KEY='card-layout-tuner-v2';
const localHosts=new Set(['127.0.0.1','localhost','::1']);
const cssNames={
 costX:'--card-layout-cost-x',costY:'--card-layout-cost-y',costSize:'--card-layout-cost-size',
 titleX:'--card-layout-title-x',titleY:'--card-layout-title-y',titleSize:'--card-layout-title-size',titleScale:'--card-layout-title-scale',
 effectX:'--card-layout-effect-x',effectY:'--card-layout-effect-y',effectSize:'--card-layout-effect-size',effectNumberY:'--card-layout-effect-number-y',effectNumberSize:'--card-layout-effect-number-size',effectGap:'--card-layout-effect-gap',
 footerX:'--card-layout-footer-x',footerY:'--card-layout-footer-y',footerSize:'--card-layout-footer-size',footerSpacing:'--card-layout-footer-spacing'
};
const cssValue=(key,value)=>key==='titleScale'?String(value/100):key==='footerSpacing'?`${value/10}px`:`${value}px`;
function readValues(){
 try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')?.values??null;}catch{return null;}
}
function applyValues(){
 const values=readValues();
 if(!values)return;
 for(const [key,property] of Object.entries(cssNames))if(Number.isFinite(values[key]))document.documentElement.style.setProperty(property,cssValue(key,values[key]));
}
export function initCardLayoutDebug(){
 if(location.protocol!=='file:'&&!localHosts.has(location.hostname))return false;
 applyValues();
 const button=document.createElement('button');
 button.id='card-layout-debug-open';button.type='button';button.textContent='⊞ Карта';
 button.setAttribute('aria-controls','card-layout-debug-dialog');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
 const dialog=document.createElement('dialog');dialog.id='card-layout-debug-dialog';dialog.setAttribute('aria-labelledby','card-layout-debug-title');
 dialog.innerHTML=`<div class="card-layout-debug-heading"><h2 id="card-layout-debug-title">Настройка карты</h2><button type="button" aria-label="Закрыть">×</button></div><iframe src="./design/card-layout-tuner.html" title="Мастерская раскладки карты"></iframe>`;
 document.body.append(button,dialog);
 const close=dialog.querySelector('button');
 button.addEventListener('click',()=>{dialog.showModal();button.setAttribute('aria-expanded','true');});
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{applyValues();button.setAttribute('aria-expanded','false');button.focus();});
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY)applyValues();});
 window.addEventListener('message',event=>{if(event.origin===location.origin&&event.data?.type==='card-layout-change')applyValues();});
 return true;
}
