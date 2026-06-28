// app.js — связывает формы с расчётами и рисует результаты.
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const C = () => window.PhysalisContent || {};
  const ct = (cat, key) => ((C()[cat] || {})[String(key)] || "");
  const intro = (cat, key) => { const t = ct(cat, key); return t ? `<p class="intro">${esc(t)}</p>` : ""; };
  const concept = (key) => { const t = ct("natalConcepts", key); return t ? `<div class="concept reveal">${esc(t)}</div>` : ""; };

  // украшения: разделители под заголовками + классы появления
  function dress(html) {
    return html
      .replace(/<div class="section-title">([\s\S]*?)<\/div>/g,
        '<div class="section-title reveal">$1</div><div class="divider"><span class="mark">✦</span></div>')
      .replace(/<div class="cards">/g, '<div class="cards reveal">')
      .replace(/<table>/g, '<table class="reveal">')
      .replace(/<div class="chips">/g, '<div class="chips reveal">')
      .replace(/<div class="disclaimer">/g, '<div class="disclaimer reveal">');
  }
  function paint(id, html) {
    $(id).innerHTML = dress(html);
    if (window.PhysalisFX) window.PhysalisFX.decorate($(id));
  }
  const dusk = (inner, caption, extra) =>
    `<div class="dusk reveal${extra ? " " + extra : ""}"><div class="starfield"></div><div class="nebula"></div>${inner}` +
    (caption ? `<div class="dusk-caption">${caption}</div>` : "") + `</div>`;

  // ---------- Вкладки ----------
  document.querySelectorAll(".tab").forEach((t) => {
    t.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
      document.querySelectorAll(".panel").forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      $("panel-" + t.dataset.tab).classList.add("active");
    });
  });

  // ---------- Города → datalist + автоподстановка ----------
  const cities = window.PhysalisCities || [];
  const dl = $("city-list");
  cities.forEach(([name]) => { const o = document.createElement("option"); o.value = name; dl.appendChild(o); });
  $("n-city").addEventListener("change", (e) => {
    const c = cities.find(([n]) => n.toLowerCase() === e.target.value.trim().toLowerCase());
    if (c) { $("n-lat").value = c[1]; $("n-lon").value = c[2]; $("n-tz").value = c[3]; }
  });

  // ============================================================
  //  МАТРИЦА СУДЬБЫ
  // ============================================================
  const M = window.PhysalisMatrix;
  const OCT = window.PhysalisOctagram;

  // posKey — ключ пояснения позиции (что это за точка), num — аркан.
  function arcCard(cap, a, meanings, posKey) {
    const m = meanings[a.num] || {};
    const what = posKey ? ct("positions", posKey) : "";
    const prose = ct("arcana", a.num);
    const card = window.PhysalisTarot ? window.PhysalisTarot.card(a.num, a.name) : "";
    return `<div class="tarot-row reveal">
      ${card}
      <div class="tc-reading">
        <div class="cap">${esc(cap)}</div>
        ${what ? `<div class="what">${esc(what)}</div>` : ""}
        ${prose ? `<div class="prose">${esc(prose)}</div>`
                : `<div class="desc">${esc(m.keywords || "")}</div>`}
        ${m.plus ? `<div class="tag plus"><b>+ сильная сторона:</b> ${esc(m.plus)}</div>` : ""}
        ${m.minus ? `<div class="tag minus"><b>− зона роста:</b> ${esc(m.minus)}</div>` : ""}
      </div>
    </div>`;
  }

  function renderMatrix() {
    $("m-err").textContent = "";
    let d, mo, y;
    try {
      ({ d, mo, y } = M.parseDate($("m-date").value));
      if (mo < 1 || mo > 12 || d < 1 || d > 31) throw new Error("Проверьте день и месяц.");
    } catch (e) { $("m-err").textContent = e.message; return; }

    const data = M.computeMatrix(d, mo, y);
    const mn = data.arcana_meanings;
    const name = $("m-name").value.trim();
    const ps = data.personal_square, an = data.ancestral_square,
          pu = data.purpose, kt = data.karmic_tail;

    const years = Object.entries(data.personal_years)
      .map(([Y, v]) => `<tr><td>${Y}</td><td><span class="glyph">${v.num}</span> ${esc(v.name)}</td>
        <td class="desc">${esc((mn[v.num] || {}).keywords || "")}</td></tr>`).join("");

    const decades = data.age_decades
      .map((x) => `<tr><td>${x.age}–${x.age + 10} лет</td>
        <td><span class="glyph">${x.num}</span> ${esc(x.name)}</td>
        <td class="desc">${esc((mn[x.num] || {}).keywords || "")}</td></tr>`).join("");

    const dominant = data.dominant.length
      ? `<div class="chips">${data.dominant.map((x) =>
          `<span class="chip"><b>${x.num} ${esc(x.name)}</b> ×${x.count}</span>`).join("")}</div>`
      : `<p class="desc">Ярко выраженной доминанты нет — арканы распределены равномерно, ни одна тема не «перекрикивает» остальные.</p>`;

    const mhtml = `
      <h2>${name ? esc(name) + " · " : ""}Матрица судьбы</h2>
      <div class="sub">${data.birthdate}</div>
      ${dusk(OCT.renderOctagram(data), "Октаграмма судьбы · восьмиконечная звезда твоей карты")}
      <div class="toolbar"><button class="btn-min" onclick="window.print()">Печать / PDF</button></div>

      <div class="section-title">Личный квадрат</div>
      ${intro("positions", "sec_personal_square")}
      <div class="tarot-spread">
        ${arcCard("Визитка · день", ps.day_visitka, mn, "day_visitka")}
        ${arcCard("Таланты · месяц", ps.month_talents, mn, "month_talents")}
        ${arcCard("Деньги · год", ps.year_money, mn, "year_money")}
        ${arcCard("Главный урок · карма", ps.karma_lesson, mn, "karma_lesson")}
        ${arcCard("Зона комфорта · центр", data.center_comfort, mn, "center_comfort")}
      </div>

      <div class="section-title">Родовой квадрат</div>
      ${intro("positions", "sec_ancestral_square")}
      <div class="tarot-spread">
        ${arcCard("Линия мамы", an.nw_mother, mn, "nw_mother")}
        ${arcCard("Линия папы", an.ne_father, mn, "ne_father")}
        ${arcCard("Род · низ-лево", an.sw, mn, "sw_rod")}
        ${arcCard("Род · низ-право", an.se, mn, "se_rod")}
      </div>

      <div class="section-title">Предназначение</div>
      ${intro("positions", "sec_purpose")}
      <div class="tarot-spread">
        ${arcCard("Личное · до ~40 лет", pu.personal_to40, mn, "purpose_personal")}
        ${arcCard("Социальное · после ~40", pu.social_from40, mn, "purpose_social")}
        ${arcCard("Главное предназначение", pu.main, mn, "purpose_main")}
      </div>

      <div class="section-title">Кармический хвост</div>
      ${intro("positions", "sec_karmic_tail")}
      <div class="tarot-spread">
        ${arcCard("Вход в отношения", kt.entry_relationships, mn, "tail_entry")}
        ${arcCard("Середина пути · самореализация", kt.middle_selfrealization, mn, "tail_middle")}
        ${arcCard("Главное испытание", kt.main_test, mn, "tail_test")}
      </div>

      <div class="section-title">Доминанта карты</div>
      ${intro("positions", "dominant")}
      ${dominant}

      <div class="section-title">Возрастные декады</div>
      ${intro("positions", "decades")}
      <table><thead><tr><th>Возраст</th><th>Аркан</th><th>О чём период</th></tr></thead>
        <tbody>${decades}</tbody></table>

      <div class="section-title">Личные годы (2026–2035)</div>
      ${intro("positions", "personal_years")}
      <table><thead><tr><th>Год</th><th>Аркан</th><th>Энергия года</th></tr></thead>
        <tbody>${years}</tbody></table>

      ${disclaimerHTML("матрица")}
    `;
    paint("m-result", mhtml);
    $("m-result").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ============================================================
  //  НАТАЛЬНАЯ КАРТА
  // ============================================================
  const N = window.PhysalisNatal;

  function renderNatal() {
    $("n-err").textContent = "";
    if (!window.Astronomy) { $("n-err").textContent = "Астро-библиотека не загрузилась."; return; }
    let d, mo, y;
    try { ({ d, mo, y } = M.parseDate($("n-date").value)); }
    catch (e) { $("n-err").textContent = e.message; return; }
    const tm = ($("n-time").value || "12:00").split(":");
    const opts = {
      y, mo, d, hh: +tm[0], mm: +tm[1],
      tz: parseFloat($("n-tz").value), lat: parseFloat($("n-lat").value), lon: parseFloat($("n-lon").value),
    };
    if ([opts.tz, opts.lat, opts.lon].some(Number.isNaN)) {
      $("n-err").textContent = "Проверьте город / координаты / часовой пояс."; return;
    }

    let R;
    try { R = N.computeNatal(opts); }
    catch (e) { $("n-err").textContent = "Ошибка расчёта: " + e.message; return; }

    const city = $("n-city").value.trim();

    const planetsRows = R.planets.map((p) => `
      <tr>
        <td><span class="glyph">${p.glyph}</span> ${esc(p.name)}</td>
        <td>${p.signGlyph} ${esc(p.sign)} ${p.retro ? '<span class="retro">R</span>' : ""}</td>
        <td>${p.fmt.replace(/ .*/, "")}</td>
        <td>${p.house} дом</td>
      </tr>`).join("");

    // подробные карточки по планетам
    const planetCards = R.planets.map((p) => {
      const pl = ct("planets", p.name), sg = ct("signs", p.sign), hs = ct("houses", p.house);
      const retroNote = p.retro ? ct("natalConcepts", "retro") : "";
      return `<div class="subcard">
        <div class="cap">${p.glyph} ${esc(p.name)} ${p.retro ? '<span class="retro">R</span>' : ""}</div>
        <div class="arc">${p.signGlyph} ${esc(p.sign)} · ${p.house} дом</div>
        ${pl ? `<div class="prose">${esc(pl)}</div>` : `<div class="desc">${esc(p.sense)}</div>`}
        ${sg ? `<div class="tag"><b>в знаке ${esc(p.sign)}:</b> ${esc(sg)}</div>` : ""}
        ${hs ? `<div class="tag"><b>в ${p.house} доме:</b> ${esc(hs)}</div>` : ""}
        ${retroNote ? `<div class="tag minus"><b>ретроградность:</b> ${esc(retroNote)}</div>` : ""}
      </div>`;
    }).join("");

    const housesRows = R.houses.map((h) => `
      <tr><td>${h.house} дом</td><td>${h.glyph} ${esc(h.sign)}</td>
      <td class="desc">${esc(ct("houses", h.house) || h.meaning)}</td></tr>`).join("");

    const elemChips = Object.entries(R.elements).map(([k, v]) =>
      `<span class="chip"><b>${esc(k)}</b> ${v}</span>`).join("");
    const elemLegend = Object.entries(R.elements).filter(([k, v]) => v > 0).map(([k]) => {
      const t = ct("elements", k); return t ? `<div class="row"><b>${esc(k)}:</b> ${esc(t)}</div>` : "";
    }).join("");

    const aspChips = R.aspects.length ? R.aspects.map((a) =>
      `<span class="chip asp ${a.kind}">${esc(a.a.name)} <b>${a.glyph} ${esc(a.type)}</b> ${esc(a.b.name)}
       <span class="desc">(${a.orb.toFixed(1)}°)</span></span>`).join("")
      : `<p class="desc">Тесных аспектов в пределах орбиса не найдено — планеты работают довольно независимо.</p>`;
    const aspTypes = [...new Set(R.aspects.map((a) => a.type))];
    const aspLegend = aspTypes.map((t) => {
      const x = ct("aspects", t); return x ? `<div class="row"><b>${esc(t)}:</b> ${esc(x)}</div>` : "";
    }).join("");

    const nhtml = `
      <h2>Натальная карта</h2>
      <div class="sub">${String(R.input.d).padStart(2,"0")}.${String(R.input.mo).padStart(2,"0")}.${R.input.y}
        · ${esc($("n-time").value)} · ${esc(city)}</div>
      <div class="toolbar"><button class="btn-min" onclick="window.print()">Печать / PDF</button></div>

      ${window.PhysalisWheel ? dusk(`<div class="wheel-wrap">${window.PhysalisWheel.makeWheel(R)}</div>`, "Колесо твоего неба · положения планет в час рождения", "cosmic") : ""}

      <div class="section-title">Главные точки карты</div>
      ${concept("sunMoon")}
      <div class="cards">
        <div class="subcard"><div class="cap">Асцендент</div>
          <div class="arc">${R.asc.glyph} ${esc(R.asc.fmt)}</div>
          ${ct("natalConcepts","ascendant") ? `<div class="what">${esc(ct("natalConcepts","ascendant"))}</div>` : ""}
          <div class="prose">${esc(ct("signs", R.asc.sign) || R.asc.meaning)}</div></div>
        <div class="subcard"><div class="cap">MC · вершина неба</div>
          <div class="arc">${R.mc.glyph} ${esc(R.mc.fmt)}</div>
          ${ct("natalConcepts","mc") ? `<div class="what">${esc(ct("natalConcepts","mc"))}</div>` : ""}
          <div class="prose">${esc(ct("signs", R.mc.sign) || R.mc.meaning)}</div></div>
        <div class="subcard"><div class="cap">Солнце · Луна</div>
          <div class="arc">${R.planets[0].signGlyph} ${esc(R.planets[0].sign)} · ${R.planets[1].signGlyph} ${esc(R.planets[1].sign)}</div>
          <div class="prose">Солнце — твоё ядро, Луна — твои чувства и потребности.</div></div>
      </div>

      <div class="section-title">Положения планет</div>
      <table><thead><tr><th>Планета</th><th>Знак</th><th>Градус</th><th>Дом</th></tr></thead>
        <tbody>${planetsRows}</tbody></table>

      <div class="section-title">Планеты подробнее</div>
      <div class="cards">${planetCards}</div>

      <div class="section-title">Баланс стихий</div>
      ${concept("elements_balance")}
      <div class="chips">${elemChips}</div>
      ${elemLegend ? `<div class="legend">${elemLegend}</div>` : ""}

      <div class="section-title">Дома · сферы жизни</div>
      ${concept("houses")}
      <table><thead><tr><th>Дом</th><th>Знак</th><th>Сфера жизни</th></tr></thead>
        <tbody>${housesRows}</tbody></table>

      <div class="section-title">Аспекты</div>
      ${concept("aspects")}
      <div class="chips">${aspChips}</div>
      ${aspLegend ? `<div class="legend">${aspLegend}</div>` : ""}

      ${disclaimerHTML("натал")}
    `;
    paint("n-result", nhtml);
    $("n-result").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function disclaimerHTML(kind) {
    const method = kind === "матрица"
      ? "Матрица судьбы — эзотерический метод (школа Ладини): дата раскладывается на 22 Старших аркана."
      : "Натальная карта построена на реальных эфемеридах (положения планет точные); дома — по системе знаков (whole-sign), асцендент зависит от точного времени и места рождения.";
    return `<div class="disclaimer">
      <b>Про метод.</b> ${method}
      Это инструмент для размышления о себе, а не доказанная наука. Относитесь к нему
      как к красивому зеркалу: берите то, что отзывается, и оставляйте остальное.</div>`;
  }

  // ---------- Обработчики ----------
  $("m-go").addEventListener("click", renderMatrix);
  $("n-go").addEventListener("click", renderNatal);
  $("m-date").addEventListener("keydown", (e) => { if (e.key === "Enter") renderMatrix(); });
  $("n-date").addEventListener("keydown", (e) => { if (e.key === "Enter") renderNatal(); });

  // Авто-расчёта нет: матрица строится только после ввода своей даты и нажатия кнопки.
})();
