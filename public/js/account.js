(() => {
  const {
    api,
    formatINR,
    escapeHtml,
    subscribe,
    updateCartItemQuantity,
    removeCartItem,
    logout,
  } = window.KoboStore;
  const { initShell, showToast } = window.KoboUI;
  const { mountCatalog } = window.KoboCatalog;

  const FREE_SHIPPING_THRESHOLD = 5000;
  const params = new URLSearchParams(window.location.search);
  let activeTab = params.get('tab') || 'shop';
  if (!['shop', 'bag', 'orders', 'profile'].includes(activeTab)) {
    activeTab = 'shop';
  }
  let initialCategory = params.get('category') || 'All';

  const rootEl = document.getElementById('account-root');
  const logoutBtn = document.getElementById('logout-btn');
  const tabsNav = document.getElementById('workspace-tabs');
  const eyebrowEl = document.getElementById('workspace-eyebrow');
  const headingEl = document.getElementById('workspace-heading');
  const tabBagCountEl = document.getElementById('tab-bag-count');
  const tabOrdersCountEl = document.getElementById('tab-orders-count');

  let cachedOrders = [];
  let catalogController = null;

  function formatOrderDate(sqliteDate) {
    if (!sqliteDate) return '';
    const d = new Date(sqliteDate.replace(' ', 'T') + 'Z');
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  function updateTabCounts(state) {
    if (tabBagCountEl) {
      tabBagCountEl.textContent = `(${state.cart.itemCount || 0})`;
    }
    if (tabOrdersCountEl) {
      tabOrdersCountEl.textContent = `(${cachedOrders.length})`;
    }
  }

  function syncUrlState() {
    const next = new URLSearchParams();
    next.set('tab', activeTab);
    if (activeTab === 'shop' && initialCategory && initialCategory !== 'All') {
      next.set('category', initialCategory);
    }
    const nextUrl = `${window.location.pathname}?${next.toString()}`;
    window.history.replaceState({}, '', nextUrl);
  }

  function syncWorkspaceTabs() {
    tabsNav.querySelectorAll('.workspace-tab-btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.tab === activeTab);
    });
  }

  function renderShopTab() {
    catalogController = mountCatalog(rootEl, {
      eyebrow: 'Member Catalog · Edition 04',
      heading: 'Curated Studio Objects',
      initialCategory,
      onCategoryChange(cat) {
        initialCategory = cat;
        syncUrlState();
      },
    });
  }

  function renderBagTab(state) {
    if (!state.cart.items || state.cart.items.length === 0) {
      rootEl.innerHTML = `
        <div class="empty-state">
          <h3>Your bag is currently empty</h3>
          <p>Browse the catalog right here to select stoneware, brassware, or lighting.</p>
          <button type="button" class="btn btn-primary btn-sm" id="bag-to-shop-btn">
            Browse Objects
          </button>
        </div>
      `;
      const goShopBtn = document.getElementById('bag-to-shop-btn');
      if (goShopBtn) {
        goShopBtn.addEventListener('click', () => switchTab('shop'));
      }
      return;
    }

    const subtotal = state.cart.subtotal;
    const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 250;
    const estimatedTotal = subtotal + shippingFee;
    const progressPct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

    rootEl.innerHTML = `
      <div class="checkout-grid">
        <div class="surface-box" style="padding: 0;">
          <div style="padding: 1.15rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <span class="mono-label">${state.cart.itemCount} ${state.cart.itemCount === 1 ? 'Object' : 'Objects'} in Bag</span>
            <button type="button" class="btn-ghost" id="bag-continue-btn" style="padding: 0; font-family: var(--font-mono); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; text-decoration: underline;">
              + Add More Objects
            </button>
          </div>
          <div style="padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
            ${state.cart.items
              .map(
                (item) => `
              <div class="cart-item-row">
                <a href="/product.html?slug=${encodeURIComponent(item.slug)}" class="cart-item-thumb" style="width: 88px; height: 88px;">
                  <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" />
                </a>
                <div class="cart-item-info">
                  <div class="cart-item-top">
                    <div>
                      <span class="mono-label">${escapeHtml(item.sku)}</span>
                      <div class="cart-item-name">
                        <a href="/product.html?slug=${encodeURIComponent(item.slug)}">${escapeHtml(item.name)}</a>
                      </div>
                      <div class="cart-item-variant">Finish: ${escapeHtml(item.variant)}</div>
                    </div>
                    <div style="text-align: right;">
                      <div class="price-mono" style="font-weight: 500;">${formatINR(item.lineTotal)}</div>
                      <div class="mono-label">${formatINR(item.price)} each</div>
                    </div>
                  </div>
                  <div class="cart-item-bottom" style="margin-top: 0.4rem;">
                    <div class="mini-qty">
                      <button type="button" data-action="dec" data-id="${escapeHtml(item.id)}" aria-label="Decrease quantity">−</button>
                      <span>${item.quantity}</span>
                      <button type="button" data-action="inc" data-id="${escapeHtml(item.id)}" aria-label="Increase quantity">+</button>
                    </div>
                    <button type="button" class="remove-link" data-action="remove" data-id="${escapeHtml(item.id)}">
                      Remove item
                    </button>
                  </div>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <aside class="surface-box">
          <h2 class="box-heading">Order Summary</h2>
          <div style="margin-bottom: 1.15rem;">
            <p class="shipping-progress-text" style="margin-bottom: 0.45rem;">
              ${
                subtotal >= FREE_SHIPPING_THRESHOLD
                  ? 'Complimentary insured shipping unlocked.'
                  : `Add ${formatINR(FREE_SHIPPING_THRESHOLD - subtotal)} more for complimentary shipping.`
              }
            </p>
            <div class="shipping-progress-track">
              <div class="shipping-progress-fill" style="width: ${progressPct}%;"></div>
            </div>
          </div>

          <div class="summary-lines">
            <div class="summary-line">
              <span>Subtotal</span>
              <span class="price-mono">${formatINR(subtotal)}</span>
            </div>
            <div class="summary-line">
              <span>Insured Shipping</span>
              <span class="price-mono">${shippingFee === 0 ? 'Complimentary' : formatINR(shippingFee)}</span>
            </div>
          </div>

          <div class="summary-total">
            <span>Estimated Total</span>
            <span class="price-mono">${formatINR(estimatedTotal)}</span>
          </div>

          <a href="/checkout.html" class="btn btn-primary btn-full">Proceed to Checkout</a>
        </aside>
      </div>
    `;

    const contBtn = document.getElementById('bag-continue-btn');
    if (contBtn) contBtn.addEventListener('click', () => switchTab('shop'));

    rootEl.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        const current = state.cart.items.find((x) => String(x.id) === String(id));
        if (!current) return;

        try {
          if (action === 'remove') {
            await removeCartItem(id);
            showToast(`Removed ${current.name}`);
          } else if (action === 'inc') {
            await updateCartItemQuantity(id, current.quantity + 1);
          } else if (action === 'dec') {
            await updateCartItemQuantity(id, current.quantity - 1);
          }
        } catch (err) {
          showToast(err.message);
        }
      });
    });
  }

  function renderOrdersTab() {
    if (cachedOrders.length === 0) {
      rootEl.innerHTML = `
        <div class="empty-state">
          <h3>No orders placed yet</h3>
          <p>Objects you order will appear here with itemized receipts and dispatch status.</p>
          <button type="button" class="btn btn-primary btn-sm" id="orders-to-shop-btn">
            Browse Objects
          </button>
        </div>
      `;
      const goShopBtn = document.getElementById('orders-to-shop-btn');
      if (goShopBtn) goShopBtn.addEventListener('click', () => switchTab('shop'));
      return;
    }

    rootEl.innerHTML = `
      <div class="orders-stack">
        ${cachedOrders
          .map(
            (order) => `
          <article class="order-card">
            <div class="order-card-head">
              <div>
                <span class="mono-label">Order Reference</span>
                <div class="price-mono" style="font-weight: 500;">${escapeHtml(order.order_number)}</div>
              </div>
              <div>
                <span class="mono-label">Placed On</span>
                <div style="font-size: 0.88rem;">${formatOrderDate(order.created_at)}</div>
              </div>
              <div>
                <span class="mono-label">Payment</span>
                <div style="font-size: 0.88rem;">${escapeHtml(order.payment_method)}</div>
              </div>
              <span class="status-badge">● ${escapeHtml(order.status)}</span>
            </div>

            <div class="order-line-list" style="margin-bottom: 1rem;">
              ${order.items
                .map(
                  (item) => `
                <div class="order-line-item">
                  <img src="${escapeHtml(item.product_image)}" alt="${escapeHtml(item.product_name)}" />
                  <div>
                    <a href="/product.html?slug=${encodeURIComponent(item.product_slug)}" style="font-weight: 500;">
                      ${escapeHtml(item.product_name)}
                    </a>
                    <div class="mono-label">${escapeHtml(item.variant)} · Qty ${item.quantity}</div>
                  </div>
                  <span class="price-mono" style="font-size: 0.88rem;">${formatINR(item.line_total)}</span>
                </div>
              `
                )
                .join('')}
            </div>

            <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.75rem; padding-top: 0.9rem; border-top: 1px dashed var(--border);">
              <span style="font-size: 0.84rem; color: var(--ink-secondary);">
                Ship to: ${escapeHtml(order.shipping_address)}, ${escapeHtml(order.city)} ${escapeHtml(order.postal_code)}
              </span>
              <span class="price-mono" style="font-weight: 600;">
                Total: ${formatINR(order.total)}
              </span>
            </div>
          </article>
        `
          )
          .join('')}
      </div>
    `;
  }

  function renderProfileTab(state) {
    rootEl.innerHTML = `
      <div class="surface-box" style="max-width: 640px;">
        <h2 class="box-heading">Client Profile</h2>
        <div id="profile-feedback"></div>
        <form id="profile-form" novalidate>
          <div class="form-field">
            <label for="pf-name">Full Name</label>
            <input type="text" id="pf-name" class="form-input" value="${escapeHtml(state.user.name)}" required />
          </div>
          <div class="form-field">
            <label for="pf-email">Email</label>
            <input type="email" id="pf-email" class="form-input" value="${escapeHtml(state.user.email)}" disabled style="opacity: 0.7;" />
          </div>
          <div class="form-field">
            <label for="pf-phone">Phone</label>
            <input type="tel" id="pf-phone" class="form-input" value="${escapeHtml(state.user.phone || '')}" />
          </div>
          <div class="form-field">
            <label for="pf-address">Default Delivery Address</label>
            <textarea id="pf-address" class="form-input" rows="3">${escapeHtml(state.user.default_address || '')}</textarea>
          </div>
          <button type="submit" class="btn btn-primary" id="pf-save-btn">
            Save Profile Changes
          </button>
        </form>
      </div>
    `;

    const profileForm = document.getElementById('profile-form');
    const feedbackEl = document.getElementById('profile-feedback');
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      feedbackEl.innerHTML = '';
      const saveBtn = document.getElementById('pf-save-btn');
      saveBtn.disabled = true;

      try {
        const res = await api('/api/auth/profile', {
          method: 'PATCH',
          body: JSON.stringify({
            name: document.getElementById('pf-name').value,
            phone: document.getElementById('pf-phone').value,
            default_address: document.getElementById('pf-address').value,
          }),
        });
        window.KoboStore.state.user = res.user;
        headingEl.textContent = `Welcome, ${res.user.name.split(' ')[0]}.`;
        feedbackEl.innerHTML = '<div class="form-banner is-success">Profile updated.</div>';
        showToast('Profile saved');
      } catch (err) {
        feedbackEl.innerHTML = `<div class="form-banner is-error">${escapeHtml(err.message)}</div>`;
      } finally {
        saveBtn.disabled = false;
      }
    });
  }

  function renderActiveTab(state) {
    syncWorkspaceTabs();
    syncUrlState();
    updateTabCounts(state);

    if (activeTab === 'shop') {
      renderShopTab();
    } else if (activeTab === 'bag') {
      catalogController = null;
      renderBagTab(state);
    } else if (activeTab === 'orders') {
      catalogController = null;
      renderOrdersTab();
    } else if (activeTab === 'profile') {
      catalogController = null;
      renderProfileTab(state);
    }
  }

  function switchTab(nextTab, categoryOverride) {
    activeTab = nextTab;
    if (categoryOverride !== undefined) {
      initialCategory = categoryOverride;
    }
    renderActiveTab(window.KoboStore.state);
  }

  async function initWorkspace(state) {
    if (!state.user) {
      logoutBtn.style.display = 'none';
      tabsNav.style.display = 'none';
      eyebrowEl.textContent = 'Client Ledger';
      headingEl.textContent = 'Sign In Required';
      rootEl.innerHTML = `
        <div class="empty-state" style="max-width: 620px; margin: 1rem auto;">
          <h3>Sign in to enter your member storefront</h3>
          <p>Create an account once to browse the catalog, save items, and track orders inside your workspace.</p>
          <a href="/auth.html?redirect=/account.html" class="btn btn-primary">Sign In / Create Account</a>
        </div>
      `;
      return;
    }

    logoutBtn.style.display = 'inline-flex';
    tabsNav.style.display = 'flex';
    eyebrowEl.textContent = `Member Ledger · ${state.user.email}`;
    headingEl.textContent = `Welcome, ${state.user.name.split(' ')[0]}.`;

    try {
      const ordersRes = await api('/api/orders');
      cachedOrders = ordersRes.orders || [];
    } catch (err) {
      showToast(err.message);
    }

    tabsNav.addEventListener('click', (e) => {
      const btn = e.target.closest('.workspace-tab-btn');
      if (!btn) return;
      switchTab(btn.dataset.tab);
    });

    subscribe((nextState) => {
      if (!nextState.user) return;
      updateTabCounts(nextState);
      if (activeTab === 'bag') {
        renderBagTab(nextState);
      }
    });

    renderActiveTab(state);

    window.addEventListener('kobo:navigate-category', (e) => {
      const cat = e.detail?.category || 'All';
      initialCategory = cat;
      activeTab = 'shop';
      syncWorkspaceTabs();
      syncUrlState();
      if (catalogController) {
        catalogController.setCategory(cat);
      } else {
        renderActiveTab(window.KoboStore.state);
      }
    });
  }

  logoutBtn.addEventListener('click', async () => {
    await logout();
    showToast('Signed out');
    window.location.href = '/';
  });

  const navHighlight =
    activeTab === 'shop' && initialCategory !== 'All'
      ? initialCategory.toLowerCase()
      : activeTab === 'shop'
      ? 'collection'
      : 'account';

  initShell(navHighlight).then(initWorkspace);
})();
