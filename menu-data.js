// Central Brand Configuration
const BRAND_CONFIG = {
  name: "PIZZA LAB",
  city: "Karor Lal Eason",
  address: "Karor Lal Eason, Punjab, Pakistan",
  phone: "03080671101",
  displayPhone: "0308-0671101",
  whatsappRaw: "923080671101",
  email: "almasmahdi420@gmail.com",
  openingHours: "12:00 PM – 02:00 AM",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Karor+Lal+Eason"
};

// Pure Pizza & Deals Menu Data (Extras removed from listing)
const fullMenuData = [
  // Signature Pizzas
  { id: 1, name: "Chicken Tikka", category: "Signature Pizza", desc: "Traditional tikka spices, slow-grilled chicken, onions, and cheese", prices: { Small: 500, Medium: 1000, Large: 1300, "Extra Large": 1700 } },
  { id: 2, name: "Special Creamy", category: "Signature Pizza", desc: "Rich silky cream sauce base topped with shredded tender chicken", prices: { Small: 550, Medium: 1050, Large: 1350, "Extra Large": 1750 } },
  { id: 3, name: "Chicken Fajita", category: "Signature Pizza", desc: "Mexican-style fajita chicken, crunchy bell peppers, and fresh onions", prices: { Small: 500, Medium: 1000, Large: 1300, "Extra Large": 1700 } },
  { id: 4, name: "Fajita Sicillian", category: "Signature Pizza", desc: "Spicy Sicilian marinade, fajita strips, jalapenos, and mozzarella", prices: { Small: 500, Medium: 1000, Large: 1300, "Extra Large": 1700 } },
  { id: 5, name: "Supreme Chicken", category: "Signature Pizza", desc: "Loaded with black olives, mushrooms, bell peppers, and chicken", prices: { Small: 500, Medium: 1000, Large: 1300, "Extra Large": 1700 } },
  { id: 6, name: "Mughlai Chicken", category: "Signature Pizza", desc: "Royal Mughlai herbs, spicy marinated chicken, and onions", prices: { Small: 500, Medium: 1000, Large: 1300, "Extra Large": 1700 } },
  { id: 7, name: "Chicken Tandoori", category: "Signature Pizza", desc: "Smoky clay oven flavored tandoori chicken chunks and herbs", prices: { Small: 500, Medium: 1000, Large: 1300, "Extra Large": 1700 } },
  { id: 8, name: "Seekh Kebab", category: "Signature Pizza", desc: "Succulent charcoal seekh kebab pieces, green chilies, and onion rings", prices: { Small: 550, Medium: 1100, Large: 1400, "Extra Large": 1800 } },
  { id: 9, name: "Chicken Achari", category: "Signature Pizza", desc: "Tangy pickled spices paired with marinated spicy chicken", prices: { Small: 500, Medium: 1000, Large: 1300, "Extra Large": 1700 } },
  { id: 10, name: "Vegi Lover", category: "Signature Pizza", desc: "Golden sweet corn, crisp onions, mushrooms, olives, and capsicum", prices: { Small: 450, Medium: 950, Large: 1250, "Extra Large": 1600 } },

  // Special Pizzas
  { id: 11, name: "Cheezy Bites Special", category: "Special Pizza", desc: "Signature chef formula loaded with double chicken, sausages, and dips", prices: { Small: 600, Medium: 1100, Large: 1400, "Extra Large": 1800 } },
  { id: 12, name: "Behari Kabab Pizza", category: "Special Pizza", desc: "Melt-in-mouth Bihari marinated kebab strips and charred onions", prices: { Medium: 1350, Large: 1650, "Extra Large": 1850 } },
  { id: 13, name: "Kabab Crust Pizza", category: "Special Pizza", desc: "Fluffy dough crust stuffed completely with seekh kebab", prices: { Medium: 1350, Large: 1650, "Extra Large": 1900 } },
  { id: 14, name: "Cheese Brust Pizza", category: "Special Pizza", desc: "Double crust oozing with molten liquid mozzarella and cheddar", prices: { Medium: 1350, Large: 1650, "Extra Large": 1850 } },
  { id: 15, name: "Stuffed Crust Pizza", category: "Special Pizza", desc: "Ring crust filled with premium string cheese and garlic butter", prices: { Medium: 1400, Large: 1700, "Extra Large": 1900 } },
  { id: 16, name: "Malai Boti Pizza", category: "Special Pizza", desc: "Ultra-tender barbecue malai boti chunks with white cream glaze", prices: { Small: 600, Medium: 1250, Large: 1500, "Extra Large": 1800 } },
  { id: 17, name: "Royal Crust Pizza", category: "Special Pizza", desc: "Crispy folded edge loaded with special sauce and kebab chunks", prices: { Medium: 1350, Large: 1600, "Extra Large": 1850 } },
  { id: 18, name: "Drizzle Kabab Pizza", category: "Special Pizza", desc: "Kebab chunks topped with a generous spiral drizzle of garlic mayo", prices: { Small: 650, Medium: 1150, Large: 1500, "Extra Large": 1850 } },

  // Square Pizzas
  { id: 19, name: "Square Pizza (Medium)", category: "Square Pizza", desc: "Corner-to-corner loaded cheese with crisp square edges", prices: { Standard: 1200 } },
  { id: 20, name: "Square Pizza (Large)", category: "Square Pizza", desc: "Grand square cut pizza with maximum cheesy surface area", prices: { Standard: 1500 } },

  // Deals & Combos
  { id: 21, name: "Max Deal", category: "Deals & Combos", desc: "1 Large Pizza + 10 Hot Wings + 1.5 Liters Drink", prices: { "Full Combo": 1950 } },
  { id: 22, name: "Family Deal", category: "Deals & Combos", desc: "1 Large Pizza + 2 Zinger Burgers + 1.5L Drink + 5 Hot Wings", prices: { "Full Combo": 2350 } },
  { id: 23, name: "Special Deal", category: "Deals & Combos", desc: "1 Large CBS Pizza + 1.5 Liter Cold Drink", prices: { "Full Combo": 1550 } },
  { id: 24, name: "Lite Deal", category: "Deals & Combos", desc: "1 Small Pizza + 1 Zinger Burger + 1 Liters Drink", prices: { "Full Combo": 980 } },
  { id: 25, name: "2 Small Pizza + 1L Drink", category: "Deals & Combos", desc: "Two small pizzas of your choice with 1 liter cold drink", prices: { Combo: 1100 } },
  { id: 26, name: "2 Medium Pizza + 1.5L Drink", category: "Deals & Combos", desc: "Two medium pizzas of your choice with 1.5 liter cold drink", prices: { Combo: 2100 } },
  { id: 27, name: "2 Large Pizza + 1.5L Drink", category: "Deals & Combos", desc: "Two large pizzas of your choice with 1.5 liter cold drink", prices: { Combo: 2700 } },
  { id: 28, name: "2 Family Pizza + 2L Drink", category: "Deals & Combos", desc: "Two jumbo family pizzas with 2 liter cold drink", prices: { Combo: 3550 } }
];