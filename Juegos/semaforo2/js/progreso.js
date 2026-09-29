/* Progreso compartido. Cargar antes de menu.js o niveles.js. */
window.SemaforoProgreso = (() => {
  const KEY = 'semaforo-progress';
  const SOUND_KEY = 'semaforo-sound';
  const TOTAL = 10;
  function read() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || '{}');
      return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    } catch { return {}; }
  }
  function stars(level) {
    if (!Number.isInteger(level) || level < 1 || level > TOTAL) return 0;
    const value = Number(read()[level - 1] || 0);
    return Number.isFinite(value) ? Math.max(0, Math.min(3, Math.floor(value))) : 0;
  }
  function unlocked(level) {
    return Number.isInteger(level) && level >= 1 && level <= TOTAL &&
      (level === 1 || stars(level - 1) > 0);
  }
  function save(level, earned) {
    if (!Number.isInteger(level) || level < 1 || level > TOTAL) return false;
    const count = Number(earned);
    if (!Number.isFinite(count) || count < 1 || count > 3 || !unlocked(level)) return false;
    const data = read();
    data[level - 1] = Math.max(stars(level), Math.floor(count));
    try { localStorage.setItem(KEY, JSON.stringify(data)); return true; }
    catch { return false; }
  }
  function completed() { return Array.from({length: TOTAL}, (_, i) => stars(i + 1)).filter(n => n > 0).length; }
  function soundEnabled() { try { return localStorage.getItem(SOUND_KEY) === 'on'; } catch { return false; } }
  function setSound(enabled) { try { localStorage.setItem(SOUND_KEY, enabled ? 'on' : 'off'); } catch {} }
  return Object.freeze({TOTAL, stars, unlocked, save, completed, soundEnabled, setSound});
})();
