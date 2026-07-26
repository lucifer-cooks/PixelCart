# PixelGear - Premium Mechanical Keyboards E-Commerce

A modern, full-stack, responsive e-commerce platform specializing in premium mechanical keyboards, artisan keycaps, switches, and deskmats. Featuring secure authentication, Stripe payment integrations (with simulated fallback), review submittals, dynamic cart/wishlist management, and a complete administrator operations panel.

---

## 🚀 Key Features

* **Visual Excellence**: Curated responsive dark-mode cyber design, subtle glows, micro-interactions, and skeleton loading screens.
* **Interactive Switch Soundboard**: Experience the tactile sounds of Linear, Tactile, and Clicky switches simulated directly with raw Web Audio API.
* **Product Detail Gallery**: Custom high-resolution keyboard gallery view featuring active hover-based image zoom.
* **Simulated & Real Stripe Checkouts**: Live payment elements loading when Stripe secret/publishable keys are supplied, otherwise falls back to a simulated secure test card layout.
* **Printable Invoices**: Export detailed PDF invoices cleanly via standard browser printing layouts.
* **Admin dashboard**: Aggregated KPI stats (gross revenue, customer growth, warnings list), full keyboard product creation (supporting Multer image files), order tracking status modifiers, and account suspension switches.

---

## 🛠 Tech Stack

* **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (Vanilla)
* **Backend**: Node.js, Express.js
* **Database**: MongoDB + Mongoose ODM
* **Security & Auth**: JWT, bcrypt, Helmet, Cookie-Parser
* **Uploads**: Multer image parsing
* **Payment**: Stripe SDK integration

---

## ⚙ Setup & Run Instructions

### 1. Prerequisites
Ensure you have **Node.js** (v16+) and a running **MongoDB** instance (local on `mongodb://localhost:27017` or cloud URI).

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory (one is pre-created with defaults):
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/pixelgear
JWT_SECRET=pixelgearsecretkey
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NODE_ENV=development
```

### 4. Seed Database
Seeding populates the database with categories, keyboard inventory, and preset login credentials:
```bash
npm run seed
```

**Seeded Credentials:**
* **Admin Profile**: `admin@pixelgear.com` / `admin123`
* **Customer Profile**: `customer@pixelgear.com` / `customer123`

### 5. Launch Server
Start the Express server locally:
```bash
# Run with Nodemon in development
npm run dev

# Start in production mode
npm start
```
The application will open on `http://localhost:3000`.

### 6. Run Integration Test Suite
To verify core auth, product searches, cart additions, and simulated order generation:
```bash
npm run test
```
