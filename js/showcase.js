// showcase.js — большие scroll-driven визуализации (как у Apple):
// солнечная система, веер карт Таро, вращающееся колесо зодиака.
(function () {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const TAU = Math.PI * 2;

  const SIGNS = ["Овен","Телец","Близнецы","Рак","Лев","Дева","Весы","Скорпион","Стрелец","Козерог","Водолей","Рыбы"];
  const SIGN_G = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
  const ELEM = ["Огонь","Земля","Воздух","Вода"];

  // ===================== СОЛНЕЧНАЯ СИСТЕМА =====================
  // [имя, глиф, орбита rx (доля 500), радиус планеты, цвет, скорость оборотов]
  const PLANETS = [
    ["Меркурий","☿",0.20,9,"#C9A98A",3.1],
    ["Венера","♀",0.27,13,"#E6C07A",2.3],
    ["Земля","⊕",0.345,14,"#7FA7C9",1.8],
    ["Марс","♂",0.42,11,"#C56B47",1.45],
    ["Юпитер","♃",0.55,26,"#D9B48A",0.95],
    ["Сатурн","♄",0.67,22,"#E1CFA0",0.72],
    ["Уран","♅",0.78,16,"#9DC7C2",0.54],
    ["Нептун","♆",0.88,16,"#8090C0",0.42],
  ];

  function buildSolar(stage) {
    const C = 500, R = 500;
    let defs = `<defs>
      <radialGradient id="sunG" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FFF4D6"/><stop offset="40%" stop-color="#F2B45C"/>
        <stop offset="80%" stop-color="#E0852F"/><stop offset="100%" stop-color="#C05A22"/>
      </radialGradient>
      <radialGradient id="sunHalo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(248,210,140,.9)"/><stop offset="45%" stop-color="rgba(230,160,80,.35)"/>
        <stop offset="100%" stop-color="rgba(120,60,40,0)"/>
      </radialGradient>
      <filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3"/></filter>
    </defs>`;
    // орбиты
    let orbits = "";
    PLANETS.forEach((p) => {
      const rx = p[2] * R, ry = rx * 0.34;
      orbits += `<ellipse cx="${C}" cy="${C}" rx="${rx.toFixed(0)}" ry="${ry.toFixed(0)}" fill="none" stroke="#C9A24B" stroke-opacity="0.22" stroke-width="1"/>`;
    });
    // солнце
    const sun = `<circle cx="${C}" cy="${C}" r="150" fill="url(#sunHalo)" class="glow-breathe"/>
      <circle cx="${C}" cy="${C}" r="46" fill="url(#sunG)"/>
      <circle cx="${C}" cy="${C}" r="46" fill="none" stroke="#FFE7B0" stroke-opacity=".6" stroke-width="1.5"/>`;
    // планеты
    let plg = "";
    PLANETS.forEach((p, i) => {
      const ring = p[0] === "Сатурн"
        ? `<ellipse cx="0" cy="0" rx="${p[3]*1.9}" ry="${p[3]*0.7}" fill="none" stroke="#E1CFA0" stroke-opacity=".7" stroke-width="2" transform="rotate(-18)"/>` : "";
      plg += `<g class="solar-planet" id="solp-${i}">
        <circle cx="0" cy="0" r="${p[3]+4}" fill="${p[4]}" opacity="0.25" filter="url(#soft)"/>
        <circle cx="0" cy="0" r="${p[3]}" fill="${p[4]}"/>
        ${ring}
        <text class="solar-label" x="0" y="${p[3]+16}" text-anchor="middle">${p[0]}</text>
      </g>`;
    });
    stage.innerHTML = `<svg viewBox="0 0 1000 1000">${defs}${orbits}${sun}${plg}</svg>`;

    const els = PLANETS.map((p, i) => ({
      g: stage.querySelector("#solp-" + i),
      label: stage.querySelector("#solp-" + i + " .solar-label"),
      rx: p[2] * R, ry: p[2] * R * 0.34, base: (i * 0.7) % TAU, speed: p[5],
    }));

    return function (prog) {
      // лёгкий «въезд» системы
      const intro = clamp(prog / 0.12, 0, 1);
      els.forEach((e) => {
        const a = e.base + prog * e.speed * TAU;
        const x = C + e.rx * Math.cos(a);
        const y = C + e.ry * Math.sin(a);
        const depth = 0.7 + 0.45 * (Math.sin(a) + 1) / 2; // ближе к зрителю — крупнее
        e.g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(depth*intro).toFixed(3)})`);
        if (e.label) e.label.style.opacity = (prog > 0.55 ? clamp((prog - 0.55) / 0.2, 0, 1) * 0.9 : 0);
      });
    };
  }

  // ===================== ВЕЕР КАРТ ТАРО =====================
  const FAN = [
    [1, "Маг"], [7, "Колесница"], [10, "Колесо Фортуны"], [17, "Звезда"], [21, "Мир"],
  ];
  function roman(n) { const m=[[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]]; let r=""; for(const[v,s]of m){while(n>=v){r+=s;n-=v;}} return r||"•"; }
  const ART = () => window.PhysalisArcanaArt || {};
  const DEF_ART = '<g stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M100 44 L112 92 L160 104 L112 116 L100 164 L88 116 L40 104 L88 92 Z"/></g>';

  function buildTarot(stage) {
    const cards = FAN.map(([num, name]) => {
      const art = ART()[String(num)] || DEF_ART;
      const el = document.createElement("div");
      el.className = "fan-card";
      el.innerHTML =
        `<div class="fan-face">
           <div class="fan-num">${roman(num)}</div>
           <div class="fan-art"><svg viewBox="0 0 200 240" preserveAspectRatio="xMidYMid meet">${art}</svg></div>
           <div class="fan-name">${name}</div>
         </div>
         <div class="fan-back"><span class="bmark">✦</span></div>`;
      stage.appendChild(el);
      return el;
    });
    const n = cards.length, mid = (n - 1) / 2;
    return function (prog) {
      cards.forEach((el, i) => {
        const local = clamp((prog - i * 0.07) / 0.45, 0, 1); // стаггер
        const off = i - mid;
        const ang = lerp(0, off * 17, local);          // веер
        const x = lerp(0, off * 150, local);            // разлёт
        const y = lerp(0, Math.abs(off) * 26, local);   // дуга
        const flip = lerp(180, 0, local);               // переворот рубашка→лицо
        const sc = lerp(0.82, 1, local);
        el.style.zIndex = String(50 - Math.abs(off) * 5 + Math.round(local * 5));
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotateZ(${ang.toFixed(2)}deg) rotateY(${flip.toFixed(1)}deg) scale(${sc.toFixed(3)})`;
      });
    };
  }

  // ===================== КОЛЕСО ЗОДИАКА =====================
  function buildZodiac(stage) {
    const ringSvg = document.createElement("div");
    ringSvg.className = "zodiac-ring";
    ringSvg.innerHTML = `<svg viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="46" fill="none" stroke="#C9A24B" stroke-opacity=".35" stroke-width=".5" stroke-dasharray="1 3"/>
      <circle cx="50" cy="50" r="33" fill="none" stroke="#C9A24B" stroke-opacity=".25" stroke-width=".5"/>
    </svg>`;
    stage.appendChild(ringSvg);

    const core = document.createElement("div");
    core.className = "zodiac-core";
    core.innerHTML = `<div><div class="zname"></div><div class="zel"></div></div>`;
    stage.appendChild(core);
    const nameEl = core.querySelector(".zname"), elEl = core.querySelector(".zel");

    const signs = SIGN_G.map((g, i) => {
      const d = document.createElement("div");
      d.className = "zsign";
      d.innerHTML = `<span class="zg">${g}︎</span>`;
      stage.appendChild(d);
      return d;
    });

    return function (prog) {
      const Rr = stage.clientWidth * 0.40;
      const rot = prog * TAU; // полный оборот за секцию
      let active = 0, bestY = Infinity;
      signs.forEach((d, i) => {
        const phi = (i / 12) * TAU + rot - Math.PI / 2;
        const x = Math.cos(phi) * Rr, y = Math.sin(phi) * Rr;
        d.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        if (y < bestY) { bestY = y; active = i; }       // самый верхний — активный
      });
      signs.forEach((d, i) => d.classList.toggle("active", i === active));
      nameEl.textContent = SIGNS[active];
      elEl.textContent = ELEM[active % 4];
    };
  }

  // ===================== ПРОГРЕСС / СКРОЛЛ =====================
  function progressOf(section) {
    const rect = section.getBoundingClientRect();
    const total = section.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    return clamp(-rect.top / total, 0, 1);
  }

  function init() {
    const builders = { solar: buildSolar, tarot: buildTarot, zodiac: buildZodiac };
    const items = [];
    document.querySelectorAll(".showcase").forEach((sec) => {
      const kind = sec.dataset.show;
      const stage = sec.querySelector(".show-stage");
      if (!builders[kind] || !stage) return;
      const update = builders[kind](stage);
      const sub = sec.querySelector(".show-sub");
      items.push({ sec, update, sub });
      update(reduce ? 0.5 : 0); // статичный приятный кадр / старт
    });
    if (reduce || !items.length) return;

    let ticking = false;
    function frame() {
      ticking = false;
      for (const it of items) {
        const p = progressOf(it.sec);
        it.update(p);
        if (it.sub) it.sub.classList.toggle("on", p > 0.15 && p < 0.9);
      }
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    frame();
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
