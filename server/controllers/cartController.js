const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }
    res.status(200).json({ success: true, cart });
  } catch (error) {
    next(error);
  }
};

// @desc    Add or update item in cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity, 10) || 1;

    // Check product exists & stock
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      return next(new Error('Product not found'));
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (itemIndex > -1) {
      // Item already in cart, update quantity
      cart.items[itemIndex].quantity = qty;
    } else {
      // Add new item
      cart.items.push({ product: productId, quantity: qty, saveForLater: false });
    }

    await cart.save();
    const updatedCart = await Cart.findOne({ user: req.user.id }).populate('items.product');

    res.status(200).json({ success: true, cart: updatedCart });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
exports.removeFromCart = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      res.status(404);
      return next(new Error('Cart not found'));
    }

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    await cart.save();
    const updatedCart = await Cart.findOne({ user: req.user.id }).populate('items.product');

    res.status(200).json({ success: true, cart: updatedCart });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Save For Later status
// @route   POST /api/cart/save-for-later/:productId
// @access  Private
exports.saveForLater = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      res.status(404);
      return next(new Error('Cart not found'));
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex === -1) {
      res.status(404);
      return next(new Error('Product not in cart'));
    }

    cart.items[itemIndex].saveForLater = !cart.items[itemIndex].saveForLater;
    await cart.save();
    const updatedCart = await Cart.findOne({ user: req.user.id }).populate('items.product');

    res.status(200).json({ success: true, cart: updatedCart });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's wishlist
// @route   GET /api/cart/wishlist
// @access  Private
exports.getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id }).populate('products');
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, products: [] });
    }
    res.status(200).json({ success: true, wishlist });
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to wishlist
// @route   POST /api/cart/wishlist
// @access  Private
exports.addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      return next(new Error('Product not found'));
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, products: [] });
    }

    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    res.status(200).json({ success: true, wishlist });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/cart/wishlist/:productId
// @access  Private
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      res.status(404);
      return next(new Error('Wishlist not found'));
    }

    wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
    await wishlist.save();
    const updatedWishlist = await Wishlist.findOne({ user: req.user.id }).populate('products');

    res.status(200).json({ success: true, wishlist: updatedWishlist });
  } catch (error) {
    next(error);
  }
};

// @desc    Move product from wishlist to cart
// @route   POST /api/cart/wishlist/move-to-cart/:productId
// @access  Private
exports.moveToCart = async (req, res, next) => {
  try {
    const productId = req.params.productId;

    // 1. Remove from wishlist
    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
      await wishlist.save();
    }

    // 2. Add to cart
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += 1;
    } else {
      cart.items.push({ product: productId, quantity: 1, saveForLater: false });
    }
    await cart.save();

    const updatedCart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    const updatedWishlist = await Wishlist.findOne({ user: req.user.id }).populate('products');

    res.status(200).json({
      success: true,
      cart: updatedCart,
      wishlist: updatedWishlist
    });
  } catch (error) {
    next(error);
  }
};
