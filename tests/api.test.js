const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');

function startTestServer() {
  const { app, db } = createApp({ dbPath: ':memory:' });
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({
        server,
        db,
        baseUrl: `http://127.0.0.1:${addr.port}`,
      });
    });
  });
}

function extractCookie(res) {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return '';
  return setCookie.split(';')[0];
}

test('E-commerce API: products, assets, auth, cart sync, and transactional order flow', async (t) => {
  const { server, db, baseUrl } = await startTestServer();
  t.after(() => {
    server.close();
    db.close();
  });

  // 1. Health & seeded products + verify image assets exist on disk
  const healthRes = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthRes.status, 200);

  const productsRes = await fetch(`${baseUrl}/api/products`);
  assert.equal(productsRes.status, 200);
  const productsData = await productsRes.json();
  assert.equal(productsData.products.length, 32);
  assert.equal(productsData.categories.length, 8);

  const publicDir = path.join(__dirname, '..', 'public');
  for (const p of productsData.products) {
    const diskPath = path.join(publicDir, p.image_url.replace(/^\//, ''));
    assert.ok(fs.existsSync(diskPath), `Missing product image: ${diskPath}`);
  }

  // Static pages serve cleanly
  for (const page of ['/', '/product.html', '/cart.html', '/auth.html', '/checkout.html', '/account.html']) {
    const pageRes = await fetch(`${baseUrl}${page}`);
    assert.equal(pageRes.status, 200, `Expected 200 for ${page}`);
  }

  // Filter & search across new categories
  const filteredRes = await fetch(`${baseUrl}/api/products?category=Lighting&sort=price_asc`);
  const filteredData = await filteredRes.json();
  assert.equal(filteredData.products.length, 4);
  assert.ok(filteredData.products[0].price <= filteredData.products[1].price);

  for (const cat of ['Clothes', 'Winter Wear', 'Electronics', 'Home & Living']) {
    const catRes = await fetch(`${baseUrl}/api/products?category=${encodeURIComponent(cat)}`);
    const catData = await catRes.json();
    assert.equal(catData.products.length, 4, `Expected 4 products in ${cat}`);
  }

  const searchRes = await fetch(`${baseUrl}/api/products?q=brass`);
  const searchData = await searchRes.json();
  assert.ok(searchData.products.some((p) => p.slug === 'vernier-brass-pen'));

  // Product detail by slug
  const detailRes = await fetch(`${baseUrl}/api/products/kuro-pour-over-carafe`);
  assert.equal(detailRes.status, 200);
  const detailData = await detailRes.json();
  assert.equal(detailData.product.sku, 'KB-CR-01');
  assert.equal(detailData.related.length, 3);

  // 2. Auth: Register, duplicate check, profile update
  const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Riya Sharma',
      email: 'riya@example.com',
      password: 'Password123',
      phone: '+91 98111 22334',
    }),
  });
  assert.equal(registerRes.status, 201);
  const cookie = extractCookie(registerRes);
  assert.ok(cookie.startsWith('kobo_session='));

  const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Riya Duplicate',
      email: 'riya@example.com',
      password: 'Password123',
    }),
  });
  assert.equal(dupRes.status, 409);

  // Authenticated visitors hitting `/` or `/auth.html` stay inside `/account.html`
  const authedHomeRes = await fetch(`${baseUrl}/`, {
    headers: { Cookie: cookie },
    redirect: 'manual',
  });
  assert.equal(authedHomeRes.status, 302);
  assert.equal(authedHomeRes.headers.get('location'), '/account.html');

  const authedAuthRes = await fetch(`${baseUrl}/auth.html`, {
    headers: { Cookie: cookie },
    redirect: 'manual',
  });
  assert.equal(authedAuthRes.status, 302);
  assert.equal(authedAuthRes.headers.get('location'), '/account.html');

  const profileRes = await fetch(`${baseUrl}/api/auth/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      name: 'Riya Kapoor',
      phone: '+91 98111 99999',
      default_address: '18 Indiranagar 100ft Rd, Bengaluru',
    }),
  });
  assert.equal(profileRes.status, 200);
  const profileJson = await profileRes.json();
  assert.equal(profileJson.user.name, 'Riya Kapoor');

  // 3. Guest cart sync & SQLite cart updates
  const targetProduct = detailData.product;
  const initialStock = targetProduct.stock;

  const syncRes = await fetch(`${baseUrl}/api/cart/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      items: [{ productId: targetProduct.id, variant: targetProduct.variants[0], quantity: 2 }],
    }),
  });
  assert.equal(syncRes.status, 200);
  const syncData = await syncRes.json();
  assert.equal(syncData.itemCount, 2);
  assert.equal(syncData.subtotal, targetProduct.price * 2);

  // 4. Reject order exceeding stock
  const overStockRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      customerName: 'Riya Kapoor',
      customerEmail: 'riya@example.com',
      customerPhone: '+91 98111 99999',
      shippingAddress: '18 Indiranagar 100ft Rd',
      city: 'Bengaluru',
      postalCode: '560038',
      country: 'India',
      paymentMethod: 'UPI',
      items: [{ productId: targetProduct.id, variant: targetProduct.variants[0], quantity: 999 }],
    }),
  });
  assert.equal(overStockRes.status, 400);

  // 5. Place valid order with promo KOBO10 & verify stock decrement + cart clear
  const orderRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      customerName: 'Riya Kapoor',
      customerEmail: 'riya@example.com',
      customerPhone: '+91 98111 99999',
      shippingAddress: '18 Indiranagar 100ft Rd',
      city: 'Bengaluru',
      postalCode: '560038',
      country: 'India',
      paymentMethod: 'UPI',
      promoCode: 'KOBO10',
    }),
  });
  assert.equal(orderRes.status, 201);
  const orderJson = await orderRes.json();
  assert.ok(orderJson.order.order_number.startsWith('KBO-'));
  assert.equal(orderJson.order.subtotal, targetProduct.price * 2);
  assert.equal(orderJson.order.discount, Math.round(targetProduct.price * 2 * 0.1));
  assert.equal(orderJson.order.items.length, 1);

  const afterProductRes = await fetch(`${baseUrl}/api/products/${targetProduct.slug}`);
  const afterProductData = await afterProductRes.json();
  assert.equal(afterProductData.product.stock, initialStock - 2);

  const emptyCartRes = await fetch(`${baseUrl}/api/cart`, {
    headers: { Cookie: cookie },
  });
  const emptyCartData = await emptyCartRes.json();
  assert.equal(emptyCartData.itemCount, 0);

  const historyRes = await fetch(`${baseUrl}/api/orders`, {
    headers: { Cookie: cookie },
  });
  const historyData = await historyRes.json();
  assert.equal(historyData.orders.length, 1);
  assert.equal(historyData.orders[0].order_number, orderJson.order.order_number);

  // 6. Demo user login & pre-seeded order verification
  const demoLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'demo@kobo-studio.in',
      password: 'Demo@1234',
    }),
  });
  assert.equal(demoLoginRes.status, 200);
  const demoCookie = extractCookie(demoLoginRes);
  const demoOrdersRes = await fetch(`${baseUrl}/api/orders`, {
    headers: { Cookie: demoCookie },
  });
  const demoOrdersData = await demoOrdersRes.json();
  assert.ok(demoOrdersData.orders.length >= 1);
});
