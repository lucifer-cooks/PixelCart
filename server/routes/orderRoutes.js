const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  createOrder,
  getUserOrders,
  getOrderById,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All checkout and order routes require login

router.post('/checkout/create-intent', createPaymentIntent);
router.post('/checkout/confirm', createOrder);
router.get('/orders', getUserOrders);
router.get('/orders/:id', getOrderById);

module.exports = router;
