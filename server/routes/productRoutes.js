const express = require('express');
const router = express.Router();
const { getProducts, getProduct, getCategories } = require('../controllers/productController');

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/:slugOrId', getProduct);

module.exports = router;
