/* ─────────────────────────────────────────
   DJ LitKick Hub — app.js
   Canvas frame scrubbing · Lenis · GSAP
   Circle-wipe hero · Staggered sections
   Marquee · Dark overlay · Counters
───────────────────────────────────────── */

const FRAME_COUNT = 241;
const FRAME_SPEED = 2.0;   /* animation completes at ~50% scroll */
const IMAGE_SCALE = 0.87;  /* padded-cover: avoids clipping into header */

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
const loader        = document.getElementById("loader");
const loaderBar     = document.getElementById("loader-bar");
const loaderPct     = document.getElementById("loader-percent");
const canvasWrap    = document.getElementById("canvas-wrap");
const canvas        = document.getElementById("canvas");
const ctx           = canvas.getContext("2d");
const heroSection   = document.getElementById("hero-standalone");
const darkOverlay   = document.getElementById("dark-overlay");
const marqueeWrap   = document.getElementById("marquee");
const scrollContainer = document.getElementById("scroll-container");
const siteHeader    = document.getElementById("site-header");
const sections      = document.querySelectorAll(".scroll-section");

/* ── 3. CANVAS SIZING ── */
let dpr = window.devicePixelRatio || 1;
function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  canvas.width  = window.innerWidth  * dpr;
  canvas.height = window.innerHeight * dpr;
  // drawFrame works in raw canvas pixels — no ctx.scale needed
  if (frames && frames[currentFrame]) drawFrame(currentFrame);
}
window.addEventListener("resize", resizeCanvas, { passive: true });

/* ── 4. FRAME LOADER ── */
const frames = new Array(FRAME_COUNT);
let loadedCount  = 0;
let currentFrame = 0;
resizeCanvas(); // called here so `frames` is already declared

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
    img.onerror = resolve; /* skip missing frames gracefully */
  });
}

/* Two-phase: first 10 frames fast, then rest in background */
async function initFrames() {
  const firstBatch = Array.from({ length: 10 }, (_, i) => loadFrame(i));
  await Promise.all(firstBatch);
  drawFrame(0);

  /* Load remaining frames — hide loader once all done */
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

/* ── 6. CANVAS RENDERER ── */
function drawFrame(index) {
  const img = frames[index];
  if (!img) return;

  // Work in raw canvas pixels (canvas.width already = innerWidth * dpr)
  const cw = canvas.width;
  const ch = canvas.height;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, dw, dh);
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
  const h = scrollContainer.offsetHeight;
  sections.forEach(s => {
    const enter = parseFloat(s.dataset.enter) / 100;
    const leave = parseFloat(s.dataset.leave) / 100;
    s.style.top       = ((enter + leave) / 2 * h) + "px";
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

      /* Hero fades out quickly */
      heroSection.style.opacity = Math.max(0, 1 - p * 15).toString();

      /* Canvas reveals via expanding circle as hero leaves */
      const wipeProgress = Math.min(1, Math.max(0, (p - 0.01) / 0.07));
      const radius = wipeProgress * 80;
      canvasWrap.style.clipPath = `circle(${radius}% at 50% 50%)`;
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
      const accelerated = Math.min(self.progress * FRAME_SPEED, 1);
      const index = Math.min(
        Math.floor(accelerated * FRAME_COUNT),
        FRAME_COUNT - 1
      );
      if (index !== currentFrame) {
        currentFrame = index;
        /* Sample bg color every ~20 frames for seamless padding fill */
        if (index % 20 === 0 && frames[index]) sampleBgColor(frames[index]);
        requestAnimationFrame(() => drawFrame(currentFrame));
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
      ".section-cta-link, .cta-button, .cta-ig, .stat"
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

/* ── BOOT ── */
async function boot() {
  await initFrames();

  initHeroTransition();
  initFrameScroll();
  initSections();
  initDarkOverlay();
  initMarquee();
  initCounters();

  ScrollTrigger.refresh();
}

boot();
