(() => {
  const { api, formatINR, escapeHtml, addToCart } = window.KoboStore;
  const { showToast } = window.KoboUI;

  let knownCategories = [
    'All',
    'Clothes',
    'Winter Wear',
    'Electronics',
    'Ceramics',
    'Deskware',
    'Lighting',
    'Carry',
    'Home & Living',
  ];

  function getBadgeHtml(product) {
    if (product.stock === 0) {
      return '<span class="product-badge" style="color: var(--danger);">Sold Out</span>';
    }
    if (product.compare_at_price && product.compare_at_price > product.price) {
      const pct = Math.round(
        ((product.compare_at_price - product.price) / product.compare_at_price) * 100
      );
      return `<span class="product-badge">Save ${pct}%</span>`;
    }
    if (product.stock <= 6) {
      return `<span class="product-badge">Only ${product.stock} Left</span>`;
    }
    return '';
  }

  /**
   * Mounts a reusable filterable & searchable product catalog inside any container.
   */
  function mountCatalog(mountEl, options = {}) {
    if (!mountEl) return null;

    let activeCategory = options.initialCategory || 'All';
    let searchQuery = options.initialQuery || '';
    let sortMode = options.initialSort || 'featured';
    let loadedProducts = [];
    let debounceTimer = null;

    const eyebrow = options.eyebrow || 'Studio Catalog · Edition 04';
    const heading = options.heading || 'Selected Objects';

    mountEl.innerHTML = `
      <div class="section-header-row">
        <div>
          <span class="mono-label">${escapeHtml(eyebrow)}</span>
          <h2 class="section-title">${escapeHtml(heading)}</h2>
        </div>
        <span class="mono-label" data-role="catalog-count">Loading objects…</span>
      </div>

      <div class="filter-toolbar">
        <div class="category-tabs" data-role="category-tabs" role="tablist" aria-label="Filter by category">
          ${knownCategories
            .map(
              (cat) => `
            <button
              type="button"
              class="filter-tab ${cat.toLowerCase() === activeCategory.toLowerCase() ? 'is-active' : ''}"
              data-category="${cat}"
            >
              ${cat === 'All' ? 'All Objects' : cat}
            </button>
          `
            )
            .join('')}
        </div>

        <div class="toolbar-controls">
          <label class="search-box">
            <span class="search-icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              data-role="catalog-search"
              placeholder="Search objects or SKU…"
              aria-label="Search products"
              value="${escapeHtml(searchQuery)}"
            />
          </label>
          <select data-role="catalog-sort" class="sort-select" aria-label="Sort products">
            <option value="featured" ${sortMode === 'featured' ? 'selected' : ''}>Sort: Curated</option>
            <option value="price_asc" ${sortMode === 'price_asc' ? 'selected' : ''}>Price: Low to High</option>
            <option value="price_desc" ${sortMode === 'price_desc' ? 'selected' : ''}>Price: High to Low</option>
            <option value="newest" ${sortMode === 'newest' ? 'selected' : ''}>Newest Release</option>
          </select>
        </div>
      </div>

      <div class="product-grid" data-role="product-grid"></div>
    `;

    const gridEl = mountEl.querySelector('[data-role="product-grid"]');
    const countLabelEl = mountEl.querySelector('[data-role="catalog-count"]');
    const tabsEl = mountEl.querySelector('[data-role="category-tabs"]');
    const searchInput = mountEl.querySelector('[data-role="catalog-search"]');
    const sortSelect = mountEl.querySelector('[data-role="catalog-sort"]');

    function syncCategoryTabs() {
      tabsEl.querySelectorAll('.filter-tab').forEach((tab) => {
        tab.classList.toggle(
          'is-active',
          tab.dataset.category.toLowerCase() === activeCategory.toLowerCase()
        );
      });
    }

    function renderProducts(products) {
      loadedProducts = products;
      countLabelEl.textContent = `${products.length} ${products.length === 1 ? 'Object' : 'Objects'}`;

      if (products.length === 0) {
        gridEl.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <h3>No matching objects</h3>
            <p>Try clearing your search or switching back to all categories.</p>
            <button type="button" class="btn btn-secondary btn-sm" data-role="reset-filters">
              Reset Catalog Filters
            </button>
          </div>
        `;
        const resetBtn = gridEl.querySelector('[data-role="reset-filters"]');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            activeCategory = 'All';
            searchQuery = '';
            sortMode = 'featured';
            searchInput.value = '';
            sortSelect.value = 'featured';
            syncCategoryTabs();
            fetchAndRender();
          });
        }
        return;
      }

      gridEl.innerHTML = products
        .map(
          (p) => `
        <article class="product-card" data-product-id="${p.id}">
          <a href="/product.html?slug=${encodeURIComponent(p.slug)}" class="product-media">
            ${getBadgeHtml(p)}
            <img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy" />
          </a>
          <div class="product-meta-row">
            <span class="mono-label">${escapeHtml(p.category)}</span>
            <span class="mono-label">${escapeHtml(p.sku)}</span>
          </div>
          <h3 class="product-title">
            <a href="/product.html?slug=${encodeURIComponent(p.slug)}">${escapeHtml(p.name)}</a>
          </h3>
          <p class="product-tagline">${escapeHtml(p.tagline)}</p>
          <div class="product-footer-row">
            <div class="product-price-group">
              <span class="product-price">${formatINR(p.price)}</span>
              ${
                p.compare_at_price && p.compare_at_price > p.price
                  ? `<span class="product-compare">${formatINR(p.compare_at_price)}</span>`
                  : ''
              }
            </div>
            <button
              type="button"
              class="quick-add-btn"
              data-quick-add="${p.id}"
              ${p.stock === 0 ? 'disabled' : ''}
            >
              ${p.stock === 0 ? 'Sold Out' : '+ Add'}
            </button>
          </div>
        </article>
      `
        )
        .join('');

      gridEl.querySelectorAll('button[data-quick-add]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const pid = Number(btn.dataset.quickAdd);
          const product = loadedProducts.find((item) => item.id === pid);
          if (!product) return;

          btn.disabled = true;
          try {
            await addToCart(product, product.variants[0], 1);
            btn.textContent = 'Added ✓';
            btn.classList.add('is-added');
            showToast(`Added ${product.name} to bag`);
            setTimeout(() => {
              btn.textContent = '+ Add';
              btn.classList.remove('is-added');
              btn.disabled = product.stock === 0;
            }, 1200);
          } catch (err) {
            showToast(err.message);
            btn.disabled = false;
          }
        });
      });
    }

    function renderCategoryTabs(categoriesMeta) {
      if (Array.isArray(categoriesMeta) && categoriesMeta.length > 0) {
        knownCategories = ['All', ...categoriesMeta.map((c) => c.category)];
        const countsMap = new Map(categoriesMeta.map((c) => [c.category, c.count]));
        tabsEl.innerHTML = knownCategories
          .map((cat) => {
            const label = cat === 'All' ? 'All Objects' : `${escapeHtml(cat)} (${countsMap.get(cat) || 0})`;
            return `
              <button
                type="button"
                class="filter-tab ${cat.toLowerCase() === activeCategory.toLowerCase() ? 'is-active' : ''}"
                data-category="${escapeHtml(cat)}"
              >
                ${label}
              </button>
            `;
          })
          .join('');
      }
    }

    async function fetchAndRender() {
      const query = new URLSearchParams();
      if (activeCategory && activeCategory !== 'All') query.set('category', activeCategory);
      if (searchQuery.trim()) query.set('q', searchQuery.trim());
      if (sortMode) query.set('sort', sortMode);

      try {
        const data = await api(`/api/products?${query.toString()}`);
        renderCategoryTabs(data.categories);
        renderProducts(data.products);
      } catch (err) {
        gridEl.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <h3>Unable to load objects</h3>
            <p>${escapeHtml(err.message)}</p>
          </div>
        `;
      }
    }

    tabsEl.addEventListener('click', (e) => {
      const tab = e.target.closest('.filter-tab');
      if (!tab) return;
      activeCategory = tab.dataset.category;
      syncCategoryTabs();
      fetchAndRender();
      if (typeof options.onCategoryChange === 'function') {
        options.onCategoryChange(activeCategory);
      }
    });

    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchAndRender, 180);
    });

    sortSelect.addEventListener('change', () => {
      sortMode = sortSelect.value;
      fetchAndRender();
    });

    fetchAndRender();

    return {
      setCategory(category) {
        activeCategory = category || 'All';
        syncCategoryTabs();
        fetchAndRender();
      },
      reload: fetchAndRender,
    };
  }

  window.KoboCatalog = {
    mountCatalog,
  };
})();
