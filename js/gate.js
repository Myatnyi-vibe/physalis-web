// gate.js — мягкая парольная «калитка».
// ВНИМАНИЕ: это клиентская проверка на статическом сайте — она отсекает
// случайных посетителей, но не является настоящей защитой (код общедоступен).
// Поэтому здесь хранится не сам пароль, а его SHA-256-хэш.
(function () {
  const HASH = "5a85a871874fb30c40e4d549d81c037d6bcfabb2877604a119a665ce78fea0fb";
  const KEY = "physalis_unlocked_v1";

  async function sha256hex(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function unlock() {
    document.body.classList.remove("locked");
    const g = document.getElementById("gate");
    if (g) { g.classList.add("gone"); setTimeout(() => g.remove(), 650); }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const gate = document.getElementById("gate");
    if (!gate) return;

    if (localStorage.getItem(KEY) === HASH) { unlock(); return; }

    document.body.classList.add("locked");
    const input = document.getElementById("gate-pass");
    const btn = document.getElementById("gate-go");
    const err = document.getElementById("gate-err");

    async function tryUnlock() {
      err.textContent = "";
      const val = (input.value || "").trim();
      if (!val) { err.textContent = "Введите пароль."; return; }
      const h = await sha256hex(val);
      if (h === HASH) {
        try { localStorage.setItem(KEY, HASH); } catch (e) {}
        unlock();
      } else {
        err.textContent = "Неверный пароль. Попробуйте ещё раз.";
        input.select();
      }
    }

    btn.addEventListener("click", tryUnlock);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") tryUnlock(); });
    setTimeout(() => input.focus(), 50);

    if (window.PhysalisFX) {
      const sf = gate.querySelector(".starfield");
      if (sf) window.PhysalisFX.fillStarfield(sf);
    }
  });
})();
