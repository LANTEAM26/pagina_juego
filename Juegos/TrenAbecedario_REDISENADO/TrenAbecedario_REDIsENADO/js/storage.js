const KEY='tren-abc-v3';const defaults=()=>({unlocked:6,stars:{},records:{},coins:0,train:'coral',settings:{music:true,sfx:true,hints:true,difficulty:'suave'}});
export function load(){try{const d=JSON.parse(localStorage.getItem(KEY));return {...defaults(),...d,settings:{...defaults().settings,...d?.settings}}}catch{return defaults()}}
export function save(d){try{localStorage.setItem(KEY,JSON.stringify(d))}catch{}}
export function record(d,station,stats){const key=String(station);const old=d.records[key];if(!old||stats.stars>old.stars||(stats.stars===old.stars&&stats.time<old.time))d.records[key]=stats;d.stars[key]=Math.max(d.stars[key]||0,stats.stars);d.unlocked=6;d.coins+=stats.stars*10;save(d)}
export function timeLabel(s){return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
