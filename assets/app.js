// Small UX micro-interactions
function handleSubmit(e){
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const message = document.getElementById('message').value;
  // In a real site you'd send this to a backend. For now provide confirmation.
  alert(`Thanks ${name}! I'll respond to ${email} soon.`);
  e.target.reset();
}

// Add header scrolled state for subtle shadow and use scroll container
const header = document.querySelector('.site-header');
const scrollerEl = document.querySelector('.site-scroll') || window;
function getScrollTop(){
  return scrollerEl === window ? window.scrollY || window.pageYOffset : scrollerEl.scrollTop;
}
function onScroll(){
  if(getScrollTop()>16) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
}
if(scrollerEl === window) window.addEventListener('scroll', onScroll, {passive:true});
else scrollerEl.addEventListener('scroll', onScroll, {passive:true});
onScroll();

// smooth-scroll offset adjustment for fixed header (single handler)
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', (e)=>{
    const href = a.getAttribute('href');
    if(href.length>1){
      e.preventDefault();
      const target = document.querySelector(href);
      if(!target) return;
      const headerOffset = header ? header.offsetHeight : 72;

      // compute target position relative to the scroll container
      let elementPosition;
      if(scrollerEl === window){
        elementPosition = target.getBoundingClientRect().top + window.pageYOffset;
      } else {
        const scrollerRect = scrollerEl.getBoundingClientRect();
        elementPosition = target.getBoundingClientRect().top + scrollerEl.scrollTop - scrollerRect.top;
      }

      const offsetPosition = elementPosition - headerOffset - 18; // breathing room

      if(scrollerEl === window){
        window.scrollTo({top: offsetPosition, behavior:'smooth'});
      } else {
        scrollerEl.scrollTo({top: offsetPosition, behavior:'smooth'});
      }
    }
  });
});

// simple reveal on scroll - make observer use scrollerEl as root
const observers = document.querySelectorAll('.hero, .projects, .experience, .contact');
const ioRoot = scrollerEl === window ? null : scrollerEl;
const io = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting) entry.target.style.animationPlayState='running';
  });
},{threshold:0.1, root: ioRoot});
observers.forEach(o=>io.observe(o));

// Update: scroll reveal using a 'reveal' class and data-delay for stagger
const revealObserver = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    const el = entry.target;
    // add a small offset so multiple elements reveal a bit more slowly
    const baseDelay = Number(el.getAttribute('data-delay') || 0);
    const offset = Number(el.getAttribute('data-offset') || 40);
    const delay = Math.max(0, baseDelay + offset);
    if(entry.isIntersecting){
      const timer = setTimeout(()=>{
        el.classList.add('visible');
        delete el.__revealTimer;
      }, delay);
      el.__revealTimer = timer;
    } else {
      if(el.__revealTimer){
        clearTimeout(el.__revealTimer);
        delete el.__revealTimer;
      }
      el.classList.remove('visible');
    }
  });
},{threshold:0.12, root: ioRoot});

// re-observe reveals (ensure we attach the updated observer)
document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));

// add small hover elevation for project cards
document.querySelectorAll('.project').forEach(card=>{
  card.addEventListener('mouseenter', ()=> card.style.transform='translateY(-6px)');
  card.addEventListener('mouseleave', ()=> card.style.transform='none');
});

// Scroll progress bar - use scroll container
const progress = document.querySelector('.scroll-progress');
const progressBar = document.querySelector('.scroll-progress__bar');
let ticking = false;
let scrollingTimer;
function updateProgress(){
  const scrollTop = getScrollTop();
  const docHeight = (scrollerEl === window)
    ? Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight
    : (scrollerEl.scrollHeight - scrollerEl.clientHeight);
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = pct.toFixed(2) + '%';
}

const onScrollForProgress = ()=>{
  if(!ticking){
    window.requestAnimationFrame(()=>{
      updateProgress();
      ticking = false;
    });
    ticking = true;
  }
  progress.classList.add('scrolling');
  clearTimeout(scrollingTimer);
  scrollingTimer = setTimeout(()=> progress.classList.remove('scrolling'), 250);
};

if(scrollerEl === window) window.addEventListener('scroll', onScrollForProgress, {passive:true});
else scrollerEl.addEventListener('scroll', onScrollForProgress, {passive:true});

// Nav liquid indicator (spring animation)
const nav = document.querySelector('.nav');
const navIndicator = document.querySelector('.nav-indicator');
let indicatorTimeout;
if(nav && navIndicator){
  const links = Array.from(nav.querySelectorAll('a'));
  let animFrame;
  let state = {x:0, width:0};
  let target = {x:0, width:0};

  function rafAnimate(){
    // simple spring-like interpolation
    const stiffness = 0.14; // lower = bouncier
    const damping = 0.82; // closer to 1 = more damping
    const vx = (target.x - state.x) * stiffness;
    const vw = (target.width - state.width) * stiffness;
    state.x += vx;
    state.width += vw;
    state.x *= damping;
    state.width *= damping;

    navIndicator.style.transform = `translateX(${state.x}px)`;
    navIndicator.style.width = Math.max(32, state.width) + 'px';

    animFrame = requestAnimationFrame(rafAnimate);
  }

  function moveIndicatorTo(el){
    const rect = el.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    const width = Math.max(64, rect.width + 20);
    const left = rect.left - navRect.left + (rect.width - width)/2;
    target.width = width;
    target.x = left;
    nav.classList.remove('indicator-hidden');
    if(!animFrame && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      animFrame = requestAnimationFrame(rafAnimate);
    } else if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      // immediate update for reduced motion
      navIndicator.style.width = width + 'px';
      navIndicator.style.transform = `translateX(${left}px)`;
    }
  }

  links.forEach(link=>{
    link.addEventListener('mouseenter', ()=>{
      if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      clearTimeout(indicatorTimeout);
      moveIndicatorTo(link);
    });
    link.addEventListener('focus', ()=> moveIndicatorTo(link));
    link.addEventListener('blur', ()=> navIndicator.style.opacity='0');
  });

  nav.addEventListener('mouseleave', ()=>{
    indicatorTimeout = setTimeout(()=> nav.classList.add('indicator-hidden'), 220);
    if(animFrame){ cancelAnimationFrame(animFrame); animFrame = null; }
  });
}

// initialize
updateProgress();
