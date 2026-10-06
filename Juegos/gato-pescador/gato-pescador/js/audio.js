// Audio simple generado con Web Audio API.
// Si luego agregas archivos reales en assets/music y assets/sounds,
// puedes sustituir estas funciones por elementos <audio>.
const GameAudio = (() => {
  let ctx = null;
  let enabled = true;

  function context() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq = 440, duration = 0.12, type = "sine", volume = 0.08, endFreq = null) {
    if (!enabled) return;
    const c = context();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, c.currentTime + duration);
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(); osc.stop(c.currentTime + duration);
  }

  return {
    toggle() { enabled = !enabled; return enabled; },
    isEnabled() { return enabled; },
    fish() { tone(520,.09,"sine",.07,720); setTimeout(()=>tone(720,.08,"sine",.05,880),60); },
    special() { tone(600,.1,"triangle",.08,900); setTimeout(()=>tone(850,.12,"triangle",.06,1100),70); },
    gold() { [660,880,1100].forEach((f,i)=>setTimeout(()=>tone(f,.16,"sine",.07,f*1.15),i*75)); },
    hit() { tone(180,.3,"sawtooth",.06,80); },
    gameOver() { tone(320,.22,"triangle",.06,220); setTimeout(()=>tone(220,.35,"triangle",.06,110),180); },
    start() { tone(440,.1,"sine",.05,660); setTimeout(()=>tone(660,.14,"sine",.06,880),80); }
  };
})();
