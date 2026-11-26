(() => {
  const { api, formatINR, escapeHtml, addToCart } = window.KoboStore;
  const { initShell, openCartDrawer, showToast } = window.KoboUI;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug') || params.get('id') || 'kuro-pour-over-carafe';

  const breadcrumbEl = document.getElementById('pdp-breadcrumb');
  const rootEl = document.getElementById('pdp-root');
  const relatedSection = document.getElementById('related-section');
  const relatedGrid = document.getElementById('related-grid');

  let selectedVariant = '';
  let selectedQty = 1;

  function renderProduct(product, related) {
    document.title = `${product.name} — KŌBŌ`;
    selectedVariant = product.variants[0] || 'Standard';
    selectedQty = 1;

    const isSignedIn = Boolean(window.KoboStore.state.user);
    const allHref = isSignedIn ? '/account.html?tab=shop' : '/';
    const catHref = isSignedIn
      ? `/account.html?tab=shop&category=${encodeURIComponent(product.category)}`
      : `/?category=${encodeURIComponent(product.category)}#collection`;

    breadcrumbEl.innerHTML = `
      <a href="${allHref}">Collection</a>
      <span>/</span>
      <a href="${catHref}">${escapeHtml(product.category)}</a>
      <span>/</span>
      <span style="color: var(--ink-primary);">${escapeHtml(product.name)}</span>
    `;

    const viewFullLink = document.querySelector('#related-section a');
    if (viewFullLink) viewFullLink.href = allHref;

    let stockClass = 'pdp-stock-pill';
    let stockText = `In Stock · ${product.stock} units ready`;
    if (product.stock === 0) {
      stockClass += ' is-out';
      stockText = 'Sold Out';
    } else if (product.stock <= 6) {
      stockClass += ' is-low';
      stockText = `Limited Batch · ${product.stock} remaining`;
    }

    const specsRows = Object.entries(product.specs || {})
      .map(
        ([label, value]) => `
      <tr>
        <th scope="row">${escapeHtml(label)}</th>
        <td>${escapeHtml(value)}</td>
      </tr>
    `
      )
      .join('');

    const gallery = Array.isArray(product.gallery) && product.gallery.length
      ? product.gallery
      : [product.image_url];

    rootEl.innerHTML = `
      <div class="pdp-grid">
        <div class="pdp-gallery">
          <div class="pdp-main-frame">
            <img id="pdp-main-img" src="${escapeHtml(gallery[0])}" alt="${escapeHtml(product.name)}" />
          </div>
          ${
            gallery.length > 1
              ? `
            <div class="pdp-thumbs" id="pdp-thumbs">
              ${gallery
                .map(
                  (imgSrc, idx) => `
                <button
                  type="button"
                  class="pdp-thumb-btn ${idx === 0 ? 'is-active' : ''}"
                  data-img="${escapeHtml(imgSrc)}"
                  aria-label="Preview image ${idx + 1}"
                >
                  <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(product.name)} view ${idx + 1}" />
                </button>
              `
                )
                .join('')}
            </div>
          `
              : ''
          }
        </div>

        <div class="pdp-info">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
              <span class="mono-label">${escapeHtml(product.category)} · ${escapeHtml(product.sku)}</span>
              <span class="${stockClass}">● ${stockText}</span>
            </div>
            <h1 class="pdp-title">${escapeHtml(product.name)}</h1>
            <p class="pdp-tagline">${escapeHtml(product.tagline)}</p>
          </div>

          <div class="pdp-price-row">
            <span class="pdp-price">${formatINR(product.price)}</span>
            ${
              product.compare_at_price && product.compare_at_price > product.price
                ? `<span class="product-compare" style="font-size: 1rem;">${formatINR(product.compare_at_price)}</span>`
                : ''
            }
            <span class="mono-label" style="margin-left: auto;">Incl. of all taxes</span>
          </div>

          <div>
            <span class="pdp-option-label">Finish / Edition</span>
            <div class="variant-pills" id="variant-pills">
              ${product.variants
                .map(
                  (variant, idx) => `
                <button
                  type="button"
                  class="variant-pill ${idx === 0 ? 'is-selected' : ''}"
                  data-variant="${escapeHtml(variant)}"
                >
                  ${escapeHtml(variant)}
                </button>
              `
                )
                .join('')}
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <span class="pdp-option-label" style="margin-bottom: 0;">Quantity</span>
            <div class="pdp-purchase-row">
              <div class="qty-stepper">
                <button type="button" id="pdp-qty-dec" aria-label="Decrease quantity">−</button>
                <span id="pdp-qty-val">1</span>
                <button type="button" id="pdp-qty-inc" aria-label="Increase quantity">+</button>
              </div>
              <button
                type="button"
                class="btn btn-primary"
                id="pdp-add-btn"
                ${product.stock === 0 ? 'disabled' : ''}
              >
                ${product.stock === 0 ? 'Out of Stock' : `Add to Bag — ${formatINR(product.price)}`}
              </button>
            </div>
            <button
              type="button"
              class="btn btn-secondary btn-full"
              id="pdp-buy-now-btn"
              ${product.stock === 0 ? 'disabled' : ''}
            >
              Buy Now &amp; Proceed to Checkout
            </button>
          </div>

          <div>
            <span class="pdp-option-label">Object Notes</span>
            <p class="pdp-description">${escapeHtml(product.description)}</p>
          </div>

          <div>
            <span class="pdp-option-label">Technical Specifications</span>
            <table class="specs-table">
              <tbody>${specsRows}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const mainImg = document.getElementById('pdp-main-img');
    const thumbsWrap = document.getElementById('pdp-thumbs');
    if (thumbsWrap && mainImg) {
      thumbsWrap.addEventListener('click', (e) => {
        const btn = e.target.closest('.pdp-thumb-btn');
        if (!btn) return;
        mainImg.src = btn.dataset.img;
        thumbsWrap.querySelectorAll('.pdp-thumb-btn').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
    }

    const pillsWrap = document.getElementById('variant-pills');
    if (pillsWrap) {
      pillsWrap.addEventListener('click', (e) => {
        const pill = e.target.closest('.variant-pill');
        if (!pill) return;
        selectedVariant = pill.dataset.variant;
        pillsWrap.querySelectorAll('.variant-pill').forEach((p) => p.classList.remove('is-selected'));
        pill.classList.add('is-selected');
      });
    }

    const qtyValEl = document.getElementById('pdp-qty-val');
    const addBtn = document.getElementById('pdp-add-btn');
    const buyNowBtn = document.getElementById('pdp-buy-now-btn');

    function updateQtyDisplay() {
      qtyValEl.textContent = String(selectedQty);
      if (product.stock > 0) {
        addBtn.textContent = `Add to Bag — ${formatINR(product.price * selectedQty)}`;
      }
    }

    document.getElementById('pdp-qty-dec').addEventListener('click', () => {
      if (selectedQty > 1) {
        selectedQty -= 1;
        updateQtyDisplay();
      }
    });

    document.getElementById('pdp-qty-inc').addEventListener('click', () => {
      if (selectedQty < product.stock) {
        selectedQty += 1;
        updateQtyDisplay();
      }
    });

    addBtn.addEventListener('click', async () => {
      addBtn.disabled = true;
      try {
        await addToCart(product, selectedVariant, selectedQty);
        showToast(`Added ${selectedQty} × ${product.name}`);
        openCartDrawer();
      } catch (err) {
        showToast(err.message);
      } finally {
        addBtn.disabled = product.stock === 0;
      }
    });

    buyNowBtn.addEventListener('click', async () => {
      buyNowBtn.disabled = true;
      try {
        await addToCart(product, selectedVariant, selectedQty);
        window.location.href = '/checkout.html';
      } catch (err) {
        showToast(err.message);
        buyNowBtn.disabled = product.stock === 0;
      }
    });

    if (Array.isArray(related) && related.length > 0) {
      relatedSection.style.display = 'block';
      relatedGrid.innerHTML = related
        .map(
          (item) => `
        <article class="product-card">
          <a href="/product.html?slug=${encodeURIComponent(item.slug)}" class="product-media">
            <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" loading="lazy" />
          </a>
          <div class="product-meta-row">
            <span class="mono-label">${escapeHtml(item.category)}</span>
            <span class="mono-label">${escapeHtml(item.sku)}</span>
          </div>
          <h3 class="product-title">
            <a href="/product.html?slug=${encodeURIComponent(item.slug)}">${escapeHtml(item.name)}</a>
          </h3>
          <p class="product-tagline">${escapeHtml(item.tagline)}</p>
          <div class="product-footer-row">
            <span class="product-price">${formatINR(item.price)}</span>
            <a href="/product.html?slug=${encodeURIComponent(item.slug)}" class="quick-add-btn">Inspect</a>
          </div>
        </article>
      `
        )
        .join('');
    }
  }

  initShell('collection').then(async () => {
    try {
      const data = await api(`/api/products/${encodeURIComponent(slug)}`);
      renderProduct(data.product, data.related);
    } catch (err) {
      rootEl.innerHTML = `
        <div class="empty-state" style="margin: 3rem 0;">
          <h3>Object not found</h3>
          <p>${escapeHtml(err.message)}</p>
          <a href="/" class="btn btn-primary btn-sm">Return to Catalog</a>
        </div>
      `;
    }
  });
})();
