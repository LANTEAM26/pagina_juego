(()=>{'use strict';
const base=new URL('../../../',document.currentScript.src);window.BIBLIOTECA_BASE=base.href;
const path=s=>new URL(s,base).href;let saved={};try{saved=JSON.parse(localStorage.getItem('biblioteca-audio')||'{}')}catch{}
const state={enabled:saved.enabled!==false,volume:Number.isFinite(saved.volume)?saved.volume:18,voice:Number.isFinite(saved.voice)?saved.voice:85,track:Math.max(0,Math.min(5,saved.track||0))};
const tracks=[['Morning at the Edge of the Woods','El despertar del bosque · Principal','Morning_at_the_Edge_of_the_Woods.mp3'],['Golden Straw and Brick','Paja dorada y ladrillos','Golden_Straw_and_Brick.mp3'],['Tales Beneath the Lamp','Historias bajo la lámpara','Tales_Beneath_the_Lamp.mp3'],['Beyond the Gilded Spine','Un mundo entre las páginas','Beyond_the_Gilded_Spine.mp3'],['Vals de otoño','Un paseo entre hojas doradas','musica-otono.mp3'],['Vals del bosque','Melodías entre los árboles','musica-bosque.mp3']];
const host=document.querySelector('#musicControls');if(!host)return;
host.innerHTML=`<details id="musicMenu" class="toolbar-menu"><summary id="musicSummary"></summary><div class="menu-panel music-panel" role="group" aria-label="Música de fondo"><div class="menu-heading music-heading"><span>Sonidos para leer</span><button id="musicToggle" type="button"></button></div><div id="playlist">${tracks.map((t,i)=>`<button type="button" class="track-option" data-track="${i}"><span class="option-icon" aria-hidden="true">♫</span><span><strong>${t[0]}</strong><small>${t[1]}</small></span><span class="option-check">✓</span></button>`).join('')}</div><label class="volume-label" for="volume">Música <output id="volumeValue"></output></label><input id="volume" aria-label="Volumen de música" type="range" min="0" max="100" value="${state.volume}"><p id="musicStatus" class="menu-note" role="status"></p></div></details>`;
const $=s=>document.querySelector(s),audio=$('#bgm')||document.body.appendChild(Object.assign(document.createElement('audio'),{id:'bgm',loop:true}));audio.loop=true;audio.preload='metadata';audio.src=path('assets/audio/musica/'+tracks[state.track][2]);audio.volume=state.volume/100;
let ducked=false,fade=0;const save=()=>{try{localStorage.setItem('biblioteca-audio',JSON.stringify(state))}catch{}};
function volume(){cancelAnimationFrame(fade);const start=audio.volume,target=state.volume/100*(ducked?.23:1),at=performance.now();const step=t=>{const k=Math.min(1,(t-at)/200);audio.volume=Math.max(0,Math.min(1,start+(target-start)*k));if(k<1)fade=requestAnimationFrame(step)};fade=requestAnimationFrame(step);}
function ui(){
 $('#musicToggle').textContent=state.enabled?'Encendida':'Apagada';$('#musicToggle').setAttribute('aria-pressed',String(state.enabled));$('#musicSummary').innerHTML=`♫ Música · ${state.enabled?'Encendida':'Apagada'} <span aria-hidden="true">⌃</span>`;$('#volumeValue').textContent=state.volume+'%';
 document.querySelectorAll('[data-track]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.track===state.track)));
}
async function ensure(){if(!state.enabled||!audio.paused)return;try{await audio.play();$('#musicStatus').textContent='Sonando: '+tracks[state.track][0];volume();}catch{$('#musicStatus').textContent='La música comienza al tocar un libro.';}}
$('#musicToggle').onclick=()=>{state.enabled=!state.enabled;if(state.enabled)ensure();else{audio.pause();$('#musicStatus').textContent='Música apagada.';}save();ui();};
$('#volume').oninput=e=>{state.volume=+e.target.value;volume();ui();save()};
for(const b of document.querySelectorAll('[data-track]'))b.onclick=()=>{state.track=+b.dataset.track;audio.src=path('assets/audio/musica/'+tracks[state.track][2]);if(state.enabled)ensure();save();ui();};
audio.onerror=()=>{$('#musicStatus').textContent='No se pudo abrir esta pista. Puedes elegir otra.'};
document.addEventListener('click',()=>{if(state.enabled&&audio.paused)ensure();});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.toolbar-menu'))document.querySelectorAll('.toolbar-menu').forEach(el=>el.open=false);});
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.toolbar-menu').forEach(el=>el.open=false);});
for(const el of document.querySelectorAll('.toolbar-menu'))el.addEventListener('toggle',()=>{if(el.open)for(const other of document.querySelectorAll('.toolbar-menu'))if(el!==other)other.open=false;});
window.BibliotecaAudio={ensure,duck(value){ducked=Boolean(value);volume()},voice(){return state.voice/100},setVoice(v){state.voice=Math.max(0,Math.min(100,v));save()},path,stop(){audio.pause()}};
window.addEventListener('pagehide',()=>{audio.pause();save()});ui();ensure();
})();
