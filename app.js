function money(v){
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function cardTemplate(p){
  const badge = p.badge
    ? `<span class="card-badge">${p.badge}</span>`
    : "";
  const oldPrice = p.oldPrice
    ? `<span class="price-old">${money(p.oldPrice)}</span>`
    : "";
  const isPhoto = p.img && !p.img.toLowerCase().endsWith(".svg");
  const mediaClass = isPhoto ? "card-media is-photo" : "card-media";
  return `
    <article class="card" data-cat="${p.cat}">
      <a href="patch.html?id=${encodeURIComponent(p.id)}" class="card-link-overlay" aria-label="Ver detalhes de ${p.name}"></a>
      <div class="${mediaClass}">
        ${badge}
        <button class="card-fav" aria-label="Favoritar ${p.name}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20.5s-7.5-4.6-9.8-9A5.4 5.4 0 0 1 12 6.2a5.4 5.4 0 0 1 9.8 5.3c-2.3 4.4-9.8 9-9.8 9Z"/></svg>
        </button>
        <img src="${p.img}" alt="Patch ${p.name}" loading="lazy">
      </div>
      <div class="card-body">
        <div class="card-cat">${p.cat}</div>
        <div class="card-title">${p.name}</div>
        <div class="card-foot">
          <div class="price">
            <span class="price-now">${money(p.price)}</span>
            ${oldPrice}
          </div>
          <button class="add-btn" aria-label="Adicionar ${p.name}" data-add-id="${p.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
      </div>
    </article>
  `;
}

async function renderGrid(){
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  const products = (typeof GmpesStore !== "undefined") ? await GmpesStore.getProducts() : [];
  grid.innerHTML = products.map(cardTemplate).join("");
  setupAddButtons();
}

function setupAddButtons(){
  document.querySelectorAll("[data-add-id]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      GmpesCart.addItem(btn.dataset.addId, 1);
      updateCartBadge();
      flashAddButton(btn);
    });
  });
}

function flashAddButton(btn){
  const original = btn.innerHTML;
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>`;
  btn.classList.add("add-btn-success");
  setTimeout(() => {
    btn.innerHTML = original;
    btn.classList.remove("add-btn-success");
  }, 900);
}

function updateCartBadge(){
  const badge = document.getElementById("cartCount");
  if (!badge || typeof GmpesCart === "undefined") return;
  const count = GmpesCart.getCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
}

function setupMobileNav(){
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const toggle = document.getElementById("menuToggle");
  if (!sidebar || !overlay || !toggle) return;

  function open(){
    sidebar.classList.add("open");
    overlay.classList.add("open");
  }
  function close(){
    sidebar.classList.remove("open");
    overlay.classList.remove("open");
  }
  toggle.addEventListener("click", open);
  overlay.addEventListener("click", close);
  sidebar.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", close);
  });
}

function setupScrollSpy(){
  const sections = ["inicio","catalogo"]
    .map(id => document.getElementById(id))
    .filter(Boolean);
  const links = document.querySelectorAll(".nav-link");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        const id = entry.target.id;
        links.forEach(link => {
          link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
        });
      }
    });
  }, { rootMargin: "-40% 0px -50% 0px" });

  sections.forEach(s => observer.observe(s));
}

document.addEventListener("DOMContentLoaded", async () => {
  await renderGrid();
  setupMobileNav();
  setupScrollSpy();
  updateCartBadge();
});
