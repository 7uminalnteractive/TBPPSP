function setupPasswordToggles(){
  document.querySelectorAll(".auth-toggle-visibility").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      btn.classList.toggle("is-visible", isPassword);
    });
  });
}

function setupAuthForms(){
  const forms = document.querySelectorAll(".auth-form");
  forms.forEach(form => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector(".auth-submit-btn");
      if (!btn) return;
      const original = btn.textContent;
      btn.textContent = "Login ainda não disponível";
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
      }, 2200);
    });
  });
}

function setupDevLogin(){
  const btn = document.getElementById("devLoginBtn");
  if (!btn || typeof GmpesCart === "undefined") return;

  btn.addEventListener("click", () => {
    GmpesCart.setLoggedIn(true);
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    window.location.href = next || "index.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupPasswordToggles();
  setupAuthForms();
  setupDevLogin();
});
