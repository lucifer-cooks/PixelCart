let productData = null;
let selectedQty = 1;
let selectedRating = 0;

document.addEventListener('DOMContentLoaded', () => {
  const pathParts = window.location.pathname.split('/');
  const slug = pathParts[pathParts.length - 1];
  
  if (slug) {
    fetchProductDetails(slug);
  }

  // Setup review submission stars hover/clicks
  initReviewForm();
});

const fetchProductDetails = async (slug) => {
  try {
    const res = await api.get(`/products/${slug}`);
    if (res.success && res.product) {
      productData = res.product;
      renderProductDetails();
      renderSpecifications();
      renderReviews();
      fetchRelatedProducts(productData.category._id);
    }
  } catch (err) {
    showToast(err.message, 'error');
    document.getElementById('product-details-container').innerHTML = `
      <p style="grid-column: 1/-1; text-align: center; color: var(--error); padding: 4rem 0;">
        Failed to load product details: ${err.message}
      </p>
    `;
  }
};

const renderProductDetails = () => {
  const container = document.getElementById('product-details-container');
  if (!container || !productData) return;

  const user = localStorage.getItem('user');
  const inStock = productData.stock > 0;
  const stockText = inStock ? (productData.stock < 5 ? 'Low Stock' : 'In Stock') : 'Out of Stock';
  const stockClass = inStock ? (productData.stock < 5 ? 'low-stock' : 'in-stock') : 'out-of-stock';

  // Format images
  const images = productData.images.length > 0 ? productData.images : ['default-keyboard.jpg'];

  container.innerHTML = `
    <!-- Image Gallery -->
    <div class="gallery-container">
      <div class="main-image-viewport" id="zoom-viewport">
        <img id="main-gallery-image" src="${images[0] && images[0].startsWith('http') ? images[0] : '/images/' + images[0]}" alt="${productData.title}" onerror="this.src='https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=600&auto=format&fit=crop'">
      </div>
      <div class="gallery-thumbnails">
        ${images.map((img, idx) => `
          <img class="thumb-img ${idx === 0 ? 'active' : ''}" src="${img && img.startsWith('http') ? img : '/images/' + img}" alt="Thumbnail" onclick="setMainImage(this, '${img}')" onerror="this.src='https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=150&auto=format&fit=crop'">
        `).join('')}
      </div>
    </div>

    <!-- Product Info Details -->
    <div class="detail-info-col">
      <span class="product-brand">${productData.brand}</span>
      <h1 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem; line-height: 1.2;">${productData.title}</h1>
      
      <div class="product-rating" style="font-size: 1.1rem; margin-bottom: 1.5rem;">
        <i class="fas fa-star"></i>
        <span>${productData.ratingsAverage || '5.0'} (${productData.ratingsCount || '0'} reviews)</span>
      </div>

      <div style="font-size: 2.25rem; font-weight: 800; color: var(--accent-cyan); margin-bottom: 1.5rem;">
        $${productData.price.toFixed(2)}
      </div>

      <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 2rem;">
        ${productData.description}
      </p>

      <div class="stock-status ${stockClass}">
        <i class="fas ${inStock ? 'fa-check-circle' : 'fa-times-circle'}"></i>
        <span>${stockText} (${productData.stock} units)</span>
      </div>

      ${inStock ? `
        <div style="margin-bottom: 1rem; font-weight: 600; color: var(--text-secondary);">Quantity:</div>
        <div class="qty-selector">
          <button class="qty-btn" onclick="updateQty(-1)"><i class="fas fa-minus"></i></button>
          <input type="text" id="qty-box" class="qty-input" value="1" readonly>
          <button class="qty-btn" onclick="updateQty(1)"><i class="fas fa-plus"></i></button>
        </div>

        <div style="display: flex; gap: 1rem;">
          <button class="btn btn-primary" onclick="addToCart()" style="flex: 1;"><i class="fas fa-shopping-cart"></i> Add to Cart</button>
          <button class="btn btn-secondary" onclick="addToWishlist()" style="padding: 0 1.5rem;"><i class="fas fa-heart"></i></button>
        </div>
      ` : `
        <button class="btn btn-secondary" disabled style="width: 100%;"><i class="fas fa-ban"></i> Out of Stock</button>
      `}
    </div>
  `;

  // Setup premium zoom effect
  setupZoomEffect();
};

const setMainImage = (thumb, imgName) => {
  document.querySelectorAll('.thumb-img').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
  
  const mainImg = document.getElementById('main-gallery-image');
  if (mainImg) {
    mainImg.src = imgName && imgName.startsWith('http') ? imgName : `/images/${imgName}`;
  }
};

const setupZoomEffect = () => {
  const viewport = document.getElementById('zoom-viewport');
  const img = document.getElementById('main-gallery-image');
  if (!viewport || !img) return;

  viewport.addEventListener('mousemove', (e) => {
    const { left, top, width, height } = viewport.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    img.style.transformOrigin = `${x}% ${y}%`;
    img.style.transform = 'scale(1.8)';
  });

  viewport.addEventListener('mouseleave', () => {
    img.style.transform = 'scale(1)';
    img.style.transformOrigin = 'center center';
  });
};

const updateQty = (change) => {
  if (!productData) return;
  const newQty = selectedQty + change;
  if (newQty >= 1 && newQty <= productData.stock) {
    selectedQty = newQty;
    document.getElementById('qty-box').value = selectedQty;
  }
};

const addToCart = async () => {
  if (!localStorage.getItem('user')) {
    showToast('Please log in to add items to your cart', 'error');
    setTimeout(() => window.location.href = '/login', 1500);
    return;
  }
  try {
    await api.post('/cart', { productId: productData._id, quantity: selectedQty });
    showToast('Product added to cart!', 'success');
    updateHeaderCounts();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

const addToWishlist = async () => {
  if (!localStorage.getItem('user')) {
    showToast('Please log in to add items to your wishlist', 'error');
    setTimeout(() => window.location.href = '/login', 1500);
    return;
  }
  try {
    await api.post('/cart/wishlist', { productId: productData._id });
    showToast('Product added to wishlist!', 'success');
    updateHeaderCounts();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

const renderSpecifications = () => {
  if (!productData) return;
  const specs = productData.specifications || {};
  
  document.getElementById('spec-layout').textContent = specs.layout || 'N/A';
  document.getElementById('spec-switches').textContent = specs.switchType || 'N/A';
  document.getElementById('spec-hotswap').textContent = specs.hotSwappable ? 'Yes (5-pin hot swap)' : 'No (Soldered)';
  document.getElementById('spec-keycaps').textContent = specs.keycaps || 'N/A';
  document.getElementById('spec-connectivity').textContent = specs.connectivity || 'N/A';
};

const renderReviews = () => {
  if (!productData) return;

  const reviews = productData.reviews || [];
  const listContainer = document.getElementById('reviews-list-container');
  const user = JSON.parse(localStorage.getItem('user'));

  // Update big rating statistics box
  const avg = productData.ratingsAverage || 5.0;
  document.getElementById('rating-avg-big').textContent = avg.toFixed(1);
  document.getElementById('rating-count-big').textContent = `Based on ${productData.ratingsCount || 0} reviews`;
  
  // Big stars
  const starsBig = document.getElementById('rating-stars-big');
  starsBig.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const icon = document.createElement('i');
    icon.className = i <= Math.round(avg) ? 'fas fa-star' : 'far fa-star';
    starsBig.appendChild(icon);
  }

  // Display write a review section if logged in & not already reviewed
  const reviewForm = document.getElementById('add-review-section');
  if (user) {
    const alreadyReviewed = reviews.some(r => r.user._id === user._id || r.user === user._id);
    if (!alreadyReviewed) {
      reviewForm.style.display = 'block';
    } else {
      reviewForm.style.display = 'none';
    }
  } else {
    reviewForm.style.display = 'none';
  }

  if (reviews.length === 0) {
    listContainer.innerHTML = '<p style="color: var(--text-secondary); padding: 1.5rem 0;">No reviews yet. Be the first to review this keyboard!</p>';
    return;
  }

  listContainer.innerHTML = '';
  reviews.forEach(r => {
    const starMarkup = Array(5).fill(0).map((_, i) => `
      <i class="${i < r.rating ? 'fas' : 'far'} fa-star"></i>
    `).join('');

    const dateStr = new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const authorName = r.user ? r.user.name : 'Verified Customer';

    const card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML = `
      <div class="review-card-header">
        <div>
          <div class="review-author">${authorName}</div>
          <div class="review-rating-stars">${starMarkup}</div>
        </div>
        <div class="review-date">${dateStr}</div>
      </div>
      <p style="color: var(--text-secondary); line-height: 1.5;">${r.comment}</p>
    `;
    listContainer.appendChild(card);
  });
};

const initReviewForm = () => {
  const stars = document.querySelectorAll('#star-selector i');
  stars.forEach(star => {
    star.addEventListener('click', (e) => {
      selectedRating = parseInt(e.target.getAttribute('data-rating'), 10);
      stars.forEach((s, idx) => {
        if (idx < selectedRating) {
          s.className = 'fas fa-star active';
        } else {
          s.className = 'far fa-star';
        }
      });
    });
  });

  const form = document.getElementById('review-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (selectedRating === 0) {
        showToast('Please select a star rating', 'error');
        return;
      }

      const comment = document.getElementById('review-comment').value.trim();

      try {
        const res = await api.post(`/reviews/${productData._id}`, {
          rating: selectedRating,
          comment
        });

        if (res.success) {
          showToast('Review submitted successfully!', 'success');
          // Reload details
          fetchProductDetails(productData.slug);
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
};

const fetchRelatedProducts = async (catId) => {
  const container = document.getElementById('related-products-container');
  if (!container) return;

  try {
    const res = await api.get(`/products?category=${catId}&limit=3`);
    if (res.success) {
      // Filter out current product
      const filtered = res.products.filter(p => p._id !== productData._id).slice(0, 3);
      
      if (filtered.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1;">No related setups found.</p>';
        return;
      }

      container.innerHTML = '';
      filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
          <div class="product-img-wrapper" onclick="window.location.href='/product/${p.slug}'" style="cursor:pointer;">
            <img src="${p.images[0] && p.images[0].startsWith('http') ? p.images[0] : '/images/' + (p.images[0] || 'default-keyboard.jpg')}" alt="${p.title}" class="product-img" onerror="this.src='https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=400&auto=format&fit=crop'">
          </div>
          <div class="product-info">
            <span class="product-brand">${p.brand}</span>
            <h3 class="product-title" onclick="window.location.href='/product/${p.slug}'" style="cursor:pointer;">${p.title}</h3>
            <div class="product-price-action">
              <span class="current-price">$${p.price.toFixed(2)}</span>
              <button class="btn-add-cart" onclick="window.location.href='/product/${p.slug}'">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          </div>
        `;
        container.appendChild(card);
      });
    }
  } catch (err) {
    console.error('Failed to load related products:', err.message);
  }
};

window.updateQty = updateQty;
window.addToCart = addToCart;
window.addToWishlist = addToWishlist;
window.setMainImage = setMainImage;
