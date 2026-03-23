
import { PRODUCTS } from "./products.js";
const MAX_QTY = 20;
// ================= SAFE DOM LOAD =================
window.addEventListener("DOMContentLoaded", () => {

  // ================= NAVBAR =================
  const hamburger = document.getElementById("hamburger");
  const sideMenu = document.getElementById("side-menu");
  const closeMenu = document.getElementById("close-menu");

  const cartIcon = document.getElementById("cart-icon");
  const cartSidebar = document.getElementById("cart-sidebar");
  const closeCart = document.getElementById("close-cart");

  if (hamburger && sideMenu && cartSidebar) {

    hamburger.addEventListener("click", (e) => {
      e.stopPropagation();
      sideMenu.classList.add("active");
      cartSidebar.classList.remove("active");
    });

    closeMenu?.addEventListener("click", () => {
      sideMenu.classList.remove("active");
    });

    cartIcon?.addEventListener("click", (e) => {
      e.stopPropagation();
      cartSidebar.classList.add("active");
      sideMenu.classList.remove("active");

      cartIcon.classList.add("cart-animate");
      setTimeout(() => cartIcon.classList.remove("cart-animate"), 400);
    });

    closeCart?.addEventListener("click", () => {
      cartSidebar.classList.remove("active");
    });

    document.addEventListener("click", (e) => {
      if (!sideMenu.contains(e.target) && !hamburger.contains(e.target)) {
        sideMenu.classList.remove("active");
      }

      if (!cartSidebar.contains(e.target) && !cartIcon.contains(e.target)) {
        cartSidebar.classList.remove("active");
      }
    });

    sideMenu.addEventListener("click", (e) => e.stopPropagation());
    cartSidebar.addEventListener("click", (e) => e.stopPropagation());
  }

  // ================= ELEMENTS =================
  const productGrid = document.getElementById("product-grid");
  const titleEl = document.getElementById("featured-products");
  const clearFilterBtn = document.getElementById("clear-filter-btn");

  const cartItemsContainer = document.getElementById("cart-items");
  const cartTotalEl = document.getElementById("cart-total");
  const cartCountBadge = document.getElementById("cart-count-badge");

  // ================= HELPERS =================
  const params = new URLSearchParams(window.location.search);
  const urlSpecialFilter = params.get("filter");

  function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }

 function updateTitle(category) {
  if (!category || category === "all") {
    titleEl.textContent = "RECOMMENDED FOR YOU";
  } else {
    titleEl.textContent = ""; // 🔥 no text for other categories
  }
}

  function formatCategoryText(category) {
    return category
      .replace(/-/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  // ================= STATE =================
  let activeCategoryFilter = "all";

  // ================= CARD =================
function createFeedCard(product) {

  const card = document.createElement("div");
  card.className = "feed-card";

  card.innerHTML = `
    <div class="feed-frame">

      <div class="feed-img-wrap">
        <img src="${product.thumbnail}" alt="${product.name}">

        <span class="feed-tag">${product.tag}</span>
        <span class="feed-weight">${product.weight}</span>
      </div>

      <div class="feed-bottom">
        <div class="feed-name">${product.name}</div>

        <div class="feed-price-wrap">
          <span class="feed-price">₹${product.price}</span>
          <span class="feed-mrp">₹${product.mrp}</span>
        </div>
      </div>

    </div>
  `;

  card.addEventListener("click", () => {
    localStorage.setItem("selectedProductId", product.id);
    window.location.href = `product.html?id=${product.id}`;
  });

  return card;
}

  // ================= RENDER PRODUCTS =================
  function renderProducts() {
    if (!productGrid) return;

    productGrid.innerHTML = "";
    let filtered = [...PRODUCTS];

    // FILTER
    if (activeCategoryFilter !== "all") {
      filtered = filtered.filter(
        p => p.category.toLowerCase().trim() === activeCategoryFilter.toLowerCase().trim()
      );
    }

    // EMPTY
    const noProducts = document.getElementById("no-products");
    if (filtered.length === 0) {
      noProducts.style.display = "block";
      return;
    } else {
      noProducts.style.display = "none";
    }

    // ALL MODE
    if (activeCategoryFilter === "all") {
      filtered = shuffle(filtered);
      updateTitle("all");

      filtered.forEach((product, index) => {
        const card = createFeedCard(product);
        productGrid.appendChild(card);

        if (index !== filtered.length - 1) {
          const hr = document.createElement("hr");
          hr.className = "feed-divider-line";
          productGrid.appendChild(hr);
        }
      });
    }

    // CATEGORY MODE
    else {
      updateTitle(activeCategoryFilter);

      const divider = document.createElement("div");
      divider.className = "feed-divider";
      divider.innerText = formatCategoryText(activeCategoryFilter);
      productGrid.appendChild(divider);

      filtered.forEach((product, index) => {
        const card = createFeedCard(product);
        productGrid.appendChild(card);

        if (index !== filtered.length - 1) {
          const hr = document.createElement("hr");
          hr.className = "feed-divider-line";
          productGrid.appendChild(hr);
        }
      });
    }

    // BUTTON
    if (clearFilterBtn) {
      clearFilterBtn.style.display =
        activeCategoryFilter !== "all" ? "inline-block" : "none";
    }
  }

  // ================= CATEGORY CLICK =================
  document.querySelectorAll(".cat").forEach(cat => {
    cat.addEventListener("click", () => {

      document.querySelectorAll(".cat").forEach(c => c.classList.remove("active"));
      cat.classList.add("active");

      activeCategoryFilter = cat.dataset.category || "all";
      renderProducts();

      document.querySelector(".products")?.scrollIntoView({
        behavior: "smooth"
      });
    });
  });

  // ================= CLEAR FILTER =================
  clearFilterBtn?.addEventListener("click", () => {
    activeCategoryFilter = "all";

    document.querySelectorAll(".cat").forEach(c => c.classList.remove("active"));
    document.querySelector('.cat[data-category="all"]')?.classList.add("active");

    updateTitle("all");
    renderProducts();
  });

  // ================= CART =================
  function renderCart() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    cartItemsContainer.innerHTML = "";

    let total = 0;

    cart.forEach((item, idx) => {
      total += item.price * item.qty;

      const div = document.createElement("div");
      div.className = "cart-item";

     div.innerHTML = `
  <img src="${item.image}" class="cart-item-img">

  <div class="cart-item-info">

    <div class="cart-item-top">
      <div class="cart-item-name">${item.name}</div>
      <div class="remove-item">Remove</div>
    </div>

    <div class="cart-item-meta">
      <span class="cart-item-weight">${item.weight} Pack</span>
      <span class="cart-item-price">₹${item.price}</span>
    </div>

    <div class="cart-item-bottom">

      <div class="qty-control">
        <button class="qty-btn minus">−</button>
        <span class="qty-value">${item.qty}</span>
        <button class="qty-btn plus">+</button>
      </div>

      <div class="cart-item-total">
        ₹${item.price * item.qty}
      </div>

    </div>

  </div>
`;

      div.querySelector(".minus").onclick = () => {
        if (item.qty > 1) item.qty--;
        else cart.splice(idx, 1);
        localStorage.setItem("cart", JSON.stringify(cart));
        renderCart();
      };

      div.querySelector(".plus").onclick = () => {
        if (item.qty < MAX_QTY) {
                     item.qty++;
                                  }
        localStorage.setItem("cart", JSON.stringify(cart));
        renderCart();
      };

      div.querySelector(".remove-item").onclick = () => {
        cart.splice(idx, 1);
        localStorage.setItem("cart", JSON.stringify(cart));
        renderCart();
      };

      cartItemsContainer.appendChild(div);
    });

    cartTotalEl.innerText = total.toLocaleString();

    const count = cart.reduce((sum, i) => sum + i.qty, 0);
    cartCountBadge.innerText = count;
    cartCountBadge.style.display = count ? "inline-block" : "none";
  }

  const checkoutBtn = document.getElementById("checkout-btn");

checkoutBtn.addEventListener("click", () => {

  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (!cart.length) {
    alert("Cart is empty");
    return;
  }

  // optional: track source (you already use this)
  localStorage.setItem("checkoutSource", "cart");

  window.location.href = "checkout.html";

});

  // ================= HERO SLIDER =================
  const slides = document.querySelectorAll(".hero-slider .slide");
  let currentSlide = 0;

  function showSlide(i) {
    slides.forEach((s, idx) => s.classList.toggle("active", idx === i));
    currentSlide = i;
  }

  setInterval(() => {
    const next = (currentSlide + 1) % slides.length;
    showSlide(next);
  }, 5000);

  // ================= INIT =================
  updateTitle("all");
  renderProducts();
  renderCart();

  window.addEventListener("storage", () => {
    renderProducts();
    renderCart();
  });

});













































