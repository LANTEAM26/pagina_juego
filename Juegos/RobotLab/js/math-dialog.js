// Each challenge keeps its question and scratch work when the dialog is closed.
RL.mathDialog={
  close(){const d=document.querySelector('#math-dialog');if(d){if(d.open)d.close();else d.remove()}},
  open({challenge,title,reward,onSolve,onWrong,onHint}){
    this.close();const returnFocus=document.activeElement;
    const d=document.createElement('dialog');d.id='math-dialog';d.className='math-dialog';d.setAttribute('aria-labelledby','math-title');
    const problem=challenge.question.q+(challenge.question.q.includes('=')?'':' = ?');
    challenge.rejected=challenge.rejected||[];challenge.drawing=challenge.drawing||[];challenge.drawingHistory=challenge.drawingHistory||[];
    d.innerHTML=`<div class="math-sheet"><header class="math-header"><div><div class="eyebrow"> MOMENTO DE PENSAR</div><h2 id="math-title" tabindex="-1">${title}</h2></div><button class="btn alt" id="math-close">← Volver al taller</button></header><div class="math-columns"><section class="math-exercise" aria-label="Problema de matemáticas"><div class="reward-badge"> ${reward}</div><p>Resuelve con calma. Puedes usar la pizarra.</p><div class="math-equation" id="math-equation">${problem}</div><p class="answer-instruction">Elige la respuesta correcta:</p><div class="math-answers">${challenge.question.options.map(v=>`<button class="answer" data-answer="${v}" ${challenge.rejected.includes(v)?'disabled':''}>${v}</button>`).join('')}</div><div class="math-feedback" id="math-feedback" role="status" aria-live="polite"></div><button class="btn alt" id="math-hint"> Una pista</button><button class="btn gold" id="math-continue" hidden>¡Seguir creando! →</button></section><section class="scratch-panel" aria-label="Pizarra para resolver el problema"><div class="scratch-heading"><h3> Mi pizarra</h3><span>Haz tus cuentas aquí</span></div><div class="scratch-host" id="scratch-host"></div></section></div></div>`;
    document.body.appendChild(d);document.body.classList.add('math-open');
    const cleanup=()=>{d.remove();document.body.classList.remove('math-open');const focus=returnFocus?.isConnected?returnFocus:document.querySelector('#open-challenge-top:not(:disabled), #board, #finish');focus?.focus({preventScroll:true})};
    d.addEventListener('close',cleanup,{once:true});d.addEventListener('cancel',ev=>{ev.preventDefault();d.close()});
    d.querySelector('#math-close').onclick=()=>d.close();d.querySelector('#math-continue').onclick=()=>d.close();
    const feedback=d.querySelector('#math-feedback');
    d.querySelectorAll('[data-answer]').forEach(button=>button.onclick=()=>{
      if(challenge.solved||button.disabled)return;
      if(+button.dataset.answer===challenge.question.answer){
        challenge.solved=true;d.querySelectorAll('[data-answer]').forEach(el=>el.disabled=true);button.classList.add('correct');
        feedback.textContent=' ¡Muy bien! '+reward+' desbloqueado.';feedback.classList.remove('wrong');
        d.querySelector('#math-hint').hidden=true;d.querySelector('#math-continue').hidden=false;
        RL.beep(true);onSolve();d.querySelector('#math-continue').focus();
      }else{challenge.rejected.push(+button.dataset.answer);button.disabled=true;button.classList.add('wrong');feedback.textContent=' Esa no es. Prueba con tus trazos y vuelve a intentarlo.';feedback.classList.add('wrong');RL.beep(false);onWrong()}
    });
    d.querySelector('#math-hint').onclick=()=>{
      const wrong=[...d.querySelectorAll('[data-answer]')].find(el=>!el.disabled&&+el.dataset.answer!==challenge.question.answer);
      if(!wrong){feedback.textContent=' Mira tu pizarra: solo queda una opción disponible.';return}
      challenge.rejected.push(+wrong.dataset.answer);wrong.disabled=true;feedback.classList.remove('wrong');feedback.textContent=' Descartamos una opción. '+(problem.includes('×')?'Haz primero las multiplicaciones.':'Puedes dibujar objetos para contar en la pizarra.');onHint();
    };
    this.setupCanvas(d,challenge);d.showModal();d.querySelector('#math-title').focus();
  },
  setupCanvas(dialog,challenge){return RL.scratch.mount(dialog.querySelector('#scratch-host'),challenge)}
};
