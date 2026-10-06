(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const playArea = $("playArea"), cat = $("cat"), feedback = $("feedback");
  const startScreen = $("startScreen"), howScreen = $("howScreen"), gameOverScreen = $("gameOverScreen");
  const hud = $("hud"), controls = $("mobileControls");

  const state = {
    running:false, score:0, lives:3, fish:0, gold:0, elapsed:0,
    catX:50, direction:0, speed:42, objects:[], spawnTimer:0,
    lastTime:0, startedAt:0, animationId:null
  };

  const keys = { left:false, right:false };

  function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  }

  function updateHUD() {
    $("score").textContent = state.score;
    $("lives").textContent = state.lives;
    $("fishCount").textContent = state.fish;
    $("time").textContent = formatTime(state.elapsed);
  }

  function resetGame() {
    state.score=0; state.lives=3; state.fish=0; state.gold=0; state.elapsed=0;
    state.catX=50; state.spawnTimer=0; state.lastTime=performance.now();
    state.objects.forEach(o=>o.el.remove()); state.objects=[];
    cat.style.left="50%";
    updateHUD();
  }

  function startGame() {
    cancelAnimationFrame(state.animationId);
    resetGame();
    startScreen.classList.add("hidden");
    howScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    hud.classList.remove("hidden");
    cat.classList.remove("hidden");
    controls.classList.remove("hidden");
    state.running=true;
    state.startedAt=performance.now();
    GameAudio.start();
    state.animationId=requestAnimationFrame(loop);
  }

  function goHome() {
    state.running=false;
    cancelAnimationFrame(state.animationId);
    state.objects.forEach(o=>o.el.remove()); state.objects=[];
    gameOverScreen.classList.add("hidden");
    hud.classList.add("hidden"); cat.classList.add("hidden"); controls.classList.add("hidden");
    startScreen.classList.remove("hidden");
  }

  function chooseType() {
    const r=Math.random();
    if(r < .12) return "water";
    if(r < .17) return "gold";
    if(r < .38) return "special";
    return "fish";
  }

  function spawnObject() {
    if(!state.running) return;
    const type=chooseType();
    const el=document.createElement("div");
    el.className=`falling ${type}`;
    el.textContent=type==="water"?"💧":type==="special"?"🐠":"🐟";
    const x=5+Math.random()*90;
    const difficulty=Math.min(1.8,state.elapsed/75);
    const base=type==="gold"?19:23;
    const speed=base+Math.random()*11+difficulty*12;
    el.style.left=`${x}%`;
    el.style.top="-75px";
    playArea.appendChild(el);
    state.objects.push({el,type,x,y:-75,speed,dead:false});
  }

  function showFeedback(text, color="#fff") {
    feedback.textContent=text;
    feedback.style.color=color;
    feedback.classList.remove("feedback-pop");
    void feedback.offsetWidth;
    feedback.classList.add("feedback-pop");
  }

  function rectsOverlap(a,b) {
    return !(a.right<b.left || a.left>b.right || a.bottom<b.top || a.top>b.bottom);
  }

  function collect(obj) {
    if(obj.dead) return;
    obj.dead=true;
    obj.el.classList.add("caught");

    if(obj.type==="water") {
      state.lives--;
      showFeedback("¡Splash! -1 ❤️","#4fc8ff");
      GameAudio.hit();
      cat.classList.remove("hit"); void cat.offsetWidth; cat.classList.add("hit");
      if(state.lives<=0) setTimeout(endGame,220);
    } else {
      const pts=obj.type==="gold"?5:obj.type==="special"?2:1;
      state.score+=pts; state.fish++;
      if(obj.type==="gold") {
        state.gold++; showFeedback("¡DORADO! +5 ✨","#ffd83d"); GameAudio.gold();
      } else if(obj.type==="special") {
        showFeedback("+2 🐠","#ff8f5c"); GameAudio.special();
      } else {
        showFeedback("+1 🐟","#ffffff"); GameAudio.fish();
      }
    }
    updateHUD();
    setTimeout(()=>obj.el.remove(),300);
  }

  function endGame() {
    if(!state.running) return;
    state.running=false;
    GameAudio.gameOver();
    $("finalScore").textContent=state.score;
    $("finalFish").textContent=state.fish;
    $("finalGold").textContent=state.gold;
    $("finalTime").textContent=formatTime(state.elapsed);
    controls.classList.add("hidden");
    gameOverScreen.classList.remove("hidden");
  }

  function update(dt) {
    state.elapsed=(performance.now()-state.startedAt)/1000;

    state.direction=(keys.left?-1:0)+(keys.right?1:0);
    state.catX += state.direction*state.speed*dt;
    state.catX=Math.max(4,Math.min(96,state.catX));
    cat.style.left=`${state.catX}%`;

    // Más objetos gradualmente, sin saltos bruscos.
    const interval=Math.max(.42,1.05-state.elapsed*.006);
    state.spawnTimer+=dt;
    if(state.spawnTimer>=interval) {
      state.spawnTimer=0;
      spawnObject();
      if(state.elapsed>45 && Math.random()<.13) setTimeout(spawnObject,160);
    }

    const catRect=cat.getBoundingClientRect();
    const areaRect=playArea.getBoundingClientRect();

    state.objects.forEach(obj=>{
      if(obj.dead) return;
      obj.y += obj.speed*dt*(areaRect.height/100);
      obj.el.style.top=`${obj.y}px`;
      const r=obj.el.getBoundingClientRect();
      if(rectsOverlap(r,catRect)) collect(obj);
      if(obj.y>areaRect.height+90) {
        obj.dead=true; obj.el.remove();
      }
    });
    state.objects=state.objects.filter(o=>!o.dead || document.body.contains(o.el));
    updateHUD();
  }

  function loop(now) {
    if(!state.running) return;
    const dt=Math.min(.035,(now-state.lastTime)/1000 || 0);
    state.lastTime=now;
    update(dt);
    state.animationId=requestAnimationFrame(loop);
  }

  function setKey(side,value) {
    keys[side]=value;
    const btn=side==="left"?$("leftBtn"):$("rightBtn");
    btn.classList.toggle("pressed",value);
  }

  document.addEventListener("keydown",e=>{
    if(["ArrowLeft","ArrowRight","a","A","d","D"].includes(e.key)) e.preventDefault();
    if(e.key==="ArrowLeft"||e.key.toLowerCase()==="a") setKey("left",true);
    if(e.key==="ArrowRight"||e.key.toLowerCase()==="d") setKey("right",true);
  });
  document.addEventListener("keyup",e=>{
    if(e.key==="ArrowLeft"||e.key.toLowerCase()==="a") setKey("left",false);
    if(e.key==="ArrowRight"||e.key.toLowerCase()==="d") setKey("right",false);
  });

  [["leftBtn","left"],["rightBtn","right"]].forEach(([id,side])=>{
    const b=$(id);
    ["pointerdown","touchstart"].forEach(ev=>b.addEventListener(ev,e=>{e.preventDefault();setKey(side,true)},{passive:false}));
    ["pointerup","pointercancel","pointerleave","touchend"].forEach(ev=>b.addEventListener(ev,e=>{e.preventDefault();setKey(side,false)},{passive:false}));
  });

  $("playBtn").addEventListener("click",startGame);
  $("playFromHowBtn").addEventListener("click",startGame);
  $("restartBtn").addEventListener("click",startGame);
  $("homeBtn").addEventListener("click",goHome);
  $("howBtn").addEventListener("click",()=>{startScreen.classList.add("hidden");howScreen.classList.remove("hidden")});
  $("closeHowBtn").addEventListener("click",()=>{howScreen.classList.add("hidden");startScreen.classList.remove("hidden")});
  $("soundBtn").addEventListener("click",()=>{
    const enabled=GameAudio.toggle();
    $("soundBtn").textContent=enabled?"🔊":"🔇";
  });

  window.addEventListener("blur",()=>{keys.left=false;keys.right=false});
  updateHUD();
})();
