# Menu Planner

A mobile-first weekly menu generator built with vanilla HTML, CSS, and JavaScript. Choose dishes by category, generate or replace recipes, and get a deduplicated shopping list with checkboxes and clipboard actions. Menu and checkbox state exist only in memory; refreshing starts over.

## Project files

- `index.html` — application structure
- `style.css` — responsive styling
- `app.js` — loading, selection, randomization, and shopping-list behavior
- `recipes.json` — editable recipe catalog
- `ingredients.json` — master list of allowed ingredient names
- `validate-recipes.js` — dependency-free terminal check (requires Node.js)

## Customize recipes

Edit `recipes.json` using a top-level category object. Each category maps recipe names to arrays of ingredient strings. For example:

```json
{
  "Lentils": {
    "Kaali Daal": ["Black lentils", "Salt", "Zeera"]
  }
}
```

Add another category by adding another top-level key; categories and recipes are discovered from the file automatically. Keep each recipe's ingredients as an array of strings and ensure the file remains valid JSON. Each category must have at least one recipe. Change `MAX_DISHES` near the top of `app.js` to adjust the maximum weekly menu size.

Keep `ingredients.json` as a JSON array of canonical ingredient names. Whenever you add an ingredient to a recipe, add its name to this master list as well.

### Validate recipe ingredients

From the project directory, run this command in a terminal (requires Node.js; no packages need to be installed):

```sh
node validate-recipes.js
```

The validator checks that every recipe ingredient appears in `ingredients.json`, that the master list has no duplicate values, and that recipe names are unique across all categories. Duplicate checks ignore capitalization and surrounding whitespace. If an ingredient is missing, it reports the recipe and suggests up to three similar existing master-list values when available. It exits with a non-zero status on failure, so it can also be used in scripts or CI checks. Alternatively, serve the app locally, open the browser developer console, and run `await validateRecipeIngredients()` to check recipe-to-master-list references.

## Run locally

From this directory, start a simple HTTP server:

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000>. Opening `index.html` directly with `file://` may not work because browsers generally block fetching `recipes.json` from a local file for security reasons.

## Deploy to GitHub Pages

Push the files to the repository's `main` branch, then select **GitHub Settings → Pages → Build and deployment → Deploy from a branch → main → /(root)** and save. The app uses relative paths, so it works when hosted in a repository subpath such as `https://USERNAME.github.io/menu-generator/`.

## Add to iPhone Home Screen

Open the deployed site in Safari on your iPhone, tap **Share**, then tap **Add to Home Screen**. Confirm the name and tap **Add**.
