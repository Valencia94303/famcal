import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Recipe data parsed from the MD files
const recipes = [
  {
    name: "Chipotle Yogurt Chicken",
    description: "Creamy, smoky, spicy grilled chicken with yogurt marinade",
    cuisine: "Mexican",
    icon: "🍗",
    prepTime: 30,
    cookTime: 20,
    servings: 4,
    difficulty: "EASY",
    ingredients: [
      { name: "Chicken Breast", quantity: "3-4", unit: "lbs" },
      { name: "Greek Yogurt", quantity: "1", unit: "cup" },
      { name: "Lemon Juice", quantity: "2", unit: "tbsp" },
      { name: "Garlic", quantity: "3-4", unit: "cloves" },
      { name: "Chipotle peppers in adobo", quantity: "2-3", unit: "peppers" },
      { name: "Salt & Pepper", quantity: "", unit: "to taste" },
    ],
    instructions: [
      "Mix yogurt, lemon juice, minced garlic, chopped chipotle peppers, and adobo sauce",
      "Reserve portion for kids without chipotle",
      "Coat chicken breasts thoroughly. Marinate at least 30 mins",
      "Grill or pan-sear over medium-high heat until 165°F internal",
      "Slice for salads or chunk for tacos",
    ],
    tags: ["high-protein", "kid-friendly", "meal-prep"],
    mealTypes: ["DINNER"],
  },
  {
    name: "Garlic Lemon Shrimp & Broccoli",
    description: "Zesty, savory Asian fusion shrimp stir-fry",
    cuisine: "Asian",
    icon: "🍤",
    prepTime: 15,
    cookTime: 10,
    servings: 4,
    difficulty: "EASY",
    ingredients: [
      { name: "Frozen Shrimp", quantity: "2", unit: "lbs" },
      { name: "Broccoli", quantity: "2", unit: "heads" },
      { name: "Garlic", quantity: "4-5", unit: "cloves" },
      { name: "Butter/Oil", quantity: "3", unit: "tbsp" },
      { name: "Lemon Juice", quantity: "2", unit: "tbsp" },
      { name: "Soy Sauce", quantity: "2", unit: "tbsp" },
    ],
    instructions: [
      "Thaw shrimp completely",
      "Sauté plenty of garlic in oil/butter until fragrant",
      "Add shrimp, cook 2-3 mins until pink",
      "Remove kids' portion before adding soy sauce and red pepper flakes",
      "Steam or roast broccoli separately",
      "Toss shrimp with broccoli to serve",
    ],
    tags: ["quick", "high-protein", "low-carb"],
    mealTypes: ["DINNER"],
  },
  {
    name: "NY Steak Encebollado",
    description: "Savory steak with sweet caramelized onions - Mexican traditional",
    cuisine: "Mexican",
    icon: "🥩",
    prepTime: 10,
    cookTime: 25,
    servings: 4,
    difficulty: "MEDIUM",
    ingredients: [
      { name: "NY Strip Steaks", quantity: "2-3", unit: "lbs" },
      { name: "Onions", quantity: "2", unit: "large" },
      { name: "Cherry Tomatoes", quantity: "1", unit: "cup" },
      { name: "Salt & Pepper", quantity: "", unit: "to taste" },
      { name: "Corn Tortillas", quantity: "8", unit: "count" },
    ],
    instructions: [
      "Season steaks heavily with salt and pepper",
      "Sear steaks in hot pan to desired doneness, rest 10 mins",
      "In same pan, cook sliced onions until caramelized (10-15 mins)",
      "Add cherry tomatoes to onions, cook until they burst",
      "Slice steak against grain, top with onion-tomato mix",
    ],
    tags: ["date-night", "high-protein"],
    mealTypes: ["DINNER"],
  },
  {
    name: "Chorizo & Bean Stew with Drumsticks",
    description: "Hardy, smoky stew paired with crispy roasted drumsticks",
    cuisine: "Mexican",
    icon: "🍗",
    prepTime: 15,
    cookTime: 40,
    servings: 4,
    difficulty: "EASY",
    ingredients: [
      { name: "Chicken Drumsticks", quantity: "8-10", unit: "pieces" },
      { name: "Chorizo", quantity: "1", unit: "lb" },
      { name: "Pinto Beans (canned)", quantity: "2", unit: "cans" },
      { name: "Corn (canned)", quantity: "1", unit: "can" },
      { name: "Onion", quantity: "1", unit: "medium" },
      { name: "Lime", quantity: "1", unit: "whole" },
    ],
    instructions: [
      "Toss drumsticks with oil, salt, pepper, paprika",
      "Roast at 400°F for 35-40 mins until crispy",
      "Remove chorizo from casing, brown in pot",
      "Add diced onion, cook 3 mins",
      "Add beans (undrained) and corn (drained)",
      "Simmer 10 mins, squeeze lime at end",
    ],
    tags: ["comfort-food", "one-pot"],
    mealTypes: ["DINNER"],
  },
  {
    name: "Lemon Yogurt Chicken Tenders",
    description: "Light Mediterranean-style chicken fingers",
    cuisine: "Mediterranean",
    icon: "🍗",
    prepTime: 15,
    cookTime: 15,
    servings: 4,
    difficulty: "EASY",
    ingredients: [
      { name: "Chicken Tenderloins", quantity: "2", unit: "lbs" },
      { name: "Greek Yogurt", quantity: "1/2", unit: "cup" },
      { name: "Lemon Juice", quantity: "2", unit: "tbsp" },
      { name: "Garlic salt", quantity: "1", unit: "tsp" },
      { name: "Cucumber", quantity: "2", unit: "medium" },
    ],
    instructions: [
      "Mix yogurt, lemon juice, garlic salt for marinade",
      "Quick marinate tenders (15 mins)",
      "Pan sear fast or bake at 400°F for 15 mins",
      "Mix fresh yogurt with lemon juice for dipping sauce",
      "Serve with cucumber salad",
    ],
    tags: ["quick", "kid-friendly", "light"],
    mealTypes: ["DINNER"],
  },
  {
    name: "Ribeye Carne Asada",
    description: "Grilled ribeye steaks with charred onions and jalapeños",
    cuisine: "Mexican",
    icon: "🥩",
    prepTime: 15,
    cookTime: 15,
    servings: 4,
    difficulty: "MEDIUM",
    ingredients: [
      { name: "Ribeye Steaks", quantity: "2", unit: "lbs" },
      { name: "Lime Juice", quantity: "3", unit: "tbsp" },
      { name: "Garlic", quantity: "4", unit: "cloves" },
      { name: "Onions", quantity: "2", unit: "large" },
      { name: "Jalapeños", quantity: "2", unit: "whole" },
      { name: "Tortillas", quantity: "12", unit: "count" },
    ],
    instructions: [
      "Marinate steaks with oil, lime juice, salt, and smashed garlic",
      "Grill steaks on high heat to desired doneness",
      "Grill thick onion slices and whole jalapeños alongside",
      "Rest meat 5 mins, slice thin against the grain",
      "Serve with tortillas for tacos",
    ],
    tags: ["grilling", "weekend", "high-protein"],
    mealTypes: ["DINNER"],
  },
  {
    name: "California Roll Bowls",
    description: "Fresh sushi-style bowls with imitation crab and avocado",
    cuisine: "Asian",
    icon: "🍣",
    prepTime: 20,
    cookTime: 20,
    servings: 4,
    difficulty: "EASY",
    ingredients: [
      { name: "Imitation Crab (Kanikama)", quantity: "1", unit: "lb" },
      { name: "Sushi Rice", quantity: "2", unit: "cups" },
      { name: "Avocado", quantity: "2", unit: "whole" },
      { name: "Cucumber", quantity: "2", unit: "medium" },
      { name: "Nori (seaweed snacks)", quantity: "1", unit: "pack" },
      { name: "Mayonnaise", quantity: "3", unit: "tbsp" },
      { name: "Sriracha", quantity: "1", unit: "tsp" },
    ],
    instructions: [
      "Cook sushi rice with rice vinegar, sugar, salt",
      "Shred imitation crab sticks",
      "Mix crab with mayo and sriracha (mild for kids)",
      "Dad: Use spiralized cucumber as base instead of rice",
      "Mom/Kids: Use sushi rice as base",
      "Top with crab mix, sliced avocado, nori strips",
    ],
    tags: ["sushi-sunday", "low-cook", "healthy"],
    mealTypes: ["DINNER"],
  },
  {
    name: "Chicken Tinga",
    description: "Shredded chipotle chicken - Mexican classic",
    cuisine: "Mexican",
    icon: "🍗",
    prepTime: 20,
    cookTime: 30,
    servings: 4,
    difficulty: "EASY",
    ingredients: [
      { name: "Chicken Breast", quantity: "3-4", unit: "lbs" },
      { name: "Chipotle peppers", quantity: "3-4", unit: "peppers" },
      { name: "Onion", quantity: "1", unit: "medium" },
      { name: "Garlic", quantity: "2", unit: "cloves" },
      { name: "Tomato Sauce", quantity: "1", unit: "can" },
      { name: "Tostadas", quantity: "8", unit: "count" },
    ],
    instructions: [
      "Boil chicken breast with onion, garlic, salt until shreddable",
      "Blend chipotle peppers with onion, garlic, and tomato sauce",
      "Reserve plain shredded chicken for kids before adding sauce",
      "Simmer adult chicken in chipotle sauce for 10 mins",
      "Serve on tostadas with lettuce and crema",
    ],
    tags: ["meal-prep", "crowd-pleaser"],
    mealTypes: ["DINNER"],
  },
  {
    name: "Chorizo & Eggs",
    description: "Breakfast for dinner - Mexican scrambled eggs with chorizo",
    cuisine: "Mexican",
    icon: "🍳",
    prepTime: 5,
    cookTime: 15,
    servings: 4,
    difficulty: "EASY",
    ingredients: [
      { name: "Chorizo", quantity: "1", unit: "lb" },
      { name: "Eggs", quantity: "10-12", unit: "large" },
      { name: "Onion", quantity: "1/2", unit: "medium" },
      { name: "Tortillas", quantity: "8", unit: "count" },
    ],
    instructions: [
      "Brown chorizo completely in large skillet",
      "If too spicy for kids, scramble separate plain eggs",
      "Whisk eggs, pour over chorizo, scramble until set",
      "Serve with warm tortillas",
      "Add avocado or peppers for adults",
    ],
    tags: ["breakfast-for-dinner", "quick", "15-min"],
    mealTypes: ["DINNER"],
  },
  {
    name: "NY Steak Stir-Fry",
    description: "Quick steak strips with peppers and onions",
    cuisine: "Asian",
    icon: "🥩",
    prepTime: 15,
    cookTime: 10,
    servings: 4,
    difficulty: "MEDIUM",
    ingredients: [
      { name: "NY Strip Steaks", quantity: "1.5", unit: "lbs" },
      { name: "Bell Peppers", quantity: "2", unit: "medium" },
      { name: "Onion", quantity: "1", unit: "large" },
      { name: "Soy Sauce", quantity: "3", unit: "tbsp" },
      { name: "Cumin", quantity: "1", unit: "tsp" },
    ],
    instructions: [
      "Slice raw steak into thin strips",
      "Sear on high heat in batches",
      "Add sliced onions and peppers",
      "Season with soy sauce (Asian) or cumin/chili (Mexican)",
      "Dad: Serve in lettuce cups",
      "Kids: Serve over rice",
    ],
    tags: ["quick", "high-protein", "versatile"],
    mealTypes: ["DINNER"],
  },
  {
    name: "Mexican Espagueti Rojo",
    description: "Creamy tomato-chipotle pasta with ground beef",
    cuisine: "Mexican",
    icon: "🍝",
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    difficulty: "EASY",
    ingredients: [
      { name: "Spaghetti", quantity: "1", unit: "lb" },
      { name: "Ground Beef/Turkey", quantity: "1", unit: "lb" },
      { name: "Roasted Tomatoes", quantity: "4", unit: "whole" },
      { name: "Chipotle pepper", quantity: "1", unit: "pepper" },
      { name: "Greek Yogurt", quantity: "2", unit: "tbsp" },
      { name: "Green Beans", quantity: "1", unit: "lb" },
    ],
    instructions: [
      "Blend tomatoes, onion, garlic, chipotle, and yogurt for sauce",
      "Brown ground meat with taco seasoning",
      "Cook spaghetti al dente",
      "Toss pasta with sauce and meat",
      "Dad: Serve meat sauce over steamed green beans instead",
    ],
    tags: ["pasta-night", "kid-favorite"],
    mealTypes: ["DINNER"],
  },
  {
    name: "Vietnamese Garlic Noodles",
    description: "Rich garlic butter noodles with umami punch",
    cuisine: "Asian",
    icon: "🍝",
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    difficulty: "EASY",
    ingredients: [
      { name: "Spaghetti/Egg Noodles", quantity: "1", unit: "lb" },
      { name: "Butter", quantity: "4", unit: "tbsp" },
      { name: "Garlic", quantity: "6", unit: "cloves" },
      { name: "Oyster Sauce", quantity: "2", unit: "tbsp" },
      { name: "Soy Sauce", quantity: "1", unit: "tbsp" },
      { name: "Parmesan Cheese", quantity: "1/2", unit: "cup" },
      { name: "Green Onions", quantity: "3", unit: "stalks" },
    ],
    instructions: [
      "Cook noodles al dente",
      "Sauté minced garlic in butter/oil until fragrant (don't burn!)",
      "Stir in oyster sauce, soy sauce, fish sauce",
      "Toss hot noodles in garlic butter sauce",
      "Finish with parmesan and green onions",
      "Dad: Toss zucchini noodles in same sauce",
    ],
    tags: ["pasta-night", "umami", "quick"],
    mealTypes: ["DINNER"],
  },
  {
    name: "Egg Roll in a Bowl",
    description: "Deconstructed egg roll - ground pork with cabbage",
    cuisine: "Asian",
    icon: "🥬",
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    difficulty: "EASY",
    ingredients: [
      { name: "Ground Pork/Turkey", quantity: "1", unit: "lb" },
      { name: "Coleslaw Mix (shredded cabbage)", quantity: "1", unit: "bag" },
      { name: "Ginger", quantity: "1", unit: "tbsp" },
      { name: "Garlic", quantity: "3", unit: "cloves" },
      { name: "Soy Sauce", quantity: "3", unit: "tbsp" },
      { name: "Sesame Oil", quantity: "1", unit: "tbsp" },
    ],
    instructions: [
      "Brown ground meat in large pan",
      "Add cabbage/coleslaw mix",
      "Sauté until cabbage is wilted but still has crunch",
      "Add ginger, garlic, soy sauce, sesame oil",
      "Naturally Dad-friendly (high volume, low carb)",
      "Kids: Serve over rice as 'Deconstructed Egg Roll'",
    ],
    tags: ["low-carb", "one-pan", "quick"],
    mealTypes: ["DINNER"],
  },
  // Week 3 recipes
  {
    name: "Pollo Pibil",
    description: "Citrusy achiote-marinated chicken thighs with pickled onions",
    cuisine: "Mexican",
    icon: "🍗",
    prepTime: 40,
    cookTime: 30,
    servings: 4,
    difficulty: "MEDIUM",
    ingredients: [
      { name: "Chicken Thighs (bone-in)", quantity: "3", unit: "lbs" },
      { name: "Achiote Paste", quantity: "3", unit: "tbsp" },
      { name: "Orange Juice", quantity: "1", unit: "cup" },
      { name: "Garlic", quantity: "4", unit: "cloves" },
      { name: "Oregano", quantity: "1", unit: "tsp" },
      { name: "Red Onion", quantity: "1", unit: "large" },
      { name: "Lime Juice", quantity: "2", unit: "tbsp" },
    ],
    instructions: [
      "Dissolve achiote paste in orange juice with minced garlic and oregano",
      "Coat chicken thighs thoroughly, marinate at least 30 mins",
      "Make pickled onions: slice red onion, soak in lime juice and salt",
      "Roast or pan-sear chicken until cooked through",
      "Reserve 2 plain thighs (salt/pepper only) for kids if achiote is too earthy",
      "Dad: Serve over cauliflower rice with heavy pickled onions",
      "Mom: Use as protein for Chicken Caesar with citrus twist",
    ],
    tags: ["yucatan", "citrus", "make-ahead"],
    mealTypes: ["DINNER"],
  },
  {
    name: "Pork Chops Al Pastor",
    description: "Chili-spiced pork with caramelized pineapple",
    cuisine: "Mexican",
    icon: "🐷",
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    difficulty: "EASY",
    ingredients: [
      { name: "Pork Chops or Loin", quantity: "2", unit: "lbs" },
      { name: "Pineapple (fresh or canned)", quantity: "4", unit: "slices" },
      { name: "Chili Powder", quantity: "2", unit: "tbsp" },
      { name: "Cumin", quantity: "1", unit: "tsp" },
      { name: "Garlic", quantity: "3", unit: "cloves" },
      { name: "Pineapple Juice", quantity: "2", unit: "tbsp" },
    ],
    instructions: [
      "Season pork with chili powder, cumin, garlic, and pineapple juice",
      "Pan-sear pork chops until cooked through",
      "Grill or sear pineapple slices in same pan for caramelization",
      "Dad: Serve pork with avocado salad, limit pineapple (sugar)",
      "Mom: Pork bowl over rice with pineapple salsa",
      "Kids: Diced pork tacos with grilled pineapple bits",
    ],
    tags: ["al-pastor", "sweet-savory"],
    mealTypes: ["DINNER"],
  },
  {
    name: "Bean & Cheese Enchiladas",
    description: "Meatless corn tortillas stuffed with refried beans and cheese",
    cuisine: "Mexican",
    icon: "🌯",
    prepTime: 20,
    cookTime: 25,
    servings: 4,
    difficulty: "EASY",
    ingredients: [
      { name: "Corn Tortillas", quantity: "12", unit: "count" },
      { name: "Refried Beans (canned)", quantity: "2", unit: "cans" },
      { name: "Shredded Cheese", quantity: "2", unit: "cups" },
      { name: "Red Enchilada Sauce", quantity: "2", unit: "cans" },
      { name: "Eggs", quantity: "4", unit: "large" },
      { name: "Tuna (canned)", quantity: "1", unit: "can" },
    ],
    instructions: [
      "Mix refried beans with some cheese for filling",
      "Warm tortillas, fill with bean/cheese mix, roll up",
      "Place seam-down in baking dish, cover with enchilada sauce and cheese",
      "Bake at 350°F for 20 mins until bubbly",
      "Dad: Eat filling only (discard tortillas), top with 3-4 fried eggs or tuna for protein",
      "Mom: 2 enchiladas with cucumber slices",
      "Kids: Cut up enchiladas with avocado slices",
    ],
    tags: ["meatless", "kid-favorite", "comfort-food"],
    mealTypes: ["DINNER"],
  },
  {
    name: "Fish Tacos",
    description: "Pan-seared white fish with lime cabbage slaw",
    cuisine: "Mexican",
    icon: "🐟",
    prepTime: 15,
    cookTime: 10,
    servings: 4,
    difficulty: "EASY",
    ingredients: [
      { name: "Tilapia or Cod", quantity: "1.5", unit: "lbs" },
      { name: "Cabbage", quantity: "1/2", unit: "head" },
      { name: "Lime", quantity: "3", unit: "whole" },
      { name: "Greek Yogurt", quantity: "1/2", unit: "cup" },
      { name: "Mayonnaise", quantity: "2", unit: "tbsp" },
      { name: "Corn Tortillas", quantity: "8", unit: "count" },
      { name: "Hot Sauce", quantity: "", unit: "optional" },
    ],
    instructions: [
      "Season white fish with cumin, salt, and lime juice",
      "Pan-sear fish quickly until flaky",
      "Shred cabbage thin, mix with lime juice, oil, and salt for slaw",
      "Make lime cream: mix yogurt + mayo + lime + hot sauce (optional)",
      "Dad: Double fish over huge portion of cabbage slaw with lime cream",
      "Mom: 2 fish tacos in corn tortillas with extra slaw",
      "Kids: Fish tacos or 'fish sticks' if you bread a piece, with fruit",
    ],
    tags: ["seafood", "light", "quick"],
    mealTypes: ["DINNER"],
  },
  {
    name: "Crispy Chicken Thighs",
    description: "Perfectly rendered crispy-skin chicken thighs with asparagus",
    cuisine: "American",
    icon: "🍗",
    prepTime: 5,
    cookTime: 25,
    servings: 4,
    difficulty: "MEDIUM",
    ingredients: [
      { name: "Chicken Thighs (bone-in, skin-on)", quantity: "8", unit: "pieces" },
      { name: "Asparagus", quantity: "2", unit: "bunches" },
      { name: "Salt", quantity: "2", unit: "tsp" },
      { name: "Pepper", quantity: "1", unit: "tsp" },
    ],
    instructions: [
      "Pat chicken strictly dry with paper towels",
      "Salt heavily on both sides",
      "Place skin-side down in COLD cast iron pan",
      "Turn heat to medium-high, render fat until skin is crispy (12-15 mins)",
      "Flip and finish cooking (5-8 mins)",
      "Roast asparagus in the rendered chicken fat",
      "Dad: 3-4 thighs with all the asparagus",
      "Mom: 2 thighs with asparagus",
      "Kids: Chicken cut off bone with rice or bread",
    ],
    tags: ["crispy", "simple", "one-pan"],
    mealTypes: ["DINNER"],
  },
  // Week 4 recipes
  {
    name: "Soy Ginger Chicken Thighs",
    description: "Asian-style chicken with bok choy",
    cuisine: "Asian",
    icon: "🍗",
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    difficulty: "EASY",
    ingredients: [
      { name: "Chicken Thighs", quantity: "3", unit: "lbs" },
      { name: "Soy Sauce", quantity: "1/4", unit: "cup" },
      { name: "Fresh Ginger", quantity: "2", unit: "tbsp" },
      { name: "Garlic", quantity: "4", unit: "cloves" },
      { name: "Rice Vinegar", quantity: "2", unit: "tbsp" },
      { name: "Sesame Oil", quantity: "1", unit: "tbsp" },
      { name: "Bok Choy", quantity: "4", unit: "heads" },
    ],
    instructions: [
      "Make marinade: soy sauce, grated ginger, minced garlic, vinegar, sesame oil",
      "Marinate chicken thighs at least 30 mins",
      "Roast thighs or pan-sear until cooked through",
      "Steam or sauté bok choy with garlic",
      "Dad: 3-4 thighs with large serving of bok choy",
      "Mom: Fusion Caesar salad with ginger dressing and sliced thighs",
      "Kids: Teriyaki chicken (glaze with honey/soy reduction) over white rice",
    ],
    tags: ["asian", "ginger", "healthy"],
    mealTypes: ["DINNER"],
  },
  {
    name: "Beef & Broccoli Stir Fry",
    description: "Classic Chinese takeout style beef with broccoli",
    cuisine: "Asian",
    icon: "🥩",
    prepTime: 20,
    cookTime: 15,
    servings: 4,
    difficulty: "MEDIUM",
    ingredients: [
      { name: "Flank Steak", quantity: "1.5", unit: "lbs" },
      { name: "Broccoli", quantity: "2", unit: "heads" },
      { name: "Soy Sauce", quantity: "1/4", unit: "cup" },
      { name: "Beef Broth", quantity: "1/2", unit: "cup" },
      { name: "Fresh Ginger", quantity: "1", unit: "tbsp" },
      { name: "Garlic", quantity: "4", unit: "cloves" },
      { name: "Cornstarch", quantity: "2", unit: "tbsp" },
    ],
    instructions: [
      "Slice flank steak thin against the grain",
      "Make sauce: beef broth, soy sauce, ginger, garlic",
      "Sear beef in batches on high heat, remove",
      "Steam or sauté broccoli until bright green",
      "Combine beef + broccoli + sauce, add cornstarch slurry to thicken",
      "Dad: Heavy beef and broccoli, no rice (or cauliflower rice)",
      "Mom: Beef & broccoli bowl over small rice or lettuce cups",
      "Kids: Beef cut small with broccoli over rice",
    ],
    tags: ["stir-fry", "takeout-style", "high-protein"],
    mealTypes: ["DINNER"],
  },
  {
    name: "Eggs & Avocado Toast Bar",
    description: "Breakfast for dinner - customizable eggs and avocado toast",
    cuisine: "American",
    icon: "🥑",
    prepTime: 10,
    cookTime: 10,
    servings: 4,
    difficulty: "EASY",
    ingredients: [
      { name: "Eggs", quantity: "10", unit: "large" },
      { name: "Good Bread", quantity: "8", unit: "slices" },
      { name: "Avocados", quantity: "3", unit: "whole" },
      { name: "Tomatoes", quantity: "2", unit: "medium" },
      { name: "Lemon", quantity: "1", unit: "whole" },
      { name: "Salt", quantity: "", unit: "to taste" },
    ],
    instructions: [
      "Fry or scramble eggs (about 8-10 for family)",
      "Mash avocado with salt and lemon juice",
      "Toast good quality bread",
      "Dad (No Toast): 3-4 fried eggs, 1 whole sliced avocado, sliced tomato with salt",
      "Mom: Avocado toast topped with 1-2 eggs, tomato salad",
      "Kids: Toast strips ('soldiers'), scrambled eggs, avocado cubes",
    ],
    tags: ["breakfast-for-dinner", "meatless", "quick"],
    mealTypes: ["DINNER"],
  },
];

// Meal plan data - Week 1-4 schedule
const mealPlanData = [
  // Week 1 - Dinners
  { weekNumber: 1, dayOfWeek: "MON", mealType: "DINNER", recipeName: "Chipotle Yogurt Chicken" },
  { weekNumber: 1, dayOfWeek: "TUE", mealType: "DINNER", recipeName: "Garlic Lemon Shrimp & Broccoli" },
  { weekNumber: 1, dayOfWeek: "WED", mealType: "DINNER", recipeName: "NY Steak Encebollado" },
  { weekNumber: 1, dayOfWeek: "THU", mealType: "DINNER", recipeName: "Chorizo & Bean Stew with Drumsticks" },
  { weekNumber: 1, dayOfWeek: "FRI", mealType: "DINNER", recipeName: "Lemon Yogurt Chicken Tenders" },
  { weekNumber: 1, dayOfWeek: "SAT", mealType: "DINNER", recipeName: "Ribeye Carne Asada" },
  { weekNumber: 1, dayOfWeek: "SUN", mealType: "DINNER", recipeName: "California Roll Bowls" },
  // Week 1 - Mom's Lunches (from previous night's leftovers)
  { weekNumber: 1, dayOfWeek: "MON", mealType: "LUNCH", customMeal: "California Roll Salad", notes: "Leftover crab mix + cucumber from Sunday" },
  { weekNumber: 1, dayOfWeek: "TUE", mealType: "LUNCH", customMeal: "Chipotle Chicken Wrap", notes: "Leftover chicken + low carb tortilla + lettuce" },
  { weekNumber: 1, dayOfWeek: "WED", mealType: "LUNCH", customMeal: "Shrimp Salad", notes: "Leftover shrimp + broccoli, cold or reheated" },
  { weekNumber: 1, dayOfWeek: "THU", mealType: "LUNCH", customMeal: "Steak Salad", notes: "Leftover steak sliced thin over greens" },
  { weekNumber: 1, dayOfWeek: "FRI", mealType: "LUNCH", customMeal: "Chicken Salad", notes: "Drumstick meat mixed with yogurt/mayo" },
  { weekNumber: 1, dayOfWeek: "SAT", mealType: "LUNCH", customMeal: "Chicken Tenders", notes: "Leftover lemon yogurt tenders" },
  { weekNumber: 1, dayOfWeek: "SUN", mealType: "LUNCH", customMeal: "Carne Asada Salad", notes: "Leftover ribeye sliced over greens" },

  // Week 2 - Dinners
  { weekNumber: 2, dayOfWeek: "MON", mealType: "DINNER", recipeName: "Chicken Tinga" },
  { weekNumber: 2, dayOfWeek: "TUE", mealType: "DINNER", recipeName: "Chorizo & Eggs" },
  { weekNumber: 2, dayOfWeek: "WED", mealType: "DINNER", recipeName: "NY Steak Stir-Fry" },
  { weekNumber: 2, dayOfWeek: "THU", mealType: "DINNER", recipeName: "Garlic Lemon Shrimp & Broccoli" },
  { weekNumber: 2, dayOfWeek: "FRI", mealType: "DINNER", recipeName: "Lemon Yogurt Chicken Tenders" },
  { weekNumber: 2, dayOfWeek: "SAT", mealType: "DINNER", recipeName: "Ribeye Carne Asada" },
  { weekNumber: 2, dayOfWeek: "SUN", mealType: "DINNER", recipeName: "California Roll Bowls" },
  // Week 2 - Mom's Lunches
  { weekNumber: 2, dayOfWeek: "MON", mealType: "LUNCH", customMeal: "California Roll Salad", notes: "Leftover crab mix + cucumber from Sunday" },
  { weekNumber: 2, dayOfWeek: "TUE", mealType: "LUNCH", customMeal: "Tinga Tostada", notes: "Leftover chicken tinga on tostada" },
  { weekNumber: 2, dayOfWeek: "WED", mealType: "LUNCH", customMeal: "Chorizo Breakfast Wrap", notes: "Leftover chorizo & eggs in tortilla" },
  { weekNumber: 2, dayOfWeek: "THU", mealType: "LUNCH", customMeal: "Steak Stir-Fry Bowl", notes: "Leftover steak stir-fry" },
  { weekNumber: 2, dayOfWeek: "FRI", mealType: "LUNCH", customMeal: "Shrimp Salad", notes: "Leftover shrimp + broccoli" },
  { weekNumber: 2, dayOfWeek: "SAT", mealType: "LUNCH", customMeal: "Chicken Tenders", notes: "Leftover lemon yogurt tenders" },
  { weekNumber: 2, dayOfWeek: "SUN", mealType: "LUNCH", customMeal: "Carne Asada Salad", notes: "Leftover ribeye sliced over greens" },

  // Week 3 (New Flavors) - Dinners
  { weekNumber: 3, dayOfWeek: "MON", mealType: "DINNER", recipeName: "Pollo Pibil" },
  { weekNumber: 3, dayOfWeek: "TUE", mealType: "DINNER", recipeName: "Mexican Espagueti Rojo" },
  { weekNumber: 3, dayOfWeek: "WED", mealType: "DINNER", recipeName: "Pork Chops Al Pastor" },
  { weekNumber: 3, dayOfWeek: "THU", mealType: "DINNER", recipeName: "Bean & Cheese Enchiladas" },
  { weekNumber: 3, dayOfWeek: "FRI", mealType: "DINNER", recipeName: "Fish Tacos" },
  { weekNumber: 3, dayOfWeek: "SAT", mealType: "DINNER", recipeName: "Crispy Chicken Thighs" },
  { weekNumber: 3, dayOfWeek: "SUN", mealType: "DINNER", recipeName: "California Roll Bowls" },
  // Week 3 - Mom's Lunches
  { weekNumber: 3, dayOfWeek: "MON", mealType: "LUNCH", customMeal: "California Roll Salad", notes: "Leftover crab mix + cucumber from Sunday" },
  { weekNumber: 3, dayOfWeek: "TUE", mealType: "LUNCH", customMeal: "Pibil Chicken Salad", notes: "Leftover achiote chicken over greens" },
  { weekNumber: 3, dayOfWeek: "WED", mealType: "LUNCH", customMeal: "Pasta with Meat Sauce", notes: "Leftover espagueti rojo" },
  { weekNumber: 3, dayOfWeek: "THU", mealType: "LUNCH", customMeal: "Pork Al Pastor Salad", notes: "Leftover pork sliced thin for salad or sandwich" },
  { weekNumber: 3, dayOfWeek: "FRI", mealType: "LUNCH", customMeal: "Enchiladas", notes: "Leftover bean & cheese enchiladas" },
  { weekNumber: 3, dayOfWeek: "SAT", mealType: "LUNCH", customMeal: "Fish Salad", notes: "Leftover fish + cabbage slaw" },
  { weekNumber: 3, dayOfWeek: "SUN", mealType: "LUNCH", customMeal: "Crispy Chicken Salad", notes: "Leftover chicken thigh meat over greens" },

  // Week 4 (Asian Fusion) - Dinners
  { weekNumber: 4, dayOfWeek: "MON", mealType: "DINNER", recipeName: "Soy Ginger Chicken Thighs" },
  { weekNumber: 4, dayOfWeek: "TUE", mealType: "DINNER", recipeName: "Vietnamese Garlic Noodles" },
  { weekNumber: 4, dayOfWeek: "WED", mealType: "DINNER", recipeName: "Beef & Broccoli Stir Fry" },
  { weekNumber: 4, dayOfWeek: "THU", mealType: "DINNER", recipeName: "Eggs & Avocado Toast Bar" },
  { weekNumber: 4, dayOfWeek: "FRI", mealType: "DINNER", recipeName: "Egg Roll in a Bowl" },
  { weekNumber: 4, dayOfWeek: "SAT", mealType: "DINNER", customMeal: "Leftovers / Buffet Night", notes: "Clear the fridge! Dad: steak/chicken leftovers or omelet. Kids: Mac & Cheese or Quesadillas" },
  { weekNumber: 4, dayOfWeek: "SUN", mealType: "DINNER", recipeName: "California Roll Bowls" },
  // Week 4 - Mom's Lunches
  { weekNumber: 4, dayOfWeek: "MON", mealType: "LUNCH", customMeal: "California Roll Salad", notes: "Leftover crab mix + cucumber from Sunday" },
  { weekNumber: 4, dayOfWeek: "TUE", mealType: "LUNCH", customMeal: "Ginger Chicken + Bok Choy", notes: "Leftover soy ginger chicken thighs" },
  { weekNumber: 4, dayOfWeek: "WED", mealType: "LUNCH", customMeal: "Garlic Noodles + Protein", notes: "Leftover Vietnamese garlic noodles" },
  { weekNumber: 4, dayOfWeek: "THU", mealType: "LUNCH", customMeal: "Beef & Broccoli", notes: "Leftover stir fry" },
  { weekNumber: 4, dayOfWeek: "FRI", mealType: "LUNCH", customMeal: "Hard Boiled Eggs / Tuna", notes: "Pack eggs or tuna salad (no leftovers from toast night)" },
  { weekNumber: 4, dayOfWeek: "SAT", mealType: "LUNCH", customMeal: "Egg Roll Bowl", notes: "Leftover crack slaw" },
  { weekNumber: 4, dayOfWeek: "SUN", mealType: "LUNCH", customMeal: "Buffet Leftovers", notes: "Whatever remains from Saturday's buffet night" },
];

// Family dietary preferences
const dietaryPreferences = [
  {
    memberName: "Dad",
    targetCalories: 1650,
    targetProtein: 150,
    restrictions: ["low-carb"],
    preferences: ["high-protein", "18:6-fasting"],
    fastingSchedule: "18:6",
    notes: "Breaks fast at 2 PM. Prefer low-carb substitutes (cabbage, zucchini noodles instead of rice/pasta)",
  },
  {
    memberName: "Mom",
    targetCalories: 1200,
    targetProtein: null,
    restrictions: ["no-spinach"],
    preferences: ["loves-chicken-caesar"],
    fastingSchedule: null,
    notes: "Loves Chicken Caesar salad. Absolutely no spinach! Use romaine only.",
  },
  {
    memberName: "Miguelito",
    targetCalories: null,
    targetProtein: null,
    restrictions: ["mild-spice"],
    preferences: ["soft-tacos", "rice"],
    fastingSchedule: null,
    notes: "5 years old. School Mon-Fri (dinner at home only). Remove kids portion before adding spicy ingredients.",
  },
  {
    memberName: "Maggie",
    targetCalories: null,
    targetProtein: null,
    restrictions: ["mild-spice"],
    preferences: ["small-portions", "mashed-textures"],
    fastingSchedule: null,
    notes: "3 years old. School Tue/Fri. Cut food small, mash beans if preferred. Help with drumstick meat.",
  },
];

async function seedMeals() {
  console.log("🍽️ Seeding meal planning data...");

  // Create recipes
  console.log("📖 Creating recipes...");
  const recipeMap = new Map<string, string>();

  for (const recipeData of recipes) {
    const existing = await prisma.recipe.findFirst({
      where: { name: recipeData.name },
    });

    if (existing) {
      recipeMap.set(recipeData.name, existing.id);
      console.log(`  ⏭️ Recipe already exists: ${recipeData.name}`);
      continue;
    }

    const recipe = await prisma.recipe.create({
      data: {
        name: recipeData.name,
        description: recipeData.description,
        cuisine: recipeData.cuisine,
        icon: recipeData.icon,
        prepTime: recipeData.prepTime,
        cookTime: recipeData.cookTime,
        servings: recipeData.servings,
        difficulty: recipeData.difficulty,
        ingredients: JSON.stringify(recipeData.ingredients),
        instructions: JSON.stringify(recipeData.instructions),
        tags: JSON.stringify(recipeData.tags),
        mealTypes: JSON.stringify(recipeData.mealTypes),
      },
    });
    recipeMap.set(recipeData.name, recipe.id);
    console.log(`  ✅ Created recipe: ${recipeData.name}`);
  }

  // Create meal plan items
  console.log("📅 Creating meal plan...");
  for (const mealData of mealPlanData) {
    const recipeId = mealData.recipeName ? recipeMap.get(mealData.recipeName) : null;

    await prisma.mealPlanItem.upsert({
      where: {
        weekNumber_dayOfWeek_mealType: {
          weekNumber: mealData.weekNumber,
          dayOfWeek: mealData.dayOfWeek,
          mealType: mealData.mealType,
        },
      },
      update: {
        recipeId,
        customMeal: mealData.customMeal || null,
        notes: mealData.notes || null,
      },
      create: {
        weekNumber: mealData.weekNumber,
        dayOfWeek: mealData.dayOfWeek,
        mealType: mealData.mealType,
        recipeId,
        customMeal: mealData.customMeal || null,
        notes: mealData.notes || null,
      },
    });
  }
  console.log(`  ✅ Created ${mealPlanData.length} meal plan items`);

  // Create dietary preferences for family members
  console.log("🥗 Setting dietary preferences...");
  for (const prefData of dietaryPreferences) {
    const member = await prisma.familyMember.findFirst({
      where: { name: prefData.memberName },
    });

    if (!member) {
      console.log(`  ⚠️ Family member not found: ${prefData.memberName}`);
      continue;
    }

    await prisma.dietaryPreference.upsert({
      where: { familyMemberId: member.id },
      update: {
        targetCalories: prefData.targetCalories,
        targetProtein: prefData.targetProtein,
        restrictions: JSON.stringify(prefData.restrictions),
        preferences: JSON.stringify(prefData.preferences),
        fastingSchedule: prefData.fastingSchedule,
        notes: prefData.notes,
      },
      create: {
        familyMemberId: member.id,
        targetCalories: prefData.targetCalories,
        targetProtein: prefData.targetProtein,
        restrictions: JSON.stringify(prefData.restrictions),
        preferences: JSON.stringify(prefData.preferences),
        fastingSchedule: prefData.fastingSchedule,
        notes: prefData.notes,
      },
    });
    console.log(`  ✅ Set preferences for: ${prefData.memberName}`);
  }

  console.log("🎉 Meal planning data seeded successfully!");
}

// Run if called directly
seedMeals()
  .catch((e) => {
    console.error("Error seeding meals:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { seedMeals };
