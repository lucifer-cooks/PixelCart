const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  removeFromCart,
  saveForLater,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All cart and wishlist routes require login

router.get('/', getCart);
router.post('/', addToCart);
router.delete('/:productId', removeFromCart);
router.post('/save-for-later/:productId', saveForLater);

router.get('/wishlist', getWishlist);
router.post('/wishlist', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);
router.post('/wishlist/move-to-cart/:productId', moveToCart);

module.exports = router;
