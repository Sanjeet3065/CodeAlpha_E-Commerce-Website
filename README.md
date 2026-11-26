# KŌBŌ — Objects for Considered Living

A full-stack e-commerce storefront built with **HTML, CSS, JavaScript**, **Express.js**, and persistent **SQLite (`node:sqlite`)** storage for products, users, shopping carts, and orders.

## Tech Stack

- **Frontend:** Vanilla HTML5, CSS3 (editorial design tokens, CSS Grid/Flexbox, responsive drawer & multi-page views), Vanilla JavaScript (`fetch` API, client state store + guest bag sync).
- **Backend:** Node.js + Express.js (`express@5`).
- **Database:** Built-in SQLite (`node:sqlite`) stored at `database/store.db` with foreign keys, transactional order creation, and `scrypt` salted password hashing + HTTP-only session cookies.

## Features Implemented

- **Product Listings (`/`)**: Dynamic category filter tabs across **8 categories** (`Clothes`, `Winter Wear`, `Electronics`, `Ceramics`, `Deskware`, `Lighting`, `Carry`, `Home & Living` — 32 curated products), live search by name/material/SKU, price & release sorting, and instant `+ Add` actions.
- **Product Details (`/product.html?slug=...`)**: Multi-image studio gallery, live stock status, finish variant selector, quantity stepper, technical specification table, and paired objects.
- **Shopping Cart (Slide-over Drawer + `/cart.html`)**: Free-shipping threshold tracker (`₹5,000`), live quantity updates, item removal, and automatic guest-bag to SQLite sync on sign-in.
- **User Registration & Login (`/auth.html`)**: Tabbed Sign In & Registration forms, salted password hashing, HTTP-only session cookies, and 1-click demo credentials (`demo@kobo-studio.in` / `Demo@1234`).
- **Order Processing (`/checkout.html`)**: Pre-filled shipping form, payment method selection (`UPI`, `Card`, `Cash on Delivery`), server-validated promo codes (`KOBO10` for 10% off, `ATELIER15` for 15% off), atomic stock decrement + order creation, and printable Order Confirmation Receipt.
- **Account & Order History (`/account.html`)**: Profile updates and full itemized history of past orders stored in SQLite.

## Running Locally

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Running Tests

```bash
npm test
```
