(() => {
  const GUEST_CART_KEY = 'kobo_guest_cart_v1';

  const state = {
    user: null,
    cart: { items: [], subtotal: 0, itemCount: 0 },
    ready: false,
  };

  const listeners = new Set();

  function notify() {
    for (const fn of listeners) {
      try {
        fn(state);
      } catch (err) {
        console.error(err);
      }
    }
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function formatINR(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function api(url, options = {}) {
    const res = await fetch(url, {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || `Request failed (${res.status})`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function readGuestCart() {
    try {
      const raw = localStorage.getItem(GUEST_CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeGuestCart(items) {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  }

  function computeCartTotals(items) {
    let subtotal = 0;
    let itemCount = 0;
    const normalized = items.map((item) => {
      const lineTotal = Number(item.price) * Number(item.quantity);
      subtotal += lineTotal;
      itemCount += Number(item.quantity);
      return { ...item, lineTotal };
    });
    return { items: normalized, subtotal, itemCount };
  }

  async function syncGuestCartIfNeeded() {
    const guestItems = readGuestCart();
    if (!state.user || guestItems.length === 0) return;

    const payload = guestItems.map((item) => ({
      productId: item.productId,
      variant: item.variant,
      quantity: item.quantity,
    }));

    const serverCart = await api('/api/cart/sync', {
      method: 'POST',
      body: JSON.stringify({ items: payload }),
    });
    localStorage.removeItem(GUEST_CART_KEY);
    state.cart = serverCart;
  }

  async function initSessionAndCart() {
    try {
      const me = await api('/api/auth/me');
      state.user = me.user || null;

      if (state.user) {
        await syncGuestCartIfNeeded();
        state.cart = await api('/api/cart');
      } else {
        state.cart = computeCartTotals(readGuestCart());
      }
    } catch (err) {
      console.error('Failed to bootstrap store state:', err);
      state.cart = computeCartTotals(readGuestCart());
    } finally {
      state.ready = true;
      notify();
    }
    return state;
  }

  async function addToCart(product, variant, quantity = 1) {
    const chosenVariant =
      variant || (Array.isArray(product.variants) && product.variants[0]) || 'Standard';
    const qty = Math.max(1, Math.floor(Number(quantity || 1)));

    if (state.user) {
      state.cart = await api('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          variant: chosenVariant,
          quantity: qty,
        }),
      });
      notify();
      return state.cart;
    }

    const items = readGuestCart();
    const existing = items.find(
      (i) => i.productId === product.id && i.variant === chosenVariant
    );
    if (existing) {
      existing.quantity = Math.min(product.stock || 99, existing.quantity + qty);
    } else {
      items.push({
        id: `${product.id}::${chosenVariant}`,
        productId: product.id,
        slug: product.slug,
        sku: product.sku,
        name: product.name,
        category: product.category,
        variant: chosenVariant,
        price: product.price,
        stock: product.stock,
        image_url: product.image_url,
        quantity: Math.min(product.stock || 99, qty),
      });
    }
    writeGuestCart(items);
    state.cart = computeCartTotals(items);
    notify();
    return state.cart;
  }

  async function updateCartItemQuantity(itemId, quantity) {
    const nextQty = Math.floor(Number(quantity));
    if (state.user) {
      state.cart = await api(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: nextQty }),
      });
      notify();
      return state.cart;
    }

    let items = readGuestCart();
    if (nextQty <= 0) {
      items = items.filter((i) => String(i.id) !== String(itemId));
    } else {
      items = items.map((i) =>
        String(i.id) === String(itemId)
          ? { ...i, quantity: Math.min(i.stock || 99, nextQty) }
          : i
      );
    }
    writeGuestCart(items);
    state.cart = computeCartTotals(items);
    notify();
    return state.cart;
  }

  async function removeCartItem(itemId) {
    if (state.user) {
      state.cart = await api(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
      });
      notify();
      return state.cart;
    }
    const items = readGuestCart().filter((i) => String(i.id) !== String(itemId));
    writeGuestCart(items);
    state.cart = computeCartTotals(items);
    notify();
    return state.cart;
  }

  async function refreshCart() {
    if (state.user) {
      state.cart = await api('/api/cart');
    } else {
      state.cart = computeCartTotals(readGuestCart());
    }
    notify();
    return state.cart;
  }

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    state.user = null;
    state.cart = computeCartTotals(readGuestCart());
    notify();
  }

  window.KoboStore = {
    state,
    subscribe,
    api,
    formatINR,
    escapeHtml,
    initSessionAndCart,
    syncGuestCartIfNeeded,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    refreshCart,
    logout,
  };
})();
