let cartData = null;
let appliedDiscountPercent = 0;

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('user')) {
    showToast('Please log in to view your cart', 'error');
    setTimeout(() => window.location.href = '/login', 1500);
    return;
  }

  // Load applied coupon from session
  const storedDiscount = localStorage.getItem('appliedDiscount');
  if (storedDiscount) {
    appliedDiscountPercent = parseFloat(storedDiscount);
    const codeBox = document.getElementById('coupon-code');
    if (codeBox) codeBox.value = 'CYBER20';
  }

  loadCart();
});

const loadCart = async () => {
  try {
    const res = await api.get('/cart');
    if (res.success && res.cart) {
      cartData = res.cart;
      renderCart();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

const renderCart = () => {
  const activeContainer = document.getElementById('cart-items-container');
  const savedContainer = document.getElementById('saved-items-container');
  
  if (!activeContainer || !savedContainer || !cartData) return;

  const activeItems = cartData.items.filter(item => !item.saveForLater);
  const savedItems = cartData.items.filter(item => item.saveForLater);

  // Active items
  if (activeItems.length === 0) {
    activeContainer.innerHTML = '<p style="color: var(--text-secondary); padding: 2rem 0;">Your cart is empty. <a href="/shop" style="color:var(--accent-cyan); text-decoration:underline;">Browse setups</a></p>';
    document.getElementById('checkout-btn').disabled = true;
  } else {
    document.getElementById('checkout-btn').disabled = false;
    activeContainer.innerHTML = '';
    activeItems.forEach(item => {
      if (!item.product) return;
      const p = item.product;
      const card = document.createElement('div');
      card.className = 'cart-item-card';
      card.innerHTML = `
        <img class="cart-item-img" src="${p.images[0] && p.images[0].startsWith('http') ? p.images[0] : '/images/' + (p.images[0] || 'default-keyboard.jpg')}" alt="${p.title}" onerror="this.src='https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=150&auto=format&fit=crop'">
        <div class="cart-item-details">
          <div class="cart-item-title">${p.title}</div>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${p.brand} | ${p.specifications.layout || 'Custom'}</span>
          <div class="cart-item-price">$${p.price.toFixed(2)}</div>
          <div>
            <button class="save-later-btn" onclick="toggleSaveLater('${p._id}')">Save for Later</button>
          </div>
        </div>
        <div class="cart-actions">
          <div class="qty-selector" style="margin-bottom:0;">
            <button class="qty-btn" onclick="changeCartQty('${p._id}', ${item.quantity - 1})"><i class="fas fa-minus"></i></button>
            <input type="text" class="qty-input" value="${item.quantity}" readonly>
            <button class="qty-btn" onclick="changeCartQty('${p._id}', ${item.quantity + 1})"><i class="fas fa-plus"></i></button>
          </div>
          <button class="cart-delete-btn" onclick="removeFromCart('${p._id}')" aria-label="Delete">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `;
      activeContainer.appendChild(card);
    });
  }

  // Saved Items
  if (savedItems.length === 0) {
    savedContainer.innerHTML = '<p style="color: var(--text-secondary); padding: 1rem 0;">No items saved.</p>';
  } else {
    savedContainer.innerHTML = '';
    savedItems.forEach(item => {
      if (!item.product) return;
      const p = item.product;
      const card = document.createElement('div');
      card.className = 'cart-item-card';
      card.style.opacity = '0.75';
      card.innerHTML = `
        <img class="cart-item-img" src="${p.images[0] && p.images[0].startsWith('http') ? p.images[0] : '/images/' + (p.images[0] || 'default-keyboard.jpg')}" alt="${p.title}" onerror="this.src='https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=150&auto=format&fit=crop'">
        <div class="cart-item-details">
          <div class="cart-item-title">${p.title}</div>
          <div class="cart-item-price">$${p.price.toFixed(2)}</div>
          <div>
            <button class="save-later-btn" onclick="toggleSaveLater('${p._id}')">Move to Active Cart</button>
          </div>
        </div>
        <div class="cart-actions">
          <button class="cart-delete-btn" onclick="removeFromCart('${p._id}')" aria-label="Delete">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `;
      savedContainer.appendChild(card);
    });
  }

  calculateTotals(activeItems);
};

const changeCartQty = async (productId, newQty) => {
  if (newQty < 1) return;
  try {
    const res = await api.post('/cart', { productId, quantity: newQty });
    if (res.success) {
      cartData = res.cart;
      renderCart();
      updateHeaderCounts();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

const removeFromCart = async (productId) => {
  try {
    const res = await api.delete(`/cart/${productId}`);
    if (res.success) {
      cartData = res.cart;
      renderCart();
      showToast('Item removed from cart', 'success');
      updateHeaderCounts();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

const toggleSaveLater = async (productId) => {
  try {
    const res = await api.post(`/cart/save-for-later/${productId}`);
    if (res.success) {
      cartData = res.cart;
      renderCart();
      showToast('Cart configuration updated', 'success');
      updateHeaderCounts();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

const calculateTotals = (activeItems) => {
  let subtotal = 0;
  activeItems.forEach(item => {
    if (item.product) {
      subtotal += item.product.price * item.quantity;
    }
  });

  const shippingFee = subtotal > 150 || subtotal === 0 ? 0 : 15;
  
  let discount = 0;
  const couponRow = document.getElementById('coupon-row');
  if (appliedDiscountPercent > 0) {
    discount = subtotal * (appliedDiscountPercent / 100);
    if (couponRow) {
      couponRow.style.display = 'flex';
      document.getElementById('summary-discount').textContent = `-$${discount.toFixed(2)}`;
    }
  } else if (couponRow) {
    couponRow.style.display = 'none';
  }

  const total = subtotal + shippingFee - discount;

  document.getElementById('summary-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('summary-shipping').textContent = shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`;
  document.getElementById('summary-total').textContent = `$${Math.max(0, total).toFixed(2)}`;
};

const applyCoupon = () => {
  const code = document.getElementById('coupon-code').value.trim().toUpperCase();
  if (code === 'CYBER20') {
    appliedDiscountPercent = 20;
    localStorage.setItem('appliedDiscount', '20');
    showToast('Promo code applied! 20% discount added.', 'success');
    if (cartData) {
      const activeItems = cartData.items.filter(item => !item.saveForLater);
      calculateTotals(activeItems);
    }
  } else {
    appliedDiscountPercent = 0;
    localStorage.removeItem('appliedDiscount');
    showToast('Invalid Coupon Code', 'error');
    if (cartData) {
      const activeItems = cartData.items.filter(item => !item.saveForLater);
      calculateTotals(activeItems);
    }
  }
};

const proceedToCheckout = () => {
  window.location.href = '/checkout';
};

window.changeCartQty = changeCartQty;
window.removeFromCart = removeFromCart;
window.toggleSaveLater = toggleSaveLater;
window.applyCoupon = applyCoupon;
window.proceedToCheckout = proceedToCheckout;
