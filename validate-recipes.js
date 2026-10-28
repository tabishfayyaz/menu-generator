const fs = require("node:fs");

const recipes = JSON.parse(fs.readFileSync("recipes.json", "utf8"));
const masterIngredients = JSON.parse(fs.readFileSync("ingredients.json", "utf8"));

if (!Array.isArray(masterIngredients) || !masterIngredients.every(item => typeof item === "string")) {
  console.error("Invalid ingredients.json: expected an array of strings.");
  process.exit(1);
}

const masterKeys = new Set(masterIngredients.map(item => item.trim().toLocaleLowerCase()));
const masterOccurrences = new Map();
for (const ingredient of masterIngredients) {
  const key = ingredient.trim().toLocaleLowerCase();
  if (!masterOccurrences.has(key)) masterOccurrences.set(key, []);
  masterOccurrences.get(key).push(ingredient);
}
const duplicates = [...masterOccurrences.entries()].filter(([, values]) => values.length > 1);
const missing = [];
const recipesByName = new Map();

function editDistance(left, right) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= right.length; j++) {
      const above = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (left[i - 1] === right[j - 1] ? 0 : 1)
      );
      diagonal = above;
    }
  }
  return previous[right.length];
}

function suggestIngredients(ingredient) {
  if (typeof ingredient !== "string") return [];
  const key = ingredient.trim().toLocaleLowerCase();
  const threshold = Math.max(2, Math.floor(key.length * 0.25));
  return [...new Set(masterIngredients)]
    .map(value => ({ value, distance: editDistance(key, value.trim().toLocaleLowerCase()) }))
    .filter(item => item.distance > 0 && item.distance <= threshold)
    .sort((a, b) => a.distance - b.distance || a.value.localeCompare(b.value))
    .slice(0, 3)
    .map(item => item.value);
}

if (duplicates.length) {
  console.error("Duplicate values in ingredients.json (case and surrounding whitespace are ignored):");
  for (const [key, values] of duplicates) {
    console.error(`- ${key || "(blank value)"}: ${values.map(value => JSON.stringify(value)).join(", ")}`);
  }
  process.exitCode = 1;
}

for (const [category, dishes] of Object.entries(recipes)) {
  for (const [recipe, ingredients] of Object.entries(dishes)) {
    const recipeKey = recipe.trim().toLocaleLowerCase();
    if (!recipesByName.has(recipeKey)) recipesByName.set(recipeKey, []);
    recipesByName.get(recipeKey).push({ category, recipe });

    if (!Array.isArray(ingredients)) {
      console.error(`Invalid ingredients for ${category} / ${recipe}: expected an array.`);
      process.exitCode = 1;
      continue;
    }
    for (const ingredient of ingredients) {
      if (typeof ingredient !== "string" || !masterKeys.has(ingredient.trim().toLocaleLowerCase())) {
        missing.push({ category, recipe, ingredient });
      }
    }
  }
}

const duplicateRecipes = [...recipesByName.entries()].filter(([, entries]) => entries.length > 1);
if (duplicateRecipes.length) {
  console.error("Duplicate recipe names found across recipes.json (case and surrounding whitespace are ignored):");
  for (const [name, entries] of duplicateRecipes) {
    const locations = entries.map(({ category, recipe }) => `${category} / ${recipe}`).join(", ");
    console.error(`- ${name || "(blank name)"}: ${locations}`);
  }
  process.exitCode = 1;
}

if (missing.length) {
  console.error("Ingredient check failed. Add these values to ingredients.json:");
  for (const item of missing) {
    const suggestions = suggestIngredients(item.ingredient);
    const suggestionText = suggestions.length ? ` Did you mean: ${suggestions.join(", ")}?` : "";
    console.error(`- ${item.ingredient} (used by ${item.category} / ${item.recipe}).${suggestionText}`);
  }
  process.exitCode = 1;
} else if (process.exitCode !== 1) {
  console.log("Ingredient check passed: every recipe ingredient exists in ingredients.json.");
}
