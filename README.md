# Menu Planner

A mobile-first weekly menu generator built with vanilla HTML, CSS, and JavaScript. Choose dishes by category, generate or replace recipes, and get a deduplicated shopping list with checkboxes and clipboard actions. Menu and checkbox state exist only in memory; refreshing starts over.

## Project files

- `index.html` — application structure
- `style.css` — responsive styling
- `app.js` — loading, selection, randomization, and shopping-list behavior
- `recipes.json` — editable recipe catalog
- `ingredients.json` — master list of allowed ingredient names
- `validate-recipes.js` — dependency-free terminal check (requires Node.js)
- `menu-planner-icon.png` — 180×180 iPhone Home Screen icon

## Customize recipes

Edit `recipes.json` using a top-level category object. Each category maps recipe names to arrays of ingredient strings. For example:

```json
{
  "Lentils": {
    "Chana Daal": ["Chana Daal", "Salt", "Turmeric", "Onion", "Tomatoes"]
  }
}
```

Add another category by adding another top-level key; categories and recipes are discovered from the file automatically. Keep each recipe's ingredients as an array of strings and ensure the file remains valid JSON. Each category needs at least one recipe. Recipe names must be unique across all categories. Change `MAX_DISHES` near the top of `app.js` to adjust the maximum weekly menu size.

Keep `ingredients.json` as an alphabetically sorted JSON array of unique ingredient names. Whenever you add an ingredient to a recipe, add that ingredient to the master list too. Matching ignores capitalization and surrounding whitespace, but use a consistent canonical spelling where possible.

### Validate recipe ingredients

From the project directory, run this command in a terminal (requires Node.js; no packages need to be installed):

```sh
node validate-recipes.js
```

The validator checks that every recipe ingredient appears in `ingredients.json`, that the master list has no duplicate values, and that recipe names are unique across all categories. Duplicate checks ignore capitalization and surrounding whitespace. If an ingredient is missing, it reports the recipe and suggests up to three similar existing master-list values when available. It exits with a non-zero status on failure, so it can also be used in scripts or CI checks.

## Run locally

From this directory, start a simple HTTP server:

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000>. Opening `index.html` directly with `file://` may not work because browsers generally block fetching `recipes.json` from a local file for security reasons.

To open the local app on an iPhone connected to the same Wi-Fi, start the server bound to the network interface:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

On macOS, get your Wi-Fi IP address in Terminal with `ipconfig getifaddr en0` (or find it in **System Settings → Wi-Fi → Details → IP address**). Then visit `http://YOUR-COMPUTER-IP:8000/` in iPhone Safari. Reload the page after editing recipe data; JSON requests bypass the browser cache.

## Deploy to GitHub Pages

Push the files to the repository's `main` branch, then select **GitHub Settings → Pages → Build and deployment → Deploy from a branch → main → /(root)** and save. The app uses relative paths, so it works when hosted in a repository subpath such as `https://USERNAME.github.io/menu-generator/`.

## Add to iPhone Home Screen

Open the site in Safari on your iPhone, tap **Share**, then tap **Add to Home Screen**. Confirm **Menu Planner** and tap **Add**. The page sets iOS standalone web-app metadata and references `menu-planner-icon.png` using a relative path, so the icon also works on GitHub Pages repository subpaths. Launching it from the Home Screen opens the standalone web-app presentation.
