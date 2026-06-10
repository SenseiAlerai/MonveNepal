const grid = document.querySelector(".product-grid");
const filterButtons = document.querySelector(".filter-buttons");
const categoryStrip = document.querySelector(".category-strip");
const searchInput = document.querySelector("#searchInput");
const menuToggle = document.querySelector(".menu-toggle");
const mobilePanel = document.querySelector(".mobile-panel");
let activeFilter = "All";
let products = [];
let categories = [];

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const visibleProducts = products.filter((product) => {
    const matchesFilter = activeFilter === "All" || product.categorySlug === activeFilter;
    const matchesSearch = [product.name, product.category, product.color, product.tag].join(" ").toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  grid.innerHTML = visibleProducts.map((product) => `
    <article class="product-card">
      <div class="product-media">
        <img src="${product.imageUrl || "assets/catalog-bags.png"}" alt="${product.name}">
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <div class="meta">
          <span>${product.color}</span>
          <strong>${product.tag}</strong>
        </div>
        <a class="add-button" href="#inquiry">Ask about this bag</a>
      </div>
    </article>
  `).join("") || `<p class="empty-state">No bags match that search.</p>`;
}

function renderCategories() {
  categoryStrip.innerHTML = categories.map((category) => `
    <a href="#catalog" data-filter="${category.slug}"><span>${category.name}</span></a>
  `).join("");

  filterButtons.innerHTML = [
    `<button class="filter active" type="button" data-filter="All">All</button>`,
    ...categories.map((category) => `
      <button class="filter" type="button" data-filter="${category.slug}">${category.name.replace(/ bags?/i, "")}</button>
    `)
  ].join("");
}

function bindFilters() {
  document.querySelectorAll("[data-filter]").forEach((item) => {
    item.addEventListener("click", () => {
      activeFilter = item.dataset.filter;
      document.querySelectorAll(".filter").forEach((button) => {
        button.classList.toggle("active", button.dataset.filter === activeFilter);
      });
      renderProducts();
    });
  });
}

function applySettings(settings) {
  document.querySelectorAll("[data-setting]").forEach((node) => {
    const key = node.dataset.setting;
    if (settings[key]) node.textContent = settings[key];
  });
  document.querySelectorAll("[data-setting-image]").forEach((node) => {
    const key = node.dataset.settingImage;
    if (settings[key]) node.src = settings[key];
  });
}

async function loadCatalog() {
  try {
    const response = await fetch("/api/catalog");
    if (!response.ok) throw new Error("Catalog request failed");
    const data = await response.json();
    products = data.bags || [];
    categories = data.categories || [];
    applySettings(data.settings || {});
    renderCategories();
    bindFilters();
    renderProducts();
  } catch (error) {
    grid.innerHTML = `<p class="empty-state">Catalog is loading. Please refresh in a moment.</p>`;
  }
}

searchInput.addEventListener("input", renderProducts);

menuToggle.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("nav-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  mobilePanel.setAttribute("aria-hidden", String(!isOpen));
});

document.querySelectorAll(".mobile-panel a").forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    menuToggle.setAttribute("aria-expanded", "false");
    mobilePanel.setAttribute("aria-hidden", "true");
  });
});

document.querySelector(".search-toggle").addEventListener("click", () => {
  searchInput.focus();
});

loadCatalog();
