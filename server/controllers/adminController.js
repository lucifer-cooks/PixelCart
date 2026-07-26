const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Category = require('../models/Category');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res, next) => {
  try {
    // 1. Total revenue
    const revenueData = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
    ]);
    const revenue = revenueData.length > 0 ? Math.round(revenueData[0].totalRevenue * 100) / 100 : 0;

    // 2. Orders count
    const totalOrders = await Order.countDocuments();

    // 3. Customers count
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // 4. Stock warnings (items with stock < 5)
    const stockWarnings = await Product.find({ stock: { $lt: 5 } }).select('title stock brand');

    // 5. Category breakdown
    const categoryBreakdown = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Populate category names for breakdown
    const categories = await Category.find();
    const breakdownWithNames = categoryBreakdown.map(item => {
      const cat = categories.find(c => c._id.toString() === item._id.toString());
      return {
        name: cat ? cat.name : 'Unknown',
        count: item.count
      };
    });

    res.status(200).json({
      success: true,
      stats: {
        revenue,
        totalOrders,
        totalCustomers,
        stockWarnings,
        categoryBreakdown: breakdownWithNames
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product
// @route   POST /api/admin/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    const {
      title,
      description,
      price,
      salePrice,
      category,
      brand,
      stock,
      switchType,
      layout,
      hotSwappable,
      keycaps,
      connectivity
    } = req.body;

    const images = [];
    if (req.files) {
      req.files.forEach(file => {
        images.push(file.filename);
      });
    }

    const specifications = {
      switchType,
      layout,
      hotSwappable: hotSwappable === 'true' || hotSwappable === true,
      keycaps,
      connectivity
    };

    const product = new Product({
      title,
      description,
      price: Number(price),
      salePrice: salePrice ? Number(salePrice) : undefined,
      category,
      brand,
      stock: Number(stock),
      images: images.length > 0 ? images : ['default-keyboard.jpg'],
      specifications
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  try {
    const {
      title,
      description,
      price,
      salePrice,
      category,
      brand,
      stock,
      switchType,
      layout,
      hotSwappable,
      keycaps,
      connectivity
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      return next(new Error('Product not found'));
    }

    const images = [...product.images];
    if (req.files && req.files.length > 0) {
      // Clear default if we upload new ones
      if (images.length === 1 && images[0] === 'default-keyboard.jpg') {
        images.length = 0;
      }
      req.files.forEach(file => {
        images.push(file.filename);
      });
    }

    if (title) product.title = title;
    if (description) product.description = description;
    if (price) product.price = Number(price);
    if (salePrice !== undefined) product.salePrice = salePrice ? Number(salePrice) : undefined;
    if (category) product.category = category;
    if (brand) product.brand = brand;
    if (stock !== undefined) product.stock = Number(stock);
    if (images.length > 0) product.images = images;

    // Update specs
    product.specifications = {
      switchType: switchType !== undefined ? switchType : product.specifications.switchType,
      layout: layout !== undefined ? layout : product.specifications.layout,
      hotSwappable: hotSwappable !== undefined ? (hotSwappable === 'true' || hotSwappable === true) : product.specifications.hotSwappable,
      keycaps: keycaps !== undefined ? keycaps : product.specifications.keycaps,
      connectivity: connectivity !== undefined ? connectivity : product.specifications.connectivity
    };

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      return next(new Error('Product not found'));
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort('-createdAt');
    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }

    order.orderStatus = orderStatus;
    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to ${orderStatus}`,
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort('-createdAt');
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user ban status
// @route   PUT /api/admin/users/:id/ban
// @access  Private/Admin
exports.banUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    if (user.role === 'admin') {
      res.status(400);
      return next(new Error('Cannot ban an administrator'));
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ban status updated. Banned: ${user.isBanned}`,
      user
    });
  } catch (error) {
    next(error);
  }
};
