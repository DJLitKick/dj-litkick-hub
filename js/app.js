/* ─────────────────────────────────────────
   DJ LitKick Hub — app.js
   Canvas frame scrubbing · Lenis · GSAP
   Circle-wipe hero · Staggered sections
   Marquee · Dark overlay · Counters
───────────────────────────────────────── */

const FRAME_COUNT  = 241;
const IMAGE_SCALE  = 0.78;  /* main canvas: padded (10% smaller than before) */
const ANIM_START   = 0.11;  /* scroll % where frame animation begins (10% later) */
const ANIM_END     = 0.73;  /* scroll % where frame animation completes (end of section 4) */
const FREEZE_AT    = 0.77;  /* scroll % where transition back to frame 0 is complete */

/* ── 1. LENIS SMOOTH SCROLL ── */
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ── 2. ELEMENT REFS ── */
const loader          = document.getElementById("loader");
const loaderBar       = document.getElementById("loader-bar");
const loaderPct       = document.getElementById("loader-percent");
const canvasWrap      = document.getElementById("canvas-wrap");
const canvas          = document.getElementById("canvas");
const ctx             = canvas.getContext("2d");
const canvasBlur      = document.getElementById("canvas-blur");
const ctxBlur         = canvasBlur.getContext("2d");
const heroSection     = document.getElementById("hero-standalone");
const darkOverlay     = document.getElementById("dark-overlay");
const marqueeWrap     = document.getElementById("marquee");
const scrollContainer = document.getElementById("scroll-container");
const siteHeader      = document.getElementById("site-header");
const sections        = document.querySelectorAll(".scroll-section");

/* ── 3. CANVAS SIZING ── */
let dpr = window.devicePixelRatio || 1;
function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  canvas.width      = window.innerWidth  * dpr;
  canvas.height     = window.innerHeight * dpr;
  canvasBlur.width  = window.innerWidth  * dpr;
  canvasBlur.height = window.innerHeight * dpr;
  if (frames && frames[currentFrame]) {
    drawFrame(currentFrame);
    drawBlurFrame(currentFrame);
  }
}
window.addEventListener("resize", resizeCanvas, { passive: true });

/* ── 4. FRAME LOADER ── */
const frames = new Array(FRAME_COUNT);
let loadedCount  = 0;
let currentFrame = 0;
resizeCanvas();

function padNum(n, digits) { return String(n).padStart(digits, "0"); }

function loadFrame(index) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = `frames/frame_${padNum(index + 1, 4)}.webp`;
    img.onload = () => {
      frames[index] = img;
      loadedCount++;
      const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
      loaderBar.style.width = pct + "%";
      loaderPct.textContent = pct + "%";
      resolve();
    };
    img.onerror = resolve;
  });
}

async function initFrames() {
  const firstBatch = Array.from({ length: 10 }, (_, i) => loadFrame(i));
  await Promise.all(firstBatch);
  drawFrame(0);
  drawBlurFrame(0);

  const restBatch = Array.from({ length: FRAME_COUNT - 10 }, (_, i) => loadFrame(i + 10));
  await Promise.all(restBatch);

  setTimeout(() => loader.classList.add("hidden"), 200);
}

/* ── 5. BG COLOR SAMPLER ── */
let bgColor = "#080808";
function sampleBgColor(img) {
  const offscreen = document.createElement("canvas");
  offscreen.width  = 4;
  offscreen.height = 4;
  const c = offscreen.getContext("2d");
  c.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, 4, 4);
  const d = c.getImageData(0, 0, 1, 1).data;
  bgColor = `rgb(${d[0]},${d[1]},${d[2]})`;
}

/* ── 6. CANVAS RENDERERS ── */
function drawFrame(index) {
  const img = frames[index];
  if (!img) return;
  const cw = canvas.width, ch = canvas.height;
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
  const dw = iw * scale, dh = ih * scale;
  const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawBlurFrame(index) {
  const img = frames[index];
  if (!img) return;
  const cw = canvasBlur.width, ch = canvasBlur.height;
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const scale = Math.max(cw / iw, ch / ih); /* full cover — no padding */
  const dw = iw * scale, dh = ih * scale;
  const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
  ctxBlur.fillStyle = bgColor;
  ctxBlur.fillRect(0, 0, cw, ch);
  ctxBlur.drawImage(img, dx, dy, dw, dh);
}

function renderFrames(index) {
  drawFrame(index);
  drawBlurFrame(index);
}

/* ── 7. MOBILE HAMBURGER ── */
const hamburger  = document.getElementById("nav-hamburger");
const mobileMenu = document.getElementById("mobile-menu");
if (hamburger && mobileMenu) {
  hamburger.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("open");
    hamburger.classList.toggle("open", open);
    document.body.style.overflow = open ? "hidden" : "";
  });
  mobileMenu.querySelectorAll(".mobile-link").forEach(link => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      hamburger.classList.remove("open");
      document.body.style.overflow = "";
    });
  });
}

/* ── 8. HEADER SCROLL EFFECT ── */
window.addEventListener("scroll", () => {
  siteHeader.classList.toggle("scrolled", window.scrollY > 40);
}, { passive: true });

/* ── 9. SECTION POSITIONING ── */
function positionSections() {
  const h  = scrollContainer.offsetHeight;
  const vh = window.innerHeight;
  sections.forEach(s => {
    const enter = parseFloat(s.dataset.enter) / 100;
    const leave = parseFloat(s.dataset.leave) / 100;
    const mid   = (enter + leave) / 2;
    s.style.top       = (mid * (h - vh) + vh / 2) + "px";
    s.style.transform = "translateY(-50%)";
  });
}
positionSections();
window.addEventListener("resize", positionSections, { passive: true });

/* ── 10. HERO FADE + CANVAS CIRCLE-WIPE ── */
function initHeroTransition() {
  ScrollTrigger.create({
    trigger: scrollContainer,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;

      /* Hero fades out 0% → 10% scroll */
      heroSection.style.opacity = Math.max(0, 1 - p * 10).toString();

      /* Canvas circle-wipe opens 11% → 18% scroll */
      const wipeProgress = Math.min(1, Math.max(0, (p - 0.11) / 0.07));
      const radius = wipeProgress * 80;
      canvasWrap.style.clipPath = `circle(${radius}% at 50% 50%)`;

      /* Quick fade cut: last frame → frame 0 between ANIM_END and FREEZE_AT */
      if (p > ANIM_END && p < FREEZE_AT) {
        const t = (p - ANIM_END) / (FREEZE_AT - ANIM_END);
        canvasWrap.style.opacity = t < 0.5
          ? String(Math.max(0, 1 - t * 2))
          : String(Math.min(1, (t - 0.5) * 2));
      } else {
        canvasWrap.style.opacity = "1";
      }
    },
  });
}

/* ── 11. FRAME → SCROLL BINDING ── */
function initFrameScroll() {
  ScrollTrigger.create({
    trigger: scrollContainer,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      let index;

      if (p < ANIM_START) {
        /* Before animation starts: hold frame 0 */
        index = 0;
      } else if (p <= ANIM_END) {
        /* Main animation: frames 0 → 240 over 11%–73% scroll */
        const t = (p - ANIM_START) / (ANIM_END - ANIM_START);
        index = Math.min(Math.floor(t * FRAME_COUNT), FRAME_COUNT - 1);
      } else if (p < ANIM_END + (FREEZE_AT - ANIM_END) * 0.5) {
        /* Fade-out window: hold last frame while canvas fades to black */
        index = FRAME_COUNT - 1;
      } else {
        /* Fade-in and beyond: show frame 0 */
        index = 0;
      }

      if (index !== currentFrame) {
        currentFrame = index;
        if (index % 20 === 0 && frames[index]) sampleBgColor(frames[index]);
        requestAnimationFrame(() => renderFrames(currentFrame));
      }
    },
  });
}

/* ── 12. SECTION ANIMATION SYSTEM ── */
function initSections() {
  sections.forEach(section => {
    const type    = section.dataset.animation || "fade-up";
    const persist = section.dataset.persist === "true";
    const enter   = parseFloat(section.dataset.enter) / 100;
    const leave   = parseFloat(section.dataset.leave) / 100;

    const children = section.querySelectorAll(
      ".section-label, .section-heading, .section-body, .section-note, " +
      ".section-cta-link, .cta-button, .cta-ig, .stat, .occasion-link"
    );

    const tl = gsap.timeline({ paused: true });

    switch (type) {
      case "slide-left":
        tl.from(children, { x: -80, opacity: 0, stagger: 0.14, duration: 0.9, ease: "power3.out" });
        break;
      case "slide-right":
        tl.from(children, { x: 80, opacity: 0, stagger: 0.14, duration: 0.9, ease: "power3.out" });
        break;
      case "scale-up":
        tl.from(children, { scale: 0.85, opacity: 0, stagger: 0.12, duration: 1.0, ease: "power2.out" });
        break;
      case "rotate-in":
        tl.from(children, { y: 40, rotation: 3, opacity: 0, stagger: 0.1, duration: 0.9, ease: "power3.out" });
        break;
      case "stagger-up":
        tl.from(children, { y: 60, opacity: 0, stagger: 0.15, duration: 0.8, ease: "power3.out" });
        break;
      case "clip-reveal":
        tl.from(children, { clipPath: "inset(100% 0 0 0)", opacity: 0, stagger: 0.15, duration: 1.2, ease: "power4.inOut" });
        break;
      default:
        tl.from(children, { y: 50, opacity: 0, stagger: 0.12, duration: 0.9, ease: "power3.out" });
    }

    let hasAnimated = false;

    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: false,
      onUpdate: (self) => {
        const p = self.progress;
        if (p >= enter && p < leave) {
          section.classList.add("is-visible");
          if (!hasAnimated) { tl.play(0); hasAnimated = true; }
        } else if (persist && hasAnimated) {
          section.classList.add("is-visible");
        } else {
          section.classList.remove("is-visible");
          if (p < enter) { hasAnimated = false; tl.pause(0); }
        }
      },
    });
  });
}

/* ── 13. DARK OVERLAY ── */
function initDarkOverlay() {
  const ENTER = 0.77, LEAVE = 0.87, FADE = 0.025;
  ScrollTrigger.create({
    trigger: scrollContainer,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      let o = 0;
      if (p >= ENTER - FADE && p < ENTER) o = (p - (ENTER - FADE)) / FADE;
      else if (p >= ENTER && p <= LEAVE)  o = 0.92;
      else if (p > LEAVE && p <= LEAVE + FADE) o = 0.92 * (1 - (p - LEAVE) / FADE);
      darkOverlay.style.opacity = o;
    },
  });
}

/* ── 14. MARQUEE ── */
function initMarquee() {
  if (!marqueeWrap) return;
  const text  = marqueeWrap.querySelector(".marquee-text");
  const speed = parseFloat(marqueeWrap.dataset.scrollSpeed) || -25;

  gsap.to(text, {
    xPercent: speed,
    ease: "none",
    scrollTrigger: {
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
    },
  });

  ScrollTrigger.create({
    trigger: scrollContainer,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      let o = 0;
      if (p > 0.05 && p < 0.88) o = Math.min(1, (p - 0.05) / 0.06);
      else if (p >= 0.88)        o = Math.max(0, 1 - (p - 0.88) / 0.06);
      marqueeWrap.style.opacity = o;
    },
  });
}

/* ── 15. COUNTER ANIMATIONS ── */
function initCounters() {
  document.querySelectorAll(".stat-number").forEach(el => {
    const target   = parseFloat(el.dataset.value);
    const decimals = parseInt(el.dataset.decimals || "0");
    gsap.fromTo(el,
      { textContent: 0 },
      {
        textContent: target,
        duration: 2,
        ease: "power1.out",
        snap: { textContent: decimals === 0 ? 1 : 0.01 },
        onUpdate() {
          const v = parseFloat(this.targets()[0].textContent);
          el.textContent = decimals === 0 ? Math.round(v).toLocaleString() : v.toFixed(decimals);
        },
        scrollTrigger: {
          trigger: el.closest(".scroll-section"),
          start: "top 80%",
          toggleActions: "play none none reset",
        },
      }
    );
  });
}

/* ── OCCASION JUMP LINKS ── */
function initOccasionLinks() {
  document.querySelectorAll('.occasion-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(link.dataset.target);
      if (!target) return;
      const enter = parseFloat(target.dataset.enter) / 100;
      lenis.scrollTo(enter * (scrollContainer.offsetHeight - window.innerHeight), { duration: 1.4 });
    });
  });
}

/* ── BOOT ── */
async function boot() {
  await initFrames();

  initHeroTransition();
  initFrameScroll();
  initSections();
  initOccasionLinks();
  initDarkOverlay();
  initMarquee();
  initCounters();

  ScrollTrigger.refresh();
}

boot();
