RL.readStore=function(){try{return JSON.parse(localStorage.getItem('robotlab-v2')||'{}')}catch{return {}}};
RL.writeStore=function(d){try{localStorage.setItem('robotlab-v2',JSON.stringify(d))}catch{}};
RL.getUnlocked=function(){return RL.readStore().unlocked||[]};
RL.unlock=function(id){let d=RL.readStore();d.unlocked=[...new Set([...(d.unlocked||[]),id])];RL.writeStore(d)};
RL.getScores=function(){return RL.readStore().scores||{}};
RL.saveScore=function(k,v){let d=RL.readStore();d.scores=d.scores||{};d.scores[k]=Math.max(v,d.scores[k]||0);RL.writeStore(d)};
