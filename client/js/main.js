// Global layout scripts: Handles nav state, theme toggles, and toast alerts
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// Toast notification helper
const showToast = (message, type = 'info') => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconClass = 'fa-info-circle';
  if (type === 'success') iconClass = 'fa-check-circle';
  if (type === 'error') iconClass = 'fa-exclamation-circle';
  
  toast.innerHTML = `
    <i class="fas ${iconClass}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
};

window.showToast = showToast; // Expose globally

const initApp = () => {
  // 1. Sync User / Login states in Navbar
  syncUserNavbar();

  // 2. Load and apply saved theme
  initTheme();

  // 3. Sync cart and wishlist counts (if user logged in)
  updateHeaderCounts();
};

const syncUserNavbar = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-dropdown');
  const loginLink = document.getElementById('login-link');

  if (!userMenuBtn) return; // not on pages with header (e.g. login popup/iframe)

  if (user) {
    // Logged in
    loginLink.style.display = 'none';
    userMenuBtn.style.display = 'flex';
    userMenuBtn.innerHTML = `<i class="fas fa-user-circle"></i><span>${user.name.split(' ')[0]}</span>`;

    // Populate dropdown based on role
    const adminLink = document.getElementById('dropdown-admin-link');
    if (adminLink) {
      adminLink.style.display = user.role === 'admin' ? 'flex' : 'none';
    }
  } else {
    // Logged out
    loginLink.style.display = 'block';
    userMenuBtn.style.display = 'none';
  }

  // Toggle profile dropdown
  userMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    userDropdown.classList.remove('show');
  });

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await api.post('/auth/logout');
        localStorage.removeItem('user');
        showToast('Logged out successfully', 'success');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
};

const initTheme = () => {
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('theme') || 'dark';

  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  } else {
    document.body.classList.remove('light-theme');
    if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const isLight = document.body.classList.contains('light-theme');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      themeToggle.innerHTML = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    });
  }
};

const updateHeaderCounts = async () => {
  const user = localStorage.getItem('user');
  if (!user) return;

  try {
    const cartRes = await api.get('/cart');
    if (cartRes.success && cartRes.cart) {
      const activeItems = cartRes.cart.items.filter(item => !item.saveForLater);
      const totalQty = activeItems.reduce((acc, curr) => acc + curr.quantity, 0);
      const cartBadge = document.getElementById('cart-badge');
      if (cartBadge) {
        cartBadge.style.display = totalQty > 0 ? 'flex' : 'none';
        cartBadge.textContent = totalQty;
      }
    }

    const wishlistRes = await api.get('/cart/wishlist');
    if (wishlistRes.success && wishlistRes.wishlist) {
      const wishlistCount = wishlistRes.wishlist.products.length;
      const wishlistBadge = document.getElementById('wishlist-badge');
      if (wishlistBadge) {
        wishlistBadge.style.display = wishlistCount > 0 ? 'flex' : 'none';
        wishlistBadge.textContent = wishlistCount;
      }
    }
  } catch (err) {
    console.error('Failed to sync header badges:', err.message);
  }
};

window.updateHeaderCounts = updateHeaderCounts; // Expose globally
