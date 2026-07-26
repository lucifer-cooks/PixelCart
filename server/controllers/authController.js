const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate token & set cookie
const generateTokenAndResponse = (user, res) => {
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'pixelgearsecretkey',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  res.cookie('token', token, cookieOptions);

  return res.status(200).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      shippingAddress: user.shippingAddress,
      billingAddress: user.billingAddress
    }
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      return next(new Error('User already exists with this email'));
    }

    const user = await User.create({
      name,
      email,
      password
    });

    generateTokenAndResponse(user, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      return next(new Error('Please provide email and password'));
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401);
      return next(new Error('Invalid credentials'));
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      return next(new Error('Invalid credentials'));
    }

    if (user.isBanned) {
      res.status(403);
      return next(new Error('This user account has been banned'));
    }

    generateTokenAndResponse(user, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
exports.logoutUser = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile & addresses
// @route   PUT /api/auth/me
// @access  Private
exports.updateUserProfile = async (req, res, next) => {
  try {
    const { name, email, shippingAddress, billingAddress, password } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (shippingAddress) user.shippingAddress = shippingAddress;
    if (billingAddress) user.billingAddress = billingAddress;
    if (password) user.password = password;

    await user.save();
    
    // Fetch fresh user profile (without password field)
    const updatedUser = await User.findById(user._id);

    res.status(200).json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};
