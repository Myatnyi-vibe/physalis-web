// wheel.js — круглое колесо натальной карты (SVG).
// Зодиакальный пояс, дома (whole-sign), планеты по эклиптической долготе, аспекты.
// Цвета берутся из CSS-переменных, чтобы соответствовать теме сайта.
(function () {
  const SIGN_GLYPH = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"]
    .map((g) => g + "︎"); // + U+FE0E: текстовое начертание вместо эмодзи
  // элемент знака → цвет (CSS var): огонь, земля, воздух, вода
  const ELEM_VAR = ["--w-fire","--w-earth","--w-air","--w-water"];
  const D2R = Math.PI / 180;
  const norm = (x) => ((x % 360) + 360) % 360;

  function makeWheel(R, size) {
    size = size || 640;
    const cx = size / 2, cy = size / 2;
    const rOut   = size * 0.470;  // внешняя окружность
    const rSign  = size * 0.398;  // внутренняя граница пояса знаков
    const rHouse = size * 0.330;  // кольцо домов
    const rPlanet= size * 0.300;  // базовый радиус планет
    const rHub   = size * 0.230;  // окружность для линий аспектов
    const ascLon = R.asc.lon;

    // долгота → экранный угол (Асцендент слева, IC снизу, конвенция)
    const ang = (lon) => (180 - (lon - ascLon)) * D2R;
    const pt = (lon, r) => [cx + r * Math.cos(ang(lon)), cy + r * Math.sin(ang(lon))];
    const P = (lon, r) => { const [x, y] = pt(lon, r); return x.toFixed(1) + "," + y.toFixed(1); };

    // путь-сектор кольца (сэмплируем дугу мелкими шагами)
    function ring(lon0, lon1, rIn, rO) {
      const steps = Math.max(6, Math.round((lon1 - lon0) / 2));
      let d = "M " + P(lon0, rO);
      for (let i = 1; i <= steps; i++) d += " L " + P(lon0 + (lon1 - lon0) * i / steps, rO);
      d += " L " + P(lon1, rIn);
      for (let i = 1; i <= steps; i++) d += " L " + P(lon1 - (lon1 - lon0) * i / steps, rIn);
      return d + " Z";
    }

    let s = "";

    // фоновые окружности
    s += `<circle cx="${cx}" cy="${cy}" r="${rOut}" fill="var(--w-bg)" stroke="var(--w-line)" stroke-width="1.5"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${rSign}" fill="none" stroke="var(--w-line)" stroke-width="1"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${rHouse}" fill="none" stroke="var(--w-line)" stroke-width="1" stroke-opacity="0.7"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${rHub}" fill="var(--w-hub)" stroke="var(--w-line)" stroke-width="1" stroke-opacity="0.6"/>`;

    // секторы знаков + глифы + деления
    for (let i = 0; i < 12; i++) {
      const l0 = i * 30;
      s += `<path d="${ring(l0, l0 + 30, rSign, rOut)}" fill="var(${ELEM_VAR[i % 4]})" fill-opacity="0.30" stroke="none"/>`;
      s += `<line x1="${P(l0, rSign).split(",")[0]}" y1="${P(l0, rSign).split(",")[1]}"
             x2="${P(l0, rOut).split(",")[0]}" y2="${P(l0, rOut).split(",")[1]}"
             stroke="var(--w-line)" stroke-width="1"/>`;
      const [gx, gy] = pt(l0 + 15, (rSign + rOut) / 2);
      s += `<text x="${gx.toFixed(1)}" y="${(gy + 7).toFixed(1)}" text-anchor="middle"
             font-size="${(size*0.040).toFixed(0)}" fill="var(--w-glyph)">${SIGN_GLYPH[i]}</text>`;
      // градусные деления каждые 5°
      for (let dgr = 0; dgr < 30; dgr += 5) {
        const big = dgr % 10 === 0;
        const [x1, y1] = pt(l0 + dgr, rSign);
        const [x2, y2] = pt(l0 + dgr, rSign - (big ? size*0.018 : size*0.010));
        s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
               stroke="var(--w-line)" stroke-width="${big ? 1 : 0.6}" stroke-opacity="0.7"/>`;
      }
    }

    // дома (whole-sign): границы = границы знаков; номер — в середине сектора
    const ascSign = Math.floor(norm(ascLon) / 30);
    for (let h = 0; h < 12; h++) {
      const signIdx = (ascSign + h) % 12;
      const lmid = signIdx * 30 + 15;
      const [hx, hy] = pt(lmid, (rHouse + rHub) / 2 + size*0.02);
      s += `<text x="${hx.toFixed(1)}" y="${(hy + 4).toFixed(1)}" text-anchor="middle"
             font-size="${(size*0.022).toFixed(0)}" fill="var(--w-house)" opacity="0.85">${h + 1}</text>`;
      // спица на границе дома
      const [sx1, sy1] = pt(signIdx * 30, rHub);
      const [sx2, sy2] = pt(signIdx * 30, rHouse);
      s += `<line x1="${sx1.toFixed(1)}" y1="${sy1.toFixed(1)}" x2="${sx2.toFixed(1)}" y2="${sy2.toFixed(1)}"
             stroke="var(--w-line)" stroke-width="0.8" stroke-opacity="0.5"/>`;
    }

    // оси ASC / MC / DSC / IC
    function axis(lon, label, strong) {
      const [x1, y1] = pt(lon, rHub);
      const [x2, y2] = pt(lon, rOut);
      s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
             stroke="var(--w-axis)" stroke-width="${strong ? 2 : 1.2}" stroke-dasharray="${strong ? "none" : "4 4"}"/>`;
      const [lx, ly] = pt(lon, rOut + size*0.022);
      s += `<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle"
             font-size="${(size*0.024).toFixed(0)}" font-weight="700" fill="var(--w-axis)">${label}</text>`;
    }
    axis(R.asc.lon, "ASC", true);
    axis(R.mc.lon, "MC", true);
    axis(norm(R.asc.lon + 180), "DSC", false);
    axis(norm(R.mc.lon + 180), "IC", false);

    // линии аспектов в центре
    (R.aspects || []).forEach((a) => {
      const [x1, y1] = pt(a.a.lon, rHub);
      const [x2, y2] = pt(a.b.lon, rHub);
      const col = a.kind === "harmony" ? "var(--w-harm)" : a.kind === "tense" ? "var(--w-tense)" : "var(--w-neutral)";
      s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
             stroke="${col}" stroke-width="1.3" stroke-opacity="0.75"/>`;
    });

    // планеты (с разведением по радиусу при скучивании)
    const sorted = R.planets.map((p, i) => ({ p, i })).sort((a, b) => a.p.lon - b.p.lon);
    let lastLon = -999, level = 0;
    const placed = [];
    sorted.forEach(({ p }) => {
      if (norm(p.lon - lastLon) < 8) level = (level + 1) % 3; else level = 0;
      lastLon = p.lon;
      placed.push({ p, r: rPlanet - level * size * 0.045 });
    });
    placed.forEach(({ p, r }) => {
      // тик от пояса знаков к планете (точный градус)
      const [tx1, ty1] = pt(p.lon, rSign);
      const [tx2, ty2] = pt(p.lon, r + size*0.022);
      s += `<line x1="${tx1.toFixed(1)}" y1="${ty1.toFixed(1)}" x2="${tx2.toFixed(1)}" y2="${ty2.toFixed(1)}"
             stroke="var(--w-line)" stroke-width="0.8" stroke-opacity="0.6"/>`;
      const [px, py] = pt(p.lon, r);
      s += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(size*0.026).toFixed(1)}"
             fill="var(--w-planet-bg)" stroke="var(--w-planet-stroke)" stroke-width="1"/>`;
      s += `<text x="${px.toFixed(1)}" y="${(py + size*0.012).toFixed(1)}" text-anchor="middle"
             font-size="${(size*0.030).toFixed(0)}" fill="var(--w-planet)">${p.glyph}</text>`;
      const deg = Math.floor(p.degInSign);
      const [dx, dy] = pt(p.lon, r - size*0.040);
      s += `<text x="${dx.toFixed(1)}" y="${(dy + 3).toFixed(1)}" text-anchor="middle"
             font-size="${(size*0.016).toFixed(0)}" fill="var(--w-muted)">${deg}°${p.retro ? " ℞" : ""}</text>`;
    });

    return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" class="natal-wheel">${s}</svg>`;
  }

  window.PhysalisWheel = { makeWheel };
})();
