import AsyncStorage from '@react-native-async-storage/async-storage';
// EXTRA_SEEDED_RECIPES inlined from extra-seeds.ts (file now exports empty list)
const EXTRA_SEEDED_RECIPES: Recipe[] = [
  // Quick & Easy Pho Bo (keto zoodle version)
  {
    id: 'seed-quick-easy-pho-bo',
    title: 'Quick & Easy Pho Bo',
    ingredients: [
  { id: 'i-1', name: 'Star Anise', amount: '2' },
  { id: 'i-2', name: 'Cloves', amount: '2' },
  { id: 'i-3', name: 'Cinnamon Sticks', amount: '2' },
    { id: 'i-4', name: 'Black Peppercorns', amount: '2 tsp' },
    { id: 'i-5', name: 'Coriander Seeds', amount: '2 tsp' },
  { id: 'i-6', name: 'Beef Stock', amount: '750 ml' },
  { id: 'i-7', name: 'Ginger', amount: '20 g' },
  { id: 'i-8', name: 'Garlic', amount: '1' },
    { id: 'i-9', name: 'Lard', amount: '1 tsp' },
  { id: 'i-10', name: 'Rump Steaks', amount: '2' },
    { id: 'i-11', name: 'Fish Sauce', amount: '2 tsp' },
  { id: 'i-12', name: 'Lime Juice', amount: '1' },
    { id: 'i-13', name: 'Courgette', amount: '2' },
    { id: 'i-14', name: 'Beansprouts', amount: '40 g' },
  { id: 'i-15', name: 'Spring Onions', amount: '2' },
  { id: 'i-16', name: 'Mint', amount: '5 g' },
  { id: 'i-17', name: 'Coriander', amount: '5 g' },
  { id: 'i-18', name: 'Chilli', amount: '1' },
    ],
    instructions: 'Simmer spices in stock 10 min to infuse, then strain. Sear sliced steak quickly in a little lard. Add aromatics, fish sauce and lime to the hot broth, pour over courgette noodles and top with steak and fresh garnishes.',
    dateCreated: '2025-01-02T09:00:00.000Z',
    serves: 2,
    tags: ['Keto']
  },
  // Mediterranean Chicken with Lemon & Oregano
  {
    id: 'seed-mediterranean-chicken-with-lemon-oregano',
    title: 'Mediterranean Chicken with Lemon & Oregano',
    ingredients: [
  { id: 'i-1', name: 'Chicken Thighs', amount: '6' },
  { id: 'i-2', name: 'Cauliflower Florets', amount: '600 g' },
  { id: 'i-3', name: 'Dried Oregano', amount: '1 tsp' },
  { id: 'i-4', name: 'Garlic', amount: '2' },
  { id: 'i-5', name: 'Lemon', amount: '3' },
  { id: 'i-6', name: 'Cherry Tomatoes', amount: '100 g' },
  { id: 'i-7', name: 'Black Olives', amount: '50 g' },
  { id: 'i-8', name: 'Butter', amount: '30 g' },
  { id: 'i-9', name: 'Fresh Oregano', amount: '5 g' },
  { id: 'i-10', name: 'Parsley', amount: '5 g' },
    ],
    instructions: 'Heat oven to 200°C/180°C fan. Season chicken, roast over cauliflower, garlic, tomatoes and olives with butter, lemon juice and zest until chicken crisp and cauliflower caramelised. Finish with herbs, remaining zest and a pinch of salt flakes.',
    dateCreated: '2025-01-02T10:00:00.000Z',
    serves: 6,
    tags: ['Mediterranean']
  },
  // Fresh Green Chicken Curry
  {
    id: 'seed-fresh-green-chicken-curry',
    title: 'Fresh Green Chicken Curry',
    ingredients: [
  { id: 'i-1', name: 'Chilli', amount: '4' },
  { id: 'i-2', name: 'Onion', amount: '1/2' },
  { id: 'i-3', name: 'Ginger', amount: '20 g' },
  { id: 'i-4', name: 'Garlic', amount: '2' },
  { id: 'i-5', name: 'Lemongrass', amount: '1' },
  { id: 'i-6', name: 'Fish Sauce', amount: '1 tsp' },
  { id: 'i-7', name: 'Ground Coriander', amount: '1 tsp' },
  { id: 'i-8', name: 'Cumin', amount: '1/2 tsp' },
  { id: 'i-9', name: 'Coriander', amount: '5 g' },
  { id: 'i-10', name: 'Lime', amount: '1' },
  { id: 'i-11', name: 'Chicken Thighs', amount: '8' },
  { id: 'i-12', name: 'Coconut Oil', amount: '1 tbsp' },
  { id: 'i-13', name: 'Spring Onions', amount: '4' },
  { id: 'i-14', name: 'Coconut Milk', amount: '400 ml' },
  { id: 'i-15', name: 'Kaffir Lime Leaves', amount: '2' },
  { id: 'i-16', name: 'Chilli', amount: '1' },
    ],
    instructions: 'Blitz paste ingredients, fry in coconut oil. Add chicken & spring onions, then coconut milk, kaffir lime leaves and lime. Simmer until cooked, season, finish with chilli & coriander.',
    dateCreated: '2025-01-02T11:00:00.000Z',
    serves: 4,
    tags: ['Thai','Curry']
  },
  // Chilli con Carne (Keto)
  {
    id: 'seed-chilli-con-carne-keto',
    title: 'Chilli con Carne (Keto)',
    ingredients: [
  { id: 'i-1', name: 'Onion', amount: '0.5' },
  { id: 'i-2', name: 'Bell Pepper', amount: '1' },
  { id: 'i-3', name: 'Mushrooms', amount: '100 g' },
  { id: 'i-4', name: 'Garlic', amount: '3' },
  { id: 'i-5', name: 'Ground Cumin', amount: '2 tbsp' },
  { id: 'i-6', name: 'Ground Coriander', amount: '2 tsp' },
  { id: 'i-7', name: 'Cayenne Pepper', amount: '1 tsp' },
  { id: 'i-8', name: 'Red Wine Vinegar', amount: '1 tbsp' },
  { id: 'i-9', name: 'Minced Beef', amount: '650 g' },
  { id: 'i-10', name: 'Chopped Tomatoes Can', amount: '400 g' },
  { id: 'i-11', name: 'Beef Stock', amount: '300 ml' },
  { id: 'i-12', name: 'Soured Cream', amount: '100 g' },
  { id: 'i-13', name: 'Cheddar', amount: '60 g' },
  { id: 'i-14', name: 'Parsley', amount: '10 g' },
  { id: 'i-15', name: 'Chilli', amount: '2' },
    ],
    instructions: 'Brown vegetables in lard, add spices & vinegar. Fry beef, add tomatoes & stock, simmer until thick; season and serve with toppings.',
    dateCreated: '2025-01-02T12:00:00.000Z',
    serves: 4,
    tags: ['Keto']
  },
  // Monnie's Meatball Marinara
  {
    id: 'seed-monnie-meatball-marinara',
    title: "Monnie's Meatball Marinara",
    ingredients: [
    { id: 'i-1', name: 'Minced Beef', amount: '650 g' },
      { id: 'i-2', name: 'Pesto', amount: '65 g' },
    { id: 'i-3', name: 'Chia Seeds', amount: '30 g' },
  { id: 'i-4', name: 'Egg', amount: '1' },
      { id: 'i-5', name: 'Lard', amount: '2 tsp' },
    { id: 'i-6', name: 'Dry Red Wine', amount: '60 ml' },
    { id: 'i-7', name: 'Roasted Tomato Marinara Sauce', amount: '450 g' },
  { id: 'i-8', name: 'Dried Oregano', amount: '0.5 tsp' },
  { id: 'i-9', name: 'Chilli Infused Olive Oil', amount: '1 tsp' },
    { id: 'i-10', name: 'Cheddar', amount: '60 g' },
    { id: 'i-11', name: 'Parmesan', amount: '30 g' },
  { id: 'i-12', name: 'Parsley', amount: '5 g' },
  { id: 'i-13', name: 'Black Pepper', amount: '1 pinch' },
    ],
    instructions: 'Mix beef, pesto, chia & egg. Brown meatballs in lard, deglaze with wine, add marinara & oregano; simmer and finish with cheeses, parsley & pepper.',
    dateCreated: '2025-01-02T13:00:00.000Z',
    serves: 4,
    tags: ['Keto']
  },
  // Spicy Cottage Pie (Cauli Mash)
  {
    id: 'seed-spicy-cottage-pie-cauli-mash',
    title: 'Spicy Cottage Pie (Cauli Mash)',
    ingredients: [
    { id: 'i-1', name: 'Cauliflower Florets', amount: '500 g' },
    { id: 'i-2', name: 'Cream Cheese', amount: '50 g' },
    { id: 'i-3', name: 'Dijon Mustard', amount: '1 tbsp' },
    { id: 'i-4', name: 'Butter', amount: '2 tsp' },
  { id: 'i-5', name: 'White Pepper', amount: '1 pinch' },
  { id: 'i-6', name: 'Salt', amount: '1 pinch' },
      { id: 'i-7', name: 'Lard', amount: '2 tsp' },
    { id: 'i-8', name: 'Onion', amount: '1' },
    { id: 'i-9', name: 'Mushrooms', amount: '120 g' },
    { id: 'i-10', name: 'Garlic', amount: '2' },
    { id: 'i-11', name: 'Red Wine Vinegar', amount: '2 tbsp' },
    { id: 'i-12', name: 'Minced Beef', amount: '500 g' },
  { id: 'i-13', name: 'Dried Thyme', amount: '0.5 tsp' },
    { id: 'i-14', name: 'Cayenne Pepper', amount: '2 tsp' },
  { id: 'i-15', name: 'Chopped Tomatoes Can', amount: '200 g' },
    { id: 'i-16', name: 'Cheddar', amount: '50 g' },
  { id: 'i-17', name: 'Parsley', amount: '5 g' },
    ],
    instructions: 'Make cauli mash; cook filling with aromatics, beef, spices, vinegar & tomatoes. Top with mash, cheese and bake until golden; finish with parsley.',
    dateCreated: '2025-01-02T14:00:00.000Z',
    serves: 4,
    tags: ['Keto']
  },
  // Rib-eye Steaks with Chimichurri
  {
    id: 'seed-rib-eye-steaks-chimichurri',
    title: 'Rib-eye Steaks with Chimichurri',
    ingredients: [
  { id: 'i-1', name: 'Rib Eye Steaks', amount: '6' },
  { id: 'i-2', name: 'Parsley', amount: '15 g' },
  { id: 'i-3', name: 'Fresh Oregano', amount: '1.5 tbsp' },
  { id: 'i-4', name: 'Garlic', amount: '2' },
  { id: 'i-5', name: 'Red Wine Vinegar', amount: '1 tbsp' },
  { id: 'i-6', name: 'Chilli Flakes', amount: '1 pinch' },
  { id: 'i-7', name: 'Olive Oil', amount: '50 ml' },
    ],
    instructions: 'Season & cook steaks. Blitz herbs, garlic, vinegar, chilli & oil to a coarse sauce; spoon over sliced steak.',
    dateCreated: '2025-01-02T15:00:00.000Z',
    serves: 6,
    tags: ['Keto']
  },
  // Ultimate Beef Stroganoff
  {
    id: 'seed-ultimate-beef-stroganoff',
    title: 'Ultimate Beef Stroganoff',
    ingredients: [
  { id: 'i-1', name: 'Rump Steaks', amount: '2' },
    { id: 'i-2', name: 'Butter', amount: '30 g' },
  { id: 'i-3', name: 'Onion', amount: '0.5' },
  { id: 'i-4', name: 'Garlic', amount: '2' },
    { id: 'i-5', name: 'Mushrooms', amount: '140 g' },
    { id: 'i-6', name: 'Dry White Wine', amount: '60 ml' },
    { id: 'i-7', name: 'Beef Stock', amount: '150 ml' },
    { id: 'i-8', name: 'Double Cream', amount: '150 ml' },
    { id: 'i-9', name: 'Dijon Mustard', amount: '1 tsp' },
  { id: 'i-10', name: 'Parsley', amount: '5 g' },
    ],
    instructions: 'Sear steak strips, set aside. Soften onion & mushrooms, deglaze with wine, add stock, cream & mustard; return beef briefly and finish with parsley.',
    dateCreated: '2025-01-02T16:00:00.000Z',
    serves: 2,
    tags: ['Keto']
  },
  // Pork Belly with Red Onion Relish & Keto Gravy
  {
    id: 'seed-pork-belly-red-onion-relish-keto-gravy',
    title: 'Pork Belly with Red Onion Relish & Keto Gravy',
    ingredients: [
  { id: 'i-1', name: 'Red Onion', amount: '1' },
    { id: 'i-2', name: 'Red Wine Vinegar', amount: '3 tbsp' },
  { id: 'i-3', name: 'Mint', amount: '10 g' },
  { id: 'i-4', name: 'Parsley', amount: '10 g' },
  { id: 'i-5', name: 'Pork Belly', amount: '1100 g' },
  { id: 'i-6', name: 'Fennel Seeds', amount: '2 tsp' },
  { id: 'i-7', name: 'Onion', amount: '2' },
  { id: 'i-8', name: 'Garlic', amount: '3' },
    { id: 'i-9', name: 'White Wine Vinegar', amount: '1 tbsp' },
    { id: 'i-10', name: 'Chicken Stock', amount: '700 ml' },
    ],
    instructions: 'Slow-roast seasoned pork belly over onions & fennel until tender with crisp skin. Deglaze with vinegar & stock for gravy. Serve with quick pickled onion & herbs.',
    dateCreated: '2025-01-02T17:00:00.000Z',
    serves: 5,
    tags: ['Keto']
  },
  // Cauliflower Cheese Bake (side)
  {
    id: 'seed-cauliflower-cheese-bake',
    title: 'Cauliflower Cheese Bake',
    ingredients: [
  { id: 'i-1', name: 'Cauliflower', amount: '750 g' },
  { id: 'i-2', name: 'Double Cream', amount: '420 ml' },
  { id: 'i-3', name: 'Nutmeg', amount: '1 pinch' },
  { id: 'i-4', name: 'Garlic', amount: '3' },
  { id: 'i-5', name: 'Cheddar', amount: '100 g' },
  { id: 'i-6', name: 'Parsley', amount: '5 g' },
  // removed salt/pepper entries per sanitising rules
    ],
    instructions: 'Simmer cream with garlic & nutmeg, toss with just-tender cauliflower & cheese. Bake until bubbling & golden; finish with parsley & seasonings.',
    dateCreated: '2025-01-02T18:00:00.000Z',
    serves: 6,
    tags: ['Keto']
  },
];

// Local copies of shapes used by screens
export interface Ingredient {
  id: string;
  name: string;
  amount: string; // e.g., "2 cups", "1 tbsp", "200 g"
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: Ingredient[];
  instructions?: string;
  imageUri?: string;
  dateCreated: string; // ISO string
  tags?: string[]; // e.g., ['Keto','Mediterranean']
  serves?: number; // optional servings count
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Safe, generic sample data created for this app (not copied from any source)
export const SEEDED_RECIPES: Recipe[] = [
  {
    id: 'seed-leek-goats-cheese-barley-risotto',
    title: "Leek and Goat's Cheese Barley Risotto",
    ingredients: [
  { id: 'i-1', name: 'Olive Oil', amount: '1 tbsp' },
  { id: 'i-2', name: 'Onion', amount: '1' },
  { id: 'i-3', name: 'Garlic', amount: '2' },
  { id: 'i-4', name: 'Pearl Barley', amount: '120 g' },
  { id: 'i-5', name: 'Bay Leaf', amount: '1' },
  { id: 'i-6', name: 'Vegetable Stock Cube', amount: '1' },
  { id: 'i-7', name: 'Leek', amount: '2' },
  { id: 'i-8', name: 'Parmesan', amount: '50 g' },
  { id: 'i-9', name: 'Goats Cheese', amount: '100 g' },
  { id: 'i-10', name: 'Thyme', amount: '5 g' },
    ],
    instructions: 'Heat oil in large non-stick saucepan, gently fry onion 3–5 min until softened and lightly browned, stirring regularly. Add garlic, cook a few seconds. Add barley and bay leaf. Crumble over stock cube, add 900ml cold water, cover loosely, bring to boil. Reduce to gentle simmer, cook 40–50 min until tender, stirring occasionally. Add extra water if barley absorbs more than expected. Add leeks, cook 5 min more until tender, stir in Parmesan, season to taste. Spoon onto plates, crumble goat’s cheese on top, sprinkle with thyme leaves to serve.',
  dateCreated: '2025-01-13T19:00:00.000Z',
  },
  {
    id: 'seed-roasted-vegetable-pasta-mozzarella',
    title: 'Roasted Vegetable Pasta with Mozzarella',
    ingredients: [
  { id: 'i-1', name: 'Bell Pepper', amount: '2' },
  { id: 'i-2', name: 'Courgette', amount: '1' },
  { id: 'i-3', name: 'Red Onion', amount: '1' },
  { id: 'i-4', name: 'Olive Oil', amount: '2 tbsp' },
  { id: 'i-5', name: 'Cherry Tomatoes', amount: '12' },
  { id: 'i-6', name: 'Chilli Flakes', amount: '0.25 tsp' },
  { id: 'i-7', name: 'Wholewheat Pasta', amount: '50 g' },
  { id: 'i-8', name: 'Spinach', amount: '50 g' },
  { id: 'i-9', name: 'Mozzarella', amount: '125 g' },
    ],
    instructions: 'Preheat oven to 200°C/fan 180°C/Gas 6. Place peppers, courgette, onion in large baking tray. Drizzle with oil, season with salt and pepper, toss. Roast 20 min. Add tomatoes, sprinkle with chilli flakes, roast 10 min more. Meanwhile, cook pasta in boiling water 10–12 min until tender, drain. Add spinach, roasted veg, mozzarella to pan, toss, season, stir 1 min until mozzarella melts and spinach wilts.',
  dateCreated: '2025-01-13T20:00:00.000Z',
  },
  {
    id: 'seed-lamb-saag',
    title: 'Lamb Saag',
    ingredients: [
  { id: 'i-1', name: 'Onion', amount: '1' },
  { id: 'i-2', name: 'Lamb Neck Fillets', amount: '500 g' },
  { id: 'i-3', name: 'Curry Paste', amount: '60 g' },
  { id: 'i-4', name: 'Lentils', amount: '50 g' },
  { id: 'i-5', name: 'Spinach', amount: '200 g' },
    ],
    instructions: 'Preheat oven to 180°C/fan 160°C/Gas 4. Heat oil in flame-proof casserole, gently fry onion 5 min until softened. Add lamb, season, cook 3 min until coloured, turning. Stir in curry paste, cook 1 min. Add lentils, spinach, stir in 500ml water. Bring to boil, cover, cook in oven 1–1¼ hours until lamb tender and sauce thick.',
  dateCreated: '2025-01-13T21:00:00.000Z',
  },
  {
    id: 'seed-courgetti-spaghetti-pine-nuts-spinach-pancetta',
    title: 'Courgetti Spaghetti with Pine Nuts, Spinach and Pancetta',
    ingredients: [
  { id: 'i-1', name: 'Wholewheat Spaghetti', amount: '80 g' },
  { id: 'i-2', name: 'Courgette', amount: '1' },
  { id: 'i-3', name: 'Pine Nuts', amount: '20 g' },
  { id: 'i-4', name: 'Bacon/Pancetta', amount: '50 g' },
  { id: 'i-5', name: 'Olive Oil', amount: '1 tbsp' },
  { id: 'i-6', name: 'Spinach', amount: '150 g' },
  { id: 'i-7', name: 'Feta', amount: '80 g' },
    ],
    instructions: 'Cook spaghetti in boiling water 10–12 min until tender. Add spiralized courgette, stir, drain, rinse under cold tap. Toast pine nuts and lardons in pan with half oil 2–3 min until lightly browned, tip out. Add remaining oil and spinach, cook 1–2 min until soft. Crumble 2/3 feta over, cook until melted. Return spaghetti and courgetti, add spinach and feta sauce, toss over medium heat 1–2 min. Divide between bowls, crumble remaining feta, sprinkle pancetta and pine nuts.',
  dateCreated: '2025-01-13T22:00:00.000Z',
  },
  {
    id: 'seed-cheats-one-pot-cassoulet',
    title: "Cheat's One-pot Cassoulet",
    ingredients: [
  { id: 'i-1', name: 'Olive Oil', amount: '1 tbsp' },
  { id: 'i-2', name: 'Sausage', amount: '6' },
  { id: 'i-3', name: 'Onion', amount: '1' },
  { id: 'i-4', name: 'Bacon/Pancetta', amount: '100 g' },
  { id: 'i-5', name: 'Cannellini Beans', amount: '400 g' },
  { id: 'i-6', name: 'Chopped Tomatoes Can', amount: '400 g' },
  { id: 'i-7', name: 'Mixed Herbs', amount: '1 tsp' },
  { id: 'i-8', name: 'Parsley', amount: '15 g' },
    ],
    instructions: 'Heat oil in wide-based non-stick saucepan or flame-proof casserole, add sausages, cook 5 min until browned, remove. Add onion and pancetta, cook 3–5 min until golden. Cut sausages in half, return to pan, add beans, tomatoes, herbs. Stir in 150ml water, bring to simmer, cover, cook 18–20 min, stirring. Add extra water if sauce thickens. Season, stir in parsley to serve.',
  dateCreated: '2025-01-13T23:00:00.000Z',
  },
  {
    id: 'seed-chicken-tikka-masala',
    title: 'Chicken Tikka Masala',
    ingredients: [
  { id: 'i-1', name: 'Tikka Paste', amount: '1 tbsp' },
  { id: 'i-2', name: 'Greek Yoghurt', amount: '4 tbsp' },
  { id: 'i-3', name: 'Chicken Breast', amount: '2' },
  { id: 'i-4', name: 'Coconut Oil', amount: '1 tbsp' },
  { id: 'i-5', name: 'Coriander', amount: '5 g' },
  { id: 'i-6', name: 'Chilli', amount: '0.5' },
  { id: 'i-7', name: 'Onion', amount: '1' },
  { id: 'i-8', name: 'Garlic', amount: '2' },
  { id: 'i-9', name: 'Ginger', amount: '15 g' },
  { id: 'i-10', name: 'Tikka Paste', amount: '2 tbsp' },
  { id: 'i-11', name: 'Tomato Puree', amount: '1 tbsp' },
    ],
    instructions: 'Combine 1 tbsp curry paste, yoghurt, salt in bowl, add chicken, mix, marinate at least 1 hour. For sauce: heat oil in pan, fry onion 5 min, add garlic, ginger, 2 tbsp curry paste, cook 1½ min. Add 300ml water, tomato purée, bring to simmer, cook 5 min, blend smooth. Fry marinated chicken 3 min until browned, add sauce, cook 3–4 min until chicken cooked. Add water if sauce thickens. Serve with coriander and chilli.',
    dateCreated: '2025-01-14T00:00:00.000Z',
    tags: ['Keto']
  },
  {
    id: 'seed-' + slugify('Thai Pork Lettuce Cups'),
    title: 'Thai Pork Lettuce Cups',
    ingredients: [
  { id: 'i-1', name: 'Olive Oil', amount: '1 tbsp' },
  { id: 'i-2', name: 'Pork Mince', amount: '250 g' },
  { id: 'i-3', name: 'Lemongrass', amount: '1' },
  { id: 'i-4', name: 'Ginger', amount: '15 g' },
  { id: 'i-5', name: 'Garlic', amount: '2' },
  { id: 'i-6', name: 'Spring Onion', amount: '1' },
  { id: 'i-7', name: 'Baby Gem Lettuce', amount: '8' },
  { id: 'i-8', name: 'Lime Juice', amount: '1 tbsp' },
  { id: 'i-9', name: 'Fish Sauce', amount: '1 tbsp' },
  { id: 'i-10', name: 'Sriracha', amount: '1 tbsp' },
  { id: 'i-11', name: 'Coriander', amount: '5 g' },
    ],
    instructions:
      'Stir-fry pork with aromatics until cooked, toss with a simple lime–fish sauce dressing, and serve in crisp lettuce cups with herbs.',
  dateCreated: '2025-01-03T09:00:00.000Z',
    tags: ['Keto']
  },
  {
    id: 'seed-' + slugify('Pesto Courgetti Spaghetti with Red Pepper and Feta'),
    title: 'Pesto Courgetti Spaghetti with Red Pepper and Feta',
    ingredients: [
  { id: 'i-1', name: 'Olive Oil', amount: '2 tbsp' },
  { id: 'i-2', name: 'Jarred Red Pepper', amount: '2' },
  { id: 'i-3', name: 'Courgette', amount: '2' },
  { id: 'i-4', name: 'Pesto', amount: '2 tbsp' },
  { id: 'i-5', name: 'Feta', amount: '100 g' },
  { id: 'i-6', name: 'Pine Nuts', amount: '15 g' },
  { id: 'i-7', name: 'Basil', amount: '5 g' },
    ],
    instructions:
      'Warm peppers in oil, briefly sauté courgetti, then toss with pesto and feta. Finish with pine nuts and basil. Add cooked spaghetti if you want a larger portion.',
  dateCreated: '2025-01-04T09:00:00.000Z',
    tags: ['Keto']
  },
  {
    id: 'seed-' + slugify('Mixed Bean and Miso Salad with Chicken'),
    title: 'Mixed Bean and Miso Salad with Chicken',
    ingredients: [
  { id: 'i-1', name: 'Bell Pepper', amount: '1' },
  { id: 'i-2', name: 'Spring Onion', amount: '1' },
  { id: 'i-3', name: 'Edamame', amount: '100 g' },
  { id: 'i-4', name: 'Chicken', amount: '150 g' },
  { id: 'i-5', name: 'Mixed Beans', amount: '200 g' },
  { id: 'i-6', name: 'Spinach', amount: '50 g' },
  { id: 'i-7', name: 'Miso Dressing', amount: '15 g' },
    ],
    instructions:
      'Toss beans, chicken and vegetables with a light miso dressing until evenly coated. Serve as a hearty salad or lunchbox option.',
  dateCreated: '2025-01-05T09:00:00.000Z',
  },
  {
    id: 'seed-' + slugify('Breakfast Burrito'),
    title: 'Breakfast Burrito',
    ingredients: [
  { id: 'i-1', name: 'Sausage', amount: '1' },
  { id: 'i-2', name: 'Bacon', amount: '2 rashers' },
  { id: 'i-3', name: 'Mushroom', amount: '1' },
  { id: 'i-4', name: 'Cherry Tomatoes', amount: '2' },
  { id: 'i-5', name: 'Olive Oil', amount: '1 tsp' },
  { id: 'i-6', name: 'Egg', amount: '1' },
  { id: 'i-7', name: 'Iceberg Lettuce', amount: '2' },
  { id: 'i-8', name: 'Mayonnaise', amount: '0.5 tsp' },
  { id: 'i-9', name: 'Sriracha', amount: '0.25 tsp' },
    ],
    instructions:
      'Roast or pan-cook the meats and veg until done. Add egg, then assemble in stacked lettuce leaves with mayo and a touch of sriracha. Roll and serve.',
  dateCreated: '2025-01-06T09:00:00.000Z',
    tags: ['Keto']
  },
  {
    id: 'seed-' + slugify('One Pan Squeezed Sausage Casserole'),
    title: 'One Pan Squeezed Sausage Casserole',
    ingredients: [
  { id: 'i-1', name: 'Sausage', amount: '4' },
  { id: 'i-2', name: 'Onion', amount: '0.5' },
  { id: 'i-3', name: 'Olive Oil', amount: '2 tbsp' },
  { id: 'i-4', name: 'Butternut Squash', amount: '200 g' },
  { id: 'i-5', name: 'Thyme', amount: '0.5 tsp' },
  { id: 'i-6', name: 'Cavolo Nero', amount: '150 g' },
  { id: 'i-7', name: 'Cider Vinegar', amount: '1 tbsp' },
  { id: 'i-8', name: 'Chilli Flakes', amount: '0.25 tsp' },
    ],
    instructions:
      'Cut sausages into pieces, brown with onion and squash. Add thyme and greens, finish with vinegar for a hearty one-pan meal.',
  dateCreated: '2025-01-07T09:00:00.000Z',
    tags: ['Keto']
  },
  {
    id: 'seed-' + slugify('Chinese Pork Balls in Mushroom Miso Broth'),
    title: 'Chinese Pork Balls in Mushroom Miso Broth',
    ingredients: [
  { id: 'i-1', name: 'Pork Mince', amount: '250 g' },
  { id: 'i-2', name: 'Ginger', amount: '5 g' },
  { id: 'i-3', name: 'Chilli Flakes', amount: '1 tsp' },
  { id: 'i-4', name: 'Coriander', amount: '5 g' },
  { id: 'i-5', name: 'Sesame Oil', amount: '2 tsp' },
  { id: 'i-6', name: 'Mushroom', amount: '100 g' },
  { id: 'i-7', name: 'Olive Oil', amount: '1 tsp' },
  { id: 'i-8', name: 'White Miso', amount: '2 tbsp' },
  { id: 'i-9', name: 'Soy Sauce', amount: '2 tbsp' },
  { id: 'i-10', name: 'Pak Choi', amount: '1' },
  { id: 'i-11', name: 'Spring Onion', amount: '1' },
    ],
    instructions:
      'Form seasoned pork into balls and bake. Make umami-rich broth with mushrooms, miso and soy. Combine with greens for a satisfying soup.',
  dateCreated: '2025-01-08T09:00:00.000Z',
    tags: ['Keto']
  },
  {
    id: 'seed-' + slugify('Chicken Casserole with Chorizo, Thyme and Olives'),
    title: 'Chicken Casserole with Chorizo, Thyme and Olives',
    ingredients: [
  { id: 'i-1', name: 'Chicken Thighs', amount: '4' },
  { id: 'i-2', name: 'Lemon', amount: '1' },
  { id: 'i-3', name: 'Olive Oil', amount: '2 tbsp' },
  { id: 'i-4', name: 'Onion', amount: '1' },
  { id: 'i-5', name: 'Chorizo', amount: '50 g' },
  { id: 'i-6', name: 'Garlic', amount: '5' },
  { id: 'i-7', name: 'White Beans', amount: '400 g' },
  { id: 'i-8', name: 'Thyme', amount: '0.25 tsp' },
  { id: 'i-9', name: 'Olives', amount: '50 g' },
  { id: 'i-10', name: 'Tenderstem Broccoli', amount: '200 g' },
    ],
    instructions:
      'Brown chicken, sauté chorizo and onions, then slow-cook with beans, thyme, olives and whole garlic. Finish with broccoli for a Mediterranean feast.',
  dateCreated: '2025-01-09T09:00:00.000Z',
    tags: ['Keto']
  },
  {
    id: 'seed-' + slugify('Piri Piri Roast Chicken with Jalapeño Yoghurt'),
    title: 'Piri Piri Roast Chicken with Jalapeño Yoghurt',
    ingredients: [
  { id: 'i-1', name: 'Jarred Red Pepper', amount: '1 (70 g)' },
  { id: 'i-2', name: 'Piri Piri Seasoning', amount: '1 tbsp' },
  { id: 'i-3', name: 'Olive Oil', amount: '2 tbsp' },
  { id: 'i-4', name: 'Soy Sauce', amount: '1 tbsp' },
  { id: 'i-5', name: 'Whole Chicken', amount: '1500 g' },
  { id: 'i-6', name: 'Lemon', amount: '1' },
  { id: 'i-7', name: 'Jalapeño', amount: '30 g' },
  { id: 'i-8', name: 'Greek Yoghurt', amount: '125 g' },
  { id: 'i-9', name: 'Coriander', amount: '10 g' },
    ],
    instructions:
      'Marinate chicken in piri piri blend, roast with lemon. Serve with cooling jalapeño yoghurt sauce for a spicy-fresh combination.',
  dateCreated: '2025-01-10T09:00:00.000Z',
    tags: ['Keto']
  },
  {
    id: 'seed-' + slugify('Keto-fried Chicken'),
    title: 'Keto-fried Chicken',
    ingredients: [
  { id: 'i-1', name: 'Ground Almonds', amount: '80 g' },
  { id: 'i-2', name: 'Cayenne Pepper', amount: '0.5 tsp' },
  { id: 'i-3', name: 'Egg', amount: '1' },
  { id: 'i-4', name: 'Chicken Thighs', amount: '4' },
  { id: 'i-5', name: 'Olive Oil', amount: '1 tbsp' },
    ],
    instructions:
      'Coat chicken in spiced almond mixture, dip in egg, then fry until golden and crispy. A low-carb take on fried chicken.',
  dateCreated: '2025-01-11T09:00:00.000Z',
  },
  {
    id: 'seed-' + slugify('White Fish with Herby Green Dressing and Lentils'),
    title: 'White Fish with Herby Green Dressing and Lentils',
    ingredients: [
  { id: 'i-1', name: 'White Fish', amount: '2' },
  { id: 'i-2', name: 'Olive Oil', amount: '0.5 tbsp' },
  { id: 'i-3', name: 'Lentils', amount: '250 g' },
  { id: 'i-4', name: 'Rosemary', amount: '1 sprig (optional)' },
  { id: 'i-5', name: 'Parsley', amount: '20 g' },
  { id: 'i-6', name: 'Dill', amount: '20 g' },
  { id: 'i-7', name: 'Anchovy', amount: '3 fillets' },
  { id: 'i-8', name: 'Cider Vinegar', amount: '1 tbsp' },
    ],
    instructions:
      'Pan-fry seasoned fish fillets. Blend herbs with anchovies and vinegar for a zesty green dressing. Serve over warm lentils.',
  dateCreated: '2025-01-12T09:00:00.000Z',
  },
  {
    id: 'seed-' + slugify('Made-in-Minutes Goan Prawn Curry with Spinach'),
    title: 'Made-in-Minutes Goan Prawn Curry with Spinach',
    ingredients: [
  { id: 'i-1', name: 'Leek', amount: '1' },
  { id: 'i-2', name: 'Garlic', amount: '3' },
  { id: 'i-3', name: 'Ginger', amount: '20 g' },
  { id: 'i-4', name: 'Cumin', amount: '2 tsp' },
  { id: 'i-5', name: 'Coriander', amount: '1 tsp' },
  { id: 'i-6', name: 'Paprika', amount: '1 tsp' },
  { id: 'i-7', name: 'Garam Masala', amount: '1 tsp' },
  { id: 'i-8', name: 'Vegetable Stock Cube', amount: '1' },
  { id: 'i-9', name: 'Tomato', amount: '1' },
  { id: 'i-10', name: 'Olive Oil', amount: '1 tbsp' },
  { id: 'i-11', name: 'Coconut Milk', amount: '400 ml' },
  { id: 'i-12', name: 'Spinach', amount: '100 g' },
  { id: 'i-13', name: 'Prawns', amount: '400 g' },
  { id: 'i-14', name: 'Lemon Juice', amount: '0.25' },
    ],
    instructions:
      'Blitz aromatics into a paste, fry briefly, add coconut milk and spinach. Simmer with prawns until just cooked through. Finish with lemon.',
  dateCreated: '2025-01-13T09:00:00.000Z',
    tags: ['Keto']
  },
  {
    id: 'seed-easy-chicken-tagine',
    title: 'Easy Chicken Tagine',
    ingredients: [
  { id: 'i-1', name: 'Olive Oil', amount: '2 tbsp' },
  { id: 'i-2', name: 'Onion', amount: '1' },
  { id: 'i-3', name: 'Chicken Thighs', amount: '3' },
  { id: 'i-4', name: 'Cumin', amount: '0.25 tsp' },
  { id: 'i-5', name: 'Coriander', amount: '0.5 tsp' },
  { id: 'i-6', name: 'Cinnamon', amount: '0.25 tsp' },
  { id: 'i-7', name: 'Bell Pepper', amount: '1' },
  { id: 'i-8', name: 'Chopped Tomatoes Can', amount: '400 g' },
  { id: 'i-9', name: 'Chickpeas', amount: '210 g' },
  { id: 'i-10', name: 'Apricots', amount: '4' },
  { id: 'i-11', name: 'Chicken Stock Cube', amount: '1' },
  { id: 'i-12', name: 'Coriander', amount: '10 g' },
    ],
    instructions:
      'Preheat oven to 200°C/fan 180°C/Gas 6. Heat oil in medium flame-proof casserole over medium heat. Add onion and chicken, gently fry 6-8 minutes until onion lightly browned. Sprinkle with spices, cook few seconds more. Add pepper, tomatoes, chickpeas, apricots and crumbled stock cube. Pour in 250ml water, season and bring to simmer. Cover and cook in oven 45 minutes until chicken tender and sauce thickened. Sprinkle with herbs to serve.',
  dateCreated: '2025-01-13T10:00:00.000Z',
    tags: ['Keto']
  },
  {
    id: 'seed-chicken-wrapped-in-parma-ham',
    title: 'Chicken Wrapped in Parma Ham',
    ingredients: [
  { id: 'i-1', name: 'Chicken Breast', amount: '4' },
  { id: 'i-2', name: 'Parma Ham', amount: '4 slices' },
  { id: 'i-3', name: 'Olive Oil', amount: '2 tbsp' },
  { id: 'i-4', name: 'Onion', amount: '1' },
  { id: 'i-5', name: 'Garlic', amount: '2' },
  { id: 'i-6', name: 'Chopped Tomatoes Can', amount: '400 g' },
  { id: 'i-7', name: 'Oregano', amount: '1 tsp' },
  { id: 'i-8', name: 'Spinach', amount: '200 g' },
  { id: 'i-9', name: 'Parmesan', amount: '25 g' },
    ],
    instructions:
      'Place chicken on board, cover with cling film and bash with rolling pin to flatten to 2cm thick. Season and wrap each breast in Parma ham. Heat 1 tbsp oil in large non-stick pan, fry wrapped chicken 3-4 minutes each side until lightly browned. Transfer to plate. Add remaining oil to pan with onion, fry 5 minutes, add garlic and cook few seconds. Add tomatoes, oregano, 300ml water and spinach. Bring to simmer, cook 2-3 minutes until spinach soft. Season sauce. Return chicken, nestle into sauce. Simmer gently 18-20 minutes until chicken tender. Sprinkle with Parmesan to serve.',
  dateCreated: '2025-01-13T11:00:00.000Z',
    tags: ['Keto']
  },
  {
    id: 'seed-thai-curry-with-prawns',
    title: 'Thai Curry with Prawns',
    ingredients: [
  { id: 'i-1', name: 'Coconut Oil', amount: '1 tbsp' },
  { id: 'i-2', name: 'Red Pepper', amount: '1' },
  { id: 'i-3', name: 'Spring Onion', amount: '4' },
  { id: 'i-4', name: 'Ginger', amount: '20 g' },
  { id: 'i-5', name: 'Thai Curry Paste', amount: '3 tbsp' },
  { id: 'i-6', name: 'Coconut Milk', amount: '400 ml' },
  { id: 'i-7', name: 'Sugar Snap Peas', amount: '100 g' },
  { id: 'i-8', name: 'Chilli', amount: '1' },
  { id: 'i-9', name: 'Prawns', amount: '200 g' },
    ],
    instructions:
      'Heat oil in large non-stick frying pan or wok over medium-high heat and stir-fry pepper 2 minutes. Add spring onions, ginger and curry paste, cook 1 minute more. Pour in coconut milk and bring to gentle simmer. Add mange tout and chilli if using. Return to simmer and cook 2 minutes. Add prawns and heat 1-2 minutes until hot. Add splash of water if sauce thickens too much. Serve with freshly cooked cauliflower rice.',
  dateCreated: '2025-01-13T12:00:00.000Z',
    tags: ['Keto']
  },
  {
    id: 'seed-pan-fried-fish-with-lemon-and-parsley',
    title: 'Pan-fried Fish with Lemon and Parsley',
    ingredients: [
  { id: 'i-1', name: 'White Fish', amount: '175 g' },
  { id: 'i-2', name: 'Butter', amount: '15 g' },
  { id: 'i-3', name: 'Olive Oil', amount: '1 tbsp' },
  { id: 'i-4', name: 'Lemon', amount: '1' },
  { id: 'i-5', name: 'Parsley', amount: '5 g' },
    ],
    instructions:
      'Season fish on skinless side with sea salt and black pepper. Melt butter with oil in large non-stick frying pan over medium heat. Add plaice skin-side down, cook 3 minutes. Turn over and cook 1-2 minutes more depending on thickness. Lift fish to warmed plate with fish slice. Return pan to heat, add lemon juice and parsley, simmer few seconds stirring constantly. Pour buttery juices over fish to serve.',
  dateCreated: '2025-01-13T13:00:00.000Z',
    tags: ['Keto']
  },
  {
    id: 'seed-smoked-haddock-with-lentils',
    title: 'Smoked Haddock with Lentils',
    ingredients: [
  { id: 'i-1', name: 'Olive Oil', amount: '2 tbsp' },
  { id: 'i-2', name: 'Onion', amount: '0.5' },
  { id: 'i-3', name: 'Celery', amount: '1' },
  { id: 'i-4', name: 'Carrot', amount: '1' },
  { id: 'i-5', name: 'Rosemary', amount: '1 sprig (or 0.25 tsp dried)' },
  { id: 'i-6', name: 'Garlic', amount: '1' },
  { id: 'i-7', name: 'Lentils', amount: '250 g' },
  { id: 'i-8', name: 'Vegetable Stock', amount: '200 ml' },
  { id: 'i-9', name: 'Smoked Haddock', amount: '280 g' },
  { id: 'i-10', name: 'Parsley', amount: '5 g' },
    ],
    instructions:
      'Heat oil in non-stick frying pan over low heat. Add onion, celery and carrot, gently fry 5 minutes until soft but not browned. Add rosemary and garlic, cook few seconds more. Tip lentils into pan and add stock. Bring to gentle simmer then place fish fillets on top. Season well with black pepper and sprinkle with parsley if using. Cover with lid and cook fish about 8 minutes until just beginning to flake. Divide lentils between plates and top with fish.',
  dateCreated: '2025-01-13T14:00:00.000Z',
  },
  {
    id: 'seed-chicken-caesar-ish-salad',
    title: 'Chicken Caesar-ish Salad',
    ingredients: [
  { id: 'i-1', name: 'Little Gem Lettuce', amount: '2' },
  { id: 'i-2', name: 'Cherry Tomatoes', amount: '8' },
  { id: 'i-3', name: 'Chicken Breast', amount: '200 g' },
  { id: 'i-4', name: 'Mixed Seeds', amount: '10 g' },
  { id: 'i-5', name: 'Parmesan', amount: '20 g' },
  { id: 'i-6', name: 'Greek Yoghurt', amount: '75 g' },
  { id: 'i-7', name: 'Garlic', amount: '0.5' },
  { id: 'i-8', name: 'Mixed Herbs', amount: '1 pinch' },
  { id: 'i-9', name: 'Olive Oil', amount: '1 tbsp' },
    ],
    instructions:
      'Make dressing by combining yoghurt, garlic, herbs, oil and 2 tbsp cold water in bowl. Season with pinch of sea salt and lots of ground black pepper. Wash lettuce and drain well. Divide leaves between two shallow bowls and scatter with tomatoes. Place chicken on top, sprinkle with mixed seeds and Parmesan, drizzle with dressing. Season with ground black pepper and serve.',
  dateCreated: '2025-01-13T15:00:00.000Z',
    tags: ['Keto']
  },
  {
    id: 'seed-shakshuka',
    title: 'Shakshuka',
    ingredients: [
  { id: 'i-1', name: 'Olive Oil', amount: '1 tbsp' },
  { id: 'i-2', name: 'Onion', amount: '1' },
  { id: 'i-3', name: 'Bell Pepper', amount: '1' },
  { id: 'i-4', name: 'Garlic', amount: '2' },
  { id: 'i-5', name: 'Cumin', amount: '1 tsp' },
  { id: 'i-6', name: 'Paprika', amount: '0.5 tsp' },
  { id: 'i-7', name: 'Chopped Tomatoes Can', amount: '400 g' },
  { id: 'i-8', name: 'Tomato Puree', amount: '1 tbsp' },
  { id: 'i-9', name: 'Egg', amount: '4' },
  { id: 'i-10', name: 'Coriander', amount: '5 g' },
    ],
    instructions:
      'Heat oil in medium non-stick frying pan with lid. Add onion and pepper, gently fry 5-6 minutes until softened. Add garlic, cumin and paprika, cook 20-30 seconds. Tip in tomatoes, tomato purée, good pinch sea salt and lots black pepper. Bring to simmer and cook 4 minutes until tomato thickened. Make four holes in vegetable mixture and break egg into each. Cover and cook very gently 3-5 minutes until whites set but yolks remain runny. Sprinkle with herbs if using and season with more black pepper.',
  dateCreated: '2025-01-13T16:00:00.000Z',
    tags: ['Keto']
  },
  {
    id: 'seed-green-bean-bowl-with-feta-and-pine-nuts',
    title: 'Green Bean Bowl with Feta and Pine Nuts',
    ingredients: [
  { id: 'i-1', name: 'Pine Nuts', amount: '3 tbsp' },
  { id: 'i-2', name: 'Green Beans', amount: '180 g' },
  { id: 'i-3', name: 'Olive Oil', amount: '1 tbsp' },
  { id: 'i-4', name: 'Tomato', amount: '2' },
  { id: 'i-5', name: 'Garlic', amount: '1' },
  { id: 'i-6', name: 'Feta', amount: '100 g' },
  { id: 'i-7', name: 'Chilli Flakes', amount: '1 pinch (optional)' },
    ],
    instructions:
      'Toast pine nuts in dry frying pan over medium heat 1-2 minutes until golden. Remove and set aside. Return pan to heat, add beans and oil, fry 2-3 minutes stirring occasionally. Stir in tomatoes and cook 4 minutes. Add garlic and cook 1 minute more. Remove from heat and scatter feta and pine nuts over. Allow to rest minute or so to let feta soften, then divide between bowls and season with black pepper and chilli flakes if using.',
  dateCreated: '2025-01-13T17:00:00.000Z',
    tags: ['Keto']
  },
  {
    id: 'seed-cheesy-fajita-beef-casserole',
    title: 'Cheesy Fajita Beef Casserole',
    ingredients: [
  { id: 'i-1', name: 'Olive Oil', amount: '1.5 tbsp' },
  { id: 'i-2', name: 'Onion', amount: '1' },
  { id: 'i-3', name: 'Bell Pepper', amount: '2' },
  { id: 'i-4', name: 'Beef Mince', amount: '250 g' },
  { id: 'i-5', name: 'Black Beans', amount: '400 g' },
  { id: 'i-6', name: 'Fajita Seasoning', amount: '2 tbsp' },
  { id: 'i-7', name: 'Chopped Tomatoes Can', amount: '400 g' },
  { id: 'i-8', name: 'Jalapeño', amount: '2 tbsp' },
  { id: 'i-9', name: 'Cheddar', amount: '120 g' },
  { id: 'i-10', name: 'Greek Yoghurt', amount: '4 tbsp' },
    ],
    instructions:
      'Preheat oven to 200°C/Fan 180°C/Gas 6. Place wide-based ovenproof casserole over medium heat. Add oil, onion and peppers, sauté 3-4 minutes. Add minced beef and fry about 4 minutes, stirring to break meat into small pieces. Stir in black beans, fajita seasoning, tomatoes and jalapeño peppers. Simmer 3 minutes and season well. Scatter cheese over and bake 20 minutes until cheese browned and bubbling. Serve with yoghurt alongside.',
  dateCreated: '2025-01-13T18:00:00.000Z',
    tags: ['Keto']
  },
];

// All prior automatic tagging/serves/filtering removed to allow full manual control.

const SEED_VERSION_KEY = 'seedVersion';

export async function ensureSeeded(targetVersion: number) {
  try {
    const [versionStr, existingStr] = await Promise.all([
            AsyncStorage.getItem(SEED_VERSION_KEY),
            AsyncStorage.getItem('recipes'),
    ]);

    const currentVersion = versionStr ? Number(versionStr) : 0;
    const existingRecipes = existingStr ? (JSON.parse(existingStr) as Recipe[]) : [];

    // If no upgrade is needed, bail early
    if (currentVersion >= targetVersion) {
      if (!existingStr || existingRecipes.length === 0) {
        const merged = mergeSeeds(existingRecipes, SEEDED_RECIPES);
        await AsyncStorage.setItem('recipes', JSON.stringify(merged));
      }
  await ensureSeededIngredients([...(SEEDED_RECIPES as Recipe[]), ...EXTRA_SEEDED_RECIPES]);
      return;
    }

  // Perform upgrade: just merge seeds (no filtering / tagging / serves injection)
    const merged = mergeSeeds(existingRecipes, SEEDED_RECIPES);
    await AsyncStorage.setItem('recipes', JSON.stringify(merged));
    await AsyncStorage.setItem(SEED_VERSION_KEY, String(targetVersion));
  // IMPORTANT: Replace seeded ingredients on upgrade to avoid stale entries lingering
  // (previously we merged and existing values won). Clearing ensures a clean set.
  await AsyncStorage.removeItem('seededIngredients');
  await ensureSeededIngredients([...(SEEDED_RECIPES as Recipe[]), ...EXTRA_SEEDED_RECIPES]);
  } catch (e) {
    // Fail silently; app will just show empty state
    // console.warn('Seeding failed', e);
  }
}

function mergeSeeds(existing: Recipe[], seeds: Recipe[]): Recipe[] {
  // Map by lowercased title for deduplication
  const byTitle = new Map<string, Recipe>();
  // Add all user recipes first
  for (const r of existing) {
    byTitle.set(r.title.trim().toLowerCase(), r);
  }
  // Compose full seed list: built-in + extras (extras can override built-ins by title)
  const fullSeeds: Recipe[] = [...seeds, ...EXTRA_SEEDED_RECIPES];
  // Add all seeds, replacing any user recipe with the same title
  for (const s of fullSeeds) {
    byTitle.set(s.title.trim().toLowerCase(), s);
  }
  // Preserve original order: newest first based on dateCreated
  const all = Array.from(byTitle.values());
  all.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
  return all;
}

type SeededIngredientItem = {
  id: string;
  name: string;
  category: string; // e.g., 'Seeded'
  aliases: string[];
};

function dedupeByName(items: SeededIngredientItem[]): SeededIngredientItem[] {
  const byName = new Map<string, SeededIngredientItem>();
  for (const it of items) {
    const key = it.name.trim().toLowerCase();
    if (!byName.has(key)) byName.set(key, it);
  }
  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
}

async function ensureSeededIngredients(seeds: Recipe[]) {
  try {
    const ingredientNames = new Set<string>();
  for (const r of seeds) {
      for (const ing of r.ingredients) {
        const name = (ing.name || '').trim();
        if (name) ingredientNames.add(name);
      }
    }

  const toAdd: SeededIngredientItem[] = Array.from(ingredientNames).map((name) => ({
      id: 'seed-ing-' + slugify(name),
      name,
      category: 'Seeded',
      aliases: [name.toLowerCase()],
    }));

  // Replace the stored list to avoid lingering stale entries from previous seeds.
  const replaced = dedupeByName(toAdd);
  await AsyncStorage.setItem('seededIngredients', JSON.stringify(replaced));
  } catch {
    // ignore
  }
}
