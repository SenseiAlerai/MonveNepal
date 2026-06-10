const products = [
  { name: "MONVE Denim Signature", category: "Signature Denim Bags", color: "Deep indigo", tag: "New Arrival", position: "0% 0%" },
  { name: "Satin Evening Clutch", category: "Clutch Bags", color: "Pearl gray", tag: "Featured", position: "50% 0%" },
  { name: "City Clasp Crossbody", category: "Crossbody Bags", color: "Black gloss", tag: "Compact", position: "100% 0%" },
  { name: "Petite Top Handle", category: "Top Handles Bag", color: "Cranberry", tag: "New Arrival", position: "0% 100%" },
  { name: "Soft Frame Clutch", category: "Clutch Bags", color: "Warm tan", tag: "Classic", position: "50% 100%" },
  { name: "Arc Top Handle", category: "Top Handles Bag", color: "Ivory grain", tag: "Limited", position: "100% 100%" }
];

const grid = document.querySelector(".product-grid");
const filters = document.querySelectorAll(".filter");
const searchInput = document.querySelector("#searchInput");
const menuToggle = document.querySelector(".menu-toggle");
const mobilePanel = document.querySelector(".mobile-panel");
let activeFilter = "All";

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const visibleProducts = products.filter((product) => {
    const matchesFilter = activeFilter === "All" || product.category === activeFilter;
    const matchesSearch = [product.name, product.category, product.color].join(" ").toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  grid.innerHTML = visibleProducts.map((product) => `
    <article class="product-card">
      <div class="product-media">
        <img src="assets/catalog-bags.png" alt="${product.name}" style="object-position: ${product.position}">
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

filters.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filters.forEach((item) => item.classList.toggle("active", item === button));
    renderProducts();
  });
});

document.querySelectorAll("[data-filter]").forEach((link) => {
  link.addEventListener("click", () => {
    const target = [...filters].find((button) => button.dataset.filter === link.dataset.filter);
    target?.click();
  });
});

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

renderProducts();
