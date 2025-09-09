// Add your own seed recipes here. These will be merged with built-in seeds
// and will persist across app updates. Keep each recipe unique by title.
//
// Quick helper: use makeSeedRecipe to build a recipe with generated ids.
// Example (uncomment and adjust):
// export const EXTRA_SEEDED_RECIPES: Recipe[] = [
//   makeSeedRecipe(
//     'Example Keto Dish',
//     [
//       ['Olive oil', '1 tbsp'],
//       ['Chicken thighs', '400 g'],
//     ],
//     'Cook chicken in oil until done. Serve hot.',
//     2,
//     ['Keto']
//   ),
// ];

export type Ingredient = {
  id: string;
  name: string;
  amount: string;
};

export type Recipe = {
  id: string;
  title: string;
  ingredients: Ingredient[];
  instructions?: string;
  imageUri?: string;
  dateCreated: string;
  tags?: string[];
  serves?: number;
};

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export function makeSeedRecipe(
  title: string,
  ingredients: Array<[name: string, amount: string]>,
  instructions: string,
  serves?: number,
  tags: string[] = ['Keto']
): Recipe {
  return {
    id: 'seed-' + slugify(title),
    title,
    ingredients: ingredients.map(([name, amount], i) => ({ id: `i-${i + 1}` , name, amount })),
    instructions,
    dateCreated: new Date().toISOString(),
    serves,
    tags,
  };
}

// Start with an empty list; paste your recipes here.
export const EXTRA_SEEDED_RECIPES: Recipe[] = [
  // Quick & Easy Pho Bo (keto zoodle version)
  makeSeedRecipe(
    'Quick & Easy Pho Bo',
    [
      ['Star anise (whole)', '2 each'],
      ['Cloves (whole)', '2 each'],
      ['Cinnamon sticks', '2 each'],
      ['Black peppercorns (whole)', '2 tsp'],
      ['Coriander seeds (whole)', '2 tsp'],
      ['Beef stock (best quality)', '750 ml'],
      ['Ginger (thumb-size), peeled and sliced', '1 piece'],
      ['Garlic clove, sliced', '1 each'],
      ['Lard', '1 tsp'],
      ['Rump steaks (approx. 180 g each)', '2 each'],
      ['Fish sauce', '2 tsp'],
      ['Lime juice', '1 each'],
      ['Courgette noodles', '200 g'],
      // To serve
      ['Beansprouts', '40 g'],
      ['Spring onions, sliced', '2 each'],
      ['Fresh mint leaves (small handful)', 'to taste'],
      ['Fresh coriander leaves (small handful)', 'to taste'],
      ['Red chilli, thinly sliced', '1 each'],
    ],
    'Simmer spices in stock 10 min to infuse, then strain. Sear sliced steak quickly in a little lard. Add aromatics, fish sauce and lime to the hot broth, pour over courgette noodles and top with steak and fresh garnishes.',
    2,
    ['Keto']
  ),

  // Mediterranean Chicken with Lemon & Oregano
  makeSeedRecipe(
    'Mediterranean Chicken with Lemon & Oregano',
    [
      ['Chicken thighs (large, bone-in, skin-on)', '6 each (~170 g/6 oz each)'],
      ['Cauliflower florets', '600 g'],
      ['Dried oregano', '1 tsp'],
      ['Garlic cloves, very thinly sliced', '2 each'],
      ['Lemons', '2 each'],
      ['Cherry tomatoes, halved', '100 g'],
      ['Best-quality black olives, pitted and sliced', '50 g'],
      ['Unsalted butter', '30 g'],
      ['Salt', 'to taste'],
      ['Freshly ground black pepper', 'to taste'],
      // To serve
      ['Salt flakes (finishing)', 'pinch'],
      ['Fresh oregano leaves, roughly chopped', 'small handful'],
      ['Fresh flat-leaf parsley, roughly chopped', 'small handful'],
      ['Finely grated lemon zest', 'from 1 lemon'],
    ],
    'Heat oven to 200°C/180°C fan. Season chicken with salt, pepper and half the oregano. Melt butter in a wide ovenproof pan or tray, then toss cauliflower, garlic, tomatoes and olives in the butter with a big pinch of salt and most of the lemon zest. Squeeze over the juice of 1 lemon and toss again. Nestle chicken thighs on top (skin-side up) and add the remaining oregano and a few lemon wedges from the second lemon. Roast 40–50 minutes until the chicken skin is crisp, chicken is cooked through and cauliflower is tender and caramelised. Finish with chopped oregano and parsley, remaining zest, a squeeze of lemon and a pinch of salt flakes to taste.',
    6,
    ['Mediterranean']
  ),

  // Fresh Green Chicken Curry
  makeSeedRecipe(
    'Fresh Green Chicken Curry',
    [
      // Green chilli paste
      ['Green chillies, deseeded and chopped', '3–4 each'],
      ['Onion, roughly chopped', '1/2 each'],
      ['Ginger, peeled and chopped', 'thumb-sized piece'],
      ['Garlic cloves, roughly chopped', '2 each'],
      ['Lemongrass stalk, roughly chopped (tender inner part)', '1 each'],
      ['Fish sauce', '1 tsp'],
      ['Ground coriander', '1 tsp'],
      ['Ground cumin', '1/2 tsp'],
      ['Fresh coriander leaves', 'small handful'],
      ['Black pepper, freshly cracked', 'generous pinch'],
      ['Lime, finely grated zest and juice', '1 each'],
      // For the curry
      ['Chicken thighs (skinless, deboned), chopped', '8 each (~850 g total)'],
      ['Coconut oil', '1 tbsp'],
      ['Lime juice (extra)', 'generous squeeze, to taste'],
      ['Spring onions, thickly sliced', '4 each'],
      ['Full-fat coconut milk', '400 ml'],
      ['Kaffir lime leaves (fresh or dried)', '2 each'],
      ['Fish sauce (for seasoning)', 'to taste, optional'],
      ['Salt', 'to taste'],
      // To serve
      ['Red chilli, thinly sliced', '1 each'],
      ['Fresh coriander, roughly chopped', 'small handful'],
    ],
    'Blitz the paste ingredients in a small processor or with a stick blender until smooth. Heat coconut oil in a wide pan over medium heat, cook the paste 2–3 minutes until fragrant. Add chopped chicken and spring onions, stir to coat and cook until just turning opaque. Pour in coconut milk, add kaffir lime leaves and a squeeze of lime; simmer gently 12–15 minutes until the chicken is cooked and the sauce slightly thickened. Season with salt and a few drops of fish sauce to taste. Serve topped with sliced red chilli and coriander, with extra lime on the side.',
    4,
    ['Thai', 'Curry']
  ),

  // Chilli con Carne (keto)
  makeSeedRecipe(
    'Chilli con Carne (Keto)',
    [
      ['Lard', '2 tsp'],
      ['Onion, diced small', '1/2 medium'],
      ['Green pepper, diced small', '1 each'],
      ['Mushrooms, chopped small', '100 g'],
      ['Garlic cloves, thinly sliced', '3 each'],
      ['Ground cumin', '2 tbsp'],
      ['Ground coriander', '2 tsp'],
      ['Cayenne pepper', '1 tsp'],
      ['Red wine vinegar', '1 tbsp'],
      ['Minced beef (20% fat)', '650 g'],
      ['Chopped tomatoes', '400 g'],
      ['Beef stock (best quality)', '300 ml'],
      ['Salt', 'to taste'],
      ['Black pepper', 'to taste'],
      // To serve
      ['Soured cream', '100 g'],
      ['Cheddar (extra mature, grated)', '60 g'],
      ['Flat-leaf parsley, finely chopped', 'handful'],
      ['Red chillies, finely sliced', '1-2 each'],
    ],
    'Brown veg in lard, add spices and vinegar. Fry beef until coloured, add tomatoes and stock, then simmer until thick and rich. Adjust seasoning and serve with toppings.',
    4,
    ['Keto']
  ),

  // Monnie's Meatball Marinara
  makeSeedRecipe(
    "Monnie's Meatball Marinara",
    [
      ['Minced beef (20% fat)', '650 g'],
      ['Pesto', '65 g'],
      ['Chia seeds, ground', '30 g'],
      ['Egg, whisked', '1 large'],
      ['Lard', '2 tsp'],
      ['Dry red wine', '60 ml'],
      ['Roasted Tomato Marinara Sauce', '450 g'],
      ['Dried oregano', '1/2 tsp'],
      // To serve
      ['Chilli-infused olive oil (optional)', 'to taste'],
      ['Cheddar (extra mature), grated', '60 g'],
      ['Parmesan, finely grated', '30 g'],
      ['Flat-leaf parsley, finely chopped', 'small handful'],
      ['Black pepper', 'to taste'],
    ],
    'Combine beef, pesto, chia and egg, form meatballs and brown in lard. Deglaze with red wine, add marinara and oregano, then simmer until cooked through. Finish with cheese, parsley and pepper.',
    4,
    ['Keto']
  ),

  // Spicy Cottage Pie
  makeSeedRecipe(
    'Spicy Cottage Pie (Cauli Mash)',
    [
      // Mash
      ['Cauliflower florets', '500 g'],
      ['Full-fat cream cheese', '50 g'],
      ['Dijon mustard', '1 tbsp'],
      ['Unsalted butter', '2 tsp'],
      ['White pepper (ground)', 'to taste'],
      ['Salt', 'to taste'],
      // Filling
      ['Lard', '2 tsp'],
      ['Onion, finely chopped', '1 each'],
      ['Mushrooms, finely chopped', '120 g'],
      ['Garlic cloves, very thinly sliced', '2 each'],
      ['Red wine vinegar', '2 tbsp'],
      ['Minced beef (20% fat)', '500 g'],
      ['Dried thyme', '1/2 tsp'],
      ['Cayenne pepper (or chilli powder)', '2 tsp'],
      ['Chopped tomatoes', '200 g'],
      ['Cheddar, grated', '50 g'],
      ['Black pepper', 'to taste'],
      ['Flat-leaf parsley, finely chopped (to serve)', 'small handful'],
    ],
    'Make cauli mash: steam until tender, mash with cream cheese, mustard and butter; season. Cook filling with aromatics, beef, spices, vinegar and tomatoes until thick. Top with mash, sprinkle cheese, and bake until golden.',
    4,
    ['Keto']
  ),

  // Rib-eye Steaks with Chimichurri
  makeSeedRecipe(
    'Rib-eye Steaks with Chimichurri',
    [
      ['Rib-eye steaks (~200 g each)', '6 each'],
      ['Dried oregano', '1/2 tsp'],
      ['Salt', 'to taste'],
      ['Black pepper', 'to taste'],
      // Chimichurri
      ['Flat-leaf parsley (leaves)', '15 g'],
      ['Fresh oregano (leaves)', '1.5 tbsp'],
      ['Garlic cloves, roughly chopped', '2 each'],
      ['Red wine vinegar', '1 tbsp'],
      ['Dried chilli flakes', 'pinch'],
      ['Olive oil', '50 ml'],
    ],
    'Season steaks and cook to your liking. Blitz chimichurri ingredients to a coarse sauce and spoon over sliced steak.',
    6,
    ['Keto']
  ),

  // Ultimate Beef Stroganoff
  makeSeedRecipe(
    'Ultimate Beef Stroganoff',
    [
      ['Rump steaks (~140 g each)', '2 each'],
      ['Unsalted butter', '30 g'],
      ['Onion, finely chopped', '1/2 each'],
      ['Garlic cloves, crushed', '2 each'],
      ['Mushrooms, thickly sliced', '140 g'],
      ['Dry white wine', '60 ml'],
      ['Beef stock (best quality)', '150 ml'],
      ['Double cream', '150 ml'],
      ['Dijon mustard', '1 tsp'],
      ['Salt', 'to taste'],
      ['Black pepper', 'to taste'],
      ['Flat-leaf parsley, finely chopped (to serve)', 'small handful'],
    ],
    'Sear steak strips in butter, set aside. Soften onion and mushrooms, deglaze with wine, add stock, cream and mustard, then return beef briefly. Season and finish with parsley.',
    2,
    ['Keto']
  ),

  // Pork Belly with Red Onion Relish & Keto Gravy
  makeSeedRecipe(
    'Pork Belly with Red Onion Relish & Keto Gravy',
    [
      // Pickled onion
      ['Red onion, very thinly sliced', '1 each'],
      ['Red wine vinegar', '3 tbsp'],
      ['Fresh mint, finely chopped', 'handful'],
      ['Flat-leaf parsley, finely chopped', 'handful'],
      // Pork and gravy
      ['Boneless pork belly, skin scored', '1.1 kg'],
      ['Salt flakes', 'generous pinch'],
      ['Fennel seeds, lightly crushed', '2 tsp'],
      ['Onions, very thinly sliced', '2 each'],
      ['Garlic cloves, very thinly sliced', '3 each'],
      ['White wine vinegar', '1 tbsp'],
      ['Chicken stock (warm, best quality)', '700 ml'],
    ],
    'Slow-roast seasoned pork belly over onions and fennel until tender with crisp skin. Deglaze the pan with vinegar and stock for a rich keto gravy. Serve with the quick pickled red onion.',
    5,
    ['Keto']
  ),

  // Cauliflower Cheese Bake (side)
  makeSeedRecipe(
    'Cauliflower Cheese Bake',
    [
      ['Cauliflower florets, trimmed', '750 g'],
      ['Double cream', '420 ml'],
      ['Ground nutmeg', 'generous pinch'],
      ['Garlic cloves, smashed', '3 each'],
      ['Cheddar (extra mature), grated', '100 g'],
      ['Flat-leaf parsley, finely chopped (to serve)', 'small handful'],
      ['Ground white pepper', 'to taste'],
      ['Salt flakes', 'to taste'],
      ['Black pepper', 'to taste'],
    ],
    'Simmer cream with garlic and nutmeg, then toss with just-tender cauliflower and cheese. Bake until bubbling and golden; finish with parsley and seasonings.',
    6,
    ['Keto']
  ),
];
