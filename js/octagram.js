// octagram.js — отрисовка октаграммы матрицы судьбы в SVG (палитра «Физалис»).

const PAL = {
  cream: "#FBF5EC", peach: "#F4E4D2", band: "#EFD8C0",
  plum: "#6B4A59", cardTitle: "#50404A", text: "#4B4340",
  coral: "#C16A52", muted: "#9B8F87",
  sage: "#93A877", rust: "#C56B47", amber: "#C99A52", peachAcc: "#DFA06A",
};

// углы точек (математические градусы, 0° — вправо, против часовой)
const ANGLES = {
  day: 180, nw: 135, month: 90, ne: 45,
  year: 0, se: 315, karma: 270, sw: 225,
};

function polar(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
}

function node(cx, cy, r, deg, num, name, label, color, big) {
  const [x, y] = polar(cx, cy, r, deg);
  const rad = big ? 34 : 27;
  const below = y > cy + 4;
  const labelY = below ? y + rad + 16 : y - rad - 8;
  return `
    <g>
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad}"
              fill="${PAL.peach}" stroke="${color}" stroke-width="2.5"/>
      <text x="${x.toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="middle"
            font-family="Playfair Display, Georgia, serif" font-style="italic"
            font-size="${big ? 26 : 22}" fill="${PAL.plum}">${num}</text>
      <text x="${x.toFixed(1)}" y="${(y + 14).toFixed(1)}" text-anchor="middle"
            font-family="Calibri, sans-serif" font-size="9.5" fill="${PAL.cardTitle}">${name}</text>
      <text x="${x.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle"
            font-family="Calibri, sans-serif" font-size="11" font-weight="600"
            fill="${color}">${label}</text>
    </g>`;
}

function poly(cx, cy, r, keys, color) {
  const pts = keys.map((k) => polar(cx, cy, r, ANGLES[k]).map((v) => v.toFixed(1)).join(",")).join(" ");
  return `<polygon points="${pts}" fill="none" stroke="${color}" stroke-width="1.6" stroke-opacity="0.55"/>`;
}

function renderOctagram(M) {
  const W = 620, H = 620, cx = W / 2, cy = H / 2, r = 220;
  const p = M.personal_square, a = M.ancestral_square;

  const personalPoly = poly(cx, cy, r, ["day", "month", "year", "karma"], PAL.rust);
  const ancestralPoly = poly(cx, cy, r, ["nw", "ne", "se", "sw"], PAL.sage);

  // центр
  const [ccx, ccy] = [cx, cy];
  const centerNode = `
    <circle cx="${ccx}" cy="${ccy}" r="40" fill="${PAL.band}" stroke="${PAL.coral}" stroke-width="3"/>
    <text x="${ccx}" y="${ccy - 4}" text-anchor="middle" font-family="Playfair Display, Georgia, serif"
          font-style="italic" font-size="30" fill="${PAL.plum}">${M.center_comfort.num}</text>
    <text x="${ccx}" y="${ccy + 15}" text-anchor="middle" font-family="Calibri, sans-serif"
          font-size="10" fill="${PAL.cardTitle}">${M.center_comfort.name}</text>
    <text x="${ccx}" y="${ccy + 60}" text-anchor="middle" font-family="Calibri, sans-serif"
          font-size="11" font-weight="600" fill="${PAL.coral}">центр · зона комфорта</text>`;

  const nodes = [
    node(cx, cy, r, ANGLES.day,   p.day_visitka.num,  p.day_visitka.name,  "визитка",  PAL.rust),
    node(cx, cy, r, ANGLES.month, p.month_talents.num, p.month_talents.name, "таланты", PAL.rust),
    node(cx, cy, r, ANGLES.year,  p.year_money.num,   p.year_money.name,   "деньги",   PAL.rust),
    node(cx, cy, r, ANGLES.karma, p.karma_lesson.num, p.karma_lesson.name, "карма",    PAL.rust),
    node(cx, cy, r, ANGLES.nw,    a.nw_mother.num,    a.nw_mother.name,    "мама",     PAL.sage),
    node(cx, cy, r, ANGLES.ne,    a.ne_father.num,    a.ne_father.name,    "папа",     PAL.sage),
    node(cx, cy, r, ANGLES.se,    a.se.num,           a.se.name,           "род",      PAL.sage),
    node(cx, cy, r, ANGLES.sw,    a.sw.num,           a.sw.name,           "род",      PAL.sage),
  ].join("");

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="octagram">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${PAL.band}" stroke-width="1" stroke-dasharray="3 5"/>
    ${personalPoly}
    ${ancestralPoly}
    ${centerNode}
    ${nodes}
  </svg>`;
}

window.PhysalisOctagram = { renderOctagram, PAL };
