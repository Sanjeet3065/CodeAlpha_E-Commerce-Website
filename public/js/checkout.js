(() => {
  const { api, formatINR, escapeHtml, refreshCart } = window.KoboStore;
  const { initShell, showToast } = window.KoboUI;

  const FREE_SHIPPING_THRESHOLD = 5000;
  const STANDARD_SHIPPING_FEE = 250;
  const PROMO_RATES = {
    KOBO10: 0.1,
    ATELIER15: 0.15,
  };

  const rootEl = document.getElementById('checkout-root');
  const titleEl = document.getElementById('checkout-page-title');

  let selectedPayment = 'UPI';
  let activePromo = '';

  function computeSummary(subtotal) {
    const rate = activePromo && PROMO_RATES[activePromo] ? PROMO_RATES[activePromo] : 0;
    const discount = Math.round(subtotal * rate);
    const afterDiscount = subtotal - discount;
    const shippingFee = afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
    const total = afterDiscount + shippingFee;
    return { subtotal, discount, shippingFee, total };
  }

  function renderReceipt(order) {
    titleEl.textContent = 'Order Confirmed';
    rootEl.innerHTML = `
      <div class="surface-box" style="max-width: 820px; margin: 0 auto;">
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 1rem; padding-bottom: 1.35rem; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem;">
          <div>
            <span class="status-badge">● ${escapeHtml(order.status)}</span>
            <h2 style="font-family: var(--font-display); font-size: 2rem; font-weight: 500; margin: 0.65rem 0 0.25rem;">
              Thank you, ${escapeHtml(order.customer_name.split(' ')[0])}.
            </h2>
            <p style="margin: 0; color: var(--ink-secondary); font-size: 0.92rem;">
              Your order has been logged in the studio ledger and queued for dispatch.
            </p>
          </div>
          <div style="text-align: right;">
            <span class="mono-label" style="display: block;">Order Reference</span>
            <strong class="price-mono" style="font-size: 1.15rem;">${escapeHtml(order.order_number)}</strong>
          </div>
        </div>

        <div class="form-grid" style="margin-bottom: 1.5rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border);">
          <div>
            <span class="mono-label">Delivery Destination</span>
            <p style="margin: 0.35rem 0 0; font-size: 0.9rem;">
              ${escapeHtml(order.customer_name)}<br />
              ${escapeHtml(order.shipping_address)}<br />
              ${escapeHtml(order.city)} — ${escapeHtml(order.postal_code)}, ${escapeHtml(order.country)}<br />
              ${escapeHtml(order.customer_phone)}
            </p>
          </div>
          <div>
            <span class="mono-label">Payment Method</span>
            <p style="margin: 0.35rem 0 0; font-size: 0.9rem;">
              ${escapeHtml(order.payment_method)}<br />
              <span style="color: var(--ink-muted);">${escapeHtml(order.customer_email)}</span>
            </p>
          </div>
        </div>

        <span class="mono-label" style="display: block; margin-bottom: 0.85rem;">Items Ordered</span>
        <div class="order-line-list" style="margin-bottom: 1.25rem;">
          ${order.items
            .map(
              (item) => `
            <div class="order-line-item">
              <img src="${escapeHtml(item.product_image)}" alt="${escapeHtml(item.product_name)}" />
              <div>
                <div style="font-weight: 500;">${escapeHtml(item.product_name)}</div>
                <div class="mono-label">${escapeHtml(item.variant)} · Qty ${item.quantity}</div>
              </div>
              <div class="price-mono">${formatINR(item.line_total)}</div>
            </div>
          `
            )
            .join('')}
        </div>

        <div class="summary-lines">
          <div class="summary-line">
            <span>Subtotal</span>
            <span class="price-mono">${formatINR(order.subtotal)}</span>
          </div>
          ${
            order.discount > 0
              ? `
            <div class="summary-line" style="color: var(--success);">
              <span>Promo (${escapeHtml(order.promo_code)})</span>
              <span class="price-mono">−${formatINR(order.discount)}</span>
            </div>
          `
              : ''
          }
          <div class="summary-line">
            <span>Shipping</span>
            <span class="price-mono">${order.shipping_fee === 0 ? 'Complimentary' : formatINR(order.shipping_fee)}</span>
          </div>
        </div>

        <div class="summary-total">
          <span>Total Paid</span>
          <span class="price-mono">${formatINR(order.total)}</span>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 0.85rem; margin-top: 1.5rem;">
          <a href="/account.html?tab=orders" class="btn btn-primary">View Order History</a>
          <a href="/account.html?tab=shop" class="btn btn-secondary">Continue Shopping</a>
          <button type="button" class="btn btn-ghost" onclick="window.print()">Print Receipt</button>
        </div>
      </div>
    `;
  }

  function renderCheckout(state) {
    if (!state.user) {
      rootEl.innerHTML = `
        <div class="empty-state" style="max-width: 640px; margin: 1rem auto;">
          <span class="mono-label">Authentication Required</span>
          <h3 style="margin-top: 0.5rem;">Sign in to complete your order</h3>
          <p>Your selected objects stay preserved in your bag while you sign in or create an account.</p>
          <div style="display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap;">
            <a href="/auth.html?redirect=/checkout.html" class="btn btn-primary">Sign In to Continue</a>
            <a href="/auth.html?mode=register&redirect=/checkout.html" class="btn btn-secondary">Create Account</a>
          </div>
        </div>
      `;
      return;
    }

    if (!state.cart.items || state.cart.items.length === 0) {
      rootEl.innerHTML = `
        <div class="empty-state">
          <h3>Your bag is currently empty</h3>
          <p>Add objects from our Edition 04 collection before checking out.</p>
          <a href="/account.html?tab=shop" class="btn btn-primary">Browse Collection</a>
        </div>
      `;
      return;
    }

    const summary = computeSummary(state.cart.subtotal);

    rootEl.innerHTML = `
      <form id="checkout-form" class="checkout-grid" novalidate>
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <section class="surface-box">
            <h2 class="box-heading">1. Delivery Details</h2>
            <div id="checkout-error-box"></div>
            <div class="form-grid">
              <div class="form-field">
                <label for="co-name">Recipient Full Name</label>
                <input type="text" id="co-name" class="form-input" value="${escapeHtml(state.user.name)}" required />
              </div>
              <div class="form-field">
                <label for="co-email">Email for Order Receipt</label>
                <input type="email" id="co-email" class="form-input" value="${escapeHtml(state.user.email)}" required />
              </div>
              <div class="form-field">
                <label for="co-phone">Mobile Phone</label>
                <input type="tel" id="co-phone" class="form-input" value="${escapeHtml(state.user.phone || '')}" placeholder="+91 98..." required />
              </div>
              <div class="form-field">
                <label for="co-country">Country</label>
                <input type="text" id="co-country" class="form-input" value="India" required />
              </div>
              <div class="form-field is-full">
                <label for="co-address">Street Address &amp; Apartment</label>
                <input type="text" id="co-address" class="form-input" value="${escapeHtml(state.user.default_address || '')}" placeholder="Flat / Street / Landmark" required />
              </div>
              <div class="form-field">
                <label for="co-city">City</label>
                <input type="text" id="co-city" class="form-input" placeholder="e.g. Mumbai" required />
              </div>
              <div class="form-field">
                <label for="co-postal">Postal / PIN Code</label>
                <input type="text" id="co-postal" class="form-input" placeholder="e.g. 400001" required />
              </div>
            </div>
          </section>

          <section class="surface-box">
            <h2 class="box-heading">2. Payment Method</h2>
            <div class="payment-options" id="payment-options">
              <button type="button" class="payment-card is-selected" data-method="UPI">
                <strong>UPI</strong>
                <small>Instant GPay / PhonePe</small>
              </button>
              <button type="button" class="payment-card" data-method="Card">
                <strong>Credit / Debit Card</strong>
                <small>Visa, Mastercard, RuPay</small>
              </button>
              <button type="button" class="payment-card" data-method="Cash on Delivery">
                <strong>Cash on Delivery</strong>
                <small>Pay on doorstep arrival</small>
              </button>
            </div>

            <div id="payment-fields-upi">
              <div class="form-field" style="margin-bottom: 0;">
                <label for="co-upi-id">UPI ID</label>
                <input type="text" id="co-upi-id" class="form-input" value="kobo.client@okicici" placeholder="name@bank" />
              </div>
            </div>

            <div id="payment-fields-card" style="display: none;">
              <div class="form-grid">
                <div class="form-field is-full">
                  <label for="co-card-num">Card Number (Simulated)</label>
                  <input type="text" id="co-card-num" class="form-input" placeholder="4532 •••• •••• 8910" maxlength="19" />
                </div>
                <div class="form-field">
                  <label for="co-card-exp">Expiry (MM/YY)</label>
                  <input type="text" id="co-card-exp" class="form-input" placeholder="08/29" maxlength="5" />
                </div>
                <div class="form-field">
                  <label for="co-card-cvv">CVV</label>
                  <input type="password" id="co-card-cvv" class="form-input" placeholder="•••" maxlength="4" />
                </div>
              </div>
            </div>

            <div id="payment-fields-cod" style="display: none;">
              <p style="margin: 0; font-size: 0.88rem; color: var(--ink-secondary);">
                Pay in cash or UPI scan directly to the courier upon delivery.
              </p>
            </div>

            <p class="mono-label" style="margin: 1rem 0 0;">
              Demo Order Processing — no live card charge is made
            </p>
          </section>
        </div>

        <aside class="surface-box" style="position: sticky; top: calc(var(--header-height) + 1.25rem);">
          <h2 class="box-heading">Order Summary</h2>
          <div class="order-line-list" style="margin-bottom: 1rem;">
            ${state.cart.items
              .map(
                (item) => `
              <div class="order-line-item">
                <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" />
                <div>
                  <div style="font-weight: 500; font-size: 0.92rem;">${escapeHtml(item.name)}</div>
                  <div class="mono-label">${escapeHtml(item.variant)} × ${item.quantity}</div>
                </div>
                <div class="price-mono" style="font-size: 0.88rem;">${formatINR(item.lineTotal)}</div>
              </div>
            `
              )
              .join('')}
          </div>

          <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
            <input
              type="text"
              id="promo-input"
              class="form-input"
              placeholder="Promo code (e.g. KOBO10)"
              value="${escapeHtml(activePromo)}"
              style="padding: 0.55rem 0.75rem; font-size: 0.84rem;"
            />
            <button type="button" id="apply-promo-btn" class="btn btn-secondary btn-sm">Apply</button>
          </div>

          <div class="summary-lines">
            <div class="summary-line">
              <span>Subtotal</span>
              <span class="price-mono">${formatINR(summary.subtotal)}</span>
            </div>
            ${
              summary.discount > 0
                ? `
              <div class="summary-line" style="color: var(--success);">
                <span>Promo (${escapeHtml(activePromo)})</span>
                <span class="price-mono">−${formatINR(summary.discount)}</span>
              </div>
            `
                : ''
            }
            <div class="summary-line">
              <span>Insured Shipping</span>
              <span class="price-mono">${summary.shippingFee === 0 ? 'Complimentary' : formatINR(summary.shippingFee)}</span>
            </div>
          </div>

          <div class="summary-total">
            <span>Total</span>
            <span class="price-mono">${formatINR(summary.total)}</span>
          </div>

          <button type="submit" id="place-order-btn" class="btn btn-primary btn-full">
            Place Order — ${formatINR(summary.total)}
          </button>
        </aside>
      </form>
    `;

    const payWrap = document.getElementById('payment-options');
    const upiPane = document.getElementById('payment-fields-upi');
    const cardPane = document.getElementById('payment-fields-card');
    const codPane = document.getElementById('payment-fields-cod');

    payWrap.addEventListener('click', (e) => {
      const card = e.target.closest('.payment-card');
      if (!card) return;
      selectedPayment = card.dataset.method;
      payWrap.querySelectorAll('.payment-card').forEach((c) => c.classList.remove('is-selected'));
      card.classList.add('is-selected');
      upiPane.style.display = selectedPayment === 'UPI' ? 'block' : 'none';
      cardPane.style.display = selectedPayment === 'Card' ? 'block' : 'none';
      codPane.style.display = selectedPayment === 'Cash on Delivery' ? 'block' : 'none';
    });

    document.getElementById('apply-promo-btn').addEventListener('click', () => {
      const code = document.getElementById('promo-input').value.trim().toUpperCase();
      if (!code) {
        activePromo = '';
        renderCheckout(state);
        return;
      }
      if (!PROMO_RATES[code]) {
        showToast('Invalid promo code. Try KOBO10');
        return;
      }
      activePromo = code;
      showToast(`Applied ${code} discount`);
      renderCheckout(state);
    });

    const form = document.getElementById('checkout-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errBox = document.getElementById('checkout-error-box');
      errBox.innerHTML = '';

      const placeBtn = document.getElementById('place-order-btn');
      placeBtn.disabled = true;
      placeBtn.textContent = 'Processing Order…';

      try {
        const res = await api('/api/orders', {
          method: 'POST',
          body: JSON.stringify({
            customerName: document.getElementById('co-name').value,
            customerEmail: document.getElementById('co-email').value,
            customerPhone: document.getElementById('co-phone').value,
            shippingAddress: document.getElementById('co-address').value,
            city: document.getElementById('co-city').value,
            postalCode: document.getElementById('co-postal').value,
            country: document.getElementById('co-country').value,
            paymentMethod: selectedPayment,
            promoCode: activePromo,
            items: state.cart.items.map((item) => ({
              productId: item.productId,
              variant: item.variant,
              quantity: item.quantity,
            })),
          }),
        });

        await refreshCart();
        showToast(`Order ${res.order.order_number} confirmed`);
        renderReceipt(res.order);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        errBox.innerHTML = `<div class="form-banner is-error">${escapeHtml(err.message)}</div>`;
        placeBtn.disabled = false;
        placeBtn.textContent = `Place Order — ${formatINR(summary.total)}`;
      }
    });
  }

  initShell('collection').then(renderCheckout);
})();
