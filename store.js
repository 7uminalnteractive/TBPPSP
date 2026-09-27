/**
 * GmpesStore — camada de dados dos patches, agora usando Supabase (tabela public.products)
 * em vez de localStorage. A API pública (getProducts, getProduct, upsertProduct, deleteProduct,
 * slugify, getSales, getSalesSummary) foi mantida com os mesmos nomes, mas agora é assíncrona
 * (retorna Promises) — todo código que a chama precisa usar await.
 */

const SUPABASE_URL = "https://hbtamibmcvgbxvbktoii.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_REpDy97uh9mUGWhBEk2qpw_f5Lj3ofN";

const _gmpesSupabase = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Vendas ainda não têm uma tabela própria no Supabase; seguem locais (só para o painel admin).
const GMPES_SALES_KEY = "gmpes_sales";
const GMPES_DEFAULT_SALES = [
  { id: "s1", productId: "conmebol", productName: "Patch Conmebol", amount: 14.90, buyer: "cliente_87x", date: "2026-09-05T14:32:00" },
  { id: "s2", productId: "europeu",  productName: "Patch Europeu",  amount: 14.90, buyer: "joao_psp",   date: "2026-09-05T11:10:00" },
  { id: "s3", productId: "conmebol", productName: "Patch Conmebol", amount: 14.90, buyer: "retro_fan",  date: "2026-09-04T20:45:00" },
  { id: "s4", productId: "conmebol", productName: "Patch Conmebol", amount: 14.90, buyer: "lucas.c",    date: "2026-09-03T09:15:00" },
  { id: "s5", productId: "europeu",  productName: "Patch Europeu",  amount: 14.90, buyer: "mari_f",     date: "2026-09-02T18:02:00" },
];

function _rowToProduct(row){
  return {
    id: row.id,
    name: row.name,
    cat: row.cat || "",
    price: (row.price_cents || 0) / 100,
    oldPrice: row.old_price_cents != null ? row.old_price_cents / 100 : null,
    badge: row.badge || null,
    img: row.img_url || "",
    shortDesc: row.short_desc || "",
    description: row.description || "",
    version: row.version || "1.0",
    updatedAt: row.updated_at ? String(row.updated_at).slice(0, 10) : null,
    trailerUrl: row.trailer_url || "",
    screenshots: Array.isArray(row.screenshots) ? row.screenshots : [],
    active: row.active !== false
  };
}

function _productToRow(product){
  return {
    id: product.id,
    name: product.name,
    cat: product.cat || null,
    price_cents: Math.round((product.price || 0) * 100),
    old_price_cents: product.oldPrice ? Math.round(product.oldPrice * 100) : null,
    badge: product.badge || null,
    img_url: product.img || null,
    short_desc: product.shortDesc || null,
    description: product.description || null,
    version: product.version || "1.0",
    updated_at: product.updatedAt || new Date().toISOString().slice(0, 10),
    trailer_url: product.trailerUrl || null,
    screenshots: product.screenshots || []
  };
}

const GmpesStore = {
  async getProducts(){
    if (!_gmpesSupabase) {
      console.error("Supabase não carregou (script CDN ausente?).");
      return [];
    }
    const { data, error } = await _gmpesSupabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("GmpesStore.getProducts falhou", error);
      return [];
    }
    return data.map(_rowToProduct);
  },

  async getProduct(id){
    if (!_gmpesSupabase) return null;
    const { data, error } = await _gmpesSupabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return _rowToProduct(data);
  },

  async upsertProduct(product){
    if (!_gmpesSupabase) return false;
    const row = _productToRow(product);
    const { data, error } = await _gmpesSupabase
      .from("products")
      .upsert(row, { onConflict: "id" })
      .select();
    if (error) {
      console.error("GmpesStore.upsertProduct falhou", error);
      return false;
    }
    return this.getProducts();
  },

  async deleteProduct(id){
    if (!_gmpesSupabase) return [];
    const { error } = await _gmpesSupabase
      .from("products")
      .update({ active: false })
      .eq("id", id);
    if (error) console.error("GmpesStore.deleteProduct falhou", error);
    return this.getProducts();
  },

  slugify(name){
    return name
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `patch-${Date.now()}`;
  },

  // --- Vendas: ainda locais (não migradas), mantidas só para o dashboard do admin ---
  getSales(){
    try {
      const raw = localStorage.getItem(GMPES_SALES_KEY);
      if (!raw) {
        this.saveSales(GMPES_DEFAULT_SALES);
        return [...GMPES_DEFAULT_SALES];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error("invalid shape");
      return parsed;
    } catch (e) {
      console.error("GmpesStore.getSales failed, falling back to defaults", e);
      return [...GMPES_DEFAULT_SALES];
    }
  },

  saveSales(sales){
    try {
      localStorage.setItem(GMPES_SALES_KEY, JSON.stringify(sales));
      return true;
    } catch (e) {
      console.error("GmpesStore.saveSales failed", e);
      return false;
    }
  },

  getSalesSummary(){
    const sales = this.getSales();
    const total = sales.reduce((sum, s) => sum + s.amount, 0);
    const count = sales.length;
    const byProduct = {};
    sales.forEach(s => {
      byProduct[s.productId] = (byProduct[s.productId] || 0) + 1;
    });
    return { total, count, byProduct, sales };
  }
};
