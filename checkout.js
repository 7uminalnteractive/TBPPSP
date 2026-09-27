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

async function renderSummary(){
  const summary = await GmpesCart.getSummary();
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
      window.location.href = "login.html?next=checkout.html";
      return;
    }
    const selected = document.querySelector('input[name="payment"]:checked');
    const method = selected ? selected.value : "pix";
    sessionStorage.setItem("gmpes_last_payment_method", method);

    GmpesCart.clear();
    sessionStorage.removeItem("gmpes_coupon");
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
    window.location.href = "login.html?next=checkout.html";
    return;
  }

  const hasItems = await renderSummary();
  if (hasItems){
    setupPaymentMethods();
    setupFinishButton();
  }
});
