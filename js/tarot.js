// tarot.js — отрисовка карты Таро (рамка + римское число + эмблема + имя).
(function () {
  function roman(n) {
    n = Math.max(0, Math.min(39, n | 0));
    const map = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    let r = "";
    for (const [v, s] of map) { while (n >= v) { r += s; n -= v; } }
    return r || "•";
  }

  // запасная эмблема — восьмиконечная звезда
  const DEFAULT_ART =
    '<g stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M100 44 L112 92 L160 104 L112 116 L100 164 L88 116 L40 104 L88 92 Z"/>' +
    '<circle cx="100" cy="104" r="6" fill="currentColor" fill-opacity="0.15"/></g>';

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function card(num, name) {
    const art = (window.PhysalisArcanaArt || {})[String(num)] || DEFAULT_ART;
    return `<div class="tarot-card" title="${esc(name)}">
      <span class="tc-sheen"></span>
      <div class="tc-numeral">${roman(num)}</div>
      <div class="tc-art"><svg viewBox="0 0 200 240" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${art}</svg></div>
      <div class="tc-name">${esc(name)}</div>
    </div>`;
  }

  window.PhysalisTarot = { card, roman };
})();
