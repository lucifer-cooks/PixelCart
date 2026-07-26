const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'dummy_secret_key');

// @desc    Create Stripe Payment Intent
// @route   POST /api/checkout/create-intent
// @access  Private
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      res.status(400);
      return next(new Error('Your cart is empty'));
    }

    // Calculate total
    let subtotal = 0;
    cart.items.forEach(item => {
      if (!item.saveForLater && item.product) {
        subtotal += item.product.price * item.quantity;
      }
    });

    if (subtotal === 0) {
      res.status(400);
      return next(new Error('No active items to checkout'));
    }

    const shippingFee = subtotal > 150 ? 0 : 15; // Free shipping over $150
    const total = subtotal + shippingFee;

    // Standard Stripe amounts are in cents
    const amountInCents = Math.round(total * 100);

    let clientSecret = 'simulated_secret_' + Math.random().toString(36).substring(7);

    // Try creating Stripe PaymentIntent
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'dummy_secret_key') {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: 'usd',
          metadata: { userId: req.user.id.toString() }
        });
        clientSecret = paymentIntent.client_secret;
      } catch (stripeError) {
        console.warn('Stripe SDK error, falling back to simulated checkout:', stripeError.message);
      }
    } else {
      console.log('No Stripe Secret Key found, using simulated secret.');
    }

    res.status(200).json({
      success: true,
      clientSecret,
      subtotal,
      shippingFee,
      total,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'dummy_publishable_key'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new order on checkout confirmation
// @route   POST /api/checkout/confirm
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, billingAddress, paymentIntentId, paymentStatus } = req.body;
    
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      res.status(400);
      return next(new Error('Cart is empty, cannot place order'));
    }

    const orderItems = [];
    let subtotal = 0;

    // Filter items and verify stock
    for (const item of cart.items) {
      if (!item.saveForLater) {
        if (!item.product) {
          res.status(400);
          return next(new Error('Some products in your cart no longer exist'));
        }
        if (item.product.stock < item.quantity) {
          res.status(400);
          return next(new Error(`Not enough stock for ${item.product.title}`));
        }

        orderItems.push({
          product: item.product._id,
          title: item.product.title,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.images[0] || 'default-keyboard.jpg'
        });

        subtotal += item.product.price * item.quantity;
      }
    }

    if (orderItems.length === 0) {
      res.status(400);
      return next(new Error('No active items to checkout'));
    }

    const shippingFee = subtotal > 150 ? 0 : 15;
    const total = subtotal + shippingFee;

    // Create Order
    const order = new Order({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      billingAddress,
      paymentIntentId: paymentIntentId || 'simulated_payment_' + Date.now(),
      paymentStatus: paymentStatus || 'paid',
      subtotal,
      shippingFee,
      total
    });

    await order.save();

    // Deduct Stock
    for (const item of cart.items) {
      if (!item.saveForLater) {
        await Product.findByIdAndUpdate(item.product._id, {
          $inc: { stock: -item.quantity }
        });
      }
    }

    // Keep saveForLater items in cart, remove others
    cart.items = cart.items.filter(item => item.saveForLater);
    await cart.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders
// @access  Private
exports.getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort('-createdAt');
    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }

    // Allow user who placed the order or admin to view it
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Not authorized to view this order'));
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};
