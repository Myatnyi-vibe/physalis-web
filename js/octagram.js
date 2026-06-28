// octagram.js — октаграмма матрицы судьбы как золочёная гравюрная эмблема
// на тёмном сумеречном фоне (направление «Золотой час Физалиса»).
(function () {
  const ANGLES = { day: 180, nw: 135, month: 90, ne: 45, year: 0, se: 315, karma: 270, sw: 225 };
  const D2R = Math.PI / 180;

  function polar(cx, cy, r, deg) {
    return [cx + r * Math.cos(deg * D2R), cy - r * Math.sin(deg * D2R)];
  }

  function node(cx, cy, r, deg, num, name, label, ring, big) {
    const [x, y] = polar(cx, cy, r, deg);
    const rad = big ? 33 : 27;
    const below = y > cy + 6;
    const labelY = below ? y + rad + 17 : y - rad - 9;
    return `
      <g class="oct-node">
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad + 3}" fill="none"
                stroke="${ring}" stroke-width="1" stroke-opacity="0.5" filter="url(#oct-glow)"/>
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad}" fill="#FBF2DF"
                stroke="${ring}" stroke-width="2"/>
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad}" fill="none"
                stroke="#E6CF9C" stroke-width="0.6" stroke-opacity="0.8"
                transform="scale(0.9)" transform-origin="${x.toFixed(1)} ${y.toFixed(1)}"/>
        <text x="${x.toFixed(1)}" y="${(y - 3).toFixed(1)}" text-anchor="middle"
              font-family="Playfair Display, Georgia, serif" font-style="italic"
              font-size="${big ? 25 : 21}" fill="#5A3B49">${num}</text>
        <text x="${x.toFixed(1)}" y="${(y + 13).toFixed(1)}" text-anchor="middle"
              font-family="Calibri, sans-serif" font-size="9" fill="#7A5B52">${name}</text>
        <text x="${x.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle"
              font-family="Calibri, sans-serif" font-size="11" font-weight="600"
              letter-spacing="0.06em" fill="#E6CF9C">${label}</text>
      </g>`;
  }

  function square(cx, cy, r, keys) {
    const pts = keys.map((k) => polar(cx, cy, r, ANGLES[k]).map((v) => v.toFixed(1)).join(",")).join(" ");
    return `
      <polygon points="${pts}" fill="none" stroke="#8C6A2E" stroke-width="2.4" stroke-opacity="0.9"/>
      <polygon points="${pts}" fill="none" stroke="#E6CF9C" stroke-width="0.8" stroke-opacity="0.85"/>`;
  }

  function renderOctagram(M) {
    const W = 620, H = 620, cx = W / 2, cy = H / 2, r = 208;
    const p = M.personal_square, a = M.ancestral_square;

    // звёздочки на 8 вершинах
    let vertexStars = "";
    Object.values(ANGLES).forEach((deg) => {
      const [vx, vy] = polar(cx, cy, r, deg);
      vertexStars += `<circle cx="${vx.toFixed(1)}" cy="${vy.toFixed(1)}" r="2" fill="#F0D58A" filter="url(#oct-glow)"/>`;
    });

    // внутренние диагонали-«чертёж»
    let diag = "";
    const order = ["day", "nw", "month", "ne", "year", "se", "karma", "sw"];
    order.forEach((k) => {
      const [x, y] = polar(cx, cy, r, ANGLES[k]);
      diag += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"
               stroke="#C9A24B" stroke-width="0.5" stroke-opacity="0.35" stroke-dasharray="2 5"/>`;
    });

    const nodes = [
      node(cx, cy, r, ANGLES.day,   p.day_visitka.num,  p.day_visitka.name,  "визитка",  "#D4AF6A"),
      node(cx, cy, r, ANGLES.month, p.month_talents.num, p.month_talents.name, "таланты", "#D4AF6A"),
      node(cx, cy, r, ANGLES.year,  p.year_money.num,   p.year_money.name,   "деньги",   "#D4AF6A"),
      node(cx, cy, r, ANGLES.karma, p.karma_lesson.num, p.karma_lesson.name, "карма",    "#D4AF6A"),
      node(cx, cy, r, ANGLES.nw,    a.nw_mother.num,    a.nw_mother.name,    "мама",     "#C9A24B"),
      node(cx, cy, r, ANGLES.ne,    a.ne_father.num,    a.ne_father.name,    "папа",     "#C9A24B"),
      node(cx, cy, r, ANGLES.se,    a.se.num,           a.se.name,           "род",      "#C9A24B"),
      node(cx, cy, r, ANGLES.sw,    a.sw.num,           a.sw.name,           "род",      "#C9A24B"),
    ].join("");

    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="octagram">
      <defs>
        <radialGradient id="oct-center" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stop-color="#FBF2DF"/>
          <stop offset="70%" stop-color="#F4E4D2"/>
          <stop offset="100%" stop-color="#E7C6A6"/>
        </radialGradient>
        <radialGradient id="oct-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(242,180,92,0.55)"/>
          <stop offset="55%" stop-color="rgba(217,169,78,0.18)"/>
          <stop offset="100%" stop-color="rgba(92,56,72,0)"/>
        </radialGradient>
        <filter id="oct-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <circle cx="${cx}" cy="${cy}" r="250" fill="url(#oct-halo)" class="glow-breathe"/>
      <circle cx="${cx}" cy="${cy}" r="${r + 30}" fill="none" stroke="#C9A24B" stroke-width="0.8" stroke-opacity="0.4"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#B98E4A" stroke-width="0.8" stroke-opacity="0.4" stroke-dasharray="2 7"/>
      ${diag}
      ${square(cx, cy, r, ["day", "month", "year", "karma"])}
      ${square(cx, cy, r, ["nw", "ne", "se", "sw"])}
      ${vertexStars}

      <g class="glow-breathe">
        <circle cx="${cx}" cy="${cy}" r="48" fill="url(#oct-halo)"/>
      </g>
      <circle cx="${cx}" cy="${cy}" r="40" fill="url(#oct-center)" stroke="#C9A24B" stroke-width="2.2"/>
      <circle cx="${cx}" cy="${cy}" r="34" fill="none" stroke="#E6CF9C" stroke-width="0.7"/>
      <text x="${cx}" y="${cy - 3}" text-anchor="middle" font-family="Playfair Display, Georgia, serif"
            font-style="italic" font-size="30" fill="#5A3B49">${M.center_comfort.num}</text>
      <text x="${cx}" y="${cy + 15}" text-anchor="middle" font-family="Calibri, sans-serif"
            font-size="10" fill="#7A5B52">${M.center_comfort.name}</text>
      <text x="${cx}" y="${cy + 64}" text-anchor="middle" font-family="Calibri, sans-serif"
            font-size="11" font-weight="600" letter-spacing="0.1em" fill="#E6CF9C">центр · зона комфорта</text>

      ${nodes}
    </svg>`;
  }

  window.PhysalisOctagram = { renderOctagram };
})();
