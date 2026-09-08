/**
 * PIZZA LAB - CENTRAL MENU CATALOG & FORMULA REGISTRY
 * Branch: Karor Lal Eason
 */

window.rawBaselineMenu = [
  // Signature Pizzas
  {
    id: 1,
    name: "Chicken Tikka Classic",
    category: "Signature Pizza",
    desc: "Smoked tikka chunks, chopped red onions, fresh bell peppers, and mozzarella over traditional marinara sauce.",
    prices: { Small: 450, Medium: 850, Large: 1250 },
    available: true
  },
  {
    id: 2,
    name: "Special Creamy Pizza",
    category: "Signature Pizza",
    desc: "Velvety white cream base topped with tender shredded chicken, black olives, capsicum, and herb drizzle.",
    prices: { Small: 550, Medium: 950, Large: 1400 },
    available: true
  },
  {
    id: 3,
    name: "Chicken Fajita",
    category: "Signature Pizza",
    desc: "Mexican-style seasoned chicken, roasted onions, green peppers, and melted double mozzarella.",
    prices: { Small: 480, Medium: 880, Large: 1300 },
    available: true
  },
  {
    id: 4,
    name: "Smoky Ranch Pizza",
    category: "Signature Pizza",
    desc: "Charcoal grilled chicken slices topped with velvety ranch drizzle and black sliced olives.",
    prices: { Small: 520, Medium: 950, Large: 1390 },
    available: true
  },

  // Special Crust Pizzas
  {
    id: 11,
    name: "Cheezy Bites Special",
    category: "Special Pizza",
    desc: "Pull-apart cheese nuggets encircling double marinated chicken and smoked sausage layers.",
    prices: { Small: 600, Medium: 1100, Large: 1650 },
    available: true
  },
  {
    id: 12,
    name: "Cheese Burst Pizza",
    category: "Special Pizza",
    desc: "Dual crust layers filled edge-to-edge with molten pure mozzarella and cheddar fondue.",
    prices: { Small: 650, Medium: 1200, Large: 1750 },
    available: true
  },
  {
    id: 13,
    name: "Kabab Crust Pizza",
    category: "Special Pizza",
    desc: "Crust ring loaded with continuous spicy seekh kebab links brushed with herb garlic butter.",
    prices: { Medium: 1350, Large: 1850 },
    available: true
  },

  // Square Pizzas
  {
    id: 21,
    name: "Square Deep Pan Supreme",
    category: "Square Pizza",
    desc: "Crispy-edged deep square crust loaded with mixed sausages, tikka cubes, and sweetcorn.",
    prices: { Medium: 1050, Large: 1550 },
    available: true
  },
  {
    id: 22,
    name: "Square Loaded Pepperoni",
    category: "Square Pizza",
    desc: "Generous pepperoni slices layered edge-to-edge with double mozzarella on garlic crust.",
    prices: { Medium: 1100, Large: 1600 },
    available: true
  },

  // Deals & Combos
  {
    id: 31,
    name: "Student Lab Deal",
    category: "Deals & Combos",
    desc: "1 Small Signature Pizza + 1 Soft Drink 345ml + 1 Garlic Dip.",
    prices: { Standard: 500 },
    available: true
  },
  {
    id: 32,
    name: "Duo Feast Deal",
    category: "Deals & Combos",
    desc: "1 Medium Pizza + 4 Pieces Baked Wings + 2 Soft Drinks.",
    prices: { Standard: 1250 },
    available: true
  },
  {
    id: 33,
    name: "Max Deal",
    category: "Deals & Combos",
    desc: "1 Large Pizza + 1 Small Pizza + 6 Pieces Spicy Wings + 1.5L Soft Drink.",
    prices: { Standard: 2250 },
    available: true
  }
];

// Active Voucher Catalog
window.DEFAULT_PROMOS = [
  { code: "LAB10", type: "percentage", value: 10, minOrder: 500, active: true },
  { code: "WELCOME100", type: "flat", value: 100, minOrder: 800, active: true },
  { code: "FREESHIP", type: "freedelivery", value: 0, minOrder: 1000, active: true },
  { code: "KAROR20", type: "percentage", value: 20, minOrder: 1500, active: true }
];

// Menu Management Helpers
function getLiveMenu() {
  const local = localStorage.getItem('pizza_lab_live_menu');
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error("Invalid menu in localStorage, resetting to baseline:", e);
    }
  }
  return window.rawBaselineMenu;
}

function saveLiveMenu(menuArray) {
  localStorage.setItem('pizza_lab_live_menu', JSON.stringify(menuArray));
  if (window.cloudDb) {
    window.cloudDb.ref('menu_catalog').set(menuArray).catch(err => {
      console.warn("Could not sync menu to cloud:", err);
    });
  }
}

function addMenuItem(newItem) {
  const current = getLiveMenu();
  newItem.id = Date.now();
  current.push(newItem);
  saveLiveMenu(current);
}

function deleteMenuItem(id) {
  let current = getLiveMenu();
  current = current.filter(item => item.id !== Number(id));
  saveLiveMenu(current);
}
