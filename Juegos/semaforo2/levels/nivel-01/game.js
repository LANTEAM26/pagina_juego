/* NIVEL 1 · CAMINO A CASA. No necesita imágenes ni audios para funcionar. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const W = 12, H = 8, CROSS_X = 5;
  const state = {x:1,y:1,dir:1,lives:3,mistakes:0,atCrossing:false,waited:false,crossed:false,paused:false,finished:false,phase:0,remaining:7,sound:false,carX:[0,11],lastMove:0,elapsed:0,startedAt:0,errorLog:[],safeCrossings:0,lastSignal:null,carStopped:[false,false]};
  const directions = [{dx:0,dy:-1,label:'↑ Norte',rotation:0},{dx:1,dy:0,label:'→ Este',rotation:90},{dx:0,dy:1,label:'↓ Sur',rotation:180},{dx:-1,dy:0,label:'← Oeste',rotation:270}];
  const playerFrames = ['atras.png','derecha.png','adelante.png','izquierda.png'];
  // Cada carril usa exclusivamente vehículos dibujados en su dirección.
  const VEHICULOS = [
    ['auto1_derecha.gif','auto2_derecha.gif','auto3_derecha.gif','auto4_derecha.gif','auto5_derecha.gif'],
    ['auto1_izquierda.gif','auto2_izquierda.gif','auto3_izquierda.gif','auto4_izquierda.gif','auto5_izquierda.gif']
  ];
  let nextVehicle = [0, 1];
  function changeVehicle(lane) {
    const img = $(lane === 0 ? 'car-one' : 'car-two').querySelector('img');
    img.src = `../assets/vehiculos/${VEHICULOS[lane][nextVehicle[lane]]}`;
    img.hidden = false;
    nextVehicle[lane] = (nextVehicle[lane] + 1) % VEHICULOS[lane].length;
  }
  const assets = {school:'colegio.png',home:'casa.png',tree:'arbol.png',light:'semaforo.png',tower:'edificio1.png',office:'edificio3.png',shop:'tienda1.png',cafe:'tienda3.png',store:'tienda2.png'};
  const walkers = {'8,1':'persona1.png','3,6':'persona2.png','9,5':'persona3.png'};
  const decor = {'1,0':'school','10,7':'home','0,0':'tree','3,0':'tower','5,0':'shop','8,0':'cafe','11,0':'tree','0,7':'tree','2,7':'office','5,7':'store','7,7':'tree','11,7':'tree','4,2':'light','6,5':'light','9,1':'tree'};
  const map = $('map');
  function tileType(x,y){if(y===3||y===4)return x===CROSS_X?'crosswalk':'road';if(y===1||y===2||y===5||y===6)return 'sidewalk';if(x===1&&y===0)return 'school';if(x===10&&y===7)return 'home';return 'grass';}
  function makeMap(){map.replaceChildren();for(let y=0;y<H;y++)for(let x=0;x<W;x++){const tile=document.createElement('div');const type=tileType(x,y);tile.className=`tile ${type}`;
      if(type==='road'){tile.classList.add('road-'+(y===3?'horizontal':'horizontal'));}
      if(type==='crosswalk')tile.classList.add('crossing-tile');tile.dataset.x=x;tile.dataset.y=y;const thing=decor[`${x},${y}`];
      if(thing && assets[thing]){tile.classList.add('decor-'+thing);const img=document.createElement('img');img.src=`../assets/decoracion/${assets[thing]}`;img.alt='';img.onerror=()=>img.remove();tile.append(img);}
      const walker=walkers[`${x},${y}`];if(walker){const npc=document.createElement('img');npc.className='npc';npc.src=`../assets/personajes/${walker}`;npc.alt='';npc.onerror=()=>npc.remove();tile.append(npc);}
      if(x===10&&y===6)tile.classList.add('destination');
      map.append(tile);}map.append($('player'),$('car-one'),$('car-two'));}
  function locate(el,x,y){el.style.left=`${x/W*100}%`;el.style.top=`${y/H*100}%`;}
  function draw(){locate($('player'),state.x,state.y);const playerImage=$('player').querySelector('img');const frame=`../assets/personajes/${playerFrames[state.dir]}`;if(playerImage.getAttribute('src')!==frame){playerImage.src=frame;playerImage.hidden=false;}/* Cambiar imagen solo al girar; al avanzar conserva el mismo frame. */$('direction').textContent=directions[state.dir].label;$('hearts').textContent='♥ '.repeat(state.lives)+'♡ '.repeat(3-state.lives);$('stars').textContent='★'.repeat(Math.max(1,3-Math.min(2,state.mistakes)))+'☆'.repeat(Math.min(2,state.mistakes));$('task-crosswalk').classList.toggle('done',state.atCrossing);$('task-crosswalk').textContent=(state.atCrossing?'✓ ':'○ ')+'Encuentra el paso peatonal';$('task-wait').classList.toggle('done',state.waited);$('task-wait').textContent=(state.waited?'✓ ':'○ ')+'Espera el verde peatonal y verifica los autos';$('task-home').classList.toggle('done',state.finished);$('task-home').textContent=(state.finished?'✓ ':'○ ')+'Llega a casa';$('position').textContent=state.y<=2?'Cerca de la escuela':state.y<=4?'Cruzando la avenida':'Cerca de casa';}
  /* Efectos generados por Web Audio: no requieren descargar archivos.
     La música de fondo sí es opcional y la pone la autora en levels/assets/audio/ciudad.mp3 */
  let audioCtx;
  function audioReady(){try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx;}catch{return null;}}
  function tone(freq,duration=.12,type='sine',volume=.10,delay=0){if(!state.sound)return;const a=audioReady();if(!a)return;const osc=a.createOscillator(),gain=a.createGain(),t=a.currentTime+delay;osc.type=type;osc.frequency.setValueAtTime(freq,t);gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(Math.max(.001,volume),t+.015);gain.gain.exponentialRampToValueAtTime(.001,t+duration);osc.connect(gain).connect(a.destination);osc.start(t);osc.stop(t+duration+.025);}
  function sfx(name){if(!state.sound)return;switch(name){
    case 'click':tone(470,.065,'sine',.045);break;
    case 'step':tone(240,.055,'triangle',.035);break;
    case 'correct':tone(523,.14,'sine',.11);tone(784,.2,'sine',.10,.14);break;
    case 'wrong':tone(310,.18,'sawtooth',.065);tone(205,.26,'triangle',.07,.17);break;
    case 'signal':tone(660,.10,'sine',.09);tone(880,.12,'sine',.08,.13);break;
    case 'signal-warning':tone(510,.12,'triangle',.07);tone(510,.12,'triangle',.07,.19);break;
    case 'signal-go':tone(750,.09,'sine',.09);tone(980,.13,'sine',.09,.13);tone(1180,.15,'sine',.08,.27);break;
    case 'win':[523,659,784,1047].forEach((f,i)=>tone(f,.26,'sine',.11,i*.17));tone(1047,.5,'triangle',.07,.76);break;
    case 'lose':[392,330,262,196].forEach((f,i)=>tone(f,.3,'triangle',.10,i*.23));break;
  }}
  function feedback(message,kind=''){const el=$('map-status'),panel=$('route-notice');el.textContent=message;panel.classList.remove('bad','good');if(kind)panel.classList.add(kind);}
  function phase(){return ['green','yellow','red'][state.phase];}
  // Cada auto conserva su posición. Se detiene antes del paso peatonal,
  // y si el amarillo lo sorprende dentro del cruce, primero lo despeja.
  const STOP_X=[3.65,7.35], CLEAR_X=[6.75,3.25];
  // Comprobamos la ocupación REAL del paso, no la posición de salida de cada coche.
  // Incluye el ancho visual del sprite: un auto que acaba de salir no bloquea el cruce.
  function carsClear(){return state.carX.every(x => x < 4.25 || x > 5.85);}
  function stopped(){return phase()==='red' && carsClear() && state.carStopped.every(Boolean);}
  function signal(){const p=phase(),safe=stopped();['red','yellow','green'].forEach(c=>$('car-'+c).classList.toggle('on',p===c));$('ped-stop').classList.toggle('on',!safe);$('ped-go').classList.toggle('on',safe);$('car-label').textContent=p==='red'?(safe?'DETENIDOS':'DESPEJANDO CRUCE'):p==='yellow'?'PRECAUCIÓN':'EN MARCHA';$('ped-label').textContent=safe?'PUEDES CRUZAR*':'ESPERA';$('countdown').textContent=state.remaining+' s';$('safety').textContent=safe?'Mira a ambos lados y comprueba que los autos estén detenidos.':p==='red'?'Espera a que los autos terminen de pasar y se detengan.':'El verde de los autos NO es el verde peatonal.';const panel=document.querySelector('.signals');panel.classList.toggle('ready',safe);panel.classList.toggle('waiting',p==='yellow'||p==='red'&&!safe);panel.classList.toggle('danger',p==='green');}
  function moveCars(){if(state.paused||state.finished)return;const p=phase(),speed=.20;
    for(let i=0;i<2;i++){
      let x=state.carX[i],dir=i===0?1:-1,stop=STOP_X[i],clear=CLEAR_X[i];
      const approaching=i===0?x<=stop:x>=stop;
      const crossing=i===0?x>stop&&x<clear:x<stop&&x>clear;
      if(p==='green'){
        state.carStopped[i]=false;x+=dir*speed;
        if(i===0&&x>12.5){x=-1.5;changeVehicle(i);}
        if(i===1&&x< -1.5){x=12.5;changeVehicle(i);}
      }else if(approaching){
        // Frenan progresivamente hasta la línea de detención; sin teletransporte.
        x=i===0?Math.min(stop,x+speed):Math.max(stop,x-speed);
        state.carStopped[i]=Math.abs(x-stop)<.01;
      }else if(crossing){
        // Terminan de despejar TODA la franja, incluido el ancho del vehículo.
        x+=dir*speed;state.carStopped[i]=false;
        if(i===0&&x>=clear){x=clear;state.carStopped[i]=true;}
        if(i===1&&x<=clear){x=clear;state.carStopped[i]=true;}
      }else state.carStopped[i]=true;
      state.carX[i]=x;
    }
    locate($('car-one'),state.carX[0],3);locate($('car-two'),state.carX[1],4);signal();
  }
  function tick(){if(state.paused||state.finished)return;
    if(state.y===3||state.y===4){state.phase=2;state.remaining=Math.max(4,state.remaining);}
    else if(state.phase===2&&!stopped()){
      // La fase peatonal no empieza hasta que la avenida esté despejada.
      state.remaining=Math.max(1,state.remaining);
    }else{state.remaining--;if(state.remaining<=0){state.phase=(state.phase+1)%3;state.remaining=[8,3,9][state.phase];sfx(state.phase===2?'signal-go':state.phase===1?'signal-warning':'signal');if(state.phase===2)feedback('Semáforo de autos en rojo. Espera a que se detengan y mira a ambos lados.','good');else if(state.phase===0)feedback('Verde para AUTOS: permanece en la acera.');else feedback('Amarillo para autos: espera, todavía no puedes cruzar.');}}
    signal();
  }
  function error(message,penalty=false,lesson=''){feedback(message,'bad');sfx('wrong');if(penalty){state.lives--;state.mistakes++;state.errorLog.push({time:state.elapsed,message:lesson||message});if(state.lives<=0){state.finished=true;state.paused=false;$('lose-text').textContent='Esta vez se terminaron tus tres oportunidades. ¡Repasemos las señales para intentarlo otra vez!';$('lose-errors').replaceChildren(...state.errorLog.map((item,i)=>{const el=document.createElement('p');el.textContent=`${i+1}. ${clock(item.time)} — ${item.message}`;return el;}));sfx('lose');$('lose-overlay').hidden=false;}}draw();}
  function clock(s){return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
  function turn(delta){if(state.paused||state.finished)return;state.dir=(state.dir+delta+4)%4;sfx('click');draw();}
  function step(backward=false){if(state.paused||state.finished)return;if(Date.now()-state.lastMove<145)return;state.lastMove=Date.now();const d=directions[state.dir],factor=backward?-1:1,nx=state.x+d.dx*factor,ny=state.y+d.dy*factor;if(nx<0||nx>=W||ny<0||ny>=H){error('¡Ese camino termina aquí! Busca otra dirección.');return;}const type=tileType(nx,ny);if(type==='grass'||type==='school'||type==='home'){error('Camina por la acera, no por los jardines.');return;}if(type==='road'){error('¡Alto! Cruzar fuera de las franjas blancas es peligroso. Busca el paso peatonal.',true,'Intentaste cruzar fuera del paso peatonal. Usa siempre las franjas blancas.');return;}if(type==='crosswalk'){
      if(state.y===2&&ny===3){if(!stopped()){error(phase()==='green'?'¡Alto! Ese verde es para los AUTOS, no para los peatones.':phase()==='yellow'?'¡Espera! El amarillo de los autos NO te permite cruzar.':'¡Espera! Aunque los autos tengan rojo, comprueba que ya se detuvieron.',true,phase()==='green'?'Intentaste cruzar con verde para autos. Debes esperar el verde PEATONAL.':phase()==='yellow'?'Intentaste cruzar con amarillo para autos. Espera el verde PEATONAL.':'Intentaste cruzar antes de que los autos estuvieran completamente detenidos.');return;}state.atCrossing=true;state.waited=true;feedback('¡Bien! Los autos están detenidos. Cruza por las franjas blancas.','good');sfx('correct');}
      else if(state.y===5&&ny===4){error('Tu casa está al sur. Usa el cruce cuando necesites regresar.');return;}
      else if(state.y===3||state.y===4){if(nx!==CROSS_X){error('Mantente dentro de las franjas blancas.');return;}}
      else{error('Acércate al paso peatonal desde la acera.');return;}
    }
    if((state.y===3||state.y===4)&&nx!==CROSS_X){error('Termina de cruzar en línea recta.');return;}
    state.x=nx;state.y=ny;if(ny===2&&!state.crossed)state.atCrossing=true;if(ny===5&&state.waited&&!state.crossed){state.crossed=true;state.safeCrossings++;feedback('¡Excelente! Cruzaste por las franjas blancas con el verde peatonal. Ahora ve a casa.','good');sfx('correct');}
    if(nx===CROSS_X&&ny===2){state.atCrossing=true;feedback('¡Encontraste el cruce! Espera el verde peatonal y mira los autos.','good');}
    if(nx===10&&ny===6&&state.crossed){win();return;}sfx('step');draw();}
  function win(){state.finished=true;draw();const stars=Math.max(1,3-Math.min(2,state.mistakes));$('final-stars').textContent='★'.repeat(stars)+'☆'.repeat(3-stars);$('win-text').textContent=stars===3?'¡Fantástico! Esperaste el momento seguro y llegaste sin errores.':'¡Llegaste! Repasa estas señales para hacerlo todavía mejor la próxima vez.';$('win-time').textContent=clock(state.elapsed);$('win-errors').textContent=state.mistakes;$('win-crosses').textContent=state.safeCrossings;const lessons=$('win-lessons');lessons.replaceChildren();if(!state.errorLog.length){const el=document.createElement('p');el.className='lesson-ok';el.textContent='¡Sin errores! Identificaste el paso peatonal y esperaste tu turno.';lessons.append(el);}else state.errorLog.forEach((item,i)=>{const el=document.createElement('p');el.className='lesson-bad';el.textContent=`${i+1}. En ${clock(item.time)}: ${item.message}`;lessons.append(el);});if(window.SemaforoProgreso){window.SemaforoProgreso.save(1,stars);}sfx('win');$('win-overlay').hidden=false;}
  function reset(){nextVehicle=[0,1];changeVehicle(0);changeVehicle(1);Object.assign(state,{x:1,y:1,dir:1,lives:3,mistakes:0,atCrossing:false,waited:false,crossed:false,paused:false,finished:false,phase:0,remaining:7,carX:[0,11],lastMove:0,elapsed:0,startedAt:Date.now(),errorLog:[],safeCrossings:0,lastSignal:null,carStopped:[false,false]});['pause-overlay','win-overlay','lose-overlay'].forEach(id=>$(id).hidden=true);feedback('¡Camina por la acera hasta el paso peatonal!');draw();signal();moveCars();}
  function pause(toggle){if(state.finished)return;state.paused=toggle;$('pause-overlay').hidden=!toggle;}
  function sound(toggle){state.sound=toggle;$('sound').textContent=toggle?'SONIDO ON':'SONIDO OFF';$('sound').setAttribute('aria-label',toggle?'Silenciar':'Activar sonido');window.SemaforoProgreso?.setSound(toggle);if(toggle){audioReady();sfx('click');}const music=$('music');music.volume=.25;if(toggle)music.play().catch(()=>{});else music.pause();}
  function orientation(){ $('rotate').hidden=!(matchMedia('(orientation: portrait)').matches&&innerWidth<750); }
  $('left').addEventListener('click',()=>turn(-1));$('right').addEventListener('click',()=>turn(1));$('forward').addEventListener('click',()=>step());$('backward').addEventListener('click',()=>step(true));$('pause').addEventListener('click',()=>pause(true));$('resume').addEventListener('click',()=>pause(false));$('restart-pause').addEventListener('click',reset);$('again').addEventListener('click',reset);$('retry').addEventListener('click',reset);$('sound').addEventListener('click',()=>sound(!state.sound));
  document.addEventListener('keydown',e=>{if(state.sound)audioReady();if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','w','a','s','d','W','A','S','D'].includes(e.key))e.preventDefault();if(state.paused||state.finished)return;if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')turn(-1);else if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')turn(1);else if(e.key==='ArrowUp'||e.key===' '||e.key.toLowerCase()==='w')step();else if(e.key==='ArrowDown'||e.key.toLowerCase()==='s')step(true);});
  function makeLeaves(){const holder=$('autumn-leaves');for(let i=0;i<17;i++){const leaf=document.createElement('i');leaf.className='falling-leaf';leaf.style.setProperty('--x',((i*61+13)%100)+'%');leaf.style.setProperty('--delay',(-i*.83)+'s');leaf.style.setProperty('--duration',(9+i%6*1.4)+'s');leaf.style.setProperty('--size',(9+i%4*4)+'px');holder.append(leaf);}}
  makeLeaves();makeMap();reset();sound(window.SemaforoProgreso?.soundEnabled()!==false);document.addEventListener('pointerdown',()=>{const m=$('music');if(state.sound&&m.paused)m.play().catch(()=>{})},{passive:true});orientation();addEventListener('resize',orientation);setInterval(()=>{if(!state.paused&&!state.finished){state.elapsed++;tick();}},1000);setInterval(moveCars,350);
})();
