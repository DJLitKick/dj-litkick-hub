/* ─────────────────────────────────────────
   DJ LitKick Hub — app.js
   Lenis · GSAP · ScrollTrigger
   Loader · Hero fade · Section animations
   Marquee · Dark overlay · Counters
───────────────────────────────────────── */

/* ── 1. LENIS SMOOTH SCROLL ── */
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ── 2. LOADER ── */
(function initLoader() {
  const loader = document.getElementById("loader");
  const bar    = document.getElementById("loader-bar");
  const pct    = document.getElementById("loader-percent");
  let progress = 0;
  const step   = () => {
    progress += Math.random() * 18 + 6;
    if (progress >= 100) {
      progress = 100;
      bar.style.width = "100%";
      pct.textContent = "100%";
      setTimeout(() => loader.classList.add("hidden"), 300);
      return;
    }
    bar.style.width = progress + "%";
    pct.textContent = Math.round(progress) + "%";
    setTimeout(step, 80 + Math.random() * 80);
  };
  setTimeout(step, 200);
})();

/* ── 3. VIDEO BACKGROUND ── */
const bgVideo = document.getElementById("bg-video");
if (bgVideo) {
  document.addEventListener("visibilitychange", () => {
    document.hidden ? bgVideo.pause() : bgVideo.play().catch(() => {});
  });
}

/* ── 4. HEADER SCROLL EFFECT ── */
const siteHeader = document.getElementById("site-header");
window.addEventListener("scroll", () => {
  siteHeader.classList.toggle("scrolled", window.scrollY > 40);
}, { passive: true });

/* ── 5. MOBILE HAMBURGER ── */
const hamburger  = document.getElementById("nav-hamburger");
const mobileMenu = document.getElementById("mobile-menu");
if (hamburger && mobileMenu) {
  hamburger.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("open");
    hamburger.classList.toggle("open", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
  });
  mobileMenu.querySelectorAll(".mobile-link").forEach(link => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      hamburger.classList.remove("open");
      document.body.style.overflow = "";
    });
  });
}

/* ── 6. CONSTANTS & REFERENCES ── */
const scrollContainer = document.getElementById("scroll-container");
const hero            = document.getElementById("hero");
const darkOverlay     = document.getElementById("dark-overlay");
const marqueeWrap     = document.getElementById("marquee");
const sections        = document.querySelectorAll(".scroll-section");

/* Position each section at the midpoint of its enter/leave range */
function positionSections() {
  const containerH = scrollContainer.offsetHeight;
  sections.forEach(section => {
    const enter = parseFloat(section.dataset.enter) / 100;
    const leave = parseFloat(section.dataset.leave) / 100;
    const mid   = (enter + leave) / 2;
    section.style.top  = mid * containerH + "px";
    section.style.transform = "translateY(-50%)";
  });
}
positionSections();
window.addEventListener("resize", positionSections, { passive: true });

/* ── 7. HERO FADE-OUT ── */
ScrollTrigger.create({
  trigger: scrollContainer,
  start: "top top",
  end: "bottom bottom",
  scrub: true,
  onUpdate: (self) => {
    const opacity = Math.max(0, 1 - self.progress * 12);
    hero.style.opacity = opacity;
    hero.style.pointerEvents = opacity < 0.05 ? "none" : "auto";
  },
});

/* ── 8. SECTION ANIMATION SYSTEM ── */
sections.forEach(section => {
  const type    = section.dataset.animation || "fade-up";
  const persist = section.dataset.persist === "true";
  const enter   = parseFloat(section.dataset.enter) / 100;
  const leave   = parseFloat(section.dataset.leave) / 100;

  const children = section.querySelectorAll(
    ".section-label, .section-heading, .section-body, .section-note, .section-cta-link, .cta-button, .cta-ig, .stat"
  );

  const tl = gsap.timeline({ paused: true });

  switch (type) {
    case "fade-up":
      tl.from(children, { y: 50, opacity: 0, stagger: 0.12, duration: 0.9, ease: "power3.out" });
      break;
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
      tl.from(children, { opacity: 0, stagger: 0.1, duration: 0.8, ease: "power2.out" });
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
        if (!hasAnimated) {
          tl.play(0);
          hasAnimated = true;
        }
      } else if (!persist) {
        section.classList.remove("is-visible");
        if (!persist && p < enter) {
          hasAnimated = false;
          tl.pause(0);
        }
      } else {
        /* persist: stays visible once shown */
        if (hasAnimated) section.classList.add("is-visible");
      }
    },
  });
});

/* ── 9. DARK OVERLAY (stats section) ── */
(function initDarkOverlay() {
  const ENTER = 0.77;
  const LEAVE = 0.87;
  const FADE  = 0.025;
  ScrollTrigger.create({
    trigger: scrollContainer,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      let opacity = 0;
      if (p >= ENTER - FADE && p < ENTER) {
        opacity = (p - (ENTER - FADE)) / FADE;
      } else if (p >= ENTER && p <= LEAVE) {
        opacity = 0.92;
      } else if (p > LEAVE && p <= LEAVE + FADE) {
        opacity = 0.92 * (1 - (p - LEAVE) / FADE);
      }
      darkOverlay.style.opacity = opacity;
    },
  });
})();

/* ── 10. MARQUEE ── */
(function initMarquee() {
  if (!marqueeWrap) return;
  const text   = marqueeWrap.querySelector(".marquee-text");
  const speed  = parseFloat(marqueeWrap.dataset.scrollSpeed) || -25;

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

  /* Fade marquee in once user scrolls past 5%, fade out after 90% */
  ScrollTrigger.create({
    trigger: scrollContainer,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      let opacity = 0;
      if (p > 0.05 && p < 0.88) {
        opacity = Math.min(1, (p - 0.05) / 0.06);
      } else if (p >= 0.88) {
        opacity = Math.max(0, 1 - (p - 0.88) / 0.06);
      }
      marqueeWrap.style.opacity = opacity;
    },
  });
})();

/* ── 11. COUNTER ANIMATIONS ── */
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
        const val = parseFloat(this.targets()[0].textContent);
        el.textContent = decimals === 0
          ? Math.round(val).toLocaleString()
          : val.toFixed(decimals);
      },
      scrollTrigger: {
        trigger: el.closest(".scroll-section"),
        start: "top 80%",
        toggleActions: "play none none reset",
      },
    }
  );
});
