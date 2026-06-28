// app.js — связывает формы с расчётами и рисует результаты.
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

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
  cities.forEach(([name]) => {
    const o = document.createElement("option");
    o.value = name; dl.appendChild(o);
  });
  $("n-city").addEventListener("change", (e) => {
    const c = cities.find(([n]) => n.toLowerCase() === e.target.value.trim().toLowerCase());
    if (c) { $("n-lat").value = c[1]; $("n-lon").value = c[2]; $("n-tz").value = c[3]; }
  });

  // ============================================================
  //  МАТРИЦА СУДЬБЫ
  // ============================================================
  const M = window.PhysalisMatrix;
  const OCT = window.PhysalisOctagram;

  function arcCard(cap, a, meanings) {
    const m = meanings[a.num] || {};
    return `<div class="subcard">
      <div class="cap">${esc(cap)}</div>
      <div class="arc">${a.num} · ${esc(a.name)}</div>
      <div class="desc">${esc(m.keywords || "")}</div>
      ${m.plus ? `<div class="tag plus">+ ${esc(m.plus)}</div>` : ""}
      ${m.minus ? `<div class="tag minus">− ${esc(m.minus)}</div>` : ""}
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
      : `<p class="desc">Ярко выраженной доминанты нет — арканы распределены равномерно.</p>`;

    $("m-result").innerHTML = `
      <h2>${name ? esc(name) + " · " : ""}Матрица судьбы</h2>
      <div class="sub">${data.birthdate}</div>
      ${OCT.renderOctagram(data)}
      <div class="toolbar"><button class="btn-min" onclick="window.print()">Печать / PDF</button></div>

      <div class="section-title">Личный квадрат</div>
      <div class="cards">
        ${arcCard("Визитка · день", ps.day_visitka, mn)}
        ${arcCard("Таланты · месяц", ps.month_talents, mn)}
        ${arcCard("Деньги · год", ps.year_money, mn)}
        ${arcCard("Главный урок · карма", ps.karma_lesson, mn)}
        ${arcCard("Зона комфорта · центр", data.center_comfort, mn)}
      </div>

      <div class="section-title">Родовой квадрат</div>
      <div class="cards">
        ${arcCard("Линия мамы", an.nw_mother, mn)}
        ${arcCard("Линия папы", an.ne_father, mn)}
        ${arcCard("Род (низ-лево)", an.sw, mn)}
        ${arcCard("Род (низ-право)", an.se, mn)}
      </div>

      <div class="section-title">Предназначение</div>
      <div class="cards">
        ${arcCard("Личное · до ~40 лет", pu.personal_to40, mn)}
        ${arcCard("Социальное · после ~40", pu.social_from40, mn)}
        ${arcCard("Главное предназначение", pu.main, mn)}
      </div>

      <div class="section-title">Кармический хвост</div>
      <div class="cards">
        ${arcCard("Вход в отношения", kt.entry_relationships, mn)}
        ${arcCard("Середина пути · самореализация", kt.middle_selfrealization, mn)}
        ${arcCard("Главное испытание", kt.main_test, mn)}
      </div>

      <div class="section-title">Доминанта карты</div>
      ${dominant}

      <div class="section-title">Возрастные декады</div>
      <table><thead><tr><th>Возраст</th><th>Аркан</th><th>О чём период</th></tr></thead>
        <tbody>${decades}</tbody></table>

      <div class="section-title">Личные годы (2026–2035)</div>
      <table><thead><tr><th>Год</th><th>Аркан</th><th>Энергия года</th></tr></thead>
        <tbody>${years}</tbody></table>

      ${disclaimerHTML("матрица")}
    `;
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
    try {
      ({ d, mo, y } = M.parseDate($("n-date").value));
    } catch (e) { $("n-err").textContent = e.message; return; }
    const tm = ($("n-time").value || "12:00").split(":");
    const opts = {
      y, mo, d, hh: +tm[0], mm: +tm[1],
      tz: parseFloat($("n-tz").value),
      lat: parseFloat($("n-lat").value),
      lon: parseFloat($("n-lon").value),
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
        <td class="desc">${esc(p.sense)}</td>
      </tr>`).join("");

    const housesRows = R.houses.map((h) => `
      <tr><td>${h.house} дом</td><td>${h.glyph} ${esc(h.sign)}</td>
      <td class="desc">${esc(h.meaning)}</td></tr>`).join("");

    const elemChips = Object.entries(R.elements).map(([k, v]) =>
      `<span class="chip"><b>${esc(k)}</b> ${v}</span>`).join("");

    const aspChips = R.aspects.length ? R.aspects.map((a) =>
      `<span class="chip asp ${a.kind}">${esc(a.a.name)} <b>${a.glyph} ${esc(a.type)}</b> ${esc(a.b.name)}
       <span class="desc">(${a.orb.toFixed(1)}°)</span></span>`).join("")
      : `<p class="desc">Тесных аспектов в пределах орбиса не найдено.</p>`;

    $("n-result").innerHTML = `
      <h2>Натальная карта</h2>
      <div class="sub">${R.input.d.toString().padStart(2,"0")}.${R.input.mo.toString().padStart(2,"0")}.${R.input.y}
        · ${esc($("n-time").value)} · ${esc(city)}</div>
      <div class="toolbar"><button class="btn-min" onclick="window.print()">Печать / PDF</button></div>

      <div class="cards">
        <div class="subcard"><div class="cap">Асцендент</div>
          <div class="arc">${R.asc.glyph} ${esc(R.asc.fmt)}</div>
          <div class="desc">${esc(R.asc.meaning)}</div></div>
        <div class="subcard"><div class="cap">MC · вершина неба</div>
          <div class="arc">${R.mc.glyph} ${esc(R.mc.fmt)}</div>
          <div class="desc">${esc(R.mc.meaning)}</div></div>
        <div class="subcard"><div class="cap">Солнце · Луна</div>
          <div class="arc">${R.planets[0].signGlyph} ${esc(R.planets[0].sign)} · ${R.planets[1].signGlyph} ${esc(R.planets[1].sign)}</div>
          <div class="desc">ядро и эмоции</div></div>
      </div>

      <div class="section-title">Положения планет</div>
      <table><thead><tr><th>Планета</th><th>Знак</th><th>Градус</th><th>Дом</th><th>Смысл</th></tr></thead>
        <tbody>${planetsRows}</tbody></table>

      <div class="section-title">Баланс стихий</div>
      <div class="chips">${elemChips}</div>

      <div class="section-title">Дома (по знакам · whole-sign)</div>
      <table><thead><tr><th>Дом</th><th>Знак</th><th>Сфера жизни</th></tr></thead>
        <tbody>${housesRows}</tbody></table>

      <div class="section-title">Аспекты</div>
      <div class="chips">${aspChips}</div>

      ${disclaimerHTML("натал")}
    `;
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

  // первый рендер для демонстрации
  renderMatrix();
})();
