const GMPES_CART_KEY = "gmpes_cart";
const GMPES_AUTH_KEY = "gmpes_logged_in";

const GMPES_VALID_COUPONS = {
  "TBP10": 0.10,
  "PSPFAN": 0.15
};

const GmpesCart = {
  getItems(){
    try {
      const raw = localStorage.getItem(GMPES_CART_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error("invalid shape");
      return parsed;
    } catch (e) {
      console.error("GmpesCart.getItems failed", e);
      return [];
    }
  },

  saveItems(items){
    try {
      localStorage.setItem(GMPES_CART_KEY, JSON.stringify(items));
      return true;
    } catch (e) {
      console.error("GmpesCart.saveItems failed", e);
      return false;
    }
  },

  addItem(productId, qty){
    qty = qty || 1;
    const items = this.getItems();
    const existing = items.find(i => i.productId === productId);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({ productId, qty });
    }
    this.saveItems(items);
    return items;
  },

  updateQty(productId, qty){
    const items = this.getItems();
    const item = items.find(i => i.productId === productId);
    if (!item) return items;
    item.qty = Math.max(1, qty);
    this.saveItems(items);
    return items;
  },

  removeItem(productId){
    const items = this.getItems().filter(i => i.productId !== productId);
    this.saveItems(items);
    return items;
  },

  clear(){
    this.saveItems([]);
  },

  getCount(){
    return this.getItems().reduce((sum, i) => sum + i.qty, 0);
  },

  async getDetailedItems(){
    if (typeof GmpesStore === "undefined") return [];
    const items = this.getItems();
    const detailed = await Promise.all(
      items.map(async item => {
        const product = await GmpesStore.getProduct(item.productId);
        if (!product) return null;
        return { ...item, product };
      })
    );
    return detailed.filter(Boolean);
  },

  async getSummary(){
    const detailed = await this.getDetailedItems();
    const subtotal = detailed.reduce((sum, i) => sum + i.product.price * i.qty, 0);
    return { items: detailed, subtotal, count: detailed.reduce((s, i) => s + i.qty, 0) };
  },

  hasItem(productId){
    return this.getItems().some(i => i.productId === productId);
  },

  isLoggedIn(){
    return localStorage.getItem(GMPES_AUTH_KEY) === "true";
  },

  setLoggedIn(value){
    localStorage.setItem(GMPES_AUTH_KEY, value ? "true" : "false");
  }
};
