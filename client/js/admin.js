document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || user.role !== 'admin') {
    showToast('Administrator privileges required.', 'error');
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
    return;
  }

  // Load Categories list for the modal dropdown
  loadCategoriesDropdown();

  // Load initial tab data (stats)
  loadStats();
});

const switchAdminTab = (tabId, element) => {
  document.querySelectorAll('.admin-nav-item').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.admin-tab-panel').forEach(panel => panel.classList.remove('active'));

  element.classList.add('active');
  document.getElementById(`admin-tab-${tabId}`).classList.add('active');

  // Trigger content loading
  if (tabId === 'stats') loadStats();
  if (tabId === 'products') loadProducts();
  if (tabId === 'orders') loadOrders();
  if (tabId === 'users') loadUsers();
};

const loadStats = async () => {
  try {
    const res = await api.get('/admin/stats');
    if (res.success && res.stats) {
      const stats = res.stats;
      
      document.getElementById('kpi-revenue').textContent = `$${stats.revenue.toFixed(2)}`;
      document.getElementById('kpi-orders').textContent = stats.totalOrders;
      document.getElementById('kpi-users').textContent = stats.totalCustomers;

      // Render stock warning items
      const warningTbody = document.getElementById('stock-warning-tbody');
      if (stats.stockWarnings.length === 0) {
        warningTbody.innerHTML = '<tr><td colspan="3" style="color:var(--text-secondary); text-align:center;">No low stock alerts.</td></tr>';
      } else {
        warningTbody.innerHTML = stats.stockWarnings.map(w => `
          <tr>
            <td>${w.title}</td>
            <td>${w.brand}</td>
            <td style="color:var(--error); font-weight:700;">${w.stock}</td>
          </tr>
        `).join('');
      }

      // Render category breakdown
      const breakList = document.getElementById('category-breakdown-list');
      breakList.innerHTML = stats.categoryBreakdown.map(item => `
        <div style="display:flex; justify-content:space-between; font-size:0.95rem; border-bottom:1px solid rgba(255,255,255,0.02); padding-bottom:0.4rem;">
          <span style="color:var(--text-secondary);">${item.name}</span>
          <span style="font-weight:700; color:var(--accent-cyan);">${item.count} items</span>
        </div>
      `).join('');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

const loadProducts = async () => {
  const tbody = document.getElementById('admin-products-tbody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading custom inventory...</td></tr>';

  try {
    const res = await api.get('/products?limit=100'); // load all for easy editing
    if (res.success) {
      tbody.innerHTML = '';
      res.products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:700;">${p.title}</td>
          <td>${p.brand}</td>
          <td style="color:var(--accent-cyan); font-weight:600;">$${p.price.toFixed(2)}</td>
          <td>${p.stock}</td>
          <td style="text-align: right; display:flex; gap:0.5rem; justify-content:flex-end;">
            <button class="btn btn-secondary" onclick="showEditProductModal('${p._id}')" style="padding:0.4rem 0.75rem; font-size:0.8rem;"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn btn-secondary" onclick="deleteProductDirect('${p._id}')" style="padding:0.4rem 0.75rem; font-size:0.8rem; border-color:var(--error); color:var(--error);"><i class="fas fa-trash-alt"></i> Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

const deleteProductDirect = async (id) => {
  if (confirm('Are you sure you want to delete this custom keyboard configuration?')) {
    try {
      const res = await api.delete(`/admin/products/${id}`);
      if (res.success) {
        showToast('Product configuration removed', 'success');
        loadProducts();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};

const loadCategoriesDropdown = async () => {
  const select = document.getElementById('prod-category');
  if (!select) return;

  try {
    const res = await api.get('/products/categories');
    if (res.success) {
      select.innerHTML = res.categories.map(c => `
        <option value="${c._id}">${c.name}</option>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load categories', err.message);
  }
};

const showAddProductModal = () => {
  document.getElementById('modal-title').textContent = 'Add Custom Keyboard';
  document.getElementById('product-form').reset();
  document.getElementById('edit-prod-id').value = '';
  document.getElementById('product-modal').style.display = 'flex';
};

const showEditProductModal = async (id) => {
  document.getElementById('modal-title').textContent = 'Edit Custom Keyboard';
  document.getElementById('product-form').reset();
  document.getElementById('edit-prod-id').value = id;

  try {
    const res = await api.get(`/products/${id}`);
    if (res.success && res.product) {
      const p = res.product;
      document.getElementById('prod-title').value = p.title;
      document.getElementById('prod-brand').value = p.brand;
      document.getElementById('prod-price').value = p.price;
      document.getElementById('prod-stock').value = p.stock;
      document.getElementById('prod-category').value = p.category._id || p.category;
      document.getElementById('prod-desc').value = p.description;

      const specs = p.specifications || {};
      document.getElementById('prod-layout').value = specs.layout || '';
      document.getElementById('prod-switches').value = specs.switchType || '';
      document.getElementById('prod-keycaps').value = specs.keycaps || '';
      document.getElementById('prod-connectivity').value = specs.connectivity || '';

      document.getElementById('product-modal').style.display = 'flex';
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

const closeProductModal = () => {
  document.getElementById('product-modal').style.display = 'none';
};

// Form submit handler for Add / Edit
document.getElementById('product-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('edit-prod-id').value;
  const formData = new FormData();
  
  formData.append('title', document.getElementById('prod-title').value.trim());
  formData.append('brand', document.getElementById('prod-brand').value.trim());
  formData.append('price', document.getElementById('prod-price').value);
  formData.append('stock', document.getElementById('prod-stock').value);
  formData.append('category', document.getElementById('prod-category').value);
  formData.append('description', document.getElementById('prod-desc').value.trim());

  // Specifications
  formData.append('layout', document.getElementById('prod-layout').value.trim());
  formData.append('switchType', document.getElementById('prod-switches').value.trim());
  formData.append('keycaps', document.getElementById('prod-keycaps').value.trim());
  formData.append('connectivity', document.getElementById('prod-connectivity').value.trim());

  // Files
  const fileInput = document.getElementById('prod-images');
  if (fileInput.files.length > 0) {
    for (let i = 0; i < fileInput.files.length; i++) {
      formData.append('images', fileInput.files[i]);
    }
  }

  try {
    let res;
    if (id) {
      // Edit mode
      res = await api.uploadPut(`/admin/products/${id}`, formData);
    } else {
      // Add mode
      res = await api.upload(`/admin/products`, formData);
    }

    if (res.success) {
      showToast(id ? 'Configuration updated' : 'Product created!', 'success');
      closeProductModal();
      loadProducts();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
});

const loadOrders = async () => {
  const tbody = document.getElementById('admin-orders-tbody');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Loading orders logs...</td></tr>';

  try {
    const res = await api.get('/admin/orders');
    if (res.success) {
      tbody.innerHTML = '';
      res.orders.forEach(o => {
        const dateStr = new Date(o.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        const statusOptions = ['processing', 'shipped', 'delivered', 'cancelled'];
        const selectMarkup = `
          <select class="form-control" style="padding:0.25rem 0.5rem; font-size:0.85rem; width:130px; background:var(--bg-tertiary);" onchange="updateOrderStatus('${o._id}', this)">
            ${statusOptions.map(opt => `
              <option value="${opt}" ${o.orderStatus === opt ? 'selected' : ''}>${opt.toUpperCase()}</option>
            `).join('')}
          </select>
        `;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:700;">#${o._id.substring(0, 8).toUpperCase()}</td>
          <td>${o.user ? o.user.name : 'Unknown User'}</td>
          <td>${dateStr}</td>
          <td style="color:var(--accent-cyan); font-weight:700;">$${o.total.toFixed(2)}</td>
          <td><span style="color:var(--success); font-weight:600;">${o.paymentStatus.toUpperCase()}</span></td>
          <td>${selectMarkup}</td>
          <td style="text-align:right;"><a href="/orders/${o._id}" class="btn btn-secondary" style="padding:0.25rem 0.75rem; font-size:0.8rem;">Invoice</a></td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

const updateOrderStatus = async (id, element) => {
  try {
    const res = await api.put(`/admin/orders/${id}/status`, { orderStatus: element.value });
    if (res.success) {
      showToast('Order status updated successfully', 'success');
      loadOrders();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

const loadUsers = async () => {
  const tbody = document.getElementById('admin-users-tbody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading customer profiles...</td></tr>';

  try {
    const res = await api.get('/admin/users');
    if (res.success) {
      tbody.innerHTML = '';
      res.users.forEach(u => {
        const dateStr = new Date(u.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        const banBtnMarkup = u.role === 'admin' ? '' : `
          <button class="btn btn-secondary" onclick="toggleBanStatus('${u._id}', ${u.isBanned})" style="padding:0.25rem 0.75rem; font-size:0.8rem; border-color:${u.isBanned ? 'var(--success)' : 'var(--error)'}; color:${u.isBanned ? 'var(--success)' : 'var(--error)'};">
            ${u.isBanned ? 'Unban Account' : 'Ban Account'}
          </button>
        `;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:700;">${u.name}</td>
          <td>${u.email}</td>
          <td><span class="order-status-badge ${u.role === 'admin' ? 'shipped' : 'processing'}">${u.role.toUpperCase()}</span></td>
          <td>${dateStr}</td>
          <td style="text-align:right;">${banBtnMarkup}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

const toggleBanStatus = async (id, isBanned) => {
  const action = isBanned ? 'unban' : 'ban';
  if (confirm(`Are you sure you want to ${action} this customer account?`)) {
    try {
      const res = await api.put(`/admin/users/${id}/ban`);
      if (res.success) {
        showToast(res.message, 'success');
        loadUsers();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};

window.switchAdminTab = switchAdminTab;
window.showAddProductModal = showAddProductModal;
window.showEditProductModal = showEditProductModal;
window.closeProductModal = closeProductModal;
window.deleteProductDirect = deleteProductDirect;
window.updateOrderStatus = updateOrderStatus;
window.toggleBanStatus = toggleBanStatus;
