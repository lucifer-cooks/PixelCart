const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a product title'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
    },
    salePrice: {
      type: Number,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please associate a category'],
    },
    brand: {
      type: String,
      required: [true, 'Please specify a brand'],
    },
    stock: {
      type: Number,
      required: [true, 'Please specify stock count'],
      default: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    specifications: {
      switchType: String,
      layout: String,
      hotSwappable: {
        type: Boolean,
        default: true,
      },
      keycaps: String,
      connectivity: String,
    },
    ratingsAverage: {
      type: Number,
      default: 0,
    },
    ratingsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for reviews
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
  justOne: false,
});

productSchema.pre('save', function () {
  this.slug = this.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
});

module.exports = mongoose.model('Product', productSchema);
