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

  if (!visibleProducts.length) {
    grid.innerHTML = `<p class="empty-state">No bags match that search.</p>`;
    return;
  }

  const visibleCategories = categories.filter((category) => {
    if (activeFilter !== "All" && category.slug !== activeFilter) return false;
    return visibleProducts.some((product) => product.categorySlug === category.slug);
  });

  grid.innerHTML = visibleCategories.map((category) => {
    const categoryProducts = visibleProducts.filter((product) => product.categorySlug === category.slug);
    return `
      <section class="collection-section" id="collection-${category.slug}">
        <div class="collection-heading">
          <p class="eyebrow">${categoryProducts.length} piece${categoryProducts.length === 1 ? "" : "s"}</p>
          <h3>${category.name}</h3>
        </div>
        <div class="collection-rail">
          ${categoryProducts.map(renderProductCard).join("")}
        </div>
      </section>
    `;
  }).join("");
}

function renderProductCard(product) {
  return `
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
  `;
}

function renderCategories() {
  categoryStrip.innerHTML = categories.map((category) => `
    <a href="#collection-${category.slug}" data-filter="${category.slug}"><span>${category.name}</span></a>
  `).join("");

  filterButtons.innerHTML = [
    `<button class="filter active" type="button" data-filter="All">All</button>`,
    ...categories.map((category) => `
      <button class="filter" type="button" data-filter="${category.slug}">${category.name}</button>
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

function closeMobileMenu() {
  document.body.classList.remove("nav-open");
  menuToggle.setAttribute("aria-expanded", "false");
  mobilePanel.setAttribute("aria-hidden", "true");
}

menuToggle.addEventListener("click", (event) => {
  event.stopPropagation();
  const isOpen = document.body.classList.toggle("nav-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  mobilePanel.setAttribute("aria-hidden", String(!isOpen));
});

document.querySelectorAll(".mobile-panel a").forEach((link) => {
  link.addEventListener("click", closeMobileMenu);
});

mobilePanel.addEventListener("click", (event) => {
  event.stopPropagation();
});

document.addEventListener("click", (event) => {
  if (!document.body.classList.contains("nav-open")) return;
  if (mobilePanel.contains(event.target) || menuToggle.contains(event.target)) return;
  closeMobileMenu();
});

document.addEventListener("touchstart", (event) => {
  if (!document.body.classList.contains("nav-open")) return;
  if (mobilePanel.contains(event.target) || menuToggle.contains(event.target)) return;
  closeMobileMenu();
}, { passive: true });

window.addEventListener("scroll", () => {
  if (document.body.classList.contains("nav-open")) closeMobileMenu();
}, { passive: true });

window.addEventListener("resize", () => {
  if (document.body.classList.contains("nav-open")) closeMobileMenu();
});

document.querySelector(".search-toggle").addEventListener("click", () => {
  searchInput.focus();
});

loadCatalog();
