# KŌBŌ — Full-Stack E-Commerce Store

**KŌBŌ** (*Objects for Considered Living*) is a full-stack e-commerce web application built for **CodeAlpha Task 1: Simple E-Commerce Store**. It pairs an editorial, architectural storefront in **vanilla HTML, CSS, and JavaScript** with an **Express.js** REST API and a persistent **SQLite (`node:sqlite`)** database.

---

## Key Features

- **Curated Catalog (32 Products · 8 Categories):** Browse **Clothes**, **Winter Wear**, **Electronics**, **Ceramics**, **Deskware**, **Lighting**, **Carry**, and **Home & Living** (`4` objects per category) with live category counts, keyword/SKU search, and sorting (`Curated`, `Price: Low to High`, `Price: High to Low`, `Newest`).
- **Product Details Page (`/product.html`):** Interactive image gallery with thumbnail switching, real-time stock status, finish/size variant pills, quantity stepper, technical specification tables, `Add to Bag` + `Buy Now`, and complementary `Paired Objects`.
- **Shopping Cart (Slide-Over Drawer + `/cart.html`):** Persistent cart across sessions, complimentary insured shipping threshold tracker (`₹5,000`), live quantity steppers, item removal, and automatic guest-bag merge into SQLite on sign-in.
- **User Registration, Login & Persistent Member Workspace (`/auth.html`, `/account.html`):**
  - Salted `crypto.scrypt` password hashing and HMAC-signed `HttpOnly` session cookies stored in SQLite (`7`-day validity).
  - Once signed in, users stay inside the `/account.html` Member Workspace (`Browse Objects`, `My Bag`, `Order History`, `Profile Details`) and do not bounce back to the guest landing homepage until signing out.
- **Transactional Order Processing (`/checkout.html`):**
  - Pre-filled shipping details, payment method selection (`UPI`, `Card`, `Cash on Delivery`), and server-validated promo codes (`KOBO10` for 10% off, `ATELIER15` for 15% off).
  - Atomic SQLite transactions verify stock, compute server-side totals, decrement inventory, clear the bag, and render a printable **Order Confirmation Receipt** (`KBO-YYMM-XXXX`).

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Semantic HTML5, CSS3 (Custom Design Tokens, Grid/Flexbox), Vanilla JavaScript (`fetch` API) |
| **Backend** | Node.js (`>= 22.5`, tested on `v24.19.0`), Express.js (`^5.1.0`) |
| **Database** | Built-in SQLite (`node:sqlite` `DatabaseSync` with WAL mode & foreign keys) |
| **Security** | `crypto.scryptSync` password hashing, `timingSafeEqual`, HMAC-SHA256 `HttpOnly` cookies |
| **Testing** | Node native test runner (`node --test`) |

---

## Project Structure

```text
.
├── server.js                    # Express HTTP server entrypoint (reads process.env.PORT || 3000)
├── package.json                 # Project metadata, scripts (start, test), Express dependency
├── src/
│   ├── app.js                   # Express app factory, static hosting, authenticated redirects
│   ├── db/
│   │   └── database.js          # SQLite schema initialization & idempotent 32-product seed
│   ├── middleware/
│   │   └── auth.js              # Session cookie resolution & requireAuth guard
│   ├── routes/
│   │   ├── auth.js              # Register, login, logout, current user, profile update
│   │   ├── cart.js              # SQLite cart CRUD & guest-to-account sync
│   │   ├── orders.js            # Transactional order placement & order history
│   │   └── products.js          # Catalog filtering, search, sorting & product details
│   └── utils/
│       └── security.js          # Password hashing, session tokens, cookie parser, order IDs
├── public/
│   ├── index.html               # Public editorial storefront
│   ├── product.html             # Product details page
│   ├── cart.html                # Dedicated shopping bag page
│   ├── auth.html                # Split-screen sign in & registration page
│   ├── checkout.html            # Checkout & order confirmation receipt
│   ├── account.html             # Authenticated member storefront, orders & profile
│   ├── css/
│   │   ├── tokens.css           # Color palette, typography & spacing variables
│   │   └── styles.css           # Responsive editorial layout & component styles
│   ├── js/
│   │   ├── store.js             # Client API wrapper, INR formatting & guest cart sync
│   │   ├── ui.js                # Shared header, slide-over cart drawer, footer & toasts
│   │   ├── catalog-view.js      # Reusable category/search/sort product grid
│   │   ├── home.js              # Homepage catalog controller
│   │   ├── product.js           # Product details controller
│   │   ├── cart-page.js         # Dedicated bag view controller
│   │   ├── auth.js              # Login & registration form controller
│   │   ├── checkout.js          # Checkout validation, promo codes & order receipt
│   │   └── account.js           # 4-tab member workspace controller
│   └── images/                  # 34 local editorial & product photography assets
└── tests/
    └── api.test.js              # End-to-end API, asset & database integration tests
```

---

## Database Schema

Stored automatically in `database/store.db` on first startup:

- **`users`** — Registered accounts (`id`, `name`, `email`, `password_hash`, `phone`, `default_address`, `created_at`)
- **`sessions`** — Active revocable login sessions (`id`, `user_id`, `token_hash`, `expires_at`, `created_at`)
- **`products`** — Full product catalog (`id`, `slug`, `sku`, `name`, `tagline`, `category`, `price`, `compare_at_price`, `stock`, `image_url`, `gallery_json`, `variants_json`, `specs_json`, `description`, `featured`)
- **`cart_items`** — Persistent per-user bag items (`id`, `user_id`, `product_id`, `variant`, `quantity`)
- **`orders`** — Placed orders (`id`, `order_number`, `user_id`, `status`, shipping details, `payment_method`, `promo_code`, `subtotal`, `discount`, `shipping_fee`, `total`, `created_at`)
- **`order_items`** — Snapshot line items per order (`id`, `order_id`, `product_id`, `product_name`, `product_slug`, `product_image`, `variant`, `unit_price`, `quantity`, `line_total`)

---

## API Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | No | Server health check |
| `GET` | `/api/products` | No | List/filter/search/sort products (`category`, `q`, `sort`, `featured`) |
| `GET` | `/api/products/:slugOrId` | No | Fetch single product details and 3 related items |
| `POST` | `/api/auth/register` | No | Create account and set session cookie |
| `POST` | `/api/auth/login` | No | Authenticate user and set session cookie |
| `POST` | `/api/auth/logout` | No | Revoke session and clear cookie |
| `GET` | `/api/auth/me` | Optional | Get currently signed-in user |
| `PATCH` | `/api/auth/profile` | Yes | Update saved name, phone, and default address |
| `GET` | `/api/cart` | Yes | Retrieve persistent SQLite shopping bag |
| `POST` | `/api/cart/items` | Yes | Add item or increment quantity (stock-clamped) |
| `PATCH` | `/api/cart/items/:id` | Yes | Update item quantity or remove if `<= 0` |
| `DELETE` | `/api/cart/items/:id` | Yes | Remove item from bag |
| `POST` | `/api/cart/sync` | Yes | Merge guest `localStorage` items into SQLite bag |
| `GET` | `/api/orders` | Yes | List user's placed orders with items |
| `GET` | `/api/orders/:orderRef` | Yes | Retrieve a specific order by number or ID |
| `POST` | `/api/orders` | Yes | Place order atomically, apply promo, decrement stock |

---

## Local Setup & Testing

### Prerequisites
- **Node.js `>= 22.5.0`** (Node `24.x` recommended for `node:sqlite`)

### Run Locally

```bash
git clone https://github.com/Sanjeet3065/CodeAlpha_E-Commerce-Website.git
cd CodeAlpha_E-Commerce-Website
npm install
npm start
```

Visit [http://localhost:3000](http://localhost:3000).

### Run Integration Tests

```bash
npm test
```

### Demo Credentials & Promo Codes
- **Demo Account:** `demo@kobo-studio.in` / `Demo@1234` *(1-click fill available on `/auth.html`)*
- **Promo Codes:** `KOBO10` (`10%` off) · `ATELIER15` (`15%` off)
- **Shipping Policy:** Complimentary insured shipping on orders `>= ₹5,000` (otherwise `₹250` flat fee)

---

## Deploying Live (Render)

1. Push this repository to GitHub (already hosted on `main`).
2. Create a new **Web Service** on [Render](https://render.com) connected to `CodeAlpha_E-Commerce-Website`.
3. Set **Build Command** to `npm install` and **Start Command** to `npm start`.
4. Under **Environment Variables**, add:
   - `NODE_VERSION` = `24`
   - `SESSION_SECRET` = `<your-random-secret-key>`
5. Set optional **Health Check Path** to `/api/health` and click **Deploy Web Service**.

---

## License

MIT License
