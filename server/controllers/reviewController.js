const Review = require('../models/Review');
const Product = require('../models/Product');

// @desc    Add a product review
// @route   POST /api/reviews/:productId
// @access  Private
exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment, images } = req.body;
    const productId = req.params.productId;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      return next(new Error('Product not found'));
    }

    // Check if user already reviewed
    const alreadyReviewed = await Review.findOne({
      product: productId,
      user: req.user.id
    });

    if (alreadyReviewed) {
      res.status(400);
      return next(new Error('You have already reviewed this product'));
    }

    const review = new Review({
      user: req.user.id,
      product: productId,
      rating: Number(rating),
      comment,
      images: images || []
    });

    await review.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:reviewId
// @access  Private
exports.updateReview = async (req, res, next) => {
  try {
    const { rating, comment, images } = req.body;
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      res.status(404);
      return next(new Error('Review not found'));
    }

    // Check user ownership
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Not authorized to edit this review'));
    }

    if (rating) review.rating = Number(rating);
    if (comment) review.comment = comment;
    if (images) review.images = images;

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      res.status(404);
      return next(new Error('Review not found'));
    }

    // Check user ownership or admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Not authorized to delete this review'));
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
