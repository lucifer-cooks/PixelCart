document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('user')) {
    window.location.href = '/login';
    return;
  }

  routeOrdersPage();
  
  // Listen for state changes (e.g. back buttons)
  window.addEventListener('popstate', routeOrdersPage);
});

const routeOrdersPage = () => {
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);

  if (segments.length === 2 && segments[1] !== 'confirm') {
    // Path is /orders/:id
    const orderId = segments[1];
    showInvoiceDetail(orderId);
  } else {
    // Path is /orders
    showOrdersList();
  }
};

const showOrdersList = async () => {
  document.getElementById('orders-list-view').style.display = 'block';
  document.getElementById('order-invoice-view').style.display = 'none';

  const container = document.getElementById('orders-list-container');
  if (!container) return;

  container.innerHTML = '<div class="skeleton-card" style="height: 100px;"></div>';

  try {
    const res = await api.get('/orders');
    if (res.success) {
      const orders = res.orders;

      if (orders.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 3rem 0;">You have not placed any orders yet. <a href="/shop" style="color:var(--accent-cyan); text-decoration:underline;">Start shopping</a></p>';
        return;
      }

      container.innerHTML = '';
      orders.forEach(order => {
        const dateStr = new Date(order.createdAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const statusClass = order.orderStatus.toLowerCase();

        const card = document.createElement('div');
        card.className = 'order-summary-card';
        card.innerHTML = `
          <div class="order-meta-info">
            <span class="order-id-label">Order ID: #${order._id.substring(0, 10).toUpperCase()}...</span>
            <span style="color: var(--text-secondary); font-size: 0.9rem;">Placed on: ${dateStr}</span>
            <span style="font-weight: 700; margin-top: 0.25rem;">Total: $${order.total.toFixed(2)}</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.75rem;">
            <span class="order-status-badge ${statusClass}">${order.orderStatus.toUpperCase()}</span>
            <button class="btn btn-secondary" onclick="viewOrderInvoice('${order._id}')" style="padding: 0.4rem 1rem; font-size: 0.85rem;">View Invoice</button>
          </div>
        `;
        container.appendChild(card);
      });
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

const viewOrderInvoice = (id) => {
  window.history.pushState({}, '', `/orders/${id}`);
  showInvoiceDetail(id);
};

const backToOrdersList = () => {
  window.history.pushState({}, '', '/orders');
  showOrdersList();
};

const showInvoiceDetail = async (orderId) => {
  document.getElementById('orders-list-view').style.display = 'none';
  document.getElementById('order-invoice-view').style.display = 'block';

  const card = document.getElementById('invoice-details-card');
  if (!card) return;

  card.innerHTML = '<div class="skeleton-card" style="height: 300px;"></div>';

  try {
    const res = await api.get(`/orders/${orderId}`);
    if (res.success && res.order) {
      const order = res.order;
      const dateStr = new Date(order.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const ship = order.shippingAddress || {};
      const bill = order.billingAddress || {};

      card.innerHTML = `
        <div class="invoice-header">
          <div>
            <h2 style="font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, var(--accent-cyan), var(--accent-pink)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"><i class="fa-solid fa-keyboard"></i> PixelGear</h2>
            <p style="color: var(--text-secondary); margin-top: 0.25rem;">Custom Mechanical Keyboard setups.</p>
          </div>
          <div style="text-align: right;">
            <h3 style="font-size: 1.5rem; font-weight: 700; color: var(--accent-cyan);">INVOICE</h3>
            <p style="color: var(--text-secondary);">Invoice #: INV-${order._id.substring(0, 8).toUpperCase()}</p>
            <p style="color: var(--text-secondary);">Date: ${dateStr}</p>
          </div>
        </div>

        <div class="invoice-grid">
          <div>
            <h4 style="margin-bottom: 0.75rem; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.25rem;">Ship To:</h4>
            <p style="color: var(--text-secondary);">${order.user.name}</p>
            <p style="color: var(--text-secondary);">${ship.street || ''}</p>
            <p style="color: var(--text-secondary);">${ship.city || ''}, ${ship.state || ''} ${ship.zipCode || ''}</p>
            <p style="color: var(--text-secondary);">${ship.country || ''}</p>
          </div>
          <div>
            <h4 style="margin-bottom: 0.75rem; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.25rem;">Bill To:</h4>
            <p style="color: var(--text-secondary);">${order.user.name}</p>
            <p style="color: var(--text-secondary);">${bill.street || ''}</p>
            <p style="color: var(--text-secondary);">${bill.city || ''}, ${bill.state || ''} ${bill.zipCode || ''}</p>
            <p style="color: var(--text-secondary);">${bill.country || ''}</p>
          </div>
        </div>

        <table class="invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>
                  <div style="font-weight:700;">${item.title}</div>
                </td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">$${item.price.toFixed(2)}</td>
                <td style="text-align: right; font-weight: 700;">$${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="invoice-totals">
          <div style="display: flex; justify-content: space-between; width: 250px;">
            <span style="color: var(--text-secondary);">Subtotal:</span>
            <span style="font-weight: 600;">$${order.subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; width: 250px;">
            <span style="color: var(--text-secondary);">Shipping:</span>
            <span style="font-weight: 600;">${order.shippingFee === 0 ? 'FREE' : `$${order.shippingFee.toFixed(2)}`}</span>
          </div>
          ${order.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; width: 250px; color: var(--accent-pink);">
              <span>Discount Applied:</span>
              <span>-$${order.discount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; width: 250px; font-size: 1.25rem; font-weight: 800; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.75rem;">
            <span>Total Paid:</span>
            <span style="color: var(--accent-cyan);">$${order.total.toFixed(2)}</span>
          </div>
        </div>

        <div style="margin-top: 4rem; text-align: center; color: var(--text-muted); font-size: 0.85rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1.5rem;">
          <p>Thank you for choosing PixelGear Co. for your custom typing setup!</p>
          <p style="margin-top: 0.25rem;">Payment status: <span style="color:var(--success); font-weight:700;">${order.paymentStatus.toUpperCase()}</span> | Order status: <span style="color:var(--accent-cyan); font-weight:700;">${order.orderStatus.toUpperCase()}</span></p>
        </div>
      `;
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.viewOrderInvoice = viewOrderInvoice;
window.backToOrdersList = backToOrdersList;
