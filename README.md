<div align="center">

# KŌBŌ — Objects for Considered Living

**A full-stack architectural e-commerce storefront built with HTML, CSS, JavaScript, Express.js, and SQLite.**
*CodeAlpha Internship · Task 1: Simple E-Commerce Store*

<p>
  <a href="https://kobo-ecommerce-store.onrender.com" target="_blank">
    <img src="https://img.shields.io/badge/Live_Demo-Visit_Store-9E472A?style=for-the-badge&logo=render&logoColor=white" alt="Live Demo on Render" />
  </a>
  <a href="https://github.com/Sanjeet3065/CodeAlpha_E-Commerce-Website">
    <img src="https://img.shields.io/badge/Node.js-22.5%2B-151412?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js 22.5+" />
  </a>
  <img src="https://img.shields.io/badge/Express.js-5.x-3C3833?style=for-the-badge&logo=express&logoColor=white" alt="Express.js 5" />
  <img src="https://img.shields.io/badge/SQLite-node%3Asqlite-57534A?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/License-MIT-888276?style=for-the-badge" alt="MIT License" />
</p>

🌐 **Live Storefront:** [https://kobo-ecommerce-store.onrender.com](https://kobo-ecommerce-store.onrender.com)

<br />

<img src="public/images/hero-editorial.jpg" alt="KŌBŌ Editorial Storefront Still Life" width="880" />

</div>

---

## Live Demo & Quick Try

- **Live URL:** [https://kobo-ecommerce-store.onrender.com](https://kobo-ecommerce-store.onrender.com)
- **Demo Account:** `demo@kobo-studio.in` / `Demo@1234` *(or click **Fill Demo Credentials** on `/auth.html`, or register your own account)*
- **Promo Codes:** `KOBO10` (`10%` off) · `ATELIER15` (`15%` off)
- **Shipping Rule:** Complimentary insured shipping on orders `>= ₹5,000` (otherwise `₹250` flat rate)

> **Note:** Hosted on Render's free tier — if the server has been idle for 15+ minutes, the very first page load takes ~30–50 seconds to wake up.

---

## Why KŌBŌ

Instead of generic template gradients or static mock JSON arrays, **KŌBŌ** models an authentic end-to-end storefront:

1. **Editorial Storefront (`/`):** Warm archival limestone palette (`#F5F2EB`), serif/sans/mono typographic hierarchy, live category filters with counts, keyword & SKU search, and price/release sorting.
2. **Product Details (`/product.html?slug=...`):** Studio gallery with thumbnail switcher, live stock badge, finish & apparel size variant pills, quantity stepper, technical specification tables, `Add to Bag` + `Buy Now`, and `Paired Objects`.
3. **Persistent Member Workspace (`/account.html`):** Once a user registers or logs in, Express keeps them inside their authenticated 4-tab workspace (**Browse Objects**, **My Bag**, **Order History**, **Profile Details**) rather than bouncing back to the guest landing page.
4. **Seamless Bag Sync (Slide-Over Drawer + `/cart.html`):** Guests can add objects before signing in; upon login or registration, `localStorage` items automatically merge into SQLite (`POST /api/cart/sync`).
5. **Transactional Checkout (`/checkout.html`):** Pre-filled address form, payment options (`UPI`, `Card`, `Cash on Delivery`), server-verified promo discounts, atomic SQLite stock validation/decrement, and a printable **Order Confirmation Receipt** (`KBO-YYMM-XXXX`).

---

## Catalog Overview (`32` Objects · `8` Categories)

| Category | Items | Highlights |
| :--- | :---: | :--- |
| **Clothes** | `4` | Tailored Cotton Poplin Shirt, Selvedge Indigo Denim, Merino Pullover, Brogue Boots |
| **Winter Wear** | `4` | Atelier Wool Coat, Quilted Leather Jacket, Rib Scarf & Beanie, Brushed Alpaca Layer |
| **Electronics** | `4` | Studio Matte Wireless Headphones, Monolith Desk Speakers, 35mm Camera, ET66 Calculator |
| **Ceramics** | `4` | Kuro Pour-Over Carafe, Hasu Tea Vessel Set, Kuro Raku Chawan, Tierra Espresso Duo |
| **Deskware** | `4` | Vernier Solid Brass Pen, Monolith Valet Tray, Fluted Table Igniter, Lay-Flat Journal |
| **Lighting** | `4` | Solis Alabaster Lamp, Kanso Task Lamp, Nori Drafting Lamp, Hana Pedestal Lamp |
| **Carry** | `4` | Field Waxed Canvas Tote, Atelier Leather Folio, Bridle Leather Belt, Saddle Messenger |
| **Home & Living** | `4` | Shiro Ribbed Porcelain Vase, Hinoki Wood-Wick Candle, Studio Clock, Merino Lounge Throw |

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Semantic HTML5, CSS3 (Custom Design Tokens, Grid/Flexbox), Vanilla JavaScript (`fetch` API) |
| **Backend** | Node.js (`>= 22.5`, tested on `v24.19.0`), Express.js (`^5.1.0`) |
| **Database** | Built-in SQLite (`node:sqlite` `DatabaseSync` with WAL mode & foreign keys) |
| **Authentication** | `crypto.scryptSync` salted hashing, `timingSafeEqual`, HMAC-SHA256 `HttpOnly` cookies |
| **Testing** | Node native test runner (`node --test`) |

---

## Project Structure

```text
.
├── server.js                    # Express server entrypoint (binds to process.env.PORT || 3000)
├── package.json                 # Dependencies and npm scripts (start, test)
├── src/
│   ├── app.js                   # Express app factory, static hosting, authenticated redirects
│   ├── db/
│   │   └── database.js          # SQLite schema initialization & idempotent 32-product seed
│   ├── middleware/
│   │   └── auth.js              # Session cookie resolution & requireAuth middleware
│   ├── routes/
│   │   ├── auth.js              # Register, login, logout, current user, profile updates
│   │   ├── cart.js              # SQLite cart CRUD & guest-to-account sync
│   │   ├── orders.js            # Transactional order placement & order history
│   │   └── products.js          # Catalog filtering, search, sorting & product details
│   └── utils/
│       └── security.js          # Scrypt hashing, HMAC tokens, cookie parsing, order IDs
├── public/
│   ├── index.html               # Public editorial storefront
│   ├── product.html             # Product details page
│   ├── cart.html                # Dedicated shopping bag page
│   ├── auth.html                # Split-screen sign in & registration page
│   ├── checkout.html            # Checkout & printable order confirmation receipt
│   ├── account.html             # Authenticated member storefront, orders & profile
│   ├── css/                     # Design tokens (tokens.css) & responsive styles (styles.css)
│   ├── js/                      # Modular vanilla JS controllers & shared store/shell
│   └── images/                  # 34 local editorial & product photography assets
└── tests/
    └── api.test.js              # End-to-end API, asset & SQLite transaction tests
```

---

## SQLite Database Schema

Initialized automatically at `database/store.db` on startup:

| Table | Purpose |
| :--- | :--- |
| **`users`** | Accounts (`id`, `name`, `email`, `password_hash`, `phone`, `default_address`, `created_at`) |
| **`sessions`** | Revocable 7-day sessions (`id`, `user_id`, `token_hash`, `expires_at`, `created_at`) |
| **`products`** | Catalog items (`id`, `slug`, `sku`, `name`, `tagline`, `category`, `price`, `compare_at_price`, `stock`, `image_url`, `gallery_json`, `variants_json`, `specs_json`, `description`, `featured`) |
| **`cart_items`** | Per-user persistent shopping bag (`id`, `user_id`, `product_id`, `variant`, `quantity`) |
| **`orders`** | Order headers, shipping details, payment method, promo, totals, and status |
| **`order_items`** | Immutable line-item price/variant snapshots per order |

---

## REST API Reference

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | No | Service health check |
| `GET` | `/api/products` | No | List/filter/search/sort products (`category`, `q`, `sort`, `featured`) |
| `GET` | `/api/products/:slugOrId` | No | Fetch product details + 3 related objects |
| `POST` | `/api/auth/register` | No | Create account and issue `HttpOnly` session cookie |
| `POST` | `/api/auth/login` | No | Authenticate user and issue session cookie |
| `POST` | `/api/auth/logout` | No | Revoke session and clear cookie |
| `GET` | `/api/auth/me` | Optional | Return currently signed-in user |
| `PATCH` | `/api/auth/profile` | Yes | Update saved name, phone, and default address |
| `GET` | `/api/cart` | Yes | Get user's SQLite shopping bag |
| `POST` | `/api/cart/items` | Yes | Add item or increment quantity (stock-clamped) |
| `PATCH` | `/api/cart/items/:id` | Yes | Update quantity or remove when `<= 0` |
| `DELETE` | `/api/cart/items/:id` | Yes | Remove item from bag |
| `POST` | `/api/cart/sync` | Yes | Merge guest `localStorage` bag into SQLite |
| `GET` | `/api/orders` | Yes | List user's order history with line items |
| `GET` | `/api/orders/:orderRef` | Yes | Fetch a single order by `order_number` or `id` |
| `POST` | `/api/orders` | Yes | Create order atomically, apply promo, decrement stock |

---

## Local Development & Tests

**Prerequisites:** Node.js `>= 22.5.0` (built-in `node:sqlite`)

```bash
git clone https://github.com/Sanjeet3065/CodeAlpha_E-Commerce-Website.git
cd CodeAlpha_E-Commerce-Website
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Run the automated integration test suite:

```bash
npm test
```

---

## Deployment Notes (Render)

| Setting | Value |
| :--- | :--- |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/api/health` |
| **Env: `NODE_VERSION`** | `24` |
| **Env: `SESSION_SECRET`** | Strong random secret string |

---

## License

MIT License · Built by [Sanjeet Chauhan](https://github.com/Sanjeet3065)
