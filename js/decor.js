// decor.js — плавающий декоративный слой: символы Таро/планет/звёзд,
// которые «ездят» при скролле, переливаются и перетекают из формы в форму.
// Лежит ПОЗАДИ контента (#cosmos-decor z-index:0 < z-index:1 у блоков),
// поэтому не мешает чтению.
(function () {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SYM = window.PhysalisDecorSym || {};
  const rand = (a, b) => a + Math.random() * (b - a);

  // юникод-глифы: планеты, знаки зодиака, звёзды
  const GLYPHS = [
    "☉", "☽", "☿", "♀", "♂", "♃", "♄", "♅", "♆", "♇",
    "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓",
    "✦", "✧", "✶", "❂", "☾", "✷", "⚝",
  ];

  // пул «рендереров» символа → HTML
  const pool = [];
  GLYPHS.forEach((g) => pool.push(() => `<span class="d-glyph">${g}︎</span>`));
  Object.keys(SYM).forEach((n) =>
    pool.push(() => `<svg viewBox="0 0 100 100" class="d-svg" aria-hidden="true">${SYM[n]}</svg>`));
  const pick = () => pool[(Math.random() * pool.length) | 0]();

  function build() {
    const layer = document.createElement("div");
    layer.id = "cosmos-decor";
    layer.setAttribute("aria-hidden", "true");

    const w = window.innerWidth;
    const n = w < 620 ? 8 : w < 1000 ? 12 : 18;
    const sprites = [];

    for (let i = 0; i < n; i++) {
      // X смещён к краям (в поля по бокам от текста), редко — ближе к центру
      const side = Math.random() < 0.5 ? rand(0.5, 15) : rand(85, 99.5);
      const x = Math.random() < 0.84 ? side : rand(22, 78);
      const y = rand(1, 99);
      const size = rand(30, 92);
      const depth = rand(-0.20, 0.30);       // параллакс
      const rotF = rand(-0.05, 0.05);        // поворот на пиксель прокрутки
      const xAmp = rand(8, 34), xFreq = rand(0.0007, 0.0022), phase = rand(0, 6.28);
      // на узких экранах прозрачнее (поля меньше — символы ближе к тексту)
      const op = (w < 620 ? rand(0.05, 0.10) : rand(0.07, 0.17)).toFixed(3);

      const a = pick();
      let b = pick(); let guard = 0;
      while (b === a && guard++ < 5) b = pick();

      const sp = document.createElement("div");
      sp.className = "decor-sprite";
      sp.style.cssText =
        `left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;width:${size.toFixed(0)}px;height:${size.toFixed(0)}px;` +
        `font-size:${size.toFixed(0)}px;opacity:${op};` +
        `animation-duration:${rand(7, 13).toFixed(1)}s;animation-delay:${(-rand(0, 7)).toFixed(1)}s;`;
      sp.innerHTML =
        `<div class="decor-float" style="animation-duration:${rand(10, 22).toFixed(1)}s;animation-delay:${(-rand(0, 14)).toFixed(1)}s">` +
        `<div class="decor-morph">` +
        `<span class="sym a" style="animation-duration:${rand(11, 19).toFixed(1)}s;animation-delay:${(-rand(0, 11)).toFixed(1)}s">${a}</span>` +
        `<span class="sym b" style="animation-duration:${rand(11, 19).toFixed(1)}s;animation-delay:${(-rand(0, 11)).toFixed(1)}s">${b}</span>` +
        `</div></div>`;
      layer.appendChild(sp);
      sprites.push({ el: sp, depth, rotF, xAmp, xFreq, phase });
    }
    document.body.appendChild(layer);
    return sprites;
  }

  function init() {
    if (document.getElementById("cosmos-decor")) return;
    const sprites = build();
    if (reduce) return; // статичный фон, без параллакса

    let ticking = false;
    function update() {
      ticking = false;
      const sy = window.scrollY || window.pageYOffset || 0;
      for (const s of sprites) {
        const ty = sy * s.depth;
        const tx = Math.sin(sy * s.xFreq + s.phase) * s.xAmp;
        const rot = sy * s.rotF;
        s.el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg)`;
      }
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
  window.PhysalisDecor = { init };
})();
