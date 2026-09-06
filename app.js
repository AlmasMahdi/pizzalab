// Application State Controller
let cart = JSON.parse(localStorage.getItem('pizza_lab_cart') || '[]');
let orderType = localStorage.getItem('pizza_lab_order_type') || 'Delivery';
let currentCategory = "All";
let currentStep = 1;
let selectedPayment = 'WhatsApp';

let activeCustomizingItem = null;
let customSelection = {
  size: null,
  sizePrice: 0,
  crust: "Normal Crust",
  crustPrice: 0,
  spice: "Medium",
  addons: []
};

// UI Audio Notification
function playSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } catch(e) {}
}

function showToast(msg) {
  const toast = document.getElementById('toast-notification');
  if (!toast) {
    alert(msg);
    return;
  }
  toast.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Menu Renderer
function renderMenu() {
  const container = document.getElementById('menu-items-box');
  if (!container || typeof fullMenuData === 'undefined') return;
  container.innerHTML = '';

  const filtered = (currentCategory === "All") 
    ? fullMenuData 
    : fullMenuData.filter(i => i.category === currentCategory);

  filtered.forEach(item => {
    const firstSize = Object.keys(item.prices)[0];
    const startingPrice = item.prices[firstSize];

    const card = document.createElement('div');
    card.className = 'menu-card';
    card.innerHTML = `
      <div>
        <span class="menu-card-cat">${item.category}</span>
        <h4 class="menu-card-title">${item.name}</h4>
      </div>
      <p class="menu-card-desc">${item.desc}</p>
      <div class="menu-card-bottom">
        <div class="menu-price">From Rs. ${startingPrice}</div>
        <button class="btn-customize-item" onclick="openCustomizer(${item.id})">Customize & Order</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Customizer Modal Logic
function openCustomizer(itemId) {
  if (typeof fullMenuData === 'undefined') return;
  activeCustomizingItem = fullMenuData.find(i => i.id === itemId);
  if (!activeCustomizingItem) return;

  const titleElem = document.getElementById('modal-item-name');
  if (titleElem) titleElem.innerText = activeCustomizingItem.name;

  const sizeKeys = Object.keys(activeCustomizingItem.prices);
  customSelection.size = sizeKeys[0];
  customSelection.sizePrice = activeCustomizingItem.prices[sizeKeys[0]];
  customSelection.crust = "Normal Crust";
  customSelection.crustPrice = 0;
  customSelection.spice = "Medium";
  customSelection.addons = [];

  const addonCheckboxes = document.querySelectorAll('#addons-group input');
  addonCheckboxes.forEach(box => box.checked = false);

  const sizesContainer = document.getElementById('modal-sizes');
  if (sizesContainer) {
    sizesContainer.innerHTML = sizeKeys.map((size, idx) => `
      <button class="pill-option ${idx === 0 ? 'active' : ''}" onclick="setSize('${size}', ${activeCustomizingItem.prices[size]}, this)">
        ${size} (Rs. ${activeCustomizingItem.prices[size]})
      </button>
    `).join('');
  }

  const isPizza = activeCustomizingItem.category && activeCustomizingItem.category.includes("Pizza");
  const crustGroup = document.getElementById('crust-group');
  if (crustGroup) crustGroup.style.display = isPizza ? 'block' : 'none';

  updateModalPrice();
  const modal = document.getElementById('customizer-modal');
  if (modal) modal.classList.add('open');
  playSound();
}

function setSize(size, price, btn) {
  customSelection.size = size;
  customSelection.sizePrice = price;
  btn.parentNode.querySelectorAll('.pill-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  updateModalPrice();
  playSound();
}

function setCrust(crust, price, btn) {
  customSelection.crust = crust;
  customSelection.crustPrice = price;
  btn.parentNode.querySelectorAll('.pill-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  updateModalPrice();
  playSound();
}

function setSpice(spice, btn) {
  customSelection.spice = spice;
  btn.parentNode.querySelectorAll('.pill-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  playSound();
}

function toggleAddon(name, price, checkbox) {
  if (checkbox.checked) {
    customSelection.addons.push({ name, price });
  } else {
    customSelection.addons = customSelection.addons.filter(a => a.name !== name);
  }
  updateModalPrice();
  playSound();
}

function updateModalPrice() {
  const addonsTotal = (customSelection.addons || []).reduce((acc, cur) => acc + cur.price, 0);
  const total = customSelection.sizePrice + customSelection.crustPrice + addonsTotal;
  const priceElem = document.getElementById('modal-total-price');
  if (priceElem) priceElem.innerText = `Rs. ${total}`;
}

function confirmAddToCart() {
  const addonsTotal = (customSelection.addons || []).reduce((acc, cur) => acc + cur.price, 0);
  const grandTotal = customSelection.sizePrice + customSelection.crustPrice + addonsTotal;
  const addonNames = (customSelection.addons || []).map(a => a.name).join(', ');
  const isPizza = activeCustomizingItem.category && activeCustomizingItem.category.includes("Pizza");

  let details = `${customSelection.size}`;
  if (isPizza) details += ` | ${customSelection.crust}`;
  details += ` | ${customSelection.spice}`;
  if (addonNames) details += ` | Addons: ${addonNames}`;

  cart.push({
    name: activeCustomizingItem.name,
    variant: details,
    price: grandTotal
  });

  saveCart();
  closeCustomizer();
  showToast(`${activeCustomizingItem.name} added to cart!`);
  playSound();
}

function closeCustomizer() {
  const modal = document.getElementById('customizer-modal');
  if (modal) modal.classList.remove('open');
}

// 1-Click Combo Order Action
function orderDirectCombo(dealName, price) {
  cart.push({
    name: dealName,
    variant: "Combo Deal",
    price: price
  });
  saveCart();
  showToast(`${dealName} added to order!`);
  playSound();
  goToStep(1);
  const drawer = document.getElementById('cart-drawer');
  if (drawer && !drawer.classList.contains('open')) {
    toggleCart();
  }
}

function filterCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderMenu();
  playSound();
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
  playSound();
}

// Cart Drawer Controller
function setOrderType(type) {
  orderType = type;
  localStorage.setItem('pizza_lab_order_type', type);
  const btnDel = document.getElementById('btn-delivery');
  const btnTake = document.getElementById('btn-takeaway');
  if (btnDel) btnDel.classList.toggle('active', type === 'Delivery');
  if (btnTake) btnTake.classList.toggle('active', type === 'Takeaway');
  updateCartDisplay();
  playSound();
}

function saveCart() {
  localStorage.setItem('pizza_lab_cart', JSON.stringify(cart));
  updateCartDisplay();
}

function updateCartDisplay() {
  const countBadge = document.getElementById('cart-count');
  if (countBadge) countBadge.innerText = cart.length;

  const cartBox = document.getElementById('cart-items-container');
  if (!cartBox) return;

  const subtotalDisplay = document.getElementById('cart-subtotal');
  const deliveryDisplay = document.getElementById('cart-delivery-fee');
  const totalDisplay = document.getElementById('cart-total-val');

  if (cart.length === 0) {
    cartBox.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; text-align: center; margin-top: 40px;">Your cart is currently empty.</p>`;
    if (subtotalDisplay) subtotalDisplay.innerText = 'Rs. 0';
    if (deliveryDisplay) deliveryDisplay.innerText = orderType === 'Delivery' ? 'Rs. 100' : 'Rs. 0';
    if (totalDisplay) totalDisplay.innerText = 'Rs. 0';
    return;
  }

  let subtotal = 0;
  cartBox.innerHTML = '';
  cart.forEach((item, index) => {
    subtotal += item.price;
    const row = document.createElement('div');
    row.className = 'cart-item-row';
    row.innerHTML = `
      <div style="flex: 1; padding-right: 10px;">
        <div style="font-weight: 700; color: #fff; font-size: 13px;">${item.name}</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${item.variant}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="color: var(--accent); font-weight: 700;">Rs. ${item.price}</span>
        <span style="color: #ff5252; cursor: pointer; font-size: 18px; font-weight: bold;" onclick="removeFromCart(${index})">&times;</span>
      </div>
    `;
    cartBox.appendChild(row);
  });

  const deliveryFee = orderType === 'Delivery' ? 100 : 0;
  if (subtotalDisplay) subtotalDisplay.innerText = `Rs. ${subtotal}`;
  if (deliveryDisplay) deliveryDisplay.innerText = `Rs. ${deliveryFee}`;
  if (totalDisplay) totalDisplay.innerText = `Rs. ${subtotal + deliveryFee}`;
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  playSound();
}

function toggleCart() {
  const drawer = document.getElementById('cart-drawer');
  if (drawer) drawer.classList.toggle('open');
  playSound();
}

function toggleMobileNav() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.toggle('open');
}

// Geolocation Auto-Detection
function detectCustomerGPS() {
  const addressInput = document.getElementById('cust-address');
  const gpsHidden = document.getElementById('cust-gps-link');

  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your device browser.");
    return;
  }

  addressInput.value = "Locating your GPS coordinates...";

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const mapLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
      
      if (gpsHidden) gpsHidden.value = mapLink;

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await response.json();
        const detectedArea = data.display_name ? data.display_name.split(',').slice(0, 3).join(',') : "Karor Lal Eason Area";
        addressInput.value = `${detectedArea} [📍 GPS Linked]`;
      } catch (err) {
        addressInput.value = `Karor Lal Eason (${lat.toFixed(4)}, ${lon.toFixed(4)}) [📍 GPS Linked]`;
      }
      
      saveCustomerData();
      showToast("GPS Location attached successfully!");
    },
    (error) => {
      addressInput.value = "";
      alert("Location permission denied or unavailable. Please type your street address manually.");
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// Multi-Step Navigation & Payment Setup
function goToStep(step) {
  currentStep = step;
  for (let i = 1; i <= 4; i++) {
    const view = document.getElementById(`view-step-${i}`);
    const node = document.getElementById(`node-step-${i}`);
    if (view) view.classList.toggle('active', i === step);
    if (node) {
      node.classList.toggle('active', i === step);
      node.classList.toggle('done', i < step);
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
      if (selectedPayment === 'WhatsApp') {
        btnNext.innerText = '💬 Send on WhatsApp';
        btnNext.style.background = 'var(--whatsapp, #25d366)';
      } else if (selectedPayment === 'PhoneCall') {
        btnNext.innerText = '📞 Call to Place Order';
        btnNext.style.background = 'var(--accent)';
      } else {
        btnNext.innerText = 'Place Order ✔';
        btnNext.style.background = 'var(--accent)';
      }
    }
    if (summary) summary.style.display = 'flex';
  } else if (step === 4) {
    if (btnPrev) btnPrev.style.display = 'none';
    if (btnNext) {
      btnNext.innerText = 'Done / Close';
      btnNext.style.background = 'var(--accent)';
    }
    if (summary) summary.style.display = 'none';
  }
  playSound();
}

function nextStep() {
  if (currentStep === 1) {
    if (cart.length === 0) {
      alert("Please add items to your cart first!");
      return;
    }
    goToStep(2);
  } else if (currentStep === 2) {
    const nameInput = document.getElementById('cust-name');
    const phoneInput = document.getElementById('cust-phone');
    const addressInput = document.getElementById('cust-address');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const address = addressInput ? addressInput.value.trim() : '';

    if (!name) {
      alert("Please enter your full name.");
      if (nameInput) nameInput.focus();
      return;
    }
    if (!phone) {
      alert("Please enter your phone number.");
      if (phoneInput) phoneInput.focus();
      return;
    }
    if (orderType === 'Delivery' && !address) {
      alert("Please enter your delivery address or click Detect Location.");
      if (addressInput) addressInput.focus();
      return;
    }

    goToStep(3);
  } else if (currentStep === 3) {
    submitOrder();
  } else if (currentStep === 4) {
    cart = [];
    saveCart();
    goToStep(1);
    toggleCart();
  }
}

function prevStep() {
  if (currentStep > 1) goToStep(currentStep - 1);
}

function selectPaymentMethod(method, card) {
  selectedPayment = method;
  document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');

  const btnNext = document.getElementById('btn-next-step');
  if (btnNext) {
    if (selectedPayment === 'WhatsApp') {
      btnNext.innerText = '💬 Send on WhatsApp';
      btnNext.style.background = 'var(--whatsapp, #25d366)';
    } else if (selectedPayment === 'PhoneCall') {
      btnNext.innerText = '📞 Call to Place Order';
      btnNext.style.background = 'var(--accent)';
    } else {
      btnNext.innerText = 'Place Order ✔';
      btnNext.style.background = 'var(--accent)';
    }
  }
  playSound();
}

// Order Submission & Live Tracking Initialization
function submitOrder() {
  const nameInput = document.getElementById('cust-name');
  const phoneInput = document.getElementById('cust-phone');
  const addressInput = document.getElementById('cust-address');
  const notesInput = document.getElementById('cust-notes');
  const gpsHidden = document.getElementById('cust-gps-link');

  const name = nameInput ? nameInput.value.trim() : 'Guest Customer';
  const phone = phoneInput ? phoneInput.value.trim() : 'N/A';
  const address = addressInput ? addressInput.value.trim() : (orderType === 'Delivery' ? BRAND_CONFIG.city : 'Self-Pickup');
  const notes = notesInput ? notesInput.value.trim() : '';
  const riderGps = gpsHidden ? gpsHidden.value : '';
  const orderId = '#PL-' + Math.floor(1000 + Math.random() * 9000);

  let tid = '';
  if (selectedPayment === 'JazzCash') {
    const tidInput = document.getElementById('jazzcash-tid');
    tid = tidInput ? tidInput.value.trim() : '';
    if (!tid) {
      alert(`Please enter your JazzCash Transaction ID (TID) sent to ${BRAND_CONFIG.displayPhone}.`);
      if (tidInput) tidInput.focus();
      return;
    }
  } else if (selectedPayment === 'EasyPaisa') {
    const tidInput = document.getElementById('easypaisa-tid');
    tid = tidInput ? tidInput.value.trim() : '';
    if (!tid) {
      alert(`Please enter your EasyPaisa Transaction ID (TID) sent to ${BRAND_CONFIG.displayPhone}.`);
      if (tidInput) tidInput.focus();
      return;
    }
  }

  const deliveryFee = orderType === 'Delivery' ? 100 : 0;
  const subtotal = cart.reduce((acc, c) => acc + c.price, 0);
  const grandTotal = subtotal + deliveryFee;

  if (selectedPayment === 'WhatsApp') {
    let itemsText = cart.map((c, i) => `${i + 1}. *${c.name}*\n   (${c.variant}) - Rs. ${c.price}`).join('\n\n');
    let receipt = `*NEW ORDER - ${BRAND_CONFIG.name}* (${orderId})\n------------------------\n*Order Type:* ${orderType}\n*Branch Area:* ${BRAND_CONFIG.city}\n*Customer:* ${name}\n*Phone:* ${phone}\n${orderType === 'Delivery' ? `*Address:* ${address}\n` : ''}${riderGps ? `*Rider Map Pin:* ${riderGps}\n` : ''}${notes ? `*Notes:* ${notes}\n` : ''}------------------------\n*Items Ordered:*\n${itemsText}\n------------------------\n*Subtotal:* Rs. ${subtotal}\n*Delivery:* Rs. ${deliveryFee}\n*Grand Total:* *Rs. ${grandTotal}*\n------------------------\n_Payment Method: WhatsApp Confirmation_`;

    window.open(`https://wa.me/${BRAND_CONFIG.whatsappRaw}?text=${encodeURIComponent(receipt)}`, '_blank');
  } else if (selectedPayment === 'PhoneCall') {
    window.location.href = `tel:${BRAND_CONFIG.phone}`;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const rDate = document.getElementById('r-date');
  const rOrderId = document.getElementById('receipt-order-id');
  const rName = document.getElementById('r-name');
  const rPhone = document.getElementById('r-phone');
  const rAddress = document.getElementById('r-address');
  const rMethod = document.getElementById('r-method');
  const rTidRow = document.getElementById('r-tid-row');
  const rTid = document.getElementById('r-tid');

  if (rDate) rDate.innerText = dateStr;
  if (rOrderId) rOrderId.innerText = orderId;
  if (rName) rName.innerText = name;
  if (rPhone) rPhone.innerText = phone;
  if (rAddress) rAddress.innerText = orderType === 'Delivery' ? address : 'Self-Pickup';
  if (rMethod) rMethod.innerText = selectedPayment;

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
    receiptTable.innerHTML = cart.map(item => `
      <tr>
        <td>
          <div style="font-weight:700; color:#0f172a;">${item.name}</div>
          <div style="font-size:10px; color:#64748b;">${item.variant}</div>
        </td>
        <td style="text-align:right; font-weight:700; color:#0f172a;">Rs. ${item.price}</td>
      </tr>
    `).join('');
  }

  const rSubtotal = document.getElementById('r-subtotal');
  const rDelivery = document.getElementById('r-delivery');
  const rTotal = document.getElementById('r-total');

  if (rSubtotal) rSubtotal.innerText = `Rs. ${subtotal}`;
  if (rDelivery) rDelivery.innerText = `Rs. ${deliveryFee}`;
  if (rTotal) rTotal.innerText = `Rs. ${grandTotal}`;

  // Store in database with status "Received"
  const orderRecord = {
    orderId, dateStr, name, phone, address, riderGps, selectedPayment,
    subtotal, deliveryFee, grandTotal, cart: [...cart], status: 'Received'
  };

  localStorage.setItem('pizza_lab_last_order', JSON.stringify(orderRecord));

  let allOrders = JSON.parse(localStorage.getItem('pizza_lab_all_orders') || '[]');
  allOrders.unshift(orderRecord);
  localStorage.setItem('pizza_lab_all_orders', JSON.stringify(allOrders));

  syncLiveTrackingUI(orderRecord);
  renderFloatingPill(orderRecord);
  goToStep(4);
}

// REAL TRACKING ENGINE: Driven by actual database status
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
    if (badge) { badge.innerText = '🔥 BAKING'; badge.style.color = '#ffaa00'; }
  } else if (status === 'On Way') {
    if (s1) s1.className = 'track-step done';
    if (s2) s2.className = 'track-step done';
    if (s3) s3.className = 'track-step active';
    if (progressBar) progressBar.style.width = '80%';
    if (etaDisplay) etaDisplay.innerText = '10 - 15 Mins (Rider Dispatched)';
    if (badge) { badge.innerText = '🛵 ON THE WAY'; badge.style.color = '#60a5fa'; }
  } else if (status === 'Delivered') {
    [s1, s2, s3, s4].forEach(s => { if (s) s.className = 'track-step done'; });
    if (progressBar) progressBar.style.width = '100%';
    if (etaDisplay) etaDisplay.innerText = 'Delivered! Bon Appétit 🍕';
    if (badge) { badge.innerText = '✔ COMPLETED'; badge.style.color = 'var(--whatsapp)'; }
  } else if (status === 'Cancelled') {
    if (progressBar) progressBar.style.width = '0%';
    if (etaDisplay) etaDisplay.innerText = 'Order was cancelled by store.';
    if (badge) { badge.innerText = '✖ CANCELLED'; badge.style.color = '#ef4444'; }
  }
}

// PERSISTENT FLOATING TRACKER PILL (Shows on all pages)
function renderFloatingPill(order) {
  let pill = document.getElementById('floating-order-pill');
  if (!order || order.status === 'Delivered' || order.status === 'Cancelled') {
    if (pill) pill.remove();
    return;
  }

  if (!pill) {
    pill = document.createElement('div');
    pill.id = 'floating-order-pill';
    pill.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: rgba(16, 20, 30, 0.95);
      border: 1px solid var(--accent);
      backdrop-filter: blur(14px);
      padding: 12px 18px;
      border-radius: 50px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.7);
      cursor: pointer;
      z-index: 999;
      animation: bounceSubtle 2s infinite ease-in-out;
      font-family: 'Plus Jakarta Sans', sans-serif;
    `;
    document.body.appendChild(pill);
  }

  const icon = order.status === 'In Oven' ? '🔥' : (order.status === 'On Way' ? '🛵' : '⏳');
  pill.innerHTML = `
    <span style="font-size: 18px;">${icon}</span>
    <div>
      <div style="font-size: 11px; font-weight: 700; color: var(--accent); letter-spacing: 0.5px;">ACTIVE ORDER ${order.orderId}</div>
      <div style="font-size: 12.5px; font-weight: 800; color: #fff;">Status: ${order.status || 'Received'}</div>
    </div>
    <span style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 20px; font-size: 11px; color: #fff; font-weight: 700;">Track →</span>
  `;

  pill.onclick = () => {
    window.location.href = `track.html?id=${encodeURIComponent(order.orderId)}`;
  };
}

// STORAGE EVENT LISTENER: Real-Time cross-tab sync with kitchen admin
window.addEventListener('storage', (e) => {
  if (e.key === 'pizza_lab_all_orders' || e.key === 'pizza_lab_last_order') {
    const lastOrder = JSON.parse(localStorage.getItem('pizza_lab_last_order') || 'null');
    if (lastOrder) {
      // Find matching order in all_orders array to get the latest updated status
      const allOrders = JSON.parse(localStorage.getItem('pizza_lab_all_orders') || '[]');
      const current = allOrders.find(o => o.orderId === lastOrder.orderId) || lastOrder;
      
      syncLiveTrackingUI(current);
      renderFloatingPill(current);
    }
  }
});

// Download PDF / Thermal Invoice
function downloadInvoicePDF() {
  const element = document.getElementById('print-area');
  if (!element) {
    alert("Invoice data not found.");
    return;
  }

  const orderId = document.getElementById('receipt-order-id')?.innerText || 'Order';
  const fileName = `PizzaLab-Invoice-${orderId.replace('#', '')}.pdf`;

  if (typeof html2pdf !== 'undefined') {
    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     fileName,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      showToast("Invoice downloaded to your device!");
    }).catch(() => {
      printReceipt();
    });
  } else {
    downloadHtmlReceipt(element, fileName.replace('.pdf', '.html'));
  }
}

function downloadHtmlReceipt(element, fileName) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${fileName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; background: #fff; color: #111; max-width: 500px; margin: 0 auto; }
          .printable-invoice-card { width: 100%; border: 1px solid #ccc; padding: 18px; border-radius: 8px; }
          .invoice-header-clean { text-align: center; border-bottom: 2px solid #ddd; padding-bottom: 8px; margin-bottom: 12px; }
          .invoice-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 12px; margin-bottom: 12px; }
          .invoice-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 12px; }
          .invoice-table th, .invoice-table td { padding: 6px; border-bottom: 1px solid #eee; text-align: left; }
          .invoice-totals-box { border-top: 2px solid #ddd; padding-top: 8px; font-size: 12px; }
          .invoice-totals-box div { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .invoice-grand-row { font-size: 14px; font-weight: bold; border-top: 1px dashed #999; padding-top: 6px; }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
  showToast("Receipt file saved to Downloads!");
}

function printReceipt() {
  window.print();
}

// User Persistence
function saveCustomerData() {
  const name = document.getElementById('cust-name')?.value || '';
  const phone = document.getElementById('cust-phone')?.value || '';
  const address = document.getElementById('cust-address')?.value || '';
  const notes = document.getElementById('cust-notes')?.value || '';
  localStorage.setItem('pizza_lab_customer', JSON.stringify({ name, phone, address, notes }));
}

function loadCustomerData() {
  const saved = JSON.parse(localStorage.getItem('pizza_lab_customer') || '{}');
  const nameInput = document.getElementById('cust-name');
  const phoneInput = document.getElementById('cust-phone');
  const addressInput = document.getElementById('cust-address');
  const notesInput = document.getElementById('cust-notes');

  if (nameInput && saved.name) nameInput.value = saved.name;
  if (phoneInput && saved.phone) phoneInput.value = saved.phone;
  if (addressInput && saved.address) addressInput.value = saved.address;
  if (notesInput && saved.notes) notesInput.value = saved.notes;

  const currentUser = JSON.parse(localStorage.getItem('pizza_lab_current_user') || 'null');
  const authNav = document.getElementById('nav-auth-slot');
  if (authNav && currentUser) {
    authNav.innerHTML = `<span style="font-size:12px;font-weight:700;color:var(--accent);">Hi, ${currentUser.name.split(' ')[0]}</span> <a href="#" onclick="logoutUser()" style="font-size:11px;color:var(--text-muted);margin-left:6px;">Logout</a>`;
  }
}

function logoutUser() {
  localStorage.removeItem('pizza_lab_current_user');
  location.reload();
}

// Feedback Modal Handlers
function openFeedbackModal() {
  const modal = document.getElementById('feedback-modal');
  if (modal) modal.classList.add('open');
  playSound();
}

function closeFeedbackModal() {
  const modal = document.getElementById('feedback-modal');
  if (modal) modal.classList.remove('open');
}

function setFeedbackRating(stars) {
  document.querySelectorAll('#rating-stars span').forEach((star, index) => {
    star.style.color = index < stars ? '#ea8329' : '#444';
  });
}

function submitFeedback(e) {
  e.preventDefault();
  closeFeedbackModal();
  showToast("Thank you for your rating & review!");
  e.target.reset();
  playSound();
}

// Bootstrapper
document.addEventListener('DOMContentLoaded', () => {
  renderMenu();
  loadCustomerData();
  setOrderType(orderType);
  updateCartDisplay();

  // Check if an order is currently active and show floating pill
  const lastOrder = JSON.parse(localStorage.getItem('pizza_lab_last_order') || 'null');
  if (lastOrder) {
    const allOrders = JSON.parse(localStorage.getItem('pizza_lab_all_orders') || '[]');
    const current = allOrders.find(o => o.orderId === lastOrder.orderId) || lastOrder;
    syncLiveTrackingUI(current);
    renderFloatingPill(current);
  }
});