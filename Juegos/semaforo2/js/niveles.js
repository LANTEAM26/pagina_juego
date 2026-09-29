/* Selector de niveles, presentación de misiones e instrucciones. */
document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const progress = window.SemaforoProgreso;
  const LEVELS = [
    {title:'Camino a casa',story:'Saliste de la escuela. ¡Tu familia te espera! Busca el paso peatonal y cruza la avenida de forma segura.',objectives:['Encuentra el paso peatonal.','Espera la señal peatonal verde.','Cruza y llega hasta tu familia.'],tip:'Los autos deben estar completamente detenidos antes de que cruces.'},
    {title:'La gran avenida',story:'Debes llegar a la biblioteca atravesando dos calles con semáforos independientes.',objectives:['Encuentra los dos cruces.','Observa la señal correspondiente a cada cruce.','Llega a la biblioteca.'],tip:'Cada semáforo controla su propio cruce.'},
    {title:'Un día en el parque',story:'¡Es hora de jugar! Algunos autos giran cerca del parque.',objectives:['Encuentra el parque.','Observa los autos que giran.','Cruza cuando todos hayan cedido el paso.'],tip:'Aunque tengas verde peatonal, comprueba que los autos que giran se detengan.'},
    {title:'La calle escondida',story:'Visita a tu amigo sin cruzar entre los autos estacionados.',objectives:['Busca un cruce visible.','Evita pasar entre vehículos estacionados.','Llega a casa de tu amigo.'],tip:'Los vehículos estacionados pueden impedir que te vean.'},
    {title:'Ayuda a tu hermanito',story:'Acompaña a tu hermanito desde el parque hasta casa.',objectives:['Mantente junto a tu hermanito.','Esperen juntos la señal segura.','Lleguen juntos a casa.'],tip:'Si no hay tiempo suficiente para cruzar juntos, esperen el siguiente ciclo.'},
    {title:'El cruce complicado',story:'Una gran intersección separa tu casa del mercado.',objectives:['Identifica la señal de tu cruce.','Observa los vehículos que giran.','Cruza la intersección con seguridad.'],tip:'El verde de otra dirección no significa que puedas cruzar.'},
    {title:'Los mandados de mamá',story:'¡Mamá necesita tu ayuda! Visita el supermercado, la biblioteca y la panadería antes de regresar a casa.',objectives:['Compra leche y huevos en el supermercado.','Devuelve un libro en la biblioteca.','Recoge el pan y regresa a casa.'],tip:'Puedes elegir el orden de los tres mandados, pero siempre debes cruzar de forma segura.',special:true},
    {title:'Un día de lluvia',story:'Llueve y los autos necesitan más espacio para detenerse.',objectives:['Evita los charcos y obstáculos.','Comprueba que los autos se detengan por completo.','Regresa a casa.'],tip:'Con lluvia, la visibilidad y el frenado de los vehículos pueden empeorar.'},
    {title:'La ruta bloqueada',story:'Unas obras han cerrado la acera. ¡Busca un camino alternativo!',objectives:['Reconoce las barreras.','Encuentra un desvío seguro.','Llega a tu destino sin caminar por la calzada.'],tip:'No entres en una zona de obras ni camines entre vehículos.'},
    {title:'Regreso al anochecer',story:'Empieza a oscurecer. Busca calles iluminadas para volver con tu familia.',objectives:['Camina por las aceras.','Elige cruces visibles e iluminados.','Regresa a casa.'],tip:'Ser visible y observar el tránsito es especialmente importante al anochecer.'}
  ];
  const IMPLEMENTED_LEVELS = new Set([1]); // Añade aquí los números conforme programes sus carpetas.
  const grid = $('level-grid');
  const music = $('menu-music');
  const soundButton = $('sound-toggle');
  const overlay = $('rotate-overlay');
  let selected = 1;
  let soundOn = progress.soundEnabled();

  function show(id) {
    ['levels-screen','mission-screen','tutorial-screen'].forEach(screen => {
      $(screen).hidden = screen !== id;
    });
  }
  function isAvailable(level) { return progress.unlocked(level) && IMPLEMENTED_LEVELS.has(level); }
  function renderLevels() {
    grid.replaceChildren();
    $('completed-count').textContent = `${progress.completed()}/${LEVELS.length}`;
    LEVELS.forEach((level, index) => {
      const number = index + 1;
      const unlocked = progress.unlocked(number);
      const available = isAvailable(number);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'level-card' + (!unlocked ? ' locked' : '') + (level.special ? ' special' : '');
      // Los niveles futuros se pueden inspeccionar, pero no iniciar todavía.
      const art = document.createElement('div'); art.className = 'card-art';
      const img = document.createElement('img');
      img.src = `assets/images/nivel-${String(number).padStart(2,'0')}.png`;
      img.alt = ''; img.loading = 'lazy'; img.onerror = () => { img.hidden = true; };
      art.append(img);
      if (!unlocked) { const lock = document.createElement('span'); lock.className = 'lock'; lock.textContent = '🔒'; art.append(lock); }
      const body = document.createElement('div'); body.className = 'card-body';
      const num = document.createElement('small'); num.textContent = `NIVEL ${number}`;
      const title = document.createElement('strong'); title.textContent = level.title;
      const stars = document.createElement('span'); stars.className = 'card-stars';
      const earned = progress.stars(number);
      stars.textContent = available ? '★'.repeat(earned) + '☆'.repeat(3 - earned) :
        unlocked ? 'PRÓXIMAMENTE' : 'BLOQUEADO';
      body.append(num, title, stars); card.append(art, body);
      card.addEventListener('click', () => openMission(number));
      grid.append(card);
    });
  }
  function openMission(number) {
    selected = number;
    const level = LEVELS[number - 1];
    $('mission-number').textContent = `NIVEL ${number}`;
    $('mission-title').textContent = level.title;
    $('mission-story').textContent = level.story;
    const image = $('mission-image');
    image.hidden = false;
    image.src = `assets/images/nivel-${String(number).padStart(2,'0')}.png`;
    image.onerror = () => { image.hidden = true; };
    const objectives = $('mission-objectives'); objectives.replaceChildren();
    level.objectives.forEach(objective => {
      const li = document.createElement('li'); li.textContent = objective; objectives.append(li);
    });
    const available = isAvailable(number);
    $('mission-note').textContent = !progress.unlocked(number) ? 'Completa el nivel anterior para desbloquear esta misión.' :
      !IMPLEMENTED_LEVELS.has(number) ? 'Este nivel todavía está en desarrollo.' :
      'Antes de jugar, verás las instrucciones del nivel.';
    $('mission-play').disabled = !available;
    $('mission-play').textContent = available ? '▶ ¡JUGAR!' : '🚧 NIVEL NO DISPONIBLE';
    $('tutorial-specific').textContent = level.tip;
    $('tutorial-start').href = `levels/nivel-${String(number).padStart(2,'0')}/index.html`;
    show('mission-screen');
  }
  $('mission-back').addEventListener('click', () => { renderLevels(); show('levels-screen'); });
  $('mission-play').addEventListener('click', () => { if (isAvailable(selected)) show('tutorial-screen'); });
  $('tutorial-back').addEventListener('click', () => show('mission-screen'));
  $('tutorial-start').addEventListener('click', event => {
    if (!isAvailable(selected)) event.preventDefault();
  });

  function paintSound() {
    soundButton.textContent = soundOn ? '🔊' : '🔇';
    soundButton.setAttribute('aria-pressed', String(soundOn));
    soundButton.setAttribute('aria-label', soundOn ? 'Silenciar música' : 'Activar música');
  }
  async function playMusic() {
    if (!soundOn || !music) return;
    music.volume = 0.45;
    try { await music.play(); } catch { /* El audio es opcional. */ }
  }
  soundButton.addEventListener('click', () => {
    soundOn = !soundOn; progress.setSound(soundOn); paintSound();
    if (soundOn) void playMusic(); else music?.pause();
  });
  paintSound();
  if (soundOn) void playMusic();
  function checkOrientation() {
    overlay.hidden = !(matchMedia('(orientation: portrait)').matches && matchMedia('(max-width: 900px)').matches);
  }
  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', checkOrientation);
  checkOrientation();
  renderLevels();
  // Al volver desde una partida, se actualizan las estrellas automáticamente.
  window.addEventListener('pageshow', renderLevels);
});
