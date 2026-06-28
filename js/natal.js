// natal.js — расчёт натальной карты на эфемеридах (astronomy-engine).
// Тропический зодиак, дома — по знакам (whole-sign), асцендент и MC из формул.

const SIGNS = [
  "Овен", "Телец", "Близнецы", "Рак", "Лев", "Дева",
  "Весы", "Скорпион", "Стрелец", "Козерог", "Водолей", "Рыбы",
];
// U+FE0E — селектор «текстового» начертания: не даёт глифам уехать в эмодзи.
const TEXT_VS = "︎";
const SIGN_GLYPH = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"]
  .map((g) => g + TEXT_VS);
const ELEMENTS = ["Огонь", "Земля", "Воздух", "Вода"]; // по индексу знака % 4
const SIGN_RULER = [
  "Марс", "Венера", "Меркурий", "Луна", "Солнце", "Меркурий",
  "Венера", "Плутон", "Юпитер", "Сатурн", "Уран", "Нептун",
];
const SIGN_MEANING = [
  "импульс, инициатива, лидерство, прямота",
  "устойчивость, чувственность, ценности, надёжность",
  "любознательность, общение, гибкость ума",
  "чувствительность, забота, дом, память",
  "творчество, достоинство, щедрость, сцена",
  "анализ, служение, порядок, мастерство",
  "гармония, партнёрство, эстетика, дипломатия",
  "глубина, страсть, трансформация, воля",
  "поиск смысла, свобода, расширение, вера",
  "цель, дисциплина, статус, ответственность",
  "оригинальность, идеи, свобода, человечность",
  "сострадание, мечта, интуиция, растворение",
];

// Планеты: [имя RU, Body astronomy-engine, символ, краткий смысл]
const PLANETS = [
  ["Солнце", "Sun", "☉", "ядро личности, воля, жизненная сила"],
  ["Луна", "Moon", "☽", "эмоции, потребности, внутренний дом"],
  ["Меркурий", "Mercury", "☿", "ум, речь, обучение, связи"],
  ["Венера", "Venus", "♀", "любовь, ценности, вкус, деньги"],
  ["Марс", "Mars", "♂", "энергия, действие, желание, борьба"],
  ["Юпитер", "Jupiter", "♃", "рост, удача, смысл, расширение"],
  ["Сатурн", "Saturn", "♄", "дисциплина, границы, зрелость, время"],
  ["Уран", "Uranus", "♅", "свобода, прорыв, оригинальность"],
  ["Нептун", "Neptune", "♆", "мечта, интуиция, искусство, иллюзии"],
  ["Плутон", "Pluto", "♇", "власть, трансформация, глубина"],
];

const HOUSE_MEANING = [
  "личность, тело, первое впечатление",
  "деньги, ресурсы, ценности, тело",
  "ум, общение, ближнее окружение, учёба",
  "дом, корни, семья, фундамент",
  "творчество, любовь, дети, самовыражение",
  "работа, здоровье, рутина, служение",
  "партнёрство, брак, открытые враги",
  "кризисы, секс, чужие ресурсы, трансформация",
  "смысл, путешествия, вера, высшее образование",
  "карьера, статус, цель, репутация",
  "друзья, сообщества, мечты, будущее",
  "тайное, подсознание, уединение, завершения",
];

const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const norm360 = (x) => ((x % 360) + 360) % 360;

function meanObliquity(T) {
  // средний наклон эклиптики (градусы), Meeus, точность до долей секунды
  const sec = 84381.448 - 46.8150 * T - 0.00059 * T * T + 0.001813 * T * T * T;
  return sec / 3600;
}

function signOf(lon) {
  const idx = Math.floor(norm360(lon) / 30);
  const deg = norm360(lon) - idx * 30;
  return { idx, sign: SIGNS[idx], glyph: SIGN_GLYPH[idx],
           element: ELEMENTS[idx % 4], degInSign: deg };
}

function fmtDeg(lon) {
  const s = signOf(lon);
  const d = Math.floor(s.degInSign);
  const m = Math.round((s.degInSign - d) * 60);
  const mm = m === 60 ? 0 : m;
  const dd = m === 60 ? d + 1 : d;
  return `${dd}°${String(mm).padStart(2, "0")}′ ${s.sign}`;
}

function eclipticLon(A, body, date) {
  const vec = A.GeoVector(A.Body[body], date, true); // EQJ, с аберрацией
  const ecl = A.Ecliptic(vec);                       // → эклиптика даты
  return norm360(ecl.elon);
}

// Дробный JS-Date в UTC из локального времени и смещения часового пояса.
function utcDate(y, mo, d, hh, mm, tzOffsetHours) {
  const ms = Date.UTC(y, mo - 1, d, hh, mm, 0) - tzOffsetHours * 3600 * 1000;
  return new Date(ms);
}

function computeNatal(opts) {
  // opts: {y,mo,d,hh,mm,tz,lat,lon}  (lon восток +, tz часы от UTC)
  const A = window.Astronomy;
  const date = utcDate(opts.y, opts.mo, opts.d, opts.hh, opts.mm, opts.tz);
  const time = A.MakeTime(date);
  const T = time.tt / 36525.0;
  const eps = meanObliquity(T);

  // позиции планет
  const planets = PLANETS.map(([name, body, glyph, sense]) => {
    const lon = eclipticLon(A, body, date);
    // ретроградность: сравнить с +2 часами
    const lon2 = eclipticLon(A, body, new Date(date.getTime() + 2 * 3600 * 1000));
    let delta = lon2 - lon;
    if (delta > 180) delta -= 360; if (delta < -180) delta += 360;
    const retro = body !== "Sun" && body !== "Moon" && delta < 0;
    const s = signOf(lon);
    return { name, glyph: glyph + TEXT_VS, sense, lon, retro,
             sign: s.sign, signGlyph: s.glyph, element: s.element,
             degInSign: s.degInSign, fmt: fmtDeg(lon), ruler: SIGN_RULER[s.idx],
             signMeaning: SIGN_MEANING[s.idx] };
  });

  // асцендент и MC
  const gast = A.SiderealTime(date);            // часы (GAST)
  const lstDeg = norm360(gast * 15 + opts.lon); // местное звёздное время в градусах
  const ramc = lstDeg * D2R;
  const e = eps * D2R;
  const lat = opts.lat * D2R;

  let mc = norm360(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(e)) * R2D);
  let asc = norm360(Math.atan2(
    Math.cos(ramc),
    -(Math.sin(ramc) * Math.cos(e) + Math.tan(lat) * Math.sin(e))
  ) * R2D);
  // асцендент должен лежать восточнее MC (0..180 по ходу долготы)
  if (norm360(asc - mc) > 180) asc = norm360(asc + 180);

  const ascS = signOf(asc), mcS = signOf(mc);

  // дома по знакам (whole-sign): 1-й дом = знак асцендента
  const houseSignStart = ascS.idx;
  const houses = [];
  for (let h = 0; h < 12; h++) {
    const idx = (houseSignStart + h) % 12;
    houses.push({ house: h + 1, sign: SIGNS[idx], glyph: SIGN_GLYPH[idx],
                  meaning: HOUSE_MEANING[h] });
  }
  const houseOf = (lon) => ((signOf(lon).idx - houseSignStart + 12) % 12) + 1;
  planets.forEach((p) => { p.house = houseOf(p.lon); p.houseMeaning = HOUSE_MEANING[p.house - 1]; });

  // стихии
  const elemCount = { "Огонь": 0, "Земля": 0, "Воздух": 0, "Вода": 0 };
  planets.forEach((p) => { elemCount[p.element]++; });

  // аспекты
  const ASPECTS = [
    { name: "соединение", angle: 0, orb: 8, glyph: "☌", kind: "neutral" },
    { name: "секстиль", angle: 60, orb: 4, glyph: "✶", kind: "harmony" },
    { name: "квадрат", angle: 90, orb: 6, glyph: "□", kind: "tense" },
    { name: "тригон", angle: 120, orb: 6, glyph: "△", kind: "harmony" },
    { name: "оппозиция", angle: 180, orb: 8, glyph: "☍", kind: "tense" },
  ];
  const aspects = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      let diff = Math.abs(planets[i].lon - planets[j].lon);
      if (diff > 180) diff = 360 - diff;
      for (const a of ASPECTS) {
        const orb = Math.abs(diff - a.angle);
        const lumin = ["Солнце", "Луна"].includes(planets[i].name) ||
                      ["Солнце", "Луна"].includes(planets[j].name);
        const maxOrb = a.orb + (lumin ? 1 : 0);
        if (orb <= maxOrb) {
          aspects.push({ a: planets[i], b: planets[j], type: a.name,
                         glyph: a.glyph, kind: a.kind, orb: orb });
          break;
        }
      }
    }
  }
  aspects.sort((x, y) => x.orb - y.orb);

  return {
    input: opts,
    utc: date.toISOString(),
    planets,
    asc: { lon: asc, fmt: fmtDeg(asc), sign: ascS.sign, glyph: ascS.glyph,
           meaning: SIGN_MEANING[ascS.idx] },
    mc: { lon: mc, fmt: fmtDeg(mc), sign: mcS.sign, glyph: mcS.glyph,
          meaning: SIGN_MEANING[mcS.idx] },
    houses,
    elements: elemCount,
    aspects,
  };
}

window.PhysalisNatal = {
  computeNatal, SIGNS, SIGN_GLYPH, PLANETS, signOf, fmtDeg, norm360,
};
