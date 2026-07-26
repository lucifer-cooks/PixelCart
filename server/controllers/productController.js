const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc    Get all products (with search, category, sorting, price range, brand, specifications, pagination)
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    let query;
    let queryCopy = { ...req.query };

    // Fields to exclude from initial filter match
    const removeFields = ['select', 'sort', 'page', 'limit', 'search'];
    removeFields.forEach(param => delete queryCopy[param]);

    // Create query string
    let queryStr = JSON.stringify(queryCopy);

    // Create operators ($gt, $gte, $lt, $lte, $in)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Parse filters
    let filterQuery = JSON.parse(queryStr);

    // Restructure flat query keys like "price[$lte]" into nested objects and cast values
    Object.keys(filterQuery).forEach(key => {
      const match = key.match(/^([a-zA-Z0-9_]+)\[\$(gt|gte|lt|lte)\]$/);
      if (match) {
        const field = match[1];
        const op = `$${match[2]}`;
        let val = filterQuery[key];
        if (field === 'price' || field === 'ratingsAverage' || field === 'stock') {
          val = parseFloat(val) || 0;
        }
        if (!filterQuery[field]) filterQuery[field] = {};
        filterQuery[field][op] = val;
        delete filterQuery[key];
      }
    });

    // Also cast regular nested price queries if they are passed as object
    if (filterQuery.price && typeof filterQuery.price === 'object') {
      for (const op in filterQuery.price) {
        filterQuery.price[op] = parseFloat(filterQuery.price[op]) || 0;
      }
    }
    console.log('filterQuery:', JSON.stringify(filterQuery));

    // Apply Search keyword
    if (req.query.search) {
      filterQuery.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { brand: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Special category slug filter
    if (req.query.category) {
      const categoryDoc = await Category.findOne({ slug: req.query.category });
      if (categoryDoc) {
        filterQuery.category = categoryDoc._id;
      } else {
        // If category provided but not found, return empty results
        return res.status(200).json({
          success: true,
          count: 0,
          pagination: {},
          products: []
        });
      }
    }

    // Nested specs mapping
    if (req.query.layout) {
      filterQuery['specifications.layout'] = req.query.layout;
    }
    if (req.query.switchType) {
      filterQuery['specifications.switchType'] = req.query.switchType;
    }

    // Find resources
    query = Product.find(filterQuery).populate('category', 'name slug');

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt'); // default sort is newest
    }

    // Pagination setup
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Product.countDocuments(filterQuery);

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const products = await query;

    // Pagination info
    const pagination = {};
    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      pagination,
      products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product details
// @route   GET /api/products/:slugOrId
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    let product;
    // Check if the parameter is a valid Mongoose ObjectId or slug
    if (req.params.slugOrId.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(req.params.slugOrId)
        .populate('category', 'name slug')
        .populate({
          path: 'reviews',
          populate: { path: 'user', select: 'name' }
        });
    } else {
      product = await Product.findOne({ slug: req.params.slugOrId })
        .populate('category', 'name slug')
        .populate({
          path: 'reviews',
          populate: { path: 'user', select: 'name' }
        });
    }

    if (!product) {
      res.status(404);
      return next(new Error('Product not found'));
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    next(error);
  }
};
