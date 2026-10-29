(()=>{'use strict';
const catalog=window.HISTORIAS||[], dialog=document.querySelector('#detail');
const books=document.querySelector('#books'), stage=document.querySelector('.carousel-stage');
const shell=document.querySelector('.bookcase'), pagination=document.querySelector('#carouselPagination');
let selected=Math.max(0,catalog.findIndex(b=>b.id==='bertha'));
if(!catalog.length)return;
const wrap=n=>(n+catalog.length)%catalog.length;
function cover(b){
 if(b.cover){const img=document.createElement('img');img.src=b.cover;img.alt='Portada de '+b.title;return img;}
 const div=document.createElement('div');div.className='illustrated-cover'+(b.tone?' cover-'+b.tone:'');
 const decoration=document.createElement('span');decoration.className='cover-symbol';decoration.textContent=b.symbol||'✦';
 const title=document.createElement('strong');title.textContent=b.shortTitle||b.title;
 const sub=document.createElement('small');sub.textContent='Una nueva historia';
 div.append(decoration,title,sub);return div;
}
function openDetail(b){
 document.querySelector('#modal-cover-holder').replaceChildren(cover(b));
 document.querySelector('#modal-title').textContent=b.title;
 document.querySelector('#modal-kicker').textContent=b.kicker||'Una nueva aventura';
 document.querySelector('#modal-description').textContent=b.description||'';
 document.querySelector('#modal-status').textContent=b.href?'¡Historia interactiva disponible!':'Próximamente';
 document.querySelector('#modal-action').textContent=b.href?'Comenzar historia →':'Entendido';
 dialog.dataset.book=b.id;dialog.showModal();
}
// Keep every book in place: position and scale animate continuously between slots.
const bookNodes=catalog.map(b=>{
 const btn=document.createElement('button');btn.type='button';btn.className='book';
 btn.dataset.book=b.id;btn.setAttribute('aria-label',b.title+(b.href?', abrir historia':', próximamente'));
 const tag=document.createElement('div');tag.className='featured-tag';tag.textContent=b.href?'✦ Lista para descubrir ✦':'✦ Próximamente ✦';
 btn.append(tag,cover(b));const label=document.createElement('span');label.className='book-label';
 label.textContent=b.href?'¡Descubre su aventura!':'Próximamente';btn.append(label);
 btn.onclick=()=>openDetail(b);books.append(btn);return btn;
});
const dots=catalog.map((b,i)=>{const dot=document.createElement('button');dot.type='button';dot.className='carousel-dot';
 dot.setAttribute('aria-label','Mostrar '+b.title);dot.onclick=()=>select(i);pagination.append(dot);return dot;
});
function render(){
 bookNodes.forEach((btn,i)=>{
  let offset=wrap(i-selected);if(offset>catalog.length/2)offset-=catalog.length;
  const visible=Math.abs(offset)<=1, featured=offset===0;
  btn.classList.toggle('featured',featured);btn.classList.toggle('side',!featured);
  btn.dataset.visible=String(visible);btn.setAttribute('aria-hidden',String(!visible));btn.inert=!visible;btn.tabIndex=visible?0:-1;
  btn.style.setProperty('--book-x',`${offset*22}cqw`);btn.style.setProperty('--book-scale',featured?'1':'.76');
  btn.style.zIndex=featured?'3':visible?'2':'1';
 });
 dots.forEach((dot,i)=>dot.setAttribute('aria-current',String(i===selected)));
 document.querySelector('#carouselStatus').textContent=`${selected+1} de ${catalog.length} · ${catalog[selected].title}`;
 document.querySelectorAll('.carousel-arrow').forEach(b=>b.hidden=catalog.length<2);
}
function select(n){selected=wrap(n);render();}
const previous=document.querySelector('#carouselPrev'), next=document.querySelector('#carouselNext');
previous.onclick=()=>select(selected-1);next.onclick=()=>select(selected+1);
stage.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();select(selected+(e.key==='ArrowRight'?1:-1));}});
let touchStart=null;
stage.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')touchStart={x:e.clientX,y:e.clientY};});
stage.addEventListener('pointerup',e=>{if(!touchStart)return;const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)){select(selected+(dx<0?1:-1));stage.dataset.swiped='true';setTimeout(()=>delete stage.dataset.swiped,350);}});
stage.addEventListener('pointercancel',()=>touchStart=null);
stage.addEventListener('click',e=>{if(stage.dataset.swiped){e.preventDefault();e.stopPropagation();}},true);
document.querySelector('.close').onclick=()=>dialog.close();
document.querySelector('#modal-action').onclick=()=>{const b=catalog.find(b=>b.id===dialog.dataset.book);if(b?.href){document.querySelector('#bgm').pause();window.BookSounds?.stop();location.href=b.href;}else dialog.close();};
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
function fitShelf(){const r=stage.getBoundingClientRect();shell.style.width=Math.max(1,Math.min(r.width/.84,r.height*1920/995))+'px';}
document.querySelector('#collectionCount').textContent=`${catalog.filter(b=>b.href).length} cuentos disponibles · ${catalog.filter(b=>!b.href).length} próximamente`;
if(window.ResizeObserver)new ResizeObserver(fitShelf).observe(stage);
window.addEventListener('resize',fitShelf);render();fitShelf();
})();
