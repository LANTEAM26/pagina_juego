/* Menú principal: sonido, créditos y aviso de orientación. */
document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const progress = window.SemaforoProgreso;
  const music = $('menu-music');
  const soundButton = $('sound-toggle');
  const credits = $('credits-dialog');
  const overlay = $('rotate-overlay');
  let soundOn = progress.soundEnabled();

  function updateSoundButton() {
    soundButton.textContent = soundOn ? '🔊' : '🔇';
    soundButton.setAttribute('aria-pressed', String(soundOn));
    soundButton.setAttribute('aria-label', soundOn ? 'Silenciar música' : 'Activar música');
  }
  async function playMusic() {
    if (!soundOn || !music) return;
    music.volume = 0.45;
    try { await music.play(); } catch { /* El navegador puede requerir interacción. */ }
  }
  soundButton.addEventListener('click', () => {
    soundOn = !soundOn;
    progress.setSound(soundOn);
    updateSoundButton();
    if (soundOn) void playMusic(); else music?.pause();
  });
  updateSoundButton();
  if (soundOn) void playMusic();

  $('credits-open')?.addEventListener('click', () => {
    if (typeof credits?.showModal === 'function') credits.showModal();
    else if (credits) credits.setAttribute('open', '');
  });

  function checkOrientation() {
    if (!overlay) return;
    overlay.hidden = !(matchMedia('(orientation: portrait)').matches &&
      matchMedia('(max-width: 900px)').matches);
  }
  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', checkOrientation);
  checkOrientation();
});
