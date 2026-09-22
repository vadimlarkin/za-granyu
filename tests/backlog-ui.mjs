import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {describeParts,parseCardsMarkdown} from '../catalog.mjs';
import {cardFace,compactCardLabels} from '../card-face.mjs';

const root=new URL('../',import.meta.url);
const catalog=parseCardsMarkdown(readFileSync(new URL('cards.md',root),'utf8'));
const html=readFileSync(new URL('index.html',root),'utf8');
const app=readFileSync(new URL('app.mjs',root),'utf8');
const playerCss=readFileSync(new URL('player.css',root),'utf8');
const cardCss=readFileSync(new URL('card-face.css',root),'utf8');
const storyCss=readFileSync(new URL('story.css',root),'utf8');
const cardDebug=readFileSync(new URL('card-layout-debug.mjs',root),'utf8');
const cardTunerPath=new URL('design/card-layout-tuner.html',root);
const cardTuner=existsSync(cardTunerPath)?readFileSync(cardTunerPath,'utf8'):null;

assert.match(html,/id="release-version"[^>]*>v0\.5\.0</);
assert.match(html,/id="card-preview"/);
assert.match(html,/id="card-preview-name"/);
assert.match(html,/id="card-preview-price"/);
assert.match(html,/id="card-catalog-screen"/);
assert.match(playerCss,/#card-preview\{[^}]*top:18px;[^}]*width:min\(650px[^}]*height:min\(360px/);
assert.match(playerCss,/\.card-preview-layout\{[^}]*padding-top:22px;align-items:start/);
assert.match(app,/card-preview-price'\)\.textContent=`Стоимость: \$\{card\.cost\}`/);
assert.doesNotMatch(app,/card-preview-cost/);
assert.match(playerCss,/border:2px solid var\(--rarity-color\)/);
assert.match(app,/touchPreviewId=null;hideCardPreview\(true\);enemyBusy=true/);
assert.match(app,/function showCardPreview\(instance,card,effect\)\{\n if\(enemyBusy\)return;/);
assert.match(app,/host\.replaceChildren\(face,banner\)/);
assert.match(app,/const artIndex=artKeys\.includes\(card\.id\)\?artKeys\.indexOf\(card\.id\):\(effectArt\[card\.effect\]\?\?0\)/);
assert.match(playerCss,/\.card-preview-banner\{[^}]*width:min\(150px,94%\)[^}]*object-fit:fill/);
for(const name of ['strength-v1','agility-v1','intellect-v2','universal-v1'])assert.ok(existsSync(new URL(`assets/card-banners/${name}.png`,root)));
for(const name of ['strength-v1','agility-v1','intellect-v1','universal-v1'])assert.ok(existsSync(new URL(`assets/card-symbols/${name}.png`,root)));
assert.match(html,/id="tutorial"/);
assert.match(app,/await continueAfterProgression\(\)/);
assert.match(app,/cardgame\.tutorial\.v1/);
assert.deepEqual(compactCardLabels(catalog.dodge),['Уклонение 1']);
assert.deepEqual(compactCardLabels(catalog['clever-feint']),['Урон 1','Бодрость 1']);
assert.match(cardFace(catalog.hit,{compact:true}),/card-chip">Урон <span class="card-chip-number">2<\/span>/);
assert.ok(!cardFace(catalog.hit,{compact:true}).includes('физического урона'));
for(const card of Object.values(catalog))assert.match(cardFace(card,{compact:true}),/class="card-footer"/);
for(const card of Object.values(catalog))assert.match(cardFace(card,{compact:true}),/class="card-shell"/);
assert.match(cardFace(catalog.hit,{compact:true}),/card-footer"><span>Атака<\/span>/);
assert.match(cardFace(catalog.dodge,{compact:true}),/card-footer"><span>Защита<\/span>/);
assert.match(cardFace(catalog.shot,{compact:true}),/card-footer"><span>Выстрел<\/span>/);
assert.match(cardFace(catalog.heal,{compact:true}),/card-footer"><span>Исцеление<\/span>/);
assert.match(cardCss,/card-shells\/strength-v1\.png/);
assert.match(cardCss,/card-shells\/agility-v1\.png/);
assert.match(cardCss,/card-shells\/intellect-v1\.png/);
assert.match(cardCss,/card-shells\/universal-v1\.png/);
for(const rarity of ['silver','gold','purple','diamond']){
 for(const type of ['strength','agility','intellect','universal']){
  assert.match(cardCss,new RegExp(`card-shells/${type}-${rarity}-v1\\.png`));
  assert.ok(existsSync(new URL(`assets/card-shells/${type}-${rarity}-v1.png`,root)));
 }
}
assert.match(cardCss,/\.card-name,[\s\S]*text-transform:uppercase/);
assert.match(cardCss,/\.card\.material-card \.card-shell\{[\s\S]*background:var\(--card-shell\)/);
assert.match(cardCss,/\.card-text,[\s\S]*background:none/);
assert.match(cardCss,/--card-layout-cost-y,-8px/);
assert.match(cardCss,/--card-layout-effect-number-y,-2\.5px/);
assert.match(cardCss,/--card-layout-footer-y,-5px/);
assert.match(cardCss,/:is\(\.hand,\.card-catalog-grid\) \.material-card \.card-text\.card-text-compact/);
assert.match(storyCss,/body\[data-screen\]:not\(\[data-screen="combat"\]\):not\(\[data-screen="catalog"\]\)/);
assert.match(storyCss,/body\[data-view="player"\]\[data-screen="catalog"\]\{height:auto;min-height:100svh;overflow:auto\}/);
assert.match(cardDebug,/location\.protocol!=='file:'&&!localHosts\.has\(location\.hostname\)/);
assert.match(cardDebug,/card-layout-debug-open/);
assert.match(cardDebug,/\.\/design\/card-layout-tuner\.html/);
if(cardTuner){
 assert.match(cardTuner,/const STORAGE_KEY|card-layout-tuner-v2/);
 assert.match(cardTuner,/costX:-5,costY:-8,costSize:31/);
}
for(const name of ['sucker-punch','stash','spit','sidestep','poke'])assert.ok(existsSync(new URL(`assets/cards/${name}-v1.png`,root)));
assert.deepEqual(describeParts(catalog['clever-feint']).map(part=>part.kind),['effect','bonus']);
assert.equal(describeParts(catalog['dirty-trick']).at(-1).title,'Оглушение 1');
assert.match(describeParts(catalog['left-hook'])[1].text,/отдельный удар 4 без усиления/);

console.log('PASS: release label, automatic progression hook, tutorial shell and compact card labels');
