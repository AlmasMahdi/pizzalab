/**
 * PIZZA LAB - CLOUD CONFIGURATION & REALTIME DATABASE INITIALIZER
 * Branch: Karor Lal Eason
 */

const firebaseConfig = {
  apiKey: "AIzaSyBy7G6NeFTJaLWUp7B4k0gisJx9ZPi9Shg",
  authDomain: "pizza-lab-karor.firebaseapp.com",
  databaseURL: "https://pizza-lab-karor-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pizza-lab-karor",
  storageBucket: "pizza-lab-karor.firebasestorage.app",
  messagingSenderId: "375486512512",
  appId: "1:375486512512:web:7451c41342b235d1fe1565",
  measurementId: "G-EW0TJ9NK8L"
};

// Global Store Branding Config
window.BRAND_CONFIG = {
  name: "Pizza Lab",
  tagline: "The Ultimate Burger & Pizza Haven",
  city: "Karor Lal Eason",
  province: "Punjab, Pakistan",
  phone: "03080671101",
  whatsappRaw: "923080671101",
  email: "almasmahdi420@gmail.com",
  deliveryFee: 100,
  operatingHours: "12:00 PM – 02:00 AM"
};

function initPizzaLabCloud() {
  if (typeof firebase !== 'undefined') {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      
      // Initialize Realtime Database
      if (typeof firebase.database === 'function') {
        window.cloudDb = firebase.database();

        // Monitor live connection status
        window.cloudDb.ref('.info/connected').on('value', function(snap) {
          window.isCloudOnline = snap.val() === true;
          const pill = document.getElementById('cloud-pill');
          if (pill) {
            if (window.isCloudOnline) {
              pill.innerHTML = '<span class="dot" style="background:#10b981;box-shadow:0 0 8px #10b981;"></span><span>Live Cloud Synced</span>';
              pill.style.color = '#10b981';
              pill.style.borderColor = 'rgba(16,185,129,0.3)';
            } else {
              pill.innerHTML = '<span class="dot" style="background:#f59e0b;box-shadow:0 0 8px #f59e0b;"></span><span>Connecting...</span>';
              pill.style.color = '#f59e0b';
              pill.style.borderColor = 'rgba(245,158,11,0.3)';
            }
          }
        });
      }

      // Safely initialize Auth ONLY if the Auth SDK script is present on this page
      if (typeof firebase.auth === 'function') {
        window.cloudAuth = firebase.auth();
      } else {
        window.cloudAuth = null;
      }

      console.log("🔥 Pizza Lab Realtime Database Connected (Karor)");
    } catch (err) {
      console.error("Firebase initialization failed:", err);
      window.cloudDb = null;
    }
  } else {
    console.warn("Firebase SDK script not detected on this page. Running in local storage fallback mode.");
    window.cloudDb = null;
  }
}

initPizzaLabCloud();