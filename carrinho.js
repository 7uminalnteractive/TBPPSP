function money(v){
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const GMPES_COUPON_KEY = "gmpes_coupon";

function getAppliedCoupon(){
  try {
    const raw = sessionStorage.getItem(GMPES_COUPON_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setAppliedCoupon(coupon){
  if (coupon){
    sessionStorage.setItem(GMPES_COUPON_KEY, JSON.stringify(coupon));
  } else {
    sessionStorage.removeItem(GMPES_COUPON_KEY);
  }
}

function itemRowTemplate(item){
  const p = item.product;
  const lineTotal = p.price * item.qty;
  return `
    <div class="cart-item-row" data-product-id="${p.id}">
      <div class="cart-item-product">
        <img class="cart-item-thumb" src="${p.img || ''}" alt="">
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-cat">${p.cat || ''}</div>
        </div>
      </div>
      <div class="cart-qty-control">
        <button class="cart-qty-btn" data-action="dec" aria-label="Diminuir quantidade">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/></svg>
        </button>
        <span class="cart-qty-value">${item.qty}</span>
        <button class="cart-qty-btn" data-action="inc" aria-label="Aumentar quantidade">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
      <div class="cart-item-price">${money(lineTotal)}</div>
      <button class="cart-item-remove" data-action="remove" aria-label="Remover ${p.name}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
      </button>
    </div>
  `;
}

async function renderCart(){
  const summary = await GmpesCart.getSummary();
  const layout = document.getElementById("cartLayout");
  const empty = document.getElementById("cartEmpty");
  const countLabel = document.getElementById("cartPageCount");

  countLabel.textContent = `${summary.count} ${summary.count === 1 ? "item" : "itens"}`;

  if (summary.items.length === 0){
    layout.style.display = "none";
    empty.style.display = "block";
    return;
  }
  layout.style.display = "grid";
  empty.style.display = "none";

  document.getElementById("cartItemsList").innerHTML = summary.items.map(itemRowTemplate).join("");

  const coupon = getAppliedCoupon();
  const discount = coupon ? summary.subtotal * coupon.rate : 0;
  const total = summary.subtotal - discount;

  document.getElementById("summarySubtotal").textContent = money(summary.subtotal);
  document.getElementById("summaryDiscount").textContent = `- ${money(discount)}`;
  document.getElementById("summaryTotal").textContent = money(total);

  setupItemActions();
}

function setupItemActions(){
  document.querySelectorAll(".cart-item-row").forEach(row => {
    const productId = row.dataset.productId;
    const qtyValue = row.querySelector(".cart-qty-value");

    row.querySelector('[data-action="inc"]').addEventListener("click", async () => {
      const current = parseInt(qtyValue.textContent, 10);
      GmpesCart.updateQty(productId, current + 1);
      await renderCart();
      updateCartBadge();
    });

    row.querySelector('[data-action="dec"]').addEventListener("click", async () => {
      const current = parseInt(qtyValue.textContent, 10);
      if (current <= 1) return;
      GmpesCart.updateQty(productId, current - 1);
      await renderCart();
      updateCartBadge();
    });

    row.querySelector('[data-action="remove"]').addEventListener("click", async () => {
      GmpesCart.removeItem(productId);
      await renderCart();
      updateCartBadge();
    });
  });
}

function setupCoupon(){
  const input = document.getElementById("couponInput");
  const btn = document.getElementById("couponApplyBtn");
  const note = document.getElementById("couponNote");

  const existing = getAppliedCoupon();
  if (existing){
    input.value = existing.code;
    note.textContent = `Cupom "${existing.code}" aplicado (${Math.round(existing.rate * 100)}% off).`;
    note.className = "cart-coupon-note is-success";
  }

  btn.addEventListener("click", async () => {
    const code = input.value.trim().toUpperCase();
    if (!code){
      note.textContent = "Digite um cupom.";
      note.className = "cart-coupon-note is-error";
      return;
    }
    const rate = GMPES_VALID_COUPONS[code];
    if (!rate){
      note.textContent = "Cupom inválido ou expirado.";
      note.className = "cart-coupon-note is-error";
      setAppliedCoupon(null);
      await renderCart();
      return;
    }
    setAppliedCoupon({ code, rate });
    note.textContent = `Cupom "${code}" aplicado (${Math.round(rate * 100)}% off).`;
    note.className = "cart-coupon-note is-success";
    await renderCart();
  });
}

function setupCheckoutButton(){
  document.getElementById("checkoutBtn").addEventListener("click", () => {
    const target = "checkout.html?mode=cart";
    if (!GmpesCart.isLoggedIn()){
      window.location.href = "login.html?next=" + encodeURIComponent(target);
      return;
    }
    window.location.href = target;
  });
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

function updateCartBadge(){
  const badge = document.getElementById("cartCount");
  if (!badge || typeof GmpesCart === "undefined") return;
  const count = GmpesCart.getCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
}

document.addEventListener("DOMContentLoaded", async () => {
  setupMobileNav();
  await renderCart();
  setupCoupon();
  setupCheckoutButton();
  updateCartBadge();
});
