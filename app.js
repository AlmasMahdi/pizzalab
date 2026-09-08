/**
 * PIZZA LAB - UNIFIED CORE APPLICATION ENGINE
 * Branch: Karor Lal Eason
 * Handles: Storefront, Customizer, Multi-Step Cart Drawer, Live Order Sync & PDF Receipt
 */

// Global State
window.cart = JSON.parse(localStorage.getItem('pizza_lab_cart') || '[]');
window.orderType = localStorage.getItem('pizza_lab_order_type') || 'Delivery';
window.currentCategory = 'All';
window.currentStep = 1;
window.selectedPayment = 'WhatsApp';
window.appliedPromo = JSON.parse(localStorage.getItem('pizza_lab_applied_promo') || 'null');

let activeCustomizingItem = null;
let customSelection = {
  size: null,
  sizePrice: 0,
  crust: 'Normal Crust',
  crustPrice: 0,
  spice: 'Medium',
  addons: []
};

// -----------------------------------------------------------------------------
// UI NOTIFICATIONS & HELPERS
// -----------------------------------------------------------------------------
function showToast(msg) {
  const toast = document.getElementById('toast-notification');
  if (!toast) {
    alert(msg);
    return;
  }
  toast.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

// -----------------------------------------------------------------------------
// MENU RENDERING ENGINE
// -----------------------------------------------------------------------------
function renderMenu() {
  const container = document.getElementById('menu-items-box');
  if (!container) return;

  const menuData = (typeof getLiveMenu === 'function') ? getLiveMenu() : (window.rawBaselineMenu || []);
  container.innerHTML = '';

  const filtered = (window.currentCategory === 'All')
    ? menuData
    : menuData.filter(i => i.category === window.currentCategory);

  if (filtered.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">No formulas found under ${window.currentCategory}.</p>`;
    return;
  }

  filtered.forEach(item => {
    const priceKeys = Object.keys(item.prices || {});
    const firstSize = priceKeys.length > 0 ? priceKeys[0] : 'Standard';
    const startingPrice = item.prices ? item.prices[firstSize] : 0;
    const isAvailable = (typeof item.available === 'undefined') ? true : item.available;

    const card = document.createElement('div');
    card.className = 'menu-card';
    if (!isAvailable) card.style.opacity = '0.5';

    const actionBtn = isAvailable
      ? `<button class="btn-customize-item" onclick="openCustomizer(${item.id})">Customize & Order</button>`
      : `<button class="btn-customize-item" disabled style="background:#334155;cursor:not-allowed;">Sold Out</button>`;

    card.innerHTML = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <span class="menu-card-cat">${item.category}</span>
          ${!isAvailable ? '<span style="background:rgba(239,68,68,0.2);color:#ef4444;font-size:10px;font-weight:800;padding:2px 6px;border-radius:4px;">OUT OF STOCK</span>' : ''}
        </div>
        <h4 class="menu-card-title">${item.name}</h4>
      </div>
      <p class="menu-card-desc">${item.desc}</p>
      <div class="menu-card-bottom">
        <div class="menu-price">From Rs. ${startingPrice}</div>
        ${actionBtn}
      </div>
    `;

    container.appendChild(card);
  });
}

function filterCategory(cat, btn) {
  window.currentCategory = cat;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderMenu();
}

function setView(viewType) {
  const box = document.getElementById('menu-items-box');
  const btnGrid = document.getElementById('btn-grid');
  const btnList = document.getElementById('btn-list');
  if (!box) return;

  if (viewType === 'grid') {
    box.className = 'menu-grid';
    if (btnGrid) btnGrid.classList.add('active');
    if (btnList) btnList.classList.remove('active');
  } else {
    box.className = 'menu-grid list-view';
    if (btnList) btnList.classList.add('active');
    if (btnGrid) btnGrid.classList.remove('active');
  }
}

// -----------------------------------------------------------------------------
// FORMULA CUSTOMIZATION MODAL
// -----------------------------------------------------------------------------
function openCustomizer(itemId) {
  const menuData = (typeof getLiveMenu === 'function') ? getLiveMenu() : (window.rawBaselineMenu || []);
  activeCustomizingItem = menuData.find(i => i.id === Number(itemId));
  if (!activeCustomizingItem) return;

  if (activeCustomizingItem.available === false) {
    showToast("This item is currently out of stock.");
    return;
  }

  const titleElem = document.getElementById('modal-item-name');
  if (titleElem) titleElem.innerText = activeCustomizingItem.name;

  const sizeKeys = Object.keys(activeCustomizingItem.prices || {});
  customSelection.size = sizeKeys[0] || 'Standard';
  customSelection.sizePrice = activeCustomizingItem.prices[customSelection.size] || 0;
  customSelection.crust = 'Normal Crust';
  customSelection.crustPrice = 0;
  customSelection.spice = 'Medium';
  customSelection.addons = [];

  const addonBoxes = document.querySelectorAll('#addons-group input');
  addonBoxes.forEach(b => b.checked = false);

  const sizesContainer = document.getElementById('modal-sizes');
  if (sizesContainer) {
    sizesContainer.innerHTML = sizeKeys.map((size, idx) => `
      <button type="button" class="pill-option ${idx === 0 ? 'active' : ''}" onclick="setSize('${size}', ${activeCustomizingItem.prices[size]}, this)">
        ${size} (Rs. ${activeCustomizingItem.prices[size]})
      </button>
    `).join('');
  }

  const isPizza = activeCustomizingItem.category && activeCustomizingItem.category.includes('Pizza');
  const crustGroup = document.getElementById('crust-group');
  if (crustGroup) crustGroup.style.display = isPizza ? 'block' : 'none';

  updateModalPrice();
  const modal = document.getElementById('customizer-modal');
  if (modal) modal.classList.add('open');
}

function closeCustomizer() {
  const modal = document.getElementById('customizer-modal');
  if (modal) modal.classList.remove('open');
}

function setSize(size, price, btn) {
  customSelection.size = size;
  customSelection.sizePrice = price;
  btn.parentNode.querySelectorAll('.pill-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  updateModalPrice();
}

function setCrust(crust, price, btn) {
  customSelection.crust = crust;
  customSelection.crustPrice = price;
  btn.parentNode.querySelectorAll('.pill-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  updateModalPrice();
}

function setSpice(spice, btn) {
  customSelection.spice = spice;
  btn.parentNode.querySelectorAll('.pill-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function toggleAddon(name, price, checkbox) {
  if (checkbox.checked) {
    customSelection.addons.push({ name, price });
  } else {
    customSelection.addons = customSelection.addons.filter(a => a.name !== name);
  }
  updateModalPrice();
}

function updateModalPrice() {
  const addonsTotal = customSelection.addons.reduce((sum, a) => sum + a.price, 0);
  const total = customSelection.sizePrice + customSelection.crustPrice + addonsTotal;
  const priceElem = document.getElementById('modal-total-price');
  if (priceElem) priceElem.innerText = 'Rs. ' + total;
}

function confirmAddToCart() {
  if (!activeCustomizingItem) return;

  const addonsTotal = customSelection.addons.reduce((sum, a) => sum + a.price, 0);
  const total = customSelection.sizePrice + customSelection.crustPrice + addonsTotal;
  const isPizza = activeCustomizingItem.category && activeCustomizingItem.category.includes('Pizza');

  let variantDetails = customSelection.size;
  if (isPizza) variantDetails += ` | ${customSelection.crust}`;
  variantDetails += ` | ${customSelection.spice}`;
  if (customSelection.addons.length > 0) {
    variantDetails += ' | Extra: ' + customSelection.addons.map(a => a.name).join(', ');
  }

  window.cart.push({
    name: activeCustomizingItem.name,
    variant: variantDetails,
    price: total
  });

  saveCart();
  closeCustomizer();
  showToast(`${activeCustomizingItem.name} added to cart!`);
}

// -----------------------------------------------------------------------------
// CART CALCULATIONS & VOUCHERS
// -----------------------------------------------------------------------------
function calculateCartTotals() {
  const subtotal = window.cart.reduce((acc, c) => acc + c.price, 0);
  let deliveryFee = (window.orderType === 'Delivery' && subtotal > 0) ? 100 : 0;
  let discountAmount = 0;

  if (window.appliedPromo && subtotal >= (window.appliedPromo.minOrder || 0)) {
    if (window.appliedPromo.type === 'percentage') {
      discountAmount = Math.round((subtotal * window.appliedPromo.value) / 100);
    } else if (window.appliedPromo.type === 'flat') {
      discountAmount = Math.min(window.appliedPromo.value, subtotal);
    } else if (window.appliedPromo.type === 'freedelivery') {
      discountAmount = deliveryFee;
      deliveryFee = 0;
    }
  } else if (window.appliedPromo && subtotal < (window.appliedPromo.minOrder || 0)) {
    window.appliedPromo = null;
    localStorage.removeItem('pizza_lab_applied_promo');
  }

  const grandTotal = Math.max(0, subtotal - (window.appliedPromo && window.appliedPromo.type === 'freedelivery' ? 0 : discountAmount) + deliveryFee);
  return { subtotal, deliveryFee, discountAmount, grandTotal };
}

function applyPromoCode() {
  const input = document.getElementById('promo-input');
  if (!input) return;
  const raw = input.value.trim().toUpperCase();

  if (!raw) {
    showToast("Please enter a voucher code.");
    return;
  }

  const subtotal = window.cart.reduce((sum, c) => sum + c.price, 0);
  if (subtotal === 0) {
    showToast("Add items to your tray first.");
    return;
  }

  const promos = (typeof window.DEFAULT_PROMOS !== 'undefined') ? window.DEFAULT_PROMOS : [];
  const match = promos.find(p => p.code === raw && p.active !== false);

  if (!match) {
    showToast("Invalid or expired voucher code.");
    return;
  }

  if (subtotal < (match.minOrder || 0)) {
    showToast(`Order must be at least Rs. ${match.minOrder} to apply this code.`);
    return;
  }

  window.appliedPromo = match;
  localStorage.setItem('pizza_lab_applied_promo', JSON.stringify(match));
  input.value = '';
  updateCartDisplay();
  showToast(`Voucher ${match.code} activated!`);
}

function removePromoCode() {
  window.appliedPromo = null;
  localStorage.removeItem('pizza_lab_applied_promo');
  updateCartDisplay();
  showToast("Voucher removed.");
}

function setOrderType(type) {
  window.orderType = type;
  localStorage.setItem('pizza_lab_order_type', type);

  const btnDel = document.getElementById('btn-delivery');
  const btnTake = document.getElementById('btn-takeaway');
  if (btnDel) btnDel.classList.toggle('active', type === 'Delivery');
  if (btnTake) btnTake.classList.toggle('active', type === 'Takeaway');
  updateCartDisplay();
}

function saveCart() {
  localStorage.setItem('pizza_lab_cart', JSON.stringify(window.cart));
  updateCartDisplay();
}

function removeFromCart(index) {
  window.cart.splice(index, 1);
  saveCart();
}

function updateCartDisplay() {
  const countBadge = document.getElementById('cart-count');
  if (countBadge) countBadge.innerText = window.cart.length;

  const cartBox = document.getElementById('cart-items-container');
  if (!cartBox) return;

  const subtotalDisp = document.getElementById('cart-subtotal');
  const delDisp = document.getElementById('cart-delivery-fee');
  const totalDisp = document.getElementById('cart-total-val');
  const discountRow = document.getElementById('cart-discount-row');
  const discountVal = document.getElementById('cart-discount-val');
  const promoBadge = document.getElementById('promo-applied-badge');

  if (window.cart.length === 0) {
    cartBox.innerHTML = '<p style="color:var(--text-muted);font-size:13px;text-align:center;margin-top:40px;">Your tray is empty.</p>';
    if (subtotalDisp) subtotalDisp.innerText = 'Rs. 0';
    if (delDisp) delDisp.innerText = (window.orderType === 'Delivery') ? 'Rs. 100' : 'Rs. 0';
    if (totalDisp) totalDisp.innerText = 'Rs. 0';
    if (discountRow) discountRow.style.display = 'none';
    if (promoBadge) promoBadge.style.display = 'none';
    return;
  }

  cartBox.innerHTML = '';
  window.cart.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'cart-item-row';
    row.innerHTML = `
      <div style="flex:1;padding-right:8px;">
        <div style="font-weight:700;color:#fff;font-size:13px;">${item.name}</div>
        <div style="font-size:11px;color:var(--text-muted);">${item.variant}</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="color:var(--accent);font-weight:800;font-size:13px;">Rs. ${item.price}</span>
        <button onclick="removeFromCart(${index})" style="background:none;border:none;color:#ef4444;font-size:18px;cursor:pointer;font-weight:bold;">&times;</button>
      </div>
    `;
    cartBox.appendChild(row);
  });

  const totals = calculateCartTotals();
  if (subtotalDisp) subtotalDisp.innerText = 'Rs. ' + totals.subtotal;
  if (delDisp) delDisp.innerText = 'Rs. ' + totals.deliveryFee;
  if (totalDisp) totalDisp.innerText = 'Rs. ' + totals.grandTotal;

  if (window.appliedPromo && discountRow && discountVal) {
    discountRow.style.display = 'flex';
    discountVal.innerText = (window.appliedPromo.type === 'freedelivery') ? 'Free Delivery' : `- Rs. ${totals.discountAmount}`;
  } else if (discountRow) {
    discountRow.style.display = 'none';
  }

  if (window.appliedPromo && promoBadge) {
    promoBadge.style.display = 'flex';
    promoBadge.innerHTML = `<span>🎟️ <strong>${window.appliedPromo.code}</strong> applied</span><span onclick="removePromoCode()" style="cursor:pointer;color:#ef4444;font-weight:800;">✕</span>`;
  } else if (promoBadge) {
    promoBadge.style.display = 'none';
  }
}

// -----------------------------------------------------------------------------
// DRAWERS & BACKDROP CONTROLLERS
// -----------------------------------------------------------------------------
function toggleCart() {
  const ordersDrawer = document.getElementById('orders-drawer');
  if (ordersDrawer) ordersDrawer.classList.remove('open');

  const cartDrawer = document.getElementById('cart-drawer');
  if (cartDrawer) cartDrawer.classList.toggle('open');
  syncBackdrop();
}

function openOrderHistory() {
  const cartDrawer = document.getElementById('cart-drawer');
  if (cartDrawer) cartDrawer.classList.remove('open');

  const ordersDrawer = document.getElementById('orders-drawer');
  if (ordersDrawer) {
    ordersDrawer.classList.add('open');
    fetchCustomerOrderHistory();
  }
  syncBackdrop();
}

function closeOrderHistory() {
  const ordersDrawer = document.getElementById('orders-drawer');
  if (ordersDrawer) ordersDrawer.classList.remove('open');
  syncBackdrop();
}

function closeAllDrawers() {
  const c = document.getElementById('cart-drawer');
  const o = document.getElementById('orders-drawer');
  if (c) c.classList.remove('open');
  if (o) o.classList.remove('open');
  syncBackdrop();
}

function syncBackdrop() {
  const backdrop = document.getElementById('drawer-backdrop');
  const cOpen = document.getElementById('cart-drawer')?.classList.contains('open');
  const oOpen = document.getElementById('orders-drawer')?.classList.contains('open');
  if (backdrop) {
    backdrop.classList.toggle('active', !!(cOpen || oOpen));
  }
}

function toggleMobileNav() {
  const m = document.getElementById('mobile-menu');
  if (m) m.classList.toggle('open');
}

// -----------------------------------------------------------------------------
// GPS AUTODETECTION
// -----------------------------------------------------------------------------
function detectCustomerGPS() {
  const addressInput = document.getElementById('cust-address');
  const gpsHidden = document.getElementById('cust-gps-link');

  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your device browser.");
    return;
  }

  addressInput.value = "Acquiring GPS coordinates...";

  navigator.geolocation.getCurrentPosition(
    position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const mapLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
      if (gpsHidden) gpsHidden.value = mapLink;

      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        .then(r => r.json())
        .then(data => {
          const area = data.display_name ? data.display_name.split(',').slice(0, 3).join(',') : "Karor Lal Eason Area";
          addressInput.value = `${area} [📍 GPS Linked]`;
          saveCustomerData();
          showToast("GPS location pinned successfully!");
        })
        .catch(() => {
          addressInput.value = `Karor Lal Eason (${lat.toFixed(4)}, ${lon.toFixed(4)}) [📍 GPS Linked]`;
          saveCustomerData();
          showToast("GPS coordinates attached!");
        });
    },
    () => {
      addressInput.value = "";
      alert("Location permission was denied. Please enter your street address manually.");
    },
    { enableHighAccuracy: true, timeout: 9000 }
  );
}

// -----------------------------------------------------------------------------
// CHECKOUT PIPELINE (STEPS 1 TO 4)
// -----------------------------------------------------------------------------
function goToStep(step) {
  window.currentStep = step;
  for (let i = 1; i <= 4; i++) {
    const v = document.getElementById('view-step-' + i);
    const n = document.getElementById('node-step-' + i);
    if (v) v.classList.toggle('active', i === step);
    if (n) {
      n.classList.toggle('active', i === step);
      n.classList.toggle('done', i < step);
    }
  }

  const btnPrev = document.getElementById('btn-back-step');
  const btnNext = document.getElementById('btn-next-step');
  const summary = document.getElementById('cart-summary-breakdown');

  if (step === 1) {
    if (btnPrev) btnPrev.style.display = 'none';
    if (btnNext) {
      btnNext.innerText = 'Proceed to Details →';
      btnNext.style.background = 'var(--accent)';
    }
    if (summary) summary.style.display = 'flex';
  } else if (step === 2) {
    if (btnPrev) btnPrev.style.display = 'block';
    if (btnNext) {
      btnNext.innerText = 'Proceed to Payment →';
      btnNext.style.background = 'var(--accent)';
    }
    if (summary) summary.style.display = 'flex';
  } else if (step === 3) {
    if (btnPrev) btnPrev.style.display = 'block';
    if (btnNext) {
      if (window.selectedPayment === 'WhatsApp') {
        btnNext.innerText = '💬 Place via WhatsApp';
        btnNext.style.background = 'var(--whatsapp)';
      } else if (window.selectedPayment === 'PhoneCall') {
        btnNext.innerText = '📞 Place via Phone Call';
        btnNext.style.background = 'var(--accent)';
      } else {
        btnNext.innerText = 'Confirm Order ✔';
        btnNext.style.background = 'var(--accent)';
      }
    }
    if (summary) summary.style.display = 'flex';
  } else if (step === 4) {
    if (btnPrev) btnPrev.style.display = 'none';
    if (btnNext) {
      btnNext.innerText = 'Finish & Close';
      btnNext.style.background = 'var(--accent)';
    }
    if (summary) summary.style.display = 'none';
  }
}

function nextStep() {
  if (window.currentStep === 1) {
    if (window.cart.length === 0) {
      showToast("Add formulas to your tray first!");
      return;
    }

    const currentUser = localStorage.getItem('pizza_lab_current_user');
    if (!currentUser) {
      alert("Please Sign In or continue as Guest to finalize your order.");
      window.location.href = 'login.html';
      return;
    }

    loadCustomerData();
    goToStep(2);
  } else if (window.currentStep === 2) {
    const nameInput = document.getElementById('cust-name');
    const phoneInput = document.getElementById('cust-phone');
    const addressInput = document.getElementById('cust-address');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const address = addressInput ? addressInput.value.trim() : '';

    if (!name) {
      alert("Please enter your full name.");
      nameInput?.focus();
      return;
    }
    if (!phone) {
      alert("Please enter your contact phone number.");
      phoneInput?.focus();
      return;
    }
    if (window.orderType === 'Delivery' && !address) {
      alert("Please provide a delivery street address or click Detect Location.");
      addressInput?.focus();
      return;
    }

    saveCustomerData();
    goToStep(3);
  } else if (window.currentStep === 3) {
    submitOrder();
  } else if (window.currentStep === 4) {
    window.cart = [];
    window.appliedPromo = null;
    localStorage.removeItem('pizza_lab_applied_promo');
    saveCart();
    goToStep(1);
    toggleCart();
  }
}

function prevStep() {
  if (window.currentStep > 1) goToStep(window.currentStep - 1);
}

function selectPaymentMethod(method, card) {
  window.selectedPayment = method;
  document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');

  const btnNext = document.getElementById('btn-next-step');
  if (btnNext) {
    if (method === 'WhatsApp') {
      btnNext.innerText = '💬 Place via WhatsApp';
      btnNext.style.background = 'var(--whatsapp)';
    } else if (method === 'PhoneCall') {
      btnNext.innerText = '📞 Place via Phone Call';
      btnNext.style.background = 'var(--accent)';
    } else {
      btnNext.innerText = 'Confirm Order ✔';
      btnNext.style.background = 'var(--accent)';
    }
  }
}

// -----------------------------------------------------------------------------
// ORDER SUBMISSION & CLOUD PERSISTENCE
// -----------------------------------------------------------------------------
function submitOrder() {
  const nameInput = document.getElementById('cust-name');
  const phoneInput = document.getElementById('cust-phone');
  const addressInput = document.getElementById('cust-address');
  const notesInput = document.getElementById('cust-notes');
  const gpsHidden = document.getElementById('cust-gps-link');

  const name = nameInput ? nameInput.value.trim() : 'Guest Customer';
  const phone = phoneInput ? phoneInput.value.trim() : 'N/A';
  const address = addressInput ? addressInput.value.trim() : (window.orderType === 'Delivery' ? 'Karor Lal Eason' : 'Takeaway / Pick-up');
  const notes = notesInput ? notesInput.value.trim() : '';
  const riderGps = gpsHidden ? gpsHidden.value : '';

  const rawId = 'PL-' + Math.floor(1000 + Math.random() * 9000);
  const orderId = '#' + rawId;

  let tid = '';
  if (window.selectedPayment === 'JazzCash') {
    const el = document.getElementById('jazzcash-tid');
    tid = el ? el.value.trim() : '';
    if (!tid) {
      alert("Please provide your JazzCash Transaction ID (TID).");
      el?.focus();
      return;
    }
  } else if (window.selectedPayment === 'EasyPaisa') {
    const el = document.getElementById('easypaisa-tid');
    tid = el ? el.value.trim() : '';
    if (!tid) {
      alert("Please provide your EasyPaisa Transaction ID (TID).");
      el?.focus();
      return;
    }
  }

  const totals = calculateCartTotals();
  const bConfig = window.BRAND_CONFIG || {
    name: "Pizza Lab",
    whatsappRaw: "923080671101",
    phone: "03080671101",
    city: "Karor Lal Eason"
  };

  if (window.selectedPayment === 'WhatsApp') {
    const itemsText = window.cart.map((c, i) => `${i + 1}. *${c.name}*\n   (${c.variant}) - Rs. ${c.price}`).join('\n\n');
    const receipt = `*NEW ORDER - ${bConfig.name}* (${orderId})\n`
      + `------------------------\n`
      + `*Order Type:* ${window.orderType}\n`
      + `*Customer:* ${name}\n`
      + `*Phone:* ${phone}\n`
      + (window.orderType === 'Delivery' ? `*Address:* ${address}\n` : '')
      + (riderGps ? `*Location Pin:* ${riderGps}\n` : '')
      + (notes ? `*Notes:* ${notes}\n` : '')
      + `------------------------\n`
      + `*Formulas Ordered:*\n${itemsText}\n`
      + `------------------------\n`
      + `*Subtotal:* Rs. ${totals.subtotal}\n`
      + (totals.discountAmount > 0 ? `*Discount:* - Rs. ${totals.discountAmount}\n` : '')
      + `*Delivery Fee:* Rs. ${totals.deliveryFee}\n`
      + `*Grand Total:* *Rs. ${totals.grandTotal}*\n`
      + `------------------------\n`
      + `_Payment Method: WhatsApp Verification_\n`
      + `*Track Live:* https://pizzalab.pk/track.html?id=${encodeURIComponent(rawId)}`;

    window.open(`https://wa.me/${bConfig.whatsappRaw}?text=${encodeURIComponent(receipt)}`, '_blank');
  } else if (window.selectedPayment === 'PhoneCall') {
    window.location.href = `tel:${bConfig.phone}`;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Update In-Page Printable Invoice
  document.getElementById('receipt-order-id').innerText = orderId;
  document.getElementById('r-date').innerText = dateStr;
  document.getElementById('r-name').innerText = name;
  document.getElementById('r-phone').innerText = phone;
  document.getElementById('r-address').innerText = (window.orderType === 'Delivery') ? address : 'Self-Pickup';
  document.getElementById('r-method').innerText = window.selectedPayment;

  const rTidRow = document.getElementById('r-tid-row');
  const rTid = document.getElementById('r-tid');
  if (rTidRow && rTid) {
    if (tid) {
      rTidRow.style.display = 'grid';
      rTid.innerText = tid;
    } else {
      rTidRow.style.display = 'none';
    }
  }

  const receiptTable = document.getElementById('receipt-items-list');
  if (receiptTable) {
    receiptTable.innerHTML = window.cart.map(item => `
      <tr>
        <td>
          <div style="font-weight:700;color:#0f172a;">${item.name}</div>
          <div style="font-size:10px;color:#64748b;">${item.variant}</div>
        </td>
        <td style="text-align:right;font-weight:700;color:#0f172a;">Rs. ${item.price}</td>
      </tr>
    `).join('');
  }

  document.getElementById('r-subtotal').innerText = 'Rs. ' + totals.subtotal;
  document.getElementById('r-delivery').innerText = 'Rs. ' + totals.deliveryFee;
  document.getElementById('r-total').innerText = 'Rs. ' + totals.grandTotal;

  const rDiscRow = document.getElementById('r-discount-row');
  const rDiscVal = document.getElementById('r-discount');
  if (totals.discountAmount > 0 && rDiscRow && rDiscVal) {
    rDiscRow.style.display = 'flex';
    rDiscVal.innerText = `- Rs. ${totals.discountAmount}`;
  } else if (rDiscRow) {
    rDiscRow.style.display = 'none';
  }

  // Active Record
  const orderRecord = {
    orderId,
    cleanId: rawId,
    timestamp: Date.now(),
    dateStr,
    name,
    phone,
    address,
    riderGps,
    selectedPayment: window.selectedPayment,
    subtotal: totals.subtotal,
    deliveryFee: totals.deliveryFee,
    discountAmount: totals.discountAmount,
    promoCode: window.appliedPromo ? window.appliedPromo.code : null,
    grandTotal: totals.grandTotal,
    cart: [...window.cart],
    status: 'Received'
  };

  localStorage.setItem('pizza_lab_last_order', JSON.stringify(orderRecord));

  // Push to Firebase Realtime Database
  if (window.cloudDb) {
    window.cloudDb.ref('orders/' + rawId).set(orderRecord).catch(err => {
      console.warn("Cloud DB order write deferred:", err);
    });
  }

  syncLiveTrackingUI(orderRecord);
  goToStep(4);
}

// -----------------------------------------------------------------------------
// LIVE STATUS SYNCHRONIZATION
// -----------------------------------------------------------------------------
function syncLiveTrackingUI(order) {
  if (!order) return;

  const progressBar = document.getElementById('tracker-bar');
  const etaDisplay = document.getElementById('tracking-eta-time');
  const badge = document.getElementById('tracking-status-badge');

  const s1 = document.getElementById('t-step-1');
  const s2 = document.getElementById('t-step-2');
  const s3 = document.getElementById('t-step-3');
  const s4 = document.getElementById('t-step-4');

  [s1, s2, s3, s4].forEach(s => { if (s) s.className = 'track-step'; });

  const status = order.status || 'Received';

  if (status === 'Received') {
    if (s1) s1.className = 'track-step active';
    if (progressBar) progressBar.style.width = '10%';
    if (etaDisplay) etaDisplay.innerText = '35 - 45 Mins (Kitchen Verified)';
    if (badge) { badge.innerText = '● RECEIVED'; badge.style.color = 'var(--accent)'; }
  } else if (status === 'In Oven') {
    if (s1) s1.className = 'track-step done';
    if (s2) s2.className = 'track-step active';
    if (progressBar) progressBar.style.width = '45%';
    if (etaDisplay) etaDisplay.innerText = '20 - 30 Mins (Baking in Karor Oven)';
    if (badge) { badge.innerText = '🔥 BAKING'; badge.style.color = '#f59e0b'; }
  } else if (status === 'On Way') {
    if (s1) s1.className = 'track-step done';
    if (s2) s2.className = 'track-step done';
    if (s3) s3.className = 'track-step active';
    if (progressBar) progressBar.style.width = '80%';
    if (etaDisplay) etaDisplay.innerText = '10 - 15 Mins (Rider Dispatched)';
    if (badge) { badge.innerText = '🛵 ON THE WAY'; badge.style.color = '#3b82f6'; }
  } else if (status === 'Delivered') {
    [s1, s2, s3, s4].forEach(s => { if (s) s.className = 'track-step done'; });
    if (progressBar) progressBar.style.width = '100%';
    if (etaDisplay) etaDisplay.innerText = 'Delivered! Enjoy your meal 🍕';
    if (badge) { badge.innerText = '✔ COMPLETED'; badge.style.color = 'var(--whatsapp)'; }
  }
}

// -----------------------------------------------------------------------------
// PROFILE & ORDER HISTORY PERSISTENCE
// -----------------------------------------------------------------------------
function saveCustomerData() {
  const name = document.getElementById('cust-name')?.value || '';
  const phone = document.getElementById('cust-phone')?.value || '';
  const address = document.getElementById('cust-address')?.value || '';
  const notes = document.getElementById('cust-notes')?.value || '';

  const current = JSON.parse(localStorage.getItem('pizza_lab_current_user') || '{}');
  current.name = name || current.name;
  current.phone = phone || current.phone;
  current.address = address || current.address;
  current.notes = notes || current.notes;

  localStorage.setItem('pizza_lab_current_user', JSON.stringify(current));
}

function loadCustomerData() {
  const currentUser = JSON.parse(localStorage.getItem('pizza_lab_current_user') || 'null');
  if (currentUser) {
    const nameInput = document.getElementById('cust-name');
    const phoneInput = document.getElementById('cust-phone');
    const addressInput = document.getElementById('cust-address');
    const notesInput = document.getElementById('cust-notes');

    if (nameInput && currentUser.name) nameInput.value = currentUser.name.replace(' (Guest)', '');
    if (phoneInput && currentUser.phone) phoneInput.value = currentUser.phone;
    if (addressInput && currentUser.address) addressInput.value = currentUser.address;
    if (notesInput && currentUser.notes) notesInput.value = currentUser.notes;
  }

  const authSlot = document.getElementById('nav-auth-slot');
  if (authSlot) {
    if (currentUser && currentUser.name) {
      authSlot.innerHTML = `<span style="font-size:12px;font-weight:700;color:var(--accent);">Hi, ${currentUser.name.split(' ')[0]}</span> <a href="#" onclick="logoutCustomer();return false;" style="font-size:11px;color:var(--text-muted);margin-left:8px;text-decoration:underline;">Logout</a>`;
    } else {
      authSlot.innerHTML = `<a href="login.html" class="btn-auth-nav">Sign In</a>`;
    }
  }
}

function logoutCustomer() {
  if (window.cloudAuth) {
    window.cloudAuth.signOut().catch(() => {});
  }
  localStorage.removeItem('pizza_lab_current_user');
  localStorage.removeItem('pizza_lab_cart');
  localStorage.removeItem('pizza_lab_last_order');
  localStorage.removeItem('pizza_lab_applied_promo');
  window.location.href = 'login.html';
}

function fetchCustomerOrderHistory() {
  const container = document.getElementById('orders-history-container');
  if (!container) return;

  const currentUser = JSON.parse(localStorage.getItem('pizza_lab_current_user') || 'null');
  if (!currentUser || (!currentUser.phone && !currentUser.name)) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px 10px;color:var(--text-muted);font-size:13px;">
        <p style="font-size:28px;margin-bottom:8px;">🔐</p>
        <p>Please sign in or start an order to see your history.</p>
        <a href="login.html" class="btn-primary" style="margin-top:14px;padding:8px 18px;font-size:12px;">Sign In / Guest</a>
      </div>
    `;
    return;
  }

  const targetPhone = (currentUser.phone || '').replace(/\D/g, '');
  const cleanName = (currentUser.name || '').replace(' (Guest)', '').trim().toLowerCase();

  if (!window.cloudDb) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:30px;">Loading orders...</p>';
    return;
  }

  window.cloudDb.ref('orders').on('value', snap => {
    const data = snap.val();
    if (!data) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-muted);margin-top:30px;">No previous orders found.</p>';
      return;
    }

    const matched = [];
    Object.values(data).forEach(o => {
      const oPhone = (o.phone || '').replace(/\D/g, '');
      const oName = (o.name || '').toLowerCase();
      if ((targetPhone && oPhone.includes(targetPhone)) || (cleanName && oName === cleanName)) {
        matched.push(o);
      }
    });

    if (matched.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-muted);margin-top:30px;">You have no active orders yet.</p>';
      return;
    }

    matched.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    container.innerHTML = matched.map(o => `
      <div class="order-history-card">
        <div class="oh-header">
          <span class="oh-id">${o.orderId}</span>
          <span class="oh-status" style="background:var(--accent-subtle);color:var(--accent);">${o.status || 'Received'}</span>
        </div>
        <div class="oh-date">${o.dateStr}</div>
        <div class="oh-items">
          ${(o.cart || []).map(c => `• ${c.name} (${c.variant})`).join('<br>')}
        </div>
        <div class="oh-footer">
          <span class="oh-total">Rs. ${o.grandTotal}</span>
          <div class="oh-actions">
            <a href="track.html?id=${encodeURIComponent(o.cleanId)}" class="btn-oh-track">Track</a>
          </div>
        </div>
      </div>
    `).join('');
  });
}

// -----------------------------------------------------------------------------
// PDF RECEIPT GENERATION
// -----------------------------------------------------------------------------
function downloadInvoicePDF() {
  const el = document.getElementById('print-area');
  if (!el) {
    showToast("Receipt preview unavailable.");
    return;
  }

  const orderIdElem = document.getElementById('receipt-order-id');
  const orderId = orderIdElem ? orderIdElem.innerText.replace('#', '') : 'Order';
  const htmlDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Pizza Lab Receipt - ${orderId}</title>
        <style>
          body { font-family: -apple-system, sans-serif; padding: 20px; background: #fff; color: #000; }
          .receipt-card { max-width: 360px; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="receipt-card">${el.innerHTML}</div>
      </body>
    </html>
  `;

  const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PizzaLab-Receipt-${orderId}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("Receipt saved successfully!");
}

function printReceipt() {
  window.print();
}

// -----------------------------------------------------------------------------
// INITIALIZATION
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  renderMenu();
  loadCustomerData();
  setOrderType(window.orderType);
  updateCartDisplay();

  const lastOrder = JSON.parse(localStorage.getItem('pizza_lab_last_order') || 'null');
  if (lastOrder) {
    syncLiveTrackingUI(lastOrder);
  }
});
