const express = require('express');
const path = require('path');
const router = express.Router();

const getPagePath = (filename) => {
  return path.join(__dirname, '../../client/pages', filename);
};

// Route HTML Pages
router.get('/', (req, res) => res.sendFile(getPagePath('home.html')));
router.get('/shop', (req, res) => res.sendFile(getPagePath('shop.html')));
router.get('/product/:slug', (req, res) => res.sendFile(getPagePath('product.html')));
router.get('/cart', (req, res) => res.sendFile(getPagePath('cart.html')));
router.get('/wishlist', (req, res) => res.sendFile(getPagePath('wishlist.html')));
router.get('/checkout', (req, res) => res.sendFile(getPagePath('checkout.html')));
router.get('/login', (req, res) => res.sendFile(getPagePath('login.html')));
router.get('/register', (req, res) => res.sendFile(getPagePath('register.html')));
router.get('/profile', (req, res) => res.sendFile(getPagePath('profile.html')));
router.get('/orders', (req, res) => res.sendFile(getPagePath('orders.html')));
router.get('/orders/:id', (req, res) => res.sendFile(getPagePath('orders.html')));
router.get('/admin', (req, res) => res.sendFile(getPagePath('admin.html')));

module.exports = router;
