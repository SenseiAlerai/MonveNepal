const loginPanel = document.querySelector("#loginPanel");
const adminApp = document.querySelector("#adminApp");
const loginForm = document.querySelector("#loginForm");
const loginNotice = document.querySelector("#loginNotice");
const logoutButton = document.querySelector("#logoutButton");
const settingsForm = document.querySelector("#settingsForm");
const settingsNotice = document.querySelector("#settingsNotice");
const categoryForm = document.querySelector("#categoryForm");
const categoryList = document.querySelector("#categoryList");
const bagForm = document.querySelector("#bagForm");
const bagNotice = document.querySelector("#bagNotice");
const bagList = document.querySelector("#bagList");
const clearBagForm = document.querySelector("#clearBagForm");
const addVariant = document.querySelector("#addVariant");
const variantList = document.querySelector("#variantList");

let categories = [];
let bags = [];

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : {};
  if (!response.ok) {
    throw new Error(body.error || "Request failed");
  }
  return body;
}

function showApp(show) {
  loginPanel.hidden = show;
  adminApp.hidden = !show;
}

async function loadAdminData() {
  const data = await request("/api/admin/data");
  categories = data.categories || [];
  bags = data.bags || [];
  fillSettings(data.settings || {});
  renderCategoryOptions();
  renderCategories();
  renderBags();
}

function fillSettings(settings) {
  Object.entries(settings).forEach(([key, value]) => {
    const input = settingsForm.elements[key];
    if (input) input.value = value || "";
  });
}

function renderCategoryOptions() {
  bagForm.elements.categoryId.innerHTML = [
    `<option value="">No category</option>`,
    ...categories.map((category) => `<option value="${category.id}">${category.name}</option>`)
  ].join("");
}

function renderCategories() {
  categoryList.innerHTML = categories.map((category) => `
    <form class="category-row" data-category-id="${category.id}">
      <input name="name" value="${category.name}">
      <input name="sortOrder" type="number" value="${category.sort_order || 0}">
      <select name="visible">
        <option value="1" ${category.visible === 0 ? "" : "selected"}>Visible</option>
        <option value="0" ${category.visible === 0 ? "selected" : ""}>Hidden</option>
      </select>
      <div class="form-actions">
        <button type="submit">Save</button>
        <button class="delete-button" type="button" data-delete-category="${category.id}">Delete</button>
      </div>
    </form>
  `).join("");
}

function renderBags() {
  bagList.innerHTML = bags.map((bag) => `
    <article class="bag-card">
      <img src="${bag.imageUrl}" alt="${bag.name}">
      <div class="bag-card-body">
        <h3>${bag.name}</h3>
        <p>${bag.category || "No category"} - ${(bag.variants || []).length || 1} color${((bag.variants || []).length || 1) === 1 ? "" : "s"}</p>
        <div class="swatch-row">
          ${(bag.variants || []).map((variant) => `
            <span class="swatch" style="background:${variant.colorCode || "#d9ad5f"}" title="${variant.color || "Color"}"></span>
          `).join("")}
        </div>
        <p>${bag.tag || "No tag"}</p>
        <div class="bag-actions">
          <button type="button" data-edit-bag="${bag.id}">Edit</button>
          <button class="delete-button" type="button" data-delete-bag="${bag.id}">Delete</button>
        </div>
      </div>
    </article>
  `).join("");
}

function newVariant() {
  return {
    id: "",
    color: "",
    colorCode: "#d9ad5f",
    imageUrl: ""
  };
}

function currentVariantsFromRows() {
  return Array.from(variantList.querySelectorAll(".variant-row")).map((row) => ({
    id: row.dataset.variantId || "",
    color: row.querySelector("[data-variant-color]").value,
    colorCode: row.querySelector("[data-variant-code]").value || "#d9ad5f",
    imageUrl: row.dataset.imageUrl || ""
  }));
}

function renderVariantEditor(variants = [newVariant()]) {
  const rows = variants.length ? variants : [newVariant()];
  variantList.innerHTML = rows.map((variant, index) => `
    <div class="variant-row" data-variant-id="${variant.id || ""}" data-image-url="${variant.imageUrl || ""}">
      <div class="variant-preview">
        ${variant.imageUrl ? `<img src="${variant.imageUrl}" alt="${variant.color || "Bag color"}">` : `<span>No image</span>`}
      </div>
      <label>Color Name<input data-variant-color value="${variant.color || ""}" placeholder="Ivory, Black, Wine..."></label>
      <label>Color Code<input data-variant-code type="color" value="${variant.colorCode || "#d9ad5f"}"></label>
      <label>Image<input name="variantImage_${index}" type="file" accept="image/*"></label>
      <button class="delete-button" type="button" data-remove-variant>Remove</button>
    </div>
  `).join("");
}

function resetBagForm() {
  bagForm.reset();
  bagForm.elements.id.value = "";
  bagForm.elements.visible.value = "1";
  bagForm.elements.sortOrder.value = "0";
  renderVariantEditor();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginNotice.textContent = "";
  try {
    await request("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(loginForm)))
    });
    showApp(true);
    await loadAdminData();
  } catch (error) {
    loginNotice.textContent = error.message;
  }
});

logoutButton.addEventListener("click", async () => {
  await request("/api/admin/logout", { method: "POST" });
  showApp(false);
});

settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  settingsNotice.textContent = "";
  try {
    await request("/api/admin/settings", {
      method: "PUT",
      body: new FormData(settingsForm)
    });
    settingsForm.elements.heroImageFile.value = "";
    settingsForm.elements.storyImageFile.value = "";
    settingsForm.elements.contactHeroImageFile.value = "";
    settingsForm.elements.contactFeatureImageFile.value = "";
    settingsNotice.textContent = "Homepage saved.";
  } catch (error) {
    settingsNotice.textContent = error.message;
  }
});

categoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await request("/api/admin/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.fromEntries(new FormData(categoryForm)))
  });
  categoryForm.reset();
  await loadAdminData();
});

categoryList.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target.closest("[data-category-id]");
  await request(`/api/admin/categories/${form.dataset.categoryId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: form.elements.name.value,
      sortOrder: form.elements.sortOrder.value,
      visible: form.elements.visible.value === "1"
    })
  });
  await loadAdminData();
});

categoryList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-delete-category]");
  if (!button) return;
  if (!confirm("Delete this category? Bags in it will keep existing but lose the category.")) return;
  await request(`/api/admin/categories/${button.dataset.deleteCategory}`, { method: "DELETE" });
  await loadAdminData();
});

bagForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  bagNotice.textContent = "";
  const id = bagForm.elements.id.value;
  const formData = new FormData(bagForm);
  formData.set("variants", JSON.stringify(currentVariantsFromRows()));
  try {
    await request(id ? `/api/admin/bags/${id}` : "/api/admin/bags", {
      method: id ? "PUT" : "POST",
      body: formData
    });
    resetBagForm();
    bagNotice.textContent = "Bag saved.";
    await loadAdminData();
  } catch (error) {
    bagNotice.textContent = error.message;
  }
});

bagList.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit-bag]");
  const deleteButton = event.target.closest("[data-delete-bag]");

  if (editButton) {
    const bag = bags.find((item) => String(item.id) === editButton.dataset.editBag);
    if (!bag) return;
    bagForm.elements.id.value = bag.id;
    bagForm.elements.name.value = bag.name || "";
    bagForm.elements.categoryId.value = categories.find((category) => category.slug === bag.categorySlug)?.id || "";
    bagForm.elements.tag.value = bag.tag || "";
    bagForm.elements.description.value = bag.description || "";
    bagForm.elements.sortOrder.value = bag.sort_order || 0;
    bagForm.elements.visible.value = bag.visible === 0 ? "0" : "1";
    renderVariantEditor(bag.variants || [{
      id: "",
      color: bag.color || "",
      colorCode: "#d9ad5f",
      imageUrl: bag.imageUrl || ""
    }]);
    bagForm.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (deleteButton) {
    if (!confirm("Delete this bag?")) return;
    await request(`/api/admin/bags/${deleteButton.dataset.deleteBag}`, { method: "DELETE" });
    await loadAdminData();
  }
});

clearBagForm.addEventListener("click", resetBagForm);

addVariant.addEventListener("click", () => {
  renderVariantEditor([...currentVariantsFromRows(), newVariant()]);
});

variantList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-variant]");
  if (!button) return;
  const variants = currentVariantsFromRows();
  if (variants.length <= 1) {
    renderVariantEditor();
    return;
  }
  const index = Array.from(variantList.querySelectorAll(".variant-row")).indexOf(button.closest(".variant-row"));
  variants.splice(index, 1);
  renderVariantEditor(variants);
});

renderVariantEditor();

request("/api/admin/me")
  .then(async (data) => {
    showApp(data.authenticated);
    if (data.authenticated) await loadAdminData();
  })
  .catch(() => showApp(false));
