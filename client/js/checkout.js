let stripeInstance = null;
let stripeElements = null;
let clientSecretKey = '';
let useSimulatedPayment = true;

let subtotalVal = 0;
let shippingFeeVal = 0;
let discountVal = 0;
let totalVal = 0;

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('user')) {
    window.location.href = '/login';
    return;
  }

  // Pre-fill addresses if stored in user profile
  prepopulateAddresses();

  // Load summary and create payment intent
  initCheckout();

  // Bind submit event
  const form = document.getElementById('checkout-form');
  if (form) {
    form.addEventListener('submit', handleCheckoutSubmit);
  }
});

const prepopulateAddresses = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    const ship = user.shippingAddress || {};
    const bill = user.billingAddress || {};

    if (ship.street) document.getElementById('shipping-street').value = ship.street;
    if (ship.city) document.getElementById('shipping-city').value = ship.city;
    if (ship.state) document.getElementById('shipping-state').value = ship.state;
    if (ship.zipCode) document.getElementById('shipping-zip').value = ship.zipCode;
    if (ship.country) document.getElementById('shipping-country').value = ship.country;

    if (bill.street) {
      document.getElementById('same-address-check').checked = false;
      document.getElementById('billing-address-fields').style.display = 'block';
      document.getElementById('billing-street').value = bill.street;
      document.getElementById('billing-city').value = bill.city;
      document.getElementById('billing-state').value = bill.state;
      document.getElementById('billing-zip').value = bill.zipCode;
      document.getElementById('billing-country').value = bill.country;
    }
  }
};

const initCheckout = async () => {
  const itemsList = document.getElementById('summary-items-list');
  if (!itemsList) return;

  try {
    // 1. Get cart items to render summary list
    const cartRes = await api.get('/cart');
    if (cartRes.success && cartRes.cart) {
      const activeItems = cartRes.cart.items.filter(item => !item.saveForLater);
      if (activeItems.length === 0) {
        showToast('Your cart is empty. Redirecting to shop...', 'error');
        setTimeout(() => window.location.href = '/shop', 1500);
        return;
      }

      itemsList.innerHTML = '';
      activeItems.forEach(item => {
        if (!item.product) return;
        const row = document.createElement('div');
        row.className = 'summary-item-row';
        row.innerHTML = `
          <div>
            <div class="summary-item-title">${item.product.title}</div>
            <div class="summary-item-qty-price">$${item.product.price.toFixed(2)} x ${item.quantity}</div>
          </div>
          <span style="font-weight: 700;">$${(item.product.price * item.quantity).toFixed(2)}</span>
        `;
        itemsList.appendChild(row);
      });
    }

    // 2. Initialize Payment Intent
    const intentRes = await api.post('/checkout/create-intent');
    if (intentRes.success) {
      clientSecretKey = intentRes.clientSecret;
      subtotalVal = intentRes.subtotal;
      shippingFeeVal = intentRes.shippingFee;
      
      // Calculate coupon discount
      const storedDiscount = localStorage.getItem('appliedDiscount');
      if (storedDiscount) {
        const percent = parseFloat(storedDiscount);
        discountVal = subtotalVal * (percent / 100);
        document.getElementById('checkout-discount-row').style.display = 'flex';
        document.getElementById('checkout-discount').textContent = `-$${discountVal.toFixed(2)}`;
      }

      totalVal = subtotalVal + shippingFeeVal - discountVal;

      document.getElementById('checkout-subtotal').textContent = `$${subtotalVal.toFixed(2)}`;
      document.getElementById('checkout-shipping').textContent = shippingFeeVal === 0 ? 'FREE' : `$${shippingFeeVal.toFixed(2)}`;
      document.getElementById('checkout-total').textContent = `$${totalVal.toFixed(2)}`;

      // 3. Mount Stripe Elements if secret is real
      if (clientSecretKey && !clientSecretKey.startsWith('simulated_secret_')) {
        useSimulatedPayment = false;
        document.getElementById('stripe-payment-element').style.display = 'block';
        document.getElementById('simulated-payment-element').style.display = 'none';

        stripeInstance = Stripe(intentRes.publishableKey);
        const appearance = { theme: 'night', variables: { colorPrimary: '#66fcf1' } };
        stripeElements = stripeInstance.elements({ clientSecret: clientSecretKey, appearance });
        const paymentElement = stripeElements.create('payment');
        paymentElement.mount('#stripe-payment-element');
      } else {
        useSimulatedPayment = true;
        document.getElementById('stripe-payment-element').style.display = 'none';
        document.getElementById('simulated-payment-element').style.display = 'flex';
      }
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

const toggleBillingAddress = (checkbox) => {
  const fields = document.getElementById('billing-address-fields');
  if (fields) {
    fields.style.display = checkbox.checked ? 'none' : 'block';
    
    // Toggle required fields
    const inputs = fields.querySelectorAll('input');
    inputs.forEach(input => {
      input.required = !checkbox.checked;
    });
  }
};

const handleCheckoutSubmit = async (e) => {
  e.preventDefault();
  
  const submitBtn = document.getElementById('submit-checkout-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Secure Checkout...';

  // Shipping Address
  const shippingAddress = {
    street: document.getElementById('shipping-street').value.trim(),
    city: document.getElementById('shipping-city').value.trim(),
    state: document.getElementById('shipping-state').value.trim(),
    zipCode: document.getElementById('shipping-zip').value.trim(),
    country: document.getElementById('shipping-country').value.trim()
  };

  // Billing Address
  let billingAddress = { ...shippingAddress };
  const sameAddress = document.getElementById('same-address-check').checked;
  if (!sameAddress) {
    billingAddress = {
      street: document.getElementById('billing-street').value.trim(),
      city: document.getElementById('billing-city').value.trim(),
      state: document.getElementById('billing-state').value.trim(),
      zipCode: document.getElementById('billing-zip').value.trim(),
      country: document.getElementById('billing-country').value.trim()
    };
  }

  try {
    if (useSimulatedPayment) {
      // Mock validation check
      const cardNum = document.getElementById('sim-card-num').value.replace(/\s+/g, '');
      const expiry = document.getElementById('sim-card-expiry').value.trim();
      const cvc = document.getElementById('sim-card-cvc').value.trim();

      if (cardNum.length < 15 || expiry.length < 4 || cvc.length < 3) {
        throw new Error('Please enter valid credit card numbers (Stripe Test Mode)');
      }

      // Simulate a small delay for premium UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      const res = await api.post('/checkout/confirm', {
        shippingAddress,
        billingAddress,
        paymentIntentId: 'simulated_intent_' + Math.random().toString(36).substring(7),
        paymentStatus: 'paid'
      });

      if (res.success) {
        showToast('Payment successful! Order confirmed.', 'success');
        localStorage.removeItem('appliedDiscount');
        updateHeaderCounts();
        setTimeout(() => {
          window.location.href = `/orders/${res.order._id}`;
        }, 1500);
      }
    } else {
      // Stripe real flow
      const { error, paymentIntent } = await stripeInstance.confirmPayment({
        elements: stripeElements,
        confirmParams: {
          return_url: `${window.location.origin}/orders`,
        },
        redirect: 'if_required' // handle programmatically
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        const res = await api.post('/checkout/confirm', {
          shippingAddress,
          billingAddress,
          paymentIntentId: paymentIntent.id,
          paymentStatus: 'paid'
        });

        if (res.success) {
          showToast('Transaction completed successfully!', 'success');
          localStorage.removeItem('appliedDiscount');
          updateHeaderCounts();
          setTimeout(() => {
            window.location.href = `/orders/${res.order._id}`;
          }, 1500);
        }
      } else {
        throw new Error('Payment was not completed successfully.');
      }
    }
  } catch (err) {
    showToast(err.message, 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-lock"></i> Pay & Finalize Setup';
  }
};

window.toggleBillingAddress = toggleBillingAddress;
