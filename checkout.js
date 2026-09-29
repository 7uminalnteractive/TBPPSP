function money(v){
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const params = new URLSearchParams(window.location.search);
const MODE = params.get("mode") === "direct" ? "direct" : "cart";
const DIRECT_ID = params.get("id");

// Carrinho e compra direta usam cupons separados, para um não vazar no outro.
const COUPON_KEY = MODE === "direct" ? "gmpes_coupon_direct" : "gmpes_coupon";

function getAppliedCoupon(){
  try {
    const raw = sessionStorage.getItem(COUPON_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setAppliedCoupon(coupon){
  if (coupon) sessionStorage.setItem(COUPON_KEY, JSON.stringify(coupon));
  else sessionStorage.removeItem(COUPON_KEY);
}

async function loadSummary(){
  if (MODE === "direct"){
    const product = DIRECT_ID ? await GmpesStore.getProduct(DIRECT_ID) : null;
    if (!product) return { items: [], subtotal: 0, count: 0 };
    return { items: [{ productId: product.id, qty: 1, product }], subtotal: product.price, count: 1 };
  }
  return GmpesCart.getSummary();
}

async function renderSummary(){
  const summary = await loadSummary();
  const layout = document.getElementById("checkoutLayout");
  const empty = document.getElementById("checkoutEmpty");

  if (summary.items.length === 0){
    layout.style.display = "none";
    empty.style.display = "block";
    return false;
  }
  layout.style.display = "grid";
  empty.style.display = "none";

  document.getElementById("checkoutSummaryList").innerHTML = summary.items.map(item => `
    <div class="checkout-summary-item">
      <span>${item.qty}x ${item.product.name}</span>
      <b>${money(item.product.price * item.qty)}</b>
    </div>
  `).join("");

  const coupon = getAppliedCoupon();
  const discount = coupon ? summary.subtotal * coupon.rate : 0;
  const total = summary.subtotal - discount;

  document.getElementById("checkoutSubtotal").textContent = money(summary.subtotal);
  document.getElementById("checkoutDiscount").textContent = `- ${money(discount)}`;
  document.getElementById("checkoutTotal").textContent = money(total);

  return true;
}

function setupCoupon(){
  // Cupom só aparece na compra direta; pelo carrinho ele já foi aplicado antes.
  if (MODE !== "direct") return;
  document.getElementById("checkoutCouponBox").style.display = "block";

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
      await renderSummary();
      return;
    }
    setAppliedCoupon({ code, rate });
    note.textContent = `Cupom "${code}" aplicado (${Math.round(rate * 100)}% off).`;
    note.className = "cart-coupon-note is-success";
    await renderSummary();
  });
}

function loginRedirect(){
  const here = window.location.pathname.split("/").pop() + window.location.search;
  window.location.href = "login.html?next=" + encodeURIComponent(here);
}

function setupBackLink(){
  if (MODE !== "direct") return;
  const link = document.getElementById("checkoutBackLink");
  const label = document.getElementById("checkoutBackLabel");
  link.href = DIRECT_ID ? "patch.html?id=" + encodeURIComponent(DIRECT_ID) : "index.html#catalogo";
  label.textContent = "Voltar ao patch";
}

function setupPaymentMethods(){
  const methods = document.querySelectorAll(".payment-method");
  methods.forEach(method => {
    method.addEventListener("click", () => {
      methods.forEach(m => m.classList.remove("selected"));
      method.classList.add("selected");
      method.querySelector("input").checked = true;
    });
  });
}

function setupFinishButton(){
  const btn = document.getElementById("finishBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (!GmpesCart.isLoggedIn()){
      loginRedirect();
      return;
    }
    const selected = document.querySelector('input[name="payment"]:checked');
    const method = selected ? selected.value : "pix";
    sessionStorage.setItem("gmpes_last_payment_method", method);

    if (MODE === "cart") GmpesCart.clear();
    sessionStorage.removeItem(COUPON_KEY);
    window.location.href = "confirmacao.html";
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

document.addEventListener("DOMContentLoaded", async () => {
  setupMobileNav();

  if (!GmpesCart.isLoggedIn()){
    loginRedirect();
    return;
  }

  setupBackLink();
  const hasItems = await renderSummary();
  if (hasItems){
    setupCoupon();
    setupPaymentMethods();
    setupFinishButton();
  }
});
