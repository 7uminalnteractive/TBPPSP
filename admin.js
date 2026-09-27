const ADMIN_PASSWORD_KEY = "gmpes_admin_pw";
const ADMIN_SESSION_KEY = "gmpes_admin_session";
const DEFAULT_ADMIN_PASSWORD = "gmpes2026";

function getAdminPassword(){
  return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
}

function isLoggedIn(){
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

function money(v){
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function timeAgo(iso){
  const now = new Date();
  const then = new Date(iso);
  const diffMs = now - then;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  return `há ${diffD}d`;
}

async function showPanel(){
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("adminPanel").style.display = "block";
  await renderDashboard();
  await renderTable();
}

function showLogin(){
  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("adminPanel").style.display = "none";
}

function setupTabs(){
  const tabs = document.querySelectorAll(".admin-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("tabDashboard").style.display = tab.dataset.tab === "dashboard" ? "block" : "none";
      document.getElementById("tabProducts").style.display = tab.dataset.tab === "products" ? "block" : "none";
      if (tab.dataset.tab === "dashboard") renderDashboard();
      if (tab.dataset.tab === "products") renderTable();
    });
  });
}

function setupEditorTabs(){
  const tabs = document.querySelectorAll(".admin-editor-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      document.querySelectorAll(".admin-editor-panel").forEach(panel => {
        panel.style.display = panel.dataset.epanel === tab.dataset.etab ? "flex" : "none";
      });
    });
  });
}

function resetEditorTabs(){
  document.querySelectorAll(".admin-editor-tab").forEach((t, i) => t.classList.toggle("active", i === 0));
  document.querySelectorAll(".admin-editor-panel").forEach((p, i) => {
    p.style.display = i === 0 ? "flex" : "none";
  });
}

async function renderDashboard(){
  const products = await GmpesStore.getProducts();
  const summary = GmpesStore.getSalesSummary();

  document.getElementById("kpiRevenue").textContent = money(summary.total);
  document.getElementById("kpiSalesCount").textContent = summary.count;
  document.getElementById("kpiProductsCount").textContent = products.length;
  document.getElementById("kpiAvgTicket").textContent = money(summary.count ? summary.total / summary.count : 0);

  const salesList = document.getElementById("salesList");
  const sortedSales = [...summary.sales].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (sortedSales.length === 0){
    salesList.innerHTML = `<p style="color:var(--text-faint); font-size:13px;">Nenhuma venda registrada ainda.</p>`;
  } else {
    salesList.innerHTML = sortedSales.slice(0, 8).map(s => `
      <div class="admin-sale-row">
        <div class="admin-sale-main">
          <div class="admin-sale-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-1.5 9h-12L6 6Z"/><path d="M6 6 5 2H2"/><circle cx="9.5" cy="20" r="1.4" fill="currentColor" stroke="none"/><circle cx="17.5" cy="20" r="1.4" fill="currentColor" stroke="none"/></svg>
          </div>
          <div class="admin-sale-info">
            <div class="admin-sale-product">${s.productName}</div>
            <div class="admin-sale-buyer">${s.buyer}</div>
          </div>
        </div>
        <div class="admin-sale-right">
          <div class="admin-sale-amount">${money(s.amount)}</div>
          <div class="admin-sale-date">${timeAgo(s.date)}</div>
        </div>
      </div>
    `).join("");
  }

  const topList = document.getElementById("topProductsList");
  const counts = Object.entries(summary.byProduct)
    .map(([productId, count]) => {
      const product = products.find(p => p.id === productId);
      return { name: product ? product.name : productId, count };
    })
    .sort((a, b) => b.count - a.count);

  if (counts.length === 0){
    topList.innerHTML = `<p style="color:var(--text-faint); font-size:13px;">Sem dados ainda.</p>`;
  } else {
    const maxCount = counts[0].count;
    topList.innerHTML = counts.slice(0, 5).map((c, i) => `
      <div class="admin-top-row">
        <div class="admin-top-rank">${i + 1}</div>
        <div class="admin-top-info">
          <div class="admin-top-name">${c.name}</div>
          <div class="admin-top-bar-track">
            <div class="admin-top-bar-fill" style="width:${(c.count / maxCount) * 100}%"></div>
          </div>
        </div>
        <div class="admin-top-count">${c.count}x</div>
      </div>
    `).join("");
  }
}

async function renderTable(){
  const products = await GmpesStore.getProducts();
  const tbody = document.getElementById("adminTableBody");
  const empty = document.getElementById("adminEmpty");

  if (products.length === 0){
    tbody.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  tbody.innerHTML = products.map(p => `
    <tr>
      <td><img class="admin-thumb" src="${p.img || ''}" alt="" onerror="this.style.opacity=0.2"></td>
      <td data-meta="${p.cat || ''} · ${money(p.price)}">${p.name}</td>
      <td>${p.cat || "—"}</td>
      <td>
        <span class="admin-row-price">${money(p.price)}</span>
        ${p.oldPrice ? `<span class="admin-row-old">${money(p.oldPrice)}</span>` : ""}
      </td>
      <td>${p.badge ? `<span class="admin-badge-pill">${p.badge}</span>` : "—"}</td>
      <td>
        <div class="admin-row-actions">
          <button class="admin-icon-action" data-action="edit" data-id="${p.id}" aria-label="Editar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button class="admin-icon-action danger" data-action="delete" data-id="${p.id}" aria-label="Remover">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener("click", () => openEditModal(btn.dataset.id));
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener("click", () => openDeleteModal(btn.dataset.id));
  });
}

function openNewModal(){
  document.getElementById("modalTitle").textContent = "Novo patch";
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";
  document.getElementById("previewLink").style.display = "none";
  document.getElementById("formError").textContent = "";
  resetEditorTabs();
  document.getElementById("modalOverlay").classList.add("open");
  document.getElementById("fieldName").focus();
}

async function openEditModal(id){
  const product = await GmpesStore.getProduct(id);
  if (!product) return;

  document.getElementById("modalTitle").textContent = "Editar patch";
  document.getElementById("productId").value = product.id;
  document.getElementById("fieldName").value = product.name || "";
  document.getElementById("fieldCat").value = product.cat || "";
  document.getElementById("fieldShortDesc").value = product.shortDesc || "";
  document.getElementById("fieldPrice").value = product.price ?? "";
  document.getElementById("fieldOldPrice").value = product.oldPrice ?? "";
  document.getElementById("fieldBadge").value = product.badge || "";
  document.getElementById("fieldVersion").value = product.version || "";
  document.getElementById("fieldUpdatedAt").value = product.updatedAt || "";
  document.getElementById("fieldImg").value = product.img || "";
  document.getElementById("fieldDescription").value = product.description || "";
  document.getElementById("fieldTrailer").value = product.trailerUrl || "";
  document.getElementById("fieldScreenshots").value = (product.screenshots || []).join("\n");

  const previewLink = document.getElementById("previewLink");
  previewLink.href = `patch.html?id=${encodeURIComponent(product.id)}`;
  previewLink.style.display = "inline-flex";

  document.getElementById("formError").textContent = "";
  resetEditorTabs();
  document.getElementById("modalOverlay").classList.add("open");
}

function closeModal(){
  document.getElementById("modalOverlay").classList.remove("open");
}

let pendingDeleteId = null;

async function openDeleteModal(id){
  const product = await GmpesStore.getProduct(id);
  if (!product) return;
  pendingDeleteId = id;
  document.getElementById("deleteProductName").textContent = product.name;
  document.getElementById("deleteOverlay").classList.add("open");
}

function closeDeleteModal(){
  pendingDeleteId = null;
  document.getElementById("deleteOverlay").classList.remove("open");
}

function setupLogin(){
  const loginBtn = document.getElementById("loginBtn");
  const input = document.getElementById("adminPassword");
  const error = document.getElementById("loginError");

  function attemptLogin(){
    if (input.value === getAdminPassword()){
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      error.textContent = "";
      showPanel();
    } else {
      error.textContent = "Senha incorreta. Tente novamente.";
    }
  }

  loginBtn.addEventListener("click", attemptLogin);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") attemptLogin();
  });
}

function setupLogout(){
  document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    showLogin();
  });
}

async function handleProductFormSubmit(e){
  if (e) e.preventDefault();

  const errorEl = document.getElementById("formError");

  try {
    const id = document.getElementById("productId").value;
    const name = document.getElementById("fieldName").value.trim();
    const cat = document.getElementById("fieldCat").value.trim();
    const shortDesc = document.getElementById("fieldShortDesc").value.trim();
    const priceRaw = document.getElementById("fieldPrice").value;
    const price = parseFloat(priceRaw);
    const oldPriceRaw = document.getElementById("fieldOldPrice").value;
    const oldPrice = oldPriceRaw ? parseFloat(oldPriceRaw) : null;
    const badge = document.getElementById("fieldBadge").value.trim() || null;
    const version = document.getElementById("fieldVersion").value.trim() || "1.0";
    const updatedAt = document.getElementById("fieldUpdatedAt").value || null;
    const img = document.getElementById("fieldImg").value.trim() || "assets/patches/placeholder.svg";
    const description = document.getElementById("fieldDescription").value.trim();
    const trailerUrl = document.getElementById("fieldTrailer").value.trim();
    const screenshots = document.getElementById("fieldScreenshots").value
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);

    if (!name){
      switchToEditorTab("basic");
      errorEl.textContent = "Preencha o nome do patch.";
      document.getElementById("fieldName").focus();
      return false;
    }
    if (!cat){
      switchToEditorTab("basic");
      errorEl.textContent = "Preencha a categoria do patch.";
      document.getElementById("fieldCat").focus();
      return false;
    }
    if (!priceRaw || isNaN(price) || price < 0){
      switchToEditorTab("basic");
      errorEl.textContent = "Preencha um preço válido.";
      document.getElementById("fieldPrice").focus();
      return false;
    }

    errorEl.textContent = "";

    const product = {
      id: id || GmpesStore.slugify(name),
      name, cat, shortDesc, price, oldPrice, badge, version, updatedAt,
      img, description, trailerUrl, screenshots
    };

    const saved = await GmpesStore.upsertProduct(product);
    if (!saved){
      errorEl.textContent = "Não foi possível salvar no Supabase. Verifique sua conexão e tente novamente.";
      return false;
    }

    closeModal();
    await renderTable();
    await renderDashboard();
    return true;
  } catch (err){
    console.error("Erro ao salvar patch:", err);
    errorEl.textContent = "Erro inesperado ao salvar: " + (err && err.message ? err.message : String(err));
    return false;
  }
}

function setupModal(){
  document.getElementById("newProductBtn").addEventListener("click", openNewModal);
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("cancelBtn").addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") closeModal();
  });

  document.getElementById("productForm").addEventListener("submit", handleProductFormSubmit);
  setupImageUpload();
}

function setupImageUpload(){
  const input = document.getElementById("fieldImgUpload");
  const status = document.getElementById("fieldImgUploadStatus");
  const urlField = document.getElementById("fieldImg");
  if (!input) return;

  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    if (!file) return;

    if (!window.supabase){
      status.textContent = "Supabase não carregou — não é possível enviar a imagem.";
      return;
    }

    status.textContent = "Enviando...";
    const client = supabase.createClient(
      "https://hbtamibmcvgbxvbktoii.supabase.co",
      "sb_publishable_REpDy97uh9mUGWhBEk2qpw_f5Lj3ofN"
    );

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${GmpesStore.slugify(file.name.replace(/\.[^.]+$/, ""))}.${ext}`;

    const { error } = await client.storage
      .from("product-images")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error){
      status.textContent = `Falha no envio: ${error.message}`;
      return;
    }

    const { data } = client.storage.from("product-images").getPublicUrl(path);
    urlField.value = data.publicUrl;
    status.textContent = "Imagem enviada com sucesso.";
  });
}

function switchToEditorTab(tabName){
  document.querySelectorAll(".admin-editor-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.etab === tabName);
  });
  document.querySelectorAll(".admin-editor-panel").forEach(p => {
    p.style.display = p.dataset.epanel === tabName ? "flex" : "none";
  });
}

function setupDeleteModal(){
  document.getElementById("deleteModalClose").addEventListener("click", closeDeleteModal);
  document.getElementById("deleteCancelBtn").addEventListener("click", closeDeleteModal);
  document.getElementById("deleteOverlay").addEventListener("click", (e) => {
    if (e.target.id === "deleteOverlay") closeDeleteModal();
  });
  document.getElementById("deleteConfirmBtn").addEventListener("click", async () => {
    if (pendingDeleteId){
      await GmpesStore.deleteProduct(pendingDeleteId);
      closeDeleteModal();
      await renderTable();
      await renderDashboard();
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  setupLogin();
  setupLogout();
  setupTabs();
  setupEditorTabs();
  setupModal();
  setupDeleteModal();

  if (typeof GmpesStore === "undefined"){
    document.body.innerHTML = '<div style="padding:40px; font-family:sans-serif; color:#EFE4D8; background:#0A0705; min-height:100vh;">Erro: store.js não carregou. Verifique se o arquivo store.js está na mesma pasta do admin.html e se ele é referenciado antes do admin.js.</div>';
    return;
  }

  if (isLoggedIn()){
    await showPanel();
  } else {
    showLogin();
  }
});
