(() => {
  const { formatINR, escapeHtml, subscribe, updateCartItemQuantity, removeCartItem } = window.KoboStore;
  const { initShell, showToast } = window.KoboUI;

  const FREE_SHIPPING_THRESHOLD = 5000;
  const rootEl = document.getElementById('cart-page-root');

  function renderCartPage(state) {
    if (!state.ready) return;

    const catalogHref = state.user ? '/account.html?tab=shop' : '/#collection';

    if (!state.cart.items || state.cart.items.length === 0) {
      rootEl.innerHTML = `
        <div class="empty-state">
          <h3>Your shopping bag is empty</h3>
          <p>Select stoneware, brass deskware, lighting, or carry pieces from Edition 04.</p>
          <a href="${catalogHref}" class="btn btn-primary">Explore Collection</a>
        </div>
      `;
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
            <span class="mono-label">${state.cart.itemCount} ${state.cart.itemCount === 1 ? 'Object' : 'Objects'} Selected</span>
            <a href="${catalogHref}" class="mono-label" style="color: var(--ink-primary); text-decoration: underline;">Continue Browsing</a>
          </div>
          <div style="padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
            ${state.cart.items
              .map(
                (item) => `
              <div class="cart-item-row">
                <a href="/product.html?slug=${encodeURIComponent(item.slug)}" class="cart-item-thumb" style="width: 92px; height: 92px;">
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
          <p class="mono-label" style="text-align: center; margin: 0.9rem 0 0;">
            Promo codes (like KOBO10) apply on checkout
          </p>
        </aside>
      </div>
    `;

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

  subscribe(renderCartPage);
  initShell('collection').then(renderCartPage);
})();
