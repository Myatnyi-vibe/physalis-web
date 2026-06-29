// fx.js — атмосфера: звёздное поле, появление по скроллу, падающая звезда,
// параллакс звёзд и анимированная прорисовка SVG (октаграмма/колесо).
(function () {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function rand(a, b) { return a + Math.random() * (b - a); }

  // ---- звёздное поле ----
  function fillStarfield(field) {
    if (field.dataset.filled) return;
    field.dataset.filled = "1";
    const isHero = field.classList.contains("hero-stars");
    const isCosmic = !!field.closest(".cosmic, .lp-hero, .lp-final, .tool-card");
    const area = field.clientWidth * field.clientHeight;
    const div = isHero ? 20000 : 4400;
    let n = Math.round(area / div);
    n = Math.max(isHero ? 16 : 30, Math.min(isHero ? 42 : 190, n));
    const maxSize = isCosmic ? 3.4 : isHero ? 2.0 : 2.6;
    let html = "";
    for (let i = 0; i < n; i++) {
      const s = rand(0.8, maxSize).toFixed(2);
      html += `<span class="star" style="left:${rand(1,99).toFixed(1)}%;top:${rand(1,99).toFixed(1)}%;`
        + `width:${s}px;height:${s}px;--tw:${rand(2.6,6).toFixed(1)}s;--td:${rand(0,5).toFixed(1)}s;`
        + `opacity:${rand(0.3,0.9).toFixed(2)}"></span>`;
    }
    field.innerHTML = html;
  }

  // ---- появление блоков ----
  let revObs = null;
  function ensureRevealObserver() {
    if (revObs || reduce || !("IntersectionObserver" in window)) return;
    revObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); revObs.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  }

  // ---- прорисовка SVG ----
  let drawObs = null;
  function ensureDrawObserver() {
    if (drawObs || !("IntersectionObserver" in window)) return;
    drawObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("go"); drawObs.unobserve(e.target); } });
    }, { threshold: 0.25 });
  }

  // ---- параллакс звёзд ----
  const parallaxFields = [];
  let parallaxBound = false;
  function bindParallax() {
    if (parallaxBound || reduce) return;
    parallaxBound = true;
    let ticking = false;
    function update() {
      ticking = false;
      const vh = window.innerHeight;
      for (const sf of parallaxFields) {
        const panel = sf.parentElement;
        if (!panel) continue;
        const r = panel.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) continue; // вне зоны
        const delta = vh / 2 - (r.top + r.height / 2);
        sf.style.transform = `translate3d(0, ${(delta * 0.08).toFixed(1)}px, 0)`;
      }
    }
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } });
    update();
  }

  function decorate(root) {
    root = root || document;
    root.querySelectorAll(".starfield").forEach((f) => {
      fillStarfield(f);
      if (!reduce && !f.dataset.par) { f.dataset.par = "1"; parallaxFields.push(f); }
    });
    root.querySelectorAll(".dusk").forEach((d) => {
      if (!d.querySelector(".shooting-star") && !reduce) {
        const s = document.createElement("span"); s.className = "shooting-star"; d.appendChild(s);
      }
    });
    // появление
    ensureRevealObserver();
    root.querySelectorAll(".reveal").forEach((el) => {
      if (el.dataset.revealObserved) return;
      el.dataset.revealObserved = "1";
      if (revObs) revObs.observe(el); else el.classList.add("in");
    });
    // прорисовка svg
    ensureDrawObserver();
    root.querySelectorAll(".draw-svg").forEach((el) => {
      if (el.dataset.drawObserved) return;
      el.dataset.drawObserved = "1";
      if (drawObs && !reduce) {
        drawObs.observe(el);
        // страховка: гарантированно показать, даже если наблюдатель не сработал
        setTimeout(() => el.classList.add("go"), 2400);
      } else { el.classList.add("go"); }
    });
    bindParallax();
  }

  window.PhysalisFX = { decorate, fillStarfield };
  document.addEventListener("DOMContentLoaded", () => decorate(document));
})();
