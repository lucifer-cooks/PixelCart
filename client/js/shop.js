let currentPage = 1;
const itemsPerPage = 6;
let activeCategory = '';
let searchDebounceTimeout = null;

document.addEventListener('DOMContentLoaded', () => {
  // Parse URL query parameter for category
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('category');
  if (catParam) {
    activeCategory = catParam;
    const radio = document.querySelector(`input[name="category"][value="${catParam}"]`);
    if (radio) radio.checked = true;
  }

  // Setup Event Listeners
  initShopListeners();

  // Load Products
  fetchShopProducts();
});

const initShopListeners = () => {
  // Category Radio Buttons
  const categoryContainer = document.getElementById('category-filters');
  if (categoryContainer) {
    categoryContainer.addEventListener('change', (e) => {
      if (e.target.name === 'category') {
        activeCategory = e.target.value;
        currentPage = 1;
        fetchShopProducts();
      }
    });
  }

  // Price Slider
  const priceRange = document.getElementById('price-range');
  const priceVal = document.getElementById('price-val');
  if (priceRange && priceVal) {
    priceRange.addEventListener('input', (e) => {
      priceVal.textContent = `$${e.target.value}`;
    });
    priceRange.addEventListener('change', () => {
      currentPage = 1;
      fetchShopProducts();
    });
  }

  // Sidebar Checkboxes (Layouts, Switch Types, Brands)
  const checkboxes = document.querySelectorAll('.filter-sidebar input[type="checkbox"]');
  checkboxes.forEach(box => {
    box.addEventListener('change', () => {
      currentPage = 1;
      fetchShopProducts();
    });
  });

  // Search input
  const searchInput = document.getElementById('shop-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimeout);
      searchDebounceTimeout = setTimeout(() => {
        currentPage = 1;
        fetchShopProducts();
      }, 400); // 400ms debounce
    });
  }

  // Sorting
  const sortSelect = document.getElementById('shop-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      currentPage = 1;
      fetchShopProducts();
    });
  }

  // Pagination buttons
  const prevBtn = document.getElementById('prev-page-btn');
  const nextBtn = document.getElementById('next-page-btn');
  
  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        fetchShopProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    nextBtn.addEventListener('click', () => {
      currentPage++;
      fetchShopProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
};

const fetchShopProducts = async () => {
  const container = document.getElementById('shop-products-container');
  if (!container) return;

  // Show Skeletons
  container.innerHTML = Array(3).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-price"></div>
    </div>
  `).join('');

  try {
    // Build query params string
    let url = `/products?page=${currentPage}&limit=${itemsPerPage}`;

    if (activeCategory) {
      url += `&category=${activeCategory}`;
    }

    // Price query
    const maxPrice = document.getElementById('price-range').value;
    url += `&price[lte]=${maxPrice}`;

    // Layouts
    const selectedLayouts = Array.from(document.querySelectorAll('#layout-filters input:checked')).map(el => el.value);
    if (selectedLayouts.length > 0) {
      // API expects layout query parameters
      url += `&layout=${selectedLayouts[0]}`; // simple single filter for ease of routing
    }

    // Switches
    const selectedSwitches = Array.from(document.querySelectorAll('#switch-filters input:checked')).map(el => el.value);
    if (selectedSwitches.length > 0) {
      url += `&switchType=${selectedSwitches[0]}`;
    }

    // Brands
    const selectedBrands = Array.from(document.querySelectorAll('#brand-filters input:checked')).map(el => el.value);
    if (selectedBrands.length > 0) {
      url += `&brand=${selectedBrands[0]}`;
    }

    // Search keyword
    const searchVal = document.getElementById('shop-search').value.trim();
    if (searchVal) {
      url += `&search=${encodeURIComponent(searchVal)}`;
    }

    // Sort options
    const sortVal = document.getElementById('shop-sort').value;
    url += `&sort=${sortVal}`;

    const res = await api.get(url);
    if (res.success) {
      renderShopProducts(res.products);
      updatePagination(res.total, res.pagination);
    }
  } catch (err) {
    showToast(err.message, 'error');
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--error);">Error loading products: ${err.message}</p>`;
  }
};

const renderShopProducts = async (products) => {
  const container = document.getElementById('shop-products-container');
  if (products.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 3rem 0; color: var(--text-secondary);">No products match your filters.</p>';
    return;
  }

  // Get active user's wishlist to render heart states correctly
  let wishlistProducts = [];
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const wishRes = await api.get('/cart/wishlist');
      if (wishRes.success && wishRes.wishlist) {
        wishlistProducts = wishRes.wishlist.products.map(p => p._id);
      }
    } catch (err) {
      console.warn('Could not load wishlist status', err);
    }
  }

  container.innerHTML = '';
  products.forEach(p => {
    const isWished = wishlistProducts.includes(p._id);
    const specMarkup = Object.entries(p.specifications || {})
      .filter(([k, v]) => v && v !== 'N/A' && k !== 'hotSwappable')
      .slice(0, 2)
      .map(([k, v]) => `<span class="spec-tag">${v}</span>`)
      .join('');

    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-img-wrapper" onclick="window.location.href='/product/${p.slug}'" style="cursor:pointer;">
        <img src="${p.images[0] && p.images[0].startsWith('http') ? p.images[0] : '/images/' + (p.images[0] || 'default-keyboard.jpg')}" alt="${p.title}" class="product-img" onerror="this.src='https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=400&auto=format&fit=crop'">
      </div>
      <button class="wishlist-toggle ${isWished ? 'active' : ''}" onclick="toggleWishlistDirect('${p._id}', this)" aria-label="Add to wishlist">
        <i class="${isWished ? 'fas' : 'far'} fa-heart"></i>
      </button>
      <div class="product-info">
        <span class="product-brand">${p.brand}</span>
        <h3 class="product-title" onclick="window.location.href='/product/${p.slug}'" style="cursor:pointer;">${p.title}</h3>
        <div class="product-rating">
          <i class="fas fa-star"></i>
          <span>${p.ratingsAverage || '5.0'} (${p.ratingsCount || '0'} reviews)</span>
        </div>
        <div class="product-meta-specs">
          ${specMarkup}
        </div>
        <div class="product-price-action">
          <div class="price-box">
            <span class="current-price">$${p.price.toFixed(2)}</span>
          </div>
          <button class="btn-add-cart" onclick="addToCartDirect('${p._id}')" aria-label="Add to Cart">
            <i class="fas fa-shopping-cart"></i>
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
};

const updatePagination = (total, pagination) => {
  const pageInfo = document.getElementById('page-info');
  const prevBtn = document.getElementById('prev-page-btn');
  const nextBtn = document.getElementById('next-page-btn');

  const maxPages = Math.max(1, Math.ceil(total / itemsPerPage));
  pageInfo.textContent = `Page ${currentPage} of ${maxPages}`;
  
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === maxPages;
};

const toggleWishlistDirect = async (productId, element) => {
  if (!localStorage.getItem('user')) {
    showToast('Please log in to manage your wishlist', 'error');
    setTimeout(() => window.location.href = '/login', 1500);
    return;
  }

  try {
    if (element.classList.contains('active')) {
      // Remove from wishlist
      await api.delete(`/cart/wishlist/${productId}`);
      element.classList.remove('active');
      element.querySelector('i').className = 'far fa-heart';
      showToast('Removed from wishlist', 'success');
    } else {
      // Add to wishlist
      await api.post('/cart/wishlist', { productId });
      element.classList.add('active');
      element.querySelector('i').className = 'fas fa-heart';
      showToast('Added to wishlist!', 'success');
    }
    updateHeaderCounts();
  } catch (err) {
    showToast(err.message, 'error');
  }
};
