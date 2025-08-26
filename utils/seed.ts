import AsyncStorage from '@react-native-async-storage/async-storage';

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
      { id: 'i-1', name: 'Olive oil', amount: '1 tbsp' },
      { id: 'i-2', name: 'Medium onion', amount: '1, peeled and finely chopped' },
      { id: 'i-3', name: 'Garlic cloves', amount: '2, peeled and crushed' },
      { id: 'i-4', name: 'Pearl barley', amount: '120g' },
      { id: 'i-5', name: 'Bay leaf', amount: '1' },
      { id: 'i-6', name: 'Vegetable stock cube', amount: '1' },
      { id: 'i-7', name: 'Medium leeks', amount: '2 (around 375g), trimmed and cut into roughly 5mm slices' },
      { id: 'i-8', name: 'Parmesan', amount: '50g, finely grated' },
      { id: 'i-9', name: "Goat's cheese, rind removed if you prefer", amount: '100g' },
      { id: 'i-10', name: 'Fresh thyme leaves (optional)', amount: 'to serve' },
    ],
    instructions: 'Heat oil in large non-stick saucepan, gently fry onion 3–5 min until softened and lightly browned, stirring regularly. Add garlic, cook a few seconds. Add barley and bay leaf. Crumble over stock cube, add 900ml cold water, cover loosely, bring to boil. Reduce to gentle simmer, cook 40–50 min until tender, stirring occasionally. Add extra water if barley absorbs more than expected. Add leeks, cook 5 min more until tender, stir in Parmesan, season to taste. Spoon onto plates, crumble goat’s cheese on top, sprinkle with thyme leaves to serve.',
  dateCreated: '2025-01-13T19:00:00.000Z',
  },
  {
    id: 'seed-roasted-vegetable-pasta-mozzarella',
    title: 'Roasted Vegetable Pasta with Mozzarella',
    ingredients: [
      { id: 'i-1', name: 'Peppers (any colour)', amount: '2, deseeded and cut into roughly 2cm chunks' },
      { id: 'i-2', name: 'Medium courgette', amount: '1, trimmed, quartered lengthways and cut into roughly 2cm chunks' },
      { id: 'i-3', name: 'Large red onion', amount: '1, peeled and cut into 12 wedges' },
      { id: 'i-4', name: 'Olive oil', amount: '2 tbsp' },
      { id: 'i-5', name: 'Cherry tomatoes', amount: '12, halved' },
      { id: 'i-6', name: 'Crushed dried chilli flakes', amount: '¼ tsp, to taste' },
      { id: 'i-7', name: 'Dried bean, pea, lentil or wholewheat penne pasta', amount: '50g' },
      { id: 'i-8', name: 'Young spinach leaves', amount: '50g' },
      { id: 'i-9', name: 'Mozzarella pearls (mini balls)', amount: '125g, drained and halved' },
    ],
    instructions: 'Preheat oven to 200°C/fan 180°C/Gas 6. Place peppers, courgette, onion in large baking tray. Drizzle with oil, season with salt and pepper, toss. Roast 20 min. Add tomatoes, sprinkle with chilli flakes, roast 10 min more. Meanwhile, cook pasta in boiling water 10–12 min until tender, drain. Add spinach, roasted veg, mozzarella to pan, toss, season, stir 1 min until mozzarella melts and spinach wilts.',
  dateCreated: '2025-01-13T20:00:00.000Z',
  },
  {
    id: 'seed-lamb-saag',
    title: 'Lamb Saag',
    ingredients: [
      { id: 'i-1', name: 'Coconut or rapeseed oil', amount: '1 tbsp' },
      { id: 'i-2', name: 'Medium onion', amount: '1, peeled and finely sliced' },
      { id: 'i-3', name: 'Lamb neck fillets', amount: '500g, trimmed and cut into roughly 3–4cm chunks' },
      { id: 'i-4', name: 'Medium Indian curry paste (rogan josh or tikka masala)', amount: '60g (around 4 tbsp)' },
      { id: 'i-5', name: 'Dried red split lentils', amount: '50g' },
      { id: 'i-6', name: 'Frozen spinach', amount: '200g' },
    ],
    instructions: 'Preheat oven to 180°C/fan 160°C/Gas 4. Heat oil in flame-proof casserole, gently fry onion 5 min until softened. Add lamb, season, cook 3 min until coloured, turning. Stir in curry paste, cook 1 min. Add lentils, spinach, stir in 500ml water. Bring to boil, cover, cook in oven 1–1¼ hours until lamb tender and sauce thick.',
  dateCreated: '2025-01-13T21:00:00.000Z',
  },
  {
    id: 'seed-courgetti-spaghetti-pine-nuts-spinach-pancetta',
    title: 'Courgetti Spaghetti with Pine Nuts, Spinach and Pancetta',
    ingredients: [
      { id: 'i-1', name: 'Dried wholewheat spaghetti', amount: '80g' },
      { id: 'i-2', name: 'Large courgette', amount: '1, trimmed and spiralized (or 250g ready-prepared courgetti)' },
      { id: 'i-3', name: 'Pine nuts', amount: '20g' },
      { id: 'i-4', name: 'Smoked lardons or pancetta (or diced bacon)', amount: '50g' },
      { id: 'i-5', name: 'Olive oil', amount: '1 tbsp' },
      { id: 'i-6', name: 'Young spinach leaves', amount: '150g' },
      { id: 'i-7', name: 'Feta', amount: '80g' },
    ],
    instructions: 'Cook spaghetti in boiling water 10–12 min until tender. Add spiralized courgette, stir, drain, rinse under cold tap. Toast pine nuts and lardons in pan with half oil 2–3 min until lightly browned, tip out. Add remaining oil and spinach, cook 1–2 min until soft. Crumble 2/3 feta over, cook until melted. Return spaghetti and courgetti, add spinach and feta sauce, toss over medium heat 1–2 min. Divide between bowls, crumble remaining feta, sprinkle pancetta and pine nuts.',
  dateCreated: '2025-01-13T22:00:00.000Z',
  },
  {
    id: 'seed-cheats-one-pot-cassoulet',
    title: 
      
      "Cheat's One-pot Cassoulet",
    ingredients: [
      { id: 'i-1', name: 'Olive oil', amount: '1 tbsp' },
      { id: 'i-2', name: 'Spicy sausages (Toulouse or spicy pork)', amount: '6 (around 400g)' },
      { id: 'i-3', name: 'Large onion', amount: '1, peeled and thinly sliced' },
      { id: 'i-4', name: 'Smoked lardons, pancetta or bacon', amount: '100g, cubed' },
      { id: 'i-5', name: 'Haricot or cannellini beans', amount: '400g can, drained and rinsed' },
      { id: 'i-6', name: 'Chopped tomatoes', amount: '400g can' },
      { id: 'i-7', name: 'Dried mixed herbs', amount: '1 tsp' },
      { id: 'i-8', name: 'Fresh parsley', amount: 'generous handful, chopped, to serve' },
    ],
    instructions: 'Heat oil in wide-based non-stick saucepan or flame-proof casserole, add sausages, cook 5 min until browned, remove. Add onion and pancetta, cook 3–5 min until golden. Cut sausages in half, return to pan, add beans, tomatoes, herbs. Stir in 150ml water, bring to simmer, cover, cook 18–20 min, stirring. Add extra water if sauce thickens. Season, stir in parsley to serve.',
  dateCreated: '2025-01-13T23:00:00.000Z',
  },
  {
    id: 'seed-chicken-tikka-masala',
    title: 'Chicken Tikka Masala',
    ingredients: [
      { id: 'i-1', name: 'Tikka curry paste', amount: '1 tbsp' },
      { id: 'i-2', name: 'Full-fat live Greek yoghurt', amount: '4 tbsp' },
      { id: 'i-3', name: 'Boneless, skinless chicken breasts', amount: '2 (around 350g), cut into roughly 3cm chunks' },
      { id: 'i-4', name: 'Coconut or rapeseed oil', amount: '1 tbsp' },
      { id: 'i-5', name: 'Fresh coriander', amount: 'to serve' },
      { id: 'i-6', name: 'Red chilli', amount: '½, sliced, to serve (optional)' },
      { id: 'i-7', name: 'Medium onion', amount: '1, peeled and finely chopped' },
      { id: 'i-8', name: 'Garlic cloves', amount: '2, peeled and crushed' },
      { id: 'i-9', name: 'Fresh root ginger', amount: '15g, peeled and finely grated' },
      { id: 'i-10', name: 'Tikka curry paste', amount: '2 tbsp' },
      { id: 'i-11', name: 'Tomato purée', amount: '1 tbsp' },
    ],
    instructions: 'Combine 1 tbsp curry paste, yoghurt, salt in bowl, add chicken, mix, marinate at least 1 hour. For sauce: heat oil in pan, fry onion 5 min, add garlic, ginger, 2 tbsp curry paste, cook 1½ min. Add 300ml water, tomato purée, bring to simmer, cook 5 min, blend smooth. Fry marinated chicken 3 min until browned, add sauce, cook 3–4 min until chicken cooked. Add water if sauce thickens. Serve with coriander and chilli.',
  dateCreated: '2025-01-14T00:00:00.000Z',
  },
  {
    id: 'seed-' + slugify('Thai Pork Lettuce Cups'),
    title: 'Thai Pork Lettuce Cups',
    ingredients: [
      { id: 'i-1', name: 'Olive oil', amount: '1 tbsp' },
      { id: 'i-2', name: 'Pork mince', amount: '250 g' },
      { id: 'i-3', name: 'Lemongrass (finely chopped)', amount: '1 stalk' },
      { id: 'i-4', name: 'Ginger (grated)', amount: '15 g' },
      { id: 'i-5', name: 'Garlic', amount: '2 cloves' },
      { id: 'i-6', name: 'Spring onion', amount: '1 each' },
      { id: 'i-7', name: 'Baby gem lettuce leaves', amount: '6–8 each' },
      { id: 'i-8', name: 'Coriander (fresh)', amount: 'small handful (optional)' },
      { id: 'i-9', name: 'Lime juice', amount: '1 tbsp' },
      { id: 'i-10', name: 'Fish sauce', amount: '1 tbsp' },
      { id: 'i-11', name: 'Sriracha', amount: '1 tbsp' },
      { id: 'i-12', name: 'Coriander (for dressing)', amount: '5 g, finely chopped' },
    ],
    instructions:
      'Stir-fry pork with aromatics until cooked, toss with a simple lime–fish sauce dressing, and serve in crisp lettuce cups with herbs.',
  dateCreated: '2025-01-03T09:00:00.000Z',
  },
  {
    id: 'seed-' + slugify('Pesto Courgetti Spaghetti with Red Pepper and Feta'),
    title: 'Pesto Courgetti Spaghetti with Red Pepper and Feta',
    ingredients: [
      { id: 'i-1', name: 'Olive oil', amount: '2 tbsp' },
      { id: 'i-2', name: 'Roasted red peppers (jarred)', amount: '2 each, sliced' },
      { id: 'i-3', name: 'Courgettes, spiralized', amount: '2 medium' },
      { id: 'i-4', name: 'Pesto (red or green)', amount: '2 tbsp' },
      { id: 'i-5', name: 'Feta cheese', amount: '100 g, crumbled' },
      { id: 'i-6', name: 'Pine nuts', amount: '15 g' },
      { id: 'i-7', name: 'Basil leaves', amount: 'small handful (optional)' },
    ],
    instructions:
      'Warm peppers in oil, briefly sauté courgetti, then toss with pesto and feta. Finish with pine nuts and basil. Add cooked spaghetti if you want a larger portion.',
  dateCreated: '2025-01-04T09:00:00.000Z',
  },
  {
    id: 'seed-' + slugify('Mixed Bean and Miso Salad with Chicken'),
    title: 'Mixed Bean and Miso Salad with Chicken',
    ingredients: [
      { id: 'i-1', name: 'Red or orange pepper', amount: '1 each, finely chopped' },
      { id: 'i-2', name: 'Spring onion', amount: '1 each, finely chopped' },
      { id: 'i-3', name: 'Edamame (defrosted)', amount: '100 g' },
      { id: 'i-4', name: 'Cooked chicken', amount: '150 g, finely chopped' },
      { id: 'i-5', name: 'Mixed beans (drained)', amount: '200 g' },
      { id: 'i-6', name: 'Fresh spinach', amount: '50 g, roughly chopped' },
      { id: 'i-7', name: 'Miso dressing', amount: 'to taste' },
    ],
    instructions:
      'Toss beans, chicken and vegetables with a light miso dressing until evenly coated. Serve as a hearty salad or lunchbox option.',
  dateCreated: '2025-01-05T09:00:00.000Z',
  },
  {
    id: 'seed-' + slugify('Breakfast Burrito'),
    title: 'Breakfast Burrito',
    ingredients: [
      { id: 'i-1', name: 'Chipolata sausage', amount: '1 each, halved lengthways' },
      { id: 'i-2', name: 'Smoked streaky bacon', amount: '2 rashers' },
      { id: 'i-3', name: 'Mushroom', amount: '1 large, sliced' },
      { id: 'i-4', name: 'Cherry tomatoes', amount: '2 each, halved' },
      { id: 'i-5', name: 'Olive oil', amount: '1 tsp' },
      { id: 'i-6', name: 'Egg', amount: '1 medium' },
      { id: 'i-7', name: 'Iceberg lettuce leaves', amount: '2 large' },
      { id: 'i-8', name: 'Mayonnaise', amount: '1/2 tsp' },
      { id: 'i-9', name: 'Sriracha (optional)', amount: '1/4 tsp' },
    ],
    instructions:
      'Roast or pan-cook the meats and veg until done. Add egg, then assemble in stacked lettuce leaves with mayo and a touch of sriracha. Roll and serve.',
  dateCreated: '2025-01-06T09:00:00.000Z',
  },
  {
    id: 'seed-' + slugify('One Pan Squeezed Sausage Casserole'),
    title: 'One Pan Squeezed Sausage Casserole',
    ingredients: [
      { id: 'i-1', name: 'Good-quality sausages', amount: '4 each' },
      { id: 'i-2', name: 'Onion', amount: '1/2 each' },
      { id: 'i-3', name: 'Olive oil', amount: '2 tbsp' },
      { id: 'i-4', name: 'Butternut squash', amount: '200 g, diced' },
      { id: 'i-5', name: 'Dried thyme', amount: '1/2 tsp' },
      { id: 'i-6', name: 'Cavolo nero', amount: '150 g, central stalks removed' },
      { id: 'i-7', name: 'Cider vinegar', amount: '1 tbsp' },
      { id: 'i-8', name: 'Chilli flakes', amount: '1/4 tsp (optional)' },
    ],
    instructions:
      'Cut sausages into pieces, brown with onion and squash. Add thyme and greens, finish with vinegar for a hearty one-pan meal.',
  dateCreated: '2025-01-07T09:00:00.000Z',
  },
  {
    id: 'seed-' + slugify('Chinese Pork Balls in Mushroom Miso Broth'),
    title: 'Chinese Pork Balls in Mushroom Miso Broth',
    ingredients: [
      { id: 'i-1', name: 'Pork mince', amount: '250 g' },
      { id: 'i-2', name: 'Fresh root ginger', amount: '5 g, grated' },
      { id: 'i-3', name: 'Chilli flakes', amount: '1 tsp' },
      { id: 'i-4', name: 'Fresh coriander', amount: '5 g, finely chopped' },
      { id: 'i-5', name: 'Sesame oil', amount: '2 tsp' },
      { id: 'i-6', name: 'Chestnut mushrooms', amount: '100 g, finely chopped' },
      { id: 'i-7', name: 'Olive oil', amount: '1 tsp' },
      { id: 'i-8', name: 'White miso', amount: '2 tbsp' },
      { id: 'i-9', name: 'Soy sauce', amount: '2 tbsp' },
      { id: 'i-10', name: 'Pak choi', amount: '1 each, roughly chopped' },
      { id: 'i-11', name: 'Spring onion', amount: '1 each, finely chopped' },
    ],
    instructions:
      'Form seasoned pork into balls and bake. Make umami-rich broth with mushrooms, miso and soy. Combine with greens for a satisfying soup.',
  dateCreated: '2025-01-08T09:00:00.000Z',
  },
  {
    id: 'seed-' + slugify('Chicken Casserole with Chorizo, Thyme and Olives'),
    title: 'Chicken Casserole with Chorizo, Thyme and Olives',
    ingredients: [
      { id: 'i-1', name: 'Chicken thighs', amount: '4 each, skin-on, bone-in' },
      { id: 'i-2', name: 'Lemon juice', amount: '1 each, juiced' },
      { id: 'i-3', name: 'Olive oil', amount: '2 tbsp' },
      { id: 'i-4', name: 'Large onion', amount: '1 each, sliced' },
      { id: 'i-5', name: 'Chorizo', amount: '50 g, diced' },
      { id: 'i-6', name: 'Garlic bulb', amount: '1 whole, top stem removed' },
      { id: 'i-7', name: 'Small white beans', amount: '1 x 400g tin, drained' },
      { id: 'i-8', name: 'Dried thyme', amount: '1/4 tsp or 5-6 sprigs fresh' },
      { id: 'i-9', name: 'Tenderstem broccoli', amount: '200 g, thick stems trimmed' },
    ],
    instructions:
      'Brown chicken, sauté chorizo and onions, then slow-cook with beans, thyme and whole garlic. Finish with broccoli for a Mediterranean feast.',
  dateCreated: '2025-01-09T09:00:00.000Z',
  },
  {
    id: 'seed-' + slugify('Piri Piri Roast Chicken with Jalapeño Yoghurt'),
    title: 'Piri Piri Roast Chicken with Jalapeño Yoghurt',
    ingredients: [
      { id: 'i-1', name: 'Roasted red pepper', amount: '1 from jar (approx. 70g)' },
      { id: 'i-2', name: 'Piri piri seasoning', amount: '1 tbsp' },
      { id: 'i-3', name: 'Olive oil', amount: '2 tbsp' },
      { id: 'i-4', name: 'Soy sauce', amount: '1 tbsp' },
      { id: 'i-5', name: 'Whole chicken', amount: '1 x 1.5kg, at room temperature' },
      { id: 'i-6', name: 'Lemon', amount: '1 each, pierced' },
      { id: 'i-7', name: 'Jalapeños', amount: '30g from jar, drained' },
      { id: 'i-8', name: 'Full-fat Greek yoghurt', amount: '125g' },
      { id: 'i-9', name: 'Fresh coriander', amount: '10g' },
    ],
    instructions:
      'Marinate chicken in piri piri blend, roast with lemon. Serve with cooling jalapeño yoghurt sauce for a spicy-fresh combination.',
  dateCreated: '2025-01-10T09:00:00.000Z',
  },
  {
    id: 'seed-' + slugify('Keto-fried Chicken'),
    title: 'Keto-fried Chicken',
    ingredients: [
      { id: 'i-1', name: 'Ground almonds', amount: '80g' },
      { id: 'i-2', name: 'Flaked sea salt', amount: '1/4 tsp' },
      { id: 'i-3', name: 'Freshly ground black pepper', amount: '1 tsp' },
      { id: 'i-4', name: 'Cayenne pepper', amount: '1/2 tsp' },
      { id: 'i-5', name: 'Egg', amount: '1 large' },
      { id: 'i-6', name: 'Skinless chicken thighs', amount: '4 large (approx. 400g total)' },
      { id: 'i-7', name: 'Olive oil', amount: '1 tbsp' },
    ],
    instructions:
      'Coat chicken in spiced almond mixture, dip in egg, then fry until golden and crispy. A low-carb take on fried chicken.',
  dateCreated: '2025-01-11T09:00:00.000Z',
  },
  {
    id: 'seed-' + slugify('White Fish with Herby Green Dressing and Lentils'),
    title: 'White Fish with Herby Green Dressing and Lentils',
    ingredients: [
      { id: 'i-1', name: 'White fish fillets', amount: '2 each (such as cod, hake or bass)' },
      { id: 'i-2', name: 'Olive oil', amount: '1/4 tbsp + 1/4 tbsp' },
      { id: 'i-3', name: 'Cooked beluga or Puy lentils', amount: '250g, warmed' },
      { id: 'i-4', name: 'Fresh rosemary', amount: '1 sprig (optional)' },
      { id: 'i-5', name: 'Fresh parsley', amount: '20g' },
      { id: 'i-6', name: 'Fresh dill', amount: '20g' },
      { id: 'i-7', name: 'Anchovy fillets', amount: '3 each' },
      { id: 'i-8', name: 'Cider vinegar', amount: '1 tbsp' },
    ],
    instructions:
      'Pan-fry seasoned fish fillets. Blend herbs with anchovies and vinegar for a zesty green dressing. Serve over warm lentils.',
  dateCreated: '2025-01-12T09:00:00.000Z',
  },
  {
    id: 'seed-' + slugify('Made-in-Minutes Goan Prawn Curry with Spinach'),
    title: 'Made-in-Minutes Goan Prawn Curry with Spinach',
    ingredients: [
      { id: 'i-1', name: 'Small leek', amount: '1 each, trimmed and roughly chopped' },
      { id: 'i-2', name: 'Garlic cloves', amount: '3 each, peeled' },
      { id: 'i-3', name: 'Fresh root ginger', amount: '20g (no need to peel)' },
      { id: 'i-4', name: 'Ground cumin', amount: '2 tsp' },
      { id: 'i-5', name: 'Ground coriander', amount: '1 tsp' },
      { id: 'i-6', name: 'Paprika', amount: '1 tsp' },
      { id: 'i-7', name: 'Garam masala', amount: '1 tsp' },
      { id: 'i-8', name: 'Vegetable stock cube', amount: '1 each' },
      { id: 'i-9', name: 'Small tomato', amount: '1 each, quartered' },
      { id: 'i-10', name: 'Olive oil', amount: '1 tbsp' },
      { id: 'i-11', name: 'Full-fat coconut milk', amount: '1 x 400ml tin' },
      { id: 'i-12', name: 'Frozen spinach', amount: '100g' },
      { id: 'i-13', name: 'Frozen raw prawns', amount: '400g, defrosted' },
      { id: 'i-14', name: 'Lemon juice', amount: '1/4 lemon (optional)' },
    ],
    instructions:
      'Blitz aromatics into a paste, fry briefly, add coconut milk and spinach. Simmer with prawns until just cooked through. Finish with lemon.',
  dateCreated: '2025-01-13T09:00:00.000Z',
  },
  {
    id: 'seed-easy-chicken-tagine',
    title: 'Easy Chicken Tagine',
    ingredients: [
      { id: 'i-1', name: 'Olive oil', amount: '2 tbsp' },
      { id: 'i-2', name: 'Medium onion', amount: '1, peeled and thinly sliced' },
      { id: 'i-3', name: 'Boneless skinless chicken thighs', amount: '3 (around 300g), quartered' },
      { id: 'i-4', name: 'Ground cumin', amount: '¼ tsp' },
      { id: 'i-5', name: 'Ground coriander', amount: '½ tsp' },
      { id: 'i-6', name: 'Ground cinnamon', amount: '¼ tsp' },
      { id: 'i-7', name: 'Red pepper', amount: '1, deseeded and cut into roughly 3cm chunks' },
      { id: 'i-8', name: 'Chopped tomatoes', amount: '400g can' },
      { id: 'i-9', name: 'Chickpeas', amount: '210g can, drained (around 130g drained weight)' },
      { id: 'i-10', name: 'Dried apricots', amount: '4 (around 25g), roughly chopped' },
      { id: 'i-11', name: 'Chicken stock cube', amount: '1' },
      { id: 'i-12', name: 'Fresh coriander or parsley', amount: 'handful, leaves roughly chopped, to serve' },
    ],
    instructions:
      'Preheat oven to 200°C/fan 180°C/Gas 6. Heat oil in medium flame-proof casserole over medium heat. Add onion and chicken, gently fry 6-8 minutes until onion lightly browned. Sprinkle with spices, cook few seconds more. Add pepper, tomatoes, chickpeas, apricots and crumbled stock cube. Pour in 250ml water, season and bring to simmer. Cover and cook in oven 45 minutes until chicken tender and sauce thickened. Sprinkle with herbs to serve.',
  dateCreated: '2025-01-13T10:00:00.000Z',
  },
  {
    id: 'seed-chicken-wrapped-in-parma-ham',
    title: 'Chicken Wrapped in Parma Ham',
    ingredients: [
      { id: 'i-1', name: 'Boneless skinless chicken breasts', amount: '4 (each around 150g)' },
      { id: 'i-2', name: 'Parma ham or prosciutto', amount: '4 slices' },
      { id: 'i-3', name: 'Olive oil', amount: '2 tbsp' },
      { id: 'i-4', name: 'Medium onion', amount: '1, peeled and finely chopped' },
      { id: 'i-5', name: 'Garlic cloves', amount: '2, peeled and crushed' },
      { id: 'i-6', name: 'Chopped tomatoes or passata', amount: '400g can or 500g' },
      { id: 'i-7', name: 'Dried oregano', amount: '1 tsp' },
      { id: 'i-8', name: 'Young spinach leaves', amount: '200g' },
      { id: 'i-9', name: 'Parmesan', amount: '25g, finely grated' },
    ],
    instructions:
      'Place chicken on board, cover with cling film and bash with rolling pin to flatten to 2cm thick. Season and wrap each breast in Parma ham. Heat 1 tbsp oil in large non-stick pan, fry wrapped chicken 3-4 minutes each side until lightly browned. Transfer to plate. Add remaining oil to pan with onion, fry 5 minutes, add garlic and cook few seconds. Add tomatoes, oregano, 300ml water and spinach. Bring to simmer, cook 2-3 minutes until spinach soft. Season sauce. Return chicken, nestle into sauce. Simmer gently 18-20 minutes until chicken tender. Sprinkle with Parmesan to serve.',
  dateCreated: '2025-01-13T11:00:00.000Z',
  },
  {
    id: 'seed-thai-curry-with-prawns',
    title: 'Thai Curry with Prawns',
    ingredients: [
      { id: 'i-1', name: 'Coconut oil or rapeseed oil', amount: '1 tbsp' },
      { id: 'i-2', name: 'Red pepper', amount: '1, deseeded and cut into roughly 2cm chunks' },
      { id: 'i-3', name: 'Spring onions', amount: '4, trimmed and thickly sliced' },
      { id: 'i-4', name: 'Fresh root ginger', amount: '20g, peeled and finely grated' },
      { id: 'i-5', name: 'Thai red or green curry paste', amount: '3 tbsp' },
      { id: 'i-6', name: 'Coconut milk', amount: '400ml can' },
      { id: 'i-7', name: 'Mange tout or sugar-snap peas', amount: '100g, halved' },
      { id: 'i-8', name: 'Red chilli', amount: '1, finely sliced, or ½ tsp crushed dried chilli flakes (optional)' },
      { id: 'i-9', name: 'Large cooked peeled prawns', amount: '200g, thawed if frozen' },
    ],
    instructions:
      'Heat oil in large non-stick frying pan or wok over medium-high heat and stir-fry pepper 2 minutes. Add spring onions, ginger and curry paste, cook 1 minute more. Pour in coconut milk and bring to gentle simmer. Add mange tout and chilli if using. Return to simmer and cook 2 minutes. Add prawns and heat 1-2 minutes until hot. Add splash of water if sauce thickens too much. Serve with freshly cooked cauliflower rice.',
  dateCreated: '2025-01-13T12:00:00.000Z',
  },
  {
    id: 'seed-pan-fried-fish-with-lemon-and-parsley',
    title: 'Pan-fried Fish with Lemon and Parsley',
    ingredients: [
      { id: 'i-1', name: 'Plaice fillet or other white fish', amount: '175g, thawed if frozen' },
      { id: 'i-2', name: 'Butter', amount: '15g' },
      { id: 'i-3', name: 'Extra-virgin olive oil', amount: '1 tbsp' },
      { id: 'i-4', name: 'Fresh lemon juice', amount: '1 tbsp' },
      { id: 'i-5', name: 'Fresh parsley', amount: '1 small bunch, leaves finely chopped (around 2 tbsp)' },
    ],
    instructions:
      'Season fish on skinless side with sea salt and black pepper. Melt butter with oil in large non-stick frying pan over medium heat. Add plaice skin-side down, cook 3 minutes. Turn over and cook 1-2 minutes more depending on thickness. Lift fish to warmed plate with fish slice. Return pan to heat, add lemon juice and parsley, simmer few seconds stirring constantly. Pour buttery juices over fish to serve.',
  dateCreated: '2025-01-13T13:00:00.000Z',
  },
  {
    id: 'seed-smoked-haddock-with-lentils',
    title: 'Smoked Haddock with Lentils',
    ingredients: [
      { id: 'i-1', name: 'Olive oil', amount: '2 tbsp' },
      { id: 'i-2', name: 'Medium onion', amount: '½, peeled and finely chopped' },
      { id: 'i-3', name: 'Celery stick', amount: '1, trimmed and finely sliced' },
      { id: 'i-4', name: 'Medium carrot', amount: '1, trimmed, halved lengthways and diagonally sliced' },
      { id: 'i-5', name: 'Rosemary sprig or dried rosemary', amount: '1 sprig or ¼ tsp dried' },
      { id: 'i-6', name: 'Garlic clove', amount: '1, peeled and very finely sliced' },
      { id: 'i-7', name: 'Ready-cooked lentils', amount: '250g sachet' },
      { id: 'i-8', name: 'Vegetable stock', amount: '200ml, made with ½ stock cube' },
      { id: 'i-9', name: 'Smoked haddock or cod fillets', amount: '280g, skinned' },
      { id: 'i-10', name: 'Fresh parsley leaves', amount: 'small handful, roughly chopped (optional)' },
    ],
    instructions:
      'Heat oil in non-stick frying pan over low heat. Add onion, celery and carrot, gently fry 5 minutes until soft but not browned. Add rosemary and garlic, cook few seconds more. Tip lentils into pan and add stock. Bring to gentle simmer then place fish fillets on top. Season well with black pepper and sprinkle with parsley if using. Cover with lid and cook fish about 8 minutes until just beginning to flake. Divide lentils between plates and top with fish.',
  dateCreated: '2025-01-13T14:00:00.000Z',
  },
  {
    id: 'seed-chicken-caesar-ish-salad',
    title: 'Chicken Caesar-ish Salad',
    ingredients: [
      { id: 'i-1', name: 'Little Gem lettuces', amount: '2, trimmed and leaves separated' },
      { id: 'i-2', name: 'Cherry tomatoes', amount: '8, halved' },
      { id: 'i-3', name: 'Cooked chicken breast', amount: '200g, cut or shredded into small pieces' },
      { id: 'i-4', name: 'Mixed seeds', amount: '10g' },
      { id: 'i-5', name: 'Parmesan', amount: '20g, finely grated' },
      { id: 'i-6', name: 'Full-fat live Greek yoghurt', amount: '75g' },
      { id: 'i-7', name: 'Small garlic clove', amount: '½, peeled and crushed' },
      { id: 'i-8', name: 'Dried mixed herbs', amount: '1 pinch' },
      { id: 'i-9', name: 'Extra-virgin olive oil', amount: '1 tbsp' },
    ],
    instructions:
      'Make dressing by combining yoghurt, garlic, herbs, oil and 2 tbsp cold water in bowl. Season with pinch of sea salt and lots of ground black pepper. Wash lettuce and drain well. Divide leaves between two shallow bowls and scatter with tomatoes. Place chicken on top, sprinkle with mixed seeds and Parmesan, drizzle with dressing. Season with ground black pepper and serve.',
  dateCreated: '2025-01-13T15:00:00.000Z',
  },
  {
    id: 'seed-shakshuka',
    title: 'Shakshuka',
    ingredients: [
      { id: 'i-1', name: 'Olive oil', amount: '1 tbsp' },
      { id: 'i-2', name: 'Medium red onion', amount: '1, peeled and finely chopped' },
      { id: 'i-3', name: 'Yellow pepper', amount: '1, deseeded and thinly sliced' },
      { id: 'i-4', name: 'Garlic cloves', amount: '2, peeled and crushed' },
      { id: 'i-5', name: 'Ground cumin', amount: '1 tsp' },
      { id: 'i-6', name: 'Hot smoked paprika', amount: '½ tsp, to taste' },
      { id: 'i-7', name: 'Chopped tomatoes', amount: '400g can' },
      { id: 'i-8', name: 'Tomato purée', amount: '1 tbsp' },
      { id: 'i-9', name: 'Medium eggs', amount: '4' },
      { id: 'i-10', name: 'Fresh coriander or flat-leaf parsley', amount: 'small handful, leaves roughly chopped, to serve (optional)' },
    ],
    instructions:
      'Heat oil in medium non-stick frying pan with lid. Add onion and pepper, gently fry 5-6 minutes until softened. Add garlic, cumin and paprika, cook 20-30 seconds. Tip in tomatoes, tomato purée, good pinch sea salt and lots black pepper. Bring to simmer and cook 4 minutes until tomato thickened. Make four holes in vegetable mixture and break egg into each. Cover and cook very gently 3-5 minutes until whites set but yolks remain runny. Sprinkle with herbs if using and season with more black pepper.',
  dateCreated: '2025-01-13T16:00:00.000Z',
  },
  {
    id: 'seed-french-bean-bowl-with-feta-and-pine-nuts',
    title: 'French Bean Bowl with Feta and Pine Nuts',
    ingredients: [
      { id: 'i-1', name: 'Pine nuts or other seeds', amount: '3 tbsp' },
      { id: 'i-2', name: 'French beans', amount: '180g, topped, tailed and cut into 2cm pieces' },
      { id: 'i-3', name: 'Olive oil', amount: '1 tbsp' },
      { id: 'i-4', name: 'Medium tomatoes', amount: '2, cut into 2cm pieces' },
      { id: 'i-5', name: 'Garlic clove', amount: '1, peeled and finely chopped' },
      { id: 'i-6', name: 'Feta cheese', amount: '100g, roughly crumbled' },
      { id: 'i-7', name: 'Chilli flakes', amount: '1 pinch (optional)' },
    ],
    instructions:
      'Toast pine nuts in dry frying pan over medium heat 1-2 minutes until golden. Remove and set aside. Return pan to heat, add beans and oil, fry 2-3 minutes stirring occasionally. Stir in tomatoes and cook 4 minutes. Add garlic and cook 1 minute more. Remove from heat and scatter feta and pine nuts over. Allow to rest minute or so to let feta soften, then divide between bowls and season with black pepper and chilli flakes if using.',
  dateCreated: '2025-01-13T17:00:00.000Z',
  },
  {
    id: 'seed-cheesy-fajita-beef-casserole',
    title: 'Cheesy Fajita Beef Casserole',
    ingredients: [
      { id: 'i-1', name: 'Olive oil', amount: '1½ tbsp' },
      { id: 'i-2', name: 'Red onion', amount: '1, peeled and finely chopped' },
      { id: 'i-3', name: 'Red peppers', amount: '2, deseeded and finely chopped' },
      { id: 'i-4', name: 'Minced beef', amount: '250g' },
      { id: 'i-5', name: 'Black beans', amount: '400g can, drained' },
      { id: 'i-6', name: 'Fajita seasoning', amount: '2 tbsp' },
      { id: 'i-7', name: 'Chopped tomatoes', amount: '400g can, drained' },
      { id: 'i-8', name: 'Jalapeño peppers', amount: '2 tbsp, diced' },
      { id: 'i-9', name: 'Cheddar', amount: '120g, grated' },
      { id: 'i-10', name: 'Greek yoghurt', amount: '4 tbsp' },
    ],
    instructions:
      'Preheat oven to 200°C/Fan 180°C/Gas 6. Place wide-based ovenproof casserole over medium heat. Add oil, onion and peppers, sauté 3-4 minutes. Add minced beef and fry about 4 minutes, stirring to break meat into small pieces. Stir in black beans, fajita seasoning, tomatoes and jalapeño peppers. Simmer 3 minutes and season well. Scatter cheese over and bake 20 minutes until cheese browned and bubbling. Serve with yoghurt alongside.',
  dateCreated: '2025-01-13T18:00:00.000Z',
  },
];

// Tag mapping (title -> tags). Only affects built-in seeds. Spelling normalized.
const TAG_MAP: Record<string, string[]> = {
  "Leek and Goat's Cheese Barley Risotto": ['Mediterranean'],
  'Roasted Vegetable Pasta with Mozzarella': ['Mediterranean'],
  'Lamb Saag': ['Mediterranean'], // loosely categorised for variety
  'Courgetti Spaghetti with Pine Nuts, Spinach and Pancetta': ['Keto','Mediterranean'],
  "Cheat's One-pot Cassoulet": ['Mediterranean'],
  'Chicken Tikka Masala': ['Mediterranean'],
  'Thai Pork Lettuce Cups': ['Keto'],
  'Pesto Courgetti Spaghetti with Red Pepper and Feta': ['Keto','Mediterranean'],
  'Mixed Bean and Miso Salad with Chicken': ['Mediterranean'],
  'Breakfast Burrito': ['Keto'],
  'One Pan Squeezed Sausage Casserole': ['Keto'],
  'Chinese Pork Balls in Mushroom Miso Broth': ['Keto'],
  'Chicken Casserole with Chorizo, Thyme and Olives': ['Mediterranean'],
  'Piri Piri Roast Chicken with Jalapeño Yoghurt': ['Keto','Mediterranean'],
  'Keto-fried Chicken': ['Keto'],
  'White Fish with Herby Green Dressing and Lentils': ['Mediterranean'],
  'Made-in-Minutes Goan Prawn Curry with Spinach': ['Keto'],
  'Easy Chicken Tagine': ['Mediterranean'],
  'Chicken Wrapped in Parma Ham': ['Keto','Mediterranean'],
  'Thai Curry with Prawns': ['Keto'],
  'Pan-fried Fish with Lemon and Parsley': ['Keto','Mediterranean'],
  'Smoked Haddock with Lentils': ['Mediterranean'],
  'Chicken Caesar-ish Salad': ['Keto'],
  'Shakshuka': ['Mediterranean'],
  'French Bean Bowl with Feta and Pine Nuts': ['Mediterranean'],
  'Cheesy Fajita Beef Casserole': ['Keto'],
};

// Optional serves patch mapping (title -> serves). Fill this as values are decided.
const SERVES_MAP: Record<string, number> = {
  "Leek and Goat's Cheese Barley Risotto": 4,
  'Roasted Vegetable Pasta with Mozzarella': 2,
  'Lamb Saag': 4,
  'Courgetti Spaghetti with Pine Nuts, Spinach and Pancetta': 2,
  "Cheat's One-pot Cassoulet": 4,
  'Chicken Tikka Masala': 2,
  'Easy Chicken Tagine': 2,
  'Chicken Wrapped in Parma Ham': 4,
  'Thai Curry with Prawns': 2,
  'Pan-fried Fish with Lemon and Parsley': 1,
  'Smoked Haddock with Lentils': 2,
  'Chicken Caesar-ish Salad': 2,
  'Shakshuka': 2,
  'French Bean Bowl with Feta and Pine Nuts': 2,
  'Cheesy Fajita Beef Casserole': 4,
  'One Pan Squeezed Sausage Casserole': 2,
  'Chinese Pork Balls in Mushroom Miso Broth': 2,
  'Chicken Casserole with Chorizo, Thyme and Olives': 4,
  'Piri Piri Roast Chicken with Jalapeño Yoghurt': 4,
  'Keto-fried Chicken': 2,
  'White Fish with Herby Green Dressing and Lentils': 2,
  'Made-in-Minutes Goan Prawn Curry with Spinach': 4,
  'Thai Pork Lettuce Cups': 2,
  'Pesto Courgetti Spaghetti with Red Pepper and Feta': 2,
  'Mixed Bean and Miso Salad with Chicken': 2,
  'Breakfast Burrito': 1,
};

// Titles of seed recipes that have been intentionally removed from the current seed set
const REMOVED_SEED_TITLES = ['Simple Tomato Pasta', 'Avocado Toast'];

function applySeedPatches(recipes: Recipe[]): Recipe[] {
  // Remove deprecated seed recipes and inject/refresh tags for existing seeds
  return recipes
    .filter((r) => !REMOVED_SEED_TITLES.includes(r.title))
    .map((r) => {
      if (TAG_MAP[r.title]) {
        if (!r.tags || TAG_MAP[r.title].some((t) => !(r.tags as string[]).includes(t))) {
          r = { ...r, tags: TAG_MAP[r.title] };
        }
      }
      // Inject serves value if defined in map and missing/different
      const serves = SERVES_MAP[r.title];
      if (typeof serves === 'number' && r.serves !== serves) {
        r = { ...r, serves };
      }
      return r;
    });
}

for (const r of SEEDED_RECIPES) {
  if (TAG_MAP[r.title]) {
    r.tags = TAG_MAP[r.title];
  }
}

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
      // Still ensure there is at least some data on totally fresh installs
      if (!existingStr || existingRecipes.length === 0) {
        const merged = mergeSeeds(existingRecipes, SEEDED_RECIPES);
        await AsyncStorage.setItem('recipes', JSON.stringify(merged));
    await ensureSeededIngredients(SEEDED_RECIPES);
      } else {
        // Apply non-breaking patches (tag injections / removals) even when no version bump
        const patched = applySeedPatches(existingRecipes);
        if (patched.length !== existingRecipes.length || patched.some((r, i) => r !== existingRecipes[i])) {
          await AsyncStorage.setItem('recipes', JSON.stringify(patched));
        }
      }
      return;
    }

    // Perform upgrade: merge seeds, avoiding duplicates by id
  let merged = mergeSeeds(existingRecipes, SEEDED_RECIPES);
  merged = applySeedPatches(merged);
    await AsyncStorage.setItem('recipes', JSON.stringify(merged));
    await AsyncStorage.setItem(SEED_VERSION_KEY, String(targetVersion));
  await ensureSeededIngredients(SEEDED_RECIPES);
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
  // Add all seeds, replacing any user recipe with the same title
  for (const s of seeds) {
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

    const existingStr = await AsyncStorage.getItem('seededIngredients');
    const existing: SeededIngredientItem[] = existingStr ? JSON.parse(existingStr) : [];

    // Merge, preferring existing entries to keep any manual changes/extensions
    const merged = dedupeByName([...existing, ...toAdd]);
    await AsyncStorage.setItem('seededIngredients', JSON.stringify(merged));
  } catch {
    // ignore
  }
}
