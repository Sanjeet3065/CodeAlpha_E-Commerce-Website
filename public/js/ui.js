(() => {
  const FREE_SHIPPING_THRESHOLD = 5000;

  function showToast(message) {
    let stack = document.getElementById('toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'toast-stack';
      stack.className = 'toast-stack';
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.textContent = message;
    stack.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(6px)';
      toast.style.transition = 'opacity 180ms ease, transform 180ms ease';
      setTimeout(() => toast.remove(), 200);
    }, 2900);
  }

  function renderHeaderAndFooter(activeKey = 'collection') {
    const headerMount = document.getElementById('site-header-mount');
    const footerMount = document.getElementById('site-footer-mount');

    if (headerMount) {
      headerMount.innerHTML = `
        <div class="announcement-bar">
          Complimentary insured shipping over ₹5,000 · Use code <strong>KOBO10</strong> at checkout
        </div>
        <header class="site-header">
          <div class="container header-inner">
            <nav class="header-nav" aria-label="Primary navigation">
              <a href="/#collection" class="nav-link ${activeKey === 'collection' ? 'is-active' : ''}">All Objects</a>
              <a href="/?category=Clothes#collection" class="nav-link ${activeKey === 'clothes' ? 'is-active' : ''}">Clothes</a>
              <a href="/?category=Winter%20Wear#collection" class="nav-link ${activeKey === 'winter wear' ? 'is-active' : ''}">Winter Wear</a>
              <a href="/?category=Electronics#collection" class="nav-link ${activeKey === 'electronics' ? 'is-active' : ''}">Electronics</a>
              <a href="/?category=Ceramics#collection" class="nav-link ${activeKey === 'ceramics' ? 'is-active' : ''}">Ceramics</a>
              <a href="/?category=Lighting#collection" class="nav-link ${activeKey === 'lighting' ? 'is-active' : ''}">Lighting</a>
            </nav>

            <button type="button" class="mobile-menu-toggle" id="mobile-menu-btn" aria-expanded="false" aria-controls="mobile-nav-drawer">
              Menu
            </button>

            <a href="/" class="brand-mark" aria-label="KŌBŌ Home">
              <span class="brand-wordmark">KŌBŌ</span>
              <span class="brand-sub">Edition 04</span>
            </a>

            <div class="header-actions">
              <a href="/auth.html" id="nav-account-link" class="header-action-btn ${activeKey === 'account' ? 'is-active' : ''}">
                Sign In
              </a>
              <button type="button" class="bag-trigger" id="bag-open-btn" aria-label="Open shopping bag">
                <span>Bag</span>
                <span class="bag-count-pill" id="header-bag-count">0</span>
              </button>
            </div>
          </div>
          <div class="mobile-nav-drawer" id="mobile-nav-drawer">
            <a href="/#collection" class="nav-link">All Objects</a>
            <a href="/?category=Clothes#collection" class="nav-link">Clothes</a>
            <a href="/?category=Winter%20Wear#collection" class="nav-link">Winter Wear</a>
            <a href="/?category=Electronics#collection" class="nav-link">Electronics</a>
            <a href="/?category=Ceramics#collection" class="nav-link">Ceramics</a>
            <a href="/?category=Deskware#collection" class="nav-link">Deskware</a>
            <a href="/?category=Lighting#collection" class="nav-link">Lighting</a>
            <a href="/?category=Carry#collection" class="nav-link">Carry</a>
            <a href="/?category=Home%20%26%20Living#collection" class="nav-link">Home &amp; Living</a>
            <a href="/cart.html" class="nav-link">View Bag</a>
            <a href="/account.html" class="nav-link">Account &amp; Orders</a>
          </div>
        </header>
      `;
    }

    if (!document.getElementById('cart-drawer')) {
      const drawerShell = document.createElement('div');
      drawerShell.innerHTML = `
        <div class="drawer-backdrop" id="drawer-backdrop"></div>
        <aside class="cart-drawer" id="cart-drawer" aria-label="Shopping bag" aria-hidden="true">
          <div class="drawer-header">
            <h2 class="drawer-title">Your Bag</h2>
            <button type="button" class="drawer-close" id="drawer-close-btn" aria-label="Close bag">×</button>
          </div>
          <div class="shipping-progress-wrap" id="drawer-shipping-wrap">
            <p class="shipping-progress-text" id="drawer-shipping-text">Complimentary shipping over ₹5,000</p>
            <div class="shipping-progress-track">
              <div class="shipping-progress-fill" id="drawer-shipping-fill" style="width: 0%;"></div>
            </div>
          </div>
          <div class="drawer-body" id="drawer-body"></div>
          <div class="drawer-footer" id="drawer-footer">
            <div class="drawer-subtotal-row">
              <span class="mono-label">Subtotal</span>
              <span class="price-mono" id="drawer-subtotal">₹0</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1.25fr; gap: 0.65rem;">
              <a href="/cart.html" class="btn btn-secondary btn-sm btn-full">View Bag</a>
              <a href="/checkout.html" class="btn btn-primary btn-sm btn-full" id="drawer-checkout-btn">Checkout</a>
            </div>
          </div>
        </aside>
      `;
      document.body.appendChild(drawerShell);
    }

    if (footerMount) {
      footerMount.innerHTML = `
        <footer class="site-footer">
          <div class="container">
            <div class="footer-grid">
              <div>
                <p class="footer-brand-title">KŌBŌ</p>
                <p class="footer-copy">
                  Architectural objects for daily rituals. Engineered in small batches from high-fired stoneware, solid C36000 brass, spun steel, and dry-waxed cotton.
                </p>
              </div>
              <div class="footer-col">
                <h4>Collection</h4>
                <ul class="footer-links">
                  <li><a href="/#collection">All Objects</a></li>
                  <li><a href="/?category=Clothes#collection">Clothes</a></li>
                  <li><a href="/?category=Winter%20Wear#collection">Winter Wear</a></li>
                  <li><a href="/?category=Electronics#collection">Electronics</a></li>
                  <li><a href="/?category=Ceramics#collection">Ceramics</a></li>
                  <li><a href="/?category=Deskware#collection">Deskware</a></li>
                  <li><a href="/?category=Lighting#collection">Lighting</a></li>
                  <li><a href="/?category=Carry#collection">Carry</a></li>
                  <li><a href="/?category=Home%20%26%20Living#collection">Home &amp; Living</a></li>
                </ul>
              </div>
              <div class="footer-col">
                <h4>Client Service</h4>
                <ul class="footer-links">
                  <li><a href="/cart.html">Shopping Bag</a></li>
                  <li><a href="/checkout.html">Order Checkout</a></li>
                  <li><a href="/account.html">Order History</a></li>
                  <li><a href="/auth.html">Sign In / Register</a></li>
                </ul>
              </div>
              <div class="footer-col">
                <h4>Studio Dispatch</h4>
                <ul class="footer-links">
                  <li><span style="color: var(--ink-on-dark-muted); font-size: 0.85rem;">Kala Ghoda Studio, Mumbai</span></li>
                  <li><span style="color: var(--ink-on-dark-muted); font-size: 0.85rem;">Mon–Sat · 10:00–19:00 IST</span></li>
                  <li><span style="color: var(--ink-on-dark-muted); font-size: 0.85rem;">Promo: <strong style="color:#E3A78E;font-weight:500;">KOBO10</strong> (10% Off)</span></li>
                </ul>
              </div>
            </div>
            <div class="footer-bottom">
              <span>© 2026 KŌBŌ OBJECTS STUDIO</span>
              <span>BUILT WITH HTML · CSS · JS · EXPRESS · SQLITE</span>
            </div>
          </div>
        </footer>
      `;
    }

    bindGlobalShellEvents();
  }

  function openCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (!drawer || !backdrop) return;
    drawer.classList.add('is-open');
    backdrop.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (!drawer || !backdrop) return;
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function bindGlobalShellEvents() {
    const openBtn = document.getElementById('bag-open-btn');
    const closeBtn = document.getElementById('drawer-close-btn');
    const backdrop = document.getElementById('drawer-backdrop');
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileDrawer = document.getElementById('mobile-nav-drawer');

    if (openBtn) openBtn.addEventListener('click', openCartDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);
    if (backdrop) backdrop.addEventListener('click', closeCartDrawer);

    if (mobileBtn && mobileDrawer) {
      mobileBtn.addEventListener('click', () => {
        const open = mobileDrawer.classList.toggle('is-open');
        mobileBtn.setAttribute('aria-expanded', String(open));
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeCartDrawer();
      }
    });
  }

  function syncShellWithState(state) {
    const { formatINR, escapeHtml } = window.KoboStore;

    const countEl = document.getElementById('header-bag-count');
    if (countEl) {
      countEl.textContent = String(state.cart.itemCount || 0);
    }

    const accountLink = document.getElementById('nav-account-link');
    if (accountLink) {
      if (state.user) {
        const firstName = state.user.name.split(' ')[0];
        accountLink.textContent = `${firstName} · Orders`;
        accountLink.href = '/account.html?tab=orders';
      } else {
        accountLink.textContent = 'Sign In';
        accountLink.href = '/auth.html';
      }
    }

    const brandMark = document.querySelector('.brand-mark');
    if (brandMark) {
      brandMark.href = state.user ? '/account.html' : '/';
    }

    const navCategoryMap = {
      Collection: state.user ? '/account.html?tab=shop' : '/#collection',
      'All Objects': state.user ? '/account.html?tab=shop' : '/#collection',
      Clothes: state.user ? '/account.html?tab=shop&category=Clothes' : '/?category=Clothes#collection',
      'Winter Wear': state.user
        ? '/account.html?tab=shop&category=Winter%20Wear'
        : '/?category=Winter%20Wear#collection',
      Electronics: state.user
        ? '/account.html?tab=shop&category=Electronics'
        : '/?category=Electronics#collection',
      Ceramics: state.user ? '/account.html?tab=shop&category=Ceramics' : '/?category=Ceramics#collection',
      Deskware: state.user ? '/account.html?tab=shop&category=Deskware' : '/?category=Deskware#collection',
      Lighting: state.user ? '/account.html?tab=shop&category=Lighting' : '/?category=Lighting#collection',
      Carry: state.user ? '/account.html?tab=shop&category=Carry' : '/?category=Carry#collection',
      'Home & Living': state.user
        ? '/account.html?tab=shop&category=Home%20%26%20Living'
        : '/?category=Home%20%26%20Living#collection',
    };

    document.querySelectorAll('.header-nav a, .mobile-nav-drawer a, .footer-links a').forEach((link) => {
      const label = link.textContent.trim();
      if (navCategoryMap[label]) {
        link.href = navCategoryMap[label];
      }
    });

    const bodyEl = document.getElementById('drawer-body');
    const subtotalEl = document.getElementById('drawer-subtotal');
    const shippingText = document.getElementById('drawer-shipping-text');
    const shippingFill = document.getElementById('drawer-shipping-fill');
    const footerEl = document.getElementById('drawer-footer');

    if (!bodyEl) return;

    const subtotal = state.cart.subtotal || 0;
    const pct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
    if (shippingFill) shippingFill.style.width = `${pct}%`;
    if (shippingText) {
      if (subtotal === 0) {
        shippingText.textContent = 'Complimentary insured shipping on orders over ₹5,000.';
      } else if (subtotal < FREE_SHIPPING_THRESHOLD) {
        shippingText.textContent = `Add ${formatINR(FREE_SHIPPING_THRESHOLD - subtotal)} more for complimentary shipping.`;
      } else {
        shippingText.textContent = 'Complimentary insured shipping unlocked.';
      }
    }

    if (subtotalEl) {
      subtotalEl.textContent = formatINR(subtotal);
    }

    if (!state.cart.items || state.cart.items.length === 0) {
      const browseUrl = state.user ? '/account.html?tab=shop' : '/#collection';
      bodyEl.innerHTML = `
        <div class="empty-state" style="margin-top: 1.5rem;">
          <h3>Your bag is empty</h3>
          <p>Explore Edition 04 stoneware, brass deskware, and lighting.</p>
          <a href="${browseUrl}" class="btn btn-primary btn-sm" id="drawer-explore-link">Browse Objects</a>
        </div>
      `;
      const exploreLink = document.getElementById('drawer-explore-link');
      if (exploreLink) exploreLink.addEventListener('click', closeCartDrawer);
      if (footerEl) footerEl.style.display = 'none';
      return;
    }

    if (footerEl) footerEl.style.display = 'flex';

    bodyEl.innerHTML = state.cart.items
      .map(
        (item) => `
      <div class="cart-item-row" data-item-id="${escapeHtml(item.id)}">
        <a href="/product.html?slug=${encodeURIComponent(item.slug)}" class="cart-item-thumb">
          <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" />
        </a>
        <div class="cart-item-info">
          <div class="cart-item-top">
            <div>
              <a href="/product.html?slug=${encodeURIComponent(item.slug)}" class="cart-item-name">
                ${escapeHtml(item.name)}
              </a>
              <div class="cart-item-variant">${escapeHtml(item.variant)}</div>
            </div>
            <span class="price-mono" style="font-size: 0.88rem;">${formatINR(item.lineTotal)}</span>
          </div>
          <div class="cart-item-bottom">
            <div class="mini-qty">
              <button type="button" data-action="dec" data-id="${escapeHtml(item.id)}" aria-label="Decrease quantity">−</button>
              <span>${item.quantity}</span>
              <button type="button" data-action="inc" data-id="${escapeHtml(item.id)}" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="remove-link" data-action="remove" data-id="${escapeHtml(item.id)}">
              Remove
            </button>
          </div>
        </div>
      </div>
    `
      )
      .join('');

    bodyEl.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        const current = state.cart.items.find((x) => String(x.id) === String(id));
        if (!current) return;

        try {
          if (action === 'remove') {
            await window.KoboStore.removeCartItem(id);
          } else if (action === 'inc') {
            await window.KoboStore.updateCartItemQuantity(id, current.quantity + 1);
          } else if (action === 'dec') {
            await window.KoboStore.updateCartItemQuantity(id, current.quantity - 1);
          }
        } catch (err) {
          showToast(err.message);
        }
      });
    });
  }

  function initShell(activeKey) {
    renderHeaderAndFooter(activeKey);
    window.KoboStore.subscribe(syncShellWithState);
    return window.KoboStore.initSessionAndCart().then((state) => {
      syncShellWithState(state);
      return state;
    });
  }

  window.KoboUI = {
    initShell,
    openCartDrawer,
    closeCartDrawer,
    showToast,
  };
})();
