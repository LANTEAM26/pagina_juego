RL.soundPreference=function(){try{return localStorage.getItem('robotlab-sound')||'on'}catch{return RL.soundOff?'off':'on'}};
RL.setSound=function(on){RL.soundOff=!on;try{localStorage.setItem('robotlab-sound',on?'on':'off')}catch{}};
RL.tone=function(frequency,duration=.12,delay=0){if(RL.soundPreference()==='off')return;try{const ctx=RL.ctx||(RL.ctx=new(window.AudioContext||window.webkitAudioContext)());if(ctx.state==='suspended')ctx.resume();const o=ctx.createOscillator(),g=ctx.createGain(),at=ctx.currentTime+delay;o.connect(g);g.connect(ctx.destination);o.type='sine';o.frequency.setValueAtTime(frequency,at);g.gain.setValueAtTime(.045,at);g.gain.exponentialRampToValueAtTime(.001,at+duration);o.start(at);o.stop(at+duration+.01)}catch{}};
RL.beep=function(good){RL.tone(good?660:220);if(good)RL.tone(880,.1,.07)};
RL.celebrate=function(){[523,659,784,1047].forEach((n,i)=>RL.tone(n,.2,i*.12))};
