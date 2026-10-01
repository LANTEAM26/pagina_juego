export const ABC=[...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'];
export const STATIONS=[
 {name:'Valle de las vocales',icon:'🌼',scene:'valley',mode:'complete',pool:[...'AEIOU'],rounds:4,count:3,desc:'Completa pequeñas secuencias de vocales.'},
 {name:'Bosque alfabético',icon:'🌳',scene:'forest',mode:'complete',pool:ABC,rounds:5,count:5,desc:'Encuentra las letras que faltan.'},
 {name:'Ciudad de las letras',icon:'🏘️',scene:'town',mode:'order',pool:ABC,rounds:5,count:5,desc:'Ordena los vagones del tren.'},
 {name:'Montaña minúscula',icon:'🏔️',scene:'mountain',mode:'complete',pool:ABC.map(x=>x.toLowerCase()),rounds:5,count:5,desc:'Completa el recorrido en minúsculas.'},
 {name:'Puente arcoíris',icon:'🌈',scene:'rainbow',mode:'match',pool:ABC,rounds:7,count:1,desc:'Relaciona las mayúsculas y minúsculas.'},
 {name:'Estación dorada',icon:'🏰',scene:'gold',mode:'mixed',pool:ABC,rounds:8,count:5,desc:'¡El desafío final de las letras!'}
];
export function makeRound(station,index){const s=STATIONS[station];const mode=s.mode==='mixed'?['complete','match','order'][index%3]:s.mode;const pool=s.pool;const count=mode==='match'?1:Math.min(s.count,pool.length);const start=Math.floor(Math.random()*(pool.length-count+1));const sequence=pool.slice(start,start+count);if(mode==='match'){const target=sequence[0];const options=new Set([target.toLowerCase()]);while(options.size<Math.min(4,pool.length)){options.add(pool[Math.floor(Math.random()*pool.length)].toLowerCase())}return {mode,target,options:shuffle([...options]),sequence:[target],missing:[0]};}if(mode==='order'){return {mode,sequence,options:shuffle([...sequence]),missing:sequence.map((_,i)=>i)};}const missingCount=station===0?1:station===1?2:Math.min(3,Math.ceil(count/2));const missing=shuffle(sequence.map((_,i)=>i)).slice(0,missingCount).sort((a,b)=>a-b);const options=missing.map(i=>sequence[i]);while(options.length<Math.min(6,pool.length)){let x=pool[Math.floor(Math.random()*pool.length)];if(!options.includes(x))options.push(x)}return {mode,sequence,options:shuffle(options),missing};}
export function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
