// ============ THEME TOGGLE ============
const root = document.documentElement;
const themeBtn = document.getElementById("theme-toggle");

function currentTheme() {
  const set = root.getAttribute("data-theme");
  if (set) return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

themeBtn.addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try { localStorage.setItem("theme", next); } catch (e) {}
});

// ============ MOBILE MENU ============
const menuBtn = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

menuBtn.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", open);
});
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  })
);

// ============ NAV BORDER ON SCROLL ============
const nav = document.querySelector(".nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 10);
}, { passive: true });

// ============ ACTIVE NAV LINK ============
const sections = document.querySelectorAll("main section[id]");
const linkFor = (id) => navLinks.querySelector(`a[href="#${id}"]`);

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const link = linkFor(entry.target.id);
    if (link && entry.isIntersecting) {
      navLinks.querySelectorAll("a").forEach((a) => a.classList.remove("active"));
      link.classList.add("active");
    }
  });
}, { rootMargin: "-45% 0px -50% 0px" });
sections.forEach((s) => sectionObserver.observe(s));

// ============ SCROLL REVEAL ============
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// ============ PROJECT FILTER ============
const filters = document.querySelectorAll(".filter");
const projects = document.querySelectorAll("#projects .project-card");

filters.forEach((btn) =>
  btn.addEventListener("click", () => {
    filters.forEach((b) => { b.classList.remove("active"); b.setAttribute("aria-pressed", "false"); });
    btn.classList.add("active"); btn.setAttribute("aria-pressed", "true");
    const f = btn.dataset.filter;
    projects.forEach((p) => {
      const cats = p.dataset.category.split(" ");
      p.classList.toggle("hidden", f !== "all" && !cats.includes(f));
    });
  })
);

// ============ PROJECT GALLERIES: layered crossfade + thumbnails ============
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const videoObserver = new IntersectionObserver(entries => entries.forEach(({target,isIntersecting}) => {
  if (isIntersecting && !reducedMotion && !document.hidden) target.play().catch(()=>{});
  else target.pause();
}), {threshold:.35});
const lightbox = document.getElementById('lightbox');
const lbContent = lightbox.querySelector('.lightbox-content');
const lbCaption = lightbox.querySelector('.lightbox-caption');
const lbCount = lightbox.querySelector('.lightbox-count');
let activeGallery = null;
let lastFocused = null;
function buildMedia(button,expanded=false) {
  const video = button.dataset.type === 'video';
  const media = document.createElement(video?'video':'img');
  if(video){
    media.muted=true;media.loop=!expanded;media.playsInline=true;media.preload='metadata';
    if(button.dataset.poster) media.poster=button.dataset.poster;
    media.controls=expanded;
  }else{media.alt=button.dataset.caption||button.getAttribute('aria-label')||'Project image';}
  media.src=button.dataset.src;
  return media;
}
function renderLightbox(){
  const {thumbs,index}=activeGallery;
  lbContent.querySelectorAll('video').forEach(v=>v.pause());
  const media=buildMedia(thumbs[index],true);
  lbContent.replaceChildren(media);
  lbCaption.textContent=thumbs[index].dataset.caption||'';
  lbCount.textContent=`${index+1} / ${thumbs.length}`;
  if(media.tagName==='VIDEO'&&!reducedMotion)media.play().catch(()=>{});
}
function openLightbox(gallery){
  activeGallery=gallery;lastFocused=document.activeElement;
  document.querySelectorAll('.gallery-main video').forEach(v=>v.pause());
  renderLightbox();document.body.classList.add('viewer-open');lightbox.showModal();
}
function closeLightbox(){lightbox.close();}
function stepLightbox(direction){if(!activeGallery)return;activeGallery.show(activeGallery.index+direction);renderLightbox();}
lightbox.querySelector('.lightbox-close').addEventListener('click',closeLightbox);
lightbox.querySelector('.lb-prev').addEventListener('click',()=>stepLightbox(-1));
lightbox.querySelector('.lb-next').addEventListener('click',()=>stepLightbox(1));
lightbox.addEventListener('keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();stepLightbox(1);}if(event.key==='ArrowLeft'){event.preventDefault();stepLightbox(-1);}});
lightbox.addEventListener('click',event=>{if(event.target===lightbox){const r=lightbox.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeLightbox();}});
lightbox.addEventListener('close',()=>{lbContent.querySelectorAll('video').forEach(v=>v.pause());lbContent.replaceChildren();document.body.classList.remove('viewer-open');lastFocused?.focus();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(v=>v.pause());});
document.querySelectorAll('.gallery').forEach(gallery=>{
  const main=gallery.querySelector('.gallery-main');
  const caption=gallery.querySelector('.gallery-caption');
  const thumbs=[...gallery.querySelectorAll('.gallery-thumbs button')];
  main.setAttribute('role','group');
  const model={thumbs,index:0,show};
  let request=0;
  let currentLayer=null;
  let startX=0,startY=0,swiped=false;
  const expand=document.createElement('button');expand.type='button';expand.className='expand';expand.textContent='Expand';expand.setAttribute('aria-label','Expand '+gallery.dataset.project+' gallery');expand.addEventListener('click',()=>openLightbox(model));main.append(expand);
  [['prev','←',-1],['next','→',1]].forEach(([className,label,direction])=>{
    const button=document.createElement('button');button.className='gallery-step '+className;button.type='button';button.textContent=label;button.setAttribute('aria-label',direction===1?'Next image':'Previous image');button.addEventListener('click',event=>{event.stopPropagation();show(model.index+direction);});main.append(button);
  });
  function show(index){
    const id=++request;
    model.index=(index+thumbs.length)%thumbs.length;
    const thumb=thumbs[model.index];
    thumbs.forEach((button,i)=>{button.classList.toggle('active',i===model.index);button.setAttribute('aria-pressed',String(i===model.index));});
    caption.textContent=thumb.dataset.caption||'';
    const layer=document.createElement('div');layer.className='media-layer';
    const media=buildMedia(thumb);layer.append(media);main.insertBefore(layer,expand);
    let ready=false;
    const reveal=()=>{
      if(ready)return;ready=true;
      if(id!==request){layer.remove();return;}
      const old=currentLayer;currentLayer=layer;
      requestAnimationFrame(()=>{layer.classList.add('current');old?.classList.remove('current');});
      if(media.tagName==='VIDEO')videoObserver.observe(media);
      if(old)setTimeout(()=>{old.querySelectorAll('video').forEach(v=>{videoObserver.unobserve(v);v.pause();});old.remove();},reducedMotion?0:500);
    };
    if(media.tagName==='IMG'){
      if(media.complete)reveal();else media.addEventListener('load',reveal,{once:true});
      media.addEventListener('error',()=>{caption.textContent='This image could not load. Please try another thumbnail.';layer.remove();},{once:true});
    }else{media.addEventListener('loadedmetadata',reveal,{once:true});reveal();}
  }
  thumbs.forEach((button,index)=>button.addEventListener('click',()=>show(index)));
  main.addEventListener('click',event=>{if(event.target===expand||event.target.closest('.gallery-step'))return;if(swiped){swiped=false;return;}openLightbox(model);});
  main.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();show(model.index+(event.key==='ArrowRight'?1:-1));}if((event.key==='Enter'||event.key===' ')&&event.target===main){event.preventDefault();openLightbox(model);}});
  main.addEventListener('pointerdown',event=>{startX=event.clientX;startY=event.clientY;swiped=false;});
  main.addEventListener('pointerup',event=>{const dx=event.clientX-startX,dy=event.clientY-startY;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.4){swiped=true;show(model.index+(dx<0?1:-1));}});
  show(0);
});

// ============ FOOTER YEAR ============
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ============ ROLE ROTATOR (typewriter) ============
(function () {
  const el = document.getElementById("role");
  if (!el) return;
  const roles = ["computer vision", "connected devices", "Python & AI", "electronics", "cloud systems"];
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let i = 0, j = roles[0].length, deleting = true;
  function tick() {
    const word = roles[i];
    if (deleting) {
      j--;
      if (j <= 0) { deleting = false; i = (i + 1) % roles.length; }
    } else {
      j++;
      if (j >= roles[i].length) { deleting = true; el.textContent = roles[i]; return setTimeout(tick, 2200); }
    }
    el.textContent = roles[i].slice(0, Math.max(j, 0)) || "​";
    setTimeout(tick, deleting ? 35 : 70);
  }
  setTimeout(tick, 2400);
})();

// ============ STAT COUNTERS ============
(function () {
  const nums = document.querySelectorAll(".stat-num[data-count]");
  if (!nums.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      obs.unobserve(e.target);
      const el = e.target, end = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0), suf = el.dataset.suffix || "";
      const t0 = performance.now(), dur = 1200;
      (function step(now) {
        const p = Math.min(1, (now - t0) / dur), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (end * eased).toFixed(dec) + suf;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: 0.6 });
  nums.forEach((n) => obs.observe(n));
})();

// ============ SCROLL PROGRESS ============
(function () {
  const bar = document.querySelector(".scroll-progress");
  if (!bar) return;
  const update = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
  };
  addEventListener("scroll", update, { passive: true });
  update();
})();

// ============ CARD SPOTLIGHT ============
document.querySelectorAll(".project-card, .skill-card").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});
