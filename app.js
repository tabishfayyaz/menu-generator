const MAX_DISHES = 7;

const state = {
  recipes: {},
  counts: {},
  menu: [],
  checkedIngredients: new Set(),
  screen: "config"
};

const elements = {
  status: document.querySelector("#status"),
  config: document.querySelector("#config-screen"),
  menu: document.querySelector("#menu-screen"),
  subtitle: document.querySelector("#subtitle"),
  categories: document.querySelector("#categories"),
  total: document.querySelector("#total-count"),
  generate: document.querySelector("#generate-button"),
  edit: document.querySelector("#edit-button"),
  cards: document.querySelector("#menu-cards"),
  summary: document.querySelector("#menu-summary"),
  shoppingSummary: document.querySelector("#shopping-summary"),
  shoppingList: document.querySelector("#shopping-list"),
  feedback: document.querySelector("#copy-feedback"),
  stepConfig: document.querySelector("#step-config"),
  stepMenu: document.querySelector("#step-menu")
};

function validCatalog(data) {
  return data && typeof data === "object" && !Array.isArray(data) && Object.keys(data).length > 0 &&
    Object.entries(data).every(([category, recipes]) => category.trim() && recipes && typeof recipes === "object" && !Array.isArray(recipes) &&
      Object.keys(recipes).length > 0 && Object.entries(recipes).every(([name, ingredients]) => name.trim() && Array.isArray(ingredients) && ingredients.every(item => typeof item === "string" && item.trim())));
}

function showError(message) {
  elements.status.textContent = message;
  elements.status.classList.add("error");
  elements.config.hidden = true;
}

function totalSelected() {
  return Object.values(state.counts).reduce((total, count) => total + count, 0);
}

function iconButton(label, symbol, handler, disabled = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "icon-button";
  button.setAttribute("aria-label", label);
  button.innerHTML = symbol === "refresh"
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 7v5h-5"/><path d="M4.9 9A7.5 7.5 0 0 1 18 6.2L20 12M4 17v-5h5"/><path d="M19.1 15A7.5 7.5 0 0 1 6 17.8L4 12"/></svg>'
    : `<span aria-hidden="true">${symbol}</span>`;
  button.disabled = disabled;
  button.addEventListener("click", handler);
  return button;
}

function renderCategories() {
  elements.categories.replaceChildren();
  for (const [category, recipes] of Object.entries(state.recipes)) {
    const row = document.createElement("div");
    row.className = "category-row";
    const details = document.createElement("div");
    const name = document.createElement("div");
    name.className = "category-name";
    name.textContent = category;
    const available = document.createElement("div");
    available.className = "category-available";
    available.textContent = `${Object.keys(recipes).length} ${Object.keys(recipes).length === 1 ? "recipe" : "recipes"} available`;
    details.append(name, available);

    const counter = document.createElement("div");
    counter.className = "counter";
    const count = state.counts[category];
    counter.append(
      iconButton(`Remove one ${category} dish`, "−", () => updateCount(category, -1), count === 0),
      Object.assign(document.createElement("span"), { className: "counter-value", textContent: String(count) }),
      iconButton(`Add one ${category} dish`, "+", () => updateCount(category, 1), count >= Object.keys(recipes).length || totalSelected() >= MAX_DISHES)
    );
    row.append(details, counter);
    elements.categories.append(row);
  }
  const selected = totalSelected();
  elements.total.textContent = `${selected} / ${MAX_DISHES}`;
  elements.generate.disabled = selected === 0;
}

function updateCount(category, amount) {
  const next = state.counts[category] + amount;
  if (next < 0 || next > Object.keys(state.recipes[category]).length || (amount > 0 && totalSelected() >= MAX_DISHES)) return;
  state.counts[category] = next;
  renderCategories();
}

function shuffled(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function generateMenu() {
  const next = [];
  for (const [category, count] of Object.entries(state.counts)) {
    const names = shuffled(Object.keys(state.recipes[category])).slice(0, count);
    names.forEach(name => next.push({ category, name }));
  }
  state.menu = shuffled(next);
  state.checkedIngredients = new Set();
  setScreen("menu");
  renderMenu();
}

function setScreen(screen) {
  state.screen = screen;
  const isMenu = screen === "menu";
  elements.config.hidden = isMenu;
  elements.menu.hidden = !isMenu;
  elements.status.hidden = true;
  elements.subtitle.textContent = isMenu ? "Your generated weekly menu" : "Choose your weekly dishes";
  elements.stepConfig.classList.toggle("is-current", !isMenu);
  elements.stepConfig.classList.toggle("is-done", isMenu);
  elements.stepMenu.classList.toggle("is-current", isMenu);
}

function sameRecipe(a, b) { return a.category === b.category && a.name === b.name; }

function renderMenu() {
  elements.cards.replaceChildren();
  elements.summary.textContent = `${state.menu.length} ${state.menu.length === 1 ? "dish" : "dishes"} selected`;
  state.menu.forEach((dish, index) => {
    const card = document.createElement("article");
    card.className = "menu-card";
    const number = document.createElement("span");
    number.className = "dish-number";
    number.textContent = String(index + 1);
    const details = document.createElement("div");
    details.className = "dish-details";
    const name = document.createElement("div");
    name.className = "dish-name";
    name.textContent = dish.name;
    const category = document.createElement("div");
    category.className = "dish-category";
    category.textContent = dish.category;
    details.append(name, category);
    const alternatives = Object.keys(state.recipes[dish.category]).filter(recipe =>
      recipe !== dish.name && !state.menu.some((item, itemIndex) => itemIndex !== index && item.category === dish.category && item.name === recipe));
    card.append(number, details, iconButton(`Replace ${dish.name}`, "refresh", () => replaceDish(index), alternatives.length === 0));
    elements.cards.append(card);
  });
  renderShoppingList();
}

function replaceDish(index) {
  const current = state.menu[index];
  const alternatives = Object.keys(state.recipes[current.category]).filter(recipe => recipe !== current.name &&
    !state.menu.some((dish, i) => i !== index && dish.category === current.category && dish.name === recipe));
  if (!alternatives.length) return;
  state.menu[index] = { category: current.category, name: shuffled(alternatives)[0] };
  renderMenu();
}

function ingredientKey(value) { return value.trim().toLocaleLowerCase(); }

function renderShoppingList() {
  const ingredients = new Map();
  for (const dish of state.menu) {
    for (const ingredient of state.recipes[dish.category][dish.name]) {
      const key = ingredientKey(ingredient);
      if (key && !ingredients.has(key)) ingredients.set(key, ingredient.trim());
    }
  }
  const sorted = [...ingredients.entries()].sort((a, b) => a[1].localeCompare(b[1], undefined, { sensitivity: "base" }));
  const remainingChecks = new Set([...state.checkedIngredients].filter(key => ingredients.has(key)));
  state.checkedIngredients = remainingChecks;
  elements.shoppingList.replaceChildren();
  for (const [key, label] of sorted) {
    const item = document.createElement("li");
    const labelElement = document.createElement("label");
    labelElement.className = `shopping-item${state.checkedIngredients.has(key) ? " is-checked" : ""}`;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.checkedIngredients.has(key);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) state.checkedIngredients.add(key);
      else state.checkedIngredients.delete(key);
      labelElement.classList.toggle("is-checked", checkbox.checked);
      updateShoppingSummary(sorted.length);
    });
    const text = document.createElement("span");
    text.textContent = label;
    labelElement.append(checkbox, text);
    item.append(labelElement);
    elements.shoppingList.append(item);
  }
  updateShoppingSummary(sorted.length);
}

function updateShoppingSummary(count) {
  elements.shoppingSummary.textContent = `${count} unique ${count === 1 ? "ingredient" : "ingredients"} · ${state.checkedIngredients.size} checked`;
}

async function copyText(text, label) {
  elements.feedback.classList.remove("error");
  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(text);
    elements.feedback.textContent = `${label} copied to clipboard.`;
  } catch {
    elements.feedback.textContent = "Could not copy. Please check clipboard permissions.";
    elements.feedback.classList.add("error");
  }
}

document.querySelector("#generate-button").addEventListener("click", generateMenu);
elements.edit.addEventListener("click", () => setScreen("config"));
document.querySelector("#regenerate-button").addEventListener("click", generateMenu);
document.querySelector("#reset-button").addEventListener("click", () => {
  state.checkedIngredients.clear();
  renderShoppingList();
});
document.querySelector("#copy-menu-button").addEventListener("click", () =>
  copyText(state.menu.map((dish, index) => `${index + 1}. ${dish.name} (${dish.category})`).join("\n"), "Menu"));
document.querySelector("#copy-shopping-button").addEventListener("click", () => {
  const items = [...elements.shoppingList.querySelectorAll(".shopping-item span")].map(item => `• ${item.textContent}`);
  copyText(items.join("\n"), "Shopping list");
});

async function loadRecipes() {
  try {
    const response = await fetch("recipes.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Recipe file returned ${response.status}`);
    const data = await response.json();
    if (!validCatalog(data)) throw new Error("Recipe data is empty or has an invalid format");
    state.recipes = data;
    state.counts = Object.fromEntries(Object.keys(data).map(category => [category, 0]));
    elements.status.hidden = true;
    elements.config.hidden = false;
    renderCategories();
  } catch {
    showError("We couldn't load the recipes. Check that recipes.json is valid and run the site from a local web server.");
  }
}

loadRecipes();
