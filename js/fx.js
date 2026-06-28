// fx.js — атмосферные эффекты: звёздное поле, появление по скроллу, падающая звезда.
(function () {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function rand(a, b) { return a + Math.random() * (b - a); }

  // заполнить .starfield тёплыми золотыми звёздами
  function fillStarfield(field) {
    if (field.dataset.filled) return;
    field.dataset.filled = "1";
    const n = Math.max(26, Math.round(field.clientWidth * field.clientHeight / 5200));
    let html = "";
    for (let i = 0; i < n; i++) {
      const s = rand(0.8, 2.6).toFixed(2);
      html += `<span class="star" style="left:${rand(1,99).toFixed(1)}%;top:${rand(1,99).toFixed(1)}%;`
        + `width:${s}px;height:${s}px;--tw:${rand(2.6,6).toFixed(1)}s;--td:${rand(0,5).toFixed(1)}s;`
        + `opacity:${rand(0.3,0.9).toFixed(2)}"></span>`;
    }
    field.innerHTML = html;
  }

  // появление блоков
  let io = null;
  function ensureObserver() {
    if (io || reduce || !("IntersectionObserver" in window)) return;
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  }

  function decorate(root) {
    root = root || document;
    // звёздные поля
    root.querySelectorAll(".starfield").forEach(fillStarfield);
    // падающая звезда в сумеречных панелях
    root.querySelectorAll(".dusk").forEach((d) => {
      if (!d.querySelector(".shooting-star") && !reduce) {
        const s = document.createElement("span"); s.className = "shooting-star";
        d.appendChild(s);
      }
    });
    // появление
    ensureObserver();
    const sel = ".reveal";
    root.querySelectorAll(sel).forEach((el) => {
      if (el.dataset.revealObserved) return;
      el.dataset.revealObserved = "1";
      if (io) io.observe(el); else el.classList.add("in");
    });
  }

  window.PhysalisFX = { decorate, fillStarfield };
  document.addEventListener("DOMContentLoaded", () => decorate(document));
})();
