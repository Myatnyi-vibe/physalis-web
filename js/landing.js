// landing.js — интерактив лендинга: демо-«оплата», FAQ-аккордеон.
(function () {
  const $ = (s, r) => (r || document).querySelector(s);

  const PKG = {
    matrix: { name: "Матрица судьбы", price: "2000", desc: "Полный разбор по дате рождения: октаграмма, 22 аркана, предназначение, деньги, отношения, личные годы." },
    natal:  { name: "Натальная карта", price: "2000", desc: "Колесо неба по дате, времени и городу: планеты по знакам и домам, асцендент, аспекты." },
    both:   { name: "Матрица + Натальная карта", price: "3000", desc: "Оба разбора вместе со скидкой — самая полная картина себя." },
  };

  const modal = $("#pay-modal");
  function openPay(key) {
    const p = PKG[key]; if (!p) return;
    const card = $(".pay-card", modal);
    card.classList.remove("success");
    $("#pay-name").textContent = p.name;
    $("#pay-price").innerHTML = p.price + ' <span class="cur">₽</span>';
    $("#pay-desc").textContent = p.desc;
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closePay() {
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-buy]").forEach((b) =>
    b.addEventListener("click", () => openPay(b.dataset.buy)));

  if (modal) {
    $(".close", modal).addEventListener("click", closePay);
    modal.addEventListener("click", (e) => { if (e.target === modal) closePay(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePay(); });
    // демо-«оплата»: показываем успех (реальная оплата будет подключена позже)
    $("#pay-go").addEventListener("click", () => {
      $(".pay-card", modal).classList.add("success");
    });
  }

  // FAQ-аккордеон
  document.querySelectorAll(".faq-q").forEach((q) =>
    q.addEventListener("click", () => {
      const item = q.closest(".faq-item");
      const open = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach((i) => i.classList.remove("open"));
      if (!open) item.classList.add("open");
    }));
})();
