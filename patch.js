function money(v){
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso){
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function getYouTubeEmbed(url){
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  if (!match) return null;
  return `https://www.youtube.com/embed/${match[1]}`;
}

function renderTrailer(product){
  if (!product.trailerUrl){
    return `
      <div class="patch-trailer-wrap">
        <div class="patch-trailer-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 4v16l14-8-14-8Z"/></svg>
          <span>Trailer ainda não disponível</span>
        </div>
      </div>
    `;
  }
  const embed = getYouTubeEmbed(product.trailerUrl);
  if (embed){
    return `
      <div class="patch-trailer-wrap">
        <iframe src="${embed}" title="Trailer de ${product.name}" allowfullscreen loading="lazy"></iframe>
      </div>
    `;
  }
  return `
    <div class="patch-trailer-wrap">
      <video src="${product.trailerUrl}" controls></video>
    </div>
  `;
}

function renderScreenshots(product){
  const shots = product.screenshots || [];
  if (shots.length === 0) return "";
  return `
    <div class="patch-section-block">
      <h2 class="patch-section-title">Screenshots</h2>
      <div class="patch-screens-grid">
        ${shots.map(src => `<div class="patch-screen"><img src="${src}" alt="Screenshot de ${product.name}" loading="lazy"></div>`).join("")}
      </div>
    </div>
  `;
}

function renderPatch(product){
  const oldPrice = product.oldPrice
    ? `<span class="patch-price-old">${money(product.oldPrice)}</span>`
    : "";
  const badge = product.badge
    ? `<span class="patch-cover-badge">${product.badge}</span>`
    : "";
  const isPhoto = product.img && !product.img.toLowerCase().endsWith(".svg");
  const coverClass = isPhoto ? "patch-cover is-photo" : "patch-cover";

  document.title = `${product.name} — THE BEST PATCH PSP`;

  const container = document.getElementById("patchContent");
  container.innerHTML = `
    <div class="patch-hero-section">
      <div class="${coverClass}">
        ${badge}
        <img src="${product.img || ''}" alt="Capa do ${product.name}">
      </div>
      <div class="patch-info">
        <div class="patch-cat-label">${product.cat || "Patch"}</div>
        <h1 class="patch-title">${product.name}</h1>
        <p class="patch-short-desc">${product.shortDesc || ""}</p>

        <div class="patch-meta-row">
          <div class="patch-meta-item">
            <span class="patch-meta-label">Versão</span>
            <span class="patch-meta-value">${product.version || "1.0"}</span>
          </div>
          <div class="patch-meta-item">
            <span class="patch-meta-label">Atualizado em</span>
            <span class="patch-meta-value">${formatDate(product.updatedAt)}</span>
          </div>
          <div class="patch-meta-item">
            <span class="patch-meta-label">Plataforma</span>
            <span class="patch-meta-value">PSP / PPSSPP</span>
          </div>
        </div>

        <div class="patch-purchase-row">
          <div class="patch-price-block">
            <span class="patch-price-now">${money(product.price)}</span>
            ${oldPrice}
          </div>
          <button class="btn btn-primary patch-buy-btn" data-add-id="${product.id}">Comprar patch</button>
          <button class="patch-fav-btn" data-cart-id="${product.id}" aria-label="Adicionar ao carrinho" title="Adicionar ao carrinho">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20.5s-7.5-4.6-9.8-9A5.4 5.4 0 0 1 12 6.2a5.4 5.4 0 0 1 9.8 5.3c-2.3 4.4-9.8 9-9.8 9Z"/></svg>
          </button>
        </div>
      </div>
    </div>

    <div class="patch-section-block">
      <h2 class="patch-section-title">Sobre este patch</h2>
      <p class="patch-description">${product.description || product.shortDesc || "Sem descrição cadastrada ainda."}</p>
    </div>

    <div class="patch-section-block">
      <h2 class="patch-section-title">Trailer</h2>
      ${renderTrailer(product)}
    </div>

    ${renderScreenshots(product)}
  `;
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

function setupBuyButton(){
  const btn = document.querySelector("[data-add-id]");
  if (!btn) return;
  btn.addEventListener("click", () => {
    // Compra direta: não mexe no carrinho, vai direto pro pagamento (com cupom).
    const id = btn.dataset.addId;
    sessionStorage.removeItem("gmpes_coupon_direct");
    const target = "checkout.html?mode=direct&id=" + encodeURIComponent(id);
    if (!GmpesCart.isLoggedIn()){
      window.location.href = "login.html?next=" + encodeURIComponent(target);
      return;
    }
    window.location.href = target;
  });
}

function setupCartButton(){
  const btn = document.querySelector("[data-cart-id]");
  if (!btn) return;
  const id = btn.dataset.cartId;

  function sync(){
    const inCart = GmpesCart.hasItem(id);
    btn.classList.toggle("is-favorited", inCart);
    btn.setAttribute("aria-label", inCart ? "Remover do carrinho" : "Adicionar ao carrinho");
    btn.title = inCart ? "Remover do carrinho" : "Adicionar ao carrinho";
    updateCartBadge();
  }

  btn.addEventListener("click", () => {
    if (GmpesCart.hasItem(id)) GmpesCart.removeItem(id);
    else GmpesCart.addItem(id, 1);
    sync();
  });
  sync();
}

function updateCartBadge(){
  const badge = document.getElementById("cartCount");
  if (!badge || typeof GmpesCart === "undefined") return;
  const count = GmpesCart.getCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
}

document.addEventListener("DOMContentLoaded", async () => {
  setupMobileNav();
  updateCartBadge();

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const product = id ? await GmpesStore.getProduct(id) : null;

  if (!product){
    document.getElementById("patchContent").style.display = "none";
    document.getElementById("patchNotFound").style.display = "block";
    return;
  }

  renderPatch(product);
  setupBuyButton();
  setupCartButton();
});
