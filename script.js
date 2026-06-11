const grid = document.querySelector(".product-grid");
const filterButtons = document.querySelector(".filter-buttons");
const categoryStrip = document.querySelector(".category-strip");
const searchInput = document.querySelector("#searchInput");
const menuToggle = document.querySelector(".menu-toggle");
const mobilePanel = document.querySelector(".mobile-panel");
const siteHeader = document.querySelector(".site-header");
const productModal = document.querySelector("#productModal");
const modalProductImage = document.querySelector("#modalProductImage");
const modalProductCategory = document.querySelector("#modalProductCategory");
const modalProductName = document.querySelector("#modalProductName");
const modalProductDescription = document.querySelector("#modalProductDescription");
const modalColorSwatch = document.querySelector("#modalColorSwatch");
const modalColorName = document.querySelector("#modalColorName");
const modalVariantRail = document.querySelector("#modalVariantRail");
const modalInquiryLink = document.querySelector("#modalInquiryLink");
let activeFilter = "All";
let products = [];
let categories = [];

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const visibleProducts = products.filter((product) => {
    const matchesFilter = activeFilter === "All" || product.categorySlug === activeFilter;
    const variantColors = (product.variants || []).map((variant) => variant.color).join(" ");
    const matchesSearch = [product.name, product.category, product.color, variantColors, product.tag].join(" ").toLowerCase().includes(query);
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
  const variants = product.variants?.length ? product.variants : [{
    color: product.color,
    colorCode: "#d9ad5f",
    imageUrl: product.imageUrl
  }];
  return `
    <article class="product-card" data-open-product="${product.id}" tabindex="0">
      <div class="product-media">
        <img src="${product.imageUrl || "assets/catalog-bags.png"}" alt="${product.name}">
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <div class="meta">
          <span>${variants.length} color${variants.length === 1 ? "" : "s"}</span>
          <strong>${product.tag}</strong>
        </div>
        <button class="add-button" type="button" data-open-product="${product.id}">View colors</button>
      </div>
    </article>
  `;
}

function productVariants(product) {
  return product.variants?.length ? product.variants : [{
    id: "default",
    color: product.color || "Default",
    colorCode: "#d9ad5f",
    imageUrl: product.imageUrl || "assets/catalog-bags.png"
  }];
}

function selectModalVariant(product, variantId) {
  const variants = productVariants(product);
  const variant = variants.find((item) => String(item.id) === String(variantId)) || variants[0];
  modalProductImage.src = variant.imageUrl || product.imageUrl || "assets/catalog-bags.png";
  modalProductImage.alt = `${product.name} in ${variant.color}`;
  modalColorSwatch.style.background = variant.colorCode || "#d9ad5f";
  modalColorName.textContent = variant.color || product.color || "Default";
  modalVariantRail.querySelectorAll("[data-modal-variant]").forEach((button) => {
    button.classList.toggle("active", String(button.dataset.modalVariant) === String(variant.id));
  });
}

function openProductModal(productId) {
  const product = products.find((item) => String(item.id) === String(productId));
  if (!product) return;
  const variants = productVariants(product);
  modalProductCategory.textContent = product.category || "MONVE NEPAL";
  modalProductName.textContent = product.name || "";
  modalProductDescription.textContent = product.description || "";
  modalVariantRail.innerHTML = variants.map((variant) => `
    <button class="variant-pill" type="button" data-modal-variant="${variant.id}">
      <img src="${variant.imageUrl || product.imageUrl || "assets/catalog-bags.png"}" alt="${variant.color || "Bag color"}">
      <span class="variant-color-dot" style="background:${variant.colorCode || "#d9ad5f"}"></span>
      <strong>${variant.color || "Color"}</strong>
    </button>
  `).join("");
  modalVariantRail.querySelectorAll("[data-modal-variant]").forEach((button) => {
    button.addEventListener("click", () => selectModalVariant(product, button.dataset.modalVariant));
  });
  modalInquiryLink.href = `#inquiry`;
  productModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  selectModalVariant(product, variants[0]?.id);
}

function closeProductModal() {
  productModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
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
    node.src = settings[key] || node.dataset.fallbackSrc || "";
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
    document.body.classList.remove("cms-loading");
  } catch (error) {
    document.querySelectorAll("[data-setting-image]").forEach((node) => {
      node.src = node.dataset.fallbackSrc || "";
    });
    document.body.classList.remove("cms-loading");
    grid.innerHTML = `<p class="empty-state">Catalog is loading. Please refresh in a moment.</p>`;
  }
}

searchInput.addEventListener("input", renderProducts);

grid.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-open-product]");
  if (!trigger) return;
  event.preventDefault();
  openProductModal(trigger.dataset.openProduct);
});

grid.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const trigger = event.target.closest("[data-open-product]");
  if (!trigger) return;
  event.preventDefault();
  openProductModal(trigger.dataset.openProduct);
});

productModal.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-modal]")) closeProductModal();
});

modalInquiryLink.addEventListener("click", closeProductModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && productModal.getAttribute("aria-hidden") === "false") {
    closeProductModal();
  }
});

function closeMobileMenu() {
  document.body.classList.remove("nav-open");
  menuToggle.setAttribute("aria-expanded", "false");
  mobilePanel.setAttribute("aria-hidden", "true");
}

function syncMobilePanelOffset() {
  if (!siteHeader) return;
  const headerRect = siteHeader.getBoundingClientRect();
  const panelTop = Math.max(0, headerRect.top) + siteHeader.offsetHeight;
  document.documentElement.style.setProperty("--header-offset", `${siteHeader.offsetHeight}px`);
  document.documentElement.style.setProperty("--mobile-panel-top", `${panelTop}px`);
}

menuToggle.addEventListener("click", (event) => {
  event.stopPropagation();
  syncMobilePanelOffset();
  const isOpen = document.body.classList.toggle("nav-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  mobilePanel.setAttribute("aria-hidden", String(!isOpen));
});

document.querySelectorAll(".mobile-panel a").forEach((link) => {
  link.addEventListener("click", closeMobileMenu);
});

window.addEventListener("scroll", () => {
  if (document.body.classList.contains("nav-open")) closeMobileMenu();
}, { passive: true });

window.addEventListener("resize", () => {
  syncMobilePanelOffset();
  if (document.body.classList.contains("nav-open")) closeMobileMenu();
});

document.querySelector(".search-toggle").addEventListener("click", () => {
  searchInput.focus();
});

loadCatalog();
syncMobilePanelOffset();
