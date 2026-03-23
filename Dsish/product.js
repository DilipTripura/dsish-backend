import { PRODUCTS } from "./products.js";

import {
  db,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from "./firebase.js";

// ================= CONFIG =================
const MAX_QTY = 20;

// ================= GET PRODUCT =================
const params = new URLSearchParams(window.location.search);

let productId = params.get("id") || localStorage.getItem("selectedProductId");
productId = Number(productId);

const product = PRODUCTS.find(p => Number(p.id) === productId);

// fail-safe
if (!product) {
  alert("Product not found");
  window.location.href = "index.html";
  throw new Error("Product not found");
}

// store for reload fallback
localStorage.setItem("selectedProductId", product.id);

// ================= STATE =================
let selectedQty = 1;
let selectedWeight = product.weight;

// ================= HELPERS =================
function getDiscount(mrp, price) {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

// ================= PAGE INFO =================
const setText = (id, value) => {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
};

setText("page-title", `${product.name} | Dsish`);
setText("brand-title", product.brand);
setText("product-name", product.name);
setText("product-weight", product.weight); 

// price
const priceBox = document.getElementById("product-price");
if (priceBox) {
  priceBox.innerHTML = `
    <span class="price">₹${product.price.toLocaleString()}</span>
    <span class="mrp">₹${product.mrp.toLocaleString()}</span>
    <span class="discount">${getDiscount(product.mrp, product.price)}% OFF</span>
  `;
}

// ================= PRODUCT SLIDER =================
const sliderContainer = document.getElementById("product-slider");
const sliderDots = document.getElementById("slider-dots");

if (sliderContainer && sliderDots && product.images?.length) {

  sliderContainer.innerHTML = "";
  sliderDots.innerHTML = "";

  let currentSlide = 0;
  let slideTimer;

  function showSlide(index) {
    const slides = sliderContainer.querySelectorAll(".slide");
    const dots = sliderDots.querySelectorAll(".dot");

    slides.forEach((s, i) => s.classList.toggle("active", i === index));
    dots.forEach((d, i) => d.classList.toggle("active", i === index));

    currentSlide = index;
  }

  product.images.forEach((src, index) => {

    const img = document.createElement("img");
    img.src = src;
    img.alt = product.name;
    img.className = "slide";
    if (index === 0) img.classList.add("active");

    sliderContainer.appendChild(img);

    const dot = document.createElement("span");
    dot.className = "dot";
    if (index === 0) dot.classList.add("active");

    dot.addEventListener("click", () => showSlide(index));
    sliderDots.appendChild(dot);
  });

  // auto slide
  function startAutoSlide() {
    slideTimer = setInterval(() => {
      showSlide((currentSlide + 1) % product.images.length);
    }, 5000);
  }

  startAutoSlide();

  // swipe
  let startX = 0;

  sliderContainer.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
    clearInterval(slideTimer);
  });

  sliderContainer.addEventListener("touchend", e => {
    const diff = startX - e.changedTouches[0].clientX;

    if (Math.abs(diff) > 50) {
      const next = diff > 0 ? currentSlide + 1 : currentSlide - 1;
      showSlide((next + product.images.length) % product.images.length);
    }

    startAutoSlide();
  });
}

// ================= QUANTITY =================
const qtyValue = document.getElementById("qty-value");
const minusBtn = document.getElementById("qty-minus");
const plusBtn = document.getElementById("qty-plus");

// restore qty
const savedQty = Number(localStorage.getItem("pendingQty"));
if (savedQty >= 1 && savedQty <= MAX_QTY) {
  selectedQty = savedQty;
}

if (qtyValue) qtyValue.innerText = selectedQty;

// minus
minusBtn?.addEventListener("click", () => {
  if (selectedQty > 1) {
    selectedQty--;
    qtyValue.innerText = selectedQty;
    localStorage.setItem("pendingQty", selectedQty);
  }
});

// plus
plusBtn?.addEventListener("click", () => {
  if (selectedQty < MAX_QTY) {
    selectedQty++;
    qtyValue.innerText = selectedQty;
    localStorage.setItem("pendingQty", selectedQty);
  } else {
    showToast(`Max ${MAX_QTY} items allowed`, true);
  }
});

// ================= TOAST =================
const toast = document.getElementById("cart-toast");
let toastTimer;

function showToast(message, error = false) {
  if (!toast) return;

  toast.querySelector("span").innerText = message;
  toast.classList.toggle("error", error);
  toast.classList.add("visible");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("visible", "error");
  }, 2000);
}

// ================= CART =================
function handleAddToCart() {

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const existing = cart.find(
    item =>
      item.id === product.id &&
      item.weight === selectedWeight
  );

  if (existing) {

    const newQty = existing.qty + selectedQty;

    if (newQty > MAX_QTY) {
      existing.qty = MAX_QTY;
      showToast(`Max ${MAX_QTY} items allowed`, true);
    } else {
      existing.qty = newQty;
    }

  } else {

    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      weight: selectedWeight,
      qty: selectedQty,
      image: product.images?.[0] || ""
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  showToast("Added to cart");

  return true;
}

// ================= BUTTON EVENTS =================
document.getElementById("add-to-cart-btn")?.addEventListener("click", () => {
  if (handleAddToCart()) {

    const productLabel = `${product.name} ${selectedWeight}g`;

showTopToast(`Added ${productLabel} × ${selectedQty} `);

    if (typeof showMobileCartBar === "function") {
      showMobileCartBar();
    }
  }
});

document.getElementById("buy-now-btn")?.addEventListener("click", () => {
  if (handleAddToCart()) {

    showTopToast("Redirecting to checkout ");

    setTimeout(() => {
      window.location.href = "checkout.html";
    }, 800); 

  }
});

// ================= ACCORDION =================
document.querySelectorAll(".accordion").forEach(acc => {

  const header = acc.querySelector(".accordion-header");
  const content = acc.querySelector(".accordion-content");

  header?.addEventListener("click", () => {
    acc.classList.toggle("active");
  });

  if (header?.innerText.includes("Description")) {
    content.innerText = product.description || "";
  }
});

/// TOAST=============================

function showTopToast(message, type = "success") {

  const toast = document.getElementById("top-toast");
  const text = document.getElementById("top-toast-text");

  if (!toast || !text) return;

  text.innerText = message;

  toast.classList.remove("success", "error");
  toast.classList.add(type);

  toast.classList.add("show");

  clearTimeout(toast._timer);

  toast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);

}

////REVIEW

const reviewBtn = document.getElementById("submit-review");

if (reviewBtn) {
  reviewBtn.addEventListener("click", async () => {

  const name =
    document.getElementById("review-name").value || "Anonymous";

  const rating =
    Number(document.getElementById("review-rating").value);

  const text =
    document.getElementById("review-text").value.trim();

  if (!text) {
    showToast("Write something first", true);
    return;
  }

  await addDoc(collection(db, "reviews"), {
    productId: product.id,
    name,
    rating,
    text,
    createdAt: serverTimestamp() // ✅ FIXED
  });

  document.getElementById("review-name").value = "";
  document.getElementById("review-text").value = "";

  showToast("Review added ❤️");

  loadReviews();

});
}

async function loadReviews() {

  const reviewsList = document.getElementById("reviews-list");

  const q = query(
    collection(db, "reviews"),
    where("productId", "==", product.id),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  reviewsList.innerHTML = "";

  if (snapshot.empty) {
    reviewsList.innerHTML =
      `<p style="font-size:13px;color:#777;">No reviews yet</p>`;
    return;
  }

  snapshot.forEach(doc => {

    const r = doc.data();

    const div = document.createElement("div");
    div.className = "review-item";

    div.innerHTML = `
      <div class="review-name">${r.name}</div>
      <div class="review-rating">
        ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}
      </div>
      <div class="review-text">${r.text}</div>
    `;

    reviewsList.appendChild(div);

  });

}

loadReviews();
// ================= ORDER COUNT =================
const ordered = document.getElementById("ordered-last-month");
if (ordered && product.orderedLastMonth) {
  ordered.innerText = `${product.orderedLastMonth} ordered last month`;
}

// ================= VIEWERS =================
const viewing = document.getElementById("viewing-now");

if (viewing) {

  let viewers =
    Number(localStorage.getItem(`viewers_${product.id}`)) ||
    Math.floor(Math.random() * 60) + 20;

  localStorage.setItem(`viewers_${product.id}`, viewers);

  viewing.innerText = `${viewers} people viewing now`;
}

















