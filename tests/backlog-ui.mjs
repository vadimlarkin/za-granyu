import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {describeParts,parseCardsMarkdown} from '../catalog.mjs';
import {cardFace,compactCardLabels} from '../card-face.mjs';

const root=new URL('../',import.meta.url);
const catalog=parseCardsMarkdown(readFileSync(new URL('cards.md',root),'utf8'));
const html=readFileSync(new URL('index.html',root),'utf8');
const app=readFileSync(new URL('app.mjs',root),'utf8');
const playerCss=readFileSync(new URL('player.css',root),'utf8');

assert.match(html,/id="release-version"[^>]*>v0\.4\.0</);
assert.match(html,/id="card-preview"/);
assert.match(html,/id="card-preview-name"/);
assert.match(html,/id="card-preview-price"/);
assert.match(playerCss,/#card-preview\{[^}]*top:18px;[^}]*width:min\(650px[^}]*height:min\(360px/);
assert.match(playerCss,/\.card-preview-layout\{[^}]*padding-top:22px;align-items:start/);
assert.match(app,/card-preview-price'\)\.textContent=`Стоимость: \$\{card\.cost\}`/);
assert.doesNotMatch(app,/card-preview-cost/);
assert.match(playerCss,/border:2px solid var\(--rarity-color\)/);
assert.match(app,/touchPreviewId=null;hideCardPreview\(true\);enemyBusy=true/);
assert.match(app,/function showCardPreview\(instance,card,effect\)\{\n if\(enemyBusy\)return;/);
assert.match(app,/host\.replaceChildren\(face,banner\)/);
assert.match(playerCss,/\.card-preview-banner\{[^}]*width:min\(150px,94%\)[^}]*object-fit:fill/);
for(const name of ['strength-v1','agility-v1','intellect-v2','universal-v1'])assert.ok(existsSync(new URL(`assets/card-banners/${name}.png`,root)));
for(const name of ['strength-v1','agility-v1','intellect-v1','universal-v1'])assert.ok(existsSync(new URL(`assets/card-symbols/${name}.png`,root)));
assert.match(html,/id="tutorial"/);
assert.match(app,/await continueAfterProgression\(\)/);
assert.match(app,/cardgame\.tutorial\.v1/);
assert.deepEqual(compactCardLabels(catalog.dodge),['Уклонение 1']);
assert.deepEqual(compactCardLabels(catalog['clever-feint']),['Урон 1','Бодрость 1']);
assert.match(cardFace(catalog.hit,{compact:true}),/card-chip">Урон 2/);
assert.ok(!cardFace(catalog.hit,{compact:true}).includes('физического урона'));
assert.deepEqual(describeParts(catalog['clever-feint']).map(part=>part.kind),['effect','bonus']);
assert.equal(describeParts(catalog['dirty-trick']).at(-1).title,'Оглушение 1');
assert.match(describeParts(catalog['left-hook'])[1].text,/отдельный удар 4 без усиления/);

console.log('PASS: release label, automatic progression hook, tutorial shell and compact card labels');
