const express = require('express');
const router = express.Router();
const {
  getStats,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  updateOrderStatus,
  getUsers,
  banUser,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);
router.use(adminOnly); // Require administrator privileges for all sub-routes

router.get('/stats', getStats);

router.post('/products', upload.array('images', 5), createProduct);
router.put('/products/:id', upload.array('images', 5), updateProduct);
router.delete('/products/:id', deleteProduct);

router.get('/orders', getOrders);
router.put('/orders/:id/status', updateOrderStatus);

router.get('/users', getUsers);
router.put('/users/:id/ban', banUser);

module.exports = router;
